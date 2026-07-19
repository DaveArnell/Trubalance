import type { CSSProperties } from 'react'
import type { AppState, ViewScope } from '../types'
import { getBusinessAccentColor, resolveScopeBusinessId } from '../utils/businessTheme'
import { getScopeLevelLabel, getScopePathSegments, getScopeLabel, hasMultipleViewScopes } from '../utils/scope'

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

export function ViewingScopeBar({ state, viewScope, variant = 'full' }: ViewingScopeBarProps) {
  const multiScope = hasMultipleViewScopes(state)
  const segments = getScopePathSegments(state, viewScope)

  if (!multiScope) {
    const label = getScopeLabel(state, viewScope)
    const businessId = resolveScopeBusinessId(state, viewScope)
    const accent = businessId ? getBusinessAccentColor(state, businessId) : undefined
    return (
      <div
        className={`viewing-scope-bar viewing-scope-bar--${variant} viewing-scope-bar--simple`}
        aria-label={`Viewing ${label}`}
      >
        {variant === 'full' && <span className="viewing-scope-bar-heading">Viewing</span>}
        {accent ? (
          <span className="viewing-scope-simple-swatch" style={{ background: accent }} aria-hidden />
        ) : null}
        <span className="viewing-scope-simple-name">{label}</span>
      </div>
    )
  }

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
    </div>
  )
}
