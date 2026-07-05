import { useMemo, useState } from 'react'
import type { AppState } from '../types'
import type { AppActions } from '../hooks/useAppState'
import { useTour } from '../contexts/TourContext'
import { RESERVE_PLANNER_INTRO_TOUR } from '../content/pageTours'
import { HelpButton } from './HelpButton'

function reserveAccountsForBusiness(state: AppState, businessId: string) {
  const venueIds = new Set(state.venues.filter((v) => v.businessId === businessId).map((v) => v.id))
  return state.accounts.filter(
    (a) =>
      a.active &&
      a.type === 'reserve' &&
      (a.businessId === businessId || (a.venueId != null && venueIds.has(a.venueId))),
  )
}

interface ReservePlannerEmptyStateProps {
  state: AppState
  actions: Pick<AppActions, 'addReservePlanner'>
  openHelp: string | null
  setOpenHelp: (id: string | null) => void
  onPlannerCreated: (plannerId: string) => void
}

export function ReservePlannerEmptyState({
  state,
  actions,
  openHelp,
  setOpenHelp,
  onPlannerCreated,
}: ReservePlannerEmptyStateProps) {
  const { startTour, isTourActive } = useTour()
  const businesses = state.businesses
  const [businessId, setBusinessId] = useState(businesses[0]?.id ?? '')
  const [reserveAccountId, setReserveAccountId] = useState('')
  const [planName, setPlanName] = useState('')

  const reserveAccounts = useMemo(
    () => (businessId ? reserveAccountsForBusiness(state, businessId) : []),
    [state, businessId],
  )

  const selectedBusiness = businesses.find((b) => b.id === businessId)
  const effectiveReserveId = reserveAccountId || reserveAccounts[0]?.id || ''
  const canCreate = Boolean(businessId)

  const handleCreate = () => {
    if (!canCreate || !selectedBusiness) return
    const account = effectiveReserveId ? state.accounts.find((a) => a.id === effectiveReserveId) : undefined
    const name = planName.trim() || `${selectedBusiness.name} reserves`
    const id = actions.addReservePlanner({
      name,
      businessId,
      reserveAccountId: effectiveReserveId || undefined,
      bufferAmount: 0,
      actualBalance: account?.balance ?? 0,
    })
    onPlannerCreated(id)
  }

  return (
    <section id="reserve-planner" className="card reserve-box reserve-empty" data-tour="reserve-empty">
      <div className="card-head card-head-compact">
        <div>
          <h2>Reserve Planner</h2>
          <p className="muted reserve-empty-lead">
            Set aside money each month for irregular bills — VAT, insurance, corporation tax, and other
            lumpy costs — so they never surprise your cash flow.
          </p>
        </div>
        <HelpButton
          id="reserve"
          openHelp={openHelp}
          setOpenHelp={setOpenHelp}
          text="A reserve plan is linked to one business and its reserve savings account. Add bills with the amounts due in each month; the planner shows how much to transfer and surfaces bills in Due when payment is due."
        />
      </div>

      <div className="reserve-empty-body">
        <div className="reserve-empty-how" data-tour="reserve-empty-how">
          <h3>How you use it</h3>
          <ol className="reserve-empty-steps">
            <li>
              <strong>Create a plan</strong> for a business and link it to a reserve savings account.
            </li>
            <li>
              <strong>Add bills</strong> and enter amounts in the months they are due (not smoothed — actual
              due months).
            </li>
            <li>
              <strong>Each month</strong>, confirm balances and transfer what the plan suggests. Bills appear in
              Due when their due date arrives.
            </li>
          </ol>
        </div>

        {!isTourActive && (
          <button
            type="button"
            className="btn-secondary btn-tiny reserve-empty-tour-btn"
            onClick={() => startTour(RESERVE_PLANNER_INTRO_TOUR)}
          >
            Take a guided tour
          </button>
        )}

        <div className="reserve-empty-create" data-tour="reserve-empty-create">
          <h3>Create your first reserve plan</h3>
          {businesses.length === 0 ? (
            <p className="muted">
              Set up your business first (via the setup wizard or Settings), then come back here to create a plan.
            </p>
          ) : (
            <>
              {businesses.length > 1 && (
                <label className="reserve-empty-field">
                  <span>Business</span>
                  <select
                    value={businessId}
                    onChange={(e) => {
                      setBusinessId(e.target.value)
                      setReserveAccountId('')
                    }}
                  >
                    {businesses.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {reserveAccounts.length > 0 && (
                <label className="reserve-empty-field">
                  <span>Reserve savings account (optional)</span>
                  <select
                    value={effectiveReserveId}
                    onChange={(e) => setReserveAccountId(e.target.value)}
                  >
                    <option value="">None — I&apos;ll link one later</option>
                    {reserveAccounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <label className="reserve-empty-field">
                <span>Plan name (optional)</span>
                <input
                  type="text"
                  value={planName}
                  placeholder={selectedBusiness ? `${selectedBusiness.name} reserves` : 'Reserve plan'}
                  onChange={(e) => setPlanName(e.target.value)}
                />
              </label>
              <button
                type="button"
                className="btn-primary"
                disabled={!canCreate}
                onClick={handleCreate}
              >
                + Create reserve plan
              </button>
              {reserveAccounts.length === 0 && (
                <p className="muted" style={{ marginTop: '8px', fontSize: '0.78rem' }}>
                  You can link a savings account later in Settings — the planner works without one.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  )
}

interface ReservePlannerPickerProps {
  state: AppState
  onSelect: (plannerId: string) => void
  onAddNew: () => void
}

export function ReservePlannerPicker({ state, onSelect, onAddNew }: ReservePlannerPickerProps) {
  return (
    <section id="reserve-planner" className="card reserve-box reserve-empty">
      <div className="card-head card-head-compact">
        <h2>Reserve Planner</h2>
        <p className="muted reserve-empty-lead">Choose a plan to open, or create another.</p>
      </div>
      <ul className="reserve-planner-picker">
        {state.reservePlanners.map((planner) => {
          const business = state.businesses.find((b) => b.id === planner.businessId)
          return (
            <li key={planner.id}>
              <button type="button" className="reserve-planner-picker-btn" onClick={() => onSelect(planner.id)}>
                <strong>{planner.name}</strong>
                <span className="muted">{business?.name ?? 'Business'}</span>
                <span className="muted">{planner.bills.length} bill{planner.bills.length === 1 ? '' : 's'}</span>
              </button>
            </li>
          )
        })}
      </ul>
      <button type="button" className="btn-secondary" onClick={onAddNew}>
        + Add another plan
      </button>
    </section>
  )
}
