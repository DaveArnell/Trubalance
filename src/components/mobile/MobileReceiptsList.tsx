import { useState } from 'react'
import type { AppState, ExpectedReceipt, ViewScope } from '../../types'
import { getScopeItemLabel, itemMatchesScope } from '../../utils/scope'
import { sortByOrder } from '../../utils/sortOrder'
import { formatCurrency } from '../../utils/format'
import { formatReceiptDateDisplay } from '../../utils/receiptCalculations'
import { chartColorForScope } from '../../utils/businessTheme'
import type { AppActions } from '../../hooks/useAppState'
import { MobileRecordCard, MobileRecordList } from './MobileRecordList'
import { MobileReceiptEditModal } from './MobileReceiptEditModal'

interface MobileReceiptsListProps {
  state: AppState
  viewScope: ViewScope
  actions: Pick<
    AppActions,
    'updateReceipt' | 'markReceiptReceived' | 'deleteReceipt' | 'duplicateReceipt'
  >
}

export function MobileReceiptsList({ state, viewScope, actions }: MobileReceiptsListProps) {
  const [selected, setSelected] = useState<ExpectedReceipt | null>(null)
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
    <>
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
              onClick={() => setSelected(receipt)}
            />
          )
        })}
      </MobileRecordList>

      {selected ? (
        <MobileReceiptEditModal
          state={state}
          viewScope={viewScope}
          receipt={selected}
          accentColor={chartColorForScope(state, {
            type: selected.scopeLevel,
            id: selected.scopeId,
          })}
          onClose={() => setSelected(null)}
          onSave={(patch) => actions.updateReceipt(selected.id, patch)}
          onReceived={(amount) => actions.markReceiptReceived(selected.id, amount)}
          onDuplicate={() => actions.duplicateReceipt(selected.id)}
          onDelete={() => actions.deleteReceipt(selected.id)}
        />
      ) : null}
    </>
  )
}
