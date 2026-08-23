import { mergeWrappedDate, parseDateCell } from './parseDate'
import { looksLikeMoney, parseMoneyCell } from './parseMoney'
import type { ParsedPdfRow } from './pdfTableParser'
import type { PdfTextItem } from './pdfTextExtract'
import { clusterPdfItemsIntoRows, rowText } from './pdfTextExtract'

const TX_TYPE =
  /^(Bill Payment|Direct Debit|Standing Order|Counter Credit|Credit|Debit|Transfer|Faster Payments?|On-?Line Banking|Bank Giro Credit|Card Payment|Charge|Fee|Interest|OnLine Banking)$/i

const NOISE_LINE = /^(GC|BGC|DDR|DD|BBP|BDC|SO|FP|R|CR|BP)$/i

const SKIP =
  /^(page\s+\d+|showing\s+\d+|available balance|last night|overdraft limit|card number|pending debit|date\s+description|date\s+transaction|transactions$|today:)/i

function extractAmounts(line: string): { text: string; amounts: string[] } {
  const amounts: string[] = []
  const text = line
    .replace(/(-?£?\s*[\d,]+\.\d{2})/g, (match) => {
      amounts.push(match.replace(/\s/g, ''))
      return ' '
    })
    .replace(/\s+/g, ' ')
    .trim()
  return { text, amounts }
}

function applyMovement(
  draft: ParsedPdfRow,
  amounts: string[],
  typeLabel: string,
): void {
  if (amounts.length === 0) return
  const movement = amounts.length >= 2 ? amounts[amounts.length - 2]! : amounts[0]!
  const balance = amounts.length >= 2 ? amounts[amounts.length - 1]! : ''
  const value = parseMoneyCell(movement)
  const type = typeLabel.toLowerCase()
  const looksOut =
    value < 0 ||
    /debit|bill payment|standing|transfer|charge|fee/.test(type)
  const looksIn = /credit|giro/.test(type) && !/debit/.test(type)

  if (looksIn && !looksOut) {
    draft.moneyIn = movement
    draft.moneyOut = ''
  } else {
    draft.moneyOut = movement
    draft.moneyIn = ''
  }
  if (balance) draft.balance = balance
}

function appendDescription(current: string, extra: string): string {
  const piece = extra.replace(/\s+/g, ' ').trim()
  if (!piece || NOISE_LINE.test(piece)) return current
  if (!current) return piece
  if (current.includes(piece)) return current
  return `${current} ${piece}`
}

/**
 * Many UK bank PDF exports wrap one transaction across several visual lines
 * (type, date, payee, amount, year, reference). Column-based parsing then
 * attaches the next credit’s reference to the previous debit.
 */
export function parseWrappedBankPdfRows(items: PdfTextItem[]): ParsedPdfRow[] {
  const rawLines = clusterPdfItemsIntoRows(items)
    .map((row) => rowText(row))
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)

  const lines: string[] = []
  let skipPending = false
  for (const line of rawLines) {
    if (/pending\s+(debit\s+)?card\s+transactions/i.test(line)) {
      skipPending = true
      continue
    }
    if (/^date\s+description\b/i.test(line) || /^date\s+description\s+money/i.test(line)) {
      skipPending = false
      continue
    }
    if (skipPending) continue
    if (SKIP.test(line)) continue
    lines.push(line)
  }

  const output: ParsedPdfRow[] = []
  const state: { draft: ParsedPdfRow | null } = { draft: null }
  let pendingType = ''
  let pendingDatePrefix = ''
  let lastYear = ''

  const flush = () => {
    const current = state.draft
    if (!current) return
    const description = current.description.replace(/\s+/g, ' ').trim()
    const hasMoney = looksLikeMoney(current.moneyIn) || looksLikeMoney(current.moneyOut)
    if (description && hasMoney && current.date) {
      output.push({ ...current, description })
    }
    state.draft = null
  }

  const ensureDraft = (): ParsedPdfRow => {
    if (!state.draft) {
      let date = ''
      if (pendingDatePrefix && lastYear) {
        date = parseDateCell(`${pendingDatePrefix}/${lastYear}`) ?? ''
      }
      state.draft = {
        date,
        description: pendingType,
        moneyIn: '',
        moneyOut: '',
        balance: '',
      }
    }
    return state.draft
  }

  const draftHasMoney = () => {
    const current = state.draft
    return Boolean(
      current && (looksLikeMoney(current.moneyIn) || looksLikeMoney(current.moneyOut)),
    )
  }

  for (const line of lines) {
    if (TX_TYPE.test(line)) {
      flush()
      pendingType = line
      pendingDatePrefix = ''
      continue
    }

    if (/^\d{1,2}\/\d{1,2}$/.test(line)) {
      if (draftHasMoney()) flush()
      pendingDatePrefix = line
      continue
    }

    if (/^\/\d{2,4}$/.test(line) || /^\/\d{2,4}\b/.test(line)) {
      const yearMatch = line.match(/^\/(\d{2,4})\b/)
      const rest = line.replace(/^\/\d{2,4}\s*/, '').trim()
      if (yearMatch) {
        lastYear = yearMatch[1]!
        const merged = pendingDatePrefix
          ? mergeWrappedDate(pendingDatePrefix, `/${yearMatch[1]}`)
          : null
        if (merged) {
          ensureDraft().date = merged
        }
      }
      if (rest) {
        const current = ensureDraft()
        current.description = appendDescription(current.description, rest)
      }
      continue
    }

    const { text, amounts } = extractAmounts(line)
    const dateAtStart = text.match(/^(\d{1,2}\/\d{1,2})(?:\s+|$)(.*)$/)
    let desc = text
    if (dateAtStart && !parseDateCell(dateAtStart[1]!)) {
      if (draftHasMoney()) flush()
      pendingDatePrefix = dateAtStart[1]!
      desc = dateAtStart[2] ?? ''
    }

    if (amounts.length > 0) {
      const current = ensureDraft()
      if (!current.date && pendingDatePrefix && lastYear) {
        current.date = parseDateCell(`${pendingDatePrefix}/${lastYear}`) ?? current.date
      }
      if (desc) current.description = appendDescription(current.description, desc)
      if (pendingType && !current.description.toLowerCase().includes(pendingType.toLowerCase())) {
        current.description = appendDescription(pendingType, current.description)
      }
      applyMovement(current, amounts, pendingType || current.description)
      continue
    }

    if (desc) {
      const current = ensureDraft()
      current.description = appendDescription(current.description, desc)
    }
  }

  flush()
  return output
}
