import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { AppState, ReserveBill, ReservePlanner, ViewScope } from '../types'
import { MONTHS } from '../utils/format'
import {
  DEFAULT_RESERVE_BILL_DUE_DAY,
  getBillDueDay,
  getBillTypeOptions,
  monthAmountsFromPatch,
  monthDueDaysFromPatch,
  type ReserveGrid,
  type ReserveMonthEndBalance,
} from '../utils/reserveCalculations'
import { getReserveBillScopeOptionsForView } from '../utils/scope'
import type { AppActions } from '../hooks/useAppState'
import { formatCurrency } from '../utils/format'
import { useEditReadOnly } from '../hooks/useEditReadOnly'
import { ReservePlanChart } from './ReservePlanChart'
import { MobileRecordCard, MobileRecordList, MobileSectionLabel } from './mobile/MobileRecordList'
import { DuplicateRowButton } from './committed/shared'

interface ReservePlannerCardsProps {
  state: AppState
  viewScope: ViewScope
  planner: ReservePlanner
  grid: ReserveGrid
  monthEndBalances: ReserveMonthEndBalance[]
  currentMonthIdx: number
  suggestedReserveBalance: number
  actions: Pick<
    AppActions,
    'updateReserveBill' | 'deleteReserveBill' | 'duplicateReserveBill'
  >
}

function ordinalDay(day: number) {
  if (day >= 11 && day <= 13) return `${day}th`
  const mod = day % 10
  if (mod === 1) return `${day}st`
  if (mod === 2) return `${day}nd`
  if (mod === 3) return `${day}rd`
  return `${day}th`
}

function billScopeLabel(state: AppState, businessId: string, viewScope: ViewScope, bill: ReserveBill) {
  const options = getReserveBillScopeOptionsForView(state, businessId, viewScope)
  const match = options.find((option) =>
    bill.venueId ? option.level === 'venue' && option.id === bill.venueId : option.level === 'business',
  )
  return match?.label ?? options[0]?.label ?? '—'
}

function ReserveMonthAmountChip({
  amount,
  dueDay,
  month,
  readOnly,
  onSave,
}: {
  amount: number | null
  dueDay: number | null
  month: string
  readOnly: boolean
  onSave: (amount: number | null, dueDay: number | null) => void
}) {
  const chipRef = useRef<HTMLButtonElement>(null)
  const amountRef = useRef<HTMLInputElement>(null)
  const dueRef = useRef<HTMLInputElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [amountDraft, setAmountDraft] = useState('')
  const [dayDraft, setDayDraft] = useState(String(DEFAULT_RESERVE_BILL_DUE_DAY))
  const [panelPos, setPanelPos] = useState({ top: 0, left: 0 })

  useEffect(() => {
    if (!open) return
    setAmountDraft(amount != null ? String(amount) : '')
    setDayDraft(String(dueDay ?? DEFAULT_RESERVE_BILL_DUE_DAY))
  }, [open, amount, dueDay])

  const commit = () => {
    const trimmed = amountDraft.trim()
    if (!trimmed) {
      onSave(null, null)
      setOpen(false)
      return
    }
    const parsed = Number(trimmed)
    if (Number.isNaN(parsed) || parsed === 0) {
      onSave(null, null)
    } else {
      const day = Math.min(31, Math.max(1, Number(dayDraft) || DEFAULT_RESERVE_BILL_DUE_DAY))
      onSave(parsed, day)
    }
    setOpen(false)
  }

  const updatePanelPos = () => {
    if (!chipRef.current) return
    const rect = chipRef.current.getBoundingClientRect()
    const panelWidth = popoverRef.current?.offsetWidth ?? 112
    const left = Math.max(
      8,
      Math.min(rect.left + rect.width / 2 - panelWidth / 2, window.innerWidth - panelWidth - 8),
    )
    setPanelPos({ top: rect.bottom + 4, left })
  }

  useLayoutEffect(() => {
    if (!open) return
    updatePanelPos()
    requestAnimationFrame(updatePanelPos)
  }, [open])

  useEffect(() => {
    if (!open) return
    amountRef.current?.focus()
    amountRef.current?.select()
  }, [open])

  useEffect(() => {
    if (!open) return
    const onLayout = () => updatePanelPos()
    window.addEventListener('resize', onLayout)
    window.addEventListener('scroll', onLayout, true)
    const close = (e: MouseEvent) => {
      const target = e.target as Node
      if (chipRef.current?.contains(target) || popoverRef.current?.contains(target)) return
      commit()
    }
    document.addEventListener('mousedown', close)
    return () => {
      window.removeEventListener('resize', onLayout)
      window.removeEventListener('scroll', onLayout, true)
      document.removeEventListener('mousedown', close)
    }
  }, [open, amountDraft, dayDraft])

  const popover =
    open &&
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
              if (e.key === 'Escape') setOpen(false)
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
              if (e.key === 'Escape') setOpen(false)
            }}
          />
        </label>
      </div>,
      document.body,
    )

  return (
    <>
      <button
        ref={chipRef}
        type="button"
        className={`reserve-card-month-chip${amount != null ? ' reserve-card-month-chip--set' : ''}${
          open ? ' reserve-card-month-chip--open' : ''
        }`}
        disabled={readOnly}
        onClick={() => {
          if (!readOnly) setOpen(true)
        }}
        title={
          amount != null
            ? `${month}: ${formatCurrency(amount)} · due ${ordinalDay(dueDay ?? DEFAULT_RESERVE_BILL_DUE_DAY)}`
            : `${month}: add amount`
        }
      >
        <span className="reserve-card-month-chip-label">{month.slice(0, 3)}</span>
        <span className="reserve-card-month-chip-value">
          {amount != null ? formatCurrency(amount) : '—'}
        </span>
      </button>
      {popover}
    </>
  )
}

