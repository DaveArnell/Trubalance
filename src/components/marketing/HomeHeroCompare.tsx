import { HOME_HERO } from '../../content/homePage'
import { HomeHeroDashboard } from './HomeHeroDashboard'
import { HomeHeroThoughtBubble } from './HomeHeroThoughtBubble'

/** Hero stack: without (in your head) → with (dashboard). Sits beside copy on desktop. */
export function HomeHeroCompare() {
  return (
    <div
      className="home-hero-stack"
      aria-label="Without Cash Prophet, business finances live in your head. With Cash Prophet they are organised on the dashboard."
    >
      <figure className="home-hero-stack-item">
        <figcaption className="home-hero-pair-tag home-hero-pair-tag--warn">
          {HOME_HERO.withoutLabel}
        </figcaption>
        <div className="home-hero-visual home-hero-visual--mind">
          <HomeHeroThoughtBubble />
        </div>
      </figure>

      <div className="home-hero-stack-arrow" aria-hidden>
        <svg viewBox="0 0 36 72" width="36" height="48">
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

      <figure className="home-hero-stack-item">
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
