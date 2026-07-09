import { newId } from '../utils/id'
import type { BankImportColumnKey, BankImportColumnMapping, ParsedBankTransaction } from './types'
import { normalizeDescription } from './normalize'
import { parseDateCell } from './parseDate'
import { parseMoneyCell } from './parseMoney'

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

    // UK statements often show outflows as negative in the Money out column.
    moneyIn = Math.abs(moneyIn)
    moneyOut = Math.abs(moneyOut)

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
