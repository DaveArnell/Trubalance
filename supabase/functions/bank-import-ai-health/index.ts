import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

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

  const openAiKey = Deno.env.get('OPENAI_API_KEY')
  if (!openAiKey) {
    return jsonResponse({
      configured: false,
      ok: false,
      message:
        'AI analysis is not set up yet. Add OPENAI_API_KEY in Supabase → Edge Functions → Secrets.',
    })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return jsonResponse({
      configured: true,
      ok: false,
      message: 'Please sign in to use statement analysis.',
    })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } },
  })

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) {
    return jsonResponse({
      configured: true,
      ok: false,
      message: 'Please sign in to use statement analysis.',
    })
  }

  try {
    const model = Deno.env.get('OPENAI_MODEL_TEXT') ?? 'gpt-4o-mini'
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openAiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        max_tokens: 20,
        messages: [{ role: 'user', content: 'Reply with exactly: ok' }],
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      return jsonResponse({
        configured: true,
        ok: false,
        message: `OpenAI connection failed. Check your API key. (${response.status}) ${errText.slice(0, 120)}`,
      })
    }

    return jsonResponse({
      configured: true,
      ok: true,
      message: 'AI analysis is ready.',
    })
  } catch (err) {
    return jsonResponse({
      configured: true,
      ok: false,
      message: err instanceof Error ? err.message : 'OpenAI connection failed.',
    })
  }
})
