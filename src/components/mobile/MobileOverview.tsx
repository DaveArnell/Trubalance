import { useMemo, useState } from 'react'
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

/** Compact True Balance summary — expands to the same breakdown table as desktop. */
export function MobileOverview({
  metrics,
  state,
  viewScope,
  breakdownColumns = [],
  onBalanceSave,
}: MobileOverviewProps) {
  const editReadOnly = useEditReadOnly()
  const [balancesOpen, setBalancesOpen] = useState(false)
  const canExpand = Boolean(state && breakdownColumns.length > 0)

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
          <span className="mobile-overview-summary-label">True Balance</span>
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

      {balancesOpen && state && breakdownColumns.length > 0 && (
        <div className="mobile-overview-breakdown">
          <BreakdownTable
            state={state}
            columns={breakdownColumns}
            compact
            onBalanceSave={editReadOnly ? undefined : onBalanceSave}
          />
        </div>
      )}
    </section>
  )
}
