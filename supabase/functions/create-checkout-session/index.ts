import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type TierId = 'solo' | 'multi' | 'group'
type BillingInterval = 'monthly' | 'annual'

/** Server-side Stripe Price IDs — never trust a client-supplied priceId. */
function resolvePriceId(tierId: TierId, interval: BillingInterval): string | null {
  const envKeys: Record<TierId, Record<BillingInterval, string[]>> = {
    solo: {
      monthly: ['STRIPE_PRICE_SOLO_MONTHLY'],
      annual: ['STRIPE_PRICE_SOLO_ANNUAL'],
    },
    multi: {
      monthly: ['STRIPE_PRICE_MULTI_MONTHLY', 'STRIPE_PRICE_BUSINESS_MONTHLY'],
      annual: ['STRIPE_PRICE_MULTI_ANNUAL', 'STRIPE_PRICE_BUSINESS_ANNUAL'],
    },
    group: {
      monthly: ['STRIPE_PRICE_GROUP_MONTHLY'],
      annual: ['STRIPE_PRICE_GROUP_ANNUAL'],
    },
  }

  for (const key of envKeys[tierId][interval]) {
    const value = Deno.env.get(key)?.trim()
    if (value) return value
  }
  return null
}

function normalizeTierId(raw: string): TierId {
  if (raw === 'multi' || raw === 'group' || raw === 'solo') return raw
  if (raw === 'business' || raw === 'professional') return 'multi'
  if (raw === 'enterprise') return 'group'
  return 'solo'
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
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const siteUrl = (Deno.env.get('SITE_URL') ?? 'https://truebalanceapp.io').replace(/\/+$/, '')

    if (!stripeKey || !supabaseUrl || !serviceRoleKey) {
      return jsonResponse({ error: 'Billing is not configured' }, 503)
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return jsonResponse({ error: 'Unauthorized' }, 401)

    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: { headers: { Authorization: authHeader } },
    })
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

    const {
      data: { user },
      error: userError,
    } = await supabaseUser.auth.getUser()
    if (userError || !user) return jsonResponse({ error: 'Unauthorized' }, 401)

    const body = await req.json()
    const tierId = normalizeTierId(String(body.tierId ?? 'solo'))
    const billingInterval: BillingInterval =
      body.billingInterval === 'annual' ? 'annual' : 'monthly'
    const deferUntilTrialEnd = body.deferUntilTrialEnd !== false

    const priceId = resolvePriceId(tierId, billingInterval)
    if (!priceId) {
      return jsonResponse(
        { error: `Stripe price is not configured for ${tierId}/${billingInterval}` },
        503,
      )
    }

    const { data: membership, error: membershipError } = await supabaseAdmin
      .from('workspace_members')
      .select('workspace_id, role')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()

    if (membershipError || !membership?.workspace_id) {
      return jsonResponse({ error: 'No workspace found' }, 404)
    }

    const workspaceId = membership.workspace_id as string

    const { data: workspace, error: workspaceError } = await supabaseAdmin
      .from('workspaces')
      .select('id, stripe_customer_id, trial_ends_at, lifetime_access')
      .eq('id', workspaceId)
      .maybeSingle()

    if (workspaceError || !workspace) return jsonResponse({ error: 'Workspace not found' }, 404)
    if (workspace.lifetime_access) return jsonResponse({ error: 'Lifetime access — no billing needed' }, 400)

    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' })

    let customerId = workspace.stripe_customer_id as string | null
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        metadata: { workspace_id: workspaceId, user_id: user.id },
      })
      customerId = customer.id
      await supabaseAdmin
        .from('workspaces')
        .update({ stripe_customer_id: customerId })
        .eq('id', workspaceId)
    }

    const subscriptionData: Stripe.Checkout.SessionCreateParams.SubscriptionData = {
      metadata: { workspace_id: workspaceId, tier_id: tierId, billing_interval: billingInterval },
    }

    if (deferUntilTrialEnd && workspace.trial_ends_at) {
      const trialEnd = Math.floor(new Date(String(workspace.trial_ends_at)).getTime() / 1000)
      const nowSec = Math.floor(Date.now() / 1000)
      if (trialEnd > nowSec) {
        subscriptionData.trial_end = trialEnd
      }
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${siteUrl}/app/settings?billing=success`,
      cancel_url: `${siteUrl}/app/settings?billing=cancel`,
      subscription_data: subscriptionData,
      metadata: { workspace_id: workspaceId, tier_id: tierId },
    })

    return jsonResponse({ url: session.url })
  } catch (err) {
    console.error(err)
    return jsonResponse({ error: 'Checkout failed' }, 500)
  }
})
