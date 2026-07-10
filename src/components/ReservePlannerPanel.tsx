import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { AppState, ReserveBill, ReserveMonthConfirmation, ReservePlannerSummary, ViewScope } from '../types'
import { MONTHS, currentMonthIndex } from '../utils/format'
import {
  buildReserveGrid,
  computeReserveOperatingTransfer,
  getReserveTransferTargetForMonth,
  computeReserveMonthEndBalances,
  formatMonthlyNetTransfer,
  getBillDueDay,
  getBillTypeOptions,
  getPlannerOperatingAccount,
  getPlannerReserveAccount,
  getSuggestedOperatingBalanceForMonth,
  getReserveBalanceForTransfer,
  monthAmountsFromPatch,
  monthDueDaysFromPatch,
  NEW_BILL_TYPE,
  DEFAULT_RESERVE_BILL_DUE_DAY,
  type ReserveMonthEndBalance,
} from '../utils/reserveCalculations'
import { getReserveBillScopeOptionsForView } from '../utils/scope'
import type { AppActions } from '../hooks/useAppState'
import { useDemoReadOnly } from '../contexts/DemoModeContext'
import { useSheetRowReorder } from '../hooks/useSheetRowReorder'
import { formatCurrency, getCurrencySymbol } from '../utils/format'
import { ReservePlanChart } from './ReservePlanChart'
import { HelpButton } from './HelpButton'
import { WIDGET_HELP } from '../content/livingDashboard'
import { ReservePlannerEmptyState, ReservePlannerPicker } from './ReservePlannerEmptyState'
import { DuplicateRowButton, SheetDragCell, SheetDragHeader } from './committed/shared'
import {
  SheetColGroup,
  reserveSheetColumnsForMode,
  sheetTableWidthStyle,
} from './SheetResizableTable'
import { useResizableSheetColumns } from '../hooks/useResizableSheetColumns'

interface ReservePlannerPanelProps {
  state: AppState
  viewScope: ViewScope
  summary: ReservePlannerSummary | null
  reserveRouteId?: string | null
  actions: Pick<
    AppActions,
    | 'addReservePlanner'
    | 'updateReservePlanner'
    | 'deleteReservePlanner'
    | 'addReserveBill'
    | 'updateReserveBill'
    | 'deleteReserveBill'
    | 'duplicateReserveBill'
    | 'copyReservePlannerBillsFrom'
    | 'reorderReserveBills'
    | 'confirmReserveMonth'
    | 'markReserveBillUnpaid'
  >
  openHelp: string | null
  setOpenHelp: (id: string | null) => void
  onPlannerDeleted: (deletedId: string) => void
  onPlannerCreated: (plannerId: string) => void
}

function formatCellAmount(value: number) {
  return formatCurrency(value)
}

function getBillScopeOptions(state: AppState, businessId: string, viewScope: ViewScope) {
  return getReserveBillScopeOptionsForView(state, businessId, viewScope).map((option) => ({
    venueId: option.level === 'venue' ? option.id : undefined,
    label: option.label,
  }))
}

function ordinalDay(day: number) {
  if (day >= 11 && day <= 13) return `${day}th`
  const mod = day % 10
  if (mod === 1) return `${day}st`
  if (mod === 2) return `${day}nd`
  if (mod === 3) return `${day}rd`
  return `${day}th`
}

function currentMonthClass(isCurrentMonth: boolean, isConfirmed: boolean) {
  if (!isCurrentMonth) return ''
  return isConfirmed ? 'reserve-current-month reserve-current-month--confirmed' : 'reserve-current-month'
}

