import { useCallback, useMemo } from 'react'
import type { AppState, CommitmentAccruingRow } from '../../types'
import type { AppActions } from '../../hooks/useAppState'
import { useSheetRowReorder } from '../../hooks/useSheetRowReorder'
import { formatCurrency } from '../../utils/format'
import {
  flattenMonthlyCostTree,
  type FlatMonthlyCostRow,
  type MonthlyCostDisplayNode,
  type MonthlyCostGroupNode,
} from '../../utils/monthlyCostGrouping'
import type { ScopeOption } from '../../utils/scope'
import type { SheetTabHandler } from '../../utils/sheetCellNavigation'
import {
  InlineDayCell,
  InlineNumberCell,
  InlineTextCell,
  ScopeSelectCell,
} from '../SheetInlineCells'
import {
  AccruedTodayCell,
  DailyAccrualCell,
  DismissibleCommitmentStatusDot,
  DuplicateRowButton,
  SheetDragCell,
} from './shared'
import { getMonthlyBudgetAmount } from '../../utils/commitmentCalculations'

interface MonthlyCostRowsProps {
  state: AppState
  rows: CommitmentAccruingRow[]
  displayTree: MonthlyCostDisplayNode[]
  collapsedGroups: Set<string>
  onToggleGroup: (id: string) => void
  scopeOptions: ScopeOption[]
  activeCell: string | null
  onActivate: (id: string) => void
  onDeactivate: () => void
  makeTabHandler: (cellId: string) => SheetTabHandler
  onSaveDueDay: (commitment: CommitmentAccruingRow['commitment'], dueDayOfMonth: number) => void
  actions: Pick<
    AppActions,
    | 'updateCommitment'
    | 'deleteCommitment'
    | 'duplicateCommitment'
    | 'reorderCommitments'
    | 'acknowledgeCommitmentDueAlert'
  >
  readOnly?: boolean
}

function groupTitle(node: MonthlyCostGroupNode) {
  return node.type === 'name-group' ? node.name : node.label
}

function GroupToggle({
  expanded,
  onClick,
  label,
}: {
  expanded: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      className="sheet-group-toggle"
      aria-expanded={expanded}
      aria-label={expanded ? `Collapse ${label}` : `Expand ${label}`}
      onClick={(event) => {
        event.stopPropagation()
        onClick()
      }}
    >
      {expanded ? '▾' : '▸'}
    </button>
  )
}

function MonthlyCostGroupRow({
  flat,
  collapsed,
  onToggle,
  readOnly,
}: {
  flat: Extract<FlatMonthlyCostRow, { kind: 'group' }>
  collapsed: boolean
  onToggle: (id: string) => void
  readOnly?: boolean
}) {
  const { node, depth } = flat
  const title = groupTitle(node)
  const isNameGroup = node.type === 'name-group'
  const rowClass = isNameGroup ? 'sheet-row-group sheet-row-group--name' : 'sheet-row-group sheet-row-group--scope'
  const fillClass = isNameGroup ? 'sheet-cell--group' : 'sheet-cell--business'

  return (
    <tr className={rowClass}>
      {!readOnly && <td className={`sheet-drag-col ${fillClass}`} />}
      <td
        className={`sheet-cell-readonly sheet-group-name ${fillClass}`}
        style={{ paddingLeft: `${6 + depth * 10}px` }}
      >
        <GroupToggle expanded={!collapsed} onClick={() => onToggle(node.id)} label={title} />
        <span className="sheet-cell-value sheet-group-title">{title}</span>
      </td>
      <td className={`committed-scope-col sheet-row-label ${fillClass}`}>
        <span className="sheet-group-meta">{node.subtitle}</span>
      </td>
      <td className={`sheet-cell-readonly sheet-row-label ${fillClass}`}>—</td>
      <td className={`sheet-num sheet-cell-readonly ${fillClass}`}>{formatCurrency(node.monthlyTotal)}</td>
      <td className={`sheet-num sheet-cell-computed sheet-col-emphasis ${fillClass}`}>
        {formatCurrency(node.accruedTotal)}
      </td>
      <td className={`sheet-num sheet-cell-computed ${fillClass}`}>{formatCurrency(node.dailyTotal)}</td>
      {!readOnly && <td className={`sheet-actions ${fillClass}`} />}
    </tr>
  )
}

