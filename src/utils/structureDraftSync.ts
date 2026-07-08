import type { Account, AccountType, AppState } from '../types'
import { newId } from './id'

export interface GuidedBusinessPayload {
  name: string
  venues: Array<{
    name: string
    accounts: Array<{ name: string; type: AccountType }>
  }>
  businessAccounts?: Array<{ name: string; type: AccountType }>
}

function deactivateAccount(accounts: Account[], id: string): Account[] {
  return accounts.map((a) => (a.id === id ? { ...a, active: false } : a))
}

function renameAccount(accounts: Account[], id: string, name: string): Account[] {
  return accounts.map((a) => (a.id === id ? { ...a, name } : a))
}

function addBusinessAccount(
  accounts: Account[],
  businessId: string,
  name: string,
  type: AccountType,
): Account[] {
  return [
    ...accounts,
    {
      id: newId(),
      businessId,
      name,
      type,
      balance: 0,
      active: true,
      updatedAt: new Date().toISOString(),
    },
  ]
}

function addVenueAccount(
  accounts: Account[],
  venueId: string,
  name: string,
  type: AccountType,
): Account[] {
  return [
    ...accounts,
    {
      id: newId(),
      venueId,
      name,
      type,
      balance: 0,
      active: true,
      updatedAt: new Date().toISOString(),
    },
  ]
}

function syncAccountsAtScope(
  accounts: Account[],
  scope: { businessId?: string; venueId?: string },
  desired: Array<{ name: string; type: AccountType }>,
): Account[] {
  const scoped = accounts.filter((a) =>
    scope.venueId
      ? a.venueId === scope.venueId
      : a.businessId === scope.businessId && !a.venueId,
  )
  const activeScoped = scoped.filter((a) => a.active)
  let next = accounts

  for (const type of ['current', 'savings', 'reserve'] as const) {
    const want = desired.filter((d) => d.type === type)
    const have = activeScoped.filter((a) => a.type === type)

    for (let i = 0; i < want.length; i++) {
      const target = want[i]!
      const existing = have[i]
      if (existing) {
        if (existing.name !== target.name) {
          next = renameAccount(next, existing.id, target.name)
        }
      } else if (scope.venueId) {
        next = addVenueAccount(next, scope.venueId, target.name, target.type)
      } else if (scope.businessId) {
        next = addBusinessAccount(next, scope.businessId, target.name, target.type)
      }
    }

    for (let i = want.length; i < have.length; i++) {
      next = deactivateAccount(next, have[i]!.id)
    }
  }

  return next
}

function addFreshBusinessStructure(
  businessId: string,
  payload: GuidedBusinessPayload,
  venues: AppState['venues'],
  accounts: Account[],
): { venues: AppState['venues']; accounts: Account[] } {
  let nextVenues = venues
  let nextAccounts = accounts

  for (const venueDraft of payload.venues) {
    const venueName = venueDraft.name.trim()
    if (!venueName) continue
    const venueId = newId()
    nextVenues = [...nextVenues, { id: venueId, businessId, name: venueName }]
    nextAccounts = syncAccountsAtScope(nextAccounts, { venueId }, venueDraft.accounts)
  }

  for (const accountDraft of payload.businessAccounts ?? []) {
    const accountName = accountDraft.name.trim()
    if (!accountName) continue
    nextAccounts = addBusinessAccount(nextAccounts, businessId, accountName, accountDraft.type)
  }

  return { venues: nextVenues, accounts: nextAccounts }
}

