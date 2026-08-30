import type { AppState, BalanceSnapshot } from '../../types'
import { getAccountsForScope } from '../../utils/calculations'
import type { ViewScope } from '../../types'
import { getDemoFrozenDate } from './demoFreeze'

/**
 * Distinct demo Trends shapes — same generator, different seasonal character
 * so the three SEAT demos do not look like scaled copies of one line.
 */
export type DemoTrendShape =
  | 'leisure-summer' // Harbour: summer booking peak, quieter winter
  | 'cafe-steady' // Cornerstone: steadier trade, mild winter dip, spring lift
  | 'salon-autumn' // Grove: quieter spring, stronger late-year appointment season

export interface SnapshotScope {
  id: string
  type: BalanceSnapshot['scopeType']
  name: string
  /** Available Balance at the start of the history window (£). */
  baseTrue: number
  /** Gentle monthly rise — demos should look stable, not explosive. */
  growthPerMonth: number
  /**
   * Soft annual wobble amplitude in £ (peak deviation from the trend).
   * Keep small vs baseTrue so the Trends chart reads as calm and reliable.
   */
  annualWobble?: number
  /** Seasonal character — defaults to a generic sine if omitted. */
  trendShape?: DemoTrendShape
}

function dateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function daysAgoDate(daysAgo: number, today: Date): string {
  const d = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0, 0, 0)
  d.setDate(d.getDate() - daysAgo)
  return dateKey(d)
}

function monthDate(monthsAgo: number, today: Date): string {
  const d = new Date(today.getFullYear(), today.getMonth(), 1, 12, 0, 0, 0)
  d.setMonth(d.getMonth() - monthsAgo)
  return dateKey(d)
}

function snap(
  id: string,
  date: string,
  scopeType: BalanceSnapshot['scopeType'],
  scopeId: string,
  viewName: string,
  trueBalance: number,
  changedAccounts: BalanceSnapshot['changedAccounts'],
): BalanceSnapshot {
  const cash = Math.round(trueBalance * 0.72)
  const committed = Math.round(trueBalance * 0.22)
  const receipts = Math.max(0, trueBalance - cash + committed)
  return {
    id,
    date,
    scopeType,
    scopeId,
    viewName,
    cash,
    committedFunds: committed,
    expectedReceipts: receipts,
    trueBalance,
    freshness: 'green',
    changedAccounts,
    updatedAt: `${date}T12:00:00.000Z`,
  }
}

/** Year fraction within the history window (0 → months). */
function yearFrac(progressMonths: number): number {
  return progressMonths / 12
}

function seasonalAndShortWave(
  progressMonths: number,
  wobble: number,
  shape: DemoTrendShape | undefined,
): number {
  if (wobble === 0) return 0
  const t = yearFrac(progressMonths)
  const monthOfYear = ((progressMonths % 12) + 12) % 12

  if (shape === 'leisure-summer') {
    // Stronger mid-year peak (school holidays / bookings), softer winter trough.
    const seasonal =
      wobble *
      (0.78 * Math.sin(t * Math.PI * 2 - Math.PI / 2) +
        0.28 * Math.sin(t * Math.PI * 4 + 0.55) +
        0.22 * Math.max(0, Math.sin(((monthOfYear - 5) / 12) * Math.PI * 2)))
    const shortWave = wobble * 0.1 * Math.sin(progressMonths * Math.PI * 0.95 + 0.2)
    return seasonal + shortWave
  }

  if (shape === 'cafe-steady') {
    // Flatter overall; noticeable winter dip, spring recovery, mild autumn plateau.
    const seasonal =
      wobble *
      (0.48 * Math.sin(t * Math.PI * 2 + 0.95) +
        0.38 * Math.sin(t * Math.PI * 2 + Math.PI * 0.15) +
        0.18 * Math.sin(t * Math.PI * 6 + 1.1) -
        (monthOfYear >= 11 || monthOfYear <= 1 ? 0.2 : 0))
    const shortWave = wobble * 0.14 * Math.sin(progressMonths * Math.PI * 1.35 + 1.4)
    return seasonal + shortWave
  }

  if (shape === 'salon-autumn') {
    // Quieter early year; builds into late summer / autumn appointment season.
    const seasonal =
      wobble *
      (0.62 * Math.sin(t * Math.PI * 2 + 1.35) +
        0.32 * Math.sin(t * Math.PI * 2 + 2.4) +
        0.25 * Math.max(0, Math.sin(((monthOfYear - 8) / 12) * Math.PI * 2)))
    const shortWave = wobble * 0.11 * Math.sin(progressMonths * Math.PI * 1.05 + 2.1)
    return seasonal + shortWave
  }

  // Generic calm sine (fallback)
  const seasonal = wobble * Math.sin(t * Math.PI * 2 - Math.PI / 2)
  const shortWave = wobble * 0.12 * Math.sin(progressMonths * Math.PI * 1.15 + 0.35)
  return seasonal + shortWave
}

