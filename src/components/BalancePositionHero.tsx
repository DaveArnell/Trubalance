import { useMemo } from 'react'
import type { AppState, DashboardMetrics, ViewScope } from '../types'
import {
  formatPositionChange,
  getBalancePositionDeltas,
} from '../utils/balancePositionDeltas'
import { formatCurrency } from '../utils/format'
import { getScopeCurrentAccountFreshness } from '../utils/accountFreshness'

interface BalancePositionHeroProps {
  metrics: DashboardMetrics
  state: AppState
  viewScope: ViewScope
  onExpand: () => void
  readOnly?: boolean
}

/** Collapsed Cash Prophet Balance with week/month change. */
export function BalancePositionHero({
  metrics,
  state,
  viewScope,
  onExpand,
  readOnly = false,
}: BalancePositionHeroProps) {
  const deltas = useMemo(
    () => getBalancePositionDeltas(state, viewScope, metrics.trueBalance),
    [state, viewScope, metrics.trueBalance],
  )

  const freshness = useMemo(
    () => getScopeCurrentAccountFreshness(state, viewScope),
    [state, viewScope],
  )

  const showFreshness = freshness && freshness.level !== 'green'

  return (
    <div className="balance-position-hero">
      <button
        type="button"
        className="balance-position-hero-summary"
        aria-expanded={false}
        onClick={onExpand}
        disabled={readOnly}
      >
        <span className="balance-position-hero-copy">
          <span className="balance-position-hero-label-row">
            <span className="balance-position-hero-label">Cash Prophet Balance</span>
            {freshness ? (
              <span
                className={`overview-freshness-dot overview-freshness-dot--${freshness.level}`}
                title={`Current account: ${freshness.label}`}
                aria-label={`Current account ${freshness.label}`}
              />
            ) : null}
          </span>
          {showFreshness ? (
            <span
              className={`balance-position-hero-freshness balance-position-hero-freshness--${freshness.level}`}
            >
              {freshness.label}
            </span>
          ) : null}
          <span className="balance-position-hero-value">{formatCurrency(metrics.trueBalance)}</span>
          <span className="balance-position-hero-deltas" aria-label="Change this week and this month">
            <span
              className={`balance-position-delta${
                deltas.weekChange == null
                  ? ''
                  : deltas.weekChange > 0
                    ? ' balance-position-delta--up'
                    : deltas.weekChange < 0
                      ? ' balance-position-delta--down'
                      : ''
              }`}
            >
              {deltas.weekChange == null
                ? 'This week: —'
                : `${formatPositionChange(deltas.weekChange)} this week`}
            </span>
            <span className="balance-position-delta-sep" aria-hidden>
              ·
            </span>
            <span
              className={`balance-position-delta${
                deltas.monthChange == null
                  ? ''
                  : deltas.monthChange > 0
                    ? ' balance-position-delta--up'
                    : deltas.monthChange < 0
                      ? ' balance-position-delta--down'
                      : ''
              }`}
            >
              {deltas.monthChange == null
                ? 'This month: —'
                : `${formatPositionChange(deltas.monthChange)} this month`}
            </span>
          </span>
        </span>
        <span className="balance-position-hero-chevron" aria-hidden>
          ▾
        </span>
      </button>
    </div>
  )
}
