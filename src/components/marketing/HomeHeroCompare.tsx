import { HomeHeroDashboard } from './HomeHeroDashboard'
import { HomeHeroThoughtBubble } from './HomeHeroThoughtBubble'

/** Hero stack: thought bubble → dashboard. Sits beside copy on desktop. */
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
        <svg viewBox="0 0 36 72" width="28" height="36">
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
          <HomeHeroDashboard />
        </div>
      </div>
    </div>
  )
}
