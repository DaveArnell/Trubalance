import { useMemo, useState } from 'react'
import type { AppState, GraphRange, ViewScope } from '../types'
import type { AppActions } from '../hooks/useAppState'
import { getScopeItemLabel } from '../utils/scope'
import { formatCurrency, getCurrencySymbol, stripCurrencyInput } from '../utils/format'
import { filterSnapshotsByRange } from '../utils/snapshots'
import { getEffectiveSnapshotsForScope } from '../utils/scopeSnapshotSeries'
import {
  computeTrendProjection,
  formatDaysUntil,
  formatProjectionDateLabel,
  formatTrendRate,
} from '../utils/trendProjection'
import { ForecastDailyIncomeCard } from './ForecastDailyIncomeCard'

interface TrendProjectionPanelProps {
  state: AppState
  viewScope: ViewScope
  graphRange: GraphRange
  embedded?: boolean
  actions?: Pick<AppActions, 'setBusinessForecastDailyIncome'>
}

function trendDirectionLabel(direction: 'rising' | 'falling' | 'flat') {
  if (direction === 'rising') return 'Rising'
  if (direction === 'falling') return 'Falling'
  return 'Flat'
}

export function TrendProjectionPanel({
  state,
  viewScope,
  graphRange,
  embedded = false,
  actions,
}: TrendProjectionPanelProps) {
  const [targetInput, setTargetInput] = useState('100000')

  const snapshots = useMemo(
    () =>
      filterSnapshotsByRange(getEffectiveSnapshotsForScope(state, viewScope, viewScope), graphRange),
    [graphRange, state, viewScope],
  )

  const targetValue = useMemo(() => {
    const raw = stripCurrencyInput(targetInput)
    const n = Number(raw)
    return Number.isFinite(n) ? n : 0
  }, [targetInput])

  const projection = useMemo(
    () => computeTrendProjection({ snapshots, targetValue }),
    [snapshots, targetValue],
  )

  const scopeLabel = getScopeItemLabel(state, viewScope.type, viewScope.id)

  const body = (
    <div className="trend-projection-body">
      {actions ? (
        <ForecastDailyIncomeCard
          compact
          state={state}
          viewScope={viewScope}
          actions={actions}
        />
      ) : null}
      {snapshots.length < 2 ? (
        <p className="trend-projection-empty muted">
          Record at least two balance snapshots to project a trend.
        </p>
      ) : projection ? (
        <div className="trend-projection-grid">
          <div className="trend-projection-kpi-card">
            <p className="trend-projection-kpi-label">Latest True Balance</p>
            <p className="trend-projection-kpi-value">{formatCurrency(projection.latestValue)}</p>
            <p className="trend-projection-kpi-meta muted">{scopeLabel}</p>
          </div>

          <div
            className={`trend-projection-kpi-card trend-projection-kpi-card--trend trend-projection-kpi-card--${projection.direction}`}
          >
            <p className="trend-projection-kpi-label">Trend rate</p>
            <p className="trend-projection-kpi-value">{formatTrendRate(projection.slopePerDay)}</p>
            <p className="trend-projection-kpi-meta">{trendDirectionLabel(projection.direction)}</p>
          </div>

          <label className="trend-projection-target-card">
            <span className="trend-projection-target-label">Target True Balance</span>
            <div className="trend-projection-target-input">
              <span className="trend-projection-currency">{getCurrencySymbol()}</span>
              <input
                type="text"
                inputMode="numeric"
                value={targetInput}
                onChange={(e) => setTargetInput(e.target.value)}
                aria-label="Target True Balance"
              />
            </div>
          </label>

          <div className="trend-projection-outcomes">
            {projection.targetReachable ? (
              <div className="trend-projection-outcome trend-projection-outcome--positive">
                <span className="trend-projection-outcome-label">Target {formatCurrency(targetValue)}</span>
                <span className="trend-projection-outcome-value">
                  {formatDaysUntil(projection.daysToTarget)}
                  {projection.targetReachDate ? (
                    <span className="trend-projection-outcome-date">
                      {' '}
                      · {formatProjectionDateLabel(projection.targetReachDate)}
                    </span>
                  ) : null}
                </span>
              </div>
            ) : (
              <div className="trend-projection-outcome trend-projection-outcome--muted">
                <span className="trend-projection-outcome-label">Target {formatCurrency(targetValue)}</span>
                <span className="trend-projection-outcome-value">Not reachable at this rate</span>
              </div>
            )}

            {projection.direction === 'falling' && projection.latestValue > 0 ? (
              projection.zeroReachable ? (
                <div className="trend-projection-outcome trend-projection-outcome--warning">
                  <span className="trend-projection-outcome-label">Reach zero</span>
                  <span className="trend-projection-outcome-value">
                    {formatDaysUntil(projection.daysToZero)}
                    {projection.zeroReachDate ? (
                      <span className="trend-projection-outcome-date">
                        {' '}
                        · {formatProjectionDateLabel(projection.zeroReachDate)}
                      </span>
                    ) : null}
                  </span>
                </div>
              ) : (
                <div className="trend-projection-outcome trend-projection-outcome--muted">
                  <span className="trend-projection-outcome-label">Reach zero</span>
                  <span className="trend-projection-outcome-value">Beyond practical horizon</span>
                </div>
              )
            ) : null}
          </div>
        </div>
      ) : (
        <p className="trend-projection-empty muted">Could not calculate a trend from the available snapshots.</p>
      )}

      <p className="trend-projection-footnote muted">
        Based on {snapshots.length} snapshot{snapshots.length === 1 ? '' : 's'} over the selected chart range.
        Assumes the recent rate continues.
      </p>
    </div>
  )

  if (embedded) {
    return (
      <div id="forecast-projection" className="forecast-projection-panel">
        <div className="forecast-projection-head">
          <h2 className="forecast-projection-title">Trend projection</h2>
          <p className="muted forecast-projection-lead">
            Extrapolates from saved balance history — assumes the recent rate continues.
          </p>
        </div>
        {body}
      </div>
    )
  }

  return (
    <section id="forecast-projection" className="card trend-projection-card">
      <div className="card-head card-head-compact">
        <h2>Trend projection</h2>
      </div>
      {body}
    </section>
  )
}
