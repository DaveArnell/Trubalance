import { useId } from 'react'

type CashProphetLogoProps = {
  /** Visual size / placement */
  variant?: 'header' | 'hero' | 'footer'
  /** Light wordmark for dark backgrounds (homepage hero) */
  onDark?: boolean
  className?: string
}

/**
 * Cash Prophet wordmark + mark for marketing chrome.
 * Mark: three calm accruing bars — known costs building, not a stock chart.
 */
export function CashProphetLogo({
  variant = 'header',
  onDark = false,
  className = '',
}: CashProphetLogoProps) {
  const uid = useId().replace(/:/g, '')

  return (
    <span
      className={`cp-logo cp-logo--${variant}${onDark ? ' cp-logo--on-dark' : ''}${
        className ? ` ${className}` : ''
      }`}
    >
      <svg className="cp-logo-mark" viewBox="0 0 40 40" aria-hidden focusable="false">
        <defs>
          <linearGradient id={`${uid}-fill`} x1="8%" y1="12%" x2="92%" y2="88%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="55%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>
          <linearGradient id={`${uid}-shine`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect width="40" height="40" rx="11" fill={`url(#${uid}-fill)`} />
        <rect width="40" height="40" rx="11" fill={`url(#${uid}-shine)`} />
        {/* Soft tracks */}
        <rect x="8" y="10" width="24" height="5.5" rx="2.75" fill="#fff" opacity="0.22" />
        <rect x="8" y="17.25" width="24" height="5.5" rx="2.75" fill="#fff" opacity="0.22" />
        <rect x="8" y="24.5" width="24" height="5.5" rx="2.75" fill="#fff" opacity="0.22" />
        {/* Accruing fills — different stages of building */}
        <rect x="8" y="10" width="20" height="5.5" rx="2.75" fill="#fff" />
        <rect x="8" y="17.25" width="14" height="5.5" rx="2.75" fill="#fff" opacity="0.92" />
        <rect x="8" y="24.5" width="8" height="5.5" rx="2.75" fill="#fff" opacity="0.85" />
      </svg>
      <span className="cp-logo-word">
        <span className="cp-logo-cash">Cash</span>
        <span className="cp-logo-prophet">Prophet</span>
      </span>
    </span>
  )
}
