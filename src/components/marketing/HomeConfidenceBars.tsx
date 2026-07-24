import { useMorphCycle } from './useMorphCycle'

/**
 * Month of obligations: spiked red bars morph into lower even green bars.
 */

const BAR_COUNT = 24

const SPIKE_HEIGHTS = Array.from({ length: BAR_COUNT }, (_, i) => {
  const spikes: Record<number, number> = {
    3: 0.72,
    7: 0.95,
    11: 0.4,
    14: 0.88,
    18: 0.55,
    21: 1,
  }
  return spikes[i] ?? 0.08
})

/** Keep the even state clearly lower than the spikes. */
const EVEN_HEIGHT = 0.28

export function HomeConfidenceBars() {
  const towardEven = useMorphCycle(2200, 1400)
  const isEvenish = towardEven > 0.55

  return (
    <figure
      className="home-confidence-bars"
      aria-label="Payment forecast morphing from bill spikes to an even monthly picture"
    >
      <div className="home-confidence-bars-head">
        <p className={`home-confidence-bars-tag${isEvenish ? ' home-confidence-bars-tag--green' : ''}`}>
          Payment forecast
        </p>
        <p className="home-confidence-bars-title">
          {isEvenish
            ? 'The same bills, spread through the month'
            : 'Bills land as spikes when money leaves'}
        </p>
      </div>

      <div className="home-confidence-bars-chart" aria-hidden>
        {SPIKE_HEIGHTS.map((spike, i) => {
          const h = spike + (EVEN_HEIGHT - spike) * towardEven
          const r = Math.round(225 + (13 - 225) * towardEven)
          const g = Math.round(29 + (143 - 29) * towardEven)
          const b = Math.round(72 + (91 - 72) * towardEven)
          return (
            <span
              key={i}
              className="home-confidence-bars-bar"
              style={{
                height: `${Math.max(4, h * 100)}%`,
                background: `rgb(${r}, ${g}, ${b})`,
              }}
            />
          )
        })}
      </div>

      <figcaption className="home-confidence-bars-caption">
        Cash Prophet spreads commitments through the month so your Available Balance stays honest
        every day.
      </figcaption>
    </figure>
  )
}
