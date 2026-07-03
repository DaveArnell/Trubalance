import type { SubscriptionTierId } from '../../config/subscriptionTiers'
import type { AdminNote, WorkspaceAccessOverride } from '../types'

const NOTES_KEY = 'trubalance-admin-notes'
const ACCESS_KEY = 'trubalance-admin-access'

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeJson<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function loadAdminNotes(userId: string): AdminNote[] {
  const all = readJson<Record<string, AdminNote[]>>(NOTES_KEY, {})
  return all[userId] ?? []
}

export function addAdminNote(userId: string, text: string, author = 'Platform admin'): AdminNote {
  const trimmed = text.trim()
  if (!trimmed) throw new Error('Note cannot be empty')

  const note: AdminNote = {
    id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    userId,
    text: trimmed,
    author,
    createdAt: new Date().toISOString(),
  }

  const all = readJson<Record<string, AdminNote[]>>(NOTES_KEY, {})
  all[userId] = [note, ...(all[userId] ?? [])]
  writeJson(NOTES_KEY, all)
  return note
}

export function loadAllAdminNotes(): AdminNote[] {
  const all = readJson<Record<string, AdminNote[]>>(NOTES_KEY, {})
  return Object.values(all)
    .flat()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export function loadAccessOverride(userId: string): WorkspaceAccessOverride | null {
  const all = readJson<Record<string, WorkspaceAccessOverride>>(ACCESS_KEY, {})
  return all[userId] ?? null
}

export function saveAccessOverride(override: WorkspaceAccessOverride): WorkspaceAccessOverride {
  const all = readJson<Record<string, WorkspaceAccessOverride>>(ACCESS_KEY, {})
  all[override.userId] = { ...override, updatedAt: new Date().toISOString() }
  writeJson(ACCESS_KEY, all)
  return all[override.userId]!
}

export function defaultAccessOverride(
  userId: string,
  plan: SubscriptionTierId,
  trialEndsAt: string | null,
): WorkspaceAccessOverride {
  return {
    userId,
    accessType: 'normal_trial',
    subscriptionPlan: plan,
    betaTester: false,
    lifetimeAccess: false,
    trialEndsAt,
    updatedAt: new Date().toISOString(),
  }
}
