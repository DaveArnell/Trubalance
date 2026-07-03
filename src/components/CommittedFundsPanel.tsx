import { useMemo, useState } from 'react'
import type { AppState, Commitment, CommitmentViews, ViewScope } from '../types'
import {
  getScopeItemLabel,
  getCommitmentScopeOptionsForView,
  getDefaultCommitmentScope,
  filterAccruingRowsForView,
} from '../utils/scope'
import { formatCurrency } from '../utils/format'
import { getReserveAccrualTooltip } from '../utils/reserveCalculations'
import type { AppActions } from '../hooks/useAppState'
import { useMonthlyCostGroupCollapse } from '../hooks/useMonthlyCostGroupCollapse'
import { flattenMonthlyCostTree } from '../utils/monthlyCostGrouping'
import { monthlyCostEditableCellIds, useSheetCellNavigation } from '../utils/sheetCellNavigation'
import { HelpButton } from './HelpButton'
import { WIDGET_HELP } from '../content/livingDashboard'
import { ordinalDay, ReadOnlyCell, SheetDragHeader, DailyAccrualCell } from './committed/shared'
import { MonthlyCostRows } from './committed/MonthlyCostRows'
import { MonthlyCostPeriodView } from './committed/MonthlyCostPeriodView'
import { PlatformSheetTable, PlatformSheetWrap, ResizableSheetHeader } from './PlatformSheetWrap'
import { COMMITTED_MONTHLY_COLUMNS } from '../utils/sheetColumnSpecs'
import { getCommitmentDueOccurrences, getAccruingRowDailyRate } from '../utils/commitmentCalculations'
import { ConfirmDialog } from './ConfirmDialog'

type AccruingViewMode = 'list' | 'period'

interface CommittedFundsPanelProps {
  state: AppState
  viewScope: ViewScope
  commitmentViews: CommitmentViews
  actions: Pick<
    AppActions,
    | 'addCommitment'
    | 'updateCommitment'
    | 'deleteCommitment'
    | 'duplicateCommitment'
    | 'reorderCommitments'
    | 'acknowledgeCommitmentDueAlert'
  >
  openHelp: string | null
  setOpenHelp: (id: string | null) => void
}

