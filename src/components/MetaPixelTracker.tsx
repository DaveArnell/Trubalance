import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import {
  COOKIE_CONSENT_CHANGED_EVENT,
  hasAdvertisingConsent,
  type CookieConsentChoice,
} from '../utils/cookieConsent'
import {
  loadMetaPixel,
  resetMetaRouteTracking,
  stopMetaPixelTracking,
  trackMetaRoute,
} from '../services/metaPixel'

/**
 * Loads Meta Pixel only after advertising consent, then tracks SPA route changes.
 */
export function MetaPixelTracker() {
  const location = useLocation()

  useEffect(() => {
    const onConsentChanged = (event: Event) => {
      const detail = (event as CustomEvent<CookieConsentChoice>).detail
      if (detail?.advertising) {
        resetMetaRouteTracking()
        loadMetaPixel()
        trackMetaRoute(location.pathname, location.search)
      } else {
        stopMetaPixelTracking()
      }
    }

    window.addEventListener(COOKIE_CONSENT_CHANGED_EVENT, onConsentChanged)
    return () => window.removeEventListener(COOKIE_CONSENT_CHANGED_EVENT, onConsentChanged)
  }, [location.pathname, location.search])

  useEffect(() => {
    if (!hasAdvertisingConsent()) return
    loadMetaPixel()
    trackMetaRoute(location.pathname, location.search)
  }, [location.pathname, location.search])

  return null
}
