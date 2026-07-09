import type { AppState, ViewScope } from '../types'
import { getCommitmentsForScope, getReceiptsContributingOnDate } from './calculations'
import { sumCommittedFunds } from './commitmentCalculations'
import { getEffectiveReceiptAmount } from './receiptCalculations'
import { dateToKey } from './referenceDate'
import { buildReserveAccruingRows, buildReserveDueRows } from './reserveCalculations'

export function computeExpectedReceiptsAt(
  state: AppState,
  scope: ViewScope,
  referenceDate: Date,
): number {
  const receipts = getReceiptsContributingOnDate(state, scope, dateToKey(referenceDate))
  return receipts.reduce((sum, receipt) => sum + getEffectiveReceiptAmount(receipt, referenceDate), 0)
}

export function computeCommittedFundsAt(
  state: AppState,
  scope: ViewScope,
  referenceDate: Date,
): number {
  const commitments = getCommitmentsForScope(state, scope)
  const reserveRows = buildReserveAccruingRows(state, scope, referenceDate)
  const reserveDueRows = buildReserveDueRows(state, scope, referenceDate)
  return sumCommittedFunds(commitments, reserveRows, reserveDueRows, referenceDate)
}
