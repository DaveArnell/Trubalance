import { useMemo, useState } from 'react'
import type { AppState, Commitment, CommitmentAccruingRow, ViewScope } from '../../types'
import { filterAccruingRowsForView, getScopeItemLabel } from '../../utils/scope'
import { getAccrualProgress } from '../../utils/commitmentCalculations'
import {
  sortAccruingRowsByNextDue,
  sortAccruingRowsBySortOrder,
} from '../../utils/accruingOrder'
import { chartColorForScope } from '../../utils/businessTheme'
import { formatCurrency } from '../../utils/format'
import { getReferenceDate } from '../../utils/referenceDate'
import { ordinalDay } from '../committed/shared'
import type { CommitmentViews } from '../../types'
import type { AccruingOrderMode } from '../../contexts/DashboardViewPreferencesContext'
import { getCommitmentScopeOptionsForView } from '../../utils/scope'
import { MobileRecordCard, MobileRecordList } from './MobileRecordList'
import { MobileAccruingDetailModal } from './MobileAccruingDetailModal'

interface MobileAccruingListProps {
  state: AppState
  viewScope: ViewScope
  commitmentViews: CommitmentViews
  orderMode?: AccruingOrderMode
  onSaveCommitment?: (id: string, patch: Partial<Commitment>) => void
  onSaveDueDay?: (commitment: Commitment, dueDayOfMonth: number) => void
  onDuplicateCommitment?: (id: string) => void
  onDeleteCommitment?: (id: string) => void
}

function accruingMeta(state: AppState, row: CommitmentAccruingRow) {
  const { commitment } = row
  const scope = getScopeItemLabel(state, commitment.scopeLevel, commitment.scopeId)
  const dueDay =
    commitment.dueDayOfMonth != null ? `Due ${ordinalDay(commitment.dueDayOfMonth)}` : null
  const kind = row.source === 'reserve' ? 'Reserve' : null
  return [kind, scope, dueDay].filter(Boolean).join(' · ')
}

function rowAccent(state: AppState, row: CommitmentAccruingRow): string {
  return chartColorForScope(state, {
    type: row.commitment.scopeLevel,
    id: row.commitment.scopeId,
  })
}

export function MobileAccruingList({
  state,
  viewScope,
  commitmentViews,
  orderMode = 'timeline',
  onSaveCommitment,
  onSaveDueDay,
  onDuplicateCommitment,
  onDeleteCommitment,
}: MobileAccruingListProps) {
  const [selected, setSelected] = useState<CommitmentAccruingRow | null>(null)
  const scopeOptions = useMemo(
    () => getCommitmentScopeOptionsForView(state, viewScope),
    [state, viewScope],
  )

  const rows = useMemo(() => {
    const filtered = filterAccruingRowsForView(commitmentViews.buildingUp, viewScope)
    if (orderMode === 'grouped') return sortAccruingRowsBySortOrder(filtered)
    return sortAccruingRowsByNextDue(filtered)
  }, [commitmentViews.buildingUp, viewScope, state, orderMode])

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
              accentColor={accent}
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
          scopeOptions={scopeOptions}
          onClose={() => setSelected(null)}
          onSave={
            onSaveCommitment
              ? (patch) => onSaveCommitment(selected.commitment.id, patch)
              : undefined
          }
          onSaveDueDay={onSaveDueDay}
          onDuplicate={
            onDuplicateCommitment && selected.source !== 'reserve'
              ? () => onDuplicateCommitment(selected.commitment.id)
              : undefined
          }
          onDelete={
            onDeleteCommitment && selected.source !== 'reserve'
              ? () => onDeleteCommitment(selected.commitment.id)
              : undefined
          }
        />
      ) : null}
    </>
  )
}
