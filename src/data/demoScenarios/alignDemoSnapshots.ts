import type { AppState, BalanceSnapshot, ViewScope } from '../../types'
import { calculateDashboard } from '../../utils/calculations'
import { DEMO_FROZEN_DATE_KEY } from './demoFreeze'

function scopeKey(scopeType: BalanceSnapshot['scopeType'], scopeId: string): string {
  return `${scopeType}:${scopeId}`
}

/**
 * Shift authored Trends history so today’s point matches the live demo position.
 * Keeps the calm week/month movement from the authored series instead of comparing
 * a live CPB against an unrelated snapshot baseline (which looked harshly “down”).
 */
export function alignDemoSnapshotsToLivePosition(state: AppState): AppState {
  if (state.workspaceOrigin !== 'builtin-demo' || state.snapshots.length === 0) return state

  const today = DEMO_FROZEN_DATE_KEY
  const scopes = new Map<string, ViewScope>()
  for (const snap of state.snapshots) {
    const key = scopeKey(snap.scopeType, snap.scopeId)
    if (!scopes.has(key)) {
      scopes.set(key, { type: snap.scopeType, id: snap.scopeId })
    }
  }

  const offsetByScope = new Map<string, number>()
  const liveByScope = new Map<
    string,
    { cash: number; committedFunds: number; expectedReceipts: number; trueBalance: number }
  >()

  for (const [key, scope] of scopes) {
    const live = calculateDashboard(state, scope)
    liveByScope.set(key, {
      cash: live.cash,
      committedFunds: live.committedFunds,
      expectedReceipts: live.expectedReceipts,
      trueBalance: live.trueBalance,
    })
    const scoped = state.snapshots.filter(
      (snap) => snap.scopeType === scope.type && snap.scopeId === scope.id,
    )
    const todaySnap =
      scoped.find((snap) => snap.date === today) ??
      [...scoped].sort((a, b) => a.date.localeCompare(b.date)).at(-1)
    if (!todaySnap) continue
    offsetByScope.set(key, live.trueBalance - todaySnap.trueBalance)
  }

  const snapshots = state.snapshots.map((snap) => {
    const key = scopeKey(snap.scopeType, snap.scopeId)
    const offset = offsetByScope.get(key) ?? 0
    const live = liveByScope.get(key)
    if (live && snap.date === today) {
      return {
        ...snap,
        cash: live.cash,
        committedFunds: live.committedFunds,
        expectedReceipts: live.expectedReceipts,
        trueBalance: live.trueBalance,
      }
    }
    if (offset === 0) return snap
    return {
      ...snap,
      trueBalance: Math.round(snap.trueBalance + offset),
      cash: Math.round(snap.cash + offset),
    }
  })

  return { ...state, snapshots }
}
