import { tryGetSupabase } from '../lib/supabase'
import { hasAdvertisingConsent } from '../utils/cookieConsent'
import { newMetaEventId } from '../utils/metaMatching'
import {
  buildMetaUserMatching,
  trackMetaPixelCustomEvent,
  trackMetaPixelEvent,
} from './metaPixel'

const SIGNUP_STARTED_KEY = 'cashprophet-meta-signup-started'
const REG_TRACKED_PREFIX = 'cashprophet-meta-reg-tracked:'
const ONBOARDING_STARTED_PREFIX = 'cashprophet-meta-onboarding-started:'
const ONBOARDING_COMPLETED_PREFIX = 'cashprophet-meta-onboarding-completed:'
export const OAUTH_SIGNUP_INTENT_KEY = 'cashprophet-meta-oauth-signup-intent'

/** Mark that the next Google OAuth return may be a new registration from /signup. */
export function markMetaOAuthSignupIntent(): void {
  try {
    sessionStorage.setItem(OAUTH_SIGNUP_INTENT_KEY, '1')
  } catch {
    /* ignore */
  }
}

function consumeOAuthSignupIntent(): boolean {
  try {
    const v = sessionStorage.getItem(OAUTH_SIGNUP_INTENT_KEY)
    sessionStorage.removeItem(OAUTH_SIGNUP_INTENT_KEY)
    return v === '1'
  } catch {
    return false
  }
}

function alreadyTracked(key: string): boolean {
  try {
    return localStorage.getItem(key) === '1'
  } catch {
    return false
  }
}

function markTracked(key: string): void {
  try {
    localStorage.setItem(key, '1')
  } catch {
    /* ignore */
  }
}

/**
 * Best-effort CAPI invoke. Never throws to callers — product flows must continue.
 * Requires advertising consent; server also rejects without advertisingConsent: true.
 */
async function sendMetaCapi(payload: {
  eventName: string
  eventId: string
  eventTime?: number
  customData?: Record<string, string | number | boolean | undefined>
  email?: string | null
  userId?: string | null
  sourceUrl?: string
}): Promise<void> {
  try {
    if (!hasAdvertisingConsent()) return
    const supabase = tryGetSupabase()
    if (!supabase) return

    const userData = await buildMetaUserMatching({
      email: payload.email,
      userId: payload.userId,
    })

    const customData: Record<string, string | number | boolean> = {}
    if (payload.customData) {
      for (const [key, value] of Object.entries(payload.customData)) {
        if (value !== undefined) customData[key] = value
      }
    }

    const { error } = await supabase.functions.invoke('meta-capi', {
      body: {
        advertisingConsent: true,
        eventName: payload.eventName,
        eventId: payload.eventId,
        eventTime: payload.eventTime ?? Math.floor(Date.now() / 1000),
        eventSourceUrl:
          payload.sourceUrl ??
          (typeof window !== 'undefined' ? window.location.href : undefined),
        userData,
        customData: Object.keys(customData).length ? customData : undefined,
      },
    })
    if (error) {
      // Swallow — do not surface to UI
      console.warn('Meta CAPI invoke failed (non-blocking)')
    }
  } catch {
    console.warn('Meta CAPI invoke failed (non-blocking)')
  }
}

/** Meaningful start of signup (once per browser). Pixel only. */
export function trackMetaSignupStarted(): void {
  try {
    if (!hasAdvertisingConsent()) return
    if (alreadyTracked(SIGNUP_STARTED_KEY)) return
    markTracked(SIGNUP_STARTED_KEY)
    const eventId = newMetaEventId('signup_started')
    trackMetaPixelCustomEvent('SignupStarted', { content_name: 'signup' }, eventId)
  } catch {
    /* ignore */
  }
}

/**
 * Account created (= trial started). Pixel + CAPI with event_id reg_<userId>.
 */
export async function trackMetaCompleteRegistration(input: {
  userId: string
  email?: string | null
  method: 'email' | 'google'
}): Promise<void> {
  try {
    if (!hasAdvertisingConsent()) return
    const key = `${REG_TRACKED_PREFIX}${input.userId}`
    if (alreadyTracked(key)) return
    markTracked(key)

    const eventId = `reg_${input.userId}`
    trackMetaPixelEvent(
      'CompleteRegistration',
      { content_name: 'signup', status: true, registration_method: input.method },
      eventId,
    )
    await sendMetaCapi({
      eventName: 'CompleteRegistration',
      eventId,
      email: input.email,
      userId: input.userId,
      customData: {
        content_name: 'signup',
        status: true,
        registration_method: input.method,
      },
    })
  } catch {
    /* ignore */
  }
}