function ReserveMonthFlowBar({
  monthLabel,
  monthEnd,
  transferTarget,
  state,
  plannerId,
  confirmation,
  suggestedOperatingBalance,
  suggestedReserveBalance,
  onConfirm,
  compact = false,
  readOnly = false,
}: {
  monthLabel: string
  monthEnd: ReserveMonthEndBalance
  transferTarget: number
  state: AppState
  plannerId: string
  confirmation?: ReserveMonthConfirmation
  suggestedOperatingBalance: number
  suggestedReserveBalance: number
  onConfirm: (input: {
    balance: number
    operatingBalanceBefore?: number
    transferDone?: boolean
  }) => void
  compact?: boolean
  readOnly?: boolean
}) {
  const planner = state.reservePlanners.find((p) => p.id === plannerId)!
  const reserveAccount = getPlannerReserveAccount(state, planner)
  const operatingAccount = getPlannerOperatingAccount(state, planner)
  const reserveName = reserveAccount?.name ?? 'reserve'
  const operatingName = operatingAccount?.name ?? 'current account'
  const netTransfer = computeReserveOperatingTransfer(
    suggestedReserveBalance,
    transferTarget,
  )
  const transferLine = formatMonthlyNetTransfer(netTransfer, reserveName, operatingName)
  const needsTransfer = netTransfer.direction !== 'none'

  const [editing, setEditing] = useState(!confirmation)
  const [operatingDraft, setOperatingDraft] = useState(() =>
    confirmation?.operatingBalanceBefore != null
      ? String(confirmation.operatingBalanceBefore)
      : String(suggestedOperatingBalance),
  )
  const [reserveDraft, setReserveDraft] = useState(() =>
    confirmation ? String(confirmation.balance) : String(suggestedReserveBalance),
  )
  const [transferDone, setTransferDone] = useState(() => confirmation?.transferDone ?? !needsTransfer)
  const userEditedRef = useRef(false)

  useEffect(() => {
    if (confirmation) {
      userEditedRef.current = false
      return
    }
    if (userEditedRef.current) return
    setOperatingDraft(String(suggestedOperatingBalance))
    setReserveDraft(String(suggestedReserveBalance))
    setTransferDone(!needsTransfer)
  }, [confirmation, suggestedOperatingBalance, suggestedReserveBalance, needsTransfer])

  const isConfirmed = !!confirmation && !editing
  const parsedReserve = Number(reserveDraft)
  const canConfirm =
    !Number.isNaN(parsedReserve) && (!needsTransfer || transferDone)

  const openEdit = () => {
    userEditedRef.current = true
    setOperatingDraft(
      confirmation?.operatingBalanceBefore != null
        ? String(confirmation.operatingBalanceBefore)
        : String(suggestedOperatingBalance || ''),
    )
    setReserveDraft(confirmation ? String(confirmation.balance) : String(suggestedReserveBalance || ''))
    setTransferDone(confirmation?.transferDone ?? !needsTransfer)
    setEditing(true)
  }

  const submit = () => {
    if (!canConfirm) return
    const operatingParsed = Number(operatingDraft)
    onConfirm({
      balance: parsedReserve,
      operatingBalanceBefore: Number.isNaN(operatingParsed) ? undefined : operatingParsed,
      transferDone: needsTransfer ? transferDone : true,
    })
    setEditing(false)
  }

  const tone = isConfirmed ? 'done' : needsTransfer ? 'pending' : 'neutral'

  return (
    <div
      className={`reserve-month-flow-bar reserve-month-flow-bar--${tone}${compact ? ' reserve-month-flow-bar--compact' : ''}`}
    >
      {!compact && <span className="reserve-month-flow-bar-month">{monthLabel}</span>}
      {isConfirmed ? (
        <>
          <div className="reserve-month-flow-summary">
            <span className="reserve-month-flow-done-mark">✓</span>
            <span className="reserve-month-flow-summary-text">
              {transferLine}
              {confirmation.operatingBalanceBefore != null && (
                <> · Current {formatCellAmount(confirmation.operatingBalanceBefore)}</>
              )}
              {' · Reserve '}
              {formatCellAmount(confirmation.balance)}
              {monthEnd.variance !== null && Math.abs(monthEnd.variance) >= 0.5 && (
                <span className="reserve-month-flow-variance">
                  {' '}
                  ({monthEnd.variance > 0 ? '+' : ''}
                  {formatCellAmount(monthEnd.variance)} vs plan)
                </span>
              )}
            </span>
          </div>
          <button
            type="button"
            className="btn-ghost btn-tiny reserve-month-flow-adjust"
            onClick={openEdit}
            disabled={readOnly}
          >
            Adjust
          </button>
        </>
      ) : readOnly ? (
        <p className={`reserve-month-flow-transfer reserve-month-flow-transfer--${netTransfer.direction}`}>
          {transferLine}
        </p>
      ) : (
        <>
          <label className="reserve-month-flow-field">
            <span>Current</span>
            <input
              className="sheet-input reserve-month-flow-input"
              type="number"
              step="0.01"
              placeholder={getCurrencySymbol()}
              value={operatingDraft}
              onChange={(e) => {
                userEditedRef.current = true
                setOperatingDraft(e.target.value)
              }}
            />
          </label>
          <p className={`reserve-month-flow-transfer reserve-month-flow-transfer--${netTransfer.direction}`}>
            {transferLine}
          </p>
          {needsTransfer && (
            <label className="reserve-month-flow-check">
              <input
                type="checkbox"
                checked={transferDone}
                onChange={(e) => setTransferDone(e.target.checked)}
              />
              <span>Transfer done</span>
            </label>
          )}
          <label className="reserve-month-flow-field">
            <span>Reserve</span>
            <input
              className="sheet-input reserve-month-flow-input"
              type="number"
              step="0.01"
              placeholder={getCurrencySymbol()}
              value={reserveDraft}
              onChange={(e) => {
                userEditedRef.current = true
                setReserveDraft(e.target.value)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  submit()
                }
              }}
            />
          </label>
          <button
            type="button"
            className="btn-primary btn-tiny reserve-month-flow-confirm"
            disabled={!canConfirm}
            onClick={submit}
          >
            Confirm {compact ? monthLabel : ''}
          </button>
        </>
      )}
    </div>
  )
}

