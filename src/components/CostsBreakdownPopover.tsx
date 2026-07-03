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

  const top = Math.min(anchorRect.bottom + 6, window.innerHeight - 220)
  const left = Math.max(8, Math.min(anchorRect.right - 240, window.innerWidth - 260))

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
        <ul className="costs-breakdown-tooltip-list">
          <li>
            <span>Accruing (monthly)</span>
            <strong>{formatCurrency(breakdown.accruingMonthly)}</strong>
          </li>
          {breakdown.accruingReserve > 0 ? (
            <li>
              <span>Accruing (reserve)</span>
              <strong>{formatCurrency(breakdown.accruingReserve)}</strong>
            </li>
          ) : null}
          <li>
            <span>Due</span>
            <strong>{formatCurrency(breakdown.due)}</strong>
          </li>
          {breakdown.planned > 0 ? (
            <li>
              <span>Planned</span>
              <strong>{formatCurrency(breakdown.planned)}</strong>
            </li>
          ) : null}
          {breakdown.expectedReceipts > 0 ? (
            <li>
              <span>Expected receipts</span>
              <strong>+{formatCurrency(breakdown.expectedReceipts)}</strong>
            </li>
          ) : null}
          {breakdown.businessShared != null && breakdown.businessShared > 0 ? (
            <li>
              <span>Business-wide costs (not per venue)</span>
              <strong>{formatCurrency(breakdown.businessShared)}</strong>
            </li>
          ) : null}
          {breakdown.businessSharedReceipts != null && breakdown.businessSharedReceipts > 0 ? (
            <li>
              <span>Business-wide receipts (not per venue)</span>
              <strong>+{formatCurrency(breakdown.businessSharedReceipts)}</strong>
            </li>
          ) : null}
          {breakdown.groupShared != null && breakdown.groupShared > 0 ? (
            <li>
              <span>Group-wide costs (not per business)</span>
              <strong>{formatCurrency(breakdown.groupShared)}</strong>
            </li>
          ) : null}
          {breakdown.groupSharedReceipts != null && breakdown.groupSharedReceipts > 0 ? (
            <li>
              <span>Group-wide receipts (not per business)</span>
              <strong>+{formatCurrency(breakdown.groupSharedReceipts)}</strong>
            </li>
          ) : null}
        </ul>
        <p className="costs-breakdown-tooltip-note muted">
          True Balance = cash − total costs + expected receipts.
          {column.isSharedScope
            ? ' This column shows only business-wide or group-wide items — not venue-specific costs.'
            : " Venue and business columns show only that column's items; group-wide receipts appear on the BUSINESS total line."}
        </p>
      </div>
    </>,
    document.body,
  )
}
