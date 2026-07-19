import { useState } from 'react'
import type { BalanceSaveChange, BalanceSaveResult } from '../../hooks/useAppState'
import { useEditReadOnly } from '../../hooks/useEditReadOnly'
import type { AppState, DashboardMetrics } from '../../types'
import type { BreakdownColumn } from '../../utils/breakdownTable'
import { formatCurrency } from '../../utils/format'
import { BreakdownTable } from '../BreakdownTable'

interface MobileOverviewProps {
  metrics: DashboardMetrics
  state?: AppState
  breakdownColumns?: BreakdownColumn[]
  onBalanceSave?: (changes: BalanceSaveChange[]) => BalanceSaveResult
}

/** Compact True Balance summary — expands to the same breakdown table as desktop. */
export function MobileOverview({
  metrics,
  state,
  breakdownColumns = [],
  onBalanceSave,
}: MobileOverviewProps) {
  const editReadOnly = useEditReadOnly()
  const [balancesOpen, setBalancesOpen] = useState(false)
  const canExpand = Boolean(state && breakdownColumns.length > 0)

  return (
    <section className="mobile-overview" aria-label="True Balance">
      <button
        type="button"
        className="mobile-overview-summary"
        aria-expanded={balancesOpen}
        onClick={() => canExpand && setBalancesOpen((open) => !open)}
      >
        <span className="mobile-overview-summary-label">True Balance</span>
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
