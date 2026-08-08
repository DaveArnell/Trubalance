import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'
import { getServiceRoleKey } from '../_shared/supabaseEnv.ts'

function tierFromMetadata(meta: Stripe.Metadata | null | undefined): string {
  const tier = meta?.tier_id
  if (tier === 'multi' || tier === 'group') return tier
  if (tier === 'business') return 'multi'
  return 'solo'
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
    console.error('Webhook signature failed', err)
    return new Response('Invalid signature', { status: 400 })
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

        if (existing) break

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
