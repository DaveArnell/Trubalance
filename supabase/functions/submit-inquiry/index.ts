/**
 * Public marketing enquiry / free onboarding request.
 * Sends email via Resend to INQUIRY_TO_EMAIL (default hello@cashprophet.co.uk)
 * and stores a row in marketing_inquiries when the table exists.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import { getAnonKey, getServiceRoleKey } from '../_shared/supabaseEnv.ts'

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

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
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
    const to =
      Deno.env.get('INQUIRY_TO_EMAIL')?.trim() ||
      'hello@cashprophet.co.uk'

    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      return jsonResponse({ error: 'Server is not configured' }, 503)
    }
    if (!resendKey) {
      return jsonResponse({ error: 'Email delivery is not configured' }, 503)
    }

    const body = await req.json().catch(() => ({}))
    const name = String(body.name ?? '').trim()
    const email = String(body.email ?? '').trim().toLowerCase()
    const businessName = String(body.businessName ?? '').trim()
    const phone = String(body.phone ?? '').trim()
    const topicRaw = String(body.topic ?? 'general').trim()
    const topic = topicRaw === 'onboarding' ? 'onboarding' : 'general'
    const message = String(body.message ?? '').trim()
    const honeypot = String(body.companyWebsite ?? '').trim()

    if (honeypot) {
      // Silent success for bots
      return jsonResponse({ ok: true })
    }

    if (!name || name.length > 120) {
      return jsonResponse({ error: 'Please enter your name' }, 400)
    }
    if (!isValidEmail(email)) {
      return jsonResponse({ error: 'Please enter a valid email address' }, 400)
    }
    if (!message || message.length < 10) {
      return jsonResponse({ error: 'Please add a short message (at least a few words)' }, 400)
    }
    if (message.length > 4000) {
      return jsonResponse({ error: 'Message is too long' }, 400)
    }
    if (businessName.length > 200 || phone.length > 40) {
      return jsonResponse({ error: 'One of the optional fields is too long' }, 400)
    }

    const topicLabel = topic === 'onboarding' ? 'Free personal onboarding' : 'General enquiry'
    const subject =
      topic === 'onboarding'
        ? `[Onboarding] ${name}${businessName ? ` — ${businessName}` : ''}`
        : `[Enquiry] ${name}${businessName ? ` — ${businessName}` : ''}`

    const html = `<!DOCTYPE html>
<html lang="en">
<body style="margin:0;padding:0;background:#f4f6f8;font-family:Georgia,'Times New Roman',serif">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;color:#243044">
    <h1 style="font-size:20px;margin:0 0 16px;color:#0c0022">New Cash Prophet enquiry</h1>
    <p style="margin:0 0 8px"><strong>Topic:</strong> ${escapeHtml(topicLabel)}</p>
    <p style="margin:0 0 8px"><strong>Name:</strong> ${escapeHtml(name)}</p>
    <p style="margin:0 0 8px"><strong>Email:</strong> ${escapeHtml(email)}</p>
    ${businessName ? `<p style="margin:0 0 8px"><strong>Business:</strong> ${escapeHtml(businessName)}</p>` : ''}
    ${phone ? `<p style="margin:0 0 8px"><strong>Phone:</strong> ${escapeHtml(phone)}</p>` : ''}
    <p style="margin:20px 0 8px"><strong>Message</strong></p>
    <p style="margin:0;white-space:pre-wrap;line-height:1.55">${escapeHtml(message)}</p>
  </div>
</body>
</html>`

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: email,
        subject,
        html,
      }),
    })

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}))
      console.error('Resend inquiry failed', payload)
      return jsonResponse(
        { error: String((payload as { message?: string }).message ?? 'Could not send enquiry email') },
        502,
      )
    }

    // Best-effort store (migration 032). Email already sent above.
    try {
      const adminClient = createClient(supabaseUrl, serviceRoleKey)
      const { error: insertError } = await adminClient.from('marketing_inquiries').insert({
        name,
        email,
        business_name: businessName || null,
        phone: phone || null,
        topic,
        message,
        status: 'new',
      })
      if (insertError) console.error('marketing_inquiries insert', insertError)
    } catch (storeErr) {
      console.error('marketing_inquiries store failed', storeErr)
    }

    return jsonResponse({ ok: true })
  } catch (err) {
    console.error(err)
    return jsonResponse({ error: 'Could not send enquiry' }, 500)
  }
})
