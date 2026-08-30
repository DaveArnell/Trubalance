const VISITOR_KEY = 'cashprophet-visitor-id-v1'

function newId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID()
    }
  } catch {
    /* ignore */
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/** Stable anonymous visitor id for first-party acquisition funnel. */
export function getOrCreateVisitorId(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const existing = localStorage.getItem(VISITOR_KEY)
    if (existing && /^[0-9a-f-]{36}$/i.test(existing)) return existing
    const id = newId()
    localStorage.setItem(VISITOR_KEY, id)
    return id
  } catch {
    return null
  }
}

export function clearVisitorId(): void {
  try {
    localStorage.removeItem(VISITOR_KEY)
  } catch {
    /* ignore */
  }
}
