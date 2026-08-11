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
let lastRouteKey: string | null = null

function canTrack(): boolean {
  return (
    typeof window !== 'undefined' &&
    hasAdvertisingConsent() &&
    !!getGaMeasurementId() &&
    typeof window.gtag === 'function'
  )
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

  window.dataLayer = window.dataLayer ?? []
  if (!window.gtag) {
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer?.push(args)
    }
  }

  window.gtag('js', new Date())
  window.gtag('config', measurementId, { send_page_view: false })

  if (!scriptInjected) {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-cashprophet-ga4="1"]',
    )
    if (!existing) {
      const script = document.createElement('script')
      script.async = true
      script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`
      script.dataset.cashprophetGa4 = '1'
      const first = document.getElementsByTagName('script')[0]
      first?.parentNode?.insertBefore(script, first)
    }
    scriptInjected = true
  }
}

export function resetGaRouteTracking(): void {
  lastRouteKey = null
}

export function stopGoogleAnalyticsTracking(): void {
  lastRouteKey = null
}

/** Track an SPA route as a GA4 page_view. */
export function trackGaRoute(pathname: string, search = ''): void {
  if (!canTrack()) return
  const measurementId = getGaMeasurementId()
  if (!measurementId) return
  const pagePath = `${pathname}${search}`
  if (pagePath === lastRouteKey) return
  lastRouteKey = pagePath
  window.gtag?.('event', 'page_view', {
    page_path: pagePath,
    page_location: window.location.href,
    page_title: document.title,
    send_to: measurementId,
  })
}
