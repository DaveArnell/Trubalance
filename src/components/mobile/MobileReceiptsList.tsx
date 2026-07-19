import type { AppState, ViewScope } from '../../types'
import { getScopeItemLabel, itemMatchesScope } from '../../utils/scope'
import { sortByOrder } from '../../utils/sortOrder'
import { formatCurrency } from '../../utils/format'
import { formatReceiptDateDisplay } from '../../utils/receiptCalculations'
import { chartColorForScope } from '../../utils/businessTheme'
import type { AppActions } from '../../hooks/useAppState'
import { useEditReadOnly } from '../../hooks/useEditReadOnly'
import { MarkReceivedConfirmButton } from '../committed/MarkPaidConfirmModal'
import { MobileRecordCard, MobileRecordList } from './MobileRecordList'

interface MobileReceiptsListProps {
  state: AppState
  viewScope: ViewScope
  actions: Pick<AppActions, 'markReceiptReceived' | 'deleteReceipt'>
}

export function MobileReceiptsList({ state, viewScope, actions }: MobileReceiptsListProps) {
  const editReadOnly = useEditReadOnly()
  const receipts = sortByOrder(
    state.expectedReceipts.filter(
      (receipt) =>
        !receipt.received && itemMatchesScope(state, viewScope, receipt.scopeLevel, receipt.scopeId),
    ),
    (receipt) => receipt.sortOrder,
  )

  if (receipts.length === 0) {
    return (
      <MobileRecordList
        emptyMessage={
          state.expectedReceipts.length === 0
            ? 'No expected receipts yet.'
            : 'No expected receipts in this scope.'
        }
      />
    )
  }

  return (
    <MobileRecordList>
      {receipts.map((receipt) => {
        const timing = (receipt.receiptTiming ?? 'lump') === 'accrual' ? 'Building up' : 'Lump sum'
        const expected = formatReceiptDateDisplay(receipt.expectedDate)
        const meta = [
          getScopeItemLabel(state, receipt.scopeLevel, receipt.scopeId),
          timing,
          expected ? `Due ${expected}` : null,
        ]
          .filter(Boolean)
          .join(' · ')
        const accent = chartColorForScope(state, {
          type: receipt.scopeLevel,
          id: receipt.scopeId,
        })

        return (
          <MobileRecordCard
            key={receipt.id}
            title={receipt.name}
            amount={formatCurrency(receipt.amount)}
            meta={meta}
            accentColor={accent}
            actions={
              editReadOnly ? undefined : (
                <>
                  <MarkReceivedConfirmButton
                    itemLabel={receipt.name}
                    expectedTotal={receipt.amount}
                    onConfirm={(amount) => actions.markReceiptReceived(receipt.id, amount)}
                  />
                  <button
                    type="button"
                    className="btn-ghost btn-tiny"
                    onClick={() => actions.deleteReceipt(receipt.id)}
                  >
                    Remove
                  </button>
                </>
              )
            }
          />
        )
      })}
    </MobileRecordList>
  )
}
