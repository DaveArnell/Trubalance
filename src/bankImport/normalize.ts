/** Normalize bank text for grouping similar payees. */
export function normalizeDescription(description: string): string {
  return description
    .toUpperCase()
    .replace(
      /^\s*(DD|DDR|SO|STO|FPI|FPO|BGC|BP|VIS|POS|CHQ|DEB|CR|FT|FASTER\s+PAYMENT|SENT|RECEIVED|CARD\s+PAYMENT|DIRECT\s+DEBIT|STANDING\s+ORDER)\s+/gi,
      '',
    )
    .replace(/\b(DIRECT DEBIT|STANDING ORDER|CARD PAYMENT|CONTACTLESS|APPLE PAY|GOOGLE PAY)\b/gi, ' ')
    .replace(/\b[A-Z0-9]*\d[A-Z0-9]{2,}\b/g, ' ')
    .replace(/\b\d{6,}\b/g, ' ')
    .replace(/\b\d{1,2}[\/\-.]\d{1,2}([\/\-.]\d{2,4})?\b/g, ' ')
    .replace(/\b\d+\.\d{2}\b/g, ' ')
    .replace(/[^A-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 48)
}

const GROUP_STOP_WORDS = new Set(['LTD', 'LIMITED', 'PLC', 'UK', 'THE', 'AND', 'CO', 'COMPANY'])

export function groupKeyForDescription(description: string): string {
  const normalized = normalizeDescription(description)
  const words = normalized
    .split(' ')
    .filter(Boolean)
    .filter((word) => !GROUP_STOP_WORDS.has(word))
  if (words.length === 0) return normalized
  if (words.length <= 2) return words.join(' ')
  return words.slice(0, 2).join(' ')
}
