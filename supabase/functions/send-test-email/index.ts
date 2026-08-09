/**
 * Platform-admin only: send a product email test to a chosen address.
 * Auth: Bearer user JWT + active admin session (same as admin-auth).
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import { getAnonKey, getServiceRoleKey } from '../_shared/supabaseEnv.ts'
import {
  buildProductEmailHtml,
  getProductEmail,
  PRODUCT_EMAILS,
} from '../_shared/productEmail.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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
    const serviceRoleKey = getServiceRoleKey()
    const anonKey = getAnonKey()
    const resendKey = Deno.env.get('RESEND_API_KEY')?.trim()
    const from =
      Deno.env.get('PRODUCT_FROM_EMAIL')?.trim() ||
      Deno.env.get('ADMIN_FROM_EMAIL')?.trim() ||
      'Cash Prophet <hello@cashprophet.co.uk>'

    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      return jsonResponse({ error: 'Server is not configured' }, 503)
    }
    if (!resendKey) {
      return jsonResponse({ error: 'RESEND_API_KEY is not configured' }, 503)
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return jsonResponse({ error: 'Unauthorized' }, 401)

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser()
    if (userError || !user) return jsonResponse({ error: 'Unauthorized' }, 401)

    const { data: platformAdmin } = await adminClient
      .from('platform_admins')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!platformAdmin) return jsonResponse({ error: 'Not a platform admin' }, 403)

    const { data: session } = await adminClient
      .from('admin_sessions')
      .select('id, expires_at')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!session || new Date(String(session.expires_at)) <= new Date()) {
      return jsonResponse({ error: 'Admin session required. Sign in to platform admin first.' }, 401)
    }

    const body = await req.json()
    const templateKey = String(body.templateKey ?? '')
    const to = String(body.to ?? '').trim().toLowerCase()
    const copy = getProductEmail(templateKey)

    if (!copy) {
      return jsonResponse(
        { error: 'Unknown template', available: PRODUCT_EMAILS.map((e) => e.key) },
        400,
      )
    }
    if (!to || !to.includes('@')) {
      return jsonResponse({ error: 'Provide a valid to email address' }, 400)
    }

    const html = buildProductEmailHtml(copy, {
      code: copy.key === 'admin_code' ? '123456' : undefined,
    })

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: copy.key === 'admin_code'
          ? (Deno.env.get('ADMIN_FROM_EMAIL')?.trim() || from)
          : from,
        to: [to],
        subject: `[TEST] ${copy.subject}`,
        html,
      }),
    })

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}))
      return jsonResponse(
        { error: String((payload as { message?: string }).message ?? 'Resend send failed') },
        502,
      )
    }

    return jsonResponse({ ok: true, templateKey: copy.key, to })
  } catch (err) {
    console.error(err)
    return jsonResponse({ error: 'Send failed' }, 500)
  }
})
