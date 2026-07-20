import type { AppState, HealthLevel, ViewScope } from '../types'
import { getGroupIdForScope, getScopeBreadcrumb, getScopeLabel, hasMultipleViewScopes } from '../utils/scope'
import {
  chartColorForScope,
  getBusinessAccentColor,
  getVenueAccentColor,
} from '../utils/businessTheme'
import { abbreviateScopeName } from '../utils/sidebarLayout'
import { getScopeCurrentAccountFreshness } from '../utils/accountFreshness'

interface SidebarScopeTreeProps {
  state: AppState
  viewScope: ViewScope
  onSelect: (scope: ViewScope) => void
  compact?: boolean
  /** When false, omit the freshness key (render it elsewhere in the sidebar). */
  showFreshnessLegend?: boolean
}

function isActive(viewScope: ViewScope, type: ViewScope['type'], id: string) {
  return viewScope.type === type && viewScope.id === id
}

function isInPath(state: AppState, viewScope: ViewScope, type: 'group' | 'business', id: string) {
  if (isActive(viewScope, type, id)) return false

  if (type === 'group') {
    return getGroupIdForScope(state, viewScope) === id
  }

  if (viewScope.type === 'venue') {
    const venue = state.venues.find((v) => v.id === viewScope.id)
    return venue?.businessId === id
  }

  return false
}

function scopeBtnClass(
  state: AppState,
  viewScope: ViewScope,
  type: ViewScope['type'],
  id: string,
  compact?: boolean,
) {
  const base = compact ? 'scope-tree-btn scope-tree-btn--compact' : 'scope-tree-btn'
  if (isActive(viewScope, type, id)) return `${base} scope-tree-btn--active`
  if (type !== 'venue' && isInPath(state, viewScope, type, id)) {
    return `${base} scope-tree-btn--in-path`
  }
  return base
}

function isSingleVenueBusinessActive(
  viewScope: ViewScope,
  businessId: string,
  venueId: string,
) {
  return (
    (viewScope.type === 'venue' && viewScope.id === venueId) ||
    (viewScope.type === 'business' && viewScope.id === businessId)
  )
}

function FreshnessDot({
  state,
  scope,
  compact,
}: {
  state: AppState
  scope: ViewScope
  compact?: boolean
}) {
  const freshness = getScopeCurrentAccountFreshness(state, scope)
  if (!freshness) return null
  return (
    <span
      className={`overview-freshness-dot overview-freshness-dot--${freshness.level}${
        compact ? ' overview-freshness-dot--compact' : ''
      }`}
      title={`Current account: ${freshness.label}`}
      aria-label={`Current account ${freshness.label}`}
    />
  )
}

