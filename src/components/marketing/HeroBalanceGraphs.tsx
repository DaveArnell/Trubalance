import { useMorphCycle, lerp } from './useMorphCycle'

/**
 * Hero visuals — one shared month story, two chart types morphing together:
 * 1) Payment forecast (bars): bill spikes → even daily build
 * 2) Balance (line): bank sawtooth → Available Balance (gentle upward wave, low on chart)
 * Spike days match drop days so bar height and line plunge share the same events.
 */

type Pt = { x: number; y: number }

const W = 440
const H_LINE = 150
const N = 24
const BASELINE = 126
const EVEN_BAR = 0.24

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

/**
 * Available Balance: slight wave, overall upward, mid-chart (not hugging the axis).
 */
const AVAILABLE_Y = Array.from({ length: N }, (_, i) => {
  const t = i / (N - 1)
  const trend = 78 - t * 16
  const wave = Math.sin(t * Math.PI * 2.2) * 4.5 + Math.sin(t * Math.PI * 5.1) * 2
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

/** Crossfade two labels in place — no snap. */
function MorphText({
  before,
  after,
  t,
  className,
  beforeClassName = '',
  afterClassName = '',
}: {
  before: string
  after: string
  t: number
  className: string
  beforeClassName?: string
  afterClassName?: string
}) {
  const beforeOpacity = Math.max(0, Math.min(1, 1 - t / 0.45))
  const afterOpacity = Math.max(0, Math.min(1, (t - 0.4) / 0.4))
  return (
    <div className={`hero-graph-morph-text ${className}`}>
      <p className={beforeClassName} style={{ opacity: beforeOpacity }} aria-hidden={beforeOpacity < 0.15}>
        {before}
      </p>
      <p className={afterClassName} style={{ opacity: afterOpacity }} aria-hidden={afterOpacity < 0.15}>
        {after}
      </p>
    </div>
  )
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
  // Blend jagged → smooth so the path style doesn’t snap mid-morph
  const jagged = jaggedPath(mixed)
  const smooth = smoothPath(mixed)
  const area = areaUnder(mixed, BASELINE)
  const bankOpacity = Math.max(0, 1 - towardEven / 0.55)
  const greenOpacity = Math.max(0, Math.min(1, (towardEven - 0.35) / 0.4))

  return (
    <svg className="hero-graph-svg" viewBox={`0 0 ${W} ${H_LINE}`} aria-hidden>
      <line x1="12" y1={BASELINE} x2="428" y2={BASELINE} className="hero-graph-axis" />
      <line x1="12" y1="90" x2="428" y2="90" className="hero-graph-gridline" />
      <line x1="12" y1="54" x2="428" y2="54" className="hero-graph-gridline" />

      <path className="hero-graph-area" d={area} opacity={greenOpacity * 0.9} />

      <path
        className="hero-graph-line hero-graph-line--bank"
        d={towardEven < 0.5 ? jagged : smooth}
        opacity={bankOpacity}
      />
      <path
        className="hero-graph-line hero-graph-line--true"
        d={smooth}
        opacity={greenOpacity}
      />

      {EVENTS.map((event) => {
        const p = mixed[event.i]!
        if (towardEven > 0.55) {
          return (
            <circle
              key={event.label}
              cx={p.x}
              cy={p.y}
              r="3"
              className="hero-graph-day-dot"
              opacity={greenOpacity}
            />
          )
        }
        return (
          <g key={event.label} opacity={bankOpacity}>
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
  // Longer morph so bars ease like the line, not snap between states
  const towardEven = useMorphCycle(2400, 2800)
  const cardTone = towardEven > 0.5 ? 'true' : 'bank'

  const barHeights = SPIKE_BARS.map((spike) => spike + (EVEN_BAR - spike) * towardEven)

  return (
    <div
      className="hero-graphs hero-graphs--sync"
      aria-label="Payment spikes and bank balance morph into an even Available Balance"
    >
      <figure className={`hero-graph-card hero-graph-card--${cardTone}`}>
        <MorphText
          className="hero-graph-mode"
          before="Without Cash Prophet"
          after="With Cash Prophet"
          t={towardEven}
          beforeClassName="hero-graph-mode-label hero-graph-mode-label--without"
          afterClassName="hero-graph-mode-label hero-graph-mode-label--with"
        />
        <div className="hero-graph-header">
          <p className={`hero-graph-tag hero-graph-tag--${cardTone}`}>Payment forecast</p>
          <MorphText
            className="hero-graph-title-stack"
            before="Payments hit as spikes through the month"
            after="Future commitments are accounted for every day"
            t={towardEven}
            beforeClassName="hero-graph-title"
            afterClassName="hero-graph-title"
          />
        </div>
        <BarChart heights={barHeights} towardEven={towardEven} />
      </figure>

      <figure className={`hero-graph-card hero-graph-card--${cardTone}`}>
        <MorphText
          className="hero-graph-mode"
          before="Without Cash Prophet"
          after="With Cash Prophet"
          t={towardEven}
          beforeClassName="hero-graph-mode-label hero-graph-mode-label--without"
          afterClassName="hero-graph-mode-label hero-graph-mode-label--with"
        />
        <div className="hero-graph-header">
          <MorphText
            className="hero-graph-tag-stack"
            before="Bank balance"
            after="Available Balance"
            t={towardEven}
            beforeClassName="hero-graph-tag hero-graph-tag--bank"
            afterClassName="hero-graph-tag hero-graph-tag--true"
          />
          <MorphText
            className="hero-graph-title-stack"
            before="Looks fine until the payments hit"
            after="A balance that reflects what's already committed"
            t={towardEven}
            beforeClassName="hero-graph-title"
            afterClassName="hero-graph-title"
          />
        </div>
        <BalanceLine towardEven={towardEven} />
      </figure>
    </div>
  )
}
