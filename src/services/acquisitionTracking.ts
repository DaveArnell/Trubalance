import { tryGetSupabase } from '../lib/supabase'
import { hasAdvertisingConsent } from '../utils/cookieConsent'
import {
  hasAttributionData,
  loadStoredAttribution,
  type MarketingAttribution,
} from '../utils/marketingAttribution'
import { getOrCreateVisitorId } from '../utils/acquisitionVisitor'

export type AcquisitionEventType =
  | 'visit'
  | 'signup_started'
  | 'account_created'
  | 'onboarding_started'
  | 'onboarding_completed'
  | 'checkout_started'
  | 'paid'

function referrerHost(): string | null {
  try {
    const ref = document.referrer
    if (!ref) return null
    const host = new URL(ref).hostname.replace(/^www\./, '')
    if (!host || host === window.location.hostname.replace(/^www\./, '')) return null
    return host.slice(0, 200)
  } catch {
    return null
  }
}

async function ensureVisitorRow(
  visitorId: string,
  attribution: MarketingAttribution | null,
): Promise<void> {
  const supabase = tryGetSupabase()
  if (!supabase) return

  const { error } = await supabase.rpc('ensure_acquisition_visitor', {
    p_id: visitorId,
    p_source: attribution?.source || null,
    p_medium: attribution?.medium || null,
    p_campaign: attribution?.campaign || null,
    p_content: attribution?.content || null,
    p_term: attribution?.term || null,
    p_landing_path: attribution?.landingPath || null,
    p_click_id: attribution?.clickId || null,
    p_referrer_host: referrerHost(),
  })
  if (error) {
    console.warn('Acquisition visitor ensure failed (non-blocking)')
  }
}

/**
 * Best-effort first-party funnel tracking. Never throws to callers.
 * Independent of Meta Pixel consent (same spirit as UTM first-party attribution).
 * @returns true when the visitor row was ensured (event insert may still dedupe).
 */
export async function trackAcquisitionEvent(
  eventType: AcquisitionEventType,
  options?: {
    userId?: string | null
    metadata?: Record<string, unknown>
  },
): Promise<boolean> {
  try {
    const supabase = tryGetSupabase()
    if (!supabase) return false

    const visitorId = getOrCreateVisitorId()
    if (!visitorId) return false

    const attribution = loadStoredAttribution()
    await ensureVisitorRow(visitorId, attribution)

    const row = {
      visitor_id: visitorId,
      user_id: options?.userId ?? null,
      event_type: eventType,
      metadata: options?.metadata ?? {},
    }

    const { error } = await supabase.from('acquisition_events').insert(row)
    if (error) {
      // Unique violations (daily visit / account_created / paid) are expected.
      if (error.code === '23505') return true
      console.warn('Acquisition event insert failed (non-blocking)')
      return true
    }
    return true
  } catch {
    console.warn('Acquisition tracking failed (non-blocking)')
    return false
  }
}

/**
 * Link anonymous visitor → user after signup/login. Best-effort.
 * Does not record account_created (callers that know this is a new signup should).
 */
export async function linkAcquisitionVisitorToUser(userId: string): Promise<void> {
  try {
    const supabase = tryGetSupabase()
    if (!supabase || !userId) return
    const visitorId = getOrCreateVisitorId()
    if (!visitorId) return

    const attribution = loadStoredAttribution()
    // If stored attribution exists, ensure first-touch lands on the visitor row.
    if (attribution && hasAttributionData(attribution)) {
      await ensureVisitorRow(visitorId, attribution)
    } else {
      await ensureVisitorRow(visitorId, null)
    }

    const { error } = await supabase.rpc('link_acquisition_visitor', {
      p_visitor_id: visitorId,
      p_user_id: userId,
    })
    if (error) {
      console.warn('Acquisition visitor link failed (non-blocking)')
    }
  } catch {
    console.warn('Acquisition visitor link failed (non-blocking)')
  }
}

/**
 * Always upsert the visitor row from stored UTMs (safe, first-touch preserved in SQL).
 * Use on tagged landings so Meta tests show a visible RPC even if visit was already counted.
 */
export async function syncAcquisitionVisitorAttribution(): Promise<void> {
  try {
    const visitorId = getOrCreateVisitorId()
    if (!visitorId) return
    await ensureVisitorRow(visitorId, loadStoredAttribution())
  } catch {
    /* non-blocking */
  }
}

const VISIT_DAY_KEY = 'cashprophet-acquisition-visit-day'

/** Once per UTC day per browser (DB also dedupes). Requires optional analytics consent. */
export function trackAcquisitionVisitOncePerDay(): void {
  if (!hasAdvertisingConsent()) return
  const today = new Date().toISOString().slice(0, 10)
  try {
    if (localStorage.getItem(VISIT_DAY_KEY) === today) return
    localStorage.setItem(VISIT_DAY_KEY, today)
  } catch {
    /* continue — still try the insert */
  }
  void trackAcquisitionEvent('visit')
}
