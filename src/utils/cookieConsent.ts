/** Advertising / Meta Pixel consent — necessary storage only until the user chooses. */

export const COOKIE_CONSENT_STORAGE_KEY = 'cashprophet-cookie-consent-v1'
export const COOKIE_CONSENT_CHANGED_EVENT = 'cashprophet:cookie-consent-changed'
export const COOKIE_CONSENT_OPEN_EVENT = 'cashprophet:cookie-consent-open'

export type CookieConsentChoice = {
  version: 1
  /** Whether Meta advertising cookies / Pixel may run. */
  advertising: boolean
  updatedAt: string
}

export type CookieConsentState = 'unknown' | 'accepted' | 'rejected'

function parseConsent(raw: string | null): CookieConsentChoice | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Partial<CookieConsentChoice>
    if (parsed.version !== 1 || typeof parsed.advertising !== 'boolean') return null
    return {
      version: 1,
      advertising: parsed.advertising,
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date().toISOString(),
    }
  } catch {
    return null
  }
}

export function readCookieConsent(): CookieConsentChoice | null {
  if (typeof window === 'undefined') return null
  try {
    return parseConsent(localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY))
  } catch {
    return null
  }
}

export function getCookieConsentState(): CookieConsentState {
  const choice = readCookieConsent()
  if (!choice) return 'unknown'
  return choice.advertising ? 'accepted' : 'rejected'
}

export function hasAdvertisingConsent(): boolean {
  return getCookieConsentState() === 'accepted'
}

function writeConsent(advertising: boolean): CookieConsentChoice {
  const choice: CookieConsentChoice = {
    version: 1,
    advertising,
    updatedAt: new Date().toISOString(),
  }
  try {
    localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(choice))
  } catch {
    /* ignore quota / private mode */
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(COOKIE_CONSENT_CHANGED_EVENT, { detail: choice }),
    )
  }
  return choice
}

export function acceptAdvertisingCookies(): CookieConsentChoice {
  return writeConsent(true)
}

export function rejectAdvertisingCookies(): CookieConsentChoice {
  return writeConsent(false)
}

/** Re-open the banner so the user can change or withdraw consent. */
export function openCookiePreferences(): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_OPEN_EVENT))
}