export function ReservePlannerCards({
  state,
  viewScope,
  planner,
  grid,
  monthEndBalances,
  currentMonthIdx,
  suggestedReserveBalance,
  actions,
}: ReservePlannerCardsProps) {
  const editReadOnly = useEditReadOnly()
  const billTypeOptions = getBillTypeOptions(state)
  const scopeOptions = getReserveBillScopeOptionsForView(state, planner.businessId, viewScope)

  return (
    <div className="reserve-cards">
      <div className="reserve-cards-chart" data-tour="reserve-planner-chart">
        <p className="reserve-cards-chart-heading">Balance outlook</p>
        <ReservePlanChart
          months={monthEndBalances}
          bufferAmount={planner.bufferAmount}
          currentMonthIdx={currentMonthIdx}
          currentActualBalance={suggestedReserveBalance}
          standalone
        />
      </div>

      <MobileSectionLabel>Month by month</MobileSectionLabel>
      <div className="reserve-month-cards" role="list">
        {monthEndBalances.map((monthEnd) => {
          const isCurrent = monthEnd.monthIndex === currentMonthIdx
          const statusParts = [
            isCurrent ? 'This month' : null,
            monthEnd.isLowestMonth ? 'Tightest' : null,
            monthEnd.confirmation ? 'Confirmed' : null,
          ].filter(Boolean)

          return (
            <article
              key={monthEnd.month}
              className={[
                'reserve-month-card',
                isCurrent ? 'reserve-month-card--current' : '',
                monthEnd.isLowestMonth ? 'reserve-month-card--low' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              role="listitem"
            >
              <header className="reserve-month-card-head">
                <h3>{monthEnd.month}</h3>
                {statusParts.length > 0 ? (
                  <p className="reserve-month-card-status">{statusParts.join(' · ')}</p>
                ) : null}
              </header>
              <dl className="reserve-month-card-stats">
                <div>
                  <dt>Transfer in</dt>
                  <dd>{formatCurrency(monthEnd.monthlyDeposit)}</dd>
                </div>
                <div>
                  <dt>Bills due</dt>
                  <dd className={monthEnd.totalDue > 0 ? 'reserve-month-card-due' : undefined}>
                    {monthEnd.totalDue > 0 ? formatCurrency(monthEnd.totalDue) : '—'}
                  </dd>
                </div>
                <div>
                  <dt>End balance</dt>
                  <dd>
                    <strong>{formatCurrency(monthEnd.balanceAfterBills)}</strong>
                  </dd>
                </div>
              </dl>
            </article>
          )
        })}
      </div>

      <MobileSectionLabel>Bills</MobileSectionLabel>
      {grid.rows.length === 0 ? (
        <MobileRecordList emptyMessage="No bills yet. Use + Add bill row above." />
      ) : (
        <MobileRecordList>
          {grid.rows.map((row) => {
            const bill = planner.bills.find((entry) => entry.id === row.billId)
            if (!bill) return null
            const scopeLabel = billScopeLabel(state, planner.businessId, viewScope, bill)

            return (
              <MobileRecordCard
                key={bill.id}
                title={
                  editReadOnly ? (
                    bill.name
                  ) : (
                    <input
                      className="reserve-card-bill-name"
                      value={bill.name}
                      aria-label="Bill name"
                      list={`reserve-bill-types-${planner.id}`}
                      onChange={(e) =>
                        actions.updateReserveBill(planner.id, bill.id, { name: e.target.value })
                      }
                    />
                  )
                }
                scopeLabel={
                  editReadOnly || scopeOptions.length <= 1 ? (
                    scopeLabel
                  ) : (
                    <select
                      className="reserve-card-bill-scope"
                      aria-label={`Applies to for ${bill.name}`}
                      value={bill.venueId ?? ''}
                      onChange={(e) =>
                        actions.updateReserveBill(planner.id, bill.id, {
                          venueId: e.target.value ? e.target.value : undefined,
                        })
                      }
                    >
                      {scopeOptions.map((option) => (
                        <option
                          key={option.level === 'venue' ? option.id : '__business'}
                          value={option.level === 'venue' ? option.id : ''}
                        >
                          {option.label}
                        </option>
                      ))}
                    </select>
                  )
                }
                amount={formatCurrency(row.annual)}
                amountSecondary={`${formatCurrency(row.monthly)} / mo`}
                meta="Annual total"
                actions={
                  editReadOnly ? undefined : (
                    <>
                      <DuplicateRowButton
                        onClick={() => actions.duplicateReserveBill(planner.id, bill.id)}
                      />
                      <button
                        type="button"
                        className="btn-danger btn-tiny"
                        onClick={() => actions.deleteReserveBill(planner.id, bill.id)}
                        title="Delete bill"
                      >
                        Delete
                      </button>
                    </>
                  )
                }
              >
                <div className="reserve-card-month-chips" aria-label={`${bill.name} monthly amounts`}>
                  {MONTHS.map((month, idx) => {
                    const amount = row.monthAmounts[idx] ?? null
                    const dueDay = amount != null ? getBillDueDay(bill, month) : null
                    return (
                      <ReserveMonthAmountChip
                        key={month}
                        month={month}
                        amount={amount}
                        dueDay={dueDay}
                        readOnly={editReadOnly}
                        onSave={(value, day) => {
                          const monthAmounts = monthAmountsFromPatch(bill.monthAmounts, month, value)
                          const monthDueDays = monthDueDaysFromPatch(
                            bill.monthDueDays ?? {},
                            month,
                            value,
                            day ?? undefined,
                          )
                          actions.updateReserveBill(planner.id, bill.id, {
                            monthAmounts,
                            monthDueDays,
                          })
                        }}
                      />
                    )
                  })}
                </div>
              </MobileRecordCard>
            )
          })}
        </MobileRecordList>
      )}

      {!editReadOnly ? (
        <datalist id={`reserve-bill-types-${planner.id}`}>
          {billTypeOptions.map((option) => (
            <option key={option} value={option} />
          ))}
        </datalist>
      ) : null}
    </div>
  )
}
