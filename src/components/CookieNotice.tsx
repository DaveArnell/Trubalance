import { useEffect, useState } from 'react'
import { CanonicalLink } from './CanonicalLink'
import {
  acceptAdvertisingCookies,
  COOKIE_CONSENT_OPEN_EVENT,
  getCookieConsentState,
  rejectAdvertisingCookies,
  type CookieConsentState,
} from '../utils/cookieConsent'
import { resetMetaRouteTracking, stopMetaPixelTracking } from '../services/metaPixel'

export function CookieNotice() {
  const [consentState, setConsentState] = useState<CookieConsentState>('unknown')
  const [bannerOpen, setBannerOpen] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const state = getCookieConsentState()
    setConsentState(state)
    setBannerOpen(state === 'unknown')
    setReady(true)

    const onOpen = () => setBannerOpen(true)
    window.addEventListener(COOKIE_CONSENT_OPEN_EVENT, onOpen)
    return () => window.removeEventListener(COOKIE_CONSENT_OPEN_EVENT, onOpen)
  }, [])

  const handleAccept = () => {
    acceptAdvertisingCookies()
    resetMetaRouteTracking()
    setConsentState('accepted')
    setBannerOpen(false)
  }

  const handleReject = () => {
    rejectAdvertisingCookies()
    stopMetaPixelTracking()
    setConsentState('rejected')
    setBannerOpen(false)
  }

  if (!ready || !bannerOpen) return null

  const isChanging = consentState !== 'unknown'

  return (
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
            With your permission we also use Meta (Facebook/Instagram) advertising cookies to measure
            ads and understand website visits. We do not send your business balances or financial
            figures to Meta.{' '}
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
    </div>
  )
}
