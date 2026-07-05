import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { useDemoReadOnly } from '../contexts/DemoModeContext'

const STORAGE_KEY = 'trubalance-overview-aside-pct'
const DEFAULT_FR = 24
const MIN_FR = 14
const MAX_FR = 42

function readStoredFr(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_FR
    const value = Number(raw)
    if (!Number.isFinite(value)) return DEFAULT_FR
    return Math.min(MAX_FR, Math.max(MIN_FR, value))
  } catch {
    return DEFAULT_FR
  }
}

/** Horizontal split between True Balance hero and breakdown table (fr units, both can shrink). */
export function useOverviewSplit() {
  const demoReadOnly = useDemoReadOnly()
  const [asideFr, setAsideFr] = useState(() => (demoReadOnly ? DEFAULT_FR : readStoredFr()))
  const draggingRef = useRef(false)
  const startXRef = useRef(0)
  const startFrRef = useRef(DEFAULT_FR)
  const containerRef = useRef<HTMLDivElement>(null)

  const persist = useCallback(
    (fr: number) => {
      if (demoReadOnly) return
      try {
        localStorage.setItem(STORAGE_KEY, String(Math.round(fr)))
      } catch {
        /* ignore */
      }
    },
    [demoReadOnly],
  )

  const onPointerMove = useCallback((event: PointerEvent) => {
    if (!draggingRef.current || !containerRef.current) return
    const width = containerRef.current.getBoundingClientRect().width
    if (width <= 0) return
    const deltaFr = ((event.clientX - startXRef.current) / width) * 100
    const next = Math.min(MAX_FR, Math.max(MIN_FR, startFrRef.current + deltaFr))
    setAsideFr(next)
  }, [])

  const endDrag = useCallback(() => {
    if (!draggingRef.current) return
    draggingRef.current = false
    document.body.classList.remove('overview-split-dragging')
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('pointerup', endDrag)
    setAsideFr((current) => {
      persist(current)
      return current
    })
  }, [onPointerMove, persist])

  const startDrag = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (demoReadOnly) return
      event.preventDefault()
      draggingRef.current = true
      startXRef.current = event.clientX
      startFrRef.current = asideFr
      document.body.classList.add('overview-split-dragging')
      window.addEventListener('pointermove', onPointerMove)
      window.addEventListener('pointerup', endDrag)
    },
    [asideFr, demoReadOnly, endDrag, onPointerMove],
  )

  useEffect(() => () => endDrag(), [endDrag])

  return { asideFr, containerRef, startDrag }
}
