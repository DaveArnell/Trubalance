import type { AppState } from '../types'
import type { WorkspaceSubscription, WorkspaceUsage } from '../types/subscription'
import { createDefaultSubscription } from '../utils/subscriptionAccess'

const STORAGE_KEY = 'trubalance-workspace-subscription'
export const SUBSCRIPTION_UPDATED_EVENT = 'trubalance-subscription-updated'

function readRaw(): WorkspaceSubscription | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as WorkspaceSubscription
  } catch {
    return null
  }
}

export function loadLocalSubscription(): WorkspaceSubscription {
  return readRaw() ?? createDefaultSubscription()
}

export function saveLocalSubscription(subscription: WorkspaceSubscription): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(subscription))
    window.dispatchEvent(new Event(SUBSCRIPTION_UPDATED_EVENT))
  } catch {
    /* ignore */
  }
}

export function buildUsageFromAppState(state: AppState, userCount = 1): WorkspaceUsage {
  return {
    workspaces: 1,
    businesses: state.businesses.length,
    users: userCount,
    venues: state.venues.length,
    accounts: state.accounts.filter((a) => a.active).length,
    reservePlanners: state.reservePlanners.length,
    commitments: state.commitments.length,
    expectedReceipts: state.expectedReceipts.length,
  }
}