function ReserveBalanceCell({
  monthEnd,
  currentMonthIdx,
  currentActualBalance,
  onAdjustCurrentBalance,
}: {
  monthEnd: ReserveMonthEndBalance
  currentMonthIdx: number
  currentActualBalance?: number
  onAdjustCurrentBalance?: (balance: number) => void
}) {
  const isCurrentMonth = monthEnd.monthIndex === currentMonthIdx
  const isConfirmed = !!monthEnd.confirmation
  const planned = monthEnd.targetBalance
  const actual = monthEnd.confirmation
    ? monthEnd.confirmation.balance
    : isCurrentMonth
      ? currentActualBalance
      : null
  const showBoth = actual != null && Math.abs(actual - planned) >= 0.5
  const className = [
    'reserve-balance-cell',
    currentMonthClass(isCurrentMonth, isConfirmed),
    monthEnd.isLowestMonth ? 'reserve-lowest-month' : '',
    isConfirmed ? 'reserve-balance-confirmed' : '',
    monthEnd.variance !== null && Math.abs(monthEnd.variance) >= 0.5 ? 'reserve-balance-variance' : '',
    monthEnd.targetBalance < 0 ? 'reserve-balance-negative' : '',
    isCurrentMonth && onAdjustCurrentBalance ? 'reserve-balance-cell--editable' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const displayBalance = actual ?? planned
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!editing) return
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [editing])

  if (isCurrentMonth && onAdjustCurrentBalance) {
    if (editing) {
      return (
        <td className={`${className} sheet-cell-active`}>
          <input
            ref={inputRef}
            className="sheet-input reserve-balance-input"
            type="number"
            step="0.01"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => {
              const parsed = Number(draft)
              if (!Number.isNaN(parsed)) onAdjustCurrentBalance(parsed)
              setEditing(false)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.currentTarget.blur()
              if (e.key === 'Escape') setEditing(false)
            }}
          />
        </td>
      )
    }

    return (
      <td
        className={className}
        title={`${formatCellAmount(displayBalance)} — click to update actual reserve balance for this month`}
        onClick={() => {
          setDraft(String(displayBalance ?? ''))
          setEditing(true)
        }}
      >
        {showBoth ? (
          <>
            <span className="reserve-balance-actual">{formatCellAmount(actual!)}</span>
            <span className="reserve-balance-planned muted">plan {formatCellAmount(planned)}</span>
          </>
        ) : (
          <span className="reserve-balance-target">{formatCellAmount(displayBalance)}</span>
        )}
      </td>
    )
  }

  return (
    <td className={className} title={formatCellAmount(displayBalance)}>
      {showBoth ? (
        <>
          <span className="reserve-balance-actual">{formatCellAmount(actual!)}</span>
          <span className="reserve-balance-planned muted">plan {formatCellAmount(planned)}</span>
        </>
      ) : (
        <span className="reserve-balance-target">{formatCellAmount(displayBalance)}</span>
      )}
    </td>
  )
}

