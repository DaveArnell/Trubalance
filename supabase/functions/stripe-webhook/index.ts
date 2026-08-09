import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
// Use npm:stripe so Deno Web Crypto signature verification matches Stripe's Edge docs.
import Stripe from 'npm:stripe@14.25.0'
import { getServiceRoleKey } from '../_shared/supabaseEnv.ts'
import {
  normalizeMetaEmailHash,
  sendMetaCapiEvents,
} from '../_shared/metaCapi.ts'

/** Bump when forcing a Supabase functions redeploy. */
const WEBHOOK_BUILD = '2026-08-09-meta-purchase-v1'

function tierFromMetadata(meta: Stripe.Metadata | null | undefined): string {
  const tier = meta?.tier_id
  if (tier === 'multi' || tier === 'group') return tier
  if (tier === 'business') return 'multi'
  return 'solo'
}

/**
 * CAPI Purchase only when advertising consent was true at checkout and amount_paid > 0.
 * Never throws to the webhook caller (caller wraps in try/catch too).
 */
async function sendMetaPurchaseFromInvoice(
  supabaseAdmin: ReturnType<typeof createClient>,
  stripe: Stripe,
  invoice: Stripe.Invoice,
  workspaceId: string,
): Promise<void> {
  if (!invoice.amount_paid || invoice.amount_paid <= 0) return
  if (!invoice.id) return

  let advertisingConsent = false
  let fbp: string | undefined
  let fbc: string | undefined
  let metaUserId: string | undefined
  let tierId = 'solo'

  if (invoice.subscription) {
    const subscription = await stripe.subscriptions.retrieve(String(invoice.subscription))
    advertisingConsent = subscription.metadata?.advertising_consent === 'true'
    metaUserId = subscription.metadata?.meta_user_id || undefined
    fbp = subscription.metadata?.meta_fbp || undefined
    fbc = subscription.metadata?.meta_fbc || undefined
    tierId = tierFromMetadata(subscription.metadata)
  }

  // Prefer checkout session metadata when present (has fbp/fbc from browser).
  if (invoice.id) {
    try {
      const sessions = await stripe.checkout.sessions.list({
        limit: 5,
        // Filter by subscription when available
        ...(invoice.subscription
          ? { subscription: String(invoice.subscription) }
          : {}),
      })
      const matched = sessions.data.find(
        (s) => s.metadata?.workspace_id === workspaceId || s.metadata?.advertising_consent,
      ) ?? sessions.data[0]
      if (matched?.metadata) {
        if (matched.metadata.advertising_consent === 'true') advertisingConsent = true
        if (matched.metadata.advertising_consent === 'false') advertisingConsent = false
        if (matched.metadata.meta_fbp) fbp = matched.metadata.meta_fbp
        if (matched.metadata.meta_fbc) fbc = matched.metadata.meta_fbc
        if (matched.metadata.meta_user_id) metaUserId = matched.metadata.meta_user_id
        if (matched.metadata.tier_id) tierId = tierFromMetadata(matched.metadata)
      }
    } catch {
      /* optional enrichment */
    }
  }

  if (!advertisingConsent) return

  let email: string | undefined
  if (!metaUserId) {
    const { data: member } = await supabaseAdmin
      .from('workspace_members')
      .select('user_id')
      .eq('workspace_id', workspaceId)
      .eq('role', 'owner')
      .limit(1)
      .maybeSingle()
    metaUserId = member?.user_id ? String(member.user_id) : undefined
  }

  if (metaUserId) {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .eq('id', metaUserId)
      .maybeSingle()
    email = profile?.email ? String(profile.email) : undefined
  }

  const em = await normalizeMetaEmailHash(email)
  const value = invoice.amount_paid / 100
  const currency = (invoice.currency ?? 'gbp').toUpperCase()

  await sendMetaCapiEvents([
    {
      event_name: 'Purchase',
      event_time: invoice.status_transitions?.paid_at ?? invoice.created ?? Math.floor(Date.now() / 1000),
      event_id: `purchase_${invoice.id}`,
      action_source: 'website',
      user_data: {
        ...(em ? { em } : {}),
        ...(metaUserId ? { external_id: metaUserId } : {}),
        ...(fbp ? { fbp } : {}),
        ...(fbc ? { fbc } : {}),
      },
      custom_data: {
        currency,
        value,
        content_name: tierId,
        content_category: 'subscription',
      },
    },
  ])
}

async function syncSubscription(
  supabaseAdmin: ReturnType<typeof createClient>,
  workspaceId: string,
  subscription: Stripe.Subscription,
) {
  const tierId = tierFromMetadata(subscription.metadata)
  const billingInterval =
    subscription.metadata.billing_interval === 'annual' ? 'annual' : 'monthly'
  const status = subscription.status
  const trialEndsAt = subscription.trial_end
    ? new Date(subscription.trial_end * 1000).toISOString()
    : null
  const customerId =
    typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer?.id ?? null

  await supabaseAdmin.from('workspaces').update({
    subscription_tier: tierId,
    billing_interval: billingInterval,
    grace_period_ends_at: null,
    trial_ends_at: trialEndsAt,
    ...(customerId ? { stripe_customer_id: customerId } : {}),
  }).eq('id', workspaceId)

  await supabaseAdmin.from('subscriptions').upsert(
    {
      workspace_id: workspaceId,
      stripe_subscription_id: subscription.id,
      stripe_price_id: subscription.items.data[0]?.price?.id ?? null,
      status,
      tier: tierId,
      trial_ends_at: trialEndsAt,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      billing_interval: billingInterval,
      grace_period_ends_at: null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'workspace_id' },
  )
}

