import {
  PRODUCT_DASHBOARD_IMAGE,
  PRODUCT_DASHBOARD_IMAGE_ALT,
  PRODUCT_DASHBOARD_IMAGE_HEIGHT,
  PRODUCT_DASHBOARD_IMAGE_WIDTH,
} from '../../content/marketingSeo'
import { HOME_HERO } from '../../content/homePage'

/** Hero: messy mental notes versus the real Cash Prophet dashboard screen. */
export function HomeHeroCompare() {
  return (
    <div
      className="home-hero-pair"
      aria-label="Without Cash Prophet the bank balance lives in messy notes. With Cash Prophet those commitments sit on the dashboard."
    >
      <figure className="home-hero-pair-col">
        <figcaption className="home-hero-pair-tag home-hero-pair-tag--warn">
          {HOME_HERO.withoutLabel}
        </figcaption>
        <MessyNotebook />
      </figure>

      <div className="home-hero-pair-arrow" aria-hidden>
        <svg viewBox="0 0 72 36" width="72" height="36">
          <path
            d="M4 18h52M44 6l20 12-20 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <figure className="home-hero-pair-col home-hero-pair-col--dash">
        <figcaption className="home-hero-pair-tag home-hero-pair-tag--ok">
          {HOME_HERO.withLabel}
        </figcaption>
        <div className="home-hero-dash">
          <img
            src={PRODUCT_DASHBOARD_IMAGE}
            alt={PRODUCT_DASHBOARD_IMAGE_ALT}
            width={PRODUCT_DASHBOARD_IMAGE_WIDTH}
            height={PRODUCT_DASHBOARD_IMAGE_HEIGHT}
            decoding="async"
            fetchPriority="high"
          />
        </div>
      </figure>
    </div>
  )
}

function MessyNotebook() {
  return (
    <div className="home-messy">
      <div className="home-messy-sheet">
        <svg className="home-messy-arrows" viewBox="0 0 320 400" aria-hidden>
          <path d="M160 118 L72 64" />
          <path d="M168 118 L248 58" />
          <path d="M150 150 L58 200" />
          <path d="M176 148 L268 188" />
          <path d="M148 168 L70 268" />
          <path d="M178 168 L262 262" />
        </svg>

        <p className="home-messy-item home-messy-item--rent">
          Rent
          <span>£3,000 · 1st</span>
        </p>
        <p className="home-messy-item home-messy-item--wages">
          Wages
          <span>£9,000 · 28th</span>
        </p>
        <p className="home-messy-item home-messy-item--utils">
          Utilities
          <span>£650? 20th?</span>
        </p>
        <p className="home-messy-item home-messy-item--vat">VAT?</p>
        <p className="home-messy-item home-messy-item--ins">
          Insurance
          <span>£2,400 yearly</span>
        </p>
        <p className="home-messy-item home-messy-item--other">
          Other bills?
          <span>How much?</span>
        </p>

        <p className="home-messy-hub">
          <span>Bank balance</span>
          <strong>£18,400</strong>
        </p>

        <p className="home-messy-q">So how much do I actually have today?</p>
      </div>
    </div>
  )
}
