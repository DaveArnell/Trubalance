import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SESSION_DAYS = Number(Deno.env.get('ADMIN_SESSION_DAYS') ?? '30')
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
    return { error: jsonResponse({ error: 'Access denied' }, 403) }
  }

  return { user, userClient, adminClient, supabaseUrl, anonKey }
}

async function sendEmailOtp(supabaseUrl: string, anonKey: string, email: string) {
  const response = await fetch(`${supabaseUrl}/auth/v1/otp`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      create_user: false,
    }),
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}))
    const message = String((payload as { msg?: string; error_description?: string }).msg ??
      (payload as { error_description?: string }).error_description ??
      'Could not send email code')
    return { error: message }
  }

  return { ok: true }
}

async function verifyEmailOtp(
  supabaseUrl: string,
  anonKey: string,
  email: string,
  code: string,
) {
  const response = await fetch(`${supabaseUrl}/auth/v1/verify`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      token: code,
      type: 'email',
    }),
  })

  if (!response.ok) {
    return { error: 'Invalid or expired code. Request a new one.' }
  }

  return { ok: true }
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
  if ('error' in authed) return authed.error

  const { user, adminClient, supabaseUrl, anonKey } = authed

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
      message: 'Enter the 6-digit code sent to your email.',
    })
  }

  if (action === 'send_code') {
    const sent = await sendEmailOtp(supabaseUrl, anonKey, platformAdmin.email)
    if (sent.error) {
      return jsonResponse({ error: sent.error }, 500)
    }

    return jsonResponse({
      state: 'needs_2fa',
      email: platformAdmin.email,
      message: `A 6-digit code was sent to ${platformAdmin.email}. It expires in a few minutes.`,
    })
  }

  if (action === 'verify_code') {
    const code = String(body.code ?? '').trim()
    if (!/^\d{6}$/.test(code)) {
      return jsonResponse({ error: 'Enter the 6-digit code from your email' }, 400)
    }

    const verified = await verifyEmailOtp(supabaseUrl, anonKey, platformAdmin.email, code)
    if (verified.error) {
      return jsonResponse({ error: verified.error }, 401)
    }

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
