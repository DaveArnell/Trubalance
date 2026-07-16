import type { AppState, CommitmentAccruingRow, ViewScope } from '../../types'
import { filterAccruingRowsForView } from '../../utils/scope'
import { getAccruingRowDailyRate } from '../../utils/commitmentCalculations'
import { getScopeItemLabel } from '../../utils/scope'
import { formatCurrency } from '../../utils/format'
import { ordinalDay } from '../committed/shared'
import type { CommitmentViews } from '../../types'
import { MobileRecordCard, MobileRecordList } from './MobileRecordList'

interface MobileAccruingListProps {
  state: AppState
  viewScope: ViewScope
  commitmentViews: CommitmentViews
}

function accruingMeta(state: AppState, row: CommitmentAccruingRow) {
  const { commitment } = row
  const scope = getScopeItemLabel(state, commitment.scopeLevel, commitment.scopeId)
  const dueDay =
    commitment.dueDayOfMonth != null ? `Due ${ordinalDay(commitment.dueDayOfMonth)}` : null
  const perDay = formatCurrency(getAccruingRowDailyRate(row))
  return [scope, dueDay, `${perDay}/day`].filter(Boolean).join(' · ')
}

export function MobileAccruingList({ state, viewScope, commitmentViews }: MobileAccruingListProps) {
  const rows = filterAccruingRowsForView(commitmentViews.buildingUp, viewScope)

  if (rows.length === 0) {
    return <MobileRecordList emptyMessage="No monthly accruing costs in this view." />
  }

  return (
    <MobileRecordList>
      {rows.map((row) => (
        <MobileRecordCard
          key={`${row.source}-${row.commitment.id}-${row.reservePlannerId ?? ''}`}
          title={row.commitment.name}
          amount={formatCurrency(row.accruedAmount)}
          meta={accruingMeta(state, row)}
        >
          <p className="mobile-record-card-substat muted">
            {formatCurrency(row.commitment.amount)}/month accrued
          </p>
        </MobileRecordCard>
      ))}
    </MobileRecordList>
  )
}
