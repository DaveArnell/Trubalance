/**
 * Hero visual — two stacked mini-charts telling the core story:
 * 1. Bank balance: jagged, with sudden drops when bills hit.
 * 2. True Balance: commitments build a little every day, so the line is smooth.
 */

const BANK_DROPS = [
  { x: 96, y: 96, label: 'Payroll' },
  { x: 178, y: 88, label: 'VAT' },
  { x: 260, y: 82, label: 'Rent' },
  { x: 342, y: 90, label: 'Insurance' },
] as const

export function HeroBalanceGraphs() {
  return (
    <div className="hero-graphs" aria-label="Bank balance swings versus a smooth True Balance">
      <figure className="hero-graph-card hero-graph-card--bank">
        <figcaption className="hero-graph-caption">
          <span className="hero-graph-label">Your bank balance</span>
          <span className="hero-graph-sub">Looks fine — until a bill lands</span>
        </figcaption>
        <svg
          className="hero-graph-svg"
          viewBox="0 0 440 150"
          role="img"
          aria-label="Jagged bank balance line with sudden drops for payroll, VAT, rent and insurance"
        >
          {/* baseline grid */}
          <line x1="12" y1="126" x2="428" y2="126" className="hero-graph-axis" />
          <line x1="12" y1="90" x2="428" y2="90" className="hero-graph-gridline" />
          <line x1="12" y1="54" x2="428" y2="54" className="hero-graph-gridline" />

          {/* jagged balance line: slow climbs, sharp vertical drops */}
          <path
            className="hero-graph-line hero-graph-line--bank"
            d="M14 66
               L92 46 L96 96
               L174 54 L178 88
               L256 44 L260 82
               L338 48 L342 90
               L426 58"
          />

          {BANK_DROPS.map((drop) => (
            <g key={drop.label}>
              <circle cx={drop.x} cy={drop.y} r="4" className="hero-graph-drop-dot" />
              <text x={drop.x} y={drop.y + 20} className="hero-graph-drop-label" textAnchor="middle">
                {drop.label}
              </text>
            </g>
          ))}

          <text x="330" y="26" className="hero-graph-scribble" textAnchor="middle">
            sudden hits ↓
          </text>
        </svg>
      </figure>

      <figure className="hero-graph-card hero-graph-card--true">
        <figcaption className="hero-graph-caption">
          <span className="hero-graph-label hero-graph-label--true">Your True Balance</span>
          <span className="hero-graph-sub">Bills build a little every day — no surprises</span>
        </figcaption>
        <svg
          className="hero-graph-svg"
          viewBox="0 0 440 130"
          role="img"
          aria-label="Smooth True Balance line, gently trending as commitments accrue daily"
        >
          <line x1="12" y1="106" x2="428" y2="106" className="hero-graph-axis" />
          <line x1="12" y1="72" x2="428" y2="72" className="hero-graph-gridline" />

          <path
            className="hero-graph-area"
            d="M14 76 C 110 70, 200 64, 290 58 S 400 50, 426 48 L426 106 L14 106 Z"
          />
          <path
            className="hero-graph-line hero-graph-line--true"
            d="M14 76 C 110 70, 200 64, 290 58 S 400 50, 426 48"
          />

          {/* per-day ticks along the smooth line */}
          {[60, 120, 180, 240, 300, 360].map((x, i) => (
            <circle
              key={x}
              cx={x}
              cy={74 - i * 3.2}
              r="3"
              className="hero-graph-day-dot"
            />
          ))}

          <text x="150" y="34" className="hero-graph-scribble hero-graph-scribble--true" textAnchor="middle">
            a little each day, already accounted for
          </text>
        </svg>
      </figure>
    </div>
  )
}
