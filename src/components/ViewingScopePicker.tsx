import { useMemo } from 'react'
import type { AppState, ViewScope } from '../types'
import {
  getSidebarScopePickerOptions,
  parseScopePickerValue,
  scopePickerValue,
} from '../utils/scope'

interface ViewingScopePickerProps {
  state: AppState
  viewScope: ViewScope
  onSelect: (scope: ViewScope) => void
}

export function ViewingScopePicker({ state, viewScope, onSelect }: ViewingScopePickerProps) {
  const options = useMemo(() => getSidebarScopePickerOptions(state), [state])
  const value = scopePickerValue(viewScope)

  if (options.length <= 1) return null

  return (
    <label className="viewing-scope-picker">
      <span className="viewing-scope-picker-label">Viewing</span>
      <select
        className="viewing-scope-picker-select"
        value={value}
        onChange={(e) => {
          const next = parseScopePickerValue(e.target.value)
          if (next) onSelect(next)
        }}
        aria-label="Switch viewing scope"
      >
        {options.map((option) => (
          <option key={scopePickerValue(option.scope)} value={scopePickerValue(option.scope)}>
            {`${'\u00a0'.repeat(option.indent * 2)}${option.label}`}
          </option>
        ))}
      </select>
    </label>
  )
}
