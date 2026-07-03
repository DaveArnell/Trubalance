import { useState } from 'react'
import type { AppState, ViewScope } from '../types'
import {
  MONTHLY_RESERVE_CHECKIN_HEADLINE,
  MONTHLY_RESERVE_CHECKIN_INTRO,
  MONTHLY_RESERVE_CHECKIN_STEPS,
} from '../content/livingDashboard'
import {
  currentReserveMonthKey,
  dismissReserveCheckInLocally,
  getPlannersNeedingMonthlyCheckIn,
  wasReserveCheckInDismissed,
} from '../utils/reserveCheckIn'
import { MONTHS, currentMonthIndex } from '../utils/format'

interface MonthlyReserveCheckInProps {
  state: AppState
  viewScope: ViewScope
  onOpenReserve: (plannerId?: string) => void
  variant?: 'banner' | 'card'
  /** When set, only show for this planner (used on the reserve planner page). */
  plannerId?: string
}

export function MonthlyReserveCheckIn({
  state,
  viewScope,
  onOpenReserve,
  variant = 'banner',
  plannerId,
}: MonthlyReserveCheckInProps) {
  const monthLabel = MONTHS[currentMonthIndex()]!
  const [dismissed, setDismissed] = useState(() => wasReserveCheckInDismissed())

  const pending = getPlannersNeedingMonthlyCheckIn(state, viewScope).filter(
    (planner) => !plannerId || planner.id === plannerId,
  )
  if (pending.length === 0 || (variant === 'banner' && dismissed)) return null

  const handleDismiss = () => {
    dismissReserveCheckInLocally(currentReserveMonthKey())
    setDismissed(true)
  }

  const openCheckIn = () => {
    onOpenReserve(pending[0]?.id)
  }

  const className =
    variant === 'card' ? 'reserve-monthly-checkin reserve-monthly-checkin--card' : 'living-dashboard-banner'

  return (
    <div className={className} role="status">
      <div className="living-dashboard-banner-copy">
        <p className="living-dashboard-banner-kicker">{monthLabel} · {MONTHLY_RESERVE_CHECKIN_HEADLINE}</p>
        <p className="living-dashboard-banner-lead">{MONTHLY_RESERVE_CHECKIN_INTRO}</p>
        <ol className="living-dashboard-checkin-steps">
          {MONTHLY_RESERVE_CHECKIN_STEPS.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        {pending.length > 1 && (
          <p className="muted living-dashboard-banner-meta">
            {pending.length} reserve plans need this month&apos;s check-in.
          </p>
        )}
      </div>
      <div className="living-dashboard-banner-actions">
        <button type="button" className="btn-primary btn-tiny" onClick={openCheckIn}>
          Open reserve planner
        </button>
        {variant === 'banner' && (
          <button type="button" className="btn-ghost btn-tiny" onClick={handleDismiss}>
            Not now
          </button>
        )}
      </div>
    </div>
  )
}
