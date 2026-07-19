import type { AppActions } from '../../hooks/useAppState'
import type { Account, AppState, Business, Venue } from '../../types'

type StructureActions = Pick<
  AppActions,
  | 'addBusiness'
  | 'deleteBusiness'
  | 'renameBusiness'
  | 'addVenue'
  | 'deleteVenue'
  | 'renameVenue'
  | 'addBusinessAccount'
  | 'addBusinessSavingsAccount'
  | 'addAccount'
  | 'renameAccount'
  | 'deactivateAccount'
>

export interface SetupStructureTreeDraft {
  businessName: string
  venueName: string
  accountName: string
}

interface SetupStructureTreeProps {
  state: AppState
  actions: StructureActions
  draft: SetupStructureTreeDraft
  onDraftChange: (patch: Partial<SetupStructureTreeDraft>) => void
}

function accountTypeLabel(type: Account['type']) {
  return type === 'current' ? 'Current' : 'Savings'
}

function activeCashAccounts(accounts: Account[]) {
  return accounts.filter((account) => account.active && account.type !== 'reserve')
}

function VenueNode({
  venue,
  accounts,
  actions,
}: {
  venue: Venue
  accounts: Account[]
  actions: StructureActions
}) {
  return (
    <div className="structure-tree-node structure-tree-node--venue">
      <div className="structure-tree-connector" />
      <div className="structure-tree-node-head">
        <span className="structure-tree-swatch" style={{ background: venue.accentColor || '#6366f1' }} />
        <input
          className="structure-tree-name-input structure-tree-name-input--small"
          value={venue.name}
          onChange={(e) => actions.renameVenue(venue.id, e.target.value)}
          aria-label="Venue name"
        />
        <button
          type="button"
          className="structure-tree-remove"
          onClick={() => actions.deleteVenue(venue.id)}
          title="Remove venue"
          aria-label={`Remove ${venue.name}`}
        >
          ×
        </button>
      </div>
      <div className="structure-tree-accounts structure-tree-accounts--editable">
        {accounts.map((account) => (
          <div key={account.id} className="structure-tree-account-row">
            <span
              className={`structure-tree-account-type structure-tree-account-type--${account.type}`}
            >
              {accountTypeLabel(account.type)}
            </span>
            <input
              className="structure-tree-name-input structure-tree-name-input--small"
              value={account.name}
              onChange={(e) => actions.renameAccount(account.id, e.target.value)}
              aria-label="Account name"
            />
            <button
              type="button"
              className="structure-tree-remove"
              onClick={() => actions.deactivateAccount(account.id)}
              title="Remove account"
              aria-label={`Remove ${account.name}`}
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <div className="structure-tree-add-actions">
        <button
          type="button"
          className="btn-ghost"
          onClick={() => actions.addAccount(venue.id, 'Current account', 'current')}
        >
          + Current account
        </button>
        <button
          type="button"
          className="btn-ghost"
          onClick={() => actions.addAccount(venue.id, 'Savings account', 'savings')}
        >
          + Savings
        </button>
      </div>
    </div>
  )
}

function BusinessNode({
  business,
  venues,
  businessAccounts,
  venueAccounts,
  actions,
  canDeleteBusiness,
}: {
  business: Business
  venues: Venue[]
  businessAccounts: Account[]
  venueAccounts: Record<string, Account[]>
  actions: StructureActions
  canDeleteBusiness: boolean
}) {
  const hasVenues = venues.length > 0

  const addVenueWithAccount = () => {
    const venueCount = venues.length
    // Trial allows full access; after trial StructureManagement + subscription checks apply.
    actions.addVenue(business.id, `Site ${venueCount + 1}`, true)
  }

  return (
    <div className="structure-tree-node structure-tree-node--business">
      <div className="structure-tree-node-head">
        <span
          className="structure-tree-swatch"
          style={{ background: business.accentColor || 'var(--accent)' }}
        />
        <input
          className="structure-tree-name-input"
          value={business.name}
          onChange={(e) => actions.renameBusiness(business.id, e.target.value)}
          aria-label="Business name"
        />
        {canDeleteBusiness && (
          <button
            type="button"
            className="structure-tree-remove"
            onClick={() => actions.deleteBusiness(business.id)}
            title="Remove business"
            aria-label={`Remove ${business.name}`}
          >
            ×
          </button>
        )}
      </div>

      {businessAccounts.length > 0 && (
        <div className="structure-tree-accounts structure-tree-accounts--editable">
          {businessAccounts.map((account) => (
            <div key={account.id} className="structure-tree-account-row">
              <span
                className={`structure-tree-account-type structure-tree-account-type--${account.type}`}
              >
                {accountTypeLabel(account.type)}
              </span>
              <input
                className="structure-tree-name-input structure-tree-name-input--small"
                value={account.name}
                onChange={(e) => actions.renameAccount(account.id, e.target.value)}
                aria-label="Account name"
              />
              <button
                type="button"
                className="structure-tree-remove"
                onClick={() => actions.deactivateAccount(account.id)}
                title="Remove account"
                aria-label={`Remove ${account.name}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {hasVenues && (
        <div className="structure-tree-children">
          {venues.map((venue) => (
            <VenueNode
              key={venue.id}
              venue={venue}
              accounts={venueAccounts[venue.id] ?? []}
              actions={actions}
            />
          ))}
        </div>
      )}

      <div className="structure-tree-add-actions">
        <button type="button" className="btn-ghost" onClick={addVenueWithAccount}>
          + Venue / site
        </button>
        {!hasVenues && (
          <button
            type="button"
            className="btn-ghost"
            onClick={() => actions.addBusinessAccount(business.id, 'Current account', 'current')}
          >
            + Current account
          </button>
        )}
        <button
          type="button"
          className="btn-ghost"
          onClick={() => actions.addBusinessSavingsAccount(business.id, 'Savings account')}
        >
          + Savings
        </button>
      </div>
    </div>
  )
}

function DraftBusinessTree({
  draft,
  onDraftChange,
}: {
  draft: SetupStructureTreeDraft
  onDraftChange: (patch: Partial<SetupStructureTreeDraft>) => void
}) {
  return (
    <div className="structure-tree structure-tree--editable">
      <div className="structure-tree-node structure-tree-node--business">
        <div className="structure-tree-node-head">
          <span className="structure-tree-swatch" style={{ background: 'var(--accent)' }} />
          <input
            className="structure-tree-name-input"
            value={draft.businessName}
            onChange={(e) => onDraftChange({ businessName: e.target.value })}
            placeholder="Your business name"
            autoFocus
          />
        </div>
        <div className="structure-tree-accounts structure-tree-accounts--editable">
          <div className="structure-tree-account-row">
            <span className="structure-tree-account-type structure-tree-account-type--current">
              Current
            </span>
            <input
              className="structure-tree-name-input structure-tree-name-input--small"
              value={draft.accountName}
              onChange={(e) => onDraftChange({ accountName: e.target.value })}
              placeholder="Current account name"
            />
          </div>
        </div>
        {draft.venueName ? (
          <div className="structure-tree-children">
            <div className="structure-tree-node structure-tree-node--venue">
              <div className="structure-tree-connector" />
              <div className="structure-tree-node-head">
                <span className="structure-tree-swatch" style={{ background: '#6366f1' }} />
                <input
                  className="structure-tree-name-input structure-tree-name-input--small"
                  value={draft.venueName}
                  onChange={(e) => onDraftChange({ venueName: e.target.value })}
                  placeholder="Site / venue name"
                />
                <button
                  type="button"
                  className="structure-tree-remove"
                  onClick={() => onDraftChange({ venueName: '' })}
                  title="Remove venue"
                  aria-label="Remove venue"
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="structure-tree-add-btn"
            onClick={() => onDraftChange({ venueName: 'Site 1' })}
          >
            + Add a venue / site
          </button>
        )}
      </div>
      <p className="muted" style={{ marginTop: '12px', fontSize: '0.78rem' }}>
        Start with one business and account. You can add more businesses, sites, and accounts once you
        continue.
      </p>
    </div>
  )
}

export function SetupStructureTree({ state, actions, draft, onDraftChange }: SetupStructureTreeProps) {
  if (state.businesses.length === 0) {
    return <DraftBusinessTree draft={draft} onDraftChange={onDraftChange} />
  }

  const venueAccounts = Object.fromEntries(
    state.venues.map((venue) => [
      venue.id,
      activeCashAccounts(state.accounts.filter((account) => account.venueId === venue.id)),
    ]),
  )

  return (
    <div className="structure-tree structure-tree--editable">
      {state.businesses.map((business) => {
        const venues = state.venues.filter((venue) => venue.businessId === business.id)
        const businessAccounts = activeCashAccounts(
          state.accounts.filter((account) => account.businessId === business.id && !account.venueId),
        )
        return (
          <BusinessNode
            key={business.id}
            business={business}
            venues={venues}
            businessAccounts={businessAccounts}
            venueAccounts={venueAccounts}
            actions={actions}
            canDeleteBusiness={state.businesses.length > 1}
          />
        )
      })}
      <button
        type="button"
        className="structure-tree-add-btn structure-tree-add-business-btn"
        onClick={() => {
          const name = `Business ${state.businesses.length + 1}`
          actions.addBusiness(undefined, name, true)
        }}
      >
        + Add another business
      </button>
      <p className="muted" style={{ marginTop: '8px', fontSize: '0.78rem' }}>
        Add venues under a business for separate sites, or keep accounts at business level if you only
        have one location.
      </p>
    </div>
  )
}
