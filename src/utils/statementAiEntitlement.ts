/**
 * Client-side entitlement for statement AI: one successful analysis per business,
 * unless admin has enabled unlimited for manual onboarding.
 */

const USED_KEY = 'trubalance-statement-ai-used-v1'
const CACHE_KEY_PREFIX = 'trubalance-statement-ai-cache-v1:'
const UNLIMITED_KEY = 'trubalance-statement-ai-unlimited-v1'

function readUsedMap(): Record<string, string> {
  try {
    const raw = localStorage.getItem(USED_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return {}
    const out: Record<string, string> = {}
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof value === 'string') out[key] = value
    }
    return out
  } catch {
    return {}
  }
}

function writeUsedMap(map: Record<string, string>) {
  try {
    localStorage.setItem(USED_KEY, JSON.stringify(map))
  } catch {
    /* ignore */
  }
}

export function isStatementAiUnlimitedLocally(): boolean {
  try {
    return localStorage.getItem(UNLIMITED_KEY) === '1'
  } catch {
    return false
  }
}

/** Admin / support: allow unlimited analyses on this browser until turned off. */
export function setStatementAiUnlimitedLocally(enabled: boolean) {
  try {
    if (enabled) localStorage.setItem(UNLIMITED_KEY, '1')
    else localStorage.removeItem(UNLIMITED_KEY)
  } catch {
    /* ignore */
  }
}

export function hasUsedStatementAiForBusiness(
  businessId: string,
  options?: { unlimited?: boolean; serverUsage?: Record<string, string> },
): boolean {
  if (options?.unlimited || isStatementAiUnlimitedLocally()) return false
  if (options?.serverUsage && options.serverUsage[businessId]) return true
  return Boolean(readUsedMap()[businessId])
}

export function markStatementAiUsedForBusiness(
  businessId: string,
  at = new Date().toISOString(),
  options?: { unlimited?: boolean },
) {
  if (options?.unlimited || isStatementAiUnlimitedLocally()) return
  const map = readUsedMap()
  map[businessId] = at
  writeUsedMap(map)
}

export function cacheStatementAiSuggestions(businessId: string, payload: unknown) {
  try {
    localStorage.setItem(
      `${CACHE_KEY_PREFIX}${businessId}`,
      JSON.stringify({ savedAt: new Date().toISOString(), payload }),
    )
  } catch {
    /* ignore */
  }
}

export function readCachedStatementAiSuggestions<T>(businessId: string): T | null {
  try {
    const raw = localStorage.getItem(`${CACHE_KEY_PREFIX}${businessId}`)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { payload?: T }
    return parsed.payload ?? null
  } catch {
    return null
  }
}

export function clearCachedStatementAiSuggestions(businessId: string) {
  try {
    localStorage.removeItem(`${CACHE_KEY_PREFIX}${businessId}`)
  } catch {
    /* ignore */
  }
}
