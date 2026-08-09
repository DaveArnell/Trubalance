/**
 * Browser-invoked Meta Conversions API relay.
 * Requires advertisingConsent: true. Never exposes META_CAPI_ACCESS_TOKEN.
 * Failures return soft errors — callers must not block product flows on this.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import { getAnonKey, getServiceRoleKey } from '../_shared/supabaseEnv.ts'
import {
  normalizeMetaEmailHash,
  sendMetaCapiEvents,
  type MetaCapiUserData,
} from '../_shared/metaCapi.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ALLOWED_EVENTS = new Set([
  'CompleteRegistration',
  'OnboardingStarted',
  'OnboardingCompleted',
  'InitiateCheckout',
])

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const anonKey = getAnonKey()
    const serviceRoleKey = getServiceRoleKey()

    if (!supabaseUrl || !anonKey) {
      return jsonResponse({ ok: false, error: 'not_configured' }, 503)
    }

    let body: Record<string, unknown>
    try {
      body = (await req.json()) as Record<string, unknown>
    } catch {
      return jsonResponse({ ok: false, error: 'invalid_json' }, 400)
    }

    if (body.advertisingConsent !== true) {
      return jsonResponse({ ok: false, error: 'consent_required' }, 403)
    }

    const eventName = String(body.eventName ?? '')
    const eventId = String(body.eventId ?? '')
    if (!ALLOWED_EVENTS.has(eventName) || !eventId) {
      return jsonResponse({ ok: false, error: 'invalid_event' }, 400)
    }

    const authHeader = req.headers.get('Authorization')
    let userId: string | undefined
    let userEmail: string | undefined

    if (authHeader && serviceRoleKey) {
      const supabaseUser = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      })
      const {
        data: { user },
      } = await supabaseUser.auth.getUser()
      if (user) {
        userId = user.id
        userEmail = user.email ?? undefined
      }
    }

    const incomingUser =
      body.userData && typeof body.userData === 'object' && !Array.isArray(body.userData)
        ? (body.userData as Record<string, unknown>)
        : {}

    const emHash = await normalizeMetaEmailHash(
      typeof incomingUser.em === 'string'
        ? incomingUser.em
        : userEmail,
    )

    const externalId =
      (typeof incomingUser.external_id === 'string' && incomingUser.external_id) ||
      userId ||
      undefined

    const userData: MetaCapiUserData = {
      ...(emHash ? { em: emHash } : {}),
      ...(externalId ? { external_id: externalId } : {}),
      ...(typeof incomingUser.fbp === 'string' && incomingUser.fbp
        ? { fbp: incomingUser.fbp }
        : {}),
      ...(typeof incomingUser.fbc === 'string' && incomingUser.fbc
        ? { fbc: incomingUser.fbc }
        : {}),
      ...(typeof incomingUser.client_user_agent === 'string' && incomingUser.client_user_agent
        ? { client_user_agent: incomingUser.client_user_agent }
        : {}),
    }

    const forwarded = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    if (forwarded) userData.client_ip_address = forwarded

    const customRaw =
      body.customData && typeof body.customData === 'object' && !Array.isArray(body.customData)
        ? (body.customData as Record<string, unknown>)
        : {}
    const custom_data: Record<string, string | number | boolean> = {}
    for (const [key, value] of Object.entries(customRaw)) {
      // Block accidental financial / sensitive keys
      if (/balance|reserve|commitment|forecast|password|bank|supplier/i.test(key)) continue
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        custom_data[key] = value
      }
    }

    const eventTime =
      typeof body.eventTime === 'number' && Number.isFinite(body.eventTime)
        ? Math.floor(body.eventTime)
        : Math.floor(Date.now() / 1000)

    const eventSourceUrl =
      typeof body.eventSourceUrl === 'string' ? body.eventSourceUrl : undefined

    const result = await sendMetaCapiEvents([
      {
        event_name: eventName,
        event_time: eventTime,
        event_id: eventId,
        action_source: 'website',
        ...(eventSourceUrl ? { event_source_url: eventSourceUrl } : {}),
        user_data: userData,
        ...(Object.keys(custom_data).length ? { custom_data } : {}),
      },
    ])

    return jsonResponse({ ok: result.ok })
  } catch (err) {
    console.warn('meta-capi handler error', err instanceof Error ? err.message : 'unknown')
    return jsonResponse({ ok: false, error: 'failed' }, 200)
  }
})
