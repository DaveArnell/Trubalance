import { HOME_HERO } from '../../content/homePage'
import { HomeHeroDashboard } from './HomeHeroDashboard'

const MESSY_PAPER = '/hero-messy-paper.webp'

/** Hero: messy notes versus the real Cash Prophet dashboard, filling the card. */
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
        <div className="home-hero-visual home-hero-visual--paper">
          <img
            src={MESSY_PAPER}
            alt="Handwritten notes around a bank balance of £33,350, asking how much is actually left today"
            width={995}
            height={1374}
            decoding="async"
            fetchPriority="high"
          />
        </div>
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
        <div className="home-hero-visual home-hero-visual--dash">
          <HomeHeroDashboard />
        </div>
      </figure>
    </div>
  )
}
