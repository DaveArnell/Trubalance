import { useMemo, useState, type ReactNode } from 'react'
import type { AppState, CommitmentDueRow, CommitmentViews } from '../../types'
import {
  buildDueRowSections,
  formatDueRowTiming,
  formatRolledDueTooltip,
  getDueRowCardFunding,
  isReserveTransferDueRow,
} from '../../utils/commitmentCalculations'
import { getCardScopeMetaLabel } from '../../utils/scope'
import { formatCurrency } from '../../utils/format'
import { getBusinessAccentColor, cardAccentForScope } from '../../utils/businessTheme'
import { getReferenceDate } from '../../utils/referenceDate'
import {
  dueRowNotifyKey,
  isPendingNewlyDueRow,
} from '../../utils/morningCheckIn'
import type { AppActions } from '../../hooks/useAppState'
import { DueStatusDot } from '../committed/shared'
import { MobileRecordCard, MobileRecordList, MobileSectionLabel } from './MobileRecordList'
import { MobileDueDetailModal } from './MobileDueDetailModal'
import { buildReserveDueAmountOverridePatch } from '../../utils/reserveCalculations'

interface MobileDueListProps {
  state: AppState
  commitmentViews: CommitmentViews
  actions: Pick<
    AppActions,
    | 'markCommitmentPaid'
    | 'deleteCommitment'
    | 'duplicateCommitment'
    | 'updateCommitment'
    | 'markReserveBillPaid'
    | 'duplicateReserveBill'
    | 'updateReserveBill'
  >
  onOpenReservePlanner?: (plannerId: string) => void
  newlyDueNotifyKeys?: string[]
  onAcknowledgeNewlyDue?: (key: string) => void
}

/** Reserve and normal dues use the parent business colour so one family stays consistent. */
export function getDueRowAccentColor(state: AppState, row: CommitmentDueRow): string | undefined {
  if (row.source === 'reserve') {
    if (row.reservePlannerId) {
      const planner = state.reservePlanners.find((entry) => entry.id === row.reservePlannerId)
      if (planner) return getBusinessAccentColor(state, planner.businessId)
    }
  }

  return cardAccentForScope(state, row.commitment.scopeLevel, row.commitment.scopeId)
}

function dueRowScopeMeta(state: AppState, row: CommitmentDueRow): string | null {
  if (isReserveTransferDueRow(row)) return 'Reserve transfer'
  if (row.source === 'reserve' && row.reservePlannerId) {
    const planner = state.reservePlanners.find((entry) => entry.id === row.reservePlannerId)
    if (planner) {
      return getCardScopeMetaLabel(state, 'business', planner.businessId)
    }
  }
  return getCardScopeMetaLabel(state, row.commitment.scopeLevel, row.commitment.scopeId)
}

export function MobileDueList({
  state,
  commitmentViews,
  actions,
  onOpenReservePlanner,
  newlyDueNotifyKeys = [],
  onAcknowledgeNewlyDue,
}: MobileDueListProps) {
  const [selected, setSelected] = useState<CommitmentDueRow | null>(null)
  const referenceDate = getReferenceDate()
  const pendingNew = useMemo(() => new Set(newlyDueNotifyKeys), [newlyDueNotifyKeys])
  const sections = useMemo(
    () => buildDueRowSections(commitmentViews.due, referenceDate),
    [commitmentViews.due, referenceDate],
  )

  if (commitmentViews.due.length === 0) {
    return <MobileRecordList emptyMessage="Nothing due or planned yet." />
  }

  const openRow = (row: CommitmentDueRow) => {
    const key = dueRowNotifyKey(row)
    if (pendingNew.has(key)) onAcknowledgeNewlyDue?.(key)
    setSelected(row)
  }

  const listBody: ReactNode[] = []
  for (const section of sections) {
    listBody.push(
      <MobileSectionLabel key={`section-${section.kind}`}>{section.label}</MobileSectionLabel>,
    )
    for (const row of section.rows) {
      const item = row.commitment
      const timing = formatDueRowTiming(row, referenceDate)
      const rolled = formatRolledDueTooltip(row)
      const scopeLabel = dueRowScopeMeta(state, row)
      const accent = getDueRowAccentColor(state, row)
      const detailMeta = [timing, rolled].filter(Boolean).join(' · ') || undefined
      const funding = getDueRowCardFunding(row, referenceDate)
      const isNewToday = isPendingNewlyDueRow(row, pendingNew)

      listBody.push(
        <MobileRecordCard
          key={row.id}
          title={item.name}
          titleBadges={
            <>
              {isNewToday ? (
                <span
                  className="due-new-notice"
                  title="Moved into Due today"
                  aria-label="Moved into Due today"
                />
              ) : null}
              <DueStatusDot row={row} />
            </>
          }
          scopeLabel={scopeLabel || undefined}
          amount={formatCurrency(funding.displayAmount)}
          amountSecondary={
            funding.showRemaining ? `/${formatCurrency(funding.targetAmount)}` : undefined
          }
          amountNegative
          meta={detailMeta}
          progress={funding.progress}
          progressColor={accent}
          accentColor={accent}
          onClick={() => openRow(row)}
        />,
      )
    }
  }

  return (
    <>
      <MobileRecordList>{listBody}</MobileRecordList>

      {selected ? (
        <MobileDueDetailModal
          state={state}
          row={selected}
          accentColor={getDueRowAccentColor(state, selected)}
          onClose={() => setSelected(null)}
          onMarkPaid={(amount) => {
            const item = selected.commitment
            const isReserve = selected.source === 'reserve'
            const isReserveTransfer = isReserveTransferDueRow(selected)
            const isReserveBill = isReserve && !isReserveTransfer
            const isPlanned = item.schedule === 'planned'
            if (isReserveBill && selected.reservePlannerId && selected.reserveBillId) {
              actions.markReserveBillPaid(selected.reservePlannerId, selected.reserveBillId)
            } else if (isPlanned) {
              actions.deleteCommitment(item.id)
            } else {
              actions.markCommitmentPaid(item.id, amount)
            }
          }}
          onSave={
            selected.source !== 'reserve'
              ? (patch) => actions.updateCommitment(selected.commitment.id, patch)
              : undefined
          }
          onSaveReserveAmount={
            selected.source === 'reserve' &&
            selected.reservePlannerId &&
            selected.reserveBillId &&
            !isReserveTransferDueRow(selected)
              ? (amount) => {
                  const planner = state.reservePlanners.find((p) => p.id === selected.reservePlannerId)
                  const bill = planner?.bills.find((b) => b.id === selected.reserveBillId)
                  if (!planner || !bill) return
                  const period = selected.dueReferencePeriod ?? selected.period
                  actions.updateReserveBill(
                    planner.id,
                    bill.id,
                    buildReserveDueAmountOverridePatch(bill, period, amount),
                  )
                }
              : undefined
          }
          onDuplicate={
            selected.source === 'reserve' &&
            selected.reservePlannerId &&
            selected.reserveBillId &&
            !isReserveTransferDueRow(selected)
              ? () =>
                  actions.duplicateReserveBill(selected.reservePlannerId!, selected.reserveBillId!)
              : selected.source !== 'reserve'
                ? () => actions.duplicateCommitment(selected.commitment.id)
                : undefined
          }
          onDelete={
            selected.source !== 'reserve' ? () => actions.deleteCommitment(selected.commitment.id) : undefined
          }
          onOpenReservePlanner={
            isReserveTransferDueRow(selected) && selected.reservePlannerId
              ? () => onOpenReservePlanner?.(selected.reservePlannerId!)
              : undefined
          }
        />
      ) : null}
    </>
  )
}
