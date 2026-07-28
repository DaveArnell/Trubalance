import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
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

function primaryBreakdownColumns(columns: BreakdownColumn[]): BreakdownColumn[] {
  if (columns.length <= 1) return columns
  const rollup = columns.find((column) => column.isRollup)
  return rollup ? [rollup] : columns.slice(-1)
}

function childBreakdownLabel(viewScope?: ViewScope): string {
  if (viewScope?.type === 'group') return 'View by business'
  if (viewScope?.type === 'business') return 'View by venue'
  return 'View full breakdown'
}

/** Collapsed Cash Prophet Balance; expands to the account table (no duplicate hero). */
export function MobileOverview({
  metrics,
  state,
  viewScope,
  breakdownColumns = [],
  onBalanceSave,
}: MobileOverviewProps) {
  const editReadOnly = useEditReadOnly()
  const [balancesOpen, setBalancesOpen] = useState(false)
  const [childModalOpen, setChildModalOpen] = useState(false)
  const canExpand = Boolean(state && breakdownColumns.length > 0)

  const summaryColumns = useMemo(
    () => primaryBreakdownColumns(breakdownColumns),
    [breakdownColumns],
  )
  const hasChildBreakdown = breakdownColumns.length > 1

  const freshness = useMemo(() => {
    if (!state || !viewScope) return null
    return getScopeCurrentAccountFreshness(state, viewScope)
  }, [state, viewScope])

  const deltas = useMemo(() => {
    if (!state || !viewScope) return { weekChange: null, monthChange: null }
    return getBalancePositionDeltas(state, viewScope, metrics.trueBalance)
  }, [state, viewScope, metrics.trueBalance])

  const showFreshness = freshness && freshness.level !== 'green'

  if (balancesOpen && state && summaryColumns.length > 0) {
    return (
      <section className="mobile-overview mobile-overview--expanded" aria-label="Account balances">
        <div className="mobile-overview-expand-toolbar">
          <button
            type="button"
            className="overview-collapse-bar"
            onClick={() => setBalancesOpen(false)}
          >
            <span aria-hidden>▴</span>
            <span>Show Cash Prophet Balance</span>
          </button>
        </div>
        <div className="mobile-overview-breakdown">
          <BreakdownTable
            state={state}
            columns={summaryColumns}
            compact
            onBalanceSave={editReadOnly ? undefined : onBalanceSave}
          />
          {hasChildBreakdown ? (
            <button
              type="button"
              className="btn-secondary btn-tiny mobile-overview-breakdown-open"
              onClick={() => setChildModalOpen(true)}
            >
              {childBreakdownLabel(viewScope)}
            </button>
          ) : null}
        </div>

        {childModalOpen && breakdownColumns.length > 0
          ? createPortal(
              <div
                className="snapshot-correction-backdrop"
                onClick={() => setChildModalOpen(false)}
              >
                <div
                  className="snapshot-correction-modal mobile-overview-breakdown-modal"
                  role="dialog"
                  aria-modal="true"
                  aria-label={childBreakdownLabel(viewScope)}
                  onClick={(e) => e.stopPropagation()}
                >
                  <header className="mobile-overview-breakdown-modal-head">
                    <h2>{childBreakdownLabel(viewScope)}</h2>
                    <button
                      type="button"
                      className="btn-ghost btn-tiny"
                      onClick={() => setChildModalOpen(false)}
                    >
                      Close
                    </button>
                  </header>
                  <BreakdownTable
                    state={state}
                    columns={breakdownColumns}
                    compact
                    onBalanceSave={editReadOnly ? undefined : onBalanceSave}
                  />
                </div>
              </div>,
              document.body,
            )
          : null}
      </section>
    )
  }

  return (
    <section className="mobile-overview" aria-label="Cash Prophet Balance">
      <button
        type="button"
        className="mobile-overview-summary"
        aria-expanded={false}
        onClick={() => canExpand && setBalancesOpen(true)}
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
          <span className="mobile-overview-summary-value">{formatCurrency(metrics.trueBalance)}</span>
          <span className="mobile-overview-deltas">
            <span>
              {deltas.weekChange == null
                ? 'This week: —'
                : `${formatPositionChange(deltas.weekChange)} this week`}
            </span>
            <span aria-hidden> · </span>
            <span>
              {deltas.monthChange == null
                ? 'This month: —'
                : `${formatPositionChange(deltas.monthChange)} this month`}
            </span>
          </span>
        </span>
        {canExpand ? (
          <span className="mobile-overview-summary-hint" aria-hidden>
            ▾
          </span>
        ) : null}
      </button>
    </section>
  )
}