export function syncGuidedStructureInState(
  state: AppState,
  payloads: GuidedBusinessPayload[],
): Pick<AppState, 'groups' | 'businesses' | 'venues' | 'accounts'> {
  if (payloads.length === 0) {
    return {
      groups: state.groups,
      businesses: state.businesses,
      venues: state.venues,
      accounts: state.accounts,
    }
  }

  let groups = [...state.groups]
  let businesses = [...state.businesses]
  let venues = [...state.venues]
  let accounts = [...state.accounts]

  const groupId = businesses[0]?.groupId ?? groups[0]?.id ?? newId()
  if (!groups.some((g) => g.id === groupId)) {
    groups = [...groups, { id: groupId, name: 'Group' }]
  }

  const removedBusinesses = businesses.slice(payloads.length)
  for (const removed of removedBusinesses) {
    const venueIds = venues.filter((v) => v.businessId === removed.id).map((v) => v.id)
    venues = venues.filter((v) => v.businessId !== removed.id)
    accounts = accounts.map((a) =>
      a.businessId === removed.id || (a.venueId && venueIds.includes(a.venueId))
        ? { ...a, active: false }
        : a,
    )
    businesses = businesses.filter((b) => b.id !== removed.id)
  }

  for (let i = 0; i < payloads.length; i++) {
    const payload = payloads[i]!
    const name = payload.name.trim()
    if (!name) continue

    let business = businesses[i]

    if (!business) {
      const businessId = newId()
      businesses = [...businesses, { id: businessId, groupId, name }]
      const added = addFreshBusinessStructure(businessId, payload, venues, accounts)
      venues = added.venues
      accounts = added.accounts
      continue
    }

    if (business.name !== name) {
      businesses = businesses.map((b) => (b.id === business.id ? { ...b, name } : b))
    }

    if (payload.venues.length === 0) {
      const venueIds = venues.filter((v) => v.businessId === business!.id).map((v) => v.id)
      venues = venues.filter((v) => v.businessId !== business!.id)
      for (const venueId of venueIds) {
        accounts = accounts.map((a) =>
          a.venueId === venueId ? { ...a, active: false } : a,
        )
      }
      accounts = syncAccountsAtScope(accounts, { businessId: business.id }, payload.businessAccounts ?? [])
      continue
    }

    const existingVenues = venues.filter((v) => v.businessId === business!.id)
    const desiredVenues = payload.venues.filter((v) => v.name.trim())

    for (let v = 0; v < desiredVenues.length; v++) {
      const venueDraft = desiredVenues[v]!
      const venueName = venueDraft.name.trim()
      let venue = existingVenues[v]

      if (!venue) {
        const venueId = newId()
        venues = [...venues, { id: venueId, businessId: business.id, name: venueName }]
        accounts = syncAccountsAtScope(accounts, { venueId }, venueDraft.accounts)
        continue
      }

      if (venue.name !== venueName) {
        venues = venues.map((row) => (row.id === venue!.id ? { ...row, name: venueName } : row))
      }
      accounts = syncAccountsAtScope(accounts, { venueId: venue.id }, venueDraft.accounts)
    }

    for (let v = desiredVenues.length; v < existingVenues.length; v++) {
      const extra = existingVenues[v]!
      venues = venues.filter((row) => row.id !== extra.id)
      accounts = accounts.map((a) => (a.venueId === extra.id ? { ...a, active: false } : a))
    }

    const businessLevelAccounts = (payload.businessAccounts ?? []).filter((a) => a.type !== 'current')
    accounts = syncAccountsAtScope(accounts, { businessId: business.id }, businessLevelAccounts)

    const strayBusinessCurrent = accounts.filter(
      (a) => a.active && a.businessId === business!.id && !a.venueId && a.type === 'current',
    )
    for (const stray of strayBusinessCurrent) {
      accounts = deactivateAccount(accounts, stray.id)
    }
  }

  return { groups, businesses, venues, accounts }
}

export interface VenueStructureDraft {
  name: string
  currentAccountName: string
  includeSavings: boolean
  savingsName: string
  includeReserve: boolean
  reserveName: string
}

export interface BusinessStructureDraft {
  name: string
  singleSite: boolean
  currentAccountName: string
  includeBusinessSavings: boolean
  businessSavingsName: string
  venues: VenueStructureDraft[]
}

export function defaultVenueDraft(): VenueStructureDraft {
  return {
    name: '',
    currentAccountName: 'Current account',
    includeSavings: false,
    savingsName: 'Savings account',
    includeReserve: false,
    reserveName: 'Reserve account',
  }
}

