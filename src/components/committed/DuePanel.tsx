import { useMemo, useState, Fragment } from 'react'
import type { AppState, Commitment, CommitmentViews, PlannedFundingMethod, ScopeLevel, ViewScope } from '../../types'
import { useEditReadOnly } from '../../hooks/useEditReadOnly'
import { useDashboardViewPreferences } from '../../contexts/DashboardViewPreferencesContext'
import { getCommitmentScopeOptionsForView, getDefaultCommitmentScope, getReserveBillScopeOptionsForView } from '../../utils/scope'
import {
  buildDueRowSections,
  formatDueRowTiming,
  formatRolledDueTooltip,
  getCommitmentDueOccurrences,
  getDueRowKind,
  isReserveTransferDueRow,
  sumDueRowDisplayAmounts,
} from '../../utils/commitmentCalculations'
import {
  billAmountInMonth,
  buildReserveDueAmountOverridePatch,
  monthDueDaysFromPatch,
} from '../../utils/reserveCalculations'
import {
  formatPlannedFundingStats,
  getPlannedFundingLabel,
  getPlannedFundingTooltip,
  plannedCommitmentReadyForFunding,
} from '../../utils/plannedFunding'
import { formatCurrency } from '../../utils/format'
import { DUE_COLUMNS } from '../../utils/sheetColumnSpecs'
import { todayDateKey } from '../../utils/snapshots'
import type { AppActions } from '../../hooks/useAppState'
import { useSheetRowReorder } from '../../hooks/useSheetRowReorder'
import { dueEditableCellIds, useSheetCellNavigation } from '../../utils/sheetCellNavigation'
import { HelpButton } from '../HelpButton'
import { WIDGET_HELP } from '../../content/livingDashboard'
import {
  buildPlannedFundingDraft,
  PlannedFundingModal,
  shouldPromptPlannedFunding,
  type PlannedFundingDraft,
} from '../PlannedFundingModal'
import { ConfirmDialog } from '../ConfirmDialog'
import { PlatformSheetTable, PlatformSheetWrap, ResizableSheetHeader } from '../PlatformSheetWrap'
import {
  InlineDueTimingCell,
  InlineNumberCell,
  InlinePlannedDueCell,
  InlineTextCell,
  ScopeSelectCell,
} from '../SheetInlineCells'
import { DuplicateRowButton, DueStatusDot, SheetDragCell, SheetDragHeader, ordinalDay } from './shared'
import { MarkPaidConfirmButton } from './MarkPaidConfirmModal'
import { MobileDueList } from '../mobile/MobileDueList'
import { getCommitmentPayoffExpectedTotal } from '../../utils/commitmentCalculations'

interface DuePanelProps {
  state: AppState
  viewScope: ViewScope
  commitmentViews: CommitmentViews
  actions: Pick<
    AppActions,
    | 'addCommitment'
    | 'updateCommitment'
    | 'updateCommitmentDuePeriodAmount'
    | 'updateReserveBill'
    | 'markCommitmentPaid'
    | 'dismissCommitmentDue'
    | 'acknowledgeCommitmentDueAlert'
    | 'acknowledgeReserveBillDueAlert'
    | 'deleteCommitment'
    | 'duplicateCommitment'
    | 'markReserveBillPaid'
    | 'dismissReserveBillDue'
    | 'duplicateReserveBill'
    | 'reorderDueRows'
  >
  openHelp: string | null
  setOpenHelp: (id: string | null) => void
  onOpenReservePlanner?: (plannerId: string) => void
}

