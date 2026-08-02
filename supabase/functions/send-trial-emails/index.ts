/**
 * Daily cron: send mid-trial, trial-ending, and trial-ended emails via Resend.
 *
 * Auth: Authorization: Bearer <TRIAL_EMAIL_CRON_SECRET>
 * Deploy with verify_jwt = false.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

type EmailType = 'mid_trial' | 'trial_ending' | 'trial_ended'

const SITE_URL = (Deno.env.get('SITE_URL') ?? 'https://www.cashprophet.co.uk').replace(/\/+$/, '')
const APP_SETTINGS_URL = `${SITE_URL}/app/settings`
const LOGIN_URL = `${SITE_URL}/login`

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function daysBetween(from: Date, to: Date): number {
  return Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24))
}

function emailHtml(title: string, paragraphs: string[], ctaLabel: string, ctaUrl: string): string {
  const body = paragraphs.map((p) => `<p style="margin:0 0 16px;line-height:1.55;color:#243044">${p}</p>`).join('')
  return `
    <div style="font-family:Inter,Segoe UI,sans-serif;max-width:560px;margin:0 auto;padding:24px">
      <p style="margin:0 0 8px;font-size:13px;font-weight:700;letter-spacing:0.04em;color:#24da76">CASH PROPHET</p>
      <h1 style="margin:0 0 20px;font-size:22px;line-height:1.25;color:#0c0022">${title}</h1>
      ${body}
      <p style="margin:28px 0 0">
        <a href="${ctaUrl}" style="display:inline-block;background:#24da76;color:#0c0022;text-decoration:none;font-weight:700;padding:12px 18px;border-radius:8px">${ctaLabel}</a>
      </p>
      <p style="margin:24px 0 0;font-size:13px;color:#3a465c">
        Or open <a href="${LOGIN_URL}" style="color:#1bb863">${LOGIN_URL}</a> and go to Settings → Your plan.
      </p>
    </div>
  `
}

async function sendResendEmail(to: string, subject: string, html: string): Promise<{ error?: string }> {
  const resendKey = Deno.env.get('RESEND_API_KEY')
  const from = Deno.env.get('PRODUCT_FROM_EMAIL') ?? Deno.env.get('ADMIN_FROM_EMAIL') ?? 'Cash Prophet <onboarding@resend.dev>'
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

function contentFor(type: EmailType): { subject: string; title: string; paragraphs: string[]; cta: string } {
  switch (type) {
    case 'mid_trial':
      return {
        subject: 'Ready to keep Cash Prophet after your trial?',
        title: 'Your trial is underway',
        paragraphs: [
          'You have been using Cash Prophet for about a week. When you are ready, choose a plan and add a card in Settings — nothing is charged until your free trial ends.',
          'That way editing stays open without a scramble on the last day.',
        ],
        cta: 'Choose a plan',
      }
    case 'trial_ending':
      return {
        subject: 'Your Cash Prophet trial ends in 3 days',
        title: 'Three days left on your trial',
        paragraphs: [
          'Your free trial ends soon. Pick a plan and add a card now so your subscription starts the day after the trial — your workspace and data stay put either way.',
          'Without a plan, the workspace becomes view-only when the trial ends. You can subscribe later whenever you like.',
        ],
        cta: 'Choose a plan',
      }
    case 'trial_ended':
      return {
        subject: 'Your Cash Prophet trial has ended',
        title: 'Your trial has ended',
        paragraphs: [
          'You can still view your dashboard. To keep editing balances, commitments and reserves, choose a plan from Settings → Your plan.',
        ],
        cta: 'Subscribe to keep editing',
      }
  }
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
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
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
      // ~7 days into a 30-day trial
      emailType = 'mid_trial'
    }

    if (!emailType) {
      results.skipped += 1
      continue
    }

    // Skip mid-trial mail if they already have a Stripe customer (card likely on file).
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

    const recipients = (profiles ?? [])
      .map((p) => String(p.email ?? '').trim())
      .filter((email) => email.includes('@'))

    if (recipients.length === 0) {
      results.skipped += 1
      continue
    }

    const copy = contentFor(emailType)
    const html = emailHtml(copy.title, copy.paragraphs, copy.cta, APP_SETTINGS_URL)

    let sentOk = false
    for (const to of recipients) {
      const sent = await sendResendEmail(to, copy.subject, html)
      if (sent.error) {
        results.errors.push(`${workspace.id}/${emailType}: ${sent.error}`)
      } else {
        sentOk = true
      }
    }

    if (!sentOk) continue

    const { error: logError } = await supabase.from('trial_email_log').insert({
      workspace_id: workspace.id,
      email_type: emailType,
      recipient_email: recipients[0],
    })

    if (logError) {
      results.errors.push(`log ${workspace.id}/${emailType}: ${logError.message}`)
      continue
    }

    results[emailType] += 1
  }

  return jsonResponse({ ok: true, ...results })
})
