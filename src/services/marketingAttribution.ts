import { tryGetSupabase } from '../lib/supabase'
import { hasAdvertisingConsent } from '../utils/cookieConsent'
import {
  attributionToAuthMetadata,
  captureMarketingAttributionFromLocation,
  hasAttributionData,
  loadStoredAttribution,
  type MarketingAttribution,
} from '../utils/marketingAttribution'
import { trackEvent } from './eventTracking'

/** Call on public page loads after optional analytics consent is given. */
export function captureMarketingAttributionOnVisit() {
  if (typeof window === 'undefined') return
  if (!hasAdvertisingConsent()) return
  captureMarketingAttributionFromLocation()
}

export function getAttributionAuthMetadata(): Record<string, string> {
  return attributionToAuthMetadata(loadStoredAttribution())
}

/**
 * Write stored campaign tags onto the profile if they are still empty.
 * Safe to call after email signup or Google sign-in.
 */
export async function attachMarketingAttributionToProfile(userId: string): Promise<boolean> {
  const attribution = loadStoredAttribution()
  if (!hasAttributionData(attribution) || !attribution) return false

  const supabase = tryGetSupabase()
  if (!supabase) return false

  const { data: existing, error: readError } = await supabase
    .from('profiles')
    .select('attribution_source, attribution_campaign, attribution_click_id')
    .eq('id', userId)
    .maybeSingle()

  if (readError) return false

  const alreadyTagged = Boolean(
    existing?.attribution_source || existing?.attribution_campaign || existing?.attribution_click_id,
  )
  if (alreadyTagged) return false

  const patch = {
    attribution_source: attribution.source || null,
    attribution_medium: attribution.medium || null,
    attribution_campaign: attribution.campaign || null,
    attribution_content: attribution.content || null,
    attribution_term: attribution.term || null,
    attribution_landing_path: attribution.landingPath || null,
    attribution_captured_at: attribution.capturedAt || new Date().toISOString(),
    attribution_click_id: attribution.clickId || null,
  }

  const { error } = await supabase.from('profiles').update(patch).eq('id', userId)
  if (error) return false

  await trackEvent('marketing_attribution_attached', userId, undefined, {
    source: attribution.source,
    medium: attribution.medium,
    campaign: attribution.campaign,
    content: attribution.content,
  })
  return true
}

export type { MarketingAttribution }
