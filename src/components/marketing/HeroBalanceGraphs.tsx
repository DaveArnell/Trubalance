import { HOME_HERO } from '../../content/homePage'

/**
 * Hero visual — bank balance (jagged, lump hits) vs Cash Prophet calm line.
 * Dots are placed on the same coordinates as the path vertices.
 */

type Pt = { x: number; y: number }

const BANK_POINTS: Pt[] = [
  { x: 14, y: 58 },
  { x: 92, y: 38 },
  { x: 96, y: 88 },
  { x: 174, y: 46 },
  { x: 178, y: 80 },
  { x: 256, y: 36 },
  { x: 260, y: 74 },
  { x: 338, y: 40 },
  { x: 342, y: 82 },
  { x: 426, y: 50 },
]

const BANK_DROPS = [
  { x: 96, y: 88, label: 'Payroll' },
  { x: 178, y: 80, label: 'VAT' },
  { x: 260, y: 74, label: 'Rent' },
  { x: 342, y: 82, label: 'Insurance' },
] as const

/** Gentle downward Available line — dots sit on these exact points. */
const PROPHET_POINTS: Pt[] = [
  { x: 14, y: 68 },
  { x: 60, y: 64 },
  { x: 120, y: 58 },
  { x: 180, y: 53 },
  { x: 240, y: 48 },
  { x: 300, y: 44 },
  { x: 360, y: 41 },
  { x: 426, y: 38 },
]

function polylinePath(points: Pt[]): string {
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x} ${p.y}`).join(' ')
}

/** Smooth cubic through consecutive points (dots still land on the vertices). */
function smoothPath(points: Pt[]): string {
  if (points.length < 2) return ''
  let d = `M${points[0].x} ${points[0].y}`
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i]
    const b = points[i + 1]
    const mx = (a.x + b.x) / 2
    d += ` C${mx} ${a.y}, ${mx} ${b.y}, ${b.x} ${b.y}`
  }
  return d
}

function areaUnder(points: Pt[], baselineY: number): string {
  const last = points[points.length - 1]
  const first = points[0]
  return `${smoothPath(points)} L${last.x} ${baselineY} L${first.x} ${baselineY} Z`
}

export function HeroBalanceGraphs() {
  const { bank, prophet } = HOME_HERO.graphs
  const bankPath = polylinePath(BANK_POINTS)
  const prophetPath = smoothPath(PROPHET_POINTS)
  const prophetArea = areaUnder(PROPHET_POINTS, 98)

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

          <path className="hero-graph-line hero-graph-line--bank" d={bankPath} />

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

          <path className="hero-graph-area" d={prophetArea} />
          <path className="hero-graph-line hero-graph-line--true" d={prophetPath} />

          {PROPHET_POINTS.slice(1, -1).map((p) => (
            <circle key={`${p.x}-${p.y}`} cx={p.x} cy={p.y} r="4" className="hero-graph-day-dot" />
          ))}
        </svg>
        <p className="hero-graph-footnote hero-graph-footnote--true">{prophet.caption}</p>
      </figure>
    </div>
  )
}