export function CommittedFundsPanel({
  state,
  viewScope,
  commitmentViews,
  actions,
  openHelp,
  setOpenHelp,
}: CommittedFundsPanelProps) {
  const [viewMode, setViewMode] = useState<AccruingViewMode>('list')
  const [pendingDueDayChange, setPendingDueDayChange] = useState<{
    commitmentId: string
    dueDayOfMonth: number
    dismissedPeriods: string[]
    preservedPeriodsOnKeep: string[]
    preservedPeriodsOnRemove: string[]
    message: string
  } | null>(null)
  const options = getCommitmentScopeOptionsForView(state, viewScope)

  const monthlyCommitmentRows = useMemo(
    () =>
      filterAccruingRowsForView(
        commitmentViews.buildingUp.filter((row) => row.source !== 'reserve'),
        viewScope,
      ),
    [commitmentViews.buildingUp, viewScope],
  )
  const reserveAccrualRows = useMemo(
    () =>
      filterAccruingRowsForView(
        commitmentViews.buildingUp.filter((row) => row.source === 'reserve'),
        viewScope,
      ),
    [commitmentViews.buildingUp, viewScope],
  )
  const simulatorRows = useMemo(
    () => [...monthlyCommitmentRows, ...reserveAccrualRows],
    [monthlyCommitmentRows, reserveAccrualRows],
  )

  const accruingNow = useMemo(
    () => simulatorRows.reduce((sum, row) => sum + row.accruedAmount, 0),
    [simulatorRows],
  )
  const monthlyTotal = useMemo(
    () =>
      monthlyCommitmentRows.reduce((sum, row) => sum + row.commitment.amount, 0) +
      reserveAccrualRows.reduce((sum, row) => sum + row.commitment.amount, 0),
    [monthlyCommitmentRows, reserveAccrualRows],
  )
  const dailyTotal = useMemo(
    () => simulatorRows.reduce((sum, row) => sum + getAccruingRowDailyRate(row), 0),
    [simulatorRows],
  )

  const {
    displayTree,
    collapsedGroups,
    toggleGroup,
    expandAllGroups,
    collapseAllGroups,
    hasGroups,
    allExpanded,
  } = useMonthlyCostGroupCollapse(state, monthlyCommitmentRows, viewScope)

  const flatRows = useMemo(
    () => flattenMonthlyCostTree(displayTree, collapsedGroups),
    [displayTree, collapsedGroups],
  )
  const orderedCellIds = useMemo(() => monthlyCostEditableCellIds(flatRows), [flatRows])
  const { activeCell, activate, deactivate, makeTabHandler } = useSheetCellNavigation(orderedCellIds)

  const addMonthlyRow = () => {
    const { scopeLevel, scopeId } = getDefaultCommitmentScope(state, viewScope)
    actions.addCommitment({
      name: 'New monthly cost',
      schedule: 'monthly',
      amount: 0,
      dueDayOfMonth: 28,
      scopeLevel,
      scopeId,
      status: 'healthy',
    })
  }

  const saveMonthlyDueDay = (commitment: Commitment, dueDayOfMonth: number) => {
    const currentDueDay = commitment.dueDayOfMonth ?? 28
    if (currentDueDay === dueDayOfMonth) return

    const before = getCommitmentDueOccurrences(commitment)
    const after = getCommitmentDueOccurrences({ ...commitment, dueDayOfMonth })
    const removed = before.filter((occurrence) => !after.some((entry) => entry.period === occurrence.period))
    const added = after.filter((occurrence) => !before.some((entry) => entry.period === occurrence.period))
    const removedPeriods = removed.map((entry) => entry.period)

    const dismissed = new Set(commitment.dismissedDuePeriods ?? [])
    for (const occurrence of added) dismissed.add(occurrence.period)
    const dismissedPeriods = [...dismissed]
    const preservedBase = new Set(commitment.preservedDuePeriods ?? [])
    const preservedPeriodsOnKeep = [...new Set([...preservedBase, ...removedPeriods])]
    const preservedPeriodsOnRemove = [...preservedBase].filter((period) => !removedPeriods.includes(period))

    if (removed.length > 0) {
      const removedTotal = removed.reduce((sum, entry) => sum + entry.amount, 0)
      const removedMonths = removed.map((entry) => entry.month).join(', ')
      const entryLabel = removed.length === 1 ? 'entry' : 'entries'
      setPendingDueDayChange({
        commitmentId: commitment.id,
        dueDayOfMonth,
        dismissedPeriods,
        preservedPeriodsOnKeep,
        preservedPeriodsOnRemove,
        message: `Changing due day to ${ordinalDay(dueDayOfMonth)} removes ${removed.length} due ${entryLabel} from Due (${removedMonths}) worth ${formatCurrency(removedTotal)}. Remove the previous-date due ${entryLabel}?`,
      })
      return
    }

    actions.updateCommitment(commitment.id, {
      dueDayOfMonth,
      dismissedDuePeriods: dismissedPeriods,
      preservedDuePeriods: commitment.preservedDuePeriods,
    })
  }

  const hasRows = simulatorRows.length > 0

  return (
    <section id="committed-funds" className="card widget-compact card-scroll">
      {pendingDueDayChange && (
        <ConfirmDialog
          title="Update due day?"
          message={pendingDueDayChange.message}
          confirmLabel="Yes, remove old due entry"
          cancelLabel="No, keep existing due"
          onCancel={() => {
            actions.updateCommitment(pendingDueDayChange.commitmentId, {
              dueDayOfMonth: pendingDueDayChange.dueDayOfMonth,
              dismissedDuePeriods: pendingDueDayChange.dismissedPeriods,
              preservedDuePeriods: pendingDueDayChange.preservedPeriodsOnKeep,
            })
            setPendingDueDayChange(null)
          }}
          onConfirm={() => {
            actions.updateCommitment(pendingDueDayChange.commitmentId, {
              dueDayOfMonth: pendingDueDayChange.dueDayOfMonth,
              dismissedDuePeriods: pendingDueDayChange.dismissedPeriods,
              preservedDuePeriods: pendingDueDayChange.preservedPeriodsOnRemove,
            })
            setPendingDueDayChange(null)
          }}
        />
      )}
      <div className="card-head card-head-compact">
        <div>
          <h2>Monthly accruing</h2>
        </div>
        <div className="card-head-actions">
          <div className="view-mode-toggle" role="group" aria-label="Monthly accruing view">
            <button
              type="button"
              className={`view-mode-toggle-btn${viewMode === 'list' ? ' view-mode-toggle-btn--active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              Costs
            </button>
            <button
              type="button"
              className={`view-mode-toggle-btn${viewMode === 'period' ? ' view-mode-toggle-btn--active' : ''}`}
              disabled={!hasRows}
              onClick={() => setViewMode('period')}
            >
              Month view
            </button>
          </div>
          <HelpButton
            id="commitments"
            openHelp={openHelp}
            setOpenHelp={setOpenHelp}
            text={WIDGET_HELP.committedFunds}
          />
        </div>
      </div>

      <div className="card-scroll-body">
        <table className="kpi-table kpi-table--summary committed-funds-summary committed-funds-summary--accruing">
          <thead>
            <tr>
              <th className="col-amount col-amount--side">Monthly total</th>
              <th className="col-amount col-amount--primary">Accrued now</th>
              <th className="col-amount col-amount--side">Per day</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="col-amount col-amount--side kpi-secondary">{formatCurrency(monthlyTotal)}</td>
              <td className="col-amount col-amount--primary kpi-primary">{formatCurrency(accruingNow)}</td>
              <td className="col-amount col-amount--side kpi-secondary">{formatCurrency(dailyTotal)}</td>
            </tr>
          </tbody>
        </table>

        {viewMode === 'period' ? (
          <MonthlyCostPeriodView rows={simulatorRows} compact />
        ) : (
          <div className="sheet-section sheet-section-compact">
            <div className="sheet-section-head">
              <h3>Monthly costs</h3>
              <div className="sheet-section-actions">
                {hasGroups && (
                  <button
                    type="button"
                    className="btn-ghost btn-tiny"
                    onClick={allExpanded ? collapseAllGroups : expandAllGroups}
                  >
                    {allExpanded ? 'Collapse all' : 'Expand all'}
                  </button>
                )}
                <button type="button" className="btn-secondary btn-tiny" onClick={addMonthlyRow}>
                  + Add
                </button>
              </div>
            </div>
            {!hasRows ? (
              <p className="muted">No monthly costs yet.</p>
            ) : (
              <PlatformSheetWrap storageKey="committed-monthly" columns={COMMITTED_MONTHLY_COLUMNS}>
                {({ widths, startResize, prefClasses }) => (
                  <PlatformSheetTable widths={widths} preferenceClasses={prefClasses}>
                    <thead>
                      <tr>
                        <SheetDragHeader />
                        <ResizableSheetHeader columnIndex={1} onResizeStart={startResize}>
                          Name
                        </ResizableSheetHeader>
                        <ResizableSheetHeader
                          columnIndex={2}
                          onResizeStart={startResize}
                          className="committed-scope-col"
                        >
                          Applies to
                        </ResizableSheetHeader>
                        <ResizableSheetHeader columnIndex={3} onResizeStart={startResize}>
                          Due day
                        </ResizableSheetHeader>
                        <ResizableSheetHeader columnIndex={4} onResizeStart={startResize} className="sheet-num">
                          Monthly
                        </ResizableSheetHeader>
                        <ResizableSheetHeader
                          columnIndex={5}
                          onResizeStart={startResize}
                          className="sheet-num sheet-col-emphasis"
                        >
                          Accrued
                        </ResizableSheetHeader>
                        <ResizableSheetHeader columnIndex={6} onResizeStart={startResize} className="sheet-num">
                          Per day
                        </ResizableSheetHeader>
                        <ResizableSheetHeader columnIndex={7} onResizeStart={startResize} className="sheet-actions" />
                      </tr>
                    </thead>
                    <tbody>
                      <MonthlyCostRows
                        state={state}
                        rows={monthlyCommitmentRows}
                        displayTree={displayTree}
                        collapsedGroups={collapsedGroups}
                        onToggleGroup={toggleGroup}
                        scopeOptions={options}
                        activeCell={activeCell}
                        onActivate={activate}
                        onDeactivate={deactivate}
                        makeTabHandler={makeTabHandler}
                        onSaveDueDay={saveMonthlyDueDay}
                        actions={actions}
                      />
                      {reserveAccrualRows.map((row) => {
                        const { commitment: item, accruedAmount } = row
                        return (
                          <tr key={item.id} className="sheet-row-computed sheet-row--reserve">
                            <td className="sheet-drag-col sheet-cell--reserve" />
                            <td
                              className="sheet-cell-readonly sheet-cell--reserve"
                              title="Edit in Reserve Planner"
                            >
                              <span className="sheet-cell-value">{item.name}</span>
                            </td>
                            <td className="committed-scope-col sheet-row-label sheet-cell--reserve">
                              {getScopeItemLabel(state, item.scopeLevel, item.scopeId)}
                            </td>
                            <ReadOnlyCell
                              className="sheet-num sheet-cell--reserve"
                              title="Accrues through the calendar month"
                            >
                              {ordinalDay(item.dueDayOfMonth ?? 28)}
                            </ReadOnlyCell>
                            <ReadOnlyCell className="sheet-num sheet-cell--reserve">
                              {formatCurrency(item.amount)}
                            </ReadOnlyCell>
                            <td className="sheet-num sheet-cell-computed sheet-cell--reserve sheet-col-emphasis">
                              <span title={getReserveAccrualTooltip()}>
                                {formatCurrency(accruedAmount)}
                              </span>
                            </td>
                            <td className="sheet-num sheet-cell-computed sheet-cell--reserve">
                              <DailyAccrualCell row={row} />
                            </td>
                            <td className="sheet-actions">
                              <a
                                className="btn-ghost btn-tiny"
                                href={
                                  row.reservePlannerId
                                    ? `#reserve-planner/${row.reservePlannerId}`
                                    : '#reserve-planner'
                                }
                                title="Open Reserve Planner"
                              >
                                Plan
                              </a>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </PlatformSheetTable>
                )}
              </PlatformSheetWrap>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
