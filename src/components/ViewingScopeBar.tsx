import type { CSSProperties } from 'react'
import type { AppState, ViewScope } from '../types'
import { getBusinessAccentColor, resolveScopeBusinessId } from '../utils/businessTheme'
import { getScopeLevelLabel, getScopePathSegments } from '../utils/scope'

interface ViewingScopeBarProps {
  state: AppState
  viewScope: ViewScope
  /** full = top bar; compact = overview hero */
  variant?: 'full' | 'compact'
}

function segmentAccent(state: AppState, viewScope: ViewScope, isActive: boolean): string | undefined {
  if (!isActive) return undefined
  if (viewScope.type === 'group') return '#52525b'
  const businessId = resolveScopeBusinessId(state, viewScope)
  return businessId ? getBusinessAccentColor(state, businessId) : undefined
}

function scopeSummary(viewScope: ViewScope): string {
  if (viewScope.type === 'group') {
    return 'Totals across every business and venue in this group.'
  }
  if (viewScope.type === 'business') {
    return 'Totals for this business and its venues.'
  }
  return 'Totals for this venue only.'
}

export function ViewingScopeBar({ state, viewScope, variant = 'full' }: ViewingScopeBarProps) {
  const segments = getScopePathSegments(state, viewScope)
  const active = segments.find((segment) => segment.isActive)

  return (
    <div
      className={`viewing-scope-bar viewing-scope-bar--${variant}`}
      aria-label={`Viewing ${segments.map((s) => s.label).join(', ')}`}
    >
      {variant === 'full' && <span className="viewing-scope-bar-heading">Viewing</span>}

      <ol className="viewing-scope-trail">
        {segments.map((segment, index) => {
          const accent = segmentAccent(state, viewScope, segment.isActive)
          return (
            <li
              key={`${segment.level}:${segment.id}`}
              className={`viewing-scope-segment${segment.isActive ? ' is-active' : ''}`}
              style={
                accent
                  ? ({
                      '--segment-accent': accent,
                    } as CSSProperties)
                  : undefined
              }
            >
              {index > 0 && (
                <span className="viewing-scope-separator" aria-hidden>
                  ›
                </span>
              )}
              <span className="viewing-scope-segment-inner">
                <span className="viewing-scope-level">{getScopeLevelLabel(segment.level)}</span>
                <span className="viewing-scope-name" title={segment.label}>
                  {segment.label}
                </span>
              </span>
            </li>
          )
        })}
      </ol>

      {variant === 'full' && active && (
        <p className="viewing-scope-summary muted">{scopeSummary(viewScope)}</p>
      )}
    </div>
  )
}
