import {
  PRODUCT_DASHBOARD_IMAGE,
  PRODUCT_DASHBOARD_IMAGE_ALT,
  PRODUCT_DASHBOARD_IMAGE_HEIGHT,
  PRODUCT_DASHBOARD_IMAGE_WIDTH,
} from '../../content/marketingSeo'
import { HomeHeroThoughtBubble } from './HomeHeroThoughtBubble'

/** Hero stack: thought bubble → product dashboard. Sits beside copy on desktop. */
export function HomeHeroCompare() {
  return (
    <div
      className="home-hero-stack"
      aria-label="Business finances in your head, then organised on the Cash Prophet dashboard."
    >
      <div className="home-hero-stack-item">
        <div className="home-hero-visual home-hero-visual--mind">
          <HomeHeroThoughtBubble />
        </div>
      </div>

      <div className="home-hero-stack-arrow" aria-hidden>
        <svg viewBox="0 0 36 72" width="22" height="26">
          <path
            d="M18 4v52M8 46l10 14 10-14"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div className="home-hero-stack-item">
        <div className="home-hero-visual home-hero-visual--dash">
          <img
            className="home-hero-dash-photo"
            src={PRODUCT_DASHBOARD_IMAGE}
            alt={PRODUCT_DASHBOARD_IMAGE_ALT}
            width={PRODUCT_DASHBOARD_IMAGE_WIDTH}
            height={PRODUCT_DASHBOARD_IMAGE_HEIGHT}
            decoding="async"
            fetchPriority="high"
          />
        </div>
      </div>
    </div>
  )
}
