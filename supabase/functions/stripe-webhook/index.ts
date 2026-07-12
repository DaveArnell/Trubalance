import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'

const GRACE_DAYS = 7

function tierFromMetadata(meta: Stripe.Metadata | null | undefined): string {
  const tier = meta?.tier_id
  if (tier === 'business' || tier === 'group') return tier
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

  let gracePeriodEndsAt: string | null = null
  if (status === 'past_due') {
    const grace = new Date()
    grace.setDate(grace.getDate() + GRACE_DAYS)
    gracePeriodEndsAt = grace.toISOString()
  }

  await supabaseAdmin.from('workspaces').update({
    subscription_tier: tierId,
    billing_interval: billingInterval,
    grace_period_ends_at: gracePeriodEndsAt,
  }).eq('id', workspaceId)

  await supabaseAdmin.from('subscriptions').upsert(
    {
      workspace_id: workspaceId,
      stripe_subscription_id: subscription.id,
      stripe_price_id: subscription.items.data[0]?.price?.id ?? null,
      status,
      tier: tierId,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      billing_interval: billingInterval,
      grace_period_ends_at: gracePeriodEndsAt,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'workspace_id' },
  )
}

Deno.serve(async (req) => {
  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!stripeKey || !webhookSecret || !supabaseUrl || !serviceRoleKey) {
    return new Response('Billing not configured', { status: 503 })
  }

  const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' })
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

  const signature = req.headers.get('stripe-signature')
  if (!signature) return new Response('Missing signature', { status: 400 })

  const body = await req.text()
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
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
          await syncSubscription(supabaseAdmin, workspaceId, subscription)
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
