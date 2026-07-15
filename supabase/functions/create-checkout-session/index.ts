import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'

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
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const siteUrl = Deno.env.get('SITE_URL') ?? 'https://www.truebalanceapp.io'

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
    const priceId = String(body.priceId ?? '')
    const rawTier = String(body.tierId ?? 'solo')
    const tierId =
      rawTier === 'multi' || rawTier === 'group'
        ? rawTier
        : rawTier === 'business' || rawTier === 'professional'
          ? 'multi'
          : 'solo'
    const billingInterval = body.billingInterval === 'annual' ? 'annual' : 'monthly'
    const deferUntilTrialEnd = body.deferUntilTrialEnd !== false

    if (!priceId) return jsonResponse({ error: 'Missing priceId' }, 400)

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
