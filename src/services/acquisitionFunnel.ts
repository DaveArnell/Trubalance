import { tryGetSupabase } from '../lib/supabase'
import { describeAttributionSource } from '../utils/marketingAttribution'

export type FunnelDatePreset = 'today' | '7d' | '30d' | 'custom'

export type AcquisitionFunnelStageId =
  | 'visitors'
  | 'signup_started'
  | 'accounts'
  | 'onboarding_started'
  | 'onboarding_completed'
  | 'checkout_started'
  | 'paid'

export type AcquisitionFunnelStage = {
  id: AcquisitionFunnelStageId
  label: string
  count: number
  fromPreviousPct: number | null
  fromTopPct: number | null
  droppedFromPrevious: number
  droppedFromPreviousPct: number | null
}

export type AcquisitionSourceRow = {
  key: string
  sourceLabel: string
  campaign: string
  content: string
  visitors: number
  accounts: number
  onboardingCompleted: number
  checkoutStarted: number
  paid: number
  visitorToAccountPct: number
  accountToPaidPct: number
}

export type AcquisitionFunnelSnapshot = {
  rangeStart: string
  rangeEnd: string
  preset: FunnelDatePreset
  /** Cohort that entered during the selected acquisition window. */
  stages: AcquisitionFunnelStage[]
  headlines: {
    visitors: number
    accounts: number
    onboardingCompleted: number
    checkoutStarted: number
    paidFromCohort: number
    becamePaidInPeriod: number
    visitorToAccountPct: number
    accountToPaidPct: number
  }
  sources: AcquisitionSourceRow[]
  notes: string[]
}

function pct(part: number, whole: number): number {
  if (whole <= 0) return 0
  return Math.round((part / whole) * 1000) / 10
}

function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0))
}

function endOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999))
}

export function resolveFunnelRange(
  preset: FunnelDatePreset,
  customStart?: string,
  customEnd?: string,
): { start: Date; end: Date } {
  const now = new Date()
  const end = endOfUtcDay(now)
  if (preset === 'today') {
    return { start: startOfUtcDay(now), end }
  }
  if (preset === '7d') {
    const s = startOfUtcDay(now)
    s.setUTCDate(s.getUTCDate() - 6)
    return { start: s, end }
  }
  if (preset === 'custom' && customStart && customEnd) {
    return {
      start: startOfUtcDay(new Date(customStart)),
      end: endOfUtcDay(new Date(customEnd)),
    }
  }
  // default 30d
  const s = startOfUtcDay(now)
  s.setUTCDate(s.getUTCDate() - 29)
  return { start: s, end }
}

function sourceBucket(source: string | null | undefined, medium: string | null | undefined): string {
  const s = (source ?? '').trim().toLowerCase()
  const m = (medium ?? '').trim().toLowerCase()
  if (!s && !m) return 'Direct / unknown'
  if (s === 'meta' || s === 'facebook' || s === 'instagram' || s === 'fb' || s === 'ig') {
    return m === 'paid' || m === 'cpc' || m === 'ppc' ? 'Meta paid' : 'Meta'
  }
  if (s === 'google' && (m === 'organic' || m === 'seo' || !m)) return 'Organic / search'
  if (m === 'organic' || s === 'bing' || s === 'yahoo') return 'Organic / search'
  if (s === 'google' && (m === 'cpc' || m === 'paid' || m === 'ppc')) return 'Google paid'
  return describeAttributionSource(source ?? '')
}

type VisitorRow = {
  id: string
  first_seen_at: string
  attribution_source: string | null
  attribution_medium: string | null
  attribution_campaign: string | null
  attribution_content: string | null
  linked_user_id: string | null
}

type EventRow = {
  visitor_id: string | null
  user_id: string | null
  event_type: string
  created_at: string
}

type ProfileRow = {
  id: string
  created_at: string
  onboarding_completed: boolean | null
  attribution_source: string | null
  attribution_medium: string | null
  attribution_campaign: string | null
  attribution_content: string | null
}