export function defaultBusinessDraft(): BusinessStructureDraft {
  return {
    name: '',
    singleSite: false,
    currentAccountName: 'Current account',
    includeBusinessSavings: false,
    businessSavingsName: 'Savings account',
    venues: [defaultVenueDraft()],
  }
}

export function businessDraftsFromState(state: AppState): BusinessStructureDraft[] {
  if (state.businesses.length === 0) return [defaultBusinessDraft()]

  return state.businesses.map((biz) => {
    const bizVenues = state.venues.filter((v) => v.businessId === biz.id)
    const bizAccounts = state.accounts.filter((a) => a.businessId === biz.id && a.active)

    if (bizVenues.length === 0) {
      const current = bizAccounts.find((a) => a.type === 'current')
      const savings = bizAccounts.find((a) => a.type === 'savings')
      return {
        name: biz.name,
        singleSite: true,
        currentAccountName: current?.name ?? 'Current account',
        includeBusinessSavings: Boolean(savings),
        businessSavingsName: savings?.name ?? 'Savings account',
        venues: [defaultVenueDraft()],
      }
    }

    const businessSavings = bizAccounts.find((a) => a.type === 'savings')
    const venues = bizVenues.map((venue) => {
      const venueAccounts = state.accounts.filter((a) => a.venueId === venue.id && a.active)
      const current = venueAccounts.find((a) => a.type === 'current')
      const savings = venueAccounts.find((a) => a.type === 'savings')
      const reserve = venueAccounts.find((a) => a.type === 'reserve')
      return {
        name: venue.name,
        currentAccountName: current?.name ?? 'Current account',
        includeSavings: Boolean(savings),
        savingsName: savings?.name ?? 'Savings account',
        includeReserve: Boolean(reserve),
        reserveName: reserve?.name ?? 'Reserve account',
      }
    })

    return {
      name: biz.name,
      singleSite: false,
      currentAccountName: 'Current account',
      includeBusinessSavings: Boolean(businessSavings),
      businessSavingsName: businessSavings?.name ?? 'Savings account',
      venues: venues.length > 0 ? venues : [defaultVenueDraft()],
    }
  })
}

export function businessDraftToPayload(draft: BusinessStructureDraft): GuidedBusinessPayload | null {
  const name = draft.name.trim()
  if (!name) return null

  if (draft.singleSite) {
    const businessAccounts: Array<{ name: string; type: AccountType }> = [
      { name: draft.currentAccountName.trim() || 'Current account', type: 'current' },
    ]
    if (draft.includeBusinessSavings) {
      businessAccounts.push({
        name: draft.businessSavingsName.trim() || 'Savings account',
        type: 'savings',
      })
    }
    return { name, venues: [], businessAccounts }
  }

  const venuePayload = draft.venues
    .filter((venue) => venue.name.trim())
    .map((venue) => {
      const accountList: Array<{ name: string; type: AccountType }> = [
        { name: venue.currentAccountName.trim() || 'Current account', type: 'current' },
      ]
      if (venue.includeSavings) {
        accountList.push({
          name: venue.savingsName.trim() || 'Savings account',
          type: 'savings',
        })
      }
      if (venue.includeReserve) {
        accountList.push({
          name: venue.reserveName.trim() || 'Reserve account',
          type: 'reserve',
        })
      }
      return { name: venue.name.trim(), accounts: accountList }
    })

  const businessAccounts: Array<{ name: string; type: AccountType }> = []
  if (draft.includeBusinessSavings) {
    businessAccounts.push({
      name: draft.businessSavingsName.trim() || 'Savings account',
      type: 'savings',
    })
  }
  if (venuePayload.length === 0 && !businessAccounts.some((account) => account.type === 'current')) {
    businessAccounts.unshift({ name: 'Current account', type: 'current' })
  }

  return { name, venues: venuePayload, businessAccounts }
}
