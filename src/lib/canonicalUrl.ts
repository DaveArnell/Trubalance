import { COMPANY_INFO } from '../content/companyInfo'

/** Canonical site origin — no trailing slash. */
export const SITE_ORIGIN = COMPANY_INFO.website.replace(/\/+$/, '')

/**
 * Strip trailing slashes from a pathname (keep a single `/` for home).
 */
export function stripTrailingSlash(pathname: string): string {
  if (!pathname || pathname === '/') return '/'
  return pathname.replace(/\/+$/, '') || '/'
}

/**
 * Normalize an in-app path or path+search+hash to a root-absolute form
 * with no trailing slash on the pathname (except home `/`).
 */
export function normalizeAppPath(path: string): string {
  const raw = path.trim()
  if (!raw) return '/'

  if (/^https?:\/\//i.test(raw)) {
    const url = new URL(raw)
    const pathname = stripTrailingSlash(url.pathname)
    return `${pathname}${url.search}${url.hash}`
  }

  const hashIndex = raw.indexOf('#')
  const hash = hashIndex >= 0 ? raw.slice(hashIndex) : ''
  const withoutHash = hashIndex >= 0 ? raw.slice(0, hashIndex) : raw
  const queryIndex = withoutHash.indexOf('?')
  const search = queryIndex >= 0 ? withoutHash.slice(queryIndex) : ''
  let pathname = queryIndex >= 0 ? withoutHash.slice(0, queryIndex) : withoutHash

  if (!pathname.startsWith('/')) pathname = `/${pathname}`
  pathname = stripTrailingSlash(pathname)

  return `${pathname}${search}${hash}`
}

/**
 * Full absolute canonical URL for sitemap, Open Graph, and visible hrefs.
 * Home is `https://host/` ; every other path has no trailing slash.
 */
export function canonicalUrl(path: string = '/'): string {
  const normalized = normalizeAppPath(path)
  if (normalized === '/') return `${SITE_ORIGIN}/`
  if (normalized.startsWith('/')) return `${SITE_ORIGIN}${normalized}`
  return `${SITE_ORIGIN}/${normalized}`
}

/** Pathname only (no search/hash), trailing-slash free. */
export function canonicalPathname(path: string): string {
  return stripTrailingSlash(normalizeAppPath(path).split(/[?#]/)[0] || '/')
}
