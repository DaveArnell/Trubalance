import { toAmount } from '../utils/amounts'

export function parseMoneyCell(raw: string | undefined): number {
  if (!raw?.trim()) return 0
  let cleaned = raw.replace(/[£$,]/g, '').replace(/\s/g, '').trim()
  if (!cleaned || cleaned === '-') return 0

  let negative = false
  if (cleaned.startsWith('-')) {
    negative = true
    cleaned = cleaned.slice(1)
  } else if (cleaned.startsWith('(') && cleaned.endsWith(')')) {
    negative = true
    cleaned = cleaned.slice(1, -1)
  }

  const value = toAmount(Number(cleaned))
  if (!Number.isFinite(value) || value === 0) return 0
  return negative ? -Math.abs(value) : value
}

export function looksLikeMoney(text: string): boolean {
  return /£?\s*-?\(?\d[\d,]*\.\d{2}\)?/.test(text.trim())
}
