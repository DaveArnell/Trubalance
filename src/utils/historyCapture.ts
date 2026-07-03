import type { Account, AppState, HistoryRecord, ViewScope } from '../types'
import { getAccountBusinessId } from './accounts'
import {
  calculateDashboard,
  getAccountsForScope,
  getCommitmentsForScope,
  getReceiptsForScope,
  getReservePlannersForScope,
} from './calculations'
import {
  buildCommitmentViews,
  getAccruedAmount,
  getDerivedDueRowStatus,
} from './commitmentCalculations'
import { getEffectiveReceiptAmount } from './receiptCalculations'
import { buildReserveAccruingRows, buildReserveDueRows } from './reserveCalculations'
import { newId } from './id'
import { roundCurrency, toAmount } from './amounts'

function parseCaptureDate(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function enrichHistoryAccounts(state: AppState, accounts: Account[]): HistoryRecord['accounts'] {
  return accounts.map((account) => {
    const businessId = getAccountBusinessId(state, account) ?? account.businessId
    const business = businessId ? state.businesses.find((b) => b.id === businessId) : undefined
    const venue = account.venueId ? state.venues.find((v) => v.id === account.venueId) : undefined

    return {
      id: account.id,
      name: account.name,
      type: account.type,
      balance: account.balance,
      venueId: account.venueId,
      businessId: businessId ?? undefined,
      businessName: business?.name,
      venueName: venue?.name ?? null,
      active: account.active,
    }
  })
}

export function captureHistoryRecord(
  state: AppState,
  scope: ViewScope,
  viewName: string,
  date: string,
  savedAt: string,
  note?: string,
): HistoryRecord {
  const referenceDate = parseCaptureDate(date)
  const metrics = calculateDashboard(state, scope)
  const commitments = getCommitmentsForScope(state, scope)
  const reserveRows = buildReserveAccruingRows(state, scope, referenceDate)
  const reserveDueRows = buildReserveDueRows(state, scope, referenceDate)
  const views = buildCommitmentViews(commitments, reserveRows, reserveDueRows, referenceDate)
  const accounts = getAccountsForScope(state, scope)
  const receipts = getReceiptsForScope(state, scope).filter((receipt) => {
    const created = receipt.createdAt?.slice(0, 10)
    if (created && created > date) return false
    return true
  })
  const planners = getReservePlannersForScope(state, scope)

  const cash = roundCurrency(accounts.reduce((sum, account) => sum + account.balance, 0))
  const committedFunds = metrics.committedFunds
  const expectedReceipts = roundCurrency(
    receipts.reduce((sum, receipt) => sum + getEffectiveReceiptAmount(receipt, referenceDate), 0),
  )
  const trueBalance = roundCurrency(cash - committedFunds + expectedReceipts)

  return {
    id: newId(),
    date,
    savedAt,
    viewScope: { ...scope },
    viewName,
    note,
    summary: {
      cash,
      committedFunds,
      expectedReceipts,
      trueBalance,
    },
    accounts: enrichHistoryAccounts(state, accounts),
    buildingUpItems: views.buildingUp
      .filter((row) => row.accruedAmount > 0)
      .map((row) => ({
        rowId:
          row.source === 'reserve' && row.reservePlannerId
            ? `reserve-${row.reservePlannerId}`
            : row.commitment.id,
        name: row.commitment.name,
        accruedAmount: row.accruedAmount,
        budgetAmount: toAmount(row.commitment.amount),
        source: row.source,
        schedule: row.source === 'reserve' ? ('reserve' as const) : row.commitment.schedule,
        scopeLevel: row.commitment.scopeLevel,
        scopeId: row.commitment.scopeId,
      })),
    dueItems: views.due.map((row) => ({
      rowId: row.id,
      name: row.commitment.name,
      amount: row.amount,
      period: row.period,
      status: getDerivedDueRowStatus(row),
      source: row.source,
      schedule: row.source === 'reserve' ? 'reserve' : row.commitment.schedule,
      scopeLevel: row.commitment.scopeLevel,
      scopeId: row.commitment.scopeId,
    })),
    expectedReceipts: receipts.map((r) => ({
      id: r.id,
      name: r.name,
      amount: roundCurrency(getEffectiveReceiptAmount(r, referenceDate)),
      received: r.received,
      scopeLevel: r.scopeLevel,
      scopeId: r.scopeId,
    })),
    commitments: commitments.map((c) => ({
      id: c.id,
      name: c.name,
      amount: c.amount,
      accruedAmount:
        c.schedule === 'monthly'
          ? getAccruedAmount(c, referenceDate)
          : c.schedule === 'planned'
            ? toAmount(c.amount)
            : 0,
      schedule: c.schedule,
      scopeLevel: c.scopeLevel,
      scopeId: c.scopeId,
      status: c.status,
    })),
    reservePlanners: planners.map((p) => ({
      id: p.id,
      name: p.name,
      actualBalance: p.actualBalance,
      bufferAmount: p.bufferAmount,
      businessId: p.businessId,
    })),
  }
}

export function upsertDailyHistoryRecord(
  records: HistoryRecord[],
  record: HistoryRecord,
): HistoryRecord[] {
  const idx = records.findIndex(
    (r) =>
      r.date === record.date &&
      r.viewScope.type === record.viewScope.type &&
      r.viewScope.id === record.viewScope.id,
  )
  if (idx >= 0) {
    return records.map((r, i) => (i === idx ? record : r))
  }
  return [...records, record].sort((a, b) => b.date.localeCompare(a.date))
}
