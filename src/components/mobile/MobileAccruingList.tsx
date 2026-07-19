import { useMemo, useState } from 'react'
import type { AppState, CommitmentAccruingRow, ViewScope } from '../../types'
import { filterAccruingRowsForView, getScopeItemLabel } from '../../utils/scope'
import {
  getAccrualCycle,
  getAccrualProgress,
} from '../../utils/commitmentCalculations'
import { chartColorForScope } from '../../utils/businessTheme'
import { formatCurrency } from '../../utils/format'
import { getReferenceDate } from '../../utils/referenceDate'
import { ordinalDay } from '../committed/shared'
import type { CommitmentViews } from '../../types'
import { MobileRecordCard, MobileRecordList } from './MobileRecordList'
import { MobileAccruingDetailModal } from './MobileAccruingDetailModal'

interface MobileAccruingListProps {
  state: AppState
  viewScope: ViewScope
  commitmentViews: CommitmentViews
}

function dateToKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Next due date for this accruing row — soonest upcoming first when sorting. */
function nextDueDateKey(row: CommitmentAccruingRow, referenceDate: Date): string {
  const dueDay = row.commitment.dueDayOfMonth ?? 28
  const cycle = getAccrualCycle(referenceDate, dueDay)
  return dateToKey(cycle.cycleEnd)
}

function sortByNextDue(rows: CommitmentAccruingRow[], referenceDate: Date): CommitmentAccruingRow[] {
  return [...rows].sort((a, b) => {
    const dueCmp = nextDueDateKey(a, referenceDate).localeCompare(nextDueDateKey(b, referenceDate))
    if (dueCmp !== 0) return dueCmp
    return a.commitment.name.localeCompare(b.commitment.name)
  })
}

function accruingMeta(state: AppState, row: CommitmentAccruingRow) {
  const { commitment } = row
  const scope = getScopeItemLabel(state, commitment.scopeLevel, commitment.scopeId)
  const dueDay =
    commitment.dueDayOfMonth != null ? `Due ${ordinalDay(commitment.dueDayOfMonth)}` : null
  return [scope, dueDay].filter(Boolean).join(' · ')
}

function rowAccent(state: AppState, row: CommitmentAccruingRow): string {
  return chartColorForScope(state, {
    type: row.commitment.scopeLevel,
    id: row.commitment.scopeId,
  })
}

export function MobileAccruingList({ state, viewScope, commitmentViews }: MobileAccruingListProps) {
  const [selected, setSelected] = useState<CommitmentAccruingRow | null>(null)

  const rows = useMemo(() => {
    const referenceDate = getReferenceDate()
    return sortByNextDue(
      filterAccruingRowsForView(commitmentViews.buildingUp, viewScope),
      referenceDate,
    )
  }, [commitmentViews.buildingUp, viewScope, state])

  if (rows.length === 0) {
    return <MobileRecordList emptyMessage="No monthly accruing costs in this view." />
  }

  const referenceDate = getReferenceDate()

  return (
    <>
      <MobileRecordList>
        {rows.map((row) => {
          const accent = rowAccent(state, row)
          const progress = getAccrualProgress(row.commitment, referenceDate)?.progress ?? 0
          return (
            <MobileRecordCard
              key={`${row.source}-${row.commitment.id}-${row.reservePlannerId ?? ''}`}
              title={row.commitment.name}
              amount={formatCurrency(row.accruedAmount)}
              amountSecondary={`/${formatCurrency(row.commitment.amount)} pm`}
              meta={accruingMeta(state, row)}
              progress={progress}
              progressColor={accent}
              onClick={() => setSelected(row)}
            />
          )
        })}
      </MobileRecordList>
      {selected ? (
        <MobileAccruingDetailModal
          state={state}
          row={selected}
          accentColor={rowAccent(state, selected)}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </>
  )
}
