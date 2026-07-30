import { tryGetSupabase } from '../lib/supabase'
import {
  campaignGroupingKey,
  describeAttributionSource,
} from '../utils/marketingAttribution'
import type { CampaignPerformanceRow, CampaignPerformanceSnapshot } from '../admin/types'

type ProfileAttributionRow = {
  id: string
  onboarding_completed: boolean | null
  last_sign_in_at: string | null
  attribution_source: string | null
  attribution_medium: string | null
  attribution_campaign: string | null
  attribution_content: string | null
}

function pct(part: number, whole: number): number {
  if (whole <= 0) return 0
  return Math.round((part / whole) * 1000) / 10
}

function isPaidStatus(status: string | null | undefined, lifetimeAccess: boolean): boolean {
  if (lifetimeAccess) return true
  const s = (status ?? '').toLowerCase()
  return s === 'active' || s === 'lifetime'
}

function isTrialingStatus(status: string | null | undefined): boolean {
  return (status ?? '').toLowerCase() === 'trialing'
}

function buildRows(
  profiles: ProfileAttributionRow[],
  statusByUserId: Map<string, { status: string; lifetimeAccess: boolean }>,
  activeUserIds: Set<string>,
): CampaignPerformanceSnapshot {
  type Acc = {
    source: string
    medium: string
    campaign: string
    content: string
    signedUp: number
    finishedOnboarding: number
    activeInTrial: number
    paid: number
  }

  const groups = new Map<string, Acc>()
  let taggedSignups = 0
  let untaggedSignups = 0

  for (const profile of profiles) {
    const source = (profile.attribution_source ?? '').trim()
    const medium = (profile.attribution_medium ?? '').trim()
    const campaign = (profile.attribution_campaign ?? '').trim()
    const content = (profile.attribution_content ?? '').trim()
    const tagged = Boolean(source || medium || campaign || content)

    if (tagged) taggedSignups += 1
    else untaggedSignups += 1

    const key = campaignGroupingKey({ source, campaign, content })
    let acc = groups.get(key)
    if (!acc) {
      acc = {
        source: source || 'direct',
        medium: medium || (tagged ? '—' : 'none'),
        campaign: campaign || '(no campaign name)',
        content,
        signedUp: 0,
        finishedOnboarding: 0,
        activeInTrial: 0,
        paid: 0,
      }
      groups.set(key, acc)
    }

    acc.signedUp += 1
    if (profile.onboarding_completed) acc.finishedOnboarding += 1

    const sub = statusByUserId.get(profile.id)
    const paid = isPaidStatus(sub?.status, Boolean(sub?.lifetimeAccess))
    if (paid) {
      acc.paid += 1
    } else if (isTrialingStatus(sub?.status) && activeUserIds.has(profile.id)) {
      acc.activeInTrial += 1
    }
  }

  const rows: CampaignPerformanceRow[] = [...groups.entries()]
    .map(([id, acc]) => ({
      id,
      sourceLabel: describeAttributionSource(acc.source === 'direct' ? '' : acc.source),
      source: acc.source,
      medium: acc.medium,
      campaign: acc.campaign,
      content: acc.content,
      signedUp: acc.signedUp,
      finishedOnboarding: acc.finishedOnboarding,
      activeInTrial: acc.activeInTrial,
      paid: acc.paid,
      onboardingRate: pct(acc.finishedOnboarding, acc.signedUp),
      paidRate: pct(acc.paid, acc.signedUp),
    }))
    .sort((a, b) => b.paid - a.paid || b.signedUp - a.signedUp || a.campaign.localeCompare(b.campaign))

  const totals = rows.reduce(
    (sum, row) => ({
      signedUp: sum.signedUp + row.signedUp,
      finishedOnboarding: sum.finishedOnboarding + row.finishedOnboarding,
      activeInTrial: sum.activeInTrial + row.activeInTrial,
      paid: sum.paid + row.paid,
      taggedSignups,
      untaggedSignups,
    }),
    {
      signedUp: 0,
      finishedOnboarding: 0,
      activeInTrial: 0,
      paid: 0,
      taggedSignups,
      untaggedSignups,
    },
  )

  return {
    rows,
    totals,
    generatedAt: new Date().toISOString(),
  }
}

