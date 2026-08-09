import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { captureMarketingAttributionOnVisit } from '../services/marketingAttribution'
import { trackAcquisitionVisitOncePerDay } from '../services/acquisitionTracking'

/**
 * First-party UTM capture + acquisition visit tracking (Marketing Funnel).
 * Does not load Meta Pixel — separate from advertising consent.
 */
export function MarketingAttributionCapture() {
  const location = useLocation()

  useEffect(() => {
    captureMarketingAttributionOnVisit()
    trackAcquisitionVisitOncePerDay()
  }, [location.pathname, location.search])

  return null
}
