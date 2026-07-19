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
import { chartColorForScope, getBusinessAccentColor } from '../../utils/businessTheme'
import { getReferenceDate } from '../../utils/referenceDate'
import type { AppActions } from '../../hooks/useAppState'
import { MobileRecordCard, MobileRecordList, MobileSectionLabel } from './MobileRecordList'
import { MobileDueDetailModal } from './MobileDueDetailModal'

interface MobileDueListProps {
  state: AppState
  commitmentViews: CommitmentViews
  actions: Pick<
    AppActions,
    | 'markCommitmentPaid'
    | 'deleteCommitment'
    | 'duplicateCommitment'
    | 'markReserveBillPaid'
    | 'duplicateReserveBill'
  >
  onOpenReservePlanner?: (plannerId: string) => void
}

/** Reserve-plan dues use the business colour; other rows use their own scope colour. */
export function getDueRowAccentColor(state: AppState, row: CommitmentDueRow): string | undefined {
  if (row.source === 'reserve') {
    if (row.reservePlannerId) {
      const planner = state.reservePlanners.find((entry) => entry.id === row.reservePlannerId)
      if (planner) return getBusinessAccentColor(state, planner.businessId)
    }
    if (row.commitment.scopeLevel === 'business') {
      return getBusinessAccentColor(state, row.commitment.scopeId)
    }
    const venue = state.venues.find((entry) => entry.id === row.commitment.scopeId)
    if (venue) return getBusinessAccentColor(state, venue.businessId)
  }

  return chartColorForScope(state, {
    type: row.commitment.scopeLevel,
    id: row.commitment.scopeId,
  })
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
}: MobileDueListProps) {
  const [selected, setSelected] = useState<CommitmentDueRow | null>(null)
  const referenceDate = getReferenceDate()
  const sections = useMemo(
    () => buildDueRowSections(commitmentViews.due, referenceDate),
    [commitmentViews.due, referenceDate],
  )

  if (commitmentViews.due.length === 0) {
    return <MobileRecordList emptyMessage="Nothing due or planned yet." />
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

      listBody.push(
        <MobileRecordCard
          key={row.id}
          title={item.name}
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
          onClick={() => setSelected(row)}
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
