import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react'
import { useEditReadOnly } from '../hooks/useEditReadOnly'

export type SheetColumnSpec = {
  id: string
  defaultWidth: number
  minWidth: number
  resizable?: boolean
  /** Locked width — never grows, shrinks, or participates in redistribution. */
  fixed?: boolean
  /** When false, column keeps its width on widget resize but can still be dragged manually. */
  fitToContainer?: boolean
}

const STORAGE_PREFIX = 'trubalance-sheet-col-widths:'
const PROPORTION_PREFIX = 'trubalance-sheet-col-proportions:'

function isFixedColumn(columns: SheetColumnSpec[], index: number) {
  return columns[index]?.fixed === true
}

function fixedWidthFor(columns: SheetColumnSpec[], index: number) {
  return columns[index]?.defaultWidth ?? 0
}

function applyFixedWidths(widths: number[], columns: SheetColumnSpec[]) {
  return widths.map((width, index) => (isFixedColumn(columns, index) ? fixedWidthFor(columns, index) : width))
}

function sumWidths(widths: number[]) {
  return widths.reduce((total, width) => total + width, 0)
}

function isStretchColumn(columns: SheetColumnSpec[], index: number) {
  if (isFixedColumn(columns, index)) return false
  if (columns[index]?.fitToContainer === false) return false
  return true
}

function lockedWidthSum(widths: number[], columns: SheetColumnSpec[]) {
  return widths.reduce(
    (sum, width, index) =>
      isFixedColumn(columns, index) || columns[index]?.fitToContainer === false ? sum + width : sum,
    0,
  )
}

/** Scale stretchable columns proportionally so the table spans the container width. */
function fitFlexibleColumnsToContainer(
  widths: number[],
  mins: number[],
  columns: SheetColumnSpec[],
  total: number,
  proportions: Record<string, number> | null = null,
): number[] {
  const next = applyFixedWidths(widths.map((width, index) => Math.max(mins[index]!, width)), columns)
  if (total <= 0) return next

  const lockedSum = lockedWidthSum(next, columns)
  let flexIndices = columns.map((_, index) => index).filter((index) => isStretchColumn(columns, index))
  let targetFlex = total - lockedSum
  if (flexIndices.length === 0 || targetFlex <= 0) return next

  if (proportions) {
    const weights = flexIndices.map((index) => proportions[columns[index]!.id] ?? next[index]!)
    const weightSum = weights.reduce((sum, weight) => sum + weight, 0) || 1
    let assigned = 0
    for (let i = 0; i < flexIndices.length; i += 1) {
      const index = flexIndices[i]!
      const isLast = i === flexIndices.length - 1
      const min = mins[index]!
      const width = isLast
        ? Math.max(min, targetFlex - assigned)
        : Math.max(min, (targetFlex * weights[i]!) / weightSum)
      next[index] = width
      assigned += width
    }
    return next
  }

  for (let pass = 0; pass <= flexIndices.length; pass += 1) {
    const flexSum = flexIndices.reduce((sum, index) => sum + next[index]!, 0)
    if (flexSum <= 0) break

    const scale = targetFlex / flexSum
    let clamped = false

    for (const index of flexIndices) {
      const scaled = next[index]! * scale
      const min = mins[index]!
      if (scaled < min - 0.5) {
        next[index] = min
        clamped = true
      } else {
        next[index] = scaled
      }
    }

    if (!clamped) break

    const clampedSum = flexIndices
      .filter((index) => next[index]! <= mins[index]! + 0.5)
      .reduce((sum, index) => sum + next[index]!, 0)
    targetFlex = total - lockedWidthSum(next, columns) - clampedSum
    flexIndices = flexIndices.filter((index) => next[index]! > mins[index]! + 0.5)
    if (targetFlex <= 0 || flexIndices.length === 0) break
  }

  return next
}

