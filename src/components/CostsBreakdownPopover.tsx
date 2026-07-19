import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import type { AppState } from '../types'
import type { BreakdownColumn } from '../utils/breakdownTable'
import { getScopeCostBreakdown, getSharedScopeCostBreakdown } from '../utils/breakdownTable'
import { formatCurrency } from '../utils/format'

interface CostsBreakdownPopoverProps {
  state: AppState
  column: BreakdownColumn
  anchorRect: DOMRect
  onClose: () => void
}

function Row({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone?: 'cost' | 'receipt' | 'total'
}) {
  const formatted =
    tone === 'receipt' ? `+${formatCurrency(value)}` : formatCurrency(value)
  return (
    <li className={tone === 'total' ? 'costs-breakdown-row--total' : undefined}>
      <span>{label}</span>
      <strong className={tone === 'receipt' ? 'costs-breakdown-value--receipt' : undefined}>
        {formatted}
      </strong>
    </li>
  )
}

export function CostsBreakdownPopover({
  state,
  column,
  anchorRect,
  onClose,
}: CostsBreakdownPopoverProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const breakdown = column.isSharedScope
    ? getSharedScopeCostBreakdown(state, column.scope)
    : getScopeCostBreakdown(state, column.scope)

  useEffect(() => {
    const handlePointer = (event: MouseEvent) => {
      const target = event.target as Node
      if (panelRef.current?.contains(target)) return
      onClose()
    }
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', handlePointer)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handlePointer)
      document.removeEventListener('keydown', handleKey)
    }
  }, [onClose])

  const top = Math.min(anchorRect.bottom + 6, window.innerHeight - 280)
  const left = Math.max(8, Math.min(anchorRect.right - 260, window.innerWidth - 280))

  const showCostSplit =
    !column.isSharedScope &&
    breakdown.ofWhichSharedCosts != null &&
    breakdown.ofWhichChildCosts != null &&
    (breakdown.ofWhichSharedCosts > 0 || breakdown.ofWhichChildCosts > 0)

  const showReceiptSplit =
    !column.isSharedScope &&
    breakdown.ofWhichSharedReceipts != null &&
    breakdown.ofWhichChildReceipts != null &&
    (breakdown.ofWhichSharedReceipts > 0 || breakdown.ofWhichChildReceipts > 0)

  return createPortal(
    <>
      <button type="button" className="costs-breakdown-backdrop" aria-label="Close" onClick={onClose} />
      <div
        ref={panelRef}
        className="costs-breakdown-popover"
        style={{ top, left }}
        role="dialog"
        aria-label={`Total costs breakdown for ${column.label}`}
      >
        <p className="costs-breakdown-tooltip-title">Total costs — {column.label}</p>

        <p className="costs-breakdown-section-label">What’s in this total</p>
        <ul className="costs-breakdown-tooltip-list">
          {breakdown.accruingMonthly > 0 ? (
            <Row label="Accruing (monthly)" value={breakdown.accruingMonthly} />
          ) : null}
          {breakdown.accruingReserve > 0 ? (
            <Row label="Accruing (reserve)" value={breakdown.accruingReserve} />
          ) : null}
          {breakdown.due > 0 ? <Row label="Due now" value={breakdown.due} /> : null}
          {breakdown.plannedNotDue > 0 ? (
            <Row label="Planned (not yet due)" value={breakdown.plannedNotDue} />
          ) : null}
          {breakdown.totalCosts === 0 ? (
            <li>
              <span>No committed costs</span>
              <strong>{formatCurrency(0)}</strong>
            </li>
          ) : null}
          <Row label="Total costs" value={breakdown.totalCosts} tone="total" />
        </ul>

        {breakdown.expectedReceipts > 0 ? (
          <>
            <p className="costs-breakdown-section-label">Also in True Balance</p>
            <ul className="costs-breakdown-tooltip-list">
              <Row
                label="Expected receipts"
                value={breakdown.expectedReceipts}
                tone="receipt"
              />
            </ul>
          </>
        ) : null}

        {showCostSplit || showReceiptSplit ? (
          <>
            <p className="costs-breakdown-section-label">Of which (already in the totals above)</p>
            <ul className="costs-breakdown-tooltip-list costs-breakdown-tooltip-list--muted">
              {showCostSplit ? (
                <>
                  <Row
                    label={breakdown.childSplitLabel ?? 'At child locations'}
                    value={breakdown.ofWhichChildCosts!}
                  />
                  <Row
                    label={breakdown.sharedSplitLabel ?? 'Shared'}
                    value={breakdown.ofWhichSharedCosts!}
                  />
                </>
              ) : null}
              {showReceiptSplit ? (
                <>
                  <Row
                    label={`${breakdown.childSplitLabel ?? 'Child'} receipts`}
                    value={breakdown.ofWhichChildReceipts!}
                    tone="receipt"
                  />
                  <Row
                    label={`${breakdown.sharedSplitLabel ?? 'Shared'} receipts`}
                    value={breakdown.ofWhichSharedReceipts!}
                    tone="receipt"
                  />
                </>
              ) : null}
            </ul>
          </>
        ) : null}

        <p className="costs-breakdown-tooltip-note muted">
          True Balance = cash − total costs + expected receipts.
          {column.isSharedScope
            ? ' This column is only shared items — not venue- or business-specific costs.'
            : showCostSplit
              ? ' “Of which” splits the same total — it is not added on top.'
              : ''}
        </p>
      </div>
    </>,
    document.body,
  )
}
