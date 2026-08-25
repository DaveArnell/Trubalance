import type { AppState } from '../types'
import { isPersistedSnapshot } from '../utils/scopeSnapshotSeries'
import { tryGetSupabase } from '../lib/supabase'

export type RestorePointKind = 'autosave' | 'manual'

export interface RestorePointMeta {
  id: string
  createdAt: string
  label: string
  kind: RestorePointKind
}

export interface RestorePointPayload {
  version: 1
  snapshots: AppState['snapshots']
  historyRecords: AppState['historyRecords']
  commitments: AppState['commitments']
  expectedReceipts: AppState['expectedReceipts']
  reservePlanners: AppState['reservePlanners']
  accounts: AppState['accounts']
}

const MAX_POINTS = 40

export function buildRestorePointPayload(state: AppState): RestorePointPayload {
  return {
    version: 1,
    snapshots: state.snapshots.filter((snap) => isPersistedSnapshot(snap)),
    historyRecords: (state.historyRecords ?? []).filter((record) => !record.id.startsWith('split-history:')),
    commitments: state.commitments,
    expectedReceipts: state.expectedReceipts,
    reservePlanners: state.reservePlanners,
    accounts: state.accounts,
  }
}

export function applyRestorePointPayload(current: AppState, payload: RestorePointPayload): AppState {
  return {
    ...current,
    workspaceOrigin: 'user',
    snapshots: payload.snapshots ?? current.snapshots,
    historyRecords: payload.historyRecords ?? current.historyRecords,
    commitments: payload.commitments ?? current.commitments,
    expectedReceipts: payload.expectedReceipts ?? current.expectedReceipts,
    reservePlanners: payload.reservePlanners ?? current.reservePlanners,
    accounts: payload.accounts ?? current.accounts,
  }
}

function formatRestoreLabel(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export async function listRestorePoints(workspaceId: string): Promise<RestorePointMeta[]> {
  const supabase = tryGetSupabase()
  if (!supabase) return []
  const { data, error } = await supabase
    .from('workspace_restore_points')
    .select('id, created_at, label, kind')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .limit(MAX_POINTS)
  if (error) {
    if (!/relation .* does not exist/i.test(error.message)) {
      console.warn('[Restore points] list failed', error.message)
    }
    return []
  }
  return (data ?? []).map((row) => ({
    id: String(row.id),
    createdAt: String(row.created_at),
    label: String(row.label || formatRestoreLabel(String(row.created_at))),
    kind: row.kind === 'manual' ? 'manual' : 'autosave',
  }))
}

export async function loadRestorePointPayload(
  workspaceId: string,
  id: string,
): Promise<RestorePointPayload | null> {
  const supabase = tryGetSupabase()
  if (!supabase) return null
  const { data, error } = await supabase
    .from('workspace_restore_points')
    .select('payload')
    .eq('workspace_id', workspaceId)
    .eq('id', id)
    .maybeSingle()
  if (error || !data?.payload) return null
  return data.payload as RestorePointPayload
}

export async function insertRestorePoint(
  workspaceId: string,
  state: AppState,
  kind: RestorePointKind = 'autosave',
): Promise<void> {
  const supabase = tryGetSupabase()
  if (!supabase) return
  const createdAt = new Date().toISOString()
  const { error } = await supabase.from('workspace_restore_points').insert({
    workspace_id: workspaceId,
    created_at: createdAt,
    label: formatRestoreLabel(createdAt),
    kind,
    payload: buildRestorePointPayload(state),
  })
  if (error) {
    if (!/relation .* does not exist/i.test(error.message)) {
      console.warn('[Restore points] save failed', error.message)
    }
    return
  }

  const { data: keep } = await supabase
    .from('workspace_restore_points')
    .select('id')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .limit(MAX_POINTS)
  const keepIds = (keep ?? []).map((row) => String(row.id))
  if (keepIds.length === 0) return
  await supabase
    .from('workspace_restore_points')
    .delete()
    .eq('workspace_id', workspaceId)
    .not('id', 'in', `(${keepIds.join(',')})`)
}
