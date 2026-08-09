import { hasAdvertisingConsent } from '../utils/cookieConsent'

/** Meta Pixel / Dataset ID from Events Manager. */
export const META_PIXEL_ID = '4528453927433140'

type FbqCommand = (...args: unknown[]) => void

type FbqQueue = FbqCommand & {
  callMethod?: (...args: unknown[]) => void
  queue?: unknown[][]
  push?: FbqCommand
  loaded?: boolean
  version?: string
}

declare global {
  interface Window {
    fbq?: FbqQueue
    _fbq?: FbqQueue
  }
}

let scriptInjected = false
let lastRouteKey: string | null = null

function canTrack(): boolean {
  return typeof window !== 'undefined' && hasAdvertisingConsent() && typeof window.fbq === 'function'
}

/**
 * Inject Meta's fbevents.js and init the Pixel.
 * Does not fire PageView — callers track routes explicitly for SPA support.
 */
export function loadMetaPixel(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return
  if (!hasAdvertisingConsent()) return

  if (!window.fbq) {
    const n = function (...args: unknown[]) {
      const fbq = n as FbqQueue
      if (fbq.callMethod) {
        fbq.callMethod(...args)
      } else {
        fbq.queue = fbq.queue ?? []
        fbq.queue.push(args)
      }
    } as FbqQueue
    n.push = n
    n.loaded = true
    n.version = '2.0'
    n.queue = []
    window.fbq = n
    if (!window._fbq) window._fbq = n
  }

  if (!scriptInjected) {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-cashprophet-meta-pixel="1"]',
    )
    if (!existing) {
      const script = document.createElement('script')
      script.async = true
      script.src = 'https://connect.facebook.net/en_US/fbevents.js'
      script.dataset.cashprophetMetaPixel = '1'
      const first = document.getElementsByTagName('script')[0]
      first?.parentNode?.insertBefore(script, first)
    }
    scriptInjected = true
    window.fbq?.('init', META_PIXEL_ID)
  }
}

/** Best-effort clear of common Meta first-party cookies after withdraw/reject. */
export function clearMetaPixelCookies(): void {
  if (typeof document === 'undefined') return
  const names = ['_fbp', '_fbc']
  const domains = [
    '',
    `domain=${window.location.hostname}`,
    `domain=.${window.location.hostname.replace(/^www\./, '')}`,
  ]
  for (const name of names) {
    for (const domain of domains) {
      const domainPart = domain ? `; ${domain}` : ''
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${domainPart}`
    }
  }
  lastRouteKey = null
}

export function stopMetaPixelTracking(): void {
  clearMetaPixelCookies()
}

function normalizePath(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith('/')) return pathname.slice(0, -1)
  return pathname || '/'
}

/**
 * Track a SPA route. Fires PageView, plus ViewContent on /pricing.
 * Never sends balances, commitments, or other financial figures.
 */
export function trackMetaRoute(pathname: string, search = ''): void {
  if (!canTrack()) return
  loadMetaPixel()
  if (!canTrack()) return

  const path = normalizePath(pathname)
  const routeKey = `${path}${search}`
  if (routeKey === lastRouteKey) return
  lastRouteKey = routeKey

  window.fbq?.('track', 'PageView')

  if (path === '/pricing') {
    window.fbq?.('track', 'ViewContent', {
      content_name: 'Pricing',
      content_category: 'marketing',
      content_type: 'product',
    })
  }
}

/** Allow the next navigation (or same path after re-consent) to fire again. */
export function resetMetaRouteTracking(): void {
  lastRouteKey = null
}