// Deno/Edge only has async Web Crypto — sync constructEvent often reports
// "Invalid signature" even when the signing secret is correct.
const cryptoProvider = Stripe.createSubtleCryptoProvider()

Deno.serve(async (req) => {
  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')?.trim()
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')?.trim()
  const supabaseUrl = Deno.env.get('SUPABASE_URL')?.trim()
  const serviceRoleKey = getServiceRoleKey()

  if (!stripeKey || !webhookSecret || !supabaseUrl || !serviceRoleKey) {
    return new Response('Billing not configured', { status: 503 })
  }

  const stripe = new Stripe(stripeKey, {
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient(),
  })
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

  const signature = req.headers.get('stripe-signature')
  if (!signature) return new Response('Missing signature', { status: 400 })

  // Must be the raw body string — signature check is byte-exact.
  const body = await req.text()
  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
      undefined,
      cryptoProvider,
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('Webhook signature failed', WEBHOOK_BUILD, message)
    return new Response(`Invalid signature (${WEBHOOK_BUILD}): ${message}`, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const workspaceId = session.metadata?.workspace_id
        if (workspaceId && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(String(session.subscription))
          // Ensure subscription carries workspace metadata even if Stripe omitted it.
          if (!subscription.metadata?.workspace_id) {
            await stripe.subscriptions.update(subscription.id, {
              metadata: {
                ...subscription.metadata,
                workspace_id: workspaceId,
                tier_id: session.metadata?.tier_id ?? subscription.metadata?.tier_id ?? 'solo',
              },
            })
          }
          const fresh = await stripe.subscriptions.retrieve(subscription.id)
          await syncSubscription(supabaseAdmin, workspaceId, fresh)
        }
        break
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const workspaceId = subscription.metadata?.workspace_id
        if (workspaceId) {
          await syncSubscription(supabaseAdmin, workspaceId, subscription)
        }
        break
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(String(invoice.subscription))
          const workspaceId = subscription.metadata?.workspace_id
          if (workspaceId) await syncSubscription(supabaseAdmin, workspaceId, subscription)
        }
        break
      }
      case 'invoice.paid':
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        if (!invoice.amount_paid || invoice.amount_paid <= 0) break

        let workspaceId = invoice.subscription_details?.metadata?.workspace_id
          ?? invoice.metadata?.workspace_id
          ?? null

        if (!workspaceId && invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(String(invoice.subscription))
          workspaceId = subscription.metadata?.workspace_id ?? null
          if (workspaceId) await syncSubscription(supabaseAdmin, workspaceId, subscription)
        }

        if (!workspaceId) break

        const stripeInvoiceId = invoice.id
        const { data: existing } = await supabaseAdmin
          .from('payments')
          .select('id')
          .eq('stripe_invoice_id', stripeInvoiceId)
          .maybeSingle()

        if (!existing) {
          const paymentIntent =
            typeof invoice.payment_intent === 'string'
              ? invoice.payment_intent
              : invoice.payment_intent?.id ?? null

          await supabaseAdmin.from('payments').insert({
            workspace_id: workspaceId,
            stripe_invoice_id: stripeInvoiceId,
            stripe_payment_intent_id: paymentIntent,
            amount_cents: invoice.amount_paid,
            currency: invoice.currency ?? 'gbp',
            status: 'succeeded',
            description: invoice.lines?.data?.[0]?.description ?? 'Subscription payment',
            paid_at: new Date(
              (invoice.status_transitions?.paid_at ?? invoice.created) * 1000,
            ).toISOString(),
          })
        }

        // Meta Purchase — best-effort; safe to retry (event_id = purchase_<invoice.id>).
        // Runs even when the payments row already exists so a prior Meta outage can recover.
        try {
          await sendMetaPurchaseFromInvoice(supabaseAdmin, stripe, invoice, workspaceId)
        } catch (metaErr) {
          console.warn(
            'Meta Purchase tracking failed (non-blocking)',
            metaErr instanceof Error ? metaErr.message : 'unknown',
          )
        }

        // First-party acquisition funnel paid stage (not consent-gated).
        try {
          const { data: owner } = await supabaseAdmin
            .from('workspace_members')
            .select('user_id')
            .eq('workspace_id', workspaceId)
            .eq('role', 'owner')
            .limit(1)
            .maybeSingle()
          if (owner?.user_id) {
            await supabaseAdmin.from('acquisition_events').insert({
              user_id: owner.user_id,
              event_type: 'paid',
              metadata: {
                invoice_id: stripeInvoiceId,
                currency: invoice.currency ?? 'gbp',
              },
            })
          }
        } catch {
          /* unique / non-blocking */
        }
        break
      }
      default:
        break
    }
  } catch (err) {
    console.error('Webhook handler error', err)
    return new Response('Webhook handler failed', { status: 500 })
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
