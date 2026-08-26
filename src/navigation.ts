export const APP_PAGES = [
  { id: 'committed-funds', label: 'Dashboard', kicker: 'Overview', icon: '▦' },
  { id: 'due', label: 'Due', kicker: 'Payments due', icon: '✓' },
  { id: 'receipts', label: 'Receipts', kicker: 'Expected in', icon: '↓' },
  { id: 'trends', label: 'Trends', kicker: 'Balance over time', icon: '↗' },
  { id: 'calendar', label: 'Calendar', kicker: 'Financial checklist', icon: '▣' },
  { id: 'forecast', label: 'Forecast', kicker: 'Forward look', icon: '⇢' },
  { id: 'history', label: 'History', kicker: 'Saved days', icon: '◷' },
  { id: 'reserve-planner', label: 'Reserve Planner', kicker: 'Irregular bills', icon: '◎' },
  { id: 'settings', label: 'Settings', kicker: 'Organisation', icon: '⚙' },
] as const

export type PageId = (typeof APP_PAGES)[number]['id']

/** Due + Receipts stay on the Dashboard on desktop; Forecast + History are muted for now. */
export const MOBILE_PRIMARY_PAGES: PageId[] = [
  'committed-funds',
  'trends',
  'calendar',
  'reserve-planner',
  'settings',
]

/** Hidden from desktop sidebar (still reachable on mobile drawer unless also muted). */
export const DESKTOP_SIDEBAR_HIDDEN_PAGES = new Set<PageId>(['due', 'receipts'])

/**
 * Pages kept in the codebase but removed from navigation.
 * Deep links redirect to Trends so old bookmarks do not strand users.
 */
export const MUTED_APP_PAGES = new Set<PageId>(['forecast', 'history'])

export interface AppRoute {
  page: PageId
  reservePlannerId: string | null
}

const PAGE_IDS = new Set(APP_PAGES.map((page) => page.id))

const LEGACY_HASH: Record<string, PageId> = {
  dashboard: 'committed-funds',
  reports: 'committed-funds',
  health: 'committed-funds',
  balances: 'trends',
  'expected-receipts': 'receipts',
  'due-now': 'due',
  admin: 'committed-funds',
  'business-hub': 'committed-funds',
  forecast: 'trends',
  history: 'trends',
}

export const RESERVE_PLANNER_CREATE_ROUTE = 'new'

export function buildHash(page: PageId, reservePlannerId?: string | null): string {
  if (page === 'reserve-planner') {
    if (reservePlannerId === RESERVE_PLANNER_CREATE_ROUTE) {
      return `#reserve-planner/${RESERVE_PLANNER_CREATE_ROUTE}`
    }
    if (reservePlannerId) {
      return `#reserve-planner/${reservePlannerId}`
    }
  }
  return `#${page}`
}

export function parseRoute(hash: string): AppRoute {
  const raw = hash.replace(/^#/, '').trim()
  if (!raw) return { page: 'committed-funds', reservePlannerId: null }

  const segments = raw.split('/').filter(Boolean)
  const pageSegment = segments[0] ?? 'committed-funds'
  let page = PAGE_IDS.has(pageSegment as PageId)
    ? (pageSegment as PageId)
    : LEGACY_HASH[pageSegment] ?? 'committed-funds'

  if (MUTED_APP_PAGES.has(page)) {
    page = LEGACY_HASH[page] ?? 'trends'
  }

  const reservePlannerId =
    page === 'reserve-planner' && segments[1] ? segments[1] : null

  return { page, reservePlannerId }
}

export function parsePageId(hash: string): PageId {
  return parseRoute(hash).page
}

export function navigateToRoute(page: PageId, reservePlannerId?: string | null) {
  const next = buildHash(page, reservePlannerId)
  if (window.location.hash !== next) {
    window.location.hash = next.slice(1)
  }
}

/** @deprecated Use navigateToRoute */
export function navigateToPage(pageId: PageId) {
  navigateToRoute(pageId)
}

export function getPageMeta(pageId: PageId) {
  return APP_PAGES.find((page) => page.id === pageId) ?? APP_PAGES[0]
}

export function isReservePlannerRoute(route: AppRoute): boolean {
  return route.page === 'reserve-planner'
}
