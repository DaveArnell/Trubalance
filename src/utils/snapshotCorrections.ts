import type { BalanceSnapshot } from '../types'
import { roundCurrency } from './amounts'
import type { HistoryMetricKey } from './historyTable'

export function getSnapshotRecordedMetric(
  snapshot: BalanceSnapshot,
  metric: HistoryMetricKey,
): number {
  const recorded = snapshot.recordedValues?.[metric]
  if (recorded !== undefined) return recorded
  return snapshot[metric]
}

export function isSnapshotMetricCorrected(
  snapshot: BalanceSnapshot,
  metric: HistoryMetricKey,
): boolean {
  return snapshot.recordedValues?.[metric] !== undefined
}

export function applySnapshotMetricCorrection(
  snapshot: BalanceSnapshot,
  metric: HistoryMetricKey,
  newValue: number,
): BalanceSnapshot {
  const recordedValues = { ...snapshot.recordedValues }
  if (recordedValues[metric] === undefined) {
    recordedValues[metric] = snapshot[metric]
  }

  return {
    ...snapshot,
    [metric]: roundCurrency(newValue),
    recordedValues,
    correctedAt: new Date().toISOString(),
  }
}