function EditableReserveMonthCell({
  cellId,
  amount,
  dueDay,
  isActive,
  initialEditMode = 'amount',
  isCurrentMonth,
  isCurrentMonthConfirmed = false,
  onActivate,
  onActivateDue,
  onDeactivate,
  onSave,
}: {
  cellId: string
  amount: number | null
  dueDay: number | null
  isActive: boolean
  initialEditMode?: 'amount' | 'due'
  isCurrentMonth: boolean
  isCurrentMonthConfirmed?: boolean
  onActivate: () => void
  onActivateDue: () => void
  onDeactivate: () => void
  onSave: (amount: number | null, dueDay: number | null) => void
}) {
  const cellRef = useRef<HTMLTableCellElement>(null)
  const amountRef = useRef<HTMLInputElement>(null)
  const dueRef = useRef<HTMLInputElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const [amountDraft, setAmountDraft] = useState('')
  const [dayDraft, setDayDraft] = useState(String(DEFAULT_RESERVE_BILL_DUE_DAY))
  const [panelPos, setPanelPos] = useState({ top: 0, left: 0 })
  const wasActiveRef = useRef(false)

  useEffect(() => {
    if (isActive && !wasActiveRef.current) {
      setAmountDraft(amount != null ? String(amount) : '')
      setDayDraft(String(dueDay ?? DEFAULT_RESERVE_BILL_DUE_DAY))
    }
    wasActiveRef.current = isActive
  }, [isActive, amount, dueDay])

  const commit = () => {
    const trimmed = amountDraft.trim()
    if (!trimmed) {
      onSave(null, null)
      onDeactivate()
      return
    }
    const parsed = Number(trimmed)
    if (Number.isNaN(parsed) || parsed === 0) {
      onSave(null, null)
    } else {
      const day = Math.min(31, Math.max(1, Number(dayDraft) || DEFAULT_RESERVE_BILL_DUE_DAY))
      onSave(parsed, day)
    }
    onDeactivate()
  }

  const updatePanelPos = () => {
    if (!cellRef.current) return
    const rect = cellRef.current.getBoundingClientRect()
    const panelWidth = popoverRef.current?.offsetWidth ?? 112
    const left = Math.max(
      8,
      Math.min(rect.left + rect.width / 2 - panelWidth / 2, window.innerWidth - panelWidth - 8),
    )
    setPanelPos({ top: rect.bottom + 4, left })
  }

  useLayoutEffect(() => {
    if (!isActive) return
    updatePanelPos()
    requestAnimationFrame(updatePanelPos)
  }, [isActive])

  useEffect(() => {
    if (!isActive) return
    const field = initialEditMode === 'due' ? dueRef.current : amountRef.current
    field?.focus()
    field?.select()
  }, [isActive, initialEditMode])

  useEffect(() => {
    if (!isActive) return

    const onLayout = () => updatePanelPos()
    window.addEventListener('resize', onLayout)
    window.addEventListener('scroll', onLayout, true)

    const close = (e: MouseEvent) => {
      const target = e.target as Node
      if (cellRef.current?.contains(target) || popoverRef.current?.contains(target)) return
      commit()
    }
    document.addEventListener('mousedown', close)

    return () => {
      window.removeEventListener('resize', onLayout)
      window.removeEventListener('scroll', onLayout, true)
      document.removeEventListener('mousedown', close)
    }
  }, [isActive, amountDraft, dayDraft])

  const className = [
    'sheet-cell-editable',
    'reserve-month-cell',
    currentMonthClass(isCurrentMonth, isCurrentMonthConfirmed),
    isActive ? 'sheet-cell-active' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const popover =
    isActive &&
    createPortal(
      <div
        ref={popoverRef}
        className="reserve-month-popover"
        style={{ top: panelPos.top, left: panelPos.left }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <label className="reserve-month-popover-field">
          <span>Amount</span>
          <input
            ref={amountRef}
            className="reserve-month-popover-input"
            type="number"
            step="0.01"
            value={amountDraft}
            onChange={(e) => setAmountDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                commit()
              }
              if (e.key === 'Tab' && !e.shiftKey) {
                e.preventDefault()
                dueRef.current?.focus()
                dueRef.current?.select()
              }
              if (e.key === 'Escape') onDeactivate()
            }}
          />
        </label>
        <label className="reserve-month-popover-field">
          <span>Due day</span>
          <input
            ref={dueRef}
            className="reserve-month-popover-input"
            type="number"
            min={1}
            max={31}
            value={dayDraft}
            onChange={(e) => setDayDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                commit()
              }
              if (e.key === 'Escape') onDeactivate()
            }}
          />
        </label>
      </div>,
      document.body,
    )

  return (
    <td
      ref={cellRef}
      className={className}
      onClick={() => {
        if (!isActive) onActivate()
      }}
      title={
        amount !== null
          ? `${formatCellAmount(amount)} · due ${ordinalDay(dueDay ?? DEFAULT_RESERVE_BILL_DUE_DAY)}`
          : 'Click to enter amount and due day'
      }
      data-cell-id={cellId}
    >
      {amount !== null && (
        <>
          <span className="sheet-cell-value">{formatCellAmount(amount)}</span>
          <button
            type="button"
            className="reserve-due-day-tag"
            onClick={(e) => {
              e.stopPropagation()
              if (isActive) {
                dueRef.current?.focus()
                dueRef.current?.select()
              } else {
                onActivateDue()
              }
            }}
          >
            {ordinalDay(dueDay ?? DEFAULT_RESERVE_BILL_DUE_DAY)}
          </button>
        </>
      )}
      {popover}
    </td>
  )
}

