import { HOME_HERO } from '../../content/homePage'
import { HomeHeroDashboard } from './HomeHeroDashboard'
import { HomeHeroThoughtBubble } from './HomeHeroThoughtBubble'

/** Hero: finances in your head versus organised on the Cash Prophet dashboard. */
export function HomeHeroCompare() {
  return (
    <div
      className="home-hero-pair"
      aria-label="Without Cash Prophet, business finances live in your head. With Cash Prophet they are organised on the dashboard."
    >
      <figure className="home-hero-pair-col">
        <figcaption className="home-hero-pair-tag home-hero-pair-tag--warn">
          {HOME_HERO.withoutLabel}
        </figcaption>
        <div className="home-hero-visual home-hero-visual--mind">
          <HomeHeroThoughtBubble />
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
