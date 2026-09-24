/**
 * Single source of truth for indexable marketing URLs (sitemap + audits).
 * Private personal app: no public marketing URLs are indexed.
 */

export type IndexableRoute = {
  path: string
  priority: string
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
}

/** Empty while Cash Prophet is a private personal tool. */
export const INDEXABLE_STATIC_ROUTES: readonly IndexableRoute[] = [] as const

/** Legacy paths — kept for reference; all marketing routes redirect to /login in the router. */
export const LEGACY_REDIRECTS: readonly { from: string; to: string }[] = [
  { from: '/habits', to: '/login' },
  { from: '/cash-prophet', to: '/login' },
  { from: '/true-balance-method', to: '/login' },
  { from: '/cafes-coffee-shops', to: '/login' },
  { from: '/cafe', to: '/login' },
  { from: '/cafes', to: '/login' },
] as const
