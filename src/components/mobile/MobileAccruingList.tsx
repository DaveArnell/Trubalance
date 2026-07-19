import { useMemo, useState, type ReactNode } from 'react'
import type { AppState, Commitment, CommitmentAccruingRow, ViewScope } from '../../types'
import { filterAccruingRowsForView, getCardScopeMetaLabel, getCommitmentScopeOptionsForView } from '../../utils/scope'
import { getAccrualProgress } from '../../utils/commitmentCalculations'
import {
  sortAccruingRowsByNextDue,
  sortAccruingRowsBySortOrder,
} from '../../utils/accruingOrder'
import {
  buildMonthlyCostDisplayTree,
  type MonthlyCostDisplayNode,
} from '../../utils/monthlyCostGrouping'
import { chartColorForScope } from '../../utils/businessTheme'
import { formatCurrency } from '../../utils/format'
import { getReferenceDate } from '../../utils/referenceDate'
import { ordinalDay } from '../committed/shared'
import type { CommitmentViews } from '../../types'
import type { AccruingOrderMode } from '../../contexts/DashboardViewPreferencesContext'
import { MobileRecordCard, MobileRecordList, MobileSectionLabel } from './MobileRecordList'
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

function accruingScopeLabel(state: AppState, row: CommitmentAccruingRow) {
  return getCardScopeMetaLabel(state, row.commitment.scopeLevel, row.commitment.scopeId)
}

function accruingDetailMeta(row: CommitmentAccruingRow) {
  const { commitment } = row
  const dueDay =
    commitment.dueDayOfMonth != null ? `Due ${ordinalDay(commitment.dueDayOfMonth)}` : null
  const kind = row.source === 'reserve' ? 'Reserve' : null
  return [kind, dueDay].filter(Boolean).join(' · ') || undefined
}

function rowAccent(state: AppState, row: CommitmentAccruingRow): string {
  return chartColorForScope(state, {
    type: row.commitment.scopeLevel,
    id: row.commitment.scopeId,
  })
}

function AccruingCard({
  state,
  row,
  referenceDate,
  onSelect,
}: {
  state: AppState
  row: CommitmentAccruingRow
  referenceDate: Date
  onSelect: () => void
}) {
  const accent = rowAccent(state, row)
  const progress = getAccrualProgress(row.commitment, referenceDate)?.progress ?? 0
  return (
    <MobileRecordCard
      title={row.commitment.name}
      scopeLabel={accruingScopeLabel(state, row) ?? undefined}
      amount={formatCurrency(row.accruedAmount)}
      amountSecondary={`/${formatCurrency(row.commitment.amount)}`}
      meta={accruingDetailMeta(row)}
      progress={progress}
      progressColor={accent}
      accentColor={accent}
      onClick={onSelect}
    />
  )
}

function renderGroupedNodes(
  nodes: MonthlyCostDisplayNode[],
  state: AppState,
  referenceDate: Date,
  onSelect: (row: CommitmentAccruingRow) => void,
): ReactNode[] {
  const items: ReactNode[] = []

  for (const node of nodes) {
    if (node.type === 'leaf') {
      items.push(
        <AccruingCard
          key={`${node.row.source}-${node.row.commitment.id}-${node.row.reservePlannerId ?? ''}`}
          state={state}
          row={node.row}
          referenceDate={referenceDate}
          onSelect={() => onSelect(node.row)}
        />,
      )
      continue
    }

    items.push(
      <MobileSectionLabel key={node.id}>
        {node.name}
        {node.subtitle ? ` · ${node.subtitle}` : ''}
        {' · '}
        {formatCurrency(node.accruedTotal)} accrued
      </MobileSectionLabel>,
    )

    for (const child of node.children) {
      if (child.type === 'leaf') {
        items.push(
          <AccruingCard
            key={`${child.row.source}-${child.row.commitment.id}-${child.row.reservePlannerId ?? ''}`}
            state={state}
            row={child.row}
            referenceDate={referenceDate}
            onSelect={() => onSelect(child.row)}
          />,
        )
        continue
      }

      // Cards view: keep one name header only — don't nest Blackpool / Laser Tech sub-groups.
      for (const leaf of child.children) {
        items.push(
          <AccruingCard
            key={`${leaf.row.source}-${leaf.row.commitment.id}-${leaf.row.reservePlannerId ?? ''}`}
            state={state}
            row={leaf.row}
            referenceDate={referenceDate}
            onSelect={() => onSelect(leaf.row)}
          />,
        )
      }
    }
  }

  return items
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

  const filtered = useMemo(
    () => filterAccruingRowsForView(commitmentViews.buildingUp, viewScope),
    [commitmentViews.buildingUp, viewScope, state],
  )

  const referenceDate = getReferenceDate()

  const timelineRows = useMemo(
    () => sortAccruingRowsByNextDue(filtered, referenceDate),
    [filtered, referenceDate],
  )

  const groupedTree = useMemo(() => {
    if (orderMode !== 'grouped') return null
    const ordered = sortAccruingRowsBySortOrder(filtered)
    return buildMonthlyCostDisplayTree(state, ordered, viewScope)
  }, [orderMode, filtered, state, viewScope])

  if (filtered.length === 0) {
    return <MobileRecordList emptyMessage="No monthly accruing costs in this view." />
  }

  const listBody =
    orderMode === 'grouped' && groupedTree
      ? renderGroupedNodes(groupedTree, state, referenceDate, setSelected)
      : timelineRows.map((row) => (
          <AccruingCard
            key={`${row.source}-${row.commitment.id}-${row.reservePlannerId ?? ''}`}
            state={state}
            row={row}
            referenceDate={referenceDate}
            onSelect={() => setSelected(row)}
          />
        ))

  return (
    <>
      <MobileRecordList>{listBody}</MobileRecordList>
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
