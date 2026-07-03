export const DISPLAY_CURRENCY_CATALOG = [
  { code: 'AED', locale: 'en-AE', label: 'UAE dirham' },
  { code: 'AUD', locale: 'en-AU', label: 'Australian dollar' },
  { code: 'BRL', locale: 'pt-BR', label: 'Brazilian real' },
  { code: 'CAD', locale: 'en-CA', label: 'Canadian dollar' },
  { code: 'CHF', locale: 'de-CH', label: 'Swiss franc' },
  { code: 'CNY', locale: 'zh-CN', label: 'Chinese yuan' },
  { code: 'CZK', locale: 'cs-CZ', label: 'Czech koruna' },
  { code: 'DKK', locale: 'da-DK', label: 'Danish krone' },
  { code: 'EUR', locale: 'en-IE', label: 'Euro' },
  { code: 'GBP', locale: 'en-GB', label: 'British pound' },
  { code: 'HKD', locale: 'en-HK', label: 'Hong Kong dollar' },
  { code: 'HUF', locale: 'hu-HU', label: 'Hungarian forint' },
  { code: 'ILS', locale: 'he-IL', label: 'Israeli shekel' },
  { code: 'INR', locale: 'en-IN', label: 'Indian rupee' },
  { code: 'JPY', locale: 'ja-JP', label: 'Japanese yen' },
  { code: 'KRW', locale: 'ko-KR', label: 'South Korean won' },
  { code: 'MXN', locale: 'es-MX', label: 'Mexican peso' },
  { code: 'MYR', locale: 'ms-MY', label: 'Malaysian ringgit' },
  { code: 'NOK', locale: 'nb-NO', label: 'Norwegian krone' },
  { code: 'NZD', locale: 'en-NZ', label: 'New Zealand dollar' },
  { code: 'PHP', locale: 'en-PH', label: 'Philippine peso' },
  { code: 'PLN', locale: 'pl-PL', label: 'Polish złoty' },
  { code: 'SAR', locale: 'ar-SA', label: 'Saudi riyal' },
  { code: 'SEK', locale: 'sv-SE', label: 'Swedish krona' },
  { code: 'SGD', locale: 'en-SG', label: 'Singapore dollar' },
  { code: 'THB', locale: 'th-TH', label: 'Thai baht' },
  { code: 'TRY', locale: 'tr-TR', label: 'Turkish lira' },
  { code: 'TWD', locale: 'zh-TW', label: 'New Taiwan dollar' },
  { code: 'USD', locale: 'en-US', label: 'US dollar' },
  { code: 'ZAR', locale: 'en-ZA', label: 'South African rand' },
] as const

export type DisplayCurrency = (typeof DISPLAY_CURRENCY_CATALOG)[number]['code']

export const DEFAULT_DISPLAY_CURRENCY: DisplayCurrency = 'GBP'

const CURRENCY_LOCALE = Object.fromEntries(
  DISPLAY_CURRENCY_CATALOG.map((entry) => [entry.code, entry.locale]),
) as Record<DisplayCurrency, string>

const DISPLAY_CURRENCY_CODES = new Set<string>(DISPLAY_CURRENCY_CATALOG.map((entry) => entry.code))

export const DISPLAY_CURRENCY_OPTIONS: { value: DisplayCurrency; label: string }[] =
  DISPLAY_CURRENCY_CATALOG.map((entry) => ({
    value: entry.code,
    label: `${entry.code} — ${entry.label}`,
  }))

let displayCurrency: DisplayCurrency = DEFAULT_DISPLAY_CURRENCY

export function getDisplayCurrency(): DisplayCurrency {
  return displayCurrency
}

export function setDisplayCurrency(currency: DisplayCurrency) {
  displayCurrency = currency
}

export function normalizeDisplayCurrency(value: unknown): DisplayCurrency {
  if (typeof value === 'string' && DISPLAY_CURRENCY_CODES.has(value)) {
    return value as DisplayCurrency
  }
  return DEFAULT_DISPLAY_CURRENCY
}

export function getCurrencyLocale(currency: DisplayCurrency = displayCurrency): string {
  return CURRENCY_LOCALE[currency]
}

function currencyFormatter(options: Intl.NumberFormatOptions, currency: DisplayCurrency = displayCurrency) {
  return new Intl.NumberFormat(getCurrencyLocale(currency), {
    style: 'currency',
    currency,
    ...options,
  })
}

export function getCurrencySymbol(currency: DisplayCurrency = displayCurrency): string {
  const parts = currencyFormatter({ maximumFractionDigits: 0 }, currency).formatToParts(0)
  return parts.find((part) => part.type === 'currency')?.value ?? currency
}

/** Strip grouping separators and the active currency symbol from manual amount input. */
export function stripCurrencyInput(raw: string): string {
  const symbol = getCurrencySymbol()
  const escaped = symbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return raw.replace(new RegExp(`[,.\\s${escaped}]`, 'g'), '')
}

export const formatCurrency = (value: number) =>
  currencyFormatter({ maximumFractionDigits: 0 }).format(value)

/** Shorter amounts for tight table cells — full value should go in a title attribute. */
export const formatCurrencyCompact = (value: number) =>
  currencyFormatter({
    notation: 'compact',
    maximumFractionDigits: value >= 100_000 ? 0 : 1,
  }).format(value)

export const formatCurrencyExact = (value: number) =>
  currencyFormatter({ minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)

export const columnLabel = (name: string) =>
  name.replace(/\s+Ltd\.?$/i, '').replace(/\s+/g, '').toUpperCase()

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const

export const currentMonthIndex = () => new Date().getMonth()
