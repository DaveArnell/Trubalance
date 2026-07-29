import { useMemo, useState } from 'react'
import type { BalanceSaveChange, BalanceSaveResult } from '../../hooks/useAppState'
import { useEditReadOnly } from '../../hooks/useEditReadOnly'
import type { AppState, DashboardMetrics, ViewScope } from '../../types'
import type { BreakdownColumn } from '../../utils/breakdownTable'
import { formatCurrency } from '../../utils/format'
import {
  formatPositionChange,
  getBalancePositionDeltas,
} from '../../utils/balancePositionDeltas'
import { getScopeCurrentAccountFreshness } from '../../utils/accountFreshness'
import { BreakdownTable } from '../BreakdownTable'

interface MobileOverviewProps {
  metrics: DashboardMetrics
  state?: AppState
  viewScope?: ViewScope
  breakdownColumns?: BreakdownColumn[]
  onBalanceSave?: (changes: BalanceSaveChange[]) => BalanceSaveResult
}

type MobileOverviewLevel = 'collapsed' | 'summary' | 'detailed'

function deltaClass(change: number | null): string {
  if (change == null || change === 0) return ''
  return change > 0 ? ' balance-position-delta--up' : ' balance-position-delta--down'
}

/**
 * Mobile Cash Prophet Balance strip.
 * collapsed → summary (Bank + CPB by scope) → detailed (full breakdown).
 * Collapsed header stays visible so CPB isn’t duplicated as a “Balances” banner.
 */
export function MobileOverview({
  metrics,
  state,
  viewScope,
  breakdownColumns = [],
  onBalanceSave,
}: MobileOverviewProps) {
  const editReadOnly = useEditReadOnly()
  const [level, setLevel] = useState<MobileOverviewLevel>('collapsed')
  const canExpand = Boolean(state && breakdownColumns.length > 0)
  const open = level !== 'collapsed'

  const freshness = useMemo(() => {
    if (!state || !viewScope) return null
    return getScopeCurrentAccountFreshness(state, viewScope)
  }, [state, viewScope])

  const deltas = useMemo(() => {
    if (!state || !viewScope) return { weekChange: null, monthChange: null }
    return getBalancePositionDeltas(state, viewScope, metrics.trueBalance)
  }, [state, viewScope, metrics.trueBalance])

  const showFreshness = freshness && freshness.level !== 'green'

  const weekLabel =
    deltas.weekChange == null
      ? 'Week: —'
      : `${formatPositionChange(deltas.weekChange)} week`
  const monthLabel =
    deltas.monthChange == null
      ? 'Month: —'
      : `${formatPositionChange(deltas.monthChange)} month`

  const cyclePrimary = () => {
    if (!canExpand) return
    setLevel((prev) => (prev === 'collapsed' ? 'summary' : 'collapsed'))
  }

  return (
    <section
      className={`mobile-overview${open ? ' mobile-overview--expanded' : ''}${
        level === 'detailed' ? ' mobile-overview--detailed' : ''
      }`}
      aria-label="Cash Prophet Balance"
    >
      <button
        type="button"
        className="mobile-overview-summary"
        aria-expanded={open}
        onClick={cyclePrimary}
      >
        <span className="mobile-overview-summary-text">
          <span className="mobile-overview-summary-label-row">
            <span className="mobile-overview-summary-label">Cash Prophet Balance</span>
            {freshness ? (
              <span
                className={`overview-freshness-dot overview-freshness-dot--${freshness.level} mobile-overview-freshness-dot`}
                title={`Current account: ${freshness.label}`}
                aria-label={`Current account ${freshness.label}`}
              />
            ) : null}
          </span>
          {showFreshness ? (
            <span
              className={`mobile-overview-freshness mobile-overview-freshness--${freshness.level}`}
            >
              {freshness.label}
            </span>
          ) : null}
          <span className="mobile-overview-summary-value">
            {formatCurrency(metrics.trueBalance)}
          </span>
        </span>
        <span
          className="mobile-overview-deltas mobile-overview-deltas--aside"
          aria-label="Change this week and month"
        >
          <span className={`balance-position-delta${deltaClass(deltas.weekChange)}`}>
            {weekLabel}
          </span>
          <span className={`balance-position-delta${deltaClass(deltas.monthChange)}`}>
            {monthLabel}
          </span>
        </span>
        {canExpand ? (
          <span className="mobile-overview-summary-hint" aria-hidden>
            {open ? '▴' : '▾'}
          </span>
        ) : null}
      </button>

      {open && state && breakdownColumns.length > 0 ? (
        <div className="mobile-overview-breakdown">
          <BreakdownTable
            state={state}
            columns={breakdownColumns}
            compact
            density={level === 'detailed' ? 'detailed' : 'summary'}
            onBalanceSave={editReadOnly ? undefined : onBalanceSave}
          />
          <div className="mobile-overview-more-row">
            {level === 'summary' ? (
              <button
                type="button"
                className="btn-ghost btn-tiny mobile-overview-more-btn"
                onClick={() => setLevel('detailed')}
              >
                More detail
                <span aria-hidden> ▾</span>
              </button>
            ) : (
              <button
                type="button"
                className="btn-ghost btn-tiny mobile-overview-more-btn"
                onClick={() => setLevel('summary')}
              >
                Less detail
                <span aria-hidden> ▴</span>
              </button>
            )}
          </div>
        </div>
      ) : null}
    </section>
  )
}
