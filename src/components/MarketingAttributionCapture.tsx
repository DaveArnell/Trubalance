import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { captureMarketingAttributionOnVisit } from '../services/marketingAttribution'
import { trackAcquisitionVisitOncePerDay } from '../services/acquisitionTracking'

/**
 * First-party UTM capture + acquisition visit tracking (Marketing Funnel).
 * Does not load Meta Pixel — separate from advertising consent.
 *
 * Acquisition RPCs run on public routes only — not on every in-app navigation.
 */
export function MarketingAttributionCapture() {
  const location = useLocation()

  useEffect(() => {
    captureMarketingAttributionOnVisit()
    if (location.pathname.startsWith('/app')) return
    trackAcquisitionVisitOncePerDay()
  }, [location.pathname, location.search])

  return null
}