function trueBalanceForScope(
  scope: SnapshotScope,
  months: number,
  monthsAgo: number,
): number {
  const progressMonths = months - monthsAgo
  const trend = scope.baseTrue + scope.growthPerMonth * progressMonths
  const wobble = scope.annualWobble ?? 0
  return Math.round(trend + seasonalAndShortWave(progressMonths, wobble, scope.trendShape))
}

function accountChangesForCash(
  state: AppState,
  scope: ViewScope,
  targetCash: number,
): BalanceSnapshot['changedAccounts'] {
  const accounts = getAccountsForScope(state, scope).filter(
    (a) => a.active && (a.type === 'current' || a.type === 'savings'),
  )
  if (accounts.length === 0) return []

  const total = accounts.reduce((sum, a) => sum + Math.max(a.balance, 1), 0)
  let allocated = 0
  return accounts.map((account, index) => {
    const isLast = index === accounts.length - 1
    const share = isLast
      ? targetCash - allocated
      : Math.round((targetCash * Math.max(account.balance, 1)) / total)
    allocated += share
    const venue = account.venueId
      ? state.venues.find((v) => v.id === account.venueId)
      : undefined
    return {
      accountId: account.id,
      accountName: account.name,
      venueId: account.venueId,
      venueName: venue?.name ?? '',
      balance: share,
    }
  })
}

/**
 * Deep demo history for Trends / balance log / forecasting.
 * Weekly points plus monthly anchors — calm Available series for sales demos.
 * Anchored to the frozen demo calendar so charts stay stable.
 */
export function buildScenarioSnapshots(
  state: AppState,
  months: number,
  scopes: SnapshotScope[],
  today: Date = getDemoFrozenDate(),
): BalanceSnapshot[] {
  const snapshots: BalanceSnapshot[] = []
  const seen = new Set<string>()
  const spanDays = Math.round(months * 30.4375)
  // Weekly cadence keeps the line smooth without overcrowding the chart.
  const weeklyPoints = Math.ceil(spanDays / 7)

  const addSnapshot = (date: string, scope: SnapshotScope, monthsAgo: number) => {
    const key = `${scope.type}:${scope.id}:${date}`
    if (seen.has(key)) return
    seen.add(key)

    const trueBalance = trueBalanceForScope(scope, months, monthsAgo)
    const viewScope: ViewScope = { type: scope.type, id: scope.id }
    const cash = Math.round(trueBalance * 0.72)

    snapshots.push(
      snap(
        `snap-${scope.id}-${date}`,
        date,
        scope.type,
        scope.id,
        scope.name,
        trueBalance,
        accountChangesForCash(state, viewScope, cash),
      ),
    )
  }

  for (let w = weeklyPoints; w >= 0; w--) {
    const daysAgo = w * 7
    const date = daysAgoDate(daysAgo, today)
    const monthsAgo = daysAgo / 30.4375
    for (const scope of scopes) {
      addSnapshot(date, scope, monthsAgo)
    }
  }

  for (let i = months; i > 0; i--) {
    const date = monthDate(i, today)
    for (const scope of scopes) {
      addSnapshot(date, scope, i)
    }
  }

  return snapshots.sort((a, b) => a.date.localeCompare(b.date))
}
