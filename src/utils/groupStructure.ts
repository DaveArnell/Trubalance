import type { AppState } from '../types'
import { newId } from './id'

function businessesShareGroup(state: AppState): boolean {
  if (state.businesses.length <= 1) return false
  const validGroupIds = new Set(state.groups.map((group) => group.id))
  const groupIds = new Set(
    state.businesses.map((business) => business.groupId).filter((groupId) => validGroupIds.has(groupId)),
  )
  return groupIds.size === 1 && state.businesses.every((business) => validGroupIds.has(business.groupId))
}

/**
 * Multi-business workspaces need one group with every business assigned so roll-up
 * scope and structure view work. Repairs missing groups and orphaned group links.
 */
export function ensureGroupStructure(state: AppState): AppState {
  if (state.businesses.length <= 1) return state
  if (businessesShareGroup(state)) return state

  const groupId = state.groups[0]?.id ?? newId()
  const groupName = state.groups[0]?.name ?? 'Group'

  return {
    ...state,
    groups: [{ id: groupId, name: groupName }],
    businesses: state.businesses.map((business) => ({ ...business, groupId })),
  }
}
