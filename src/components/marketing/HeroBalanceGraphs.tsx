import { useMorphCycle, lerp } from './useMorphCycle'

/**
 * Hero visuals — one shared month story, two chart types morphing together:
 * 1) Payment forecast (bars): bill spikes → even daily build
 * 2) Balance (line): bank sawtooth → Available Balance (gentle upward wave)
 * Spike days match drop days so bar height and line plunge share the same events.
 */

type Pt = { x: number; y: number }

const W = 440
const H_LINE = 150
const N = 24
const BASELINE = 126
const EVEN_BAR = 0.28

/** Shared payment events — bar spikes and bank-line drops use the same indices. */
const EVENTS = [
  { i: 4, amount: 0.78, label: 'Payroll' },
  { i: 9, amount: 0.62, label: 'VAT' },
  { i: 14, amount: 0.9, label: 'Rent' },
  { i: 19, amount: 0.7, label: 'Insurance' },
] as const

const EVENT_BY_I = new Map<number, (typeof EVENTS)[number]>(EVENTS.map((e) => [e.i, e]))

function sampleX(i: number) {
  return 14 + (i / (N - 1)) * 412
}

/** Bar heights 0–1 for the spiked (bank) month. */
const SPIKE_BARS = Array.from({ length: N }, (_, i) => {
  const hit = EVENT_BY_I.get(i)
  return hit ? hit.amount : 0.08
})

/**
 * Bank balance in SVG y (higher y = lower balance).
 * Climbs into each bill day, then drops — same indices as bar spikes.
 */
const BANK_Y = (() => {
  const ys = Array.from({ length: N }, () => 60)
  for (const event of EVENTS) {
    ys[event.i] = Math.min(112, 88 + event.amount * 22)
    if (event.i > 0) {
      ys[event.i - 1] = Math.max(38, 48 - event.amount * 8)
    }
  }
  ys[0] = 66
  ys[N - 1] = 58

  // Climb between trough and next peak
  for (let e = 0; e < EVENTS.length; e++) {
    const troughI = EVENTS[e]!.i
    const nextPeakI = e + 1 < EVENTS.length ? EVENTS[e + 1]!.i - 1 : N - 1
    const fromY = ys[troughI]!
    const toY = ys[nextPeakI]!
    const span = nextPeakI - troughI
    for (let i = troughI + 1; i < nextPeakI; i++) {
      const t = (i - troughI) / span
      ys[i] = fromY + (toY - fromY) * t
    }
    if (e === 0) {
      const firstPeak = Math.max(0, troughI - 1)
      for (let i = 1; i < firstPeak; i++) {
        const t = i / firstPeak
        ys[i] = ys[0]! + (ys[firstPeak]! - ys[0]!) * t
      }
    }
  }
  return ys
})()

/** Available Balance: slight wave, overall upward, sit lower on the chart. */
const AVAILABLE_Y = Array.from({ length: N }, (_, i) => {
  const t = i / (N - 1)
  const trend = 92 - t * 22
  const wave = Math.sin(t * Math.PI * 2.2) * 5.5 + Math.sin(t * Math.PI * 5.1) * 2.2
  return trend + wave
})

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

