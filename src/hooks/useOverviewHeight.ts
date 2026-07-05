import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { useDemoReadOnly } from '../contexts/DemoModeContext'

const STORAGE_KEY = 'trubalance-overview-height-v2'
export const OVERVIEW_HEIGHT_MIN = 56
export const OVERVIEW_HEIGHT_MAX = 340
export const OVERVIEW_HEIGHT_DEFAULT = 210

function readStoredHeight(): number {
  try {
    const legacy = localStorage.getItem('trubalance-overview-height')
    const raw = localStorage.getItem(STORAGE_KEY) ?? legacy
    if (!raw) return OVERVIEW_HEIGHT_DEFAULT
    const value = Number(raw)
    if (!Number.isFinite(value)) return OVERVIEW_HEIGHT_DEFAULT
    return Math.min(OVERVIEW_HEIGHT_MAX, Math.max(OVERVIEW_HEIGHT_MIN, Math.round(value)))
  } catch {
    return OVERVIEW_HEIGHT_DEFAULT
  }
}

function persistHeight(height: number) {
  try {
    localStorage.setItem(STORAGE_KEY, String(height))
  } catch {
    /* ignore */
  }
}

/** Vertical size of the pinned True Balance overview (drag bottom edge). */
export function useOverviewHeight() {
  const demoReadOnly = useDemoReadOnly()
  const [height, setHeight] = useState(() =>
    demoReadOnly ? OVERVIEW_HEIGHT_DEFAULT : readStoredHeight(),
  )
  const draggingRef = useRef(false)
  const startYRef = useRef(0)
  const startHeightRef = useRef(OVERVIEW_HEIGHT_DEFAULT)

  const onPointerMove = useCallback((event: PointerEvent) => {
    if (!draggingRef.current) return
    const delta = event.clientY - startYRef.current
    const next = Math.min(
      OVERVIEW_HEIGHT_MAX,
      Math.max(OVERVIEW_HEIGHT_MIN, startHeightRef.current + delta),
    )
    setHeight(next)
  }, [])

  const endDrag = useCallback(() => {
    if (!draggingRef.current) return
    draggingRef.current = false
    document.body.classList.remove('overview-height-dragging')
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('pointerup', endDrag)
    setHeight((current) => {
      if (!demoReadOnly) persistHeight(current)
      return current
    })
  }, [demoReadOnly, onPointerMove])

  const startHeightDrag = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (demoReadOnly) return
      event.preventDefault()
      draggingRef.current = true
      startYRef.current = event.clientY
      startHeightRef.current = height
      document.body.classList.add('overview-height-dragging')
      window.addEventListener('pointermove', onPointerMove)
      window.addEventListener('pointerup', endDrag)
    },
    [demoReadOnly, endDrag, height, onPointerMove],
  )

  const resetHeight = useCallback(() => {
    if (demoReadOnly) return
    setHeight(OVERVIEW_HEIGHT_DEFAULT)
    persistHeight(OVERVIEW_HEIGHT_DEFAULT)
  }, [demoReadOnly])

  useEffect(() => () => endDrag(), [endDrag])

  return { height, setHeight, startHeightDrag, resetHeight }
}
