/**
 * Retention cron: delete support messages and marketing enquiries older than 12 months.
 *
 * Keeps ongoing items (marketing in_progress; support open/pending).
 *
 * Auth: Authorization: Bearer <TRIAL_EMAIL_CRON_SECRET>
 * Deploy with verify_jwt = false.
 * Suggested schedule: quarterly (or monthly).
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import { getServiceRoleKey } from '../_shared/supabaseEnv.ts'

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } })
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
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
  const { data, error } = await supabase.rpc('purge_expired_support_and_enquiries')

  if (error) {
    console.error(error)
    return jsonResponse({ error: error.message || 'Purge failed' }, 500)
  }

  return jsonResponse({ ok: true, result: data })
})
