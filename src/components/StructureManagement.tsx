import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import type { Account, AppState, Business, Group, Venue } from '../types'
import type { AppActions } from '../hooks/useAppState'
import { useSubscription } from '../contexts/SubscriptionContext'
import {
  BUSINESS_ACCENT_COLORS,
  getBusinessAccentColor,
  getVenueAccentColor,
  getGroupAccentColor,
  getTakenAccentColors,
  isValidAccentColor,
} from '../utils/businessTheme'

interface StructureManagementProps {
  state: AppState
  actions: AppActions
  embedded?: boolean
}

type OrgType = 'group' | 'business' | 'site' | 'savings' | 'account'

function OrgIcon({ type }: { type: OrgType }) {
  const size = type === 'savings' || type === 'account' ? 12 : 14
  const paths: Record<OrgType, ReactNode> = {
    group: (
      <svg width={size} height={size} viewBox="0 0 18 18" fill="none" aria-hidden>
        <rect x="2" y="2" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
        <rect x="10" y="2" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
        <rect x="2" y="10" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
        <rect x="10" y="10" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    ),
    business: (
      <svg width={size} height={size} viewBox="0 0 18 18" fill="none" aria-hidden>
        <path
          d="M3 15V6.5l6-3.5 6 3.5V15M3 15h12M7 15v-4h4v4"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    site: (
      <svg width={size} height={size} viewBox="0 0 18 18" fill="none" aria-hidden>
        <path
          d="M9 2.5l5.5 5a4 4 0 11-11 0l5.5-5z"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <circle cx="9" cy="9.5" r="1.5" fill="currentColor" />
      </svg>
    ),
    savings: (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden>
        <path
          d="M8 1.5v13M5.5 4.5h5a2 2 0 010 4h-5a2 2 0 000 4h5"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
      </svg>
    ),
    account: (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden>
        <rect x="1.5" y="3.5" width="13" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
        <path d="M1.5 6.5h13" stroke="currentColor" strokeWidth="1.3" />
      </svg>
    ),
  }

  return <span className={`org-icon org-icon--${type}`}>{paths[type]}</span>
}

function AccentColorPicker({
  value,
  fallback,
  onChange,
  label,
  takenColors,
}: {
  value?: string
  fallback: string
  onChange: (color: string | null) => void
  label: string
  /** Other businesses/venues already using these colours (lowercase hex). */
  takenColors?: Set<string>
}) {
  const [open, setOpen] = useState(false)
  const [panelPos, setPanelPos] = useState({ top: 0, left: 0 })
  const triggerRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)

  const active = isValidAccentColor(value) ? value : fallback
  const custom = isValidAccentColor(value) ? value : active
  const isTaken = (color: string) =>
    Boolean(takenColors?.has(color.toLowerCase()) && color.toLowerCase() !== active.toLowerCase())

  const updatePanelPos = () => {
    if (!btnRef.current) return
    const rect = btnRef.current.getBoundingClientRect()
    const panelWidth = panelRef.current?.offsetWidth ?? 200
    const left = Math.max(8, Math.min(rect.right - panelWidth, window.innerWidth - panelWidth - 8))
    setPanelPos({ top: rect.bottom + 6, left })
  }

  useLayoutEffect(() => {
    if (!open) return
    updatePanelPos()
  }, [open])

  useEffect(() => {
    if (!open) return

    const onLayout = () => updatePanelPos()
    window.addEventListener('resize', onLayout)
    window.addEventListener('scroll', onLayout, true)

    const close = (e: MouseEvent) => {
      const target = e.target as Node
      if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', close)

    return () => {
      window.removeEventListener('resize', onLayout)
      window.removeEventListener('scroll', onLayout, true)
      document.removeEventListener('mousedown', close)
    }
  }, [open])

  const panel =
    open &&
    createPortal(
      <div
        ref={panelRef}
        className="org-color-popover org-menu-panel--portal"
        style={{ top: panelPos.top, left: panelPos.left }}
        role="dialog"
        aria-label={`${label} colour`}
      >
        <p className="org-color-popover-title">Colour</p>
        <div className="org-accent-swatches" role="list">
          {BUSINESS_ACCENT_COLORS.map((color) => {
            const taken = isTaken(color)
            return (
              <button
                key={color}
                type="button"
                role="listitem"
                className={`org-accent-swatch${active === color ? ' org-accent-swatch--active' : ''}${
                  taken ? ' org-accent-swatch--taken' : ''
                }`}
                style={{ backgroundColor: color }}
                disabled={taken}
                title={taken ? 'Already used by another business or venue' : undefined}
                onClick={() => {
                  if (taken) return
                  onChange(color)
                  setOpen(false)
                }}
                aria-label={taken ? `Colour ${color} already in use` : `Set colour ${color}`}
                aria-pressed={active === color}
              />
            )
          })}
        </div>
        <label className="org-color-custom-row">
          <span>Custom</span>
          <input
            type="color"
            value={custom}
            onChange={(event) => {
              const next = event.target.value
              if (isTaken(next)) return
              onChange(next)
            }}
            aria-label={`Custom colour for ${label}`}
          />
        </label>
        {takenColors && takenColors.size > 0 ? (
          <p className="org-color-popover-hint muted">Colours already in use are greyed out.</p>
        ) : null}
        {isValidAccentColor(value) ? (
          <button
            type="button"
            className="org-color-reset-row"
            onClick={() => {
              onChange(null)
              setOpen(false)
            }}
          >
            Use automatic colour
          </button>
        ) : null}
      </div>,
      document.body,
    )

  return (
    <div className="org-accent-trigger" ref={triggerRef}>
      <button
        ref={btnRef}
        type="button"
        className="org-accent-trigger-btn"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={`${label} colour`}
        title="Change colour"
      >
        <span className="org-accent-trigger-swatch" style={{ backgroundColor: active }} aria-hidden />
      </button>
      {panel}
    </div>
  )
}

function OrgName({
  value,
  onChange,
  size = 'md',
}: {
  value: string
  onChange: (value: string) => void
  size?: 'lg' | 'md' | 'sm'
}) {
  const [draft, setDraft] = useState(value)
  const committed = useRef(value)

  useEffect(() => {
    if (value !== committed.current) {
      committed.current = value
      setDraft(value)
    }
  }, [value])

  const commit = () => {
    const trimmed = draft.trim()
    if (trimmed && trimmed !== committed.current) {
      committed.current = trimmed
      onChange(trimmed)
    } else {
      setDraft(committed.current)
    }
  }

  return (
    <input
      type="text"
      className={`org-name org-name--${size}`}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.currentTarget.blur()
        }
      }}
      aria-label="Name"
    />
  )
}

