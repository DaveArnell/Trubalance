const STORAGE_KEY = 'trubalance-simulated-date'

let overrideDateKey: string | null = null

function parseDateKey(key: string): Date | null {
  const match = key.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(year, month - 1, day)
  if (Number.isNaN(date.getTime())) return null
  return date
}

export function dateToKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function readStoredSimulatedDateKey(): string | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return parseDateKey(raw) ? raw : null
  } catch {
    return null
  }
}

export function writeStoredSimulatedDateKey(key: string | null) {
  try {
    if (key) localStorage.setItem(STORAGE_KEY, key)
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

export function setReferenceDateOverride(key: string | null) {
  overrideDateKey = key && parseDateKey(key) ? key : null
}

export function getSimulatedDateKey(): string | null {
  return overrideDateKey
}

export function isSimulatedDateActive(): boolean {
  return overrideDateKey !== null
}

/** App-wide “today” — real clock unless admin mode sets a simulated date. */
export function getReferenceDate(): Date {
  if (overrideDateKey) {
    const parsed = parseDateKey(overrideDateKey)
    if (parsed) return parsed
  }
  return new Date()
}

export function getReferenceDateKey(): string {
  return dateToKey(getReferenceDate())
}

/** Parse YYYY-MM-DD into a local calendar date (midnight). */
export function dateKeyToDate(dateKey: string): Date {
  const parsed = parseDateKey(dateKey)
  if (!parsed) {
    throw new Error(`Invalid date key: ${dateKey}`)
  }
  return parsed
}
