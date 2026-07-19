import { useEffect, useMemo, useState } from 'react'
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
import { useEditReadOnly } from '../hooks/useEditReadOnly'
import { useDashboardViewPreferences } from '../contexts/DashboardViewPreferencesContext'
import { useMonthlyCostGroupCollapse } from '../hooks/useMonthlyCostGroupCollapse'
import { flattenMonthlyCostTree, type MonthlyCostDisplayNode } from '../utils/monthlyCostGrouping'
import { sortAccruingRowsByNextDue } from '../utils/accruingOrder'
import { monthlyCostEditableCellIds, useSheetCellNavigation } from '../utils/sheetCellNavigation'
import { HelpButton } from './HelpButton'
import { WIDGET_HELP } from '../content/livingDashboard'
import { ordinalDay, ReadOnlyCell, SheetDragHeader, DailyAccrualCell } from './committed/shared'
import { MonthlyCostRows } from './committed/MonthlyCostRows'
import { MonthlyCostPeriodView } from './committed/MonthlyCostPeriodView'
import { PlatformSheetTable, PlatformSheetWrap, ResizableSheetHeader } from './PlatformSheetWrap'
import { committedMonthlyColumnsForMode } from '../utils/sheetColumnSpecs'
import { getCommitmentDueOccurrences, getAccruingRowDailyRate } from '../utils/commitmentCalculations'
import { ConfirmDialog } from './ConfirmDialog'
import { CompactKpiStrip } from './CompactKpiStrip'
import { MobileAccruingList } from './mobile/MobileAccruingList'
import { AddMonthlyCostModal } from './mobile/AddRecordModals'

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
  const editReadOnly = useEditReadOnly()
  const { useCards, accruingOrderMode, setAccruingOrderMode } = useDashboardViewPreferences()
  const [viewMode, setViewMode] = useState<AccruingViewMode>('list')
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [highlightRowId, setHighlightRowId] = useState<string | null>(null)
  const [pendingDueDayChange, setPendingDueDayChange] = useState<{
    commitmentId: string
    dueDayOfMonth: number
    dismissedPeriods: string[]
    preservedPeriodsOnKeep: string[]
    preservedPeriodsOnRemove: string[]
    message: string
  } | null>(null)

  useEffect(() => {
    const handler = (e: Event) => {
      const mode = (e as CustomEvent).detail as AccruingViewMode
      if (mode) setViewMode(mode)
    }
    window.addEventListener('tb-set-accruing-view', handler)
    return () => window.removeEventListener('tb-set-accruing-view', handler)
  }, [])
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
    displayTree: groupedDisplayTree,
    collapsedGroups,
    toggleGroup,
    expandAllGroups,
    collapseAllGroups,
    hasGroups,
    allExpanded,
  } = useMonthlyCostGroupCollapse(state, monthlyCommitmentRows, viewScope)

  const timelineDisplayTree = useMemo<MonthlyCostDisplayNode[]>(
    () => sortAccruingRowsByNextDue(simulatorRows).map((row) => ({ type: 'leaf', row })),
    [simulatorRows],
  )

  const displayTree =
    accruingOrderMode === 'timeline' ? timelineDisplayTree : groupedDisplayTree
  const sheetRows =
    accruingOrderMode === 'timeline' ? simulatorRows : monthlyCommitmentRows
  const effectiveHasGroups = accruingOrderMode === 'grouped' && hasGroups
  const effectiveCollapsed =
    accruingOrderMode === 'timeline' ? new Set<string>() : collapsedGroups

  const flatRows = useMemo(
    () => flattenMonthlyCostTree(displayTree, effectiveCollapsed),
    [displayTree, effectiveCollapsed],
  )
  const orderedCellIds = useMemo(() => monthlyCostEditableCellIds(flatRows), [flatRows])
  const { activeCell, activate, deactivate, makeTabHandler } = useSheetCellNavigation(orderedCellIds)

  const addMonthlyRow = () => {
    if (useCards) {
      setAddModalOpen(true)
      return
    }
    const { scopeLevel, scopeId } = getDefaultCommitmentScope(state, viewScope)
    const id = actions.addCommitment({
      name: 'New monthly cost',
      schedule: 'monthly',
      amount: 0,
      dueDayOfMonth: 28,
      scopeLevel,
      scopeId,
      status: 'healthy',
    })
    if (id) {
      setHighlightRowId(id)
      activate(`${id}-name`)
    }
  }

  const handleActivate = (cellId: string) => {
    if (highlightRowId && cellId.startsWith(highlightRowId)) setHighlightRowId(null)
    activate(cellId)
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
      <div className="mobile-accruing-sticky">
        <div className="card-head card-head-compact card-head--accruing card-head--widget-bar">
          <div className="card-head-toolbar">
            {!editReadOnly && viewMode === 'list' ? (
              <button type="button" className="btn-primary btn-widget-add" onClick={addMonthlyRow}>
                + Add
              </button>
            ) : (
              <span className="card-head-toolbar-spacer" aria-hidden />
            )}
            <h2>Monthly accruing</h2>
            <HelpButton
              id="commitments"
              openHelp={openHelp}
              setOpenHelp={setOpenHelp}
              text={WIDGET_HELP.committedFunds}
            />
          </div>
          <p className="muted card-lead-compact card-lead-compact--below">
            Regular predictable bills — rent, payroll, subscriptions, direct debits
          </p>
          <div className="card-head-actions" data-tour="committed-views">
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
            {viewMode === 'list' && (
              <div className="view-mode-toggle" role="group" aria-label="Monthly cost order">
                <button
                  type="button"
                  className={`view-mode-toggle-btn${accruingOrderMode === 'grouped' ? ' view-mode-toggle-btn--active' : ''}`}
                  onClick={() => setAccruingOrderMode('grouped')}
                  title="Your arranged order, with matching names grouped"
                >
                  Grouped
                </button>
                <button
                  type="button"
                  className={`view-mode-toggle-btn${accruingOrderMode === 'timeline' ? ' view-mode-toggle-btn--active' : ''}`}
                  onClick={() => setAccruingOrderMode('timeline')}
                  title="Next due date first — same as the mobile app"
                >
                  Timeline
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="card-kpi-bar">
          <CompactKpiStrip
            items={[
              { label: 'Monthly total', value: formatCurrency(monthlyTotal) },
              { label: 'Accrued now', value: formatCurrency(accruingNow), emphasis: true },
              { label: 'Per day', value: formatCurrency(dailyTotal) },
            ]}
          />
        </div>
      </div>

      <div className="card-scroll-body">
        {viewMode === 'period' ? (
          <MonthlyCostPeriodView rows={simulatorRows} compact />
        ) : (
          <div className="sheet-section sheet-section-compact">
            {!useCards && (
              <div className="sheet-section-head">
                <h3>Monthly costs</h3>
                <div className="sheet-section-actions">
                  {effectiveHasGroups && (
                    <button
                      type="button"
                      className="btn-ghost btn-tiny"
                      onClick={allExpanded ? collapseAllGroups : expandAllGroups}
                    >
                      {allExpanded ? 'Collapse all' : 'Expand all'}
                    </button>
                  )}
                  {!editReadOnly && !useCards && (
                    <button type="button" className="btn-secondary btn-tiny" onClick={addMonthlyRow}>
                      + Add
                    </button>
                  )}
                </div>
              </div>
            )}
            {!hasRows ? (
              <p className="muted">No monthly costs yet.</p>
            ) : useCards ? (
              <MobileAccruingList
                  state={state}
                  viewScope={viewScope}
                  commitmentViews={commitmentViews}
                  orderMode={accruingOrderMode}
                  onSaveCommitment={(id, patch) => actions.updateCommitment(id, patch)}
                  onSaveDueDay={saveMonthlyDueDay}
                  onDuplicateCommitment={(id) => actions.duplicateCommitment(id)}
                  onDeleteCommitment={(id) => actions.deleteCommitment(id)}
                />
            ) : (
              <PlatformSheetWrap
                storageKey={editReadOnly ? 'committed-monthly-readonly' : 'committed-monthly'}
                columns={committedMonthlyColumnsForMode(editReadOnly)}
              >
                {({ widths, startResize, prefClasses }) => (
                  <PlatformSheetTable widths={widths} preferenceClasses={prefClasses}>
                    <thead>
                      <tr>
                        {!editReadOnly && <SheetDragHeader />}
                        <ResizableSheetHeader columnIndex={editReadOnly ? 0 : 1} onResizeStart={startResize}>
                          Name
                        </ResizableSheetHeader>
                        <ResizableSheetHeader
                          columnIndex={editReadOnly ? 1 : 2}
                          onResizeStart={startResize}
                          className="committed-scope-col"
                        >
                          Applies to
                        </ResizableSheetHeader>
                        <ResizableSheetHeader columnIndex={editReadOnly ? 2 : 3} onResizeStart={startResize}>
                          Due day
                        </ResizableSheetHeader>
                        <ResizableSheetHeader
                          columnIndex={editReadOnly ? 3 : 4}
                          onResizeStart={startResize}
                          className="sheet-num"
                        >
                          Monthly
                        </ResizableSheetHeader>
                        <ResizableSheetHeader
                          columnIndex={editReadOnly ? 4 : 5}
                          onResizeStart={startResize}
                          className="sheet-num sheet-col-emphasis"
                        >
                          Accrued
                        </ResizableSheetHeader>
                        <ResizableSheetHeader
                          columnIndex={editReadOnly ? 5 : 6}
                          onResizeStart={startResize}
                          className="sheet-num"
                        >
                          Per day
                        </ResizableSheetHeader>
                        {!editReadOnly && (
                        <ResizableSheetHeader columnIndex={7} onResizeStart={startResize} className="sheet-actions" />
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      <MonthlyCostRows
                        state={state}
                        rows={sheetRows}
                        displayTree={displayTree}
                        collapsedGroups={effectiveCollapsed}
                        onToggleGroup={toggleGroup}
                        scopeOptions={options}
                        activeCell={activeCell}
                        highlightRowId={highlightRowId}
                        onActivate={(id) => {
                          if (!editReadOnly) handleActivate(id)
                        }}
                        onDeactivate={deactivate}
                        makeTabHandler={makeTabHandler}
                        onSaveDueDay={saveMonthlyDueDay}
                        actions={actions}
                        readOnly={editReadOnly}
                      />
                      {accruingOrderMode === 'grouped' &&
                        reserveAccrualRows.map((row) => {
                        const { commitment: item, accruedAmount } = row
                        return (
                          <tr key={item.id} className="sheet-row-computed sheet-row--reserve">
                            {!editReadOnly && <td className="sheet-drag-col sheet-cell--reserve" />}
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
                            {!editReadOnly && (
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
                            )}
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
      {addModalOpen ? (
        <AddMonthlyCostModal
          state={state}
          viewScope={viewScope}
          onClose={() => setAddModalOpen(false)}
          onSave={(payload) => {
            actions.addCommitment({
              name: payload.name,
              schedule: 'monthly',
              amount: payload.amount,
              dueDayOfMonth: payload.dueDayOfMonth,
              scopeLevel: payload.scopeLevel,
              scopeId: payload.scopeId,
              status: 'healthy',
            })
            setAddModalOpen(false)
          }}
        />
      ) : null}
    </section>
  )
}