function buildStage(
  id: AcquisitionFunnelStageId,
  label: string,
  count: number,
  previous: number | null,
  top: number,
): AcquisitionFunnelStage {
  const dropped = previous == null ? 0 : Math.max(0, previous - count)
  return {
    id,
    label,
    count,
    fromPreviousPct: previous == null ? null : pct(count, previous),
    fromTopPct: pct(count, top),
    droppedFromPrevious: dropped,
    droppedFromPreviousPct: previous == null ? null : pct(dropped, previous),
  }
}

export async function fetchAcquisitionFunnelSnapshot(
  preset: FunnelDatePreset = '30d',
  customStart?: string,
  customEnd?: string,
): Promise<AcquisitionFunnelSnapshot> {
  const { start, end } = resolveFunnelRange(preset, customStart, customEnd)
  const startIso = start.toISOString()
  const endIso = end.toISOString()
  const notes: string[] = [
    'Figures are unique people in the acquisition cohort for this date range (first visit or account created in range).',
    'Paid from cohort can lag ~30 days because of the free trial — a low paid count early in a campaign is often normal.',
  ]

  const empty = (): AcquisitionFunnelSnapshot => ({
    rangeStart: startIso.slice(0, 10),
    rangeEnd: endIso.slice(0, 10),
    preset,
    stages: [
      buildStage('visitors', 'Site visitors', 0, null, 0),
      buildStage('signup_started', 'Signup started', 0, 0, 0),
      buildStage('accounts', 'Account created', 0, 0, 0),
      buildStage('onboarding_started', 'Onboarding started', 0, 0, 0),
      buildStage('onboarding_completed', 'Onboarding completed', 0, 0, 0),
      buildStage('checkout_started', 'Checkout started', 0, 0, 0),
      buildStage('paid', 'Paying customers (cohort)', 0, 0, 0),
    ],
    headlines: {
      visitors: 0,
      accounts: 0,
      onboardingCompleted: 0,
      checkoutStarted: 0,
      paidFromCohort: 0,
      becamePaidInPeriod: 0,
      visitorToAccountPct: 0,
      accountToPaidPct: 0,
    },
    sources: [],
    notes: [
      ...notes,
      'Anonymous visitor tracking starts from when this feature was deployed — older visits are not backfilled.',
    ],
  })

  const supabase = tryGetSupabase()
  if (!supabase) return empty()

  const [visitorsRes, profilesRes, paymentsRes] = await Promise.all([
    supabase
      .from('acquisition_visitors')
      .select(
        'id, first_seen_at, attribution_source, attribution_medium, attribution_campaign, attribution_content, linked_user_id',
      )
      .gte('first_seen_at', startIso)
      .lte('first_seen_at', endIso)
      .limit(20000),
    supabase
      .from('profiles')
      .select(
        'id, created_at, onboarding_completed, attribution_source, attribution_medium, attribution_campaign, attribution_content',
      )
      .gte('created_at', startIso)
      .lte('created_at', endIso)
      .limit(10000),
    supabase
      .from('payments')
      .select('workspace_id, paid_at, status')
      .eq('status', 'succeeded')
      .gte('paid_at', startIso)
      .lte('paid_at', endIso)
      .limit(5000),
  ])

  if (visitorsRes.error) {
    notes.push('Visitor tables are not available yet (migration may still be applying).')
  }

  const visitors = (visitorsRes.data ?? []) as VisitorRow[]
  const profiles = (profilesRes.data ?? []) as ProfileRow[]

  const linkedUserIds = new Set(
    visitors.map((v) => v.linked_user_id).filter((id): id is string => Boolean(id)),
  )
  const cohortProfileIds = new Set(profiles.map((p) => p.id))
  for (const id of cohortProfileIds) linkedUserIds.add(id)

  const visitorByUser = new Map<string, string>()
  for (const v of visitors) {
    if (v.linked_user_id) visitorByUser.set(v.linked_user_id, v.id)
  }

  const visitorIds = visitors.map((v) => v.id)
  const userIds = [...linkedUserIds]

  let events: EventRow[] = []
  if (visitorIds.length > 0 || userIds.length > 0) {
    const queries = []
    if (visitorIds.length > 0) {
      queries.push(
        supabase
          .from('acquisition_events')
          .select('visitor_id, user_id, event_type, created_at')
          .in('visitor_id', visitorIds.slice(0, 5000))
          .limit(30000),
      )
    }
    if (userIds.length > 0) {
      queries.push(
        supabase
          .from('acquisition_events')
          .select('visitor_id, user_id, event_type, created_at')
          .in('user_id', userIds.slice(0, 5000))
          .limit(30000),
      )
    }
    const eventResults = await Promise.all(queries)
    const seen = new Set<string>()
    for (const res of eventResults) {
      for (const row of (res.data ?? []) as EventRow[]) {
        const key = `${row.visitor_id}|${row.user_id}|${row.event_type}|${row.created_at}`
        if (seen.has(key)) continue
        seen.add(key)
        events.push(row)
      }
    }
  }

  const eventsForVisitor = new Map<string, Set<string>>()
  const eventsForUser = new Map<string, Set<string>>()
  for (const ev of events) {
    if (ev.visitor_id) {
      let set = eventsForVisitor.get(ev.visitor_id)
      if (!set) {
        set = new Set()
        eventsForVisitor.set(ev.visitor_id, set)
      }
      set.add(ev.event_type)
    }
    if (ev.user_id) {
      let set = eventsForUser.get(ev.user_id)
      if (!set) {
        set = new Set()
        eventsForUser.set(ev.user_id, set)
      }
      set.add(ev.event_type)
    }
  }

  const hasEvent = (visitorId: string | null, userId: string | null, type: string) => {
    if (visitorId && eventsForVisitor.get(visitorId)?.has(type)) return true
    if (userId && eventsForUser.get(userId)?.has(type)) return true
    return false
  }

  const people: Array<{
    visitorId: string | null
    userId: string | null
    source: string
    campaign: string
    content: string
    medium: string
  }> = []

  for (const v of visitors) {
    people.push({
      visitorId: v.id,
      userId: v.linked_user_id,
      source: v.attribution_source ?? '',
      medium: v.attribution_medium ?? '',
      campaign: v.attribution_campaign ?? '',
      content: v.attribution_content ?? '',
    })
  }
  for (const p of profiles) {
    if (visitorByUser.has(p.id)) continue
    people.push({
      visitorId: null,
      userId: p.id,
      source: p.attribution_source ?? '',
      medium: p.attribution_medium ?? '',
      campaign: p.attribution_campaign ?? '',
      content: p.attribution_content ?? '',
    })
  }

  const visitorsCount = people.length

  let signupStarted = 0
  let accounts = 0
  let onboardingStarted = 0
  let onboardingCompleted = 0
  let checkoutStarted = 0
  let paidFromCohort = 0

  type SrcAcc = {
    sourceLabel: string
    campaign: string
    content: string
    visitors: number
    accounts: number
    onboardingCompleted: number
    checkoutStarted: number
    paid: number
  }
  const sourceMap = new Map<string, SrcAcc>()

  for (const person of people) {
    const bucket = sourceBucket(person.source, person.medium)
    const campaign = person.campaign || '(no campaign)'
    const content = person.content || ''
    const key = `${bucket}||${campaign}||${content}`
    let acc = sourceMap.get(key)
    if (!acc) {
      acc = {
        sourceLabel: bucket,
        campaign,
        content,
        visitors: 0,
        accounts: 0,
        onboardingCompleted: 0,
        checkoutStarted: 0,
        paid: 0,
      }
      sourceMap.set(key, acc)
    }
    acc.visitors += 1

    // Only treat as a new account if the Cash Prophet profile was created in-range.
    // Returning customers who browse/login must not inflate acquisitions.
    const isNewAccount = Boolean(person.userId && cohortProfileIds.has(person.userId))

    const startedSignup =
      isNewAccount ||
      hasEvent(person.visitorId, person.userId, 'signup_started') ||
      (isNewAccount && hasEvent(person.visitorId, person.userId, 'account_created'))
    if (startedSignup) signupStarted += 1

    if (isNewAccount) {
      accounts += 1
      acc.accounts += 1
    }

    const profile = person.userId
      ? profiles.find((p) => p.id === person.userId)
      : undefined
    const onboardedFlag = Boolean(profile?.onboarding_completed)

    if (
      isNewAccount &&
      (hasEvent(person.visitorId, person.userId, 'onboarding_started') || onboardedFlag)
    ) {
      onboardingStarted += 1
    }
    if (
      isNewAccount &&
      (hasEvent(person.visitorId, person.userId, 'onboarding_completed') || onboardedFlag)
    ) {
      onboardingCompleted += 1
      acc.onboardingCompleted += 1
    }
    if (isNewAccount && hasEvent(person.visitorId, person.userId, 'checkout_started')) {
      checkoutStarted += 1
      acc.checkoutStarted += 1
    }
    if (isNewAccount && hasEvent(person.visitorId, person.userId, 'paid')) {
      paidFromCohort += 1
      acc.paid += 1
    }
  }

  // Enrich onboarding/paid from full profile + subscription for NEW accounts in cohort only
  if (cohortProfileIds.size > 0) {
    const ids = [...cohortProfileIds].slice(0, 5000)
    const { data: linkedProfiles } = await supabase
      .from('profiles')
      .select('id, onboarding_completed')
      .in('id', ids)
    const onboarded = new Set(
      (linkedProfiles ?? [])
        .filter((p) => p.onboarding_completed)
        .map((p) => String(p.id)),
    )

    onboardingCompleted = 0
    onboardingStarted = 0
    for (const person of people) {
      if (!person.userId || !cohortProfileIds.has(person.userId)) continue
      const userOnboarded = onboarded.has(person.userId)
      if (
        userOnboarded ||
        hasEvent(person.visitorId, person.userId, 'onboarding_completed')
      ) {
        onboardingCompleted += 1
      }
      if (
        userOnboarded ||
        hasEvent(person.visitorId, person.userId, 'onboarding_started') ||
        hasEvent(person.visitorId, person.userId, 'onboarding_completed')
      ) {
        onboardingStarted += 1
      }
    }

    for (const acc of sourceMap.values()) {
      acc.onboardingCompleted = 0
      acc.paid = 0
      acc.checkoutStarted = 0
    }
    for (const person of people) {
      if (!person.userId || !cohortProfileIds.has(person.userId)) continue
      const bucket = sourceBucket(person.source, person.medium)
      const campaign = person.campaign || '(no campaign)'
      const content = person.content || ''
      const key = `${bucket}||${campaign}||${content}`
      const acc = sourceMap.get(key)
      if (!acc) continue

      const userOnboarded = onboarded.has(person.userId)
      if (userOnboarded || hasEvent(person.visitorId, person.userId, 'onboarding_completed')) {
        acc.onboardingCompleted += 1
      }
      if (hasEvent(person.visitorId, person.userId, 'checkout_started')) {
        acc.checkoutStarted += 1
      }
    }

    checkoutStarted = 0
    for (const person of people) {
      if (!person.userId || !cohortProfileIds.has(person.userId)) continue
      if (hasEvent(person.visitorId, person.userId, 'checkout_started')) checkoutStarted += 1
    }

    const { data: members } = await supabase
      .from('workspace_members')
      .select('user_id, workspace_id')
      .in('user_id', ids)
      .eq('role', 'owner')
    const workspaceToUser = new Map<string, string>()
    for (const m of members ?? []) {
      workspaceToUser.set(String(m.workspace_id), String(m.user_id))
    }
    const workspaceIds = [...workspaceToUser.keys()]
    const paidUsers = new Set<string>()
    if (workspaceIds.length > 0) {
      const { data: pays } = await supabase
        .from('payments')
        .select('workspace_id, amount_cents, status')
        .in('workspace_id', workspaceIds)
        .eq('status', 'succeeded')
        .gt('amount_cents', 0)
      for (const pay of pays ?? []) {
        const uid = workspaceToUser.get(String(pay.workspace_id))
        if (uid) paidUsers.add(uid)
      }
    }
    for (const person of people) {
      if (!person.userId || !cohortProfileIds.has(person.userId)) continue
      if (hasEvent(person.visitorId, person.userId, 'paid')) paidUsers.add(person.userId)
    }
    paidFromCohort = paidUsers.size

    for (const person of people) {
      if (!person.userId || !paidUsers.has(person.userId)) continue
      const bucket = sourceBucket(person.source, person.medium)
      const campaign = person.campaign || '(no campaign)'
      const content = person.content || ''
      const key = `${bucket}||${campaign}||${content}`
      const acc = sourceMap.get(key)
      if (acc) acc.paid += 1
    }
  }

  // Payments that occurred in period (not cohort-bound)
  let becamePaidInPeriod = 0
  const paymentRows = paymentsRes.data ?? []
  if (paymentRows.length > 0) {
    const wsIds = [...new Set(paymentRows.map((p) => String(p.workspace_id)))]
    const { data: owners } = await supabase
      .from('workspace_members')
      .select('user_id, workspace_id')
      .in('workspace_id', wsIds)
      .eq('role', 'owner')
    becamePaidInPeriod = new Set((owners ?? []).map((o) => String(o.user_id))).size
  }

  const top = Math.max(visitorsCount, 1)
  const stages: AcquisitionFunnelStage[] = [
    buildStage('visitors', 'Site visitors', visitorsCount, null, top),
    buildStage('signup_started', 'Signup started', signupStarted, visitorsCount, top),
    buildStage('accounts', 'Account created', accounts, signupStarted, top),
    buildStage('onboarding_started', 'Onboarding started', onboardingStarted, accounts, top),
    buildStage(
      'onboarding_completed',
      'Onboarding completed',
      onboardingCompleted,
      onboardingStarted,
      top,
    ),
    buildStage('checkout_started', 'Checkout started', checkoutStarted, onboardingCompleted, top),
    buildStage('paid', 'Paying customers (from this cohort)', paidFromCohort, checkoutStarted, top),
  ]

  const sources: AcquisitionSourceRow[] = [...sourceMap.entries()]
    .map(([key, acc]) => ({
      key,
      sourceLabel: acc.sourceLabel,
      campaign: acc.campaign,
      content: acc.content,
      visitors: acc.visitors,
      accounts: acc.accounts,
      onboardingCompleted: acc.onboardingCompleted,
      checkoutStarted: acc.checkoutStarted,
      paid: acc.paid,
      visitorToAccountPct: pct(acc.accounts, acc.visitors),
      accountToPaidPct: pct(acc.paid, acc.accounts),
    }))
    .sort((a, b) => b.visitors - a.visitors || b.accounts - a.accounts)

  if (visitors.length === 0) {
    notes.push(
      'No anonymous visitor rows in this range yet. Account/onboarding/paid figures still use Cash Prophet account data where available.',
    )
  }

  return {
    rangeStart: startIso.slice(0, 10),
    rangeEnd: endIso.slice(0, 10),
    preset,
    stages,
    headlines: {
      visitors: visitorsCount,
      accounts,
      onboardingCompleted,
      checkoutStarted,
      paidFromCohort,
      becamePaidInPeriod,
      visitorToAccountPct: pct(accounts, visitorsCount),
      accountToPaidPct: pct(paidFromCohort, accounts),
    },
    sources,
    notes,
  }
}
