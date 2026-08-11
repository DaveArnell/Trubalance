import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import {
  COOKIE_CONSENT_CHANGED_EVENT,
  hasAdvertisingConsent,
  type CookieConsentChoice,
} from '../utils/cookieConsent'
import {
  getGaMeasurementId,
  loadGoogleAnalytics,
  resetGaRouteTracking,
  stopGoogleAnalyticsTracking,
  trackGaRoute,
} from '../services/googleAnalytics'

/**
 * Loads GA4 only after cookie accept, then tracks SPA route changes.
 * No-op until VITE_GA_MEASUREMENT_ID is set (G-XXXXXXXX).
 */
export function GoogleAnalyticsTracker() {
  const location = useLocation()
  const configured = !!getGaMeasurementId()

  useEffect(() => {
    if (!configured) return

    const onConsentChanged = (event: Event) => {
      const detail = (event as CustomEvent<CookieConsentChoice>).detail
      if (detail?.advertising) {
        resetGaRouteTracking()
        loadGoogleAnalytics()
        trackGaRoute(location.pathname, location.search)
      } else {
        stopGoogleAnalyticsTracking()
      }
    }

    window.addEventListener(COOKIE_CONSENT_CHANGED_EVENT, onConsentChanged)
    return () => window.removeEventListener(COOKIE_CONSENT_CHANGED_EVENT, onConsentChanged)
  }, [configured, location.pathname, location.search])

  useEffect(() => {
    if (!configured || !hasAdvertisingConsent()) return
    loadGoogleAnalytics()
    trackGaRoute(location.pathname, location.search)
  }, [configured, location.pathname, location.search])

  return null
}
