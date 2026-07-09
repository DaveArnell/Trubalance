import { parseDateCell, mergeWrappedDate } from './parseDate'
import { looksLikeMoney, parseMoneyCell } from './parseMoney'
import type { PdfTextItem } from './pdfTextExtract'
import { clusterPdfItemsIntoRows, rowText } from './pdfTextExtract'

export type TableColumnKey =
  | 'date'
  | 'description'
  | 'moneyIn'
  | 'moneyOut'
  | 'balance'
  | 'amount'

export interface TableColumn {
  key: TableColumnKey
  xCenter: number
  xMin: number
  xMax: number
}

export interface ParsedPdfRow {
  date: string
  description: string
  moneyIn: string
  moneyOut: string
  balance: string
}

const HEADER_LABELS: Record<TableColumnKey, RegExp[]> = {
  date: [/^date$/i],
  description: [/^description$/i, /^transaction$/i, /^details$/i, /^narrative$/i],
  moneyIn: [/^money\s*in(\s*\([^)]*\))?$/i, /^paid\s*in$/i, /^credit$/i, /^credits$/i],
  moneyOut: [/^money\s*out(\s*\([^)]*\))?$/i, /^paid\s*out$/i, /^debit$/i, /^debits$/i],
  balance: [/^balance$/i, /^running\s*balance$/i],
  amount: [/^amount$/i],
}

const SKIP_ROW =
  /^(page\s+\d+\s+of\s+\d+|showing\s+\d+\s+transactions|available balance|last night|overdraft limit|card number|pending debit|sort code|account number|statement period|transaction types)/i

function isHeaderLabel(text: string): boolean {
  const label = text.trim()
  return Object.values(HEADER_LABELS).flat().some((pattern) => pattern.test(label))
}

function itemCenter(item: PdfTextItem): number {
  if (item.width > 0) return item.x + item.width / 2
  return item.x
}

/** Right edge for amounts (UK statements right-align money columns). */
function itemAssignX(item: PdfTextItem): number {
  if (looksLikeMoney(item.text) && item.width > 0) return item.x + item.width
  if (item.width > 0) return item.x + item.width / 2
  return item.x
}

function detectHeaderColumns(row: PdfTextItem[]): TableColumn[] | null {
  const sorted = [...row].sort((a, b) => a.x - b.x)
  const matches: Array<{ key: TableColumnKey; x: number }> = []

  const tryAddMatch = (text: string, x: number) => {
    const label = text.replace(/\s+/g, ' ').trim()
    if (!label) return false
    for (const [key, patterns] of Object.entries(HEADER_LABELS) as Array<
      [TableColumnKey, RegExp[]]
    >) {
      if (matches.some((item) => item.key === key)) continue
      if (patterns.some((pattern) => pattern.test(label))) {
        matches.push({ key, x })
        return true
      }
    }
    return false
  }

  for (let i = 0; i < sorted.length; i++) {
    const item = sorted[i]!
    if (tryAddMatch(item.text, itemCenter(item))) continue
    const next = sorted[i + 1]
    if (next) {
      const combined = `${item.text} ${next.text}`
      if (tryAddMatch(combined, (itemCenter(item) + itemCenter(next)) / 2)) {
        i += 1
      }
    }
  }

  const line = rowText(row)
  if (line) {
    const linePatterns: Array<{ key: TableColumnKey; pattern: RegExp }> = [
      { key: 'date', pattern: /\bdate\b/i },
      { key: 'description', pattern: /\b(description|transaction|details)\b/i },
      { key: 'moneyIn', pattern: /\bmoney\s*in\b/i },
      { key: 'moneyOut', pattern: /\bmoney\s*out\b/i },
      { key: 'balance', pattern: /\bbalance\b/i },
      { key: 'amount', pattern: /\bamount\b/i },
    ]
    for (const { key, pattern } of linePatterns) {
      if (matches.some((item) => item.key === key)) continue
      if (!pattern.test(line)) continue
      const item = sorted.find((entry) => pattern.test(entry.text)) ?? sorted[0]
      if (item) matches.push({ key, x: itemCenter(item) })
    }
  }

  const hasDate = matches.some((item) => item.key === 'date')
  const hasDescription = matches.some((item) => item.key === 'description')
  const hasAmountSide = matches.some(
    (item) => item.key === 'moneyIn' || item.key === 'moneyOut' || item.key === 'amount',
  )

  if (!hasDate || (!hasDescription && !matches.some((item) => item.key === 'amount')) || !hasAmountSide) {
    return null
  }

  const unique = new Map<TableColumnKey, number>()
  for (const match of matches) {
    if (!unique.has(match.key)) unique.set(match.key, match.x)
  }

  const sortedColumns = [...unique.entries()]
    .map(([key, xCenter]) => ({ key, xCenter }))
    .sort((a, b) => a.xCenter - b.xCenter)

  return sortedColumns.map((column, index) => {
    const prev = sortedColumns[index - 1]
    const next = sortedColumns[index + 1]
    const xMin = prev ? (prev.xCenter + column.xCenter) / 2 : column.xCenter - 50
    const xMax = next ? (column.xCenter + next.xCenter) / 2 : column.xCenter + 240
    return { key: column.key, xCenter: column.xCenter, xMin, xMax }
  })
}

