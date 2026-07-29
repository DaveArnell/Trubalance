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
  expanded?: boolean
  onToggleExpanded?: () => void
}

/** Cash Prophet Balance hero with week / month change stacked underneath. */
export function BalancePositionHero({
  metrics,
  state,
  viewScope,
  expanded = false,
  onToggleExpanded,
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

  const weekLabel =
    deltas.weekChange == null
      ? 'This week: —'
      : `${formatPositionChange(deltas.weekChange)} this week`
  const monthLabel =
    deltas.monthChange == null
      ? 'This month: —'
      : `${formatPositionChange(deltas.monthChange)} this month`

  return (
    <div className="balance-position-hero">
      {onToggleExpanded ? (
        <button
          type="button"
          className="balance-position-expand-btn"
          aria-expanded={expanded}
          onClick={onToggleExpanded}
        >
          {expanded ? 'Less' : 'More'}
          <span aria-hidden>{expanded ? '▴' : '▾'}</span>
        </button>
      ) : null}
      <div className="balance-position-hero-copy">
        <div className="balance-position-hero-label-row">
          <span className="balance-position-hero-label">Cash Prophet Balance</span>
          {freshness ? (
            <span
              className={`overview-freshness-dot overview-freshness-dot--${freshness.level}`}
              title={`Current account: ${freshness.label}`}
              aria-label={`Current account ${freshness.label}`}
            />
          ) : null}
        </div>
        {showFreshness ? (
          <span
            className={`balance-position-hero-freshness balance-position-hero-freshness--${freshness.level}`}
          >
            {freshness.label}
          </span>
        ) : null}
        <span className="balance-position-hero-value">{formatCurrency(metrics.trueBalance)}</span>
        <div className="balance-position-hero-deltas" aria-label="Change this week and this month">
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
            {weekLabel}
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
            {monthLabel}
          </span>
        </div>
      </div>
    </div>
  )
}
