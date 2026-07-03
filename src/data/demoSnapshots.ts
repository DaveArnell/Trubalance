import type { BalanceSnapshot } from '../types'

const groupId = 'group-1'
const bizLaser = 'biz-laser'
const bizSwindon = 'biz-swindon'
const bizBlackpool = 'biz-blackpool'
const venueBournemouth = 'venue-bournemouth'
const venueBristol = 'venue-bristol'
const venueBristolPub = 'venue-bristol-pub'
const venueSwindon = 'venue-swindon'
const venueBlackpool = 'venue-blackpool'

function monthDate(monthsAgo: number): string {
  const d = new Date()
  d.setDate(1)
  d.setHours(12, 0, 0, 0)
  d.setMonth(d.getMonth() - monthsAgo)
  return d.toISOString().slice(0, 10)
}

function snap(
  id: string,
  date: string,
  scopeType: BalanceSnapshot['scopeType'],
  scopeId: string,
  viewName: string,
  trueBalance: number,
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
    changedAccounts: [],
    updatedAt: `${date}T12:00:00.000Z`,
  }
}

/** Monthly demo history for the Laser Tag group — powers the trend chart and history table. */
export function buildDemoSnapshots(): BalanceSnapshot[] {
  const snapshots: BalanceSnapshot[] = []
  const months = 36

  for (let i = months; i >= 0; i--) {
    const date = monthDate(i)
    const t = (months - i) / months
    const peak = Math.exp(-Math.pow((t - 0.45) / 0.22, 2))

    const laser = Math.round(180000 + peak * 420000 + t * 40000)
    const swindon = Math.round(45000 + peak * 95000 + t * 12000)
    const blackpool = Math.round(28000 + peak * 72000 - t * 8000 + (t > 0.7 ? -t * 15000 : 0))
    const total = laser + swindon + blackpool

    snapshots.push(
      snap(`snap-laser-${date}`, date, 'business', bizLaser, 'Laser Tag Leisure Ltd', laser),
      snap(`snap-swindon-${date}`, date, 'business', bizSwindon, 'Swindon Ltd', swindon),
      snap(`snap-blackpool-${date}`, date, 'business', bizBlackpool, 'Blackpool Ltd', blackpool),
      snap(`snap-group-${date}`, date, 'group', groupId, 'Laser Tag Leisure Group', total),
      snap(`snap-venue-bournemouth-${date}`, date, 'venue', venueBournemouth, 'Bournemouth', Math.round(laser * 0.38)),
      snap(`snap-venue-bristol-${date}`, date, 'venue', venueBristol, 'Bristol', Math.round(laser * 0.34)),
      snap(`snap-venue-bristol-pub-${date}`, date, 'venue', venueBristolPub, 'Bristol Pub', Math.round(laser * 0.28)),
      snap(`snap-venue-swindon-${date}`, date, 'venue', venueSwindon, 'Swindon', swindon),
      snap(`snap-venue-blackpool-${date}`, date, 'venue', venueBlackpool, 'Blackpool', blackpool),
    )
  }

  return snapshots
}