function findFlexibleNeighbor(
  columns: SheetColumnSpec[],
  index: number,
): { neighborIndex: number; side: 'left' | 'right' } | null {
  const candidates: Array<{ neighborIndex: number; side: 'left' | 'right'; stretch: boolean }> = []

  for (let i = index + 1; i < columns.length; i += 1) {
    if (!isFixedColumn(columns, i)) {
      candidates.push({ neighborIndex: i, side: 'right', stretch: isStretchColumn(columns, i) })
    }
  }
  for (let i = index - 1; i >= 0; i -= 1) {
    if (!isFixedColumn(columns, i)) {
      candidates.push({ neighborIndex: i, side: 'left', stretch: isStretchColumn(columns, i) })
    }
  }

  const stretch = candidates.find((candidate) => candidate.stretch)
  if (stretch) return { neighborIndex: stretch.neighborIndex, side: stretch.side }

  const fallback = candidates[0]
  return fallback ? { neighborIndex: fallback.neighborIndex, side: fallback.side } : null
}

/**
 * Excel-style resize: only the resized column and one adjacent flexible neighbour change width.
 */
function resizeColumn(
  widths: number[],
  mins: number[],
  columns: SheetColumnSpec[],
  index: number,
  nextIndexWidth: number,
): number[] {
  if (isFixedColumn(columns, index)) return applyFixedWidths(widths, columns)

  const next = applyFixedWidths([...widths], columns)
  const oldWidth = next[index]!
  const requested = Math.max(mins[index]!, nextIndexWidth)
  const delta = requested - oldWidth
  if (Math.abs(delta) < 0.5) return next

  const neighbor = findFlexibleNeighbor(columns, index)
  if (!neighbor) return next

  const { neighborIndex, side } = neighbor
  const oldNeighbor = next[neighborIndex]!

  if (side === 'right') {
    const requestedNeighbor = oldNeighbor - delta
    if (requestedNeighbor < mins[neighborIndex]!) {
      const clampedNeighbor = mins[neighborIndex]!
      next[neighborIndex] = clampedNeighbor
      next[index] = oldWidth + (oldNeighbor - clampedNeighbor)
    } else {
      next[index] = requested
      next[neighborIndex] = requestedNeighbor
    }
  } else {
    const requestedNeighbor = oldNeighbor - delta
    if (requestedNeighbor < mins[neighborIndex]!) {
      const clampedNeighbor = mins[neighborIndex]!
      next[neighborIndex] = clampedNeighbor
      next[index] = oldWidth + (oldNeighbor - clampedNeighbor)
    } else {
      next[index] = requested
      next[neighborIndex] = requestedNeighbor
    }
  }

  return next
}