export function DuePanel({
  state,
  viewScope,
  commitmentViews,
  actions,
  openHelp,
  setOpenHelp,
  onOpenReservePlanner,
}: DuePanelProps) {
  const editReadOnly = useEditReadOnly()
  const { useCards } = useDashboardViewPreferences()
  const [fundingDraft, setFundingDraft] = useState<PlannedFundingDraft | null>(null)
  const [pendingPlannedPatch, setPendingPlannedPatch] = useState<{
    id: string
    patch: Partial<Commitment>
  } | null>(null)
  const [pendingDueDayChange, setPendingDueDayChange] = useState<{
    commitmentId: string
    dueDayOfMonth: number
    dismissedPeriods: string[]
    preservedPeriodsOnKeep: string[]
    preservedPeriodsOnRemove: string[]
    message: string
  } | null>(null)
  const options = getCommitmentScopeOptionsForView(state, viewScope)

  const dueSections = useMemo(
    () => buildDueRowSections(commitmentViews.due),
    [commitmentViews.due],
  )

  const dueTotal = useMemo(
    () => sumDueRowDisplayAmounts(commitmentViews.due),
    [commitmentViews.due],
  )

  const visibleDueRows = useMemo(
    () => dueSections.flatMap((section) => section.rows),
    [dueSections],
  )
  const dueRowIds = useMemo(() => visibleDueRows.map((row) => row.id), [visibleDueRows])
  const orderedCellIds = useMemo(() => dueEditableCellIds(visibleDueRows), [visibleDueRows])
  const { activeCell, activate, deactivate, makeTabHandler } = useSheetCellNavigation(orderedCellIds)
  const tryActivate = (cellId: string) => {
    if (!editReadOnly) activate(cellId)
  }
  const dueReorder = useSheetRowReorder(dueRowIds, (orderedIds) => {
    const items = orderedIds.map((id) => {
      const row = commitmentViews.due.find((entry) => entry.id === id)!
      if (row.source === 'reserve' && row.reservePlannerId && row.reserveBillId) {
        return { reservePlannerId: row.reservePlannerId, reserveBillId: row.reserveBillId }
      }
      return { commitmentId: row.commitment.id }
    })
    actions.reorderDueRows(items)
  })

  const applyPlannedPatch = (id: string, patch: Partial<Commitment>) => {
    actions.updateCommitment(id, patch)
  }

  const savePlannedField = (commitment: Commitment, patch: Partial<Commitment>) => {
    if (shouldPromptPlannedFunding(commitment, patch)) {
      const draft = buildPlannedFundingDraft(commitment, patch)
      if (draft) {
        setPendingPlannedPatch({ id: commitment.id, patch })
        setFundingDraft(draft)
        deactivate()
        return
      }
    }
    applyPlannedPatch(commitment.id, patch)
  }

  const openFundingEditor = (commitment: Commitment) => {
    if (!plannedCommitmentReadyForFunding(commitment)) return
    const draft = buildPlannedFundingDraft(commitment, {})
    if (!draft) return
    setPendingPlannedPatch({ id: commitment.id, patch: {} })
    setFundingDraft(draft)
  }

  const confirmPlannedFunding = (result: {
    fundingMethod: PlannedFundingMethod
    amountToReserveNow?: number
  }) => {
    if (!pendingPlannedPatch) return
    applyPlannedPatch(pendingPlannedPatch.id, {
      ...pendingPlannedPatch.patch,
      fundingMethod: result.fundingMethod,
      amountToReserveNow: result.amountToReserveNow,
      fundingStartDate: todayDateKey(),
    })
    setFundingDraft(null)
    setPendingPlannedPatch(null)
  }

  const cancelPlannedFunding = () => {
    setFundingDraft(null)
    setPendingPlannedPatch(null)
  }

  const addPlannedRow = () => {
    const { scopeLevel, scopeId } = getDefaultCommitmentScope(state, viewScope)
    actions.addCommitment({
      name: 'New planned cost',
      schedule: 'planned',
      amount: 0,
      plannedLabel: '',
      scopeLevel,
      scopeId,
      status: 'warning',
    })
  }

  const saveReserveDueDay = (
    row: (typeof commitmentViews.due)[number],
    day: number,
  ) => {
    if (!row.reservePlannerId || !row.reserveBillId) return
    const bill = state.reservePlanners
      .find((p) => p.id === row.reservePlannerId)
      ?.bills.find((b) => b.id === row.reserveBillId)
    if (!bill) return

    const months = row.rolledMonths?.length ? row.rolledMonths : []
    let monthDueDays = bill.monthDueDays ?? {}
    for (const month of months) {
      const amount = billAmountInMonth(bill, month)
      if (amount > 0) {
        monthDueDays = monthDueDaysFromPatch(monthDueDays, month, amount, day)
      }
    }
    actions.updateReserveBill(row.reservePlannerId, row.reserveBillId, { monthDueDays })
  }

  const saveReserveDueAmount = (
    row: (typeof commitmentViews.due)[number],
    amount: number,
  ) => {
    if (!row.reservePlannerId || !row.reserveBillId) return
    const bill = state.reservePlanners
      .find((p) => p.id === row.reservePlannerId)
      ?.bills.find((b) => b.id === row.reserveBillId)
    if (!bill) return

    const primaryPeriod = row.dueReferencePeriod ?? row.period
    actions.updateReserveBill(
      row.reservePlannerId,
      row.reserveBillId,
      buildReserveDueAmountOverridePatch(bill, primaryPeriod, amount),
    )
  }

  const saveReserveBillScope = (
    row: (typeof commitmentViews.due)[number],
    scopeLevel: ScopeLevel,
    scopeId: string,
  ) => {
    if (!row.reservePlannerId || !row.reserveBillId) return
    const planner = state.reservePlanners.find((p) => p.id === row.reservePlannerId)
    if (!planner) return

    let venueId: string | undefined
    if (scopeLevel === 'venue') {
      const venue = state.venues.find((v) => v.id === scopeId)
      if (venue?.businessId !== planner.businessId) return
      venueId = scopeId
    } else if (scopeLevel === 'business' && scopeId === planner.businessId) {
      venueId = undefined
    } else {
      return
    }

    actions.updateReserveBill(row.reservePlannerId, row.reserveBillId, { venueId })
  }

  const saveMonthlyDueAmount = (
    row: (typeof commitmentViews.due)[number],
    amount: number,
  ) => {
    const commitment = row.commitment
    if (commitment.schedule !== 'monthly') return
    const primaryPeriod = row.dueReferencePeriod ?? row.period
    const occurrences = getCommitmentDueOccurrences(commitment)
    actions.updateCommitmentDuePeriodAmount(
      commitment.id,
      primaryPeriod,
      amount,
      occurrences,
    )
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

  return (
    <section id="due-now" className="card widget-compact card-scroll">
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
      {fundingDraft && (
        <PlannedFundingModal
          draft={fundingDraft}
          onConfirm={confirmPlannedFunding}
          onCancel={cancelPlannedFunding}
        />
      )}
      <div className="card-head card-head-compact card-head-with-kpi">
        <h2>Due</h2>
        <table className="kpi-table kpi-table--head kpi-table--totals" aria-label="Due total">
          <tbody>
            <tr>
              <th scope="row">Total</th>
              <td className="col-amount kpi-primary">{formatCurrency(dueTotal)}</td>
            </tr>
          </tbody>
        </table>
        <div className="card-actions">
          {!editReadOnly && (
            <button type="button" className="btn-secondary btn-tiny" onClick={addPlannedRow}>
              + Add planned
            </button>
          )}
          <HelpButton
            id="due"
            openHelp={openHelp}
            setOpenHelp={setOpenHelp}
            text={WIDGET_HELP.due}
          />
        </div>
      </div>

      <div className="card-scroll-body">
        {useCards ? (
          <MobileDueList
            state={state}
            commitmentViews={commitmentViews}
            actions={actions}
            onOpenReservePlanner={onOpenReservePlanner}
          />
        ) : (
        <PlatformSheetWrap storageKey="due" columns={DUE_COLUMNS}>
          {({ widths, startResize, prefClasses }) => (
            <PlatformSheetTable widths={widths} preferenceClasses={prefClasses}>
              <thead>
                <tr>
                  {!editReadOnly && <SheetDragHeader />}
                  <ResizableSheetHeader columnIndex={1} onResizeStart={startResize}>
                    Name
                  </ResizableSheetHeader>
                  <ResizableSheetHeader
                    columnIndex={2}
                    onResizeStart={startResize}
                    className="committed-scope-col"
                  >
                    Scope
                  </ResizableSheetHeader>
                  <ResizableSheetHeader columnIndex={3} onResizeStart={startResize}>
                    Due
                  </ResizableSheetHeader>
                  <ResizableSheetHeader columnIndex={4} onResizeStart={startResize} className="sheet-num">
                    Amount
                  </ResizableSheetHeader>
                  <ResizableSheetHeader columnIndex={5} onResizeStart={startResize}>
                    Funding
                  </ResizableSheetHeader>
                  <ResizableSheetHeader columnIndex={6} onResizeStart={startResize} className="sheet-actions" />
                </tr>
              </thead>
              <tbody>
                {commitmentViews.due.length === 0 ? (
                  <tr className="sheet-empty-row">
                    <td colSpan={7} className="sheet-empty-cell">
                      Nothing due or planned yet. Use + Add planned.
                    </td>
                  </tr>
                ) : (
                  dueSections.map((section) => (
                    <Fragment key={section.kind}>
                      <tr className={`sheet-due-section sheet-due-section--${section.kind}`}>
                        <td colSpan={7} className="sheet-due-section-label">
                          {section.label}
                        </td>
                      </tr>
                      {section.rows.map((row) => {
                        const item = row.commitment
                        const isReserve = row.source === 'reserve'
                        const isReserveTransfer = isReserveTransferDueRow(row)
                        const isReserveBill = isReserve && !isReserveTransfer
                        const isPlanned = item.schedule === 'planned'
                        const rowKind = getDueRowKind(row)
                        const rowIndex = dueRowIds.indexOf(row.id)
                        const rowProps = dueReorder.getRowProps(row.id, rowIndex)
                        const rolledTooltip = formatRolledDueTooltip(row)
                        const rolledHint =
                          row.rolledPeriodCount && row.rolledPeriodCount > 1
                            ? `×${row.rolledPeriodCount}`
                            : null

                        const fundingStats = isPlanned ? formatPlannedFundingStats(item) : null
                        const reservePlanner = row.reservePlannerId
                          ? state.reservePlanners.find((p) => p.id === row.reservePlannerId)
                          : undefined
                        const reserveBillScopeOptions = reservePlanner
                          ? getReserveBillScopeOptionsForView(state, reservePlanner.businessId, viewScope)
                          : []

                        return (
                          <tr
                            key={row.id}
                            {...(editReadOnly ? {} : rowProps)}
                            className={[rowProps.className, `sheet-due-row--${rowKind}`]
                              .filter(Boolean)
                              .join(' ')}
                          >
                        {!editReadOnly && (
                          <SheetDragCell rowId={row.id} getHandleProps={dueReorder.getHandleProps} />
                        )}
                        {isReserveTransfer ? (
                          <td>
                            <button
                              type="button"
                              className="btn-ghost sheet-cell-value sheet-link-btn"
                              title={item.notes ?? undefined}
                              onClick={() =>
                                row.reservePlannerId && onOpenReservePlanner?.(row.reservePlannerId)
                              }
                            >
                              {item.name} · transfer
                            </button>
                          </td>
                        ) : isReserveBill ? (
                          <td>
                            <span className="sheet-cell-value">{item.name}</span>
                          </td>
                        ) : (
                          <InlineTextCell
                            cellId={`due-${item.id}-name`}
                            value={item.name}
                            isActive={activeCell === `due-${item.id}-name`}
                            placeholder="Name"
                            onActivate={() => activate(`due-${item.id}-name`)}
                            onDeactivate={deactivate}
                            onSave={(name) => actions.updateCommitment(item.id, { name: name || 'Untitled' })}
                            onTab={makeTabHandler(`due-${item.id}-name`)}
                          />
                        )}
                        {isReserveBill ? (
                          <ScopeSelectCell
                            cellId={`due-${row.id}-scope`}
                            state={state}
                            scopeLevel={item.scopeLevel}
                            scopeId={item.scopeId}
                            options={reserveBillScopeOptions}
                            commitmentScope
                            readOnly={editReadOnly}
                            isActive={activeCell === `due-${row.id}-scope`}
                            onActivate={() => tryActivate(`due-${row.id}-scope`)}
                            onDeactivate={deactivate}
                            onChange={(scopeLevel, scopeId) =>
                              saveReserveBillScope(row, scopeLevel, scopeId)
                            }
                            onTab={makeTabHandler(`due-${row.id}-scope`)}
                          />
                        ) : isReserveTransfer ? (
                          <td className="committed-scope-col sheet-row-label muted">
                            Reserve
                          </td>
                        ) : (
                          <ScopeSelectCell
                            cellId={`due-${item.id}-scope`}
                            state={state}
                            scopeLevel={item.scopeLevel}
                            scopeId={item.scopeId}
                            options={options}
                            commitmentScope
                            readOnly={editReadOnly}
                            isActive={activeCell === `due-${item.id}-scope`}
                            onActivate={() => tryActivate(`due-${item.id}-scope`)}
                            onDeactivate={deactivate}
                            onChange={(scopeLevel, scopeId) =>
                              actions.updateCommitment(item.id, { scopeLevel, scopeId })
                            }
                            onTab={makeTabHandler(`due-${item.id}-scope`)}
                          />
                        )}
                        {isPlanned ? (
                          <InlinePlannedDueCell
                            cellId={`due-${row.id}-timing`}
                            commitment={item}
                            statusDot={
                              <DueStatusDot
                                row={row}
                                onDismiss={() =>
                                  actions.acknowledgeCommitmentDueAlert(
                                    item.id,
                                    item.plannedDueDate?.slice(0, 7),
                                  )
                                }
                              />
                            }
                            isActive={activeCell === `due-${row.id}-timing`}
                            onActivate={() => activate(`due-${row.id}-timing`)}
                            onDeactivate={deactivate}
                            onSave={(plannedDueDate, plannedLabel) =>
                              savePlannedField(item, { plannedDueDate, plannedLabel })
                            }
                            onTab={makeTabHandler(`due-${row.id}-timing`)}
                          />
                        ) : isReserveTransfer ? (
                          <td title={item.notes ?? undefined}>
                            <span className="sheet-cell-value muted">{formatDueRowTiming(row)}</span>
                            <DueStatusDot row={row} />
                          </td>
                        ) : (
                          <InlineDueTimingCell
                            cellId={`due-${row.id}-timing`}
                            timing={formatDueRowTiming(row)}
                            dueDay={item.dueDayOfMonth ?? 28}
                            rolledHint={rolledHint}
                            rolledTooltip={rolledTooltip}
                            statusDot={
                              <DueStatusDot
                                row={row}
                                onDismiss={() => {
                                  if (isReserveBill && row.reservePlannerId && row.reserveBillId) {
                                    actions.acknowledgeReserveBillDueAlert(
                                      row.reservePlannerId,
                                      row.reserveBillId,
                                      row.dueReferencePeriod ?? row.period,
                                    )
                                  } else {
                                    actions.acknowledgeCommitmentDueAlert(
                                      item.id,
                                      row.dueReferencePeriod ?? row.period,
                                    )
                                  }
                                }}
                              />
                            }
                            isActive={activeCell === `due-${row.id}-timing`}
                            onActivate={() => activate(`due-${row.id}-timing`)}
                            onDeactivate={deactivate}
                            onSaveDay={(day) =>
                              isReserveBill
                                ? saveReserveDueDay(row, day)
                                : item.schedule === 'monthly'
                                  ? saveMonthlyDueDay(item, day)
                                  : actions.updateCommitment(item.id, { dueDayOfMonth: day })
                            }
                            onTab={makeTabHandler(`due-${row.id}-timing`)}
                          />
                        )}
                        {isReserveBill ? (
                          <InlineNumberCell
                            cellId={`due-${row.id}-amount`}
                            value={row.amount}
                            isActive={activeCell === `due-${row.id}-amount`}
                            onActivate={() => activate(`due-${row.id}-amount`)}
                            onDeactivate={deactivate}
                            onSave={(amount) => saveReserveDueAmount(row, amount)}
                            onTab={makeTabHandler(`due-${row.id}-amount`)}
                          />
                        ) : isReserveTransfer ? (
                          <td className="sheet-num" title={item.notes ?? undefined}>
                            <span className="sheet-cell-value">{formatCurrency(row.amount)}</span>
                          </td>
                        ) : (
                          <InlineNumberCell
                            cellId={`due-${item.id}-amount`}
                            value={row.amount}
                            isActive={activeCell === `due-${item.id}-amount`}
                            onActivate={() => activate(`due-${item.id}-amount`)}
                            onDeactivate={deactivate}
                            onSave={(amount) =>
                              isPlanned
                                ? savePlannedField(item, { amount })
                                : item.schedule === 'monthly'
                                  ? saveMonthlyDueAmount(row, amount)
                                  : actions.updateCommitment(item.id, { amount })
                            }
                            onTab={makeTabHandler(`due-${item.id}-amount`)}
                          />
                        )}
                        <td className="planned-funding-cell">
                          {isPlanned ? (
                            <button
                              type="button"
                              className="btn-ghost btn-tiny planned-funding-btn"
                              title={getPlannedFundingTooltip(item)}
                              onClick={() => openFundingEditor(item)}
                              disabled={!plannedCommitmentReadyForFunding(item)}
                            >
                              <span className="planned-funding-btn-label">
                                {getPlannedFundingLabel(item.fundingMethod)}
                              </span>
                              {fundingStats && (
                                <span className="planned-funding-btn-stats">
                                  {fundingStats}
                                </span>
                              )}
                            </button>
                          ) : (
                            <span className="muted planned-funding-empty">—</span>
                          )}
                        </td>
                        <td className="sheet-actions">
                          <div className="sheet-action-group">
                            {isReserveTransfer && row.reservePlannerId ? (
                              <button
                                type="button"
                                className="btn-primary btn-tiny"
                                title={item.notes ?? undefined}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onOpenReservePlanner?.(row.reservePlannerId!)
                                }}
                              >
                                Open planner
                              </button>
                            ) : isReserveBill && row.reservePlannerId && row.reserveBillId ? (
                              <MarkPaidConfirmButton
                                itemLabel={item.name}
                                expectedTotal={row.amount}
                                onConfirm={() =>
                                  actions.markReserveBillPaid(row.reservePlannerId!, row.reserveBillId!)
                                }
                              />
                            ) : isPlanned ? (
                              <MarkPaidConfirmButton
                                itemLabel={item.name}
                                expectedTotal={row.amount}
                                onConfirm={() => actions.deleteCommitment(item.id)}
                              />
                            ) : (
                              <MarkPaidConfirmButton
                                itemLabel={item.name}
                                expectedTotal={getCommitmentPayoffExpectedTotal(item)}
                                onConfirm={(amount) => actions.markCommitmentPaid(item.id, amount)}
                              />
                            )}
                            {!isReserveTransfer && (
                            <DuplicateRowButton
                              onClick={() =>
                                isReserveBill && row.reservePlannerId && row.reserveBillId
                                  ? actions.duplicateReserveBill(row.reservePlannerId, row.reserveBillId)
                                  : actions.duplicateCommitment(item.id)
                              }
                            />
                            )}
                            {!isReserveTransfer && (
                            <button
                              type="button"
                              className="btn-ghost btn-tiny"
                              onClick={() => {
                                if (isReserveBill && row.reservePlannerId && row.reserveBillId) {
                                  actions.dismissReserveBillDue(row.reservePlannerId, row.reserveBillId)
                                } else if (isPlanned) {
                                  actions.deleteCommitment(item.id)
                                } else {
                                  actions.dismissCommitmentDue(item.id)
                                }
                              }}
                              title={isPlanned ? 'Remove planned cost' : 'Dismiss this due entry'}
                            >
                              ×
                            </button>
                            )}
                          </div>
                        </td>
                      </tr>
                        )
                      })}
                    </Fragment>
                  ))
                )}
              </tbody>
            </PlatformSheetTable>
          )}
        </PlatformSheetWrap>
        )}
      </div>
    </section>
  )
}

