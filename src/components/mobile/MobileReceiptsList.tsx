import { useState } from 'react'
import type { AppState, ExpectedReceipt, ViewScope } from '../../types'
import { getCardScopeMetaLabel, itemMatchesScope } from '../../utils/scope'
import { formatCurrency } from '../../utils/format'
import {
  formatReceiptDateDisplay,
  getEffectiveReceiptAmount,
  getReceiptPeriodAmount,
  getReceiptTiming,
  resolveReceiptAccrualWindow,
} from '../../utils/receiptCalculations'
import { chartColorForScope } from '../../utils/businessTheme'
import { getReferenceDate } from '../../utils/referenceDate'
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

function sortReceiptsByExpectedDate(receipts: ExpectedReceipt[]): ExpectedReceipt[] {
  return [...receipts].sort((a, b) => {
    const dateA = a.expectedDate || '9999-12-31'
    const dateB = b.expectedDate || '9999-12-31'
    const cmp = dateA.localeCompare(dateB)
    if (cmp !== 0) return cmp
    return a.name.localeCompare(b.name)
  })
}

export function MobileReceiptsList({ state, viewScope, actions }: MobileReceiptsListProps) {
  const [selected, setSelected] = useState<ExpectedReceipt | null>(null)
  const receipts = sortReceiptsByExpectedDate(
    state.expectedReceipts.filter(
      (receipt) =>
        !receipt.received && itemMatchesScope(state, viewScope, receipt.scopeLevel, receipt.scopeId),
    ),
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

  const referenceDate = getReferenceDate()

  return (
    <>
      <MobileRecordList>
        {receipts.map((receipt) => {
          const isAccrual = getReceiptTiming(receipt) === 'accrual'
          const timingLabel = isAccrual ? 'Building up' : 'Lump sum'
          const expected = formatReceiptDateDisplay(receipt.expectedDate)
          const scopeLabel = getCardScopeMetaLabel(state, receipt.scopeLevel, receipt.scopeId)
          const detailMeta = [timingLabel, expected ? `Due ${expected}` : null]
            .filter(Boolean)
            .join(' · ')
          const accent = chartColorForScope(state, {
            type: receipt.scopeLevel,
            id: receipt.scopeId,
          })
          const window = resolveReceiptAccrualWindow(receipt, referenceDate)
          const target = window
            ? getReceiptPeriodAmount(receipt, window.period)
            : receipt.amount
          const accrued = getEffectiveReceiptAmount(receipt, referenceDate)
          const isBuilding = isAccrual && target > 0
          const progress = isBuilding
            ? Math.min(1, Math.max(0, accrued / target))
            : target > 0 && accrued > 0
              ? 1
              : isAccrual
                ? 0
                : accrued > 0
                  ? 1
                  : undefined

          return (
            <MobileRecordCard
              key={receipt.id}
              title={receipt.name}
              scopeLabel={scopeLabel ?? undefined}
              amount={formatCurrency(isBuilding ? accrued : target)}
              amountSecondary={isBuilding ? `/${formatCurrency(target)}` : undefined}
              meta={detailMeta || undefined}
              progress={progress}
              progressColor={accent}
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
