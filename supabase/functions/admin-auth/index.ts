import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SESSION_DAYS = Number(Deno.env.get('ADMIN_SESSION_DAYS') ?? '30')
const CODE_MINUTES = 10
const MAX_FAILED_ATTEMPTS = 5
const LOCKOUT_MINUTES = 15
const ADMIN_EMAIL_DOMAIN = '@vocatio.io'

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function isVocatioEmail(email: string): boolean {
  return email.toLowerCase().endsWith(ADMIN_EMAIL_DOMAIN)
}

function sessionExpiry(): string {
  return new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString()
}

function codeExpiry(): string {
  return new Date(Date.now() + CODE_MINUTES * 60 * 1000).toISOString()
}

/** Cryptographically secure 6-digit code (000000–999999). */
function generateCode(): string {
  const buf = new Uint32Array(1)
  crypto.getRandomValues(buf)
  return String(buf[0]! % 1_000_000).padStart(6, '0')
}

async function hashCode(code: string): Promise<string> {
  const data = new TextEncoder().encode(code)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

async function getAuthedUser(req: Request) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return { error: jsonResponse({ error: 'Unauthorized' }, 401) }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  if (!serviceKey) {
    return { error: jsonResponse({ error: 'Admin auth is not configured' }, 503) }
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })
  const adminClient = createClient(supabaseUrl, serviceKey)

  const {
    data: { user },
    error,
  } = await userClient.auth.getUser()

  if (error || !user?.email) {
    return { error: jsonResponse({ error: 'Unauthorized' }, 401) }
  }

  if (!isVocatioEmail(user.email)) {
    return {
      error: jsonResponse(
        {
          state: 'wrong_account',
          error:
            'Admin access requires an @vocatio.io account. Sign out and sign in with your Vocatio email.',
        },
        403,
      ),
    }
  }

  return { user, userClient, adminClient }
}

async function sendAdminCodeEmail(to: string, code: string): Promise<{ error?: string }> {
  const resendKey = Deno.env.get('RESEND_API_KEY')
  const from = Deno.env.get('ADMIN_FROM_EMAIL') ?? 'Cash Prophet Admin <onboarding@resend.dev>'

  if (!resendKey) {
    return {
      error:
        'Admin email is not configured. Add RESEND_API_KEY to Supabase → Edge Functions → Secrets.',
    }
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: 'Your Cash Prophet admin code',
      html: `
        <p>Your admin verification code is:</p>
        <p style="font-size:28px;font-weight:bold;letter-spacing:4px;margin:16px 0">${code}</p>
        <p>This code expires in ${CODE_MINUTES} minutes.</p>
        <p>If you did not request this, you can ignore this email.</p>
      `,
    }),
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}))
    const message = String((payload as { message?: string }).message ?? 'Could not send admin email')
    return { error: message }
  }

  return {}
}

async function createAdminSession(
  adminClient: ReturnType<typeof createClient>,
  platformAdminId: string,
  userId: string,
) {
  const expiresAt = sessionExpiry()

  await adminClient.from('admin_sessions').delete().eq('user_id', userId)

  const { error: sessionError } = await adminClient.from('admin_sessions').insert({
    platform_admin_id: platformAdminId,
    user_id: userId,
    expires_at: expiresAt,
  })

  if (sessionError) {
    return { error: sessionError.message }
  }

  await adminClient
    .from('platform_admins')
    .update({ totp_enabled: true, last_login_at: new Date().toISOString() })
    .eq('id', platformAdminId)

  return { expiresAt }
}

async function readLockout(
  adminClient: ReturnType<typeof createClient>,
  userId: string,
) {
  const { data } = await adminClient
    .from('admin_auth_lockouts')
    .select('failed_attempts, locked_until')
    .eq('user_id', userId)
    .maybeSingle()
  return data as { failed_attempts: number; locked_until: string | null } | null
}

async function clearLockout(adminClient: ReturnType<typeof createClient>, userId: string) {
  await adminClient.from('admin_auth_lockouts').delete().eq('user_id', userId)
}

