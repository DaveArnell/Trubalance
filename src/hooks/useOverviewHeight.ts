import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { useEditReadOnly } from '../hooks/useEditReadOnly'
import { MOBILE_LAYOUT_MQ } from './useMobileNav'

const STORAGE_KEY = 'trubalance-overview-height-v4'
export const OVERVIEW_HEIGHT_MIN = 56
export const OVERVIEW_HEIGHT_MAX = 340
export const OVERVIEW_HEIGHT_DEFAULT = 210
export const OVERVIEW_HEIGHT_MOBILE_MAX = 420
export const OVERVIEW_HEIGHT_MOBILE_DEFAULT = 280

function isMobileViewport(): boolean {
  return typeof window !== 'undefined' && window.matchMedia(MOBILE_LAYOUT_MQ).matches
}

function clampHeight(value: number): number {
  const max = isMobileViewport() ? OVERVIEW_HEIGHT_MOBILE_MAX : OVERVIEW_HEIGHT_MAX
  return Math.min(max, Math.max(OVERVIEW_HEIGHT_MIN, Math.round(value)))
}

function readStoredHeight(): number {
  try {
    const legacy = localStorage.getItem('trubalance-overview-height')
    const raw = localStorage.getItem(STORAGE_KEY) ?? legacy
    if (!raw) {
      return isMobileViewport() ? OVERVIEW_HEIGHT_MOBILE_DEFAULT : OVERVIEW_HEIGHT_DEFAULT
    }
    const value = Number(raw)
    if (!Number.isFinite(value)) {
      return isMobileViewport() ? OVERVIEW_HEIGHT_MOBILE_DEFAULT : OVERVIEW_HEIGHT_DEFAULT
    }
    return clampHeight(value)
  } catch {
    return isMobileViewport() ? OVERVIEW_HEIGHT_MOBILE_DEFAULT : OVERVIEW_HEIGHT_DEFAULT
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
  const editReadOnly = useEditReadOnly()
  const [height, setHeight] = useState(() =>
    editReadOnly ? OVERVIEW_HEIGHT_DEFAULT : readStoredHeight(),
  )
  const draggingRef = useRef(false)
  const startYRef = useRef(0)
  const startHeightRef = useRef(OVERVIEW_HEIGHT_DEFAULT)

  const onPointerMove = useCallback((event: PointerEvent) => {
    if (!draggingRef.current) return
    const delta = event.clientY - startYRef.current
    const next = clampHeight(startHeightRef.current + delta)
    setHeight(next)
  }, [])

  const endDrag = useCallback(() => {
    if (!draggingRef.current) return
    draggingRef.current = false
    document.body.classList.remove('overview-height-dragging')
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('pointerup', endDrag)
    setHeight((current) => {
      if (!editReadOnly) persistHeight(current)
      return current
    })
  }, [editReadOnly, onPointerMove])

  const startHeightDrag = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (editReadOnly) return
      event.preventDefault()
      draggingRef.current = true
      startYRef.current = event.clientY
      startHeightRef.current = height
      document.body.classList.add('overview-height-dragging')
      window.addEventListener('pointermove', onPointerMove)
      window.addEventListener('pointerup', endDrag)
    },
    [editReadOnly, endDrag, height, onPointerMove],
  )

  const resetHeight = useCallback(() => {
    if (editReadOnly) return
    setHeight(OVERVIEW_HEIGHT_DEFAULT)
    persistHeight(OVERVIEW_HEIGHT_DEFAULT)
  }, [editReadOnly])

  useEffect(() => () => endDrag(), [endDrag])

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_LAYOUT_MQ)
    const onChange = () => setHeight((current) => clampHeight(current))
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return { height, setHeight, startHeightDrag, resetHeight }
}

