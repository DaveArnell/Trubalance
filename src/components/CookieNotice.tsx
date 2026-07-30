import { useEffect, useState } from 'react'
import { CanonicalLink } from './CanonicalLink'

/** Bump when the notice wording changes so returning visitors see the update once. */
const CONSENT_KEY = 'cashprophet-cookies-notice-v2'

function hasAcceptedNotice(): boolean {
  try {
    return localStorage.getItem(CONSENT_KEY) === '1'
  } catch {
    return false
  }
}

function acceptNotice(): void {
  try {
    localStorage.setItem(CONSENT_KEY, '1')
  } catch {
    /* ignore */
  }
}

export function CookieNotice() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(!hasAcceptedNotice())
  }, [])

  if (!visible) return null

  return (
    <div className="cookie-notice" role="dialog" aria-labelledby="cookie-notice-title">
      <div className="cookie-notice-inner">
        <p id="cookie-notice-title">
          <strong>Cookies and local storage.</strong> Cash Prophet uses necessary storage to keep you
          signed in and remember preferences. If you arrive from an ad or campaign link, we also
          remember a first-party tag on this device (for up to 90 days) so we can tell which campaigns
          lead to signups — we do not use advertising pixels or third-party analytics cookies.{' '}
          <CanonicalLink to="/privacy#cookies">Privacy policy</CanonicalLink>
        </p>
        <button
          type="button"
          className="btn-primary btn-tiny"
          onClick={() => {
            acceptNotice()
            setVisible(false)
          }}
        >
          OK
        </button>
      </div>
    </div>
  )
}