async function recordFailedAttempt(
  adminClient: ReturnType<typeof createClient>,
  userId: string,
): Promise<{ locked: boolean; lockedUntil?: string }> {
  const existing = await readLockout(adminClient, userId)
  const failed = (existing?.failed_attempts ?? 0) + 1
  const lockedUntil =
    failed >= MAX_FAILED_ATTEMPTS
      ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000).toISOString()
      : null

  await adminClient.from('admin_auth_lockouts').upsert({
    user_id: userId,
    failed_attempts: failed,
    locked_until: lockedUntil,
    updated_at: new Date().toISOString(),
  })

  return { locked: Boolean(lockedUntil), lockedUntil: lockedUntil ?? undefined }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  let body: { action?: string; code?: string }
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400)
  }

  const action = String(body.action ?? 'status')
  const authed = await getAuthedUser(req)
  if ('error' in authed) {
    if (authed.error instanceof Response) return authed.error
    return authed.error
  }

  const { user, adminClient } = authed

  const { data: platformAdmin, error: adminError } = await adminClient
    .from('platform_admins')
    .select('id, email, is_active')
    .eq('user_id', user.id)
    .maybeSingle()

  if (adminError) {
    return jsonResponse({ error: adminError.message }, 500)
  }

  if (!platformAdmin?.is_active) {
    return jsonResponse({
      state: 'not_enrolled',
      message: 'This Vocatio account is not enrolled for platform admin access.',
    })
  }

  const lockout = await readLockout(adminClient, user.id)
  if (lockout?.locked_until && new Date(lockout.locked_until) > new Date()) {
    return jsonResponse(
      {
        state: 'needs_2fa',
        email: platformAdmin.email,
        error: `Too many failed attempts. Try again after ${new Date(lockout.locked_until).toUTCString()}.`,
      },
      429,
    )
  }

  const { data: activeSession } = await adminClient
    .from('admin_sessions')
    .select('id, expires_at')
    .eq('user_id', user.id)
    .gt('expires_at', new Date().toISOString())
    .order('expires_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (action === 'status') {
    if (activeSession) {
      return jsonResponse({
        state: 'ready',
        email: platformAdmin.email,
        expiresAt: activeSession.expires_at,
      })
    }

    return jsonResponse({
      state: 'needs_2fa',
      email: platformAdmin.email,
      message: 'We will email a 6-digit code to your @vocatio.io address.',
    })
  }

  if (action === 'send_code') {
    const code = generateCode()
    const codeHash = await hashCode(code)

    await adminClient.from('admin_email_codes').delete().eq('user_id', user.id)

    const { error: insertError } = await adminClient.from('admin_email_codes').insert({
      user_id: user.id,
      code_hash: codeHash,
      expires_at: codeExpiry(),
      attempt_count: 0,
    })

    if (insertError) {
      return jsonResponse({ error: insertError.message }, 500)
    }

    const sent = await sendAdminCodeEmail(platformAdmin.email, code)
    if (sent.error) {
      return jsonResponse({ error: sent.error, state: 'needs_2fa', email: platformAdmin.email }, 500)
    }

    return jsonResponse({
      state: 'needs_2fa',
      email: platformAdmin.email,
      message: `A 6-digit code was sent to ${platformAdmin.email}. It expires in ${CODE_MINUTES} minutes.`,
    })
  }

  if (action === 'verify_code') {
    const code = String(body.code ?? '').trim()
    if (!/^\d{6}$/.test(code)) {
      return jsonResponse({ error: 'Enter the 6-digit code from your email' }, 400)
    }

    const codeHash = await hashCode(code)
    const { data: storedCode, error: codeError } = await adminClient
      .from('admin_email_codes')
      .select('id, expires_at, used_at, attempt_count')
      .eq('user_id', user.id)
      .eq('code_hash', codeHash)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (codeError) {
      return jsonResponse({ error: codeError.message }, 500)
    }

    if (!storedCode) {
      const failure = await recordFailedAttempt(adminClient, user.id)
      if (failure.locked) {
        return jsonResponse(
          {
            error: `Too many failed attempts. Try again after ${failure.lockedUntil}.`,
            state: 'needs_2fa',
            email: platformAdmin.email,
          },
          429,
        )
      }
      return jsonResponse({ error: 'Invalid or expired code. Request a new one.' }, 401)
    }

    await adminClient
      .from('admin_email_codes')
      .update({ used_at: new Date().toISOString() })
      .eq('id', storedCode.id)

    await clearLockout(adminClient, user.id)

    const session = await createAdminSession(adminClient, platformAdmin.id, user.id)
    if (session.error) {
      return jsonResponse({ error: session.error }, 500)
    }

    return jsonResponse({
      state: 'ready',
      email: platformAdmin.email,
      expiresAt: session.expiresAt,
      message: `Admin access granted for ${SESSION_DAYS} days on this browser.`,
    })
  }

  if (action === 'logout') {
    await adminClient.from('admin_sessions').delete().eq('user_id', user.id)
    return jsonResponse({ ok: true })
  }

  return jsonResponse({ error: 'Unknown action' }, 400)
})
