import { hasAdvertisingConsent } from '../utils/cookieConsent'

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

/** GA4 measurement ID from Admin → Data streams (format G-XXXXXXXX). */
export function getGaMeasurementId(): string | null {
  const id = import.meta.env.VITE_GA_MEASUREMENT_ID
  if (typeof id !== 'string') return null
  const trimmed = id.trim()
  return /^G-[A-Z0-9]+$/i.test(trimmed) ? trimmed : null
}

let scriptInjected = false
let scriptLoaded = false
let lastRouteKey: string | null = null
let pendingPagePath: string | null = null

function canTrack(): boolean {
  return (
    typeof window !== 'undefined' &&
    hasAdvertisingConsent() &&
    !!getGaMeasurementId() &&
    typeof window.gtag === 'function'
  )
}

/** Google’s snippet uses `dataLayer.push(arguments)` — a real Array breaks the queue. */
function ensureGtagStub(): void {
  window.dataLayer = window.dataLayer ?? []
  if (typeof window.gtag === 'function' && scriptLoaded) return
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments)
  }
}

function configureAndFlush(): void {
  const measurementId = getGaMeasurementId()
  if (!measurementId || !hasAdvertisingConsent()) return
  ensureGtagStub()
  window.gtag?.('js', new Date())
  window.gtag?.('config', measurementId, { send_page_view: false })
  if (pendingPagePath) {
    const path = pendingPagePath
    pendingPagePath = null
    lastRouteKey = null
    const queryAt = path.indexOf('?')
    if (queryAt >= 0) {
      trackGaRoute(path.slice(0, queryAt), path.slice(queryAt))
    } else {
      trackGaRoute(path, '')
    }
  }
}

/**
 * Inject gtag.js after analytics/advertising consent.
 * Does not send a default page_view — SPA routes are tracked explicitly.
 */
export function loadGoogleAnalytics(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return
  if (!hasAdvertisingConsent()) return
  const measurementId = getGaMeasurementId()
  if (!measurementId) return

  ensureGtagStub()

  if (scriptLoaded) {
    configureAndFlush()
    return
  }

  if (!scriptInjected) {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-cashprophet-ga4="1"]',
    )
    if (existing) {
      scriptInjected = true
      if (existing.dataset.loaded === '1') {
        scriptLoaded = true
        configureAndFlush()
      } else {
        existing.addEventListener('load', () => {
          scriptLoaded = true
          existing.dataset.loaded = '1'
          configureAndFlush()
        })
      }
      return
    }

    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`
    script.dataset.cashprophetGa4 = '1'
    script.addEventListener('load', () => {
      scriptLoaded = true
      script.dataset.loaded = '1'
      configureAndFlush()
    })
    const first = document.getElementsByTagName('script')[0]
    first?.parentNode?.insertBefore(script, first)
    scriptInjected = true
  }
}

export function resetGaRouteTracking(): void {
  lastRouteKey = null
  pendingPagePath = null
}

export function stopGoogleAnalyticsTracking(): void {
  lastRouteKey = null
  pendingPagePath = null
}

/** Track an SPA route as a GA4 page_view. */
export function trackGaRoute(pathname: string, search = ''): void {
  if (!hasAdvertisingConsent() || !getGaMeasurementId()) return
  const pagePath = `${pathname}${search}`
  if (!scriptLoaded) {
    pendingPagePath = pagePath
    loadGoogleAnalytics()
    return
  }
  if (!canTrack()) return
  if (pagePath === lastRouteKey) return
  lastRouteKey = pagePath
  const measurementId = getGaMeasurementId()!
  window.gtag?.('event', 'page_view', {
    page_path: pagePath,
    page_location: `${window.location.origin}${pagePath}`,
    page_title: document.title,
    send_to: measurementId,
  })
}
