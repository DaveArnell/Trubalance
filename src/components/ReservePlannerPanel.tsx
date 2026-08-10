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
  getPlannerOperatingAccount,
  getPlannerReserveAccount,
  getSuggestedOperatingBalanceForMonth,
  getReserveBalanceForTransfer,
  monthAmountsFromPatch,
  monthDueDaysFromPatch,
  DEFAULT_RESERVE_BILL_DUE_DAY,
  type ReserveMonthEndBalance,
} from '../utils/reserveCalculations'
import { getReserveBillScopeOptionsForView } from '../utils/scope'
import type { AppActions } from '../hooks/useAppState'
import { useEditReadOnly } from '../hooks/useEditReadOnly'
import { useMobileNav } from '../hooks/useMobileNav'
import { useSheetRowReorder } from '../hooks/useSheetRowReorder'
import { formatCurrency, getCurrencySymbol } from '../utils/format'
import { roundCurrency } from '../utils/amounts'
import { ReservePlanChart } from './ReservePlanChart'
import { HelpButton } from './HelpButton'
import { WIDGET_HELP } from '../content/livingDashboard'
import {
  businessesWithoutReservePlan,
  ReservePlannerEmptyState,
  ReservePlannerPicker,
} from './ReservePlannerEmptyState'
import { DuplicateRowButton, SheetDragCell, SheetDragHeader } from './committed/shared'
import {
  SheetColGroup,
  reserveSheetColumnsForMode,
  sheetTableWidthStyle,
} from './SheetResizableTable'
import { useResizableSheetColumns } from '../hooks/useResizableSheetColumns'
import { InlineTextCell } from './SheetInlineCells'
import { MobileReservePlan } from './mobile/MobileReservePlan'

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
    | 'reorderReserveBills'
    | 'confirmReserveMonth'
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
  monthEnd: _monthEnd,
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
  void _monthEnd
  const planner = state.reservePlanners.find((p) => p.id === plannerId)!
  const reserveAccount = getPlannerReserveAccount(state, planner)
  const operatingAccount = getPlannerOperatingAccount(state, planner)
  const reserveName = reserveAccount?.name ?? 'reserve'
  const operatingName = operatingAccount?.name ?? 'current account'

  const [editing, setEditing] = useState(!confirmation)
  const [reserveBeforeDraft, setReserveBeforeDraft] = useState(() =>
    String(suggestedReserveBalance),
  )
  const [reserveAfterDraft, setReserveAfterDraft] = useState(() =>
    confirmation ? String(confirmation.balance) : String(transferTarget),
  )
  const [transferDone, setTransferDone] = useState(() => {
    if (confirmation?.transferDone != null) return confirmation.transferDone
    const initialNet = computeReserveOperatingTransfer(suggestedReserveBalance, transferTarget)
    return initialNet.direction === 'none'
  })
  const userEditedBeforeRef = useRef(false)
  const userEditedAfterRef = useRef(false)

  const parsedBefore = Number(reserveBeforeDraft)
  const reserveBefore = Number.isNaN(parsedBefore) ? suggestedReserveBalance : parsedBefore
  const netTransfer = computeReserveOperatingTransfer(reserveBefore, transferTarget)
  const transferLine = formatMonthlyNetTransfer(netTransfer, reserveName, operatingName)
  const needsTransfer = netTransfer.direction !== 'none'

  useEffect(() => {
    if (confirmation) {
      userEditedBeforeRef.current = false
      userEditedAfterRef.current = false
      return
    }
    if (!userEditedBeforeRef.current) {
      setReserveBeforeDraft(String(suggestedReserveBalance))
    }
    if (!userEditedAfterRef.current) {
      setReserveAfterDraft(String(transferTarget))
    }
  }, [confirmation, suggestedReserveBalance, transferTarget])

  useEffect(() => {
    if (confirmation) return
    if (!needsTransfer) setTransferDone(true)
  }, [confirmation, needsTransfer])

  const isConfirmed = !!confirmation && !editing
  const parsedAfter = Number(reserveAfterDraft)
  const canConfirm =
    !Number.isNaN(parsedAfter) && (!needsTransfer || transferDone)

  const openEdit = () => {
    userEditedBeforeRef.current = true
    userEditedAfterRef.current = true
    setReserveBeforeDraft(String(suggestedReserveBalance || ''))
    setReserveAfterDraft(confirmation ? String(confirmation.balance) : String(transferTarget || ''))
    setTransferDone(confirmation?.transferDone ?? !needsTransfer)
    setEditing(true)
  }

  const submit = () => {
    if (!canConfirm) return
    onConfirm({
      balance: parsedAfter,
      operatingBalanceBefore: suggestedOperatingBalance,
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
          <div className="reserve-month-flow-summary reserve-month-flow-summary--confirmed">
            <span className="reserve-month-flow-done-mark" aria-hidden>
              ✓
            </span>
            <div className="reserve-month-flow-confirmed-metrics">
              <div className="reserve-month-flow-confirmed-metric">
                <span>In reserve</span>
                <strong>{formatCellAmount(confirmation.balance)}</strong>
              </div>
              <div className="reserve-month-flow-confirmed-metric">
                <span>Should be</span>
                <strong>{formatCellAmount(transferTarget)}</strong>
              </div>
              <div
                className={`reserve-month-flow-confirmed-metric reserve-month-flow-confirmed-metric--diff${
                  Math.abs(roundCurrency(confirmation.balance - transferTarget)) < 0.5
                    ? ' reserve-month-flow-confirmed-metric--ok'
                    : confirmation.balance - transferTarget < 0
                      ? ' reserve-month-flow-confirmed-metric--short'
                      : ' reserve-month-flow-confirmed-metric--over'
                }`}
              >
                <span>Difference</span>
                <strong>
                  {(() => {
                    const diff = roundCurrency(confirmation.balance - transferTarget)
                    return `${diff > 0 ? '+' : ''}${formatCellAmount(diff)}`
                  })()}
                </strong>
              </div>
            </div>
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
            <span>Reserve now</span>
            <input
              className="sheet-input reserve-month-flow-input"
              type="number"
              step="0.01"
              placeholder={getCurrencySymbol()}
              value={reserveBeforeDraft}
              onChange={(e) => {
                userEditedBeforeRef.current = true
                setReserveBeforeDraft(e.target.value)
              }}
              title="What is in the reserve account now"
            />
          </label>
          <div className="reserve-month-flow-target" title="Planned reserve balance after this month’s transfer">
            <span>Should be</span>
            <p className="reserve-month-flow-target-value">
              <strong>{formatCellAmount(transferTarget)}</strong>
            </p>
          </div>
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
            <span>New reserve funds</span>
            <input
              className="sheet-input reserve-month-flow-input"
              type="number"
              step="0.01"
              placeholder={getCurrencySymbol()}
              value={reserveAfterDraft}
              onChange={(e) => {
                userEditedAfterRef.current = true
                setReserveAfterDraft(e.target.value)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  submit()
                }
              }}
              title="Reserve balance after the transfer"
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
              {option.venueId ? `\u00A0\u00A0\u00A0${option.label}` : option.label}
            </option>
          ))}
        </select>
      ) : (
        <span className="sheet-cell-value reserve-scope-label">{label}</span>
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
  const editReadOnly = useEditReadOnly()
  const { isMobile } = useMobileNav()
  const [activeCell, setActiveCell] = useState<string | null>(null)
  const sheetWrapRef = useRef<HTMLDivElement>(null)
  const sheetColumns = useMemo(() => reserveSheetColumnsForMode(editReadOnly), [editReadOnly])
  const { widths: columnWidths } = useResizableSheetColumns(
    sheetWrapRef,
    sheetColumns,
    'reserve-planner',
  )
  const activateCell = (cellId: string) => {
    if (editReadOnly) return
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

  if (!summary || !planner) {
    const wantsCreate =
      state.reservePlanners.length === 0 ||
      ((showCreateForm || reserveRouteId === 'new') &&
        businessesWithoutReservePlan(state).length > 0)
    if (wantsCreate) {
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

  const addBillRow = () => {
    const id = actions.addReserveBill({
      plannerId: planner.id,
      name: '',
      monthAmounts: {},
    })
    if (id) activateCell(`${id}-name`)
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
      <div className="card-head card-head-compact card-head--widget-bar">
        <div className="card-head-toolbar">
          {!editReadOnly ? (
            <button
              type="button"
              className="btn-primary btn-widget-add"
              data-tour="reserve-planner-bills"
              onClick={addBillRow}
            >
              + Add
            </button>
          ) : (
            <span className="card-head-toolbar-spacer" aria-hidden />
          )}
          <div className="reserve-planner-heading-block">
            <h2 className="reserve-planner-business-heading">
              {businessName ? `${businessName} Reserve Plan` : planner.name || 'Reserve Plan'}
            </h2>
          </div>
          <div className="card-head-toolbar-right">
            {!editReadOnly && (
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
      </div>

      <div className="card-scroll-body">
      <div className="reserve-planner-block reserve-planner-block--solo">
            <div className="reserve-planner-top">
              <div className="reserve-planner-top-metrics" data-tour="reserve-planner-buffer">
                <div
                  className="reserve-transfer-field"
                  data-tour="reserve-planner-transfer"
                  title="Average of your annual reserve bills ÷ 12 — not this month’s transfer"
                >
                  <span>Average monthly transfer</span>
                  <p className="reserve-monthly-transfer">
                    <strong>{formatCurrency(grid.totalMonthly)}</strong>
                  </p>
                </div>
                <label className="reserve-buffer-field reserve-buffer-field--narrow">
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
                    readOnly={editReadOnly}
                  />
                </label>
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
                  readOnly={editReadOnly}
                />
              </div>
            </div>

            {isMobile ? (
              <MobileReservePlan
                state={state}
                viewScope={viewScope}
                plannerId={planner.id}
                businessId={planner.businessId}
                bufferAmount={planner.bufferAmount}
                grid={grid}
                bills={planner.bills}
                monthEndBalances={monthEndBalances}
                currentMonthIdx={currentMonthIdx}
                currentActualBalance={suggestedReserveBalance}
                editReadOnly={editReadOnly}
                actions={actions}
              />
            ) : (
            <div className="sheet-wrap reserve-sheet-wrap" ref={sheetWrapRef}>
              <table
                className="sheet-table reserve-sheet-table"
                style={sheetTableWidthStyle(columnWidths)}
              >
                <SheetColGroup widths={columnWidths} />
                <thead>
                  <tr>
                    {!editReadOnly && <SheetDragHeader />}
                    {!editReadOnly && <th className="sheet-actions" />}
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
                            <li>Click <strong>+ Add</strong> above to add a bill.</li>
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
                      <tr key={row.billId} {...(editReadOnly ? {} : rowProps)}>
                        {!editReadOnly && (
                          <SheetDragCell rowId={row.billId} getHandleProps={billReorder.getHandleProps} />
                        )}
                        {!editReadOnly && (
                        <td className="sheet-actions">
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
                        <InlineTextCell
                          cellId={`${bill.id}-name`}
                          value={bill.name}
                          placeholder="Bill name"
                          className="sheet-row-label reserve-bill-col"
                          isActive={activeCell === `${bill.id}-name`}
                          onActivate={() => activateCell(`${bill.id}-name`)}
                          onDeactivate={() => setActiveCell(null)}
                          onSave={(name) => actions.updateReserveBill(planner.id, bill.id, { name })}
                        />
                        <BillScopeCell
                          cellId={`${bill.id}-scope`}
                          state={state}
                          businessId={planner.businessId}
                          viewScope={viewScope}
                          bill={bill}
                          readOnly={editReadOnly}
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
                    {!editReadOnly && <td className="sheet-drag-col" />}
                    {!editReadOnly && <td className="sheet-actions" />}
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
                          !editReadOnly && monthEnd.monthIndex === currentMonthIdx
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
                    {!editReadOnly && <td className="sheet-drag-col" />}
                    {!editReadOnly && <td className="sheet-actions" />}
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
            )}
          </div>
      </div>
    </section>
  )
}

