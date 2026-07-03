import type { AppState, ReservePlannerSummary } from '../types'
import { formatCurrency } from '../utils/format'
import { computeReservePlanSummary, formatReserveHealthLabel } from '../utils/reserveCalculations'
import { HelpButton } from './HelpButton'

interface ReserveStatusPanelProps {
  state: AppState
  summaries: ReservePlannerSummary[]
  openHelp: string | null
  setOpenHelp: (id: string | null) => void
}

function reserveAccountLabel(state: AppState, reserveAccountId?: string) {
  if (!reserveAccountId) return null
  const account = state.accounts.find((a) => a.id === reserveAccountId && a.active)
  if (!account) return null
  const venue = account.venueId ? state.venues.find((v) => v.id === account.venueId) : null
  return venue ? `${venue.name} — ${account.name}` : account.name
}

export function ReserveStatusPanel({
  state,
  summaries,
  openHelp,
  setOpenHelp,
}: ReserveStatusPanelProps) {
  return (
    <section id="reserve-status" className="card widget-compact card-scroll">
      <div className="card-head card-head-compact">
        <h2>Reserve accounts</h2>
        <HelpButton
          id="reserve-status"
          openHelp={openHelp}
          setOpenHelp={setOpenHelp}
          text="Reserve balances come from your linked reserve savings accounts in Settings. Monthly transfer is what each plan needs you to set aside (annual bills ÷ 12)."
        />
      </div>

      {summaries.length === 0 ? (
        <p className="muted card-scroll-body">No reserve planners in this view.</p>
      ) : (
        <table className="kpi-table reserve-status-table">
        <thead>
          <tr>
            <th className="col-balance">Planner</th>
            <th className="col-amount">Monthly transfer</th>
            <th className="col-amount">In account</th>
            <th className="col-meta">Status</th>
          </tr>
        </thead>
        <tbody>
          {summaries.map((summary) => {
            const { planner, actualBalance, status, businessName } = summary
            const monthly = computeReservePlanSummary(planner.bills, planner.bufferAmount).monthlyDeposit
            const accountLabel = reserveAccountLabel(state, planner.reserveAccountId)

            return (
              <tr key={planner.id}>
                <td className="col-balance">
                  <a className="reserve-status-link" href={`#reserve-planner/${planner.id}`}>
                    {planner.name}
                  </a>
                  <span className="reserve-status-business">{businessName}</span>
                </td>
                <td className="col-amount">{formatCurrency(monthly)}</td>
                <td className="col-amount" title={accountLabel ?? undefined}>
                  {formatCurrency(actualBalance)}
                  {accountLabel && <span className="reserve-status-account">{accountLabel}</span>}
                </td>
                <td className="col-meta">
                  <span
                    className={`reserve-health-pill reserve-health-pill--${status}`}
                    title={formatReserveHealthLabel(status)}
                  >
                    {formatReserveHealthLabel(status)}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      )}
    </section>
  )
}
