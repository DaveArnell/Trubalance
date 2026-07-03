import type { ReactNode, DragEvent as ReactDragEvent } from 'react'
import type { Commitment, CommitmentAccruingRow, CommitmentDueRow, HealthLevel, StatusColor } from '../../types'
import {
  getAccruedAmount,
  getAccrualTooltip,
  getAccruingRowDailyRate,
  formatMonthlyCostAttentionTiming,
  getDerivedDueRowStatus,
  getMonthlyCostAttentionStatus,
  isPaidThisCycle,
  monthlyCostNeedsAttention,
} from '../../utils/commitmentCalculations'
import { formatCurrency } from '../../utils/format'

export function ordinalDay(day: number) {
  if (day >= 11 && day <= 13) return `${day}th`
  const mod = day % 10
  if (mod === 1) return `${day}st`
  if (mod === 2) return `${day}nd`
  if (mod === 3) return `${day}rd`
  return `${day}th`
}

export function ReadOnlyCell({
  children,
  className,
  title,
}: {
  children: ReactNode
  className?: string
  title?: string
}) {
  return (
    <td className={`sheet-cell-readonly${className ? ` ${className}` : ''}`} title={title}>
      <span className="sheet-cell-value">{children}</span>
    </td>
  )
}

const statusTitles: Record<StatusColor, string> = {
  healthy: 'On track',
  warning: 'Due now',
  risk: 'Overdue',
  critical: 'Urgent',
}

export function StatusDot({ commitment }: { commitment: Commitment }) {
  const status = getMonthlyCostAttentionStatus(commitment)
  if (status === 'healthy') return null
  const timing = formatMonthlyCostAttentionTiming(commitment)
  const title = timing ? `${timing} — ${statusTitles[status]}` : statusTitles[status]
  return (
    <span
      className={`status-dot ${status}`}
      title={title}
      aria-label={title}
    />
  )
}

function attentionLevelToStatus(level: HealthLevel): StatusColor {
  if (level === 'red') return 'critical'
  if (level === 'orange') return 'risk'
  if (level === 'yellow') return 'warning'
  return 'healthy'
}

export function DismissibleStatusDot({
  level,
  onDismiss,
  title,
}: {
  level: HealthLevel
  onDismiss: () => void
  title?: string
}) {
  const status = attentionLevelToStatus(level)
  return (
    <button
      type="button"
      className={`status-dot-btn status-dot ${status}`}
      title={title ?? 'Mark as handled'}
      aria-label={title ?? 'Mark as handled'}
      onClick={(event) => {
        event.stopPropagation()
        onDismiss()
      }}
    />
  )
}

export function DismissibleCommitmentStatusDot({
  commitment,
  onDismiss,
}: {
  commitment: Commitment
  onDismiss: () => void
}) {
  if (!monthlyCostNeedsAttention(commitment)) return null
  const status = getMonthlyCostAttentionStatus(commitment)
  const timing = formatMonthlyCostAttentionTiming(commitment)
  const title = timing
    ? `${timing} — acknowledge alert, item stays in Due`
    : 'Acknowledge alert — item stays in Due'
  return (
    <button
      type="button"
      className={`status-dot-btn status-dot ${status}`}
      title={title}
      aria-label={title}
      onClick={(event) => {
        event.stopPropagation()
        onDismiss()
      }}
    />
  )
}

export function DueStatusDot({
  row,
  onDismiss,
}: {
  row: CommitmentDueRow
  onDismiss?: () => void
}) {
  const status = getDerivedDueRowStatus(row)
  const isPlanned = row.commitment.schedule === 'planned'
  const dismissTitle = isPlanned
    ? 'Acknowledge alert — item stays in Due'
    : 'Acknowledge alert — item stays in Due'
  if (onDismiss && status !== 'healthy') {
    return (
      <button
        type="button"
        className={`status-dot-btn status-dot ${status}`}
        title={dismissTitle}
        aria-label={dismissTitle}
        onClick={(event) => {
          event.stopPropagation()
          onDismiss()
        }}
      />
    )
  }
  if (status === 'healthy') return null
  return (
    <span
      className={`status-dot ${status}`}
      title={statusTitles[status]}
      aria-label={statusTitles[status]}
    />
  )
}

export function DuplicateRowButton({ onClick, label = 'Duplicate row' }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      className="btn-ghost btn-tiny"
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      title={label}
      aria-label={label}
    >
      ⧉
    </button>
  )
}

type DragHandleProps = {
  draggable: boolean
  onDragStart: (e: ReactDragEvent) => void
  onDragEnd: () => void
}

export function SheetDragHeader() {
  return <th className="sheet-drag-col" aria-label="Reorder" />
}

export function SheetDragCell({
  rowId,
  getHandleProps,
  prefix,
}: {
  rowId: string
  getHandleProps: (rowId: string) => DragHandleProps
  prefix?: ReactNode
}) {
  const handleProps = getHandleProps(rowId)
  return (
    <td className="sheet-drag-col">
      <div className="sheet-drag-cell-inner">
        {prefix}
        <span
          className="sheet-drag-handle"
          role="button"
          tabIndex={0}
          aria-label="Drag to reorder"
          title="Drag to reorder"
          {...handleProps}
        >
          ⋮⋮
        </span>
      </div>
    </td>
  )
}

export function AccruedTodayCell({ commitment }: { commitment: Commitment }) {
  if (isPaidThisCycle(commitment)) {
    return (
      <span className="committed-paid-badge" title="Paid this month — accrual restarts next cycle">
        Paid
      </span>
    )
  }

  return (
    <span title={getAccrualTooltip(commitment)}>{formatCurrency(getAccruedAmount(commitment))}</span>
  )
}

export function DailyAccrualCell({ row }: { row: CommitmentAccruingRow }) {
  if (row.source === 'commitment' && isPaidThisCycle(row.commitment)) {
    return <span className="muted">—</span>
  }

  const rate = getAccruingRowDailyRate(row)
  const title =
    row.source === 'reserve'
      ? 'Monthly reserve deposit spread evenly across the calendar month'
      : 'Monthly budget for this cycle divided by days in the cycle'

  return <span title={title}>{formatCurrency(rate)}</span>
}
