import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist'
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

type PdfTextItem = {
  str: string
  transform: number[]
}

GlobalWorkerOptions.workerSrc = pdfWorker

const DATE_START =
  /^(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}|\d{4}[\/\-.]\d{1,2}[\/\-.]\d{1,2})/

const MONEY_FRAGMENT = /(-?\(?£?\s*[\d,]+\.\d{2}\)?|-?\(?£?\s*[\d,]+\)?)/g

function normalizeLineText(line: string): string {
  return line.replace(/\s+/g, ' ').trim()
}

function parsePdfLine(line: string): string[] | null {
  const trimmed = normalizeLineText(line)
  if (!trimmed || !DATE_START.test(trimmed)) return null

  const dateMatch = trimmed.match(DATE_START)
  if (!dateMatch) return null

  const date = dateMatch[1]!
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
    const isOut = movement.includes('(') || value.startsWith('-')
    return [
      date,
      description,
      isOut ? '' : movement,
      isOut ? movement.replace(/[()]/g, '') : '',
      balance,
    ]
  }

  const movement = amounts[0]!
  const value = movement.replace(/[()£,\s]/g, '')
  const isOut = movement.includes('(') || value.startsWith('-')
  return [date, description, isOut ? '' : movement, isOut ? movement.replace(/[()]/g, '') : '']
}

async function extractLinesFromPdf(file: File): Promise<string[]> {
  const buffer = await file.arrayBuffer()
  const pdf = await getDocument({ data: buffer }).promise
  const lines: string[] = []

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
    const page = await pdf.getPage(pageNum)
    const content = await page.getTextContent()
    const buckets = new Map<number, Array<{ x: number; text: string }>>()

    for (const raw of content.items) {
      if (!('str' in raw)) continue
      const item = raw as PdfTextItem
      const text = item.str?.trim()
      if (!text) continue
      const y = Math.round(item.transform[5] ?? 0)
      const x = item.transform[4] ?? 0
      const list = buckets.get(y) ?? []
      list.push({ x, text })
      buckets.set(y, list)
    }

    const sortedYs = [...buckets.keys()].sort((a, b) => b - a)
    for (const y of sortedYs) {
      const parts = (buckets.get(y) ?? []).sort((a, b) => a.x - b.x).map((part) => part.text)
      const line = normalizeLineText(parts.join(' '))
      if (line) lines.push(line)
    }
  }

  return lines
}

export async function parsePdfBankStatement(
  file: File,
): Promise<{ headers: string[]; rows: string[][] }> {
  const lines = await extractLinesFromPdf(file)
  const rows: string[][] = []

  for (const line of lines) {
    const row = parsePdfLine(line)
    if (row) rows.push(row)
  }

  if (rows.length === 0) {
    throw new Error(
      'Could not find transactions in that PDF. Try exporting CSV from your bank, or a PDF with a clear date and amount column.',
    )
  }

  const hasBalance = rows.some((row) => row.length >= 5)
  const headers = hasBalance
    ? ['Date', 'Description', 'Money in', 'Money out', 'Balance']
    : ['Date', 'Description', 'Money in', 'Money out']

  return { headers, rows }
}
