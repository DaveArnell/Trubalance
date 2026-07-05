import type { AppState } from '../types'
import { buildLeisureGroupDemoState, leisureDefaultViewScope } from './demoScenarios/leisureGroup'
import { applyDemoOperatingSnapshot } from './demoScenarios/operatingSnapshot'

export function buildInitialState(): AppState {
  return applyDemoOperatingSnapshot(buildLeisureGroupDemoState())
}

/** @deprecated Prefer `buildInitialState()` for fresh rolling dates. */
export const initialState: AppState = buildInitialState()

export const defaultViewScope = leisureDefaultViewScope
