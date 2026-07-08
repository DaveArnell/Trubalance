const MONTH_NAMES = '(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*'

/** Parse a bank statement date cell to ISO YYYY-MM-DD. */
export function parseDateCell(raw: string): string | null {
  const value = raw.trim()
  if (!value) return null

  if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10)
  }

  const slash = value.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/)
  if (slash) {
    const day = Number(slash[1])
    const month = Number(slash[2])
    let year = Number(slash[3])
    if (year < 100) year += year >= 70 ? 1900 : 2000
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    }
  }

  const shortSlash = value.match(/^(\d{1,2})[\/\-](\d{1,2})$/)
  if (shortSlash) {
    return null
  }

  const named = value.match(new RegExp(`^(\\d{1,2})\\s+${MONTH_NAMES}\\s+(\\d{2,4})$`, 'i'))
  if (named) {
    const parsed = new Date(`${named[2]} ${named[1]}, ${named[3]}`)
    if (!Number.isNaN(parsed.getTime())) {
      const y = parsed.getFullYear()
      const m = String(parsed.getMonth() + 1).padStart(2, '0')
      const d = String(parsed.getDate()).padStart(2, '0')
      return `${y}-${m}-${d}`
    }
  }

  const parsed = new Date(value)
  if (!Number.isNaN(parsed.getTime())) {
    const y = parsed.getFullYear()
    const m = String(parsed.getMonth() + 1).padStart(2, '0')
    const d = String(parsed.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  return null
}

/** Merge wrapped date cells such as "06/07" + "/2026". */
export function mergeWrappedDate(prefix: string, suffix: string): string | null {
  const left = prefix.trim()
  const right = suffix.trim()
  if (!left || !right) return null
  if (/^\/\d{2,4}$/.test(right) && /^\d{1,2}\/\d{1,2}$/.test(left)) {
    return parseDateCell(`${left}${right}`)
  }
  return null
}

export function looksLikeDateFragment(text: string): boolean {
  const value = text.trim()
  return (
    /^\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?$/i.test(value) ||
    new RegExp(`^\\d{1,2}\\s+${MONTH_NAMES}`, 'i').test(value) ||
    /^\/\d{2,4}$/.test(value)
  )
}
