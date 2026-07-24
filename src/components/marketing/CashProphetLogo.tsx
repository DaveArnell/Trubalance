import { LOGO_MARK_ALT } from './MarketingPicture'

type CashProphetLogoProps = {
  /** Visual size / placement */
  variant?: 'header' | 'hero' | 'footer'
  /** Light wordmark for dark backgrounds (homepage hero) */
  onDark?: boolean
  className?: string
}

/**
 * Cash Prophet wordmark + mark for marketing chrome.
 * Mark is a WebP image (PNG fallback) so crawlers can index a real image with alt text.
 */
export function CashProphetLogo({
  variant = 'header',
  onDark = false,
  className = '',
}: CashProphetLogoProps) {
  return (
    <span
      className={`cp-logo cp-logo--${variant}${onDark ? ' cp-logo--on-dark' : ''}${
        className ? ` ${className}` : ''
      }`}
    >
      <picture className="cp-logo-picture">
        <source srcSet="/logo-mark.webp" type="image/webp" />
        <img
          className="cp-logo-mark"
          src="/icon-192.png"
          width={40}
          height={40}
          alt={LOGO_MARK_ALT}
          decoding="async"
          fetchPriority={variant === 'hero' ? 'high' : 'auto'}
        />
      </picture>
      <span className="cp-logo-word">
        <span className="cp-logo-cash">Cash</span>
        <span className="cp-logo-prophet">Prophet</span>
      </span>
    </span>
  )
}