export function ScopeFreshnessLegend() {
  return (
    <div className="scope-freshness-legend" aria-label="Current account freshness">
      <p className="scope-freshness-legend-title">Current account freshness</p>
      <ul>
        {(
          [
            ['green', 'Updated today'],
            ['yellow', '1–3 days ago'],
            ['orange', '4–7 days ago'],
            ['red', 'Over a week'],
          ] as const
        ).map(([level, label]) => (
          <li key={level}>
            <span
              className={`overview-freshness-dot overview-freshness-dot--${level as HealthLevel}`}
              aria-hidden
            />
            <span>{label}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function SidebarScopeTree({
  state,
  viewScope,
  onSelect,
  compact = false,
  showFreshnessLegend = true,
}: SidebarScopeTreeProps) {
  const currentAccent = chartColorForScope(state, viewScope)
  const currentLabel = getScopeLabel(state, viewScope)
  const breadcrumb = getScopeBreadcrumb(state, viewScope)
  const multiScope = hasMultipleViewScopes(state)
  const currentFreshness = getScopeCurrentAccountFreshness(state, viewScope)

  const renderBusinessNode = (business: typeof state.businesses[number]) => {
    const venues = state.venues.filter((v) => v.businessId === business.id)
    const businessAccent = getBusinessAccentColor(state, business.id)
    const businessScope: ViewScope = { type: 'business', id: business.id }

    if (venues.length === 1) {
      const venue = venues[0]!
      const active = isSingleVenueBusinessActive(viewScope, business.id, venue.id)
      const label = compact ? abbreviateScopeName(business.name, 3) : business.name
      return (
        <li key={business.id} className="scope-tree-node">
          <button
            type="button"
            className={
              active
                ? `scope-tree-btn scope-tree-btn--active${compact ? ' scope-tree-btn--compact' : ''}`
                : scopeBtnClass(state, viewScope, 'business', business.id, compact)
            }
            style={{ ['--row-accent' as string]: businessAccent }}
            title={compact ? business.name : undefined}
            onClick={() => onSelect({ type: 'business', id: business.id })}
          >
            <span className="scope-tree-swatch" style={{ background: businessAccent }} aria-hidden />
            <span className="scope-tree-label">{label}</span>
            <FreshnessDot state={state} scope={businessScope} compact={compact} />
          </button>
        </li>
      )
    }

    return (
      <li key={business.id} className="scope-tree-node">
        <button
          type="button"
          className={scopeBtnClass(state, viewScope, 'business', business.id, compact)}
          style={{ ['--row-accent' as string]: businessAccent }}
          title={compact ? business.name : undefined}
          onClick={() => onSelect({ type: 'business', id: business.id })}
        >
          <span className="scope-tree-swatch" style={{ background: businessAccent }} aria-hidden />
          <span className="scope-tree-label">
            {compact ? abbreviateScopeName(business.name, 3) : business.name}
          </span>
          <FreshnessDot state={state} scope={businessScope} compact={compact} />
        </button>

        {venues.length > 1 && (
          <ul className={`scope-tree-branch${compact ? ' scope-tree-branch--compact' : ''}`}>
            {venues.map((venue) => {
              const venueAccent = getVenueAccentColor(state, venue.id)
              const venueScope: ViewScope = { type: 'venue', id: venue.id }
              return (
                <li key={venue.id} className="scope-tree-node">
                  <button
                    type="button"
                    className={scopeBtnClass(state, viewScope, 'venue', venue.id, compact)}
                    style={{ ['--row-accent' as string]: venueAccent }}
                    title={compact ? venue.name : undefined}
                    onClick={() => onSelect({ type: 'venue', id: venue.id })}
                  >
                    <span
                      className="scope-tree-swatch"
                      style={{ background: venueAccent }}
                      aria-hidden
                    />
                    <span className="scope-tree-label">
                      {compact ? abbreviateScopeName(venue.name, 3) : venue.name}
                    </span>
                    <FreshnessDot state={state} scope={venueScope} compact={compact} />
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </li>
    )
  }

  const renderUngroupedBusinesses = () => {
    const groupedIds = new Set(state.groups.flatMap((g) => state.businesses.filter((b) => b.groupId === g.id).map((b) => b.id)))
    const ungrouped = state.businesses.filter((b) => !groupedIds.has(b.id))
    if (ungrouped.length === 0) return null
    return <>{ungrouped.map((business) => renderBusinessNode(business))}</>
  }

  return (
    <section
      className={`sidebar-scope-section${compact ? ' sidebar-scope-section--compact' : ''}`}
      aria-label="Viewing scope"
      data-tour="sidebar-scope"
    >
      {!compact && multiScope && <p className="sidebar-scope-heading">Viewing</p>}
      <p
        className={`sidebar-scope-current${compact ? ' sidebar-scope-current--compact' : ''}`}
        title={breadcrumb}
      >
        <span
          className="scope-tree-swatch scope-tree-swatch--current"
          style={{ background: currentAccent }}
          aria-hidden
        />
        <span className="sidebar-scope-current-label">
          {compact ? abbreviateScopeName(currentLabel, 4) : currentLabel}
        </span>
        {currentFreshness ? (
          <span
            className={`overview-freshness-dot overview-freshness-dot--${currentFreshness.level}${
              compact ? ' overview-freshness-dot--compact' : ''
            }`}
            title={`Current account: ${currentFreshness.label}`}
            aria-label={`Current account ${currentFreshness.label}`}
          />
        ) : null}
      </p>

      {multiScope ? (
      <ul className={`scope-tree${compact ? ' scope-tree--compact' : ''}`}>
        {state.groups.map((group) => {
          const businesses = state.businesses.filter((b) => b.groupId === group.id)
          if (businesses.length === 0) return null
          const groupScope: ViewScope = { type: 'group', id: group.id }

          if (businesses.length === 1) {
            return (
              <li key={group.id} className="scope-tree-node scope-tree-node--root">
                {renderBusinessNode(businesses[0]!)}
              </li>
            )
          }

          return (
            <li key={group.id} className="scope-tree-node scope-tree-node--root">
              <button
                type="button"
                className={scopeBtnClass(state, viewScope, 'group', group.id, compact)}
                title={compact ? `${group.name} — whole group` : undefined}
                onClick={() => onSelect({ type: 'group', id: group.id })}
              >
                {!compact && <span className="scope-tree-label">{group.name}</span>}
                {compact ? (
                  <span className="scope-tree-abbrev">{abbreviateScopeName(group.name, 2)}</span>
                ) : (
                  <span className="scope-tree-meta">Whole group</span>
                )}
                <FreshnessDot state={state} scope={groupScope} compact={compact} />
              </button>

              <ul className={`scope-tree-branch${compact ? ' scope-tree-branch--compact' : ''}`}>
                {businesses.map((business) => renderBusinessNode(business))}
              </ul>
            </li>
          )
        })}

        {renderUngroupedBusinesses()}
      </ul>
      ) : null}

      {showFreshnessLegend && !compact ? <ScopeFreshnessLegend /> : null}
    </section>
  )
}
