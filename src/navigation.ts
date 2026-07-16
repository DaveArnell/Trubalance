export const APP_PAGES = [
  { id: 'committed-funds', label: 'Dashboard', kicker: 'Overview', icon: '⊞' },
  { id: 'trends', label: 'Trends', kicker: 'Charts & history', icon: '↗' },
  { id: 'forecast', label: 'Forecast', kicker: 'Forward look', icon: '⇢' },
  { id: 'history', label: 'History', kicker: 'Saved days', icon: '◷' },
  { id: 'reserve-planner', label: 'Reserve Planner', kicker: 'Irregular bills', icon: '◎' },
  { id: 'settings', label: 'Settings', kicker: 'Organisation', icon: '⚙' },
] as const

export type PageId = (typeof APP_PAGES)[number]['id']

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
  'expected-receipts': 'committed-funds',
  admin: 'committed-funds',
  'business-hub': 'committed-funds',
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
  const page = PAGE_IDS.has(pageSegment as PageId)
    ? (pageSegment as PageId)
    : LEGACY_HASH[pageSegment] ?? 'committed-funds'

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
