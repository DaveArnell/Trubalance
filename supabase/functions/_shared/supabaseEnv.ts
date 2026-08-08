/** Resolve Supabase service role key across older and newer Edge Function envs. */
export function getServiceRoleKey(): string | undefined {
  const direct =
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')?.trim() ||
    Deno.env.get('SERVICE_ROLE_KEY')?.trim()
  if (direct) return direct

  const raw = Deno.env.get('SUPABASE_SECRET_KEYS')?.trim()
  if (!raw) return undefined

  try {
    const parsed = JSON.parse(raw) as unknown
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const map = parsed as Record<string, unknown>
      for (const key of ['service_role', 'SERVICE_ROLE', 'default', 'sb_secret']) {
        const value = map[key]
        if (typeof value === 'string' && value.trim()) return value.trim()
      }
      for (const value of Object.values(map)) {
        if (typeof value === 'string' && value.trim().length > 20) return value.trim()
      }
    }
  } catch {
    /* ignore malformed JSON */
  }

  return undefined
}

export function getAnonKey(): string | undefined {
  return (
    Deno.env.get('SUPABASE_ANON_KEY')?.trim() ||
    Deno.env.get('ANON_KEY')?.trim() ||
    undefined
  )
}
