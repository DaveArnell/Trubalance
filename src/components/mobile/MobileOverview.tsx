import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import type { BalanceSaveChange, BalanceSaveResult } from '../../hooks/useAppState'
import { useEditReadOnly } from '../../hooks/useEditReadOnly'
import type { AppState, DashboardMetrics, ViewScope } from '../../types'
import type { BreakdownColumn } from '../../utils/breakdownTable'
import {
  getCurrentAccountFreshnessEntries,
  getWorstAccountFreshness,
} from '../../utils/accountFreshness'
import { formatCurrency } from '../../utils/format'
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

/** Compact True Balance summary — expands to this scope’s totals only. */
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
    const entries = getCurrentAccountFreshnessEntries(state, viewScope)
    if (entries.length === 0) return null
    const worst = getWorstAccountFreshness(entries)
    const worstEntry = entries.find((entry) => entry.freshness === worst) ?? entries[0]!
    return { worst, label: worstEntry.freshnessLabel }
  }, [state, viewScope])

  const showFreshness = freshness && freshness.worst !== 'green'

  return (
    <section className="mobile-overview" aria-label="True Balance">
      <button
        type="button"
        className="mobile-overview-summary"
        aria-expanded={balancesOpen}
        onClick={() => canExpand && setBalancesOpen((open) => !open)}
      >
        <span className="mobile-overview-summary-text">
          <span className="mobile-overview-summary-label-row">
            <span className="mobile-overview-summary-label">True Balance</span>
            {freshness ? (
              <span
                className={`overview-freshness-dot overview-freshness-dot--${freshness.worst} mobile-overview-freshness-dot`}
                title={`Current account: ${freshness.label}`}
                aria-label={`Current account ${freshness.label}`}
              />
            ) : null}
          </span>
          {showFreshness ? (
            <span
              className={`mobile-overview-freshness mobile-overview-freshness--${freshness.worst}`}
            >
              {freshness.label}
            </span>
          ) : null}
        </span>
        <span className="mobile-overview-summary-value">{formatCurrency(metrics.trueBalance)}</span>
        {canExpand && (
          <span className="mobile-overview-summary-hint" aria-hidden>
            {balancesOpen ? '▴' : '▾'}
          </span>
        )}
      </button>

      {balancesOpen && state && summaryColumns.length > 0 && (
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
      )}

      {childModalOpen && state && breakdownColumns.length > 0
        ? createPortal(
            <div
              className="snapshot-correction-backdrop"
              onClick={() => setChildModalOpen(false)}
            >
              <div
                className="snapshot-correction-modal mobile-overview-breakdown-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="mobile-overview-breakdown-title"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="mobile-overview-breakdown-modal-head">
                  <h3 id="mobile-overview-breakdown-title">True Balance breakdown</h3>
                  <button
                    type="button"
                    className="btn-ghost btn-tiny"
                    onClick={() => setChildModalOpen(false)}
                  >
                    Close
                  </button>
                </div>
                <div className="mobile-overview-breakdown-modal-body">
                  <BreakdownTable
                    state={state}
                    columns={breakdownColumns}
                    compact
                    onBalanceSave={editReadOnly ? undefined : onBalanceSave}
                  />
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </section>
  )
}
