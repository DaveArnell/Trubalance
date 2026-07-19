import { Fragment, useState } from 'react'
import type { AppState, CommitmentDueRow, CommitmentViews } from '../../types'
import {
  buildDueRowSections,
  formatDueRowTiming,
  formatRolledDueTooltip,
  isReserveTransferDueRow,
} from '../../utils/commitmentCalculations'
import { getScopeItemLabel } from '../../utils/scope'
import { formatCurrency } from '../../utils/format'
import { chartColorForScope } from '../../utils/businessTheme'
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

export function MobileDueList({
  state,
  commitmentViews,
  actions,
  onOpenReservePlanner,
}: MobileDueListProps) {
  const [selected, setSelected] = useState<CommitmentDueRow | null>(null)
  const sections = buildDueRowSections(commitmentViews.due)

  if (commitmentViews.due.length === 0) {
    return <MobileRecordList emptyMessage="Nothing due or planned yet." />
  }

  return (
    <>
      <MobileRecordList>
        {sections.map((section) => (
          <Fragment key={section.kind}>
            <MobileSectionLabel>{section.label}</MobileSectionLabel>
            {section.rows.map((row) => {
              const item = row.commitment
              const isReserveTransfer = isReserveTransferDueRow(row)
              const timing = formatDueRowTiming(row)
              const rolled = formatRolledDueTooltip(row)
              const scopeLabel = isReserveTransfer
                ? 'Reserve transfer'
                : getScopeItemLabel(state, item.scopeLevel, item.scopeId)
              const accent = isReserveTransfer
                ? undefined
                : chartColorForScope(state, { type: item.scopeLevel, id: item.scopeId })
              const metaParts = [scopeLabel, timing, rolled].filter(Boolean)

              return (
                <MobileRecordCard
                  key={row.id}
                  title={item.name}
                  amount={formatCurrency(row.amount)}
                  amountNegative
                  meta={metaParts.join(' · ')}
                  accentColor={accent}
                  onClick={() => setSelected(row)}
                />
              )
            })}
          </Fragment>
        ))}
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