function BillScopeCell({
  cellId,
  state,
  businessId,
  viewScope,
  bill,
  readOnly,
  isActive,
  onActivate,
  onDeactivate,
  onScopeChange,
}: {
  cellId: string
  state: AppState
  businessId: string
  viewScope: ViewScope
  bill: ReserveBill
  readOnly?: boolean
  isActive: boolean
  onActivate: () => void
  onDeactivate: () => void
  onScopeChange: (venueId: string | undefined) => void
}) {
  const selectRef = useRef<HTMLSelectElement>(null)
  const options = getBillScopeOptions(state, businessId, viewScope)
  const displayOnly = readOnly || options.length <= 1
  const label =
    options.find((option) => (option.venueId ?? '') === (bill.venueId ?? ''))?.label ?? options[0]?.label ?? '—'

  useEffect(() => {
    if (!isActive || displayOnly) return
    selectRef.current?.focus()
    try {
      selectRef.current?.showPicker?.()
    } catch {
      /* showPicker not supported */
    }
  }, [displayOnly, isActive])

  if (displayOnly) {
    return (
      <td className="reserve-scope-col sheet-row-label">
        <span className="reserve-scope-label" title={label}>
          {label}
        </span>
      </td>
    )
  }

  const className = [
    'reserve-scope-col',
    'sheet-row-label',
    'sheet-cell-editable',
    isActive ? 'sheet-cell-active' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <td
      className={className}
      onClick={!isActive ? onActivate : undefined}
      title={label}
      data-cell-id={cellId}
    >
      {isActive ? (
        <select
          ref={selectRef}
          className="sheet-cell-full-select"
          value={bill.venueId ?? ''}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => {
            onScopeChange(e.target.value ? e.target.value : undefined)
            onDeactivate()
          }}
          onBlur={onDeactivate}
          onKeyDown={(e) => {
            if (e.key === 'Escape') onDeactivate()
          }}
        >
          {options.map((option) => (
            <option key={option.venueId ?? '__business'} value={option.venueId ?? ''}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <span className="sheet-cell-value reserve-scope-label">{label}</span>
      )}
    </td>
  )
}

function BillTypeCell({
  cellId,
  bill,
  options,
  isActive,
  onActivate,
  onDeactivate,
  onRename,
}: {
  cellId: string
  bill: ReserveBill
  options: string[]
  isActive: boolean
  onActivate: () => void
  onDeactivate: () => void
  onRename: (name: string) => void
}) {
  const selectRef = useRef<HTMLSelectElement>(null)
  const [addingNew, setAddingNew] = useState(false)
  const [customName, setCustomName] = useState('')

  useEffect(() => {
    if (!isActive || addingNew) return
    selectRef.current?.focus()
    try {
      selectRef.current?.showPicker?.()
    } catch {
      /* showPicker not supported */
    }
  }, [isActive, addingNew])

  if (addingNew) {
    return (
      <td className="sheet-row-label reserve-bill-col reserve-bill-label sheet-cell-active">
        <input
          className="sheet-input"
          placeholder="New bill type"
          value={customName}
          autoFocus
          onChange={(e) => setCustomName(e.target.value)}
          onBlur={() => {
            const name = customName.trim()
            if (name) onRename(name)
            setAddingNew(false)
            setCustomName('')
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur()
            if (e.key === 'Escape') {
              setAddingNew(false)
              setCustomName('')
            }
          }}
        />
      </td>
    )
  }

  const className = [
    'sheet-row-label',
    'reserve-bill-col',
    'sheet-cell-editable',
    isActive ? 'sheet-cell-active' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <td
      className={className}
      onClick={!isActive ? onActivate : undefined}
      title={bill.name}
      data-cell-id={cellId}
    >
      {isActive ? (
        <select
          ref={selectRef}
          className="sheet-cell-full-select"
          value={bill.name}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => {
            if (e.target.value === NEW_BILL_TYPE) {
              setAddingNew(true)
              onDeactivate()
            } else {
              onRename(e.target.value)
              onDeactivate()
            }
          }}
          onBlur={onDeactivate}
          onKeyDown={(e) => {
            if (e.key === 'Escape') onDeactivate()
          }}
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
          <option value={NEW_BILL_TYPE}>+ Add new…</option>
        </select>
      ) : (
        <span className="sheet-cell-value">{bill.name}</span>
      )}
    </td>
  )
}

export function ReservePlannerPanel({
  state,
  viewScope,
  summary,
  reserveRouteId = null,
  actions,
  openHelp,
  setOpenHelp,
  onPlannerDeleted,
  onPlannerCreated,
}: ReservePlannerPanelProps) {
  const demoReadOnly = useDemoReadOnly()
  const [activeCell, setActiveCell] = useState<string | null>(null)
  const sheetWrapRef = useRef<HTMLDivElement>(null)
  const sheetColumns = useMemo(() => reserveSheetColumnsForMode(demoReadOnly), [demoReadOnly])
  const { widths: columnWidths } = useResizableSheetColumns(
    sheetWrapRef,
    sheetColumns,
    'reserve-planner',
  )
  const activateCell = (cellId: string) => {
    if (demoReadOnly) return
    setActiveCell(cellId)
  }
  const [showCreateForm, setShowCreateForm] = useState(false)
  const currentMonthIdx = currentMonthIndex()
  const planner = summary?.planner
  const bills = planner?.bills ?? []
  const grid = useMemo(() => buildReserveGrid(bills), [bills])
  const billRowIds = useMemo(() => grid.rows.map((row) => row.billId), [grid.rows])
  const billReorder = useSheetRowReorder(billRowIds, (orderedIds) => {
    if (planner) actions.reorderReserveBills(planner.id, orderedIds)
  })

  const otherPlanners = useMemo(
    () => {
      const currentId = summary?.planner?.id
      if (!currentId) return []
      return state.reservePlanners
        .filter((p) => p.id !== currentId)
        .map((p) => {
          const business = state.businesses.find((b) => b.id === p.businessId)
          return { id: p.id, label: p.name || business?.name || 'Reserve plan', billCount: p.bills.length }
        })
    },
    [state.reservePlanners, state.businesses, summary?.planner?.id],
  )

  if (!summary || !planner) {
    if (state.reservePlanners.length === 0 || showCreateForm || reserveRouteId === 'new') {
      return (
        <ReservePlannerEmptyState
          state={state}
          actions={actions}
          openHelp={openHelp}
          setOpenHelp={setOpenHelp}
          onPlannerCreated={(id) => {
            setShowCreateForm(false)
            onPlannerCreated(id)
          }}
        />
      )
    }

    return (
      <ReservePlannerPicker
        state={state}
        onSelect={onPlannerCreated}
        onAddNew={() => setShowCreateForm(true)}
      />
    )
  }

  const { businessName } = summary
  const monthEndBalances = computeReserveMonthEndBalances(planner)
  const billTypeOptions = getBillTypeOptions(state)
  const currentMonthEnd = monthEndBalances[currentMonthIdx]!
  const currentMonthLabel = MONTHS[currentMonthIdx]!
  const isCurrentMonthConfirmed = !!currentMonthEnd.confirmation
  const suggestedOperatingBalance = getSuggestedOperatingBalanceForMonth(
    state,
    planner,
    currentMonthIdx,
  )
  const suggestedReserveBalance = getReserveBalanceForTransfer(state, planner, currentMonthIdx)
  const currentMonthTransferTarget = getReserveTransferTargetForMonth(
    monthEndBalances,
    currentMonthIdx,
  )

  const copyFromPlanner = (sourcePlannerId: string) => {
    const source = state.reservePlanners.find((p) => p.id === sourcePlannerId)
    if (!source || source.bills.length === 0) return
    const mode =
      bills.length === 0
        ? 'replace'
        : window.confirm(
            `Copy ${source.bills.length} bill${source.bills.length === 1 ? '' : 's'} from "${source.name}"?\n\nOK replaces your current bills.\nCancel adds them alongside.`,
          )
          ? 'replace'
          : 'append'
    actions.copyReservePlannerBillsFrom(planner.id, sourcePlannerId, mode)
  }

  const saveMonthAmount = (
    bill: ReserveBill,
    month: string,
    value: number | null,
    dueDay: number | null,
  ) => {
    const monthAmounts = monthAmountsFromPatch(bill.monthAmounts, month, value)
    const monthDueDays = monthDueDaysFromPatch(bill.monthDueDays ?? {}, month, value, dueDay ?? undefined)
    actions.updateReserveBill(planner.id, bill.id, { monthAmounts, monthDueDays })
    setActiveCell(null)
  }

  return (
    <section id="reserve-planner" className="card reserve-box card-scroll">
      <div className="card-head card-head-compact">
        <div>
          <h2 className="reserve-planner-business-heading">{businessName || planner.name}</h2>
          {businessName && (
            <input
              className="planner-name-input planner-name-input--compact planner-name-input--subtitle"
              value={planner.name}
              onChange={(e) => actions.updateReservePlanner(planner.id, { name: e.target.value })}
              aria-label="Reserve plan label"
              readOnly={demoReadOnly}
            />
          )}
        </div>
        <div className="card-actions">
          {!demoReadOnly && (
          <button
            type="button"
            className="btn-ghost btn-tiny reserve-delete-btn"
            onClick={() => {
              if (
                window.confirm(
                  `Delete "${planner.name}"? Bills from this plan will no longer appear in Due.`,
                )
              ) {
                actions.deleteReservePlanner(planner.id)
                onPlannerDeleted(planner.id)
              }
            }}
          >
            Delete plan
          </button>
          )}
          <HelpButton
            id="reserve"
            openHelp={openHelp}
            setOpenHelp={setOpenHelp}
            text={WIDGET_HELP.reservePlanner}
          />
        </div>
      </div>

      <div className="card-scroll-body">
      <div className="reserve-planner-block reserve-planner-block--solo">
            <div className="reserve-planner-top">
              <div className="reserve-planner-top-metrics" data-tour="reserve-planner-buffer">
                <label className="reserve-buffer-field">
                  <span>Buffer</span>
                  <input
                    className="sheet-input sheet-input--compact"
                    type="number"
                    step="0.01"
                    value={planner.bufferAmount}
                    onChange={(e) =>
                      actions.updateReservePlanner(planner.id, { bufferAmount: Number(e.target.value) })
                    }
                    title="The reserve should not drop below this amount across the year"
                    readOnly={demoReadOnly}
                  />
                </label>
                <div
                  className="reserve-transfer-field"
                  data-tour="reserve-planner-transfer"
                  title="Fixed amount to move into reserve each month (annual bills ÷ 12)"
                >
                  <span>Monthly transfer</span>
                  <p className="reserve-monthly-transfer">
                    <strong>{formatCurrency(grid.totalMonthly)}</strong>
                  </p>
                </div>
              </div>

              <div className="reserve-planner-top-confirm" data-tour="reserve-planner-month">
                <ReserveMonthFlowBar
                  compact
                  monthLabel={currentMonthLabel}
                  monthEnd={currentMonthEnd}
                  transferTarget={currentMonthTransferTarget}
                  state={state}
                  plannerId={planner.id}
                  confirmation={currentMonthEnd.confirmation}
                  suggestedOperatingBalance={suggestedOperatingBalance}
                  suggestedReserveBalance={suggestedReserveBalance}
                  onConfirm={(input) =>
                    actions.confirmReserveMonth(planner.id, currentMonthEnd.month, input)
                  }
                  readOnly={demoReadOnly}
                />
              </div>

              <div className="reserve-planner-top-actions" data-tour="reserve-planner-bills">
                {!demoReadOnly && otherPlanners.length > 0 && (
                  <select
                    className="reserve-copy-from-select"
                    defaultValue=""
                    aria-label="Copy bills from another plan"
                    onChange={(e) => {
                      const sourceId = e.target.value
                      if (sourceId) {
                        copyFromPlanner(sourceId)
                        e.target.value = ''
                      }
                    }}
                  >
                    <option value="">Copy from…</option>
                    {otherPlanners.map((item) => (
                      <option key={item.id} value={item.id} disabled={item.billCount === 0}>
                        {item.label}
                        {item.billCount === 0 ? ' (empty)' : ` (${item.billCount})`}
                      </option>
                    ))}
                  </select>
                )}
                {!demoReadOnly && (
                <button
                  type="button"
                  className="btn-secondary btn-tiny"
                  onClick={() =>
                    actions.addReserveBill({
                      plannerId: planner.id,
                      name: billTypeOptions[0] ?? 'VAT',
                      monthAmounts: {},
                    })
                  }
                >
                  + Add bill row
                </button>
                )}
              </div>
            </div>

            <div className="sheet-wrap reserve-sheet-wrap" ref={sheetWrapRef}>
              <table
                className="sheet-table reserve-sheet-table"
                style={sheetTableWidthStyle(columnWidths)}
              >
                <SheetColGroup widths={columnWidths} />
                <thead>
                  <tr>
                    {!demoReadOnly && <SheetDragHeader />}
                    {!demoReadOnly && <th className="sheet-actions" />}
                    <th className="sheet-label-col reserve-bill-col">Bill</th>
                    <th className="reserve-scope-col">Applies to</th>
                    {MONTHS.map((month, idx) => (
                      <th
                        key={month}
                        className={['reserve-month-col', currentMonthClass(idx === currentMonthIdx, isCurrentMonthConfirmed)]
                          .filter(Boolean)
                          .join(' ')}
                      >
                        {month}
                      </th>
                    ))}
                    <th className="reserve-total-col reserve-total-col--annual">Annual</th>
                    <th className="reserve-total-col reserve-total-col--monthly">Monthly</th>
                  </tr>
                </thead>
                <tbody>
                  {grid.rows.length === 0 && (
                    <tr>
                      <td colSpan={18} className="reserve-empty-row">
                        <div className="reserve-empty-guidance">
                          <p><strong>Add your irregular bills here.</strong></p>
                          <p>Think: VAT, corporation tax, insurance, annual renewals — anything too big to pay from one month&apos;s income.</p>
                          <ol>
                            <li>Click <strong>+ Add bill row</strong> above to add a bill.</li>
                            <li>Click a <strong>month cell</strong> to enter the amount due that month and which day it&apos;s due.</li>
                            <li>Each month, the planner tells you exactly how much to transfer in or out of your savings account.</li>
                          </ol>
                        </div>
                      </td>
                    </tr>
                  )}
                  {grid.rows.map((row, index) => {
                    const bill = planner.bills.find((b) => b.id === row.billId)!
                    const rowProps = billReorder.getRowProps(row.billId, index)
                    return (
                      <tr key={row.billId} {...(demoReadOnly ? {} : rowProps)}>
                        {!demoReadOnly && (
                          <SheetDragCell rowId={row.billId} getHandleProps={billReorder.getHandleProps} />
                        )}
                        {!demoReadOnly && (
                        <td className="sheet-actions">
                          {bill.lastPaidPeriod ? (
                            <button
                              type="button"
                              className="btn-ghost btn-tiny"
                              title="Mark this bill unpaid again"
                              onClick={() => actions.markReserveBillUnpaid(planner.id, bill.id)}
                            >
                              Undo paid
                            </button>
                          ) : null}
                          <DuplicateRowButton onClick={() => actions.duplicateReserveBill(planner.id, bill.id)} />
                          <button
                            type="button"
                            className="btn-danger btn-tiny reserve-bill-del"
                            onClick={() => actions.deleteReserveBill(planner.id, bill.id)}
                            title="Delete bill"
                          >
                            ×
                          </button>
                        </td>
                        )}
                        <BillTypeCell
                          cellId={`${bill.id}-type`}
                          bill={bill}
                          options={billTypeOptions}
                          isActive={activeCell === `${bill.id}-type`}
                          onActivate={() => activateCell(`${bill.id}-type`)}
                          onDeactivate={() => setActiveCell(null)}
                          onRename={(name) => actions.updateReserveBill(planner.id, bill.id, { name })}
                        />
                        <BillScopeCell
                          cellId={`${bill.id}-scope`}
                          state={state}
                          businessId={planner.businessId}
                          viewScope={viewScope}
                          bill={bill}
                          readOnly={demoReadOnly}
                          isActive={activeCell === `${bill.id}-scope`}
                          onActivate={() => activateCell(`${bill.id}-scope`)}
                          onDeactivate={() => setActiveCell(null)}
                          onScopeChange={(venueId) =>
                            actions.updateReserveBill(planner.id, bill.id, { venueId })
                          }
                        />
                        {row.monthAmounts.map((amount, idx) => {
                          const month = MONTHS[idx]
                          const cellId = `${bill.id}-${month}`
                          const dueDay = getBillDueDay(bill, month)
                          const isDueEdit = activeCell === `${cellId}-due`
                          return (
                            <EditableReserveMonthCell
                              key={month}
                              cellId={cellId}
                              amount={amount}
                              dueDay={amount !== null ? dueDay : null}
                              isCurrentMonth={idx === currentMonthIdx}
                              isCurrentMonthConfirmed={idx === currentMonthIdx && isCurrentMonthConfirmed}
                              isActive={activeCell === cellId || isDueEdit}
                              initialEditMode={isDueEdit ? 'due' : 'amount'}
                              onActivate={() => activateCell(cellId)}
                              onActivateDue={() => activateCell(`${cellId}-due`)}
                              onDeactivate={() => setActiveCell(null)}
                              onSave={(value, day) => saveMonthAmount(bill, month, value, day)}
                            />
                          )
                        })}
                        <td className="sheet-row-total-cell reserve-total-col reserve-total-col--annual">
                          {formatCellAmount(row.annual)}
                        </td>
                        <td className="reserve-total-col reserve-total-col--monthly">
                          {formatCellAmount(row.monthly)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="reserve-balance-row">
                    {!demoReadOnly && <td className="sheet-drag-col" />}
                    {!demoReadOnly && <td className="sheet-actions" />}
                    <td className="sheet-row-label reserve-bill-col">
                      Reserve balance
                      <span className="sheet-row-hint">Planned after bills</span>
                    </td>
                    <td className="reserve-scope-col" />
                    {monthEndBalances.map((monthEnd) => (
                      <ReserveBalanceCell
                        key={monthEnd.month}
                        monthEnd={monthEnd}
                        currentMonthIdx={currentMonthIdx}
                        currentActualBalance={suggestedReserveBalance}
                        onAdjustCurrentBalance={
                          !demoReadOnly && monthEnd.monthIndex === currentMonthIdx
                            ? (balance) => {
                                const confirmation = monthEnd.confirmation
                                actions.confirmReserveMonth(planner.id, monthEnd.month, {
                                  balance,
                                  operatingBalanceBefore: confirmation?.operatingBalanceBefore,
                                  transferDone: confirmation?.transferDone ?? true,
                                })
                              }
                            : undefined
                        }
                      />
                    ))}
                    <td className="sheet-row-total-cell reserve-total-col reserve-total-col--annual" />
                    <td className="reserve-total-col reserve-total-col--monthly" />
                  </tr>
                  <tr className="reserve-plan-chart-row" data-tour="reserve-planner-chart">
                    {!demoReadOnly && <td className="sheet-drag-col" />}
                    {!demoReadOnly && <td className="sheet-actions" />}
                    <td colSpan={2} className="reserve-plan-chart-label">
                      <span className="reserve-plan-chart-title">Balance outlook</span>
                      <span className="sheet-row-hint">Bills &amp; planned balance</span>
                    </td>
                    <td colSpan={12} className="reserve-plan-chart-cell">
                      <ReservePlanChart
                        months={monthEndBalances}
                        bufferAmount={planner.bufferAmount}
                        currentMonthIdx={currentMonthIdx}
                        currentActualBalance={suggestedReserveBalance}
                        columnWidths={columnWidths}
                      />
                    </td>
                    <td className="sheet-row-total-cell reserve-total-col reserve-total-col--annual" />
                    <td className="reserve-total-col reserve-total-col--monthly" />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
      </div>
    </section>
  )
}
