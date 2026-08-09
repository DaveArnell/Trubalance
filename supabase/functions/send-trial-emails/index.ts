/**
 * Daily cron: send mid-trial, trial-ending, and trial-ended emails via Resend.
 *
 * Auth: Authorization: Bearer <TRIAL_EMAIL_CRON_SECRET>
 * Deploy with verify_jwt = false.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import { getServiceRoleKey } from '../_shared/supabaseEnv.ts'
import { buildProductEmailHtml, getProductEmail, type ProductEmailKey } from '../_shared/productEmail.ts'

type EmailType = Extract<ProductEmailKey, 'mid_trial' | 'trial_ending' | 'trial_ended'>

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function daysBetween(from: Date, to: Date): number {
  return Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24))
}

async function sendResendEmail(to: string, subject: string, html: string): Promise<{ error?: string }> {
  const resendKey = Deno.env.get('RESEND_API_KEY')
  const from = Deno.env.get('PRODUCT_FROM_EMAIL') ?? Deno.env.get('ADMIN_FROM_EMAIL') ?? 'Cash Prophet <hello@cashprophet.co.uk>'
  if (!resendKey) return { error: 'RESEND_API_KEY is not configured' }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to: [to], subject, html }),
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}))
    return { error: String((payload as { message?: string }).message ?? 'Resend send failed') }
  }
  return {}
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } })
  }

  const cronSecret = Deno.env.get('TRIAL_EMAIL_CRON_SECRET')
  const auth = req.headers.get('Authorization') ?? ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (!cronSecret || token !== cronSecret) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = getServiceRoleKey()
  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: 'Supabase is not configured' }, 503)
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)
  const now = new Date()

  const { data: workspaces, error } = await supabase
    .from('workspaces')
    .select('id, trial_ends_at, lifetime_access, beta_tester, stripe_customer_id')
    .eq('lifetime_access', false)
    .eq('beta_tester', false)
    .not('trial_ends_at', 'is', null)

  if (error) {
    console.error(error)
    return jsonResponse({ error: 'Failed to load workspaces' }, 500)
  }

  const results = { mid_trial: 0, trial_ending: 0, trial_ended: 0, skipped: 0, errors: [] as string[] }

  for (const workspace of workspaces ?? []) {
    const trialEndsAt = workspace.trial_ends_at ? new Date(String(workspace.trial_ends_at)) : null
    if (!trialEndsAt) continue

    const daysLeft = daysBetween(now, trialEndsAt)
    let emailType: EmailType | null = null

    if (daysLeft <= -1 && daysLeft >= -2) {
      emailType = 'trial_ended'
    } else if (daysLeft >= 2 && daysLeft <= 3) {
      emailType = 'trial_ending'
    } else if (daysLeft >= 22 && daysLeft <= 24) {
      emailType = 'mid_trial'
    }

    if (!emailType) {
      results.skipped += 1
      continue
    }

    if (emailType === 'mid_trial' && workspace.stripe_customer_id) {
      results.skipped += 1
      continue
    }

    const { data: existing } = await supabase
      .from('trial_email_log')
      .select('id')
      .eq('workspace_id', workspace.id)
      .eq('email_type', emailType)
      .maybeSingle()

    if (existing) {
      results.skipped += 1
      continue
    }

    const { data: members } = await supabase
      .from('workspace_members')
      .select('user_id, role')
      .eq('workspace_id', workspace.id)
      .in('role', ['owner', 'admin'])
      .limit(5)

    const userIds = (members ?? []).map((m) => String(m.user_id))
    if (userIds.length === 0) {
      results.skipped += 1
      continue
    }

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email')
      .in('id', userIds)

    const emails = (profiles ?? [])
      .map((p) => String(p.email ?? '').trim())
      .filter(Boolean)

    if (emails.length === 0) {
      results.skipped += 1
      continue
    }

    const copy = getProductEmail(emailType)
    if (!copy) {
      results.errors.push(`Missing template ${emailType}`)
      continue
    }

    const html = buildProductEmailHtml(copy)
    let sentOk = false
    for (const to of emails) {
      const sent = await sendResendEmail(to, copy.subject, html)
      if (sent.error) {
        results.errors.push(`${workspace.id}/${to}: ${sent.error}`)
      } else {
        sentOk = true
      }
    }

    if (!sentOk) continue

    const { error: logError } = await supabase.from('trial_email_log').insert({
      workspace_id: workspace.id,
      email_type: emailType,
      recipient_email: emails[0],
    })
    if (logError) {
      results.errors.push(`log ${workspace.id}: ${logError.message}`)
      continue
    }

    results[emailType] += 1
  }

  return jsonResponse({ ok: true, ...results })
})
