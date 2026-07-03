import { newId } from '../utils/id'
import { toAmount } from '../utils/amounts'
import type { BankImportColumnKey, BankImportColumnMapping, ParsedBankTransaction } from './types'
import { normalizeDescription } from './normalize'

function parseCsvLine(line: string): string[] {
  const cells: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]!
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
      continue
    }
    if (char === ',' && !inQuotes) {
      cells.push(current.trim())
      current = ''
      continue
    }
    current += char
  }
  cells.push(current.trim())
  return cells
}

export function parseCsvText(text: string): { headers: string[]; rows: string[][] } {
  const lines = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  if (lines.length === 0) return { headers: [], rows: [] }

  const headers = parseCsvLine(lines[0]!)
  const rows = lines.slice(1).map(parseCsvLine)
  return { headers, rows }
}

const HEADER_ALIASES: Record<BankImportColumnKey, string[]> = {
  date: ['date', 'transaction date', 'posted date', 'value date', 'booking date'],
  description: ['description', 'narrative', 'details', 'memo', 'payee', 'reference', 'particulars'],
  moneyIn: ['money in', 'credit', 'paid in', 'deposit', 'credits'],
  moneyOut: ['money out', 'debit', 'paid out', 'withdrawal', 'debits', 'payment'],
  balance: ['balance', 'running balance', 'closing balance'],
}

function matchColumnIndex(headers: string[], key: BankImportColumnKey): number | undefined {
  const normalized = headers.map((h) => h.toLowerCase().trim())
  for (let i = 0; i < normalized.length; i++) {
    const header = normalized[i]!
    if (HEADER_ALIASES[key].some((alias) => header === alias || header.includes(alias))) {
      return i
    }
  }
  return undefined
}

export function guessColumnMapping(headers: string[]): BankImportColumnMapping {
  const date = matchColumnIndex(headers, 'date')
  const description = matchColumnIndex(headers, 'description')
  const moneyIn = matchColumnIndex(headers, 'moneyIn')
  const moneyOut = matchColumnIndex(headers, 'moneyOut')
  const balance = matchColumnIndex(headers, 'balance')

  return {
    date: date ?? 0,
    description: description ?? 1,
    moneyIn,
    moneyOut,
    balance,
  }
}

function parseDateCell(raw: string): string | null {
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

  const parsed = new Date(value)
  if (!Number.isNaN(parsed.getTime())) {
    const y = parsed.getFullYear()
    const m = String(parsed.getMonth() + 1).padStart(2, '0')
    const d = String(parsed.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  return null
}

function parseMoneyCell(raw: string | undefined): number {
  if (!raw?.trim()) return 0
  const cleaned = raw.replace(/[£$,]/g, '').replace(/\s/g, '').trim()
  if (!cleaned || cleaned === '-') return 0
  const negative = cleaned.startsWith('(') && cleaned.endsWith(')')
  const numeric = negative ? cleaned.slice(1, -1) : cleaned
  const value = toAmount(Number(numeric))
  return negative ? -Math.abs(value) : value
}

function cell(row: string[], index: number | undefined): string {
  if (index === undefined || index < 0) return ''
  return row[index] ?? ''
}

export function mapRowsToTransactions(
  rows: string[][],
  mapping: BankImportColumnMapping,
): ParsedBankTransaction[] {
  const transactions: ParsedBankTransaction[] = []

  for (const row of rows) {
    const date = parseDateCell(cell(row, mapping.date))
    const description = cell(row, mapping.description)
    if (!date || !description.trim()) continue

    let moneyIn = parseMoneyCell(cell(row, mapping.moneyIn))
    let moneyOut = parseMoneyCell(cell(row, mapping.moneyOut))

    if (moneyIn < 0) {
      moneyOut += Math.abs(moneyIn)
      moneyIn = 0
    }
    if (moneyOut < 0) {
      moneyIn += Math.abs(moneyOut)
      moneyOut = 0
    }

    if (moneyIn === 0 && moneyOut === 0) continue

    const balanceRaw = mapping.balance !== undefined ? cell(row, mapping.balance) : ''
    const balance = balanceRaw ? parseMoneyCell(balanceRaw) : undefined

    transactions.push({
      id: newId(),
      date,
      description: description.trim(),
      moneyIn: Math.abs(moneyIn),
      moneyOut: Math.abs(moneyOut),
      amount: moneyIn > 0 ? moneyIn : -moneyOut,
      balance: balance || undefined,
      normalizedDescription: normalizeDescription(description),
    })
  }

  return transactions.sort((a, b) => a.date.localeCompare(b.date))
}
