import { useMemo } from 'react'
import type { AppState, DashboardMetrics, ViewScope } from '../types'
import type { OverviewSize } from '../hooks/useOverviewSize'
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
  expanded: boolean
  onToggleExpanded: () => void
  onUpdateBalances: () => void
  size?: OverviewSize
  readOnly?: boolean
}

/** Collapsed Cash Prophet Balance hero with week/month change; expands via parent. */
export function BalancePositionHero({
  metrics,
  state,
  viewScope,
  expanded,
  onToggleExpanded,
  onUpdateBalances,
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
    <div className={`balance-position-hero${expanded ? ' balance-position-hero--expanded' : ''}`}>
      <div className="balance-position-hero-main">
        <button
          type="button"
          className="balance-position-hero-summary"
          aria-expanded={expanded}
          onClick={onToggleExpanded}
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
              <span className={`balance-position-hero-freshness balance-position-hero-freshness--${freshness.level}`}>
                {freshness.label}
              </span>
            ) : null}
            <span className="balance-position-hero-value">
              {formatCurrency(metrics.trueBalance)}
            </span>
            {!expanded ? (
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
            ) : null}
          </span>
          <span className="balance-position-hero-chevron" aria-hidden>
            {expanded ? '▴' : '▾'}
          </span>
        </button>

        {!readOnly ? (
          <button type="button" className="btn-secondary btn-tiny balance-position-update-btn" onClick={onUpdateBalances}>
            Update balances
          </button>
        ) : null}
      </div>
    </div>
  )
}