export function emptyCampaignPerformanceSnapshot(): CampaignPerformanceSnapshot {
  return {
    rows: [],
    totals: {
      signedUp: 0,
      finishedOnboarding: 0,
      activeInTrial: 0,
      paid: 0,
      taggedSignups: 0,
      untaggedSignups: 0,
    },
    generatedAt: new Date().toISOString(),
  }
}

/**
 * Groups every signup by the campaign tags saved on their profile, then counts
 * how far each group got: onboarding → trial use → paid.
 */
export async function fetchCampaignPerformanceSnapshot(): Promise<CampaignPerformanceSnapshot> {
  const supabase = tryGetSupabase()
  if (!supabase) return emptyCampaignPerformanceSnapshot()

  const { data: profileRows, error: profileError } = await supabase
    .from('profiles')
    .select(
      'id, onboarding_completed, last_sign_in_at, attribution_source, attribution_medium, attribution_campaign, attribution_content',
    )
    .order('created_at', { ascending: false })
    .limit(5000)

  if (profileError || !profileRows?.length) {
    return emptyCampaignPerformanceSnapshot()
  }

  const profiles = profileRows as ProfileAttributionRow[]
  const userIds = profiles.map((p) => p.id)

  const { data: workspaces } = await supabase
    .from('workspaces')
    .select('id, owner_id, lifetime_access')
    .in('owner_id', userIds)

  const workspaceByOwner = new Map<string, { id: string; lifetimeAccess: boolean }>()
  const workspaceIds: string[] = []
  for (const ws of workspaces ?? []) {
    const ownerId = String(ws.owner_id)
    const id = String(ws.id)
    workspaceByOwner.set(ownerId, {
      id,
      lifetimeAccess: Boolean(ws.lifetime_access),
    })
    workspaceIds.push(id)
  }

  const statusByUserId = new Map<string, { status: string; lifetimeAccess: boolean }>()
  if (workspaceIds.length > 0) {
    const { data: subscriptions } = await supabase
      .from('subscriptions')
      .select('workspace_id, status, lifetime_access')
      .in('workspace_id', workspaceIds)

    const subByWorkspace = new Map<string, { status: string; lifetimeAccess: boolean }>()
    for (const sub of subscriptions ?? []) {
      subByWorkspace.set(String(sub.workspace_id), {
        status: String(sub.status ?? 'free'),
        lifetimeAccess: Boolean(sub.lifetime_access),
      })
    }

    for (const [ownerId, ws] of workspaceByOwner) {
      const sub = subByWorkspace.get(ws.id)
      statusByUserId.set(ownerId, {
        status: sub?.status ?? 'free',
        lifetimeAccess: Boolean(sub?.lifetimeAccess || ws.lifetimeAccess),
      })
    }
  }

  const activeUserIds = new Set<string>()
  for (const profile of profiles) {
    if (profile.last_sign_in_at) activeUserIds.add(profile.id)
  }

  const { data: activityEvents } = await supabase
    .from('user_events')
    .select('user_id, event_type')
    .in('user_id', userIds)
    .in('event_type', ['session', 'balance_update', 'onboarding_complete'])
    .limit(20000)

  for (const event of activityEvents ?? []) {
    const uid = String(event.user_id)
    const type = String(event.event_type)
    if (type === 'session' || type === 'balance_update') activeUserIds.add(uid)
  }

  if (workspaceIds.length > 0) {
    const { data: snapshots } = await supabase
      .from('balance_snapshots')
      .select('workspace_id')
      .in('workspace_id', workspaceIds)
      .limit(10000)

    if (snapshots?.length) {
      const ownerByWorkspace = new Map<string, string>()
      for (const [ownerId, ws] of workspaceByOwner) {
        ownerByWorkspace.set(ws.id, ownerId)
      }
      for (const snap of snapshots) {
        const ownerId = ownerByWorkspace.get(String(snap.workspace_id))
        if (ownerId) activeUserIds.add(ownerId)
      }
    }
  }

  return buildRows(profiles, statusByUserId, activeUserIds)
}
