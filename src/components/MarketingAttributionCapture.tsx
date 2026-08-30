import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import {
  COOKIE_CONSENT_CHANGED_EVENT,
  hasAdvertisingConsent,
} from '../utils/cookieConsent'
import { captureMarketingAttributionOnVisit } from '../services/marketingAttribution'
import { trackAcquisitionVisitOncePerDay } from '../services/acquisitionTracking'

/**
 * Optional first-party UTM capture + acquisition visit tracking.
 * Runs only after the visitor accepts analytics / advertising cookies.
 */
export function MarketingAttributionCapture() {
  const location = useLocation()

  useEffect(() => {
    const run = () => {
      if (!hasAdvertisingConsent()) return
      captureMarketingAttributionOnVisit()
      if (location.pathname.startsWith('/app')) return
      trackAcquisitionVisitOncePerDay()
    }

    run()
    window.addEventListener(COOKIE_CONSENT_CHANGED_EVENT, run)
    return () => window.removeEventListener(COOKIE_CONSENT_CHANGED_EVENT, run)
  }, [location.pathname, location.search])

  return null
}
