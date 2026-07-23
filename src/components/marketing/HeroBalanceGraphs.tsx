import { HOME_HERO } from '../../content/homePage'

/**
 * Hero visual — bank balance (jagged, lump hits) vs Cash Prophet calm line.
 */

const BANK_DROPS = [
  { x: 96, y: 96, label: 'Payroll' },
  { x: 178, y: 88, label: 'VAT' },
  { x: 260, y: 82, label: 'Rent' },
  { x: 342, y: 90, label: 'Insurance' },
] as const

export function HeroBalanceGraphs() {
  const { bank, prophet } = HOME_HERO.graphs

  return (
    <div className="hero-graphs" aria-label="Bank balance versus Cash Prophet Available Balance">
      <figure className="hero-graph-card hero-graph-card--bank">
        <div className="hero-graph-header">
          <p className="hero-graph-tag hero-graph-tag--bank">{bank.tag}</p>
          <p className="hero-graph-title">{bank.title}</p>
        </div>
        <svg
          className="hero-graph-svg"
          viewBox="0 0 440 140"
          role="img"
          aria-label="Jagged bank balance line with sudden drops for payroll, VAT, rent and insurance"
        >
          <line x1="12" y1="118" x2="428" y2="118" className="hero-graph-axis" />
          <line x1="12" y1="82" x2="428" y2="82" className="hero-graph-gridline" />
          <line x1="12" y1="46" x2="428" y2="46" className="hero-graph-gridline" />

          <path
            className="hero-graph-line hero-graph-line--bank"
            d="M14 58
               L92 38 L96 88
               L174 46 L178 80
               L256 36 L260 74
               L338 40 L342 82
               L426 50"
          />

          {BANK_DROPS.map((drop) => (
            <g key={drop.label}>
              <circle cx={drop.x} cy={drop.y} r="5" className="hero-graph-drop-dot" />
              <text x={drop.x} y={drop.y + 22} className="hero-graph-drop-label" textAnchor="middle">
                {drop.label}
              </text>
            </g>
          ))}
        </svg>
        <p className="hero-graph-footnote hero-graph-footnote--bank">{bank.caption}</p>
      </figure>

      <p className="hero-graph-vs" aria-hidden>
        vs
      </p>

      <figure className="hero-graph-card hero-graph-card--true">
        <div className="hero-graph-header">
          <p className="hero-graph-tag hero-graph-tag--true">{prophet.tag}</p>
          <p className="hero-graph-title">{prophet.title}</p>
        </div>
        <svg
          className="hero-graph-svg"
          viewBox="0 0 440 120"
          role="img"
          aria-label="Smooth Cash Prophet line as commitments build into Available Balance"
        >
          <line x1="12" y1="98" x2="428" y2="98" className="hero-graph-axis" />
          <line x1="12" y1="64" x2="428" y2="64" className="hero-graph-gridline" />

          <path
            className="hero-graph-area"
            d="M14 68 C 110 62, 200 56, 290 50 S 400 42, 426 40 L426 98 L14 98 Z"
          />
          <path
            className="hero-graph-line hero-graph-line--true"
            d="M14 68 C 110 62, 200 56, 290 50 S 400 42, 426 40"
          />

          {[60, 120, 180, 240, 300, 360].map((x, i) => (
            <circle key={x} cx={x} cy={66 - i * 3.2} r="4" className="hero-graph-day-dot" />
          ))}
        </svg>
        <p className="hero-graph-footnote hero-graph-footnote--true">{prophet.caption}</p>
      </figure>
    </div>
  )
}