function OrgAddMenu({ items }: { items: { label: string; onClick: () => void }[] }) {
  const [open, setOpen] = useState(false)
  const [panelPos, setPanelPos] = useState({ top: 0, left: 0 })
  const triggerRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)

  const updatePanelPos = () => {
    if (!btnRef.current) return
    const rect = btnRef.current.getBoundingClientRect()
    const panelWidth = panelRef.current?.offsetWidth ?? 148
    const left = Math.max(8, Math.min(rect.right - panelWidth, window.innerWidth - panelWidth - 8))
    setPanelPos({ top: rect.bottom + 4, left })
  }

  useLayoutEffect(() => {
    if (!open) return
    updatePanelPos()
  }, [open, items.length])

  useEffect(() => {
    if (!open) return

    const onLayout = () => updatePanelPos()
    window.addEventListener('resize', onLayout)
    window.addEventListener('scroll', onLayout, true)

    const close = (e: MouseEvent) => {
      const target = e.target as Node
      if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', close)

    return () => {
      window.removeEventListener('resize', onLayout)
      window.removeEventListener('scroll', onLayout, true)
      document.removeEventListener('mousedown', close)
    }
  }, [open])

  if (items.length === 0) return null

  const panel =
    open &&
    createPortal(
      <div
        ref={panelRef}
        className="org-menu-panel org-menu-panel--portal"
        style={{ top: panelPos.top, left: panelPos.left }}
        role="menu"
      >
        {items.map((item) => (
          <button
            key={item.label}
            type="button"
            role="menuitem"
            onClick={() => {
              item.onClick()
              setOpen(false)
            }}
          >
            {item.label}
          </button>
        ))}
      </div>,
      document.body,
    )

  return (
    <div className="org-menu" ref={triggerRef}>
      <button
        ref={btnRef}
        type="button"
        className="org-chip-btn org-chip-btn--add"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        Add
      </button>
      {panel}
    </div>
  )
}

