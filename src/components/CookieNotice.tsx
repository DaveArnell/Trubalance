import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { CanonicalLink } from './CanonicalLink'
import {
  acceptAdvertisingCookies,
  COOKIE_CONSENT_OPEN_EVENT,
  getCookieConsentState,
  rejectAdvertisingCookies,
  type CookieConsentState,
} from '../utils/cookieConsent'
import { resetMetaRouteTracking, stopMetaPixelTracking } from '../services/metaPixel'
import {
  loadGoogleAnalytics,
  resetGaRouteTracking,
  stopGoogleAnalyticsTracking,
  trackGaRoute,
} from '../services/googleAnalytics'
import { captureMarketingAttributionOnVisit } from '../services/marketingAttribution'
import { trackAcquisitionVisitOncePerDay } from '../services/acquisitionTracking'

function readInitialConsentState(): CookieConsentState {
  if (typeof window === 'undefined') return 'unknown'
  return getCookieConsentState()
}

export function CookieNotice() {
  const [consentState, setConsentState] = useState<CookieConsentState>(() => readInitialConsentState())
  const [bannerOpen, setBannerOpen] = useState(() => readInitialConsentState() === 'unknown')

  useEffect(() => {
    // Re-sync after mount (covers private-mode storage quirks / late availability).
    const state = getCookieConsentState()
    setConsentState(state)
    if (state === 'unknown') setBannerOpen(true)

    const onOpen = () => setBannerOpen(true)
    window.addEventListener(COOKIE_CONSENT_OPEN_EVENT, onOpen)
    return () => window.removeEventListener(COOKIE_CONSENT_OPEN_EVENT, onOpen)
  }, [])

  const handleAccept = () => {
    acceptAdvertisingCookies()
    resetMetaRouteTracking()
    resetGaRouteTracking()
    loadGoogleAnalytics()
    trackGaRoute(window.location.pathname, window.location.search)
    captureMarketingAttributionOnVisit()
    if (!window.location.pathname.startsWith('/app')) {
      trackAcquisitionVisitOncePerDay()
    }
    setConsentState('accepted')
    setBannerOpen(false)
  }

  const handleReject = () => {
    rejectAdvertisingCookies()
    stopMetaPixelTracking()
    stopGoogleAnalyticsTracking()
    setConsentState('rejected')
    setBannerOpen(false)
  }

  if (!bannerOpen || typeof document === 'undefined') return null

  const isChanging = consentState !== 'unknown'

  return createPortal(
    <div
      className="cookie-notice"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookie-notice-title"
      aria-describedby="cookie-notice-desc"
    >
      <div className="cookie-notice-inner">
        <div className="cookie-notice-copy">
          <p id="cookie-notice-title" className="cookie-notice-heading">
            {isChanging ? 'Cookie preferences' : 'Cookies and advertising'}
          </p>
          <p id="cookie-notice-desc">
            We use necessary cookies and similar storage to run Cash Prophet and keep you signed in.
            With your permission we also use analytics (Google Analytics), Meta (Facebook/Instagram)
            advertising cookies, and first-party campaign tags to measure ads and website visits. We
            do not send your business balances or financial figures to Google or Meta.{' '}
            <CanonicalLink to="/privacy#cookies">Privacy policy</CanonicalLink>
            {' · '}
            <button type="button" className="cookie-notice-text-btn" onClick={handleReject}>
              Necessary only
            </button>
          </p>
        </div>
        <div className="cookie-notice-actions">
          <button type="button" className="btn-ghost cookie-notice-btn" onClick={handleReject}>
            Reject
          </button>
          <button type="button" className="btn-primary cookie-notice-btn" onClick={handleAccept}>
            Accept
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
