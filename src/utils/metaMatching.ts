/** Meta matching cookies and identifier hashing — no financial data. */

export function readMetaFbp(): string | undefined {
  if (typeof document === 'undefined') return undefined
  const match = document.cookie.match(/(?:^|; )_fbp=([^;]*)/)
  const value = match?.[1] ? decodeURIComponent(match[1]) : undefined
  return value || undefined
}

export function readMetaFbc(): string | undefined {
  if (typeof document === 'undefined') return undefined
  const match = document.cookie.match(/(?:^|; )_fbc=([^;]*)/)
  const value = match?.[1] ? decodeURIComponent(match[1]) : undefined
  return value || undefined
}

/** Normalize then SHA-256 hex — Meta Conversions API requirement for email. */
export async function hashEmailForMeta(email: string): Promise<string | undefined> {
  const normalized = email.trim().toLowerCase()
  if (!normalized || !normalized.includes('@')) return undefined
  try {
    const data = new TextEncoder().encode(normalized)
    const digest = await crypto.subtle.digest('SHA-256', data)
    return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
  } catch {
    return undefined
  }
}

export function newMetaEventId(prefix: string): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return `${prefix}_${crypto.randomUUID()}`
    }
  } catch {
    /* ignore */
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}
