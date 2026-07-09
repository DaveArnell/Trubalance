import { extractPdfTextItems } from './pdfTextExtract'
import { parsePdfTableRows, parsedPdfRowsToStatementRows } from './pdfTableParser'
import { parseDateCell } from './parseDate'
import { inferDirectionFromDescription } from './inferAmounts'
import { looksLikeMoney, parseMoneyCell } from './parseMoney'

const DATE_START =
  /^(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}|\d{4}[\/\-.]\d{1,2}[\/\-.]\d{1,2}|\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2,4})/i

const MONEY_FRAGMENT = /(-?\(?£?\s*[\d,]+\.\d{2}\)?|-?\(?£?\s*[\d,]+\)?)/g

function normalizeLineText(line: string): string {
  return line.replace(/\s+/g, ' ').trim()
}

/** Legacy single-line parser used when column detection fails. */
function parsePdfLine(line: string): string[] | null {
  const trimmed = normalizeLineText(line)
  if (!trimmed || !DATE_START.test(trimmed)) return null

  const dateMatch = trimmed.match(DATE_START)
  if (!dateMatch) return null

  const date = dateMatch[1]!
  const isoDate = parseDateCell(date)
  if (!isoDate) return null

  const rest = trimmed.slice(date.length).trim()
  if (!rest) return null

  const amounts: string[] = []
  let match: RegExpExecArray | null
  while ((match = MONEY_FRAGMENT.exec(rest)) !== null) {
    amounts.push(match[1]!.trim())
  }
  MONEY_FRAGMENT.lastIndex = 0

  if (amounts.length === 0) return null

  const description = rest.replace(MONEY_FRAGMENT, '').replace(/\s+/g, ' ').trim()
  if (!description) return null

  if (amounts.length >= 2) {
    const balance = amounts[amounts.length - 1]!
    const movement = amounts[amounts.length - 2]!
    const value = movement.replace(/[()£,\s]/g, '')
    let isOut = movement.includes('(') || value.startsWith('-')
    if (!isOut && !movement.includes('(') && !value.startsWith('-')) {
      const direction = inferDirectionFromDescription(description)
      if (direction === 'out') isOut = true
      else if (direction === 'in') isOut = false
    }
    return [
      isoDate,
      description,
      isOut ? '' : movement,
      isOut ? movement.replace(/[()]/g, '') : '',
      balance,
    ]
  }

  const movement = amounts[0]!
  const value = movement.replace(/[()£,\s]/g, '')
  let isOut = movement.includes('(') || value.startsWith('-')
  if (!isOut) {
    const direction = inferDirectionFromDescription(description)
    if (direction === 'out') isOut = true
    else if (direction === 'in') isOut = false
  }
  return [isoDate, description, isOut ? '' : movement, isOut ? movement.replace(/[()]/g, '') : '']
}

function parsePdfLinesFallback(lines: string[]): { headers: string[]; rows: string[][] } {
  const rows: string[][] = []
  for (const line of lines) {
    const row = parsePdfLine(line)
    if (row) rows.push(row)
  }

  const hasBalance = rows.some((row) => row.length >= 5)
  const headers = hasBalance
    ? ['Date', 'Description', 'Money in', 'Money out', 'Balance']
    : ['Date', 'Description', 'Money in', 'Money out']

  return { headers, rows }
}

import type { PdfTextItem } from './pdfTextExtract'

function linesFromItems(items: PdfTextItem[]): string[] {
  const buckets = new Map<number, string[]>()
  for (const item of items) {
    const list = buckets.get(item.y) ?? []
    list.push(item.text)
    buckets.set(item.y, list)
  }
  return [...buckets.keys()]
    .sort((a, b) => b - a)
    .map((y) => normalizeLineText((buckets.get(y) ?? []).join(' ')))
    .filter(Boolean)
}

export async function parsePdfBankStatement(
  file: File,
  onProgress?: (page: number, total: number) => void,
): Promise<{ headers: string[]; rows: string[][] }> {
  const items = await extractPdfTextItems(file, onProgress)
  const tableRows = parsePdfTableRows(items)
  const tableResult = tableRows.length > 0 ? parsedPdfRowsToStatementRows(tableRows) : null
  const fallback = parsePdfLinesFallback(linesFromItems(items))

  function parseScore(result: { rows: string[][] } | null): number {
    if (!result) return 0
    return countParsableMoneyCells(result.rows) + result.rows.length * 0.01
  }

  const tableScore = parseScore(tableResult)
  const fallbackScore = parseScore(fallback)

  const best =
    tableResult && tableScore >= fallbackScore
      ? tableResult
      : fallback.rows.length > 0
        ? fallback
        : tableResult

  if (!best || best.rows.length === 0) {
    throw new Error(
      'Could not read transactions from that PDF. Try exporting CSV from your bank, or a statement with Date, Description, and Money in/out columns.',
    )
  }

  return best
}

export function countParsableMoneyCells(rows: string[][]): number {
  let count = 0
  for (const row of rows) {
    const amounts = row.slice(2).filter((cell) => looksLikeMoney(cell) && parseMoneyCell(cell) !== 0)
    if (amounts.length > 0) count++
  }
  return count
}
