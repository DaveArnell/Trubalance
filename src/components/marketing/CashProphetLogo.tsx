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
 * Mark: foresight spark over a rising balance path — clarity looking ahead.
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
            <stop offset="0%" stopColor="#fff" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect width="40" height="40" rx="11" fill={`url(#${uid}-fill)`} />
        <rect width="40" height="40" rx="11" fill={`url(#${uid}-shine)`} />
        <path
          d="M9 27.5 L15.5 22.5 L21 25 L31 14"
          fill="none"
          stroke="#fff"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="31" cy="14" r="2.4" fill="#fff" />
        <path
          d="M31 8.2 V10.4 M31 17.6 V19.8 M25.2 14 H27.4 M34.6 14 H36.8"
          stroke="#fff"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.9"
        />
      </svg>
      <span className="cp-logo-word">
        <span className="cp-logo-cash">Cash</span>
        <span className="cp-logo-prophet">Prophet</span>
      </span>
    </span>
  )
}
