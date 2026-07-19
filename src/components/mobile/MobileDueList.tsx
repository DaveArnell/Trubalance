import { Fragment } from 'react'
import type { AppState, CommitmentViews } from '../../types'
import {
  buildDueRowSections,
  formatDueRowTiming,
  formatRolledDueTooltip,
  getCommitmentPayoffExpectedTotal,
  isReserveTransferDueRow,
} from '../../utils/commitmentCalculations'
import { getScopeItemLabel } from '../../utils/scope'
import { formatCurrency } from '../../utils/format'
import { chartColorForScope } from '../../utils/businessTheme'
import type { AppActions } from '../../hooks/useAppState'
import { MarkPaidConfirmButton } from '../committed/MarkPaidConfirmModal'
import { MobileRecordCard, MobileRecordList, MobileSectionLabel } from './MobileRecordList'

interface MobileDueListProps {
  state: AppState
  commitmentViews: CommitmentViews
  actions: Pick<
    AppActions,
    | 'markCommitmentPaid'
    | 'deleteCommitment'
    | 'markReserveBillPaid'
  >
  onOpenReservePlanner?: (plannerId: string) => void
}

export function MobileDueList({
  state,
  commitmentViews,
  actions,
  onOpenReservePlanner,
}: MobileDueListProps) {
  const sections = buildDueRowSections(commitmentViews.due)

  if (commitmentViews.due.length === 0) {
    return <MobileRecordList emptyMessage="Nothing due or planned yet." />
  }

  return (
    <MobileRecordList>
      {sections.map((section) => (
        <Fragment key={section.kind}>
          <MobileSectionLabel>{section.label}</MobileSectionLabel>
          {section.rows.map((row) => {
            const item = row.commitment
            const isReserve = row.source === 'reserve'
            const isReserveTransfer = isReserveTransferDueRow(row)
            const isReserveBill = isReserve && !isReserveTransfer
            const isPlanned = item.schedule === 'planned'
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
                actions={
                  isReserveTransfer && row.reservePlannerId ? (
                    <button
                      type="button"
                      className="btn-primary btn-tiny"
                      onClick={() => onOpenReservePlanner?.(row.reservePlannerId!)}
                    >
                      Open planner
                    </button>
                  ) : isReserveBill && row.reservePlannerId && row.reserveBillId ? (
                    <MarkPaidConfirmButton
                      itemLabel={item.name}
                      expectedTotal={row.amount}
                      buttonLabel="Paid"
                      onConfirm={() =>
                        actions.markReserveBillPaid(row.reservePlannerId!, row.reserveBillId!)
                      }
                    />
                  ) : isPlanned ? (
                    <MarkPaidConfirmButton
                      itemLabel={item.name}
                      expectedTotal={row.amount}
                      buttonLabel="Paid"
                      onConfirm={() => actions.deleteCommitment(item.id)}
                    />
                  ) : (
                    <MarkPaidConfirmButton
                      itemLabel={item.name}
                      expectedTotal={getCommitmentPayoffExpectedTotal(item)}
                      buttonLabel="Paid"
                      onConfirm={(amount) => actions.markCommitmentPaid(item.id, amount)}
                    />
                  )
                }
              />
            )
          })}
        </Fragment>
      ))}
    </MobileRecordList>
  )
}
