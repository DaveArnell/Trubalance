import { useMemo, useState } from 'react'
import type { AppState, ViewScope } from '../types'
import {
  clearPendingDueNotifyPeriods,
  dueNotifyKey,
  getNewlyDueItemsToday,
  getPendingDueNotifyPeriods,
} from '../utils/morningCheckIn'
import { formatCurrency } from '../utils/format'

interface DueMovedBannerProps {
  state: AppState
  viewScope: ViewScope
  onOpenDue?: () => void
  /** Bump when morning check-in writes pending notify keys. */
  refreshKey?: number
}

/** Persistent banner when newly due items were deferred from the morning check-in. */
export function DueMovedBanner({ state, viewScope, onOpenDue, refreshKey = 0 }: DueMovedBannerProps) {
  const [tick, setTick] = useState(0)
  const newlyDue = useMemo(() => getNewlyDueItemsToday(state, viewScope), [state, viewScope])
  const pending = useMemo(
    () => new Set(getPendingDueNotifyPeriods()),
    [tick, newlyDue, refreshKey],
  )

  const items = newlyDue.filter((item) => pending.has(dueNotifyKey(item)))
  if (items.length === 0) return null

  return (
    <div className="due-moved-banner" role="status">
      <div className="due-moved-banner-copy">
        <strong>
          {items.length === 1
            ? 'A bill moved into Due today'
            : `${items.length} bills moved into Due today`}
        </strong>
        <span className="muted">
          {' '}
          {items
            .slice(0, 3)
            .map((i) => `${i.name} (${formatCurrency(i.amount)})`)
            .join(' · ')}
          {items.length > 3 ? '…' : ''}
        </span>
      </div>
      <div className="due-moved-banner-actions">
        {onOpenDue ? (
          <button type="button" className="btn-secondary btn-tiny" onClick={onOpenDue}>
            Open Due
          </button>
        ) : null}
        <button
          type="button"
          className="btn-ghost btn-tiny"
          onClick={() => {
            clearPendingDueNotifyPeriods()
            setTick((n) => n + 1)
          }}
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}
