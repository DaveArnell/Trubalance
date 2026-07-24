import { useEffect, useState } from 'react'

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

/**
 * Continuous 0→1 morph cycle (no phase restarts) so bar/line heights stay smooth.
 * Timeline: hold spiked → morph to even → hold even → morph to spiked → repeat.
 */
export function useMorphCycle(holdMs = 2600, morphMs = 2000) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let raf = 0
    let cancelled = false
    const cycleMs = holdMs * 2 + morphMs * 2
    const start = performance.now()

    const tick = (now: number) => {
      if (cancelled) return
      const elapsed = (now - start) % cycleMs
      let next = 0
      if (elapsed < holdMs) {
        next = 0
      } else if (elapsed < holdMs + morphMs) {
        next = easeInOut((elapsed - holdMs) / morphMs)
      } else if (elapsed < holdMs * 2 + morphMs) {
        next = 1
      } else {
        next = 1 - easeInOut((elapsed - holdMs * 2 - morphMs) / morphMs)
      }
      setProgress(next)
      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
    }
  }, [holdMs, morphMs])

  return progress
}

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}