function assignRowToCells(row: PdfTextItem[], columns: TableColumn[]): Record<TableColumnKey, string> {
  const cells: Record<TableColumnKey, string> = {
    date: '',
    description: '',
    moneyIn: '',
    moneyOut: '',
    balance: '',
    amount: '',
  }

  for (const item of row) {
    const x = itemAssignX(item)
    let column = columns.find((col) => x >= col.xMin && x < col.xMax)
    if (!column) {
      column = columns.reduce(
        (best, col) => {
          const dist = Math.abs(col.xCenter - x)
          return dist < best.dist ? { col, dist } : best
        },
        { col: columns[0]!, dist: Number.POSITIVE_INFINITY },
      ).col
    }

    cells[column.key] = cells[column.key] ? `${cells[column.key]} ${item.text}` : item.text
  }

  for (const key of Object.keys(cells) as TableColumnKey[]) {
    cells[key] = cells[key].replace(/\s+/g, ' ').trim()
  }

  return cells
}

interface DraftTransaction {
  date: string
  description: string
  moneyIn: string
  moneyOut: string
  balance: string
}

function finishDraft(draft: DraftTransaction): ParsedPdfRow | null {
  const description = draft.description.replace(/\s+/g, ' ').trim()
  if (!draft.date || !description) return null
  if (!draft.moneyIn && !draft.moneyOut && !looksLikeMoney(draft.balance)) return null
  return { ...draft, description }
}

function splitAmountColumns(cells: Record<TableColumnKey, string>): {
  moneyIn: string
  moneyOut: string
} {
  let moneyIn = cells.moneyIn
  let moneyOut = cells.moneyOut

  if (cells.amount && !moneyIn && !moneyOut) {
    const amount = parseMoneyCell(cells.amount)
    if (amount < 0) moneyOut = cells.amount
    else if (amount > 0) moneyIn = cells.amount
  }

  return { moneyIn, moneyOut }
}

export function parsePdfTableRows(items: PdfTextItem[]): ParsedPdfRow[] {
  const rows = clusterPdfItemsIntoRows(items)
  let columns: TableColumn[] | null = null
  const output: ParsedPdfRow[] = []
  let draft: DraftTransaction | null = null
  let pendingDatePrefix = ''

  for (const row of rows) {
    const line = rowText(row)
    if (!line || SKIP_ROW.test(line)) continue

    const header = detectHeaderColumns(row)
    if (header) {
      const probe = assignRowToCells(row, header)
      const probeDate = parseDateCell(probe.date)
      const probeHasMoney =
        looksLikeMoney(probe.moneyIn) ||
        looksLikeMoney(probe.moneyOut) ||
        looksLikeMoney(probe.balance) ||
        looksLikeMoney(probe.amount)
      if (!(probeDate && probeHasMoney)) {
        columns = header
        continue
      }
    }
    if (!columns) continue
    if (row.every((item) => isHeaderLabel(item.text))) continue

    const cells = assignRowToCells(row, columns)
    let dateRaw = cells.date

    if (!parseDateCell(dateRaw) && pendingDatePrefix) {
      const merged = mergeWrappedDate(pendingDatePrefix, dateRaw)
      if (merged) dateRaw = merged
      pendingDatePrefix = ''
    } else if (
      !parseDateCell(dateRaw) &&
      /^\d{1,2}\/\d{1,2}$/.test(dateRaw.trim()) &&
      !cells.description &&
      !looksLikeMoney(cells.moneyIn) &&
      !looksLikeMoney(cells.moneyOut)
    ) {
      pendingDatePrefix = dateRaw
      continue
    } else {
      pendingDatePrefix = ''
    }

    const date = parseDateCell(dateRaw)
    const { moneyIn, moneyOut } = splitAmountColumns(cells)
    const hasAmount = looksLikeMoney(moneyIn) || looksLikeMoney(moneyOut) || looksLikeMoney(cells.balance)
    const description = cells.description.trim()

    if (date && hasAmount) {
      const finished = draft ? finishDraft(draft) : null
      if (finished) output.push(finished)
      draft = {
        date,
        description,
        moneyIn,
        moneyOut,
        balance: cells.balance,
      }
      continue
    }

    if (date && description && !hasAmount) {
      const finished = draft ? finishDraft(draft) : null
      if (finished) output.push(finished)
      draft = {
        date,
        description,
        moneyIn: '',
        moneyOut: '',
        balance: cells.balance,
      }
      continue
    }

    if (!date && draft) {
      if (description) {
        draft.description = draft.description ? `${draft.description} ${description}` : description
      }
      if (!draft.moneyIn && moneyIn) draft.moneyIn = moneyIn
      if (!draft.moneyOut && moneyOut) draft.moneyOut = moneyOut
      if (!draft.balance && cells.balance) draft.balance = cells.balance
    }
  }

  const finished = draft ? finishDraft(draft) : null
  if (finished) output.push(finished)

  const seen = new Set<string>()
  return output.filter((row) => {
    const key = `${row.date}|${row.description}|${row.moneyIn}|${row.moneyOut}|${row.balance}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function parsedPdfRowsToStatementRows(rows: ParsedPdfRow[]): {
  headers: string[]
  rows: string[][]
} {
  const hasBalance = rows.some((row) => row.balance)
  const headers = hasBalance
    ? ['Date', 'Description', 'Money in', 'Money out', 'Balance']
    : ['Date', 'Description', 'Money in', 'Money out']

  const data = rows.map((row) => {
    const base = [row.date, row.description, row.moneyIn, row.moneyOut]
    if (hasBalance) base.push(row.balance)
    return base
  })

  return { headers, rows: data }
}
