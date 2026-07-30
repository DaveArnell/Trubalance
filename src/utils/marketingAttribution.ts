/**
 * First-party ad / campaign tracking.
 * Captures tagged link info in the browser, keeps it until signup, then stores it on the profile.
 */

const STORAGE_KEY = 'cashprophet-marketing-attribution-v1'
const MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000

export type MarketingAttribution = {
  /** Where they came from — e.g. meta, google, newsletter */
  source: string
  /** Channel type — e.g. paid, email, social */
  medium: string
  /** Campaign name you chose for the ad set */
  campaign: string
  /** Ad variant — e.g. video_a */
  content: string
  /** Search keyword when used */
  term: string
  /** First page they landed on */
  landingPath: string
  /** Optional Meta/Google click id */
  clickId: string
  capturedAt: string
}

type StoredAttribution = MarketingAttribution & { version: 1 }

function trimParam(value: string | null): string {
  return (value ?? '').trim().slice(0, 200)
}

function readSearchParams(search: string = typeof window !== 'undefined' ? window.location.search : '') {
  return new URLSearchParams(search)
}

/** Pull campaign tags from the current URL if present. */
export function readAttributionFromUrl(search?: string): MarketingAttribution | null {
  if (typeof window === 'undefined' && search == null) return null
  const params = readSearchParams(search)
  const source = trimParam(params.get('utm_source'))
  const medium = trimParam(params.get('utm_medium'))
  const campaign = trimParam(params.get('utm_campaign'))
  const content = trimParam(params.get('utm_content'))
  const term = trimParam(params.get('utm_term'))
  const clickId = trimParam(params.get('gclid') || params.get('fbclid') || params.get('msclkid'))
  const hasTag = Boolean(source || medium || campaign || content || term || clickId)
  if (!hasTag) return null

  return {
    source,
    medium,
    campaign,
    content,
    term,
    landingPath: typeof window !== 'undefined' ? `${window.location.pathname}${window.location.search}` : '',
    clickId,
    capturedAt: new Date().toISOString(),
  }
}

export function loadStoredAttribution(): MarketingAttribution | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredAttribution
    if (!parsed?.capturedAt) return null
    const age = Date.now() - new Date(parsed.capturedAt).getTime()
    if (!Number.isFinite(age) || age < 0 || age > MAX_AGE_MS) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
    return {
      source: parsed.source ?? '',
      medium: parsed.medium ?? '',
      campaign: parsed.campaign ?? '',
      content: parsed.content ?? '',
      term: parsed.term ?? '',
      landingPath: parsed.landingPath ?? '',
      clickId: parsed.clickId ?? '',
      capturedAt: parsed.capturedAt,
    }
  } catch {
    return null
  }
}

export function saveAttribution(attribution: MarketingAttribution) {
  try {
    const payload: StoredAttribution = { ...attribution, version: 1 }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    /* ignore quota / private mode */
  }
}

/**
 * First-touch: if the URL has campaign tags, store them (do not overwrite an
 * earlier tagged visit within 90 days).
 */
export function captureMarketingAttributionFromLocation(search?: string): MarketingAttribution | null {
  const fromUrl = readAttributionFromUrl(search)
  if (!fromUrl) return loadStoredAttribution()

  const existing = loadStoredAttribution()
  if (existing) return existing

  saveAttribution(fromUrl)
  return fromUrl
}

/** Auth metadata fields for signup / OAuth so the DB trigger can stamp the profile. */
export function attributionToAuthMetadata(
  attribution: MarketingAttribution | null,
): Record<string, string> {
  if (!attribution) return {}
  const meta: Record<string, string> = {}
  if (attribution.source) meta.utm_source = attribution.source
  if (attribution.medium) meta.utm_medium = attribution.medium
  if (attribution.campaign) meta.utm_campaign = attribution.campaign
  if (attribution.content) meta.utm_content = attribution.content
  if (attribution.term) meta.utm_term = attribution.term
  if (attribution.landingPath) meta.attribution_landing_path = attribution.landingPath.slice(0, 500)
  if (attribution.clickId) meta.attribution_click_id = attribution.clickId
  return meta
}

export function hasAttributionData(attribution: MarketingAttribution | null | undefined): boolean {
  if (!attribution) return false
  return Boolean(
    attribution.source ||
      attribution.medium ||
      attribution.campaign ||
      attribution.content ||
      attribution.term ||
      attribution.clickId,
  )
}

/** Friendly label for common sources — used in admin UI. */
export function describeAttributionSource(source: string): string {
  const key = source.trim().toLowerCase()
  if (!key) return 'Direct / unknown'
  if (key === 'meta' || key === 'facebook' || key === 'fb' || key === 'instagram' || key === 'ig') {
    return 'Meta (Facebook / Instagram)'
  }
  if (key === 'google' || key === 'adwords' || key === 'googleads') return 'Google Ads'
  if (key === 'linkedin') return 'LinkedIn'
  if (key === 'newsletter' || key === 'email') return 'Email / newsletter'
  if (key === 'youtube') return 'YouTube'
  return source
}

export function campaignGroupingKey(parts: {
  source?: string | null
  campaign?: string | null
  content?: string | null
}): string {
  const source = (parts.source ?? '').trim() || 'direct'
  const campaign = (parts.campaign ?? '').trim() || '(no campaign name)'
  const content = (parts.content ?? '').trim()
  return content ? `${source}::${campaign}::${content}` : `${source}::${campaign}`
}