function jaggedPath(points: Pt[]): string {
  if (points.length < 2) return ''
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x} ${p.y}`).join(' ')
}

function areaUnder(points: Pt[], baselineY: number): string {
  const last = points[points.length - 1]!
  const first = points[0]!
  return `${smoothPath(points)} L${last.x} ${baselineY} L${first.x} ${baselineY} Z`
}

function BarChart({ heights, towardEven }: { heights: number[]; towardEven: number }) {
  const chartH = 88
  return (
    <div className="hero-bars-chart" aria-hidden>
      {heights.map((h, i) => {
        const r = Math.round(225 + (13 - 225) * towardEven)
        const g = Math.round(29 + (143 - 29) * towardEven)
        const b = Math.round(72 + (91 - 72) * towardEven)
        return (
          <span
            key={i}
            className="hero-bars-bar"
            style={{
              height: `${Math.max(4, h * chartH)}px`,
              background: `rgb(${r}, ${g}, ${b})`,
            }}
          />
        )
      })}
    </div>
  )
}

function BalanceLine({ towardEven }: { towardEven: number }) {
  const bankPts = pointsFromYs(BANK_Y)
  const availPts = pointsFromYs(AVAILABLE_Y)
  const mixed = bankPts.map((p, i) => ({
    x: p.x,
    y: lerp(p.y, availPts[i]!.y, towardEven),
  }))
  const useSmooth = towardEven > 0.45
  const path = useSmooth ? smoothPath(mixed) : jaggedPath(mixed)
  const area = areaUnder(mixed, BASELINE)
  const isGreen = towardEven > 0.55

  return (
    <svg className="hero-graph-svg" viewBox={`0 0 ${W} ${H_LINE}`} aria-hidden>
      <line x1="12" y1={BASELINE} x2="428" y2={BASELINE} className="hero-graph-axis" />
      <line x1="12" y1="90" x2="428" y2="90" className="hero-graph-gridline" />
      <line x1="12" y1="54" x2="428" y2="54" className="hero-graph-gridline" />

      {towardEven > 0.35 ? (
        <path className="hero-graph-area" d={area} opacity={Math.min(1, (towardEven - 0.35) / 0.4)} />
      ) : null}

      <path
        className={`hero-graph-line ${isGreen ? 'hero-graph-line--true' : 'hero-graph-line--bank'}`}
        d={path}
      />

      {EVENTS.map((event) => {
        const p = mixed[event.i]!
        if (towardEven > 0.7) {
          return (
            <circle
              key={event.label}
              cx={p.x}
              cy={p.y}
              r="3"
              className="hero-graph-day-dot"
              opacity={Math.min(1, (towardEven - 0.7) / 0.3)}
            />
          )
        }
        return (
          <g key={event.label} opacity={Math.max(0, 1 - towardEven * 1.2)}>
            <circle cx={p.x} cy={p.y} r="4" className="hero-graph-drop-dot" />
            <text
              x={p.x}
              y={Math.min(BASELINE - 6, p.y + 20)}
              className="hero-graph-drop-label"
              textAnchor="middle"
            >
              {event.label}
            </text>
          </g>
        )
      })}

    </svg>
  )
}

export function HeroBalanceGraphs() {
  const towardEven = useMorphCycle(2600, 2000)
  const isEvenish = towardEven > 0.55

  const barHeights = SPIKE_BARS.map((spike) => spike + (EVEN_BAR - spike) * towardEven)

  return (
    <div
      className="hero-graphs hero-graphs--sync"
      aria-label="Payment spikes and bank balance morph into an even Available Balance"
    >
      <figure className={`hero-graph-card ${isEvenish ? 'hero-graph-card--true' : 'hero-graph-card--bank'}`}>
        <div className="hero-graph-header">
          <p className={`hero-graph-tag ${isEvenish ? 'hero-graph-tag--true' : 'hero-graph-tag--bank'}`}>
            Payment forecast
          </p>
          <p className="hero-graph-title">
            {isEvenish
              ? 'Build towards commitments daily through the month'
              : 'Bills land as spikes when they leave the account'}
          </p>
        </div>
        <BarChart heights={barHeights} towardEven={towardEven} />
      </figure>

      <figure className={`hero-graph-card ${isEvenish ? 'hero-graph-card--true' : 'hero-graph-card--bank'}`}>
        <div className="hero-graph-header">
          <p className={`hero-graph-tag ${isEvenish ? 'hero-graph-tag--true' : 'hero-graph-tag--bank'}`}>
            {isEvenish ? 'Available Balance' : 'Bank balance'}
          </p>
          <p className="hero-graph-title">
            {isEvenish ? 'A clearer picture of your finances' : 'Looks fine until the payments hit'}
          </p>
        </div>
        <BalanceLine towardEven={towardEven} />
      </figure>
    </div>
  )
}
