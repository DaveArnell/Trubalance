/** Normalize bank text for grouping similar payees. */
export function normalizeDescription(description: string): string {
  return description
    .toUpperCase()
    .replace(/^\s*(DD|DDR|SO|STO|FPI|FPO|BGC|BP|VIS|POS|CHQ|DEB|CR|FT|FASTER\s+PAYMENT)\s+/i, '')
    .replace(/\d{6,}/g, ' ')
    .replace(/[^A-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 48)
}

export function groupKeyForDescription(description: string): string {
  const normalized = normalizeDescription(description)
  const words = normalized.split(' ').filter(Boolean)
  if (words.length <= 2) return normalized
  return words.slice(0, 3).join(' ')
}
