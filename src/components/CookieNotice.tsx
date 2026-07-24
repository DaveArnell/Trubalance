import { useEffect, useState } from 'react'
import { CanonicalLink } from './CanonicalLink'

const CONSENT_KEY = 'trubalance-essential-cookies-notice'

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
          <strong>Essential cookies only.</strong> Cash Prophet uses strictly necessary storage to
          keep you signed in and remember your preferences. We do not use advertising or third-party
          analytics cookies.{' '}
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
