import type { AppState, ViewScope } from '../types'
import { getGroupIdForScope, getScopeBreadcrumb, getScopeLabel } from '../utils/scope'
import { getBusinessAccentColor, resolveScopeBusinessId } from '../utils/businessTheme'
import { abbreviateScopeName } from '../utils/sidebarLayout'

interface SidebarScopeTreeProps {
  state: AppState
  viewScope: ViewScope
  onSelect: (scope: ViewScope) => void
  compact?: boolean
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

export function SidebarScopeTree({
  state,
  viewScope,
  onSelect,
  compact = false,
}: SidebarScopeTreeProps) {
  const activeBusinessId = resolveScopeBusinessId(state, viewScope)
  const currentLabel = getScopeLabel(state, viewScope)
  const breadcrumb = getScopeBreadcrumb(state, viewScope)

  const renderBusinessNode = (business: typeof state.businesses[number]) => {
    const venues = state.venues.filter((v) => v.businessId === business.id)
    const accent = getBusinessAccentColor(state, business.id)

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
            title={compact ? business.name : undefined}
            onClick={() => onSelect({ type: 'business', id: business.id })}
          >
            <span className="scope-tree-swatch" style={{ background: accent }} aria-hidden />
            <span className="scope-tree-label">{label}</span>
          </button>
        </li>
      )
    }

    return (
      <li key={business.id} className="scope-tree-node">
        <button
          type="button"
          className={scopeBtnClass(state, viewScope, 'business', business.id, compact)}
          title={compact ? business.name : undefined}
          onClick={() => onSelect({ type: 'business', id: business.id })}
        >
          <span className="scope-tree-swatch" style={{ background: accent }} aria-hidden />
          <span className="scope-tree-label">
            {compact ? abbreviateScopeName(business.name, 3) : business.name}
          </span>
        </button>

        {venues.length > 1 && (
          <ul className={`scope-tree-branch${compact ? ' scope-tree-branch--compact' : ''}`}>
            {venues.map((venue) => (
              <li key={venue.id} className="scope-tree-node">
                <button
                  type="button"
                  className={scopeBtnClass(state, viewScope, 'venue', venue.id, compact)}
                  title={compact ? venue.name : undefined}
                  onClick={() => onSelect({ type: 'venue', id: venue.id })}
                >
                  <span className="scope-tree-swatch" style={{ background: accent }} aria-hidden />
                  <span className="scope-tree-label">
                    {compact ? abbreviateScopeName(venue.name, 3) : venue.name}
                  </span>
                </button>
              </li>
            ))}
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
      {!compact && <p className="sidebar-scope-heading">Viewing</p>}
      <p
        className={`sidebar-scope-current${compact ? ' sidebar-scope-current--compact' : ''}`}
        title={breadcrumb}
      >
        {activeBusinessId && (
          <span
            className="scope-tree-swatch scope-tree-swatch--current"
            style={{ background: getBusinessAccentColor(state, activeBusinessId) }}
            aria-hidden
          />
        )}
        {compact ? abbreviateScopeName(currentLabel, 4) : currentLabel}
      </p>

      <ul className={`scope-tree${compact ? ' scope-tree--compact' : ''}`}>
        {state.groups.map((group) => {
          const businesses = state.businesses.filter((b) => b.groupId === group.id)
          if (businesses.length === 0) return null

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
              </button>

              <ul className={`scope-tree-branch${compact ? ' scope-tree-branch--compact' : ''}`}>
                {businesses.map((business) => renderBusinessNode(business))}
              </ul>
            </li>
          )
        })}

        {renderUngroupedBusinesses()}
      </ul>
    </section>
  )
}
