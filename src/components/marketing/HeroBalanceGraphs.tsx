import { useMorphCycle, lerp } from './useMorphCycle'

/**
 * Hero visuals: two synced line graphs (not versus).
 * 1) Payment forecast: bill spikes → even daily build
 * 2) Balance: bank drops → Available Balance calm line
 */

type Pt = { x: number; y: number }

const W = 440
const H = 120
const N = 24

function sampleX(i: number) {
  return 14 + (i / (N - 1)) * 412
}

/** Spike y values (higher y = lower on chart in SVG). */
const PAYMENT_SPIKE_Y = Array.from({ length: N }, (_, i) => {
  const spikes: Record<number, number> = {
    3: 28,
    7: 18,
    11: 48,
    14: 22,
    18: 40,
    21: 14,
  }
  return spikes[i] ?? 88
})

const PAYMENT_EVEN_Y = Array.from({ length: N }, () => 62)

/** Bank balance: high line with sudden drops (high y = lower balance). */
const BANK_Y = Array.from({ length: N }, (_, i) => {
  const base = 36
  // Drop windows
  if (i === 4 || i === 5) return 86
  if (i === 10 || i === 11) return 78
  if (i === 16 || i === 17) return 82
  if (i === 21 || i === 22) return 90
  return base + (i % 3) * 2
})

const AVAILABLE_Y = Array.from({ length: N }, (_, i) => 58 + i * 0.55)

function pointsFromYs(ys: number[]): Pt[] {
  return ys.map((y, i) => ({ x: sampleX(i), y }))
}

function smoothPath(points: Pt[]): string {
  if (points.length < 2) return ''
  let d = `M${points[0].x} ${points[0].y}`
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i]!
    const b = points[i + 1]!
    const mx = (a.x + b.x) / 2
    d += ` C${mx} ${a.y}, ${mx} ${b.y}, ${b.x} ${b.y}`
  }
  return d
}

function areaUnder(points: Pt[], baselineY: number): string {
  const last = points[points.length - 1]!
  const first = points[0]!
  return `${smoothPath(points)} L${last.x} ${baselineY} L${first.x} ${baselineY} Z`
}

function morphYs(from: number[], to: number[], t: number): number[] {
  return from.map((y, i) => lerp(y, to[i]!, t))
}

function LineChart({
  ys,
  tone,
  showArea,
}: {
  ys: number[]
  tone: 'red' | 'green'
  showArea?: boolean
}) {
  const points = pointsFromYs(ys)
  const path = smoothPath(points)
  const area = areaUnder(points, 108)
  return (
    <svg className="hero-graph-svg" viewBox={`0 0 ${W} ${H}`} aria-hidden>
      <line x1="12" y1="108" x2="428" y2="108" className="hero-graph-axis" />
      <line x1="12" y1="72" x2="428" y2="72" className="hero-graph-gridline" />
      <line x1="12" y1="40" x2="428" y2="40" className="hero-graph-gridline" />
      {showArea ? (
        <path
          className={tone === 'green' ? 'hero-graph-area' : 'hero-graph-area hero-graph-area--muted'}
          d={area}
          opacity={tone === 'green' ? 1 : 0.15}
        />
      ) : null}
      <path
        className={`hero-graph-line ${tone === 'green' ? 'hero-graph-line--true' : 'hero-graph-line--bank'}`}
        d={path}
      />
      {points
        .filter((_, i) => i % 3 === 0)
        .map((p) => (
          <circle
            key={`${p.x}-${p.y}`}
            cx={p.x}
            cy={p.y}
            r="3.5"
            className={tone === 'green' ? 'hero-graph-day-dot' : 'hero-graph-drop-dot'}
          />
        ))}
    </svg>
  )
}

export function HeroBalanceGraphs() {
  const progress = useMorphCycle(2400, 1500)
  const towardEven = progress
  const isEvenish = towardEven > 0.55

  const paymentYs = morphYs(PAYMENT_SPIKE_Y, PAYMENT_EVEN_Y, towardEven)
  const balanceYs = morphYs(BANK_Y, AVAILABLE_Y, towardEven)

  return (
    <div
      className="hero-graphs hero-graphs--sync"
      aria-label="How Cash Prophet spreads monthly bills and shows Available Balance"
    >
      <figure className={`hero-graph-card ${isEvenish ? 'hero-graph-card--true' : 'hero-graph-card--bank'}`}>
        <div className="hero-graph-header">
          <p className={`hero-graph-tag ${isEvenish ? 'hero-graph-tag--true' : 'hero-graph-tag--bank'}`}>
            Payment forecast
          </p>
          <p className="hero-graph-title">
            {isEvenish
              ? 'Commitments build evenly through the month'
              : 'Bills land as spikes when they leave the account'}
          </p>
        </div>
        <LineChart ys={paymentYs} tone={isEvenish ? 'green' : 'red'} />
      </figure>

      <figure className={`hero-graph-card ${isEvenish ? 'hero-graph-card--true' : 'hero-graph-card--bank'}`}>
        <div className="hero-graph-header">
          <p className={`hero-graph-tag ${isEvenish ? 'hero-graph-tag--true' : 'hero-graph-tag--bank'}`}>
            {isEvenish ? 'Available Balance' : 'Bank balance'}
          </p>
          <p className="hero-graph-title">
            {isEvenish
              ? 'A calmer number you can decide from'
              : 'Looks fine until the payments hit'}
          </p>
        </div>
        <LineChart ys={balanceYs} tone={isEvenish ? 'green' : 'red'} showArea={isEvenish} />
      </figure>
    </div>
  )
}
