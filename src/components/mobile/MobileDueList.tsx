import { useMemo, useState } from 'react'
import type { AppState, CommitmentDueRow, CommitmentViews } from '../../types'
import {
  formatDueRowTiming,
  formatRolledDueTooltip,
  getDueRowCommittedAmount,
  getDueRowKind,
  isReserveTransferDueRow,
  sortDueRowsByUrgency,
} from '../../utils/commitmentCalculations'
import { getCardScopeMetaLabel } from '../../utils/scope'
import { formatCurrency } from '../../utils/format'
import { chartColorForScope } from '../../utils/businessTheme'
import { getReferenceDate } from '../../utils/referenceDate'
import type { AppActions } from '../../hooks/useAppState'
import { MobileRecordCard, MobileRecordList } from './MobileRecordList'
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

function dueKindLabel(row: CommitmentDueRow): string | null {
  const kind = getDueRowKind(row)
  if (kind === 'reserve') return 'Reserve'
  if (kind === 'planned-due' || kind === 'planned-open' || kind === 'planned-saving') return 'Planned'
  return null
}

export function MobileDueList({
  state,
  commitmentViews,
  actions,
  onOpenReservePlanner,
}: MobileDueListProps) {
  const [selected, setSelected] = useState<CommitmentDueRow | null>(null)
  const rows = useMemo(
    () => sortDueRowsByUrgency(commitmentViews.due),
    [commitmentViews.due],
  )

  if (commitmentViews.due.length === 0) {
    return <MobileRecordList emptyMessage="Nothing due or planned yet." />
  }

  const referenceDate = getReferenceDate()

  return (
    <>
      <MobileRecordList>
        {rows.map((row) => {
          const item = row.commitment
          const isReserveTransfer = isReserveTransferDueRow(row)
          const kind = getDueRowKind(row, referenceDate)
          const timing = formatDueRowTiming(row, referenceDate)
          const rolled = formatRolledDueTooltip(row)
          const scopeLabel = isReserveTransfer
            ? 'Reserve transfer'
            : getCardScopeMetaLabel(state, item.scopeLevel, item.scopeId)
          const accent = isReserveTransfer
            ? undefined
            : chartColorForScope(state, { type: item.scopeLevel, id: item.scopeId })
          const metaParts = [dueKindLabel(row), scopeLabel, timing, rolled].filter(Boolean)

          const target = row.amount
          const committed = getDueRowCommittedAmount(row, referenceDate)
          const funding = item.fundingMethod ?? 'immediate'
          const isBuilding =
            item.schedule === 'planned' &&
            funding !== 'immediate' &&
            (kind === 'planned-saving' || kind === 'planned-open') &&
            target > 0
          const progress = isBuilding ? Math.min(1, Math.max(0, committed / target)) : undefined

          return (
            <MobileRecordCard
              key={row.id}
              title={item.name}
              amount={formatCurrency(isBuilding ? committed : target)}
              amountSecondary={isBuilding ? `/${formatCurrency(target)}` : undefined}
              amountNegative
              meta={metaParts.join(' · ')}
              progress={progress}
              progressColor={accent}
              accentColor={accent}
              onClick={() => setSelected(row)}
            />
          )
        })}
      </MobileRecordList>

      {selected ? (
        <MobileDueDetailModal
          state={state}
          row={selected}
          accentColor={
            isReserveTransferDueRow(selected)
              ? undefined
              : chartColorForScope(state, {
                  type: selected.commitment.scopeLevel,
                  id: selected.commitment.scopeId,
                })
          }
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
