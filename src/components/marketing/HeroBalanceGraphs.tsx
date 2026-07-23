import { HOME_HERO } from '../../content/homePage'

/**
 * Hero visual — bank balance vs Cash Prophet, explained in five seconds.
 */
export function HeroBalanceGraphs() {
  const { bank, prophet } = HOME_HERO.compare

  return (
    <div className="hero-graphs" aria-label="Bank balance versus Cash Prophet">
      <figure className="hero-graph-card hero-graph-card--bank">
        <p className="hero-graph-tag hero-graph-tag--bank">{bank.label}</p>
        <div className="hero-compare-block">
          <p className="hero-compare-label">{bank.showsLabel}</p>
          <p className="hero-compare-text">{bank.shows}</p>
        </div>
        <div className="hero-compare-block">
          <p className="hero-compare-label">{bank.gapLabel}</p>
          <ul className="hero-compare-list">
            {bank.gap.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </figure>

      <p className="hero-graph-vs" aria-hidden>
        vs
      </p>

      <figure className="hero-graph-card hero-graph-card--true">
        <p className="hero-graph-tag hero-graph-tag--true">{prophet.label}</p>
        <p className="hero-compare-lead">{prophet.body}</p>
        <p className="hero-compare-outcome">{prophet.outcome}</p>
      </figure>
    </div>
  )
}
