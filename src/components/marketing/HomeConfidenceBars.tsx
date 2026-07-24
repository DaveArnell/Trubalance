import { useEffect, useState } from 'react'

/**
 * Month of obligations: spiked red bars (bills hitting) morph into even green bars
 * (commitments accounted for steadily). Used in “The result is confidence”.
 */

const BAR_COUNT = 24

/** Tall spikes on a few days; most days near zero — unlabeled. */
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

const EVEN_HEIGHT = 0.42

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

type Phase = 'spiked' | 'to-even' | 'even' | 'to-spiked'

export function HomeConfidenceBars() {
  const [phase, setPhase] = useState<Phase>('spiked')
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let raf = 0
    let start = 0
    let cancelled = false

    const HOLD_MS = 2200
    const MORPH_MS = 1400

    const run = (duration: number, from: number, to: number, after: Phase) => {
      start = performance.now()
      const tick = (now: number) => {
        if (cancelled) return
        const t = Math.min(1, (now - start) / duration)
        setProgress(from + (to - from) * easeInOut(t))
        if (t < 1) {
          raf = requestAnimationFrame(tick)
        } else {
          setPhase(after)
        }
      }
      raf = requestAnimationFrame(tick)
    }

    if (phase === 'spiked') {
      setProgress(0)
      const id = window.setTimeout(() => setPhase('to-even'), HOLD_MS)
      return () => {
        cancelled = true
        window.clearTimeout(id)
        cancelAnimationFrame(raf)
      }
    }

    if (phase === 'to-even') {
      run(MORPH_MS, 0, 1, 'even')
      return () => {
        cancelled = true
        cancelAnimationFrame(raf)
      }
    }

    if (phase === 'even') {
      setProgress(1)
      const id = window.setTimeout(() => setPhase('to-spiked'), HOLD_MS)
      return () => {
        cancelled = true
        window.clearTimeout(id)
        cancelAnimationFrame(raf)
      }
    }

    run(MORPH_MS, 1, 0, 'spiked')
    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
    }
  }, [phase])

  const towardEven = progress
  const isEvenish = towardEven > 0.55

  return (
    <figure
      className="home-confidence-bars"
      aria-label="Obligations as spikes through the month, then smoothed into an even daily picture"
    >
      <div className="home-confidence-bars-head">
        <p className={`home-confidence-bars-tag${isEvenish ? ' home-confidence-bars-tag--green' : ''}`}>
          {isEvenish ? 'Cash Prophet' : 'Bank view'}
        </p>
        <p className="home-confidence-bars-title">
          {isEvenish
            ? 'The same commitments, accounted for steadily'
            : 'Bills hit as spikes — then disappear from view until payday'}
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
        Spikes are when money leaves. Cash Prophet spreads those commitments through the month so
        Available stays honest every day — not only on payday.
      </figcaption>
    </figure>
  )
}