function EntityActions({
  addItems,
  onRemove,
  removeTitle,
}: {
  addItems?: { label: string; onClick: () => void }[]
  onRemove?: () => void
  removeTitle?: string
}) {
  return (
    <div className="org-entity-actions">
      {addItems && addItems.length > 0 && <OrgAddMenu items={addItems} />}
      {onRemove && (
        <button type="button" className="org-chip-btn org-chip-btn--danger" onClick={onRemove} title={removeTitle} aria-label={removeTitle}>
          ×
        </button>
      )}
    </div>
  )
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <h4 className="org-section-title">{children}</h4>
}

function AccountLine({
  type,
  name,
  onRename,
  onRemove,
}: {
  type: 'savings' | 'account'
  name: string
  onRename: (name: string) => void
  onRemove: () => void
}) {
  return (
    <div className="org-account-line" data-type={type}>
      <OrgIcon type={type} />
      <OrgName value={name} onChange={onRename} size="sm" />
      <button type="button" className="org-icon-btn org-icon-btn--danger" onClick={onRemove} title="Remove account" aria-label="Remove account">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
          <path d="M3.5 3.5l7 7M10.5 3.5l-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  )
}

function SiteCard({
  state,
  venue,
  accounts,
  actions,
}: {
  state: AppState
  venue: Venue
  accounts: Account[]
  actions: AppActions
}) {
  const accent = getVenueAccentColor(state, venue.id)
  return (
    <article className="org-site-card">
      <header className="org-site-header" style={{ borderLeftColor: accent }}>
        <OrgIcon type="site" />
        <div className="org-entity-copy">
          <OrgName value={venue.name} onChange={(name) => actions.renameVenue(venue.id, name)} size="md" />
        </div>
        <AccentColorPicker
          value={venue.accentColor}
          fallback={accent}
          takenColors={getTakenAccentColors(state, { type: 'venue', id: venue.id })}
          onChange={(color) => actions.setVenueAccentColor(venue.id, color)}
          label={venue.name}
        />
        <EntityActions
          addItems={[
            { label: 'Current account', onClick: () => actions.addAccount(venue.id, 'Current account', 'current') },
          ]}
          onRemove={() => actions.deleteVenue(venue.id)}
          removeTitle="Delete site"
        />
      </header>
      {accounts.length > 0 && (
        <div className="org-account-list">
          {accounts.map((account) => (
            <AccountLine
              key={account.id}
              type="account"
              name={account.name}
              onRename={(name) => actions.renameAccount(account.id, name)}
              onRemove={() => actions.deactivateAccount(account.id)}
            />
          ))}
        </div>
      )}
    </article>
  )
}

function BusinessCard({
  state,
  business,
  venues,
  actions,
}: {
  state: AppState
  business: Business
  venues: Venue[]
  actions: AppActions
}) {
  const hasVenues = venues.length > 0
  const businessAccounts = state.accounts.filter(
    (a) => a.businessId === business.id && !a.venueId && a.active && a.type !== 'reserve',
  )
  const savings = businessAccounts.filter((a) => a.type === 'savings')
  const direct = businessAccounts.filter((a) => a.type !== 'savings')

  const accountCount =
    savings.length +
    direct.length +
    venues.reduce(
      (n, v) =>
        n + state.accounts.filter((a) => a.venueId === v.id && a.active && a.type !== 'reserve').length,
      0,
    )

  const { requestLimit } = useSubscription()
  const tryAddVenue = () => {
    if (!requestLimit('venues', state.venues.length + 1)) return
    actions.addVenue(business.id, 'New site', true)
  }

  const addItems = [
    { label: 'Current account', onClick: () => actions.addBusinessAccount(business.id, 'Current account', 'current') },
    { label: 'Savings account', onClick: () => actions.addBusinessSavingsAccount(business.id, 'Savings account') },
    { label: 'Venue / site', onClick: tryAddVenue },
  ]

  return (
    <article className="org-business-card">
      <header className="org-business-header" style={{ borderLeftColor: getBusinessAccentColor(state, business.id) }}>
        <OrgIcon type="business" />
        <div className="org-entity-copy">
          <OrgName value={business.name} onChange={(name) => actions.renameBusiness(business.id, name)} size="md" />
          <span className="org-meta-inline">
            {hasVenues ? `${venues.length} venue${venues.length === 1 ? '' : 's'} · ` : ''}
            {accountCount} account{accountCount === 1 ? '' : 's'}
          </span>
        </div>
        <AccentColorPicker
          value={business.accentColor}
          fallback={getBusinessAccentColor(state, business.id)}
          takenColors={getTakenAccentColors(state, { type: 'business', id: business.id })}
          onChange={(color) => actions.setBusinessAccentColor(business.id, color)}
          label={business.name}
        />
        <label className="org-income-pattern" title="Steady = day-to-day trading on forecast. Irregular = large dated receipts on forecast.">
          <span className="sr-only">Income pattern for {business.name}</span>
          <select
            value={business.incomePattern ?? 'steady'}
            onChange={(e) =>
              actions.setBusinessIncomePattern(business.id, e.target.value as 'steady' | 'lumpy')
            }
          >
            <option value="steady">Steady / daily income</option>
            <option value="lumpy">Irregular / invoiced income</option>
          </select>
        </label>
        <EntityActions
          addItems={addItems}
          onRemove={() => actions.deleteBusiness(business.id)}
          removeTitle="Delete business"
        />
      </header>

      <div className="org-business-body">
        {(direct.length > 0 || savings.length > 0) && (
          <div className="org-account-list">
            {direct.map((account) => (
              <AccountLine
                key={account.id}
                type="account"
                name={account.name}
                onRename={(name) => actions.renameAccount(account.id, name)}
                onRemove={() => actions.deactivateAccount(account.id)}
              />
            ))}
            {savings.map((account) => (
              <AccountLine
                key={account.id}
                type="savings"
                name={account.name}
                onRename={(name) => actions.renameAccount(account.id, name)}
                onRemove={() => actions.deactivateAccount(account.id)}
              />
            ))}
          </div>
        )}

        {venues.length > 0 && (
          <>
            <SectionTitle>Venues</SectionTitle>
            <div className="org-site-list">
              {venues.map((venue) => (
                <SiteCard
                  key={venue.id}
                  state={state}
                  venue={venue}
                  accounts={state.accounts.filter(
                    (a) => a.venueId === venue.id && a.active && a.type !== 'reserve',
                  )}
                  actions={actions}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </article>
  )
}

function GroupCard({
  group,
  businesses,
  state,
  actions,
  onAddBusiness,
}: {
  group: Group
  businesses: Business[]
  state: AppState
  actions: AppActions
  onAddBusiness: (groupId: string) => void
}) {
  const businessCount = businesses.length
  const siteCount = businesses.reduce(
    (n, b) => n + state.venues.filter((v) => v.businessId === b.id).length,
    0,
  )
  const accountCount = state.accounts.filter(
    (a) =>
      a.active &&
      a.type !== 'reserve' &&
      (businesses.some((b) => b.id === a.businessId) ||
        businesses.some((b) => state.venues.some((v) => v.businessId === b.id && v.id === a.venueId))),
  ).length

  return (
    <article className="org-group-card">
      <header className="org-group-header" style={{ borderLeftColor: getGroupAccentColor(state, group.id) }}>
        <OrgIcon type="group" />
        <div className="org-entity-copy">
          <OrgName value={group.name} onChange={(name) => actions.renameGroup(group.id, name)} size="lg" />
          <span className="org-meta-inline">
            {businessCount} business{businessCount === 1 ? '' : 'es'} · {siteCount} site{siteCount === 1 ? '' : 's'} ·{' '}
            {accountCount} account{accountCount === 1 ? '' : 's'}
          </span>
        </div>
        <AccentColorPicker
          value={group.accentColor}
          fallback={getGroupAccentColor(state, group.id)}
          onChange={(color) => actions.setGroupAccentColor(group.id, color)}
          label={group.name}
        />
        <EntityActions
          addItems={[
            { label: 'Business', onClick: () => onAddBusiness(group.id) },
            { label: 'Remove group (keep businesses)', onClick: () => actions.dissolveGroup(group.id) },
          ]}
          onRemove={() => actions.deleteGroup(group.id)}
          removeTitle="Delete group and all businesses"
        />
      </header>

      <div className="org-group-body">
        {businesses.length === 0 ? (
          <p className="org-section-empty">Add a business via Add on the group header.</p>
        ) : (
          businesses.map((business) => (
            <BusinessCard
              key={business.id}
              state={state}
              business={business}
              venues={state.venues.filter((v) => v.businessId === business.id)}
              actions={actions}
            />
          ))
        )}
      </div>
    </article>
  )
}

export function StructureManagement({ state, actions, embedded = false }: StructureManagementProps) {
  const { requestLimit, requestFeature } = useSubscription()

  const tryAddBusiness = (groupId?: string) => {
    if (!requestLimit('businesses', state.businesses.length + 1)) return
    const resolvedGroupId = groupId ?? state.groups[0]?.id
    if (resolvedGroupId) {
      actions.addBusiness(resolvedGroupId, 'New business', true)
    }
  }

  const tryAddGroupView = () => {
    if (!requestFeature('groupReporting')) return
    actions.addGroup('Group')
  }

  const businessesByGroup = useMemo(() => {
    const map = new Map<string, Business[]>()
    for (const business of state.businesses) {
      const list = map.get(business.groupId) ?? []
      list.push(business)
      map.set(business.groupId, list)
    }
    return map
  }, [state.businesses])

  const showGroupLevel = state.businesses.length > 1 && state.groups.length > 0

  const headActions = (
    <div className="org-head-actions">
      {!showGroupLevel && state.businesses.length > 1 && (
        <button type="button" className="btn-secondary btn-tiny" onClick={tryAddGroupView}>
          + Group view
        </button>
      )}
      <button type="button" className="btn-secondary btn-tiny" onClick={() => tryAddBusiness()}>
        + Business
      </button>
      <button
        type="button"
        className="btn-ghost btn-tiny"
        onClick={() => {
          const typed = window.prompt(
            'This replaces ALL your real data with demo figures.\n\nType REPLACE to continue, or Cancel to keep your data.\n\nTip: Settings → Your data → Download your data first. You can restore from that file later.',
          )
          if (typed?.trim().toUpperCase() !== 'REPLACE') return
          actions.resetToDemo()
        }}
      >
        Load demo
      </button>
    </div>
  )

  const body = (
    <>
      {embedded ? <div className="org-embedded-actions">{headActions}</div> : null}
      {state.businesses.length === 0 ? (
        <div className="org-empty">
          <div className="org-empty-icon">
            <OrgIcon type="business" />
          </div>
          <p>No business set up yet.</p>
          <button type="button" className="btn-primary" onClick={() => tryAddBusiness()}>
            Add your first business
          </button>
        </div>
      ) : showGroupLevel ? (
        <div className="org-stack">
          {state.groups.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              businesses={businessesByGroup.get(group.id) ?? []}
              state={state}
              actions={actions}
              onAddBusiness={(gid) => tryAddBusiness(gid)}
            />
          ))}
        </div>
      ) : (
        <div className="org-stack">
          {state.businesses.map((business) => (
            <BusinessCard
              key={business.id}
              state={state}
              business={business}
              venues={state.venues.filter((v) => v.businessId === business.id)}
              actions={actions}
            />
          ))}
        </div>
      )}
    </>
  )

  if (embedded) {
    return (
      <div className="structure-embedded" id="settings" data-tour="settings-structure">
        {body}
      </div>
    )
  }

  return (
    <section id="settings" className="card settings-card" data-tour="settings-structure">
      <div className="card-head org-card-head">
        <div>
          <h2>Structure</h2>
        </div>
        {headActions}
      </div>
      {body}
    </section>
  )
}
