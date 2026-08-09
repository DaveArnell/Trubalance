/**
 * Shared Meta Conversions API sender for Edge Functions.
 * Never logs META_CAPI_ACCESS_TOKEN.
 */

export const META_PIXEL_ID_DEFAULT = '4528453927433140'

export type MetaCapiUserData = {
  em?: string | string[]
  external_id?: string | string[]
  fbp?: string
  fbc?: string
  client_ip_address?: string
  client_user_agent?: string
}

export type MetaCapiEvent = {
  event_name: string
  event_time: number
  event_id: string
  action_source: 'website' | 'system_generated'
  event_source_url?: string
  user_data: MetaCapiUserData
  custom_data?: Record<string, string | number | boolean>
}

async function sha256Hex(value: string): Promise<string> {
  const data = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

/** Hash plain email if caller passed unhashed; leave 64-char hex alone. */
export async function normalizeMetaEmailHash(emailOrHash: string | undefined): Promise<string | undefined> {
  if (!emailOrHash) return undefined
  const trimmed = emailOrHash.trim().toLowerCase()
  if (!trimmed) return undefined
  if (/^[a-f0-9]{64}$/i.test(trimmed)) return trimmed
  if (!trimmed.includes('@')) return undefined
  return sha256Hex(trimmed)
}

/**
 * Send events to Meta CAPI. Returns ok:false on failure but never throws.
 */
export async function sendMetaCapiEvents(
  events: MetaCapiEvent[],
  options?: { testEventCode?: string },
): Promise<{ ok: boolean }> {
  try {
    const token = Deno.env.get('META_CAPI_ACCESS_TOKEN')?.trim()
    if (!token || events.length === 0) return { ok: false }

    const pixelId =
      Deno.env.get('META_PIXEL_ID')?.trim() || META_PIXEL_ID_DEFAULT

    const body: Record<string, unknown> = {
      data: events,
      access_token: token,
    }
    const testCode =
      options?.testEventCode?.trim() ||
      Deno.env.get('META_TEST_EVENT_CODE')?.trim()
    if (testCode) body.test_event_code = testCode

    const response = await fetch(
      `https://graph.facebook.com/v21.0/${pixelId}/events`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
    )

    if (!response.ok) {
      // Do not log response body if it might echo secrets; status only.
      console.warn('Meta CAPI request failed', response.status)
      return { ok: false }
    }
    return { ok: true }
  } catch (err) {
    console.warn('Meta CAPI request error', err instanceof Error ? err.message : 'unknown')
    return { ok: false }
  }
}