/**
 * Google OAuth: fire CompleteRegistration only on the account's first sign-in.
 *
 * Relies on Supabase Auth timestamps (not a long age window):
 * on the first sign-in, `created_at` and `last_sign_in_at` are set together;
 * on any later login, `last_sign_in_at` moves forward while `created_at` stays put.
 * That avoids a same-day returning Google user re-firing CompleteRegistration
 * (which a "created within 24h" heuristic would allow on another device).
 */
export async function maybeTrackMetaGoogleRegistration(user: {
  id: string
  email?: string | null
  created_at?: string
  last_sign_in_at?: string | null
  app_metadata?: { provider?: string; providers?: string[] }
  identities?: Array<{ provider?: string }>
}): Promise<void> {
  try {
    if (!hasAdvertisingConsent()) return
    const key = `${REG_TRACKED_PREFIX}${user.id}`
    if (alreadyTracked(key)) return

    const providers = new Set<string>()
    if (user.app_metadata?.provider) providers.add(user.app_metadata.provider)
    for (const p of user.app_metadata?.providers ?? []) providers.add(p)
    for (const identity of user.identities ?? []) {
      if (identity.provider) providers.add(identity.provider)
    }
    if (!providers.has('google')) {
      consumeOAuthSignupIntent()
      return
    }

    const createdAt = user.created_at ? Date.parse(user.created_at) : NaN
    const lastSignInAt = user.last_sign_in_at ? Date.parse(user.last_sign_in_at) : NaN
    if (!Number.isFinite(createdAt) || !Number.isFinite(lastSignInAt)) {
      consumeOAuthSignupIntent()
      return
    }

    // First auth session only — allow a small skew between the two timestamps.
    const FIRST_SIGN_IN_MAX_SKEW_MS = 2 * 60 * 1000
    const isFirstSignIn = Math.abs(lastSignInAt - createdAt) <= FIRST_SIGN_IN_MAX_SKEW_MS
    if (!isFirstSignIn) {
      consumeOAuthSignupIntent()
      return
    }

    consumeOAuthSignupIntent()

    await trackMetaCompleteRegistration({
      userId: user.id,
      email: user.email,
      method: 'google',
    })
  } catch {
    /* ignore */
  }
}

export async function trackMetaOnboardingStarted(userId: string, email?: string | null): Promise<void> {
  try {
    if (!hasAdvertisingConsent()) return
    const key = `${ONBOARDING_STARTED_PREFIX}${userId}`
    if (alreadyTracked(key)) return
    markTracked(key)

    const eventId = `onboarding_start_${userId}`
    trackMetaPixelCustomEvent('OnboardingStarted', { content_name: 'setup' }, eventId)
    await sendMetaCapi({
      eventName: 'OnboardingStarted',
      eventId,
      userId,
      email,
      customData: { content_name: 'setup' },
    })
  } catch {
    /* ignore */
  }
}

export async function trackMetaOnboardingCompleted(
  userId: string,
  email?: string | null,
): Promise<void> {
  try {
    if (!hasAdvertisingConsent()) return
    const key = `${ONBOARDING_COMPLETED_PREFIX}${userId}`
    if (alreadyTracked(key)) return
    markTracked(key)

    const eventId = `onboarding_complete_${userId}`
    trackMetaPixelCustomEvent('OnboardingCompleted', { content_name: 'setup' }, eventId)
    await sendMetaCapi({
      eventName: 'OnboardingCompleted',
      eventId,
      userId,
      email,
      customData: { content_name: 'setup' },
    })
  } catch {
    /* ignore */
  }
}

/** Stripe Checkout session created — about to redirect. */
export async function trackMetaInitiateCheckout(input: {
  sessionId: string
  userId?: string | null
  email?: string | null
  tierId?: string
  billingInterval?: string
}): Promise<void> {
  try {
    if (!hasAdvertisingConsent()) return
    const eventId = `checkout_${input.sessionId}`
    trackMetaPixelEvent(
      'InitiateCheckout',
      {
        content_name: input.tierId ?? 'subscription',
        content_category: input.billingInterval,
      },
      eventId,
    )
    await sendMetaCapi({
      eventName: 'InitiateCheckout',
      eventId,
      userId: input.userId,
      email: input.email,
      customData: {
        content_name: input.tierId ?? 'subscription',
        content_category: input.billingInterval ?? 'monthly',
      },
    })
  } catch {
    /* ignore */
  }
}
