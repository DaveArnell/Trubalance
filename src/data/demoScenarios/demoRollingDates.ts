import type { AppState, Commitment, ExpectedReceipt } from '../../types'
import { daysAheadDateKey, daysAgoDateKey, todayDateKey } from './dateHelpers'

/** Days ahead of “today” for each demo expected receipt (stable relative timing). */
export const DEMO_EXPECTED_RECEIPT_DAYS_AHEAD: Readonly<Record<string, number>> = {
  'lg-r-1': 9,
  'lg-r-2': 4,
  'lg-r-3': 18,
  'cafe-r-1': 5,
  'cafe-r-2': 12,
  'trades-r-1': 14,
  'trades-r-2': 3,
  'trades-r-3': 21,
  'trades-r-4': 7,
  'trades-r-5': 38,
  'trades-r-6': 52,
  'trades-r-7': 28,
  'trades-r-8': 45,
}

/** Accrual start offset (days before today) for demo receipts that build daily. */
export const DEMO_EXPECTED_RECEIPT_ACCRUAL_DAYS_AGO: Readonly<Record<string, number>> = {
  'trades-r-5': 10,
}

/** Days ahead of “today” for each demo planned commitment due date. */
export const DEMO_PLANNED_COMMITMENT_DAYS_AHEAD: Readonly<Record<string, number>> = {
  'lg-c-9': 42,
  'lg-c-10': 35,
  'cafe-c-8': 42,
  'trades-c-7': 90,
}

function rollExpectedReceipt(receipt: ExpectedReceipt, today: Date): ExpectedReceipt {
  if (receipt.received) return receipt

  const daysAhead = DEMO_EXPECTED_RECEIPT_DAYS_AHEAD[receipt.id]
  if (daysAhead == null) return receipt

  const rolled: ExpectedReceipt = {
    ...receipt,
    expectedDate: daysAheadDateKey(daysAhead, today),
  }

  const accrualDaysAgo = DEMO_EXPECTED_RECEIPT_ACCRUAL_DAYS_AGO[receipt.id]
  if (accrualDaysAgo != null) {
    rolled.accrualStartDate = daysAgoDateKey(accrualDaysAgo, today)
  }

  return rolled
}

function rollPlannedCommitment(commitment: Commitment, today: Date): Commitment {
  if (commitment.schedule !== 'planned') return commitment

  const daysAhead = DEMO_PLANNED_COMMITMENT_DAYS_AHEAD[commitment.id]
  if (daysAhead == null) return commitment

  return {
    ...commitment,
    plannedDueDate: daysAheadDateKey(daysAhead, today),
    fundingStartDate: todayDateKey(today),
  }
}

/** Re-anchor dated demo items so they stay the same number of days ahead of today. */
export function rollDemoRelativeDates(state: AppState, today: Date): AppState {
  return {
    ...state,
    expectedReceipts: state.expectedReceipts.map((receipt) => rollExpectedReceipt(receipt, today)),
    commitments: state.commitments.map((commitment) => rollPlannedCommitment(commitment, today)),
  }
}
