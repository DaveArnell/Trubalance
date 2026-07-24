/**
 * Single source of truth for indexable marketing URLs (sitemap + audits).
 * Paths are root-absolute and must never include a trailing slash (except home `/`).
 */

export type IndexableRoute = {
  path: string
  priority: string
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
}

export const INDEXABLE_STATIC_ROUTES: readonly IndexableRoute[] = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/pricing', priority: '0.9', changefreq: 'monthly' },
  { path: '/how-it-works', priority: '0.9', changefreq: 'monthly' },
  { path: '/who-its-for', priority: '0.8', changefreq: 'monthly' },
  { path: '/see-how-it-works', priority: '0.9', changefreq: 'monthly' },
  { path: '/signup', priority: '0.9', changefreq: 'monthly' },
  { path: '/blog', priority: '0.9', changefreq: 'weekly' },
  { path: '/privacy', priority: '0.3', changefreq: 'yearly' },
  { path: '/terms', priority: '0.3', changefreq: 'yearly' },
] as const

/** Legacy paths that 301/redirect to a canonical indexable URL (not listed in sitemap). */
export const LEGACY_REDIRECTS: readonly { from: string; to: string }[] = [
  { from: '/habits', to: '/how-it-works#habits' },
  { from: '/cash-prophet', to: '/' },
  { from: '/true-balance-method', to: '/' },
] as const
