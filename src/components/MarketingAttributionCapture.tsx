import { useEffect } from 'react'
import { captureMarketingAttributionOnVisit } from '../services/marketingAttribution'

/** Captures campaign tags from the URL on first paint (marketing + auth pages). */
export function MarketingAttributionCapture() {
  useEffect(() => {
    captureMarketingAttributionOnVisit()
  }, [])
  return null
}
