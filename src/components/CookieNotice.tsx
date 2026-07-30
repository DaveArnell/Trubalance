import { useEffect, useState } from 'react'
import { CanonicalLink } from './CanonicalLink'

/** Bump when the notice wording changes so returning visitors see the update once. */
const CONSENT_KEY = 'cashprophet-cookies-notice-v3'

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
          We use cookies and similar storage to run Cash Prophet, keep you signed in, and understand
          how the site is used. See our{' '}
          <CanonicalLink to="/privacy#cookies">privacy policy</CanonicalLink> for details.
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