function loadStoredWidths(storageKey: string, columns: SheetColumnSpec[]): number[] | null {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${storageKey}`)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Record<string, number>
    const widths = columns.map((column) => {
      if (column.fixed) return column.defaultWidth
      const stored = parsed[column.id]
      return typeof stored === 'number' && stored >= column.minWidth ? stored : column.defaultWidth
    })
    return widths
  } catch {
    return null
  }
}

function saveStoredProportions(storageKey: string, columns: SheetColumnSpec[], widths: number[]) {
  try {
    const flexEntries = columns
      .map((column, index) => ({ id: column.id, width: widths[index]! }))
      .filter((_, index) => isStretchColumn(columns, index))
    const sum = flexEntries.reduce((total, entry) => total + entry.width, 0)
    if (sum <= 0) return
    const payload = Object.fromEntries(flexEntries.map(({ id, width }) => [id, width / sum]))
    localStorage.setItem(`${PROPORTION_PREFIX}${storageKey}`, JSON.stringify(payload))
  } catch {
    // ignore quota / private mode
  }
}

function loadStoredProportions(storageKey: string): Record<string, number> | null {
  try {
    const raw = localStorage.getItem(`${PROPORTION_PREFIX}${storageKey}`)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Record<string, number>
    return parsed
  } catch {
    return null
  }
}

function saveStoredWidths(storageKey: string, columns: SheetColumnSpec[], widths: number[]) {
  try {
    const payload = Object.fromEntries(columns.map((column, index) => [column.id, Math.round(widths[index]!)]))
    localStorage.setItem(`${STORAGE_PREFIX}${storageKey}`, JSON.stringify(payload))
  } catch {
    // ignore quota / private mode
  }
}

function reconcileToContainerWidth(
  widths: number[],
  mins: number[],
  columns: SheetColumnSpec[],
  total: number,
  proportions: Record<string, number> | null,
): number[] {
  if (total <= 0) return applyFixedWidths(widths, columns)
  if (Math.abs(sumWidths(widths) - total) <= 1) return applyFixedWidths(widths, columns)
  return fitFlexibleColumnsToContainer(widths, mins, columns, total, proportions)
}

export function useResizableSheetColumns(
  containerRef: RefObject<HTMLElement | null>,
  columns: SheetColumnSpec[],
  storageKey: string,
) {
  const editReadOnly = useEditReadOnly()
  const mins = useRef(columns.map((column) => column.minWidth))
  const defaults = useRef(columns.map((column) => column.defaultWidth))
  const [widths, setWidths] = useState<number[]>(() => {
    if (editReadOnly) return defaults.current
    const stored = loadStoredWidths(storageKey, columns)
    return stored ?? defaults.current
  })
  const widthsRef = useRef(widths)
  widthsRef.current = widths

  const getContainerWidth = useCallback(() => containerRef.current?.clientWidth ?? 0, [containerRef])

  const proportionsRef = useRef(loadStoredProportions(storageKey))
  const lastContainerWidthRef = useRef(0)
  const isManualResizeRef = useRef(false)

  const fitToContainerFromWidgetResize = useCallback(
    (raw: number[]) => {
      const total = getContainerWidth()
      const fitted = reconcileToContainerWidth(
        raw,
        mins.current,
        columns,
        total,
        proportionsRef.current,
      )
      widthsRef.current = fitted
      setWidths(fitted)
      return fitted
    },
    [columns, getContainerWidth],
  )

  useLayoutEffect(() => {
    const total = getContainerWidth()
    lastContainerWidthRef.current = total
    const fitted = reconcileToContainerWidth(
      widthsRef.current,
      mins.current,
      columns,
      total,
      proportionsRef.current,
    )
    widthsRef.current = fitted
    setWidths(fitted)
  }, [columns, getContainerWidth])

  useEffect(() => {
    const node = containerRef.current
    if (!node || typeof ResizeObserver === 'undefined') return

    const observer = new ResizeObserver(() => {
      if (isManualResizeRef.current) return

      const total = getContainerWidth()
      if (Math.abs(total - lastContainerWidthRef.current) <= 1) return
      lastContainerWidthRef.current = total

      fitToContainerFromWidgetResize(widthsRef.current)
    })

    observer.observe(node)
    return () => observer.disconnect()
  }, [containerRef, fitToContainerFromWidgetResize, getContainerWidth])

  const startResize = useCallback(
    (index: number, startX: number) => {
      if (editReadOnly) return
      if (columns[index]?.resizable === false || columns[index]?.fixed) return

      isManualResizeRef.current = true
      const startWidth = widthsRef.current[index] ?? columns[index]!.defaultWidth

      const onMove = (event: MouseEvent) => {
        const delta = event.clientX - startX
        const resized = resizeColumn(widthsRef.current, mins.current, columns, index, startWidth + delta)
        widthsRef.current = resized
        setWidths(resized)
      }

      const onUp = () => {
        document.removeEventListener('mousemove', onMove)
        document.removeEventListener('mouseup', onUp)
        document.body.classList.remove('sheet-col-resizing')
        isManualResizeRef.current = false

        const total = getContainerWidth()
        lastContainerWidthRef.current = total

        const final = reconcileToContainerWidth(
          widthsRef.current,
          mins.current,
          columns,
          total,
          null,
        )
        widthsRef.current = final
        setWidths(final)
        if (!editReadOnly) {
          saveStoredWidths(storageKey, columns, final)
          saveStoredProportions(storageKey, columns, final)
          proportionsRef.current = loadStoredProportions(storageKey)
        }
      }

      document.body.classList.add('sheet-col-resizing')
      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', onUp)
    },
    [columns, editReadOnly, getContainerWidth, storageKey],
  )

  return { widths, startResize }
}