function MonthlyCostLeafRow({
  state,
  row,
  depth,
  index,
  grouped,
  scopeOptions,
  activeCell,
  onActivate,
  onDeactivate,
  makeTabHandler,
  onSaveDueDay,
  actions,
  reorder,
  readOnly,
}: {
  state: AppState
  row: CommitmentAccruingRow
  depth: number
  index: number
  grouped: boolean
  scopeOptions: ScopeOption[]
  activeCell: string | null
  onActivate: (id: string) => void
  onDeactivate: () => void
  makeTabHandler: (cellId: string) => SheetTabHandler
  onSaveDueDay: MonthlyCostRowsProps['onSaveDueDay']
  actions: MonthlyCostRowsProps['actions']
  reorder: ReturnType<typeof useSheetRowReorder>
  readOnly?: boolean
}) {
  const item = row.commitment
  const rowProps = reorder.getRowProps(item.id, index)
  const isVenue = grouped && item.scopeLevel === 'venue'
  const rowClass = [
    grouped ? 'sheet-row-group-child' : '',
    isVenue ? 'sheet-row--venue' : grouped ? 'sheet-row--account' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const scopeFill = isVenue ? 'sheet-cell--venue' : grouped ? 'sheet-cell--business' : ''
  const namePadding = grouped ? { paddingLeft: `${6 + depth * 10}px` } : undefined

  return (
    <tr key={item.id} {...(readOnly ? {} : rowProps)} className={rowClass || undefined}>
      {!readOnly && (
      <SheetDragCell
        rowId={item.id}
        getHandleProps={reorder.getHandleProps}
        prefix={
          row.source === 'commitment' ? (
            <DismissibleCommitmentStatusDot
              commitment={item}
              onDismiss={() => actions.acknowledgeCommitmentDueAlert(item.id)}
            />
          ) : undefined
        }
      />
      )}
      <InlineTextCell
        cellId={`${item.id}-name`}
        value={item.name}
        isActive={activeCell === `${item.id}-name`}
        placeholder="Name"
        className={grouped ? `sheet-group-child-name${scopeFill ? ` ${scopeFill}` : ''}` : undefined}
        style={namePadding}
        onActivate={() => onActivate(`${item.id}-name`)}
        onDeactivate={onDeactivate}
        onSave={(name) => actions.updateCommitment(item.id, { name: name || 'Untitled' })}
        onTab={makeTabHandler(`${item.id}-name`)}
      />
      <ScopeSelectCell
        cellId={`${item.id}-scope`}
        state={state}
        scopeLevel={item.scopeLevel}
        scopeId={item.scopeId}
        options={scopeOptions}
        commitmentScope
        readOnly={readOnly}
        isActive={activeCell === `${item.id}-scope`}
        onActivate={() => onActivate(`${item.id}-scope`)}
        onDeactivate={onDeactivate}
        onChange={(scopeLevel, scopeId) => actions.updateCommitment(item.id, { scopeLevel, scopeId })}
        onTab={makeTabHandler(`${item.id}-scope`)}
        className={grouped ? scopeFill : undefined}
      />
      <InlineDayCell
        cellId={`${item.id}-day`}
        value={item.dueDayOfMonth ?? 28}
        isActive={activeCell === `${item.id}-day`}
        onActivate={() => onActivate(`${item.id}-day`)}
        onDeactivate={onDeactivate}
        onSave={(dueDayOfMonth) => onSaveDueDay(item, dueDayOfMonth)}
        onTab={makeTabHandler(`${item.id}-day`)}
      />
      <InlineNumberCell
        cellId={`${item.id}-amount`}
        value={getMonthlyBudgetAmount(item)}
        isActive={activeCell === `${item.id}-amount`}
        onActivate={() => onActivate(`${item.id}-amount`)}
        onDeactivate={onDeactivate}
        onSave={(amount) => actions.updateCommitment(item.id, { amount })}
        onTab={makeTabHandler(`${item.id}-amount`)}
      />
      <td className="sheet-num sheet-cell-computed sheet-col-emphasis">
        <AccruedTodayCell commitment={item} />
      </td>
      <td className="sheet-num sheet-cell-computed">
        <DailyAccrualCell row={row} />
      </td>
      {!readOnly && (
      <td className="sheet-actions">
        <div className="sheet-action-group">
          <DuplicateRowButton onClick={() => actions.duplicateCommitment(item.id)} />
          <button
            type="button"
            className="btn-danger btn-tiny"
            onClick={() => actions.deleteCommitment(item.id)}
          >
            ×
          </button>
        </div>
      </td>
      )}
    </tr>
  )
}

export function MonthlyCostRows({
  state,
  rows,
  displayTree,
  collapsedGroups,
  onToggleGroup,
  scopeOptions,
  activeCell,
  onActivate,
  onDeactivate,
  makeTabHandler,
  onSaveDueDay,
  actions,
  readOnly = false,
}: MonthlyCostRowsProps) {
  const flatRows = useMemo(
    () => flattenMonthlyCostTree(displayTree, collapsedGroups),
    [collapsedGroups, displayTree],
  )

  const leafIds = useMemo(
    () => flatRows.filter((row) => row.kind === 'leaf').map((row) => row.row.commitment.id),
    [flatRows],
  )

  const allMonthlyIds = useMemo(() => rows.map((row) => row.commitment.id), [rows])

  const handleReorder = useCallback(
    (visibleOrderedIds: string[]) => {
      const visibleSet = new Set(visibleOrderedIds)
      const rest = allMonthlyIds.filter((id) => !visibleSet.has(id))
      actions.reorderCommitments([...visibleOrderedIds, ...rest])
    },
    [actions, allMonthlyIds],
  )

  const reorder = useSheetRowReorder(leafIds, handleReorder)

  let leafIndex = 0

  return (
    <>
      {flatRows.map((flat) => {
        if (flat.kind === 'group') {
          return (
            <MonthlyCostGroupRow
              key={flat.node.id}
              flat={flat}
              collapsed={collapsedGroups.has(flat.node.id)}
              onToggle={onToggleGroup}
              readOnly={readOnly}
            />
          )
        }

        const index = leafIndex
        leafIndex += 1
        return (
          <MonthlyCostLeafRow
            key={flat.row.commitment.id}
            state={state}
            row={flat.row}
            depth={flat.depth}
            index={index}
            grouped={flat.depth > 0}
            scopeOptions={scopeOptions}
            activeCell={activeCell}
            onActivate={onActivate}
            onDeactivate={onDeactivate}
            makeTabHandler={makeTabHandler}
            onSaveDueDay={onSaveDueDay}
            actions={actions}
            reorder={reorder}
            readOnly={readOnly}
          />
        )
      })}
    </>
  )
}
