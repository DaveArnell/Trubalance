import type { AppState } from '../types'
import { buildLeisureSoloDemoState, leisureDefaultViewScope } from './demoScenarios/leisureSolo'
import { applyDemoOperatingSnapshot } from './demoScenarios/operatingSnapshot'

export function buildInitialState(): AppState {
  return applyDemoOperatingSnapshot(buildLeisureSoloDemoState())
}

/** @deprecated Prefer `buildInitialState()` for fresh rolling dates. */
export const initialState: AppState = buildInitialState()

export const defaultViewScope = leisureDefaultViewScope
