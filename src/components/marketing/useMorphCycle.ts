import { useEffect, useState } from 'react'

export type MorphPhase = 'spiked' | 'to-even' | 'even' | 'to-spiked'

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

/** Shared 0→1 morph cycle for synced hero / confidence visuals. */
export function useMorphCycle(holdMs = 2200, morphMs = 1400) {
  const [phase, setPhase] = useState<MorphPhase>('spiked')
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let raf = 0
    let start = 0
    let cancelled = false

    const run = (duration: number, from: number, to: number, after: MorphPhase) => {
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
      const id = window.setTimeout(() => setPhase('to-even'), holdMs)
      return () => {
        cancelled = true
        window.clearTimeout(id)
        cancelAnimationFrame(raf)
      }
    }

    if (phase === 'to-even') {
      run(morphMs, 0, 1, 'even')
      return () => {
        cancelled = true
        cancelAnimationFrame(raf)
      }
    }

    if (phase === 'even') {
      setProgress(1)
      const id = window.setTimeout(() => setPhase('to-spiked'), holdMs)
      return () => {
        cancelled = true
        window.clearTimeout(id)
        cancelAnimationFrame(raf)
      }
    }

    run(morphMs, 1, 0, 'spiked')
    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
    }
  }, [phase, holdMs, morphMs])

  return progress
}

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}
