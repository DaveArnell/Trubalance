import { DEFAULT_DISPLAY_CURRENCY, normalizeDisplayCurrency, type DisplayCurrency } from './format'

export type TableStyle = 'modern' | 'platform' | 'minimal'
export type TableDensity = 'comfortable' | 'compact' | 'dense'
export type CellTextAlign = 'left' | 'center' | 'right'
export type CellVerticalAlign = 'top' | 'middle' | 'bottom'
export type CellTextWrap = 'wrap' | 'nowrap'

export interface TablePreferences {
  style: TableStyle
  density: TableDensity
  textAlign: CellTextAlign
  verticalAlign: CellVerticalAlign
  textWrap: CellTextWrap
  currency: DisplayCurrency
}

export interface TablePreferencesStore {
  global: TablePreferences
  widgets: Record<string, Partial<TablePreferences>>
}

const STORAGE_KEY = 'trubalance-table-preferences'

export const DEFAULT_TABLE_PREFERENCES: TablePreferences = {
  style: 'modern',
  density: 'compact',
  textAlign: 'center',
  verticalAlign: 'middle',
  textWrap: 'nowrap',
  currency: DEFAULT_DISPLAY_CURRENCY,
}

function normalizeTextAlign(value: unknown): CellTextAlign {
  if (value === 'left' || value === 'right') return value
  return 'center'
}

function normalizeVerticalAlign(value: unknown): CellVerticalAlign {
  if (value === 'top' || value === 'bottom') return value
  return 'middle'
}

function normalizeTextWrap(value: unknown): CellTextWrap {
  return value === 'wrap' ? 'wrap' : 'nowrap'
}

function normalizePreferences(partial: Partial<TablePreferences> | undefined): TablePreferences {
  const legacyNumberAlign = (partial as { numberAlign?: string } | undefined)?.numberAlign
  const textAlign =
    partial?.textAlign !== undefined
      ? normalizeTextAlign(partial.textAlign)
      : legacyNumberAlign === 'right'
        ? 'right'
        : legacyNumberAlign === 'left'
          ? 'left'
          : DEFAULT_TABLE_PREFERENCES.textAlign

  return {
    ...DEFAULT_TABLE_PREFERENCES,
    ...partial,
    textAlign,
    verticalAlign: normalizeVerticalAlign(partial?.verticalAlign),
    textWrap: normalizeTextWrap(partial?.textWrap),
    currency: normalizeDisplayCurrency(partial?.currency),
  }
}

function defaultStore(): TablePreferencesStore {
  return { global: { ...DEFAULT_TABLE_PREFERENCES }, widgets: {} }
}

export function loadTablePreferences(): TablePreferencesStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultStore()
    const parsed = JSON.parse(raw) as Partial<TablePreferencesStore>
    return {
      global: normalizePreferences(parsed.global),
      widgets: Object.fromEntries(
        Object.entries(parsed.widgets ?? {}).map(([id, prefs]) => [id, normalizePreferences(prefs)]),
      ),
    }
  } catch {
    return defaultStore()
  }
}

export function saveTablePreferences(store: TablePreferencesStore) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    /* ignore */
  }
}

export function getEffectiveTablePreferences(
  store: TablePreferencesStore,
  widgetId?: string,
): TablePreferences {
  const widgetOverrides = widgetId ? store.widgets[widgetId] : undefined
  const merged = normalizePreferences({ ...store.global, ...widgetOverrides })
  return { ...merged, currency: store.global.currency }
}

export function tablePreferenceClasses(prefs: TablePreferences, widgetId?: string) {
  const classes = [
    `table-style-${prefs.style}`,
    `table-density-${prefs.density}`,
    `table-align-h-${prefs.textAlign}`,
    `table-align-v-${prefs.verticalAlign}`,
    `table-wrap-${prefs.textWrap}`,
  ]
  if (widgetId) classes.push(`table-widget-${widgetId}`)
  return classes.join(' ')
}

export function applyGlobalTablePreferenceClasses(prefs: TablePreferences) {
  const root = document.documentElement
  const allClasses = [
    'table-style-modern',
    'table-style-platform',
    'table-style-minimal',
    'table-density-comfortable',
    'table-density-compact',
    'table-density-dense',
    'table-align-h-left',
    'table-align-h-center',
    'table-align-h-right',
    'table-align-v-top',
    'table-align-v-middle',
    'table-align-v-bottom',
    'table-wrap-wrap',
    'table-wrap-nowrap',
    'table-align-numbers-center',
    'table-align-numbers-right',
  ]
  root.classList.remove(...allClasses)
  root.classList.add(
    `table-style-${prefs.style}`,
    `table-density-${prefs.density}`,
    `table-align-h-${prefs.textAlign}`,
    `table-align-v-${prefs.verticalAlign}`,
    `table-wrap-${prefs.textWrap}`,
  )
}
