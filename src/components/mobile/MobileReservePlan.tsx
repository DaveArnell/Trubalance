import { useState } from 'react'
import type { AppState, ReserveBill, ViewScope } from '../../types'
import type { AppActions } from '../../hooks/useAppState'
import { MONTHS, formatCurrency } from '../../utils/format'
import {
  getBillDueDay,
  monthAmountsFromPatch,
  monthDueDaysFromPatch,
  type ReserveMonthEndBalance,
  type ReserveGrid,
} from '../../utils/reserveCalculations'
import { getReserveBillScopeOptionsForView } from '../../utils/scope'
import { ReservePlanChart } from '../ReservePlanChart'

interface MobileReservePlanProps {
  state: AppState
  viewScope: ViewScope
  plannerId: string
  businessId: string
  bufferAmount: number
  grid: ReserveGrid
  bills: ReserveBill[]
  monthEndBalances: ReserveMonthEndBalance[]
  currentMonthIdx: number
  currentActualBalance?: number
  editReadOnly: boolean
  actions: Pick<
    AppActions,
    'updateReserveBill' | 'deleteReserveBill' | 'duplicateReserveBill'
  >
}

/**
 * Portrait Reserve Planner for phones: bill cards + compact month grid + standalone chart.
 * Avoids the landscape 12-month sheet that cannot fit mobile width.
 */
export function MobileReservePlan({
  state,
  viewScope,
  plannerId,
  businessId,
  bufferAmount,
  grid,
  bills,
  monthEndBalances,
  currentMonthIdx,
  currentActualBalance,
  editReadOnly,
  actions,
}: MobileReservePlanProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const scopeOptions = getReserveBillScopeOptionsForView(state, businessId, viewScope)

  if (grid.rows.length === 0) {
    return (
      <div className="mobile-reserve-plan">
        <div className="mobile-reserve-empty">
          <p>
            <strong>Add irregular bills</strong> with + Add above — VAT, insurance, renewals.
          </p>
          <p className="muted">Each bill shows as a card here so you can edit months without sideways scrolling.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mobile-reserve-plan">
      <ul className="mobile-reserve-bill-list">
        {grid.rows.map((row) => {
          const bill = bills.find((entry) => entry.id === row.billId)
          if (!bill) return null
          const open = expandedId === bill.id
          const activeMonths = MONTHS.map((month, idx) => ({
            month,
            idx,
            amount: row.monthAmounts[idx],
            dueDay: row.monthAmounts[idx] != null ? getBillDueDay(bill, month) : null,
          })).filter((entry) => entry.amount != null && entry.amount !== 0)

          return (
            <li key={bill.id} className="mobile-reserve-bill-card">
              <button
                type="button"
                className="mobile-reserve-bill-head"
                aria-expanded={open}
                onClick={() => setExpandedId((id) => (id === bill.id ? null : bill.id))}
              >
                <span className="mobile-reserve-bill-title">
                  <strong>{bill.name || 'Untitled bill'}</strong>
                  <span className="muted">
                    {activeMonths.length > 0
                      ? activeMonths.map((m) => m.month).join(' · ')
                      : 'No months set'}
                  </span>
                </span>
                <span className="mobile-reserve-bill-totals">
                  <span>{formatCurrency(row.monthly)}/mo</span>
                  <span className="muted">{formatCurrency(row.annual)}/yr</span>
                </span>
                <span className="mobile-reserve-bill-chevron" aria-hidden>
                  {open ? '▴' : '▾'}
                </span>
              </button>

              {open ? (
                <div className="mobile-reserve-bill-body">
                  {!editReadOnly ? (
                    <label className="mobile-reserve-field">
                      <span>Name</span>
                      <input
                        className="sheet-input sheet-input--compact"
                        value={bill.name}
                        onChange={(e) =>
                          actions.updateReserveBill(plannerId, bill.id, { name: e.target.value })
                        }
                      />
                    </label>
                  ) : null}

                  {!editReadOnly && scopeOptions.length > 0 ? (
                    <label className="mobile-reserve-field">
                      <span>Applies to</span>
                      <select
                        className="sheet-input sheet-input--compact"
                        value={bill.venueId ?? ''}
                        onChange={(e) =>
                          actions.updateReserveBill(plannerId, bill.id, {
                            venueId: e.target.value || undefined,
                          })
                        }
                      >
                        {scopeOptions.map((option) => (
                          <option
                            key={`${option.level}-${option.id}`}
                            value={option.level === 'venue' ? option.id : ''}
                          >
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}

                  <div className="mobile-reserve-month-grid" role="group" aria-label="Month amounts">
                    {MONTHS.map((month, idx) => {
                      const amount = row.monthAmounts[idx]
                      const value = amount == null ? '' : String(amount)
                      return (
                        <label key={month} className="mobile-reserve-month-cell">
                          <span>{month}</span>
                          <input
                            className="sheet-input sheet-input--compact"
                            type="number"
                            inputMode="decimal"
                            step="1"
                            value={value}
                            disabled={editReadOnly}
                            placeholder="—"
                            onChange={(e) => {
                              const raw = e.target.value
                              const nextAmount = raw.trim() === '' ? null : Number(raw)
                              const amount =
                                nextAmount == null || !Number.isFinite(nextAmount) ? null : nextAmount
                              actions.updateReserveBill(plannerId, bill.id, {
                                monthAmounts: monthAmountsFromPatch(bill.monthAmounts, month, amount),
                                monthDueDays: monthDueDaysFromPatch(
                                  bill.monthDueDays ?? {},
                                  month,
                                  amount,
                                ),
                              })
                            }}
                          />
                        </label>
                      )
                    })}
                  </div>

                  {!editReadOnly ? (
                    <div className="mobile-reserve-bill-actions">
                      <button
                        type="button"
                        className="btn-ghost btn-tiny"
                        onClick={() => actions.duplicateReserveBill(plannerId, bill.id)}
                      >
                        Duplicate
                      </button>
                      <button
                        type="button"
                        className="btn-danger btn-tiny"
                        onClick={() => actions.deleteReserveBill(plannerId, bill.id)}
                      >
                        Delete
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </li>
          )
        })}
      </ul>

      <div className="mobile-reserve-chart" data-tour="reserve-planner-chart">
        <div className="mobile-reserve-chart-head">
          <strong>Balance outlook</strong>
          <span className="muted">Bills &amp; planned balance</span>
        </div>
        <ReservePlanChart
          months={monthEndBalances}
          bufferAmount={bufferAmount}
          currentMonthIdx={currentMonthIdx}
          currentActualBalance={currentActualBalance}
          standalone
        />
      </div>
    </div>
  )
}
