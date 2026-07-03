import type {
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
  ReactNode,
} from 'react'
import { useRef, useState } from 'react'

import type { PageId } from '../navigation'

import { useWidgetLayout } from '../hooks/useWidgetLayout'

import {

  captureWidgetFrames,

  findEastNeighbors,

  findNorthNeighbor,

  findSouthNeighbor,

  findWestNeighbors,

  framesToWidgetRects,

  getGridRowCount,

  getWidgetLabel,

  GRID_COLUMNS,

  isLayoutCustomizable,

  maxEastColSpan,

  maxSouthRowSpan,

  MIN_COL_SPAN,

  MIN_ROW_SPAN,

  MIN_WIDGET_HEIGHT,
  alignStackedColumnWidgets,
} from '../utils/widgetLayout'

import type { WidgetLayoutItem, WidgetLiveFrame, WidgetRect } from '../utils/widgetLayout'

import {
  applyWidgetDropIntent,
  computeWidgetDropPreview,
  layoutToStacks,
  rectsToLiveFrames,
  stacksToRectsFromLayout,
  type ColumnStack,
  type WidgetDropHighlightMode,
} from '../utils/widgetLayoutReflow'

import { WidgetSettingsMenu } from './WidgetSettingsMenu'



interface WidgetGridProps {

  pageId: PageId

  widgets: Record<string, ReactNode>

}



interface SettingsState {

  widgetId: string

  anchorRect: DOMRect

}



type ResizeEdge = 'w' | 'e' | 'n' | 's' | 'nw' | 'ne' | 'sw' | 'se'



type ResizeCoupling = {
  eastNeighborId?: string
  eastNeighborIds?: string[]
  westNeighborId?: string
  westNeighborIds?: string[]
  southNeighborId?: string
  southNeighborIds?: string[]
  northNeighborId?: string
  northNeighborIds?: string[]
}

function collectCoupledWidgetIds(primaryId: string, coupling: ResizeCoupling): string[] {
  return [
    primaryId,
    ...(coupling.eastNeighborIds ?? []),
    ...(coupling.eastNeighborId ? [coupling.eastNeighborId] : []),
    ...(coupling.westNeighborIds ?? []),
    ...(coupling.westNeighborId ? [coupling.westNeighborId] : []),
    ...(coupling.southNeighborId ? [coupling.southNeighborId] : []),
    ...(coupling.northNeighborId ? [coupling.northNeighborId] : []),
  ]
}

function eastCouplingFromNeighbors(
  neighbors: { id: string }[],
): Pick<ResizeCoupling, 'eastNeighborId' | 'eastNeighborIds'> {
  if (neighbors.length > 1) return { eastNeighborIds: neighbors.map((neighbor) => neighbor.id) }
  if (neighbors.length === 1) return { eastNeighborId: neighbors[0].id }
  return {}
}

function westCouplingFromNeighbors(
  neighbors: { id: string }[],
): Pick<ResizeCoupling, 'westNeighborId' | 'westNeighborIds'> {
  if (neighbors.length > 1) return { westNeighborIds: neighbors.map((neighbor) => neighbor.id) }
  if (neighbors.length === 1) return { westNeighborId: neighbors[0].id }
  return {}
}



function getItemRect(item: WidgetLayoutItem): WidgetRect {

  return {

    col: item.col,

    row: item.row,

    colSpan: item.colSpan,

    rowSpan: item.rowSpan,

  }

}



function applyEastCoupledFrames(

  frames: Record<string, WidgetLiveFrame>,

  primaryId: string,

  neighborId: string,

  deltaX: number,

  minPrimaryWidth: number,

  minNeighborWidth: number,

) {

  const primary = frames[primaryId]

  const neighbor = frames[neighborId]

  if (!primary || !neighbor) return



  const gapX = neighbor.left - (primary.left + primary.width)

  const totalWidth = primary.width + neighbor.width

  let nextPrimaryWidth = primary.width + deltaX

  let nextNeighborWidth = neighbor.width - deltaX



  if (nextPrimaryWidth < minPrimaryWidth) {

    nextPrimaryWidth = minPrimaryWidth

    nextNeighborWidth = totalWidth - minPrimaryWidth

  }

  if (nextNeighborWidth < minNeighborWidth) {

    nextNeighborWidth = minNeighborWidth

    nextPrimaryWidth = totalWidth - minNeighborWidth

  }



  frames[primaryId] = { ...primary, width: nextPrimaryWidth }

  frames[neighborId] = {

    ...neighbor,

    left: primary.left + nextPrimaryWidth + gapX,

    width: nextNeighborWidth,

  }

}

function applyEastColumnShiftFrames(
  frames: Record<string, WidgetLiveFrame>,
  primaryId: string,
  eastNeighborIds: string[],
  deltaX: number,
  minPrimaryWidth: number,
  minNeighborWidth: number,
) {
  const primary = frames[primaryId]
  if (!primary) return

  const neighbors = eastNeighborIds
    .map((id) => ({ id, frame: frames[id] }))
    .filter((entry): entry is { id: string; frame: WidgetLiveFrame } => Boolean(entry.frame))

  if (neighbors.length === 0) return

  const maxGrow = Math.min(...neighbors.map((neighbor) => neighbor.frame.width - minNeighborWidth))
  const maxShrink = primary.width - minPrimaryWidth
  const clampedDelta = Math.max(-maxShrink, Math.min(maxGrow, deltaX))
  const newPrimaryWidth = primary.width + clampedDelta

  frames[primaryId] = { ...primary, width: newPrimaryWidth }
  for (const { id, frame } of neighbors) {
    frames[id] = {
      ...frame,
      left: frame.left + clampedDelta,
      width: frame.width - clampedDelta,
    }
  }
}

function applyWestColumnShiftFrames(
  frames: Record<string, WidgetLiveFrame>,
  primaryId: string,
  westNeighborIds: string[],
  deltaX: number,
  minPrimaryWidth: number,
  minNeighborWidth: number,
) {
  const primary = frames[primaryId]
  if (!primary) return

  const neighbors = westNeighborIds
    .map((id) => ({ id, frame: frames[id] }))
    .filter((entry): entry is { id: string; frame: WidgetLiveFrame } => Boolean(entry.frame))

  if (neighbors.length === 0) return

  const maxGrow = Math.min(...neighbors.map((neighbor) => neighbor.frame.width - minNeighborWidth))
  const maxShrink = primary.width - minPrimaryWidth
  const clampedDelta = Math.max(-maxShrink, Math.min(maxGrow, deltaX))
  const newPrimaryWidth = primary.width - clampedDelta
  const newPrimaryLeft = primary.left + clampedDelta

  frames[primaryId] = { ...primary, left: newPrimaryLeft, width: newPrimaryWidth }
  for (const { id, frame } of neighbors) {
    frames[id] = {
      ...frame,
      width: frame.width + clampedDelta,
    }
  }
}



function applySouthCoupledFrames(

  frames: Record<string, WidgetLiveFrame>,

  primaryId: string,

  neighborId: string,

  deltaY: number,

  minPrimaryHeight: number,

  minNeighborHeight: number,

) {

  const primary = frames[primaryId]

  const neighbor = frames[neighborId]

  if (!primary || !neighbor) return



  const gapY = neighbor.top - (primary.top + primary.height)

  const totalHeight = primary.height + neighbor.height

  let nextPrimaryHeight = primary.height + deltaY

  let nextNeighborHeight = neighbor.height - deltaY



  if (nextPrimaryHeight < minPrimaryHeight) {

    nextPrimaryHeight = minPrimaryHeight

    nextNeighborHeight = totalHeight - minPrimaryHeight

  }

  if (nextNeighborHeight < minNeighborHeight) {

    nextNeighborHeight = minNeighborHeight

    nextPrimaryHeight = totalHeight - minNeighborHeight

  }



  frames[primaryId] = { ...primary, height: nextPrimaryHeight }

  frames[neighborId] = {

    ...neighbor,

    top: primary.top + nextPrimaryHeight + gapY,

    height: nextNeighborHeight,

  }

}

function applySouthCoupledChainFrames(
  frames: Record<string, WidgetLiveFrame>,
  startFrames: Record<string, WidgetLiveFrame>,
  primaryId: string,
  neighborIds: string[],
  deltaY: number,
  minPrimaryHeight: number,
  minNeighborHeight: number,
) {
  if (neighborIds.length === 0) return
  applySouthCoupledFrames(
    frames,
    primaryId,
    neighborIds[0]!,
    deltaY,
    minPrimaryHeight,
    minNeighborHeight,
  )

  const leadId = neighborIds[0]!
  const lead = frames[leadId]
  const leadStart = startFrames[leadId]
  if (!lead || !leadStart) return

  for (let index = 1; index < neighborIds.length; index += 1) {
    const id = neighborIds[index]!
    const frame = frames[id]
    const start = startFrames[id]
    const prevId = neighborIds[index - 1]!
    const prev = frames[prevId]
    const prevStart = startFrames[prevId]
    if (!frame || !start || !prev || !prevStart) continue

    const gap = start.top - (prevStart.top + prevStart.height)
    frames[id] = {
      ...frame,
      top: prev.top + prev.height + gap,
      // Keep deeper widgets' heights stable; only the touched boundary resizes.
      height: Math.max(minNeighborHeight, start.height),
    }
  }
}



function applyWestCoupledFrames(

  frames: Record<string, WidgetLiveFrame>,

  primaryId: string,

  westNeighborId: string,

  deltaX: number,

  minPrimaryWidth: number,

  minNeighborWidth: number,

) {

  const primary = frames[primaryId]

  const west = frames[westNeighborId]

  if (!primary || !west) return



  const gapX = primary.left - (west.left + west.width)

  const totalWidth = west.width + primary.width

  let nextPrimaryWidth = primary.width - deltaX

  let nextWestWidth = west.width + deltaX



  if (nextPrimaryWidth < minPrimaryWidth) {

    nextPrimaryWidth = minPrimaryWidth

    nextWestWidth = totalWidth - minPrimaryWidth

  }

  if (nextWestWidth < minNeighborWidth) {

    nextWestWidth = minNeighborWidth

    nextPrimaryWidth = totalWidth - minNeighborWidth

  }



  frames[westNeighborId] = { ...west, width: nextWestWidth }

  frames[primaryId] = {

    ...primary,

    left: west.left + nextWestWidth + gapX,

    width: nextPrimaryWidth,

  }

}



function applyNorthCoupledFrames(

  frames: Record<string, WidgetLiveFrame>,

  primaryId: string,

  northNeighborId: string,

  deltaY: number,

  minPrimaryHeight: number,

  minNeighborHeight: number,

) {

  const primary = frames[primaryId]

  const north = frames[northNeighborId]

  if (!primary || !north) return



  const gapY = primary.top - (north.top + north.height)

  const totalHeight = north.height + primary.height

  let nextPrimaryHeight = primary.height - deltaY

  let nextNorthHeight = north.height + deltaY



  if (nextPrimaryHeight < minPrimaryHeight) {

    nextPrimaryHeight = minPrimaryHeight

    nextNorthHeight = totalHeight - minPrimaryHeight

  }

  if (nextNorthHeight < minNeighborHeight) {

    nextNorthHeight = minNeighborHeight

    nextPrimaryHeight = totalHeight - minNeighborHeight

  }



  frames[northNeighborId] = { ...north, height: nextNorthHeight }

  frames[primaryId] = {

    ...primary,

    top: north.top + nextNorthHeight + gapY,

    height: nextPrimaryHeight,

  }

}

function applyNorthCoupledChainFrames(
  frames: Record<string, WidgetLiveFrame>,
  startFrames: Record<string, WidgetLiveFrame>,
  primaryId: string,
  neighborIds: string[],
  deltaY: number,
  minPrimaryHeight: number,
  minNeighborHeight: number,
) {
  if (neighborIds.length === 0) return
  applyNorthCoupledFrames(
    frames,
    primaryId,
    neighborIds[0]!,
    deltaY,
    minPrimaryHeight,
    minNeighborHeight,
  )

  const leadId = neighborIds[0]!
  const lead = frames[leadId]
  const leadStart = startFrames[leadId]
  if (!lead || !leadStart) return

  for (let index = 1; index < neighborIds.length; index += 1) {
    const id = neighborIds[index]!
    const frame = frames[id]
    const start = startFrames[id]
    const prevId = neighborIds[index - 1]!
    const prev = frames[prevId]
    const prevStart = startFrames[prevId]
    if (!frame || !start || !prev || !prevStart) continue

    const gap = prevStart.top - (start.top + start.height)
    const height = Math.max(minNeighborHeight, start.height)
    frames[id] = {
      ...frame,
      height,
      top: prev.top - gap - height,
    }
  }
}

function buildSouthNeighborChain(
  layout: Pick<WidgetLayoutItem, 'id' | 'visible' | 'col' | 'colSpan' | 'row' | 'rowSpan'>[],
  widgetId: string,
): string[] {
  const result: string[] = []
  let currentId = widgetId
  while (true) {
    const next = findSouthNeighbor(layout, currentId)
    if (!next || result.includes(next.id)) break
    result.push(next.id)
    currentId = next.id
  }
  return result
}

function buildNorthNeighborChain(
  layout: Pick<WidgetLayoutItem, 'id' | 'visible' | 'col' | 'colSpan' | 'row' | 'rowSpan'>[],
  widgetId: string,
): string[] {
  const result: string[] = []
  let currentId = widgetId
  while (true) {
    const next = findNorthNeighbor(layout, currentId)
    if (!next || result.includes(next.id)) break
    result.push(next.id)
    currentId = next.id
  }
  return result
}



function syncEastColumnStackHorizontalShift(
  frames: Record<string, WidgetLiveFrame>,
  startFrames: Record<string, WidgetLiveFrame>,
  columnStackIds: string[],
  primaryId: string,
  excludedIds: string[],
) {
  const primary = frames[primaryId]
  const startPrimary = startFrames[primaryId]
  if (!primary || !startPrimary) return

  const deltaLeft = primary.left - startPrimary.left
  const deltaWidth = primary.width - startPrimary.width
  if (deltaLeft === 0 && deltaWidth === 0) return

  for (const id of columnStackIds) {
    if (id === primaryId || excludedIds.includes(id)) continue
    const frame = frames[id] ?? startFrames[id]
    if (!frame) continue
    frames[id] = {
      ...frame,
      left: frame.left + deltaLeft,
      width: frame.width + deltaWidth,
    }
  }
}

function WidgetSlot({

  item,

  liveFrame,

  reorderable,

  dragging,

  dropHighlight,

  resizing,

  onMoveStart,

  onResizeStart,

  onOpenSettings,

  settling,

  children,

}: {

  item: WidgetLayoutItem

  liveFrame: WidgetLiveFrame | null

  reorderable: boolean

  dragging: boolean

  dropHighlight: WidgetDropHighlightMode | null

  resizing: boolean

  settling: boolean

  onMoveStart: (event: ReactPointerEvent) => void

  onResizeStart: (edge: ResizeEdge, event: ReactMouseEvent) => void

  onOpenSettings: (anchor: HTMLElement) => void

  children: ReactNode

}) {

  const slotRef = useRef<HTMLDivElement>(null)



  const slotStyle = liveFrame

    ? {

        position: 'absolute' as const,

        left: liveFrame.left,

        top: liveFrame.top,

        width: liveFrame.width,

        height: liveFrame.height,

        zIndex: dragging ? 20 : 12,

      }

    : {

        gridColumn: `${item.col + 1} / span ${item.colSpan}`,

        gridRow: `${item.row + 1} / span ${item.rowSpan}`,

      }



  return (

    <div

      ref={slotRef}

      className={`widget-slot${reorderable ? ' widget-slot--reorderable' : ''}${

        resizing ? ' widget-slot--resizing' : ''

      }${dragging ? ' widget-slot--dragging' : ''}${
        settling ? ' widget-slot--settling' : ''
      }${
        dropHighlight === 'swap' ? ' widget-slot--drop-swap' : ''
      }${dropHighlight === 'stack-below' ? ' widget-slot--drop-stack-below' : ''}${
        dropHighlight === 'stack-above' ? ' widget-slot--drop-stack-above' : ''
      }${dropHighlight === 'place-beside-left' ? ' widget-slot--drop-beside-left' : ''}${
        dropHighlight === 'place-beside-right' ? ' widget-slot--drop-beside-right' : ''
      }`}

      style={slotStyle}

      data-widget-id={item.id}

    >

      {reorderable && (
        <button
          type="button"
          className="widget-move-edge"
          title="Drag to move · left/right edge of another widget for a new column · top/bottom to stack"
          aria-label={`Move ${getWidgetLabel(item.id)}`}
          onPointerDown={onMoveStart}
        />
      )}
      <div className="widget-slot-toolbar">
        <button
          type="button"
          className="widget-settings-btn"
          title="Widget options"
          aria-label={`${getWidgetLabel(item.id)} options`}
          onClick={(event) => {
            event.stopPropagation()
            onOpenSettings(event.currentTarget)
          }}
        >
          ⋯
        </button>
      </div>

      <div className="widget-slot-body">{children}</div>

      <button type="button" className="widget-resize-handle widget-resize-handle--w" title="Resize from left edge" aria-label={`Resize ${getWidgetLabel(item.id)} from left`} onMouseDown={(event) => onResizeStart('w', event)} />
      <button type="button" className="widget-resize-handle widget-resize-handle--e" title="Resize from right edge" aria-label={`Resize ${getWidgetLabel(item.id)} from right`} onMouseDown={(event) => onResizeStart('e', event)} />
      <button type="button" className="widget-resize-handle widget-resize-handle--n" title="Resize from top edge" aria-label={`Resize ${getWidgetLabel(item.id)} from top`} onMouseDown={(event) => onResizeStart('n', event)} />
      <button type="button" className="widget-resize-handle widget-resize-handle--s" title="Resize from bottom edge" aria-label={`Resize ${getWidgetLabel(item.id)} from bottom`} onMouseDown={(event) => onResizeStart('s', event)} />
      <button type="button" className="widget-resize-handle widget-resize-handle--nw" title="Resize corner" aria-label={`Resize ${getWidgetLabel(item.id)} top-left`} onMouseDown={(event) => onResizeStart('nw', event)} />
      <button type="button" className="widget-resize-handle widget-resize-handle--ne" title="Resize corner" aria-label={`Resize ${getWidgetLabel(item.id)} top-right`} onMouseDown={(event) => onResizeStart('ne', event)} />
      <button type="button" className="widget-resize-handle widget-resize-handle--sw" title="Resize corner" aria-label={`Resize ${getWidgetLabel(item.id)} bottom-left`} onMouseDown={(event) => onResizeStart('sw', event)} />
      <button type="button" className="widget-resize-handle widget-resize-handle--se" title="Resize corner" aria-label={`Resize ${getWidgetLabel(item.id)} bottom-right`} onMouseDown={(event) => onResizeStart('se', event)} />

    </div>

  )

}



export function WidgetGrid({ pageId, widgets }: WidgetGridProps) {

  const { layout, setVisible, setWidgetRects, resetLayout } = useWidgetLayout(pageId)

  const canvasRef = useRef<HTMLDivElement>(null)

  const [draggingId, setDraggingId] = useState<string | null>(null)

  const [dropHint, setDropHint] = useState<{
    targetId: string | null
    mode: WidgetDropHighlightMode | null
    label: string
  }>({ targetId: null, mode: null, label: '' })

  const [settings, setSettings] = useState<SettingsState | null>(null)

  const [liveFrames, setLiveFrames] = useState<Record<string, WidgetLiveFrame>>({})

  const [resizingIds, setResizingIds] = useState<string[]>([])

  const [settling, setSettling] = useState(false)

  const customizable = isLayoutCustomizable(pageId)

  const visible = layout.filter((item) => item.visible)

  const hidden = layout.filter((item) => !item.visible).sort((a, b) => a.order - b.order)

  const reorderable = customizable && visible.length > 1

  const rowCount = Math.max(getGridRowCount(layout), 10)



  const finishDrag = (keepFrames = false) => {
    setDraggingId(null)
    setDropHint({ targetId: null, mode: null, label: '' })
    if (!keepFrames) {
      setLiveFrames({})
      setSettling(false)
    }
    document.body.classList.remove('widget-canvas-dragging')
  }



  const clearLiveResize = () => {

    setLiveFrames({})

    setResizingIds([])

    document.body.classList.remove('widget-canvas-resizing')

  }



  const startWidgetMove = (widgetId: string, event: ReactPointerEvent) => {
    if (event.button !== 0) return
    event.preventDefault()
    event.stopPropagation()

    const canvas = canvasRef.current
    if (!canvas) return

    const primaryItem = layout.find((item) => item.id === widgetId)
    if (!primaryItem) return

    const canvasRect = canvas.getBoundingClientRect()
    const layoutSnapshot = visible.map((entry) => ({ ...entry, ...getItemRect(entry) }))
    const dragged = layoutSnapshot.find((item) => item.id === widgetId)
    if (!dragged) return

    const pointerId = event.pointerId
    let pendingIntent: ReturnType<typeof computeWidgetDropPreview>['intent'] = null
    let rafId = 0

    document.body.classList.add('widget-canvas-dragging')
    setDraggingId(widgetId)

    const applyPreview = (pointerX: number, pointerY: number) => {
      const preview = computeWidgetDropPreview(
        layoutSnapshot,
        widgetId,
        rowCount,
        pointerX,
        pointerY,
        canvasRect.left,
        canvasRect.top,
        canvasRect.width,
        canvasRect.height,
      )
      pendingIntent = preview.intent
      setDropHint({
        targetId: preview.highlightId,
        mode: preview.highlightMode,
        label: preview.label,
      })
      const alignedRects = alignStackedColumnWidgets(layoutSnapshot, preview.rects)
      setLiveFrames(
        rectsToLiveFrames(
          alignedRects,
          canvasRect.width,
          canvasRect.height,
          rowCount,
        ),
      )
    }

    applyPreview(event.clientX, event.clientY)

    const onMove = (moveEvent: PointerEvent) => {
      if (moveEvent.pointerId !== pointerId) return
      if (rafId) return
      rafId = window.requestAnimationFrame(() => {
        rafId = 0
        applyPreview(moveEvent.clientX, moveEvent.clientY)
      })
    }

    const onUp = (upEvent: PointerEvent) => {
      if (upEvent.pointerId !== pointerId) return
      if (rafId) {
        window.cancelAnimationFrame(rafId)
        rafId = 0
      }
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)

      applyPreview(upEvent.clientX, upEvent.clientY)

      if (pendingIntent) {
        const rects = alignStackedColumnWidgets(
          layoutSnapshot,
          applyWidgetDropIntent(layoutSnapshot, widgetId, pendingIntent, rowCount),
        )
        const finalFrames = rectsToLiveFrames(
          rects,
          canvasRect.width,
          canvasRect.height,
          rowCount,
        )
        setLiveFrames(finalFrames)
        setWidgetRects(rects)
        setDraggingId(null)
        setDropHint({ targetId: null, mode: null, label: '' })
        setSettling(true)
        window.setTimeout(() => {
          setLiveFrames({})
          setSettling(false)
          document.body.classList.remove('widget-canvas-dragging')
        }, 320)
      } else {
        finishDrag()
      }
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
  }



  const startResize = (

    primaryId: string,

    edge: ResizeEdge,

    event: ReactMouseEvent,

    coupling: ResizeCoupling = {},

  ) => {

    event.preventDefault()

    event.stopPropagation()



    const canvas = canvasRef.current

    if (!canvas) return



    const primaryItem = layout.find((item) => item.id === primaryId)

    if (!primaryItem) return



    const resizeIds = collectCoupledWidgetIds(primaryId, coupling)

    const layoutSnapshot = visible.map((entry) => ({ ...entry, ...getItemRect(entry) }))
    const eastStack = layoutToStacks(layoutSnapshot).find((stack: ColumnStack) =>
      stack.widgetIds.includes(primaryId),
    )
    const columnStackIds = eastStack?.widgetIds ?? [primaryId]
    const westExcludedIds = [
      coupling.westNeighborId,
      ...(coupling.westNeighborIds ?? []),
    ].filter((id): id is string => Boolean(id))

    const canvasRect = canvas.getBoundingClientRect()

    const colUnit = canvasRect.width / GRID_COLUMNS

    const rowUnit = canvasRect.height / rowCount

    const minPrimaryWidth = MIN_COL_SPAN * colUnit

    const minPrimaryHeight = Math.max(MIN_ROW_SPAN * rowUnit, MIN_WIDGET_HEIGHT)

    const minNeighborWidth = MIN_COL_SPAN * colUnit

    const minNeighborHeight = Math.max(MIN_ROW_SPAN * rowUnit, MIN_WIDGET_HEIGHT)

    const startX = event.clientX

    const startY = event.clientY

    const startPrimary = getItemRect(primaryItem)

    const startFrames = captureWidgetFrames(canvas, resizeIds)

    let latestFrames = { ...startFrames }



    const maxWidth =

      maxEastColSpan(

        visible.map((entry) => ({ ...entry, ...getItemRect(entry) })),

        startPrimary,

        primaryId,

      ) * colUnit

    const maxHeight =

      maxSouthRowSpan(

        visible.map((entry) => ({ ...entry, ...getItemRect(entry) })),

        startPrimary,

        primaryId,

      ) * rowUnit



    document.body.classList.add('widget-canvas-resizing')

    setResizingIds(resizeIds)



    const onMove = (moveEvent: MouseEvent) => {

      const deltaX =
        edge === 'e' || edge === 'se' || edge === 'ne'
          ? moveEvent.clientX - startX
          : edge === 'w' || edge === 'sw' || edge === 'nw'
            ? moveEvent.clientX - startX
            : 0

      const deltaY =
        edge === 's' || edge === 'se' || edge === 'sw'
          ? moveEvent.clientY - startY
          : edge === 'n' || edge === 'nw' || edge === 'ne'
            ? moveEvent.clientY - startY
            : 0

      const nextFrames = { ...startFrames }



      if (coupling.eastNeighborIds?.length) {
        applyEastColumnShiftFrames(
          nextFrames,
          primaryId,
          coupling.eastNeighborIds,
          deltaX,
          minPrimaryWidth,
          minNeighborWidth,
        )
      } else if (coupling.eastNeighborId) {
        applyEastCoupledFrames(
          nextFrames,
          primaryId,
          coupling.eastNeighborId,
          deltaX,
          minPrimaryWidth,
          minNeighborWidth,
        )
      }

      if (coupling.westNeighborIds?.length) {
        applyWestColumnShiftFrames(
          nextFrames,
          primaryId,
          coupling.westNeighborIds,
          deltaX,
          minPrimaryWidth,
          minNeighborWidth,
        )
      } else if (coupling.westNeighborId) {

        applyWestCoupledFrames(

          nextFrames,

          primaryId,

          coupling.westNeighborId,

          deltaX,

          minPrimaryWidth,

          minNeighborWidth,

        )

      }



      if (coupling.southNeighborIds?.length) {
        applySouthCoupledChainFrames(
          nextFrames,
          startFrames,
          primaryId,
          coupling.southNeighborIds,
          deltaY,
          minPrimaryHeight,
          minNeighborHeight,
        )
      } else if (coupling.southNeighborId) {

        applySouthCoupledFrames(

          nextFrames,

          primaryId,

          coupling.southNeighborId,

          deltaY,

          minPrimaryHeight,

          minNeighborHeight,

        )

      }



      if (coupling.northNeighborIds?.length) {
        applyNorthCoupledChainFrames(
          nextFrames,
          startFrames,
          primaryId,
          coupling.northNeighborIds,
          deltaY,
          minPrimaryHeight,
          minNeighborHeight,
        )
      } else if (coupling.northNeighborId) {

        applyNorthCoupledFrames(

          nextFrames,

          primaryId,

          coupling.northNeighborId,

          deltaY,

          minPrimaryHeight,

          minNeighborHeight,

        )

      }



      if (
        !coupling.eastNeighborId &&
        !coupling.eastNeighborIds?.length &&
        (edge === 'e' || edge === 'se' || edge === 'ne')
      ) {

        const primary = startFrames[primaryId]

        if (primary) {

          const width = Math.max(minPrimaryWidth, Math.min(maxWidth, primary.width + deltaX))

          nextFrames[primaryId] = { ...primary, width }

        }

      }



      if (
        !coupling.westNeighborId &&
        !coupling.westNeighborIds?.length &&
        (edge === 'w' || edge === 'sw' || edge === 'nw')
      ) {

        const primary = startFrames[primaryId]

        if (primary) {

          const width = Math.max(minPrimaryWidth, Math.min(maxWidth, primary.width - deltaX))

          const left = primary.left + (primary.width - width)

          nextFrames[primaryId] = { ...primary, left, width }

        }

      }



      if (!coupling.southNeighborId && (edge === 's' || edge === 'se' || edge === 'sw')) {

        const primary = nextFrames[primaryId] ?? startFrames[primaryId]

        if (primary) {

          const height = Math.max(minPrimaryHeight, Math.min(maxHeight, primary.height + deltaY))

          nextFrames[primaryId] = { ...primary, height }

        }

      }



      if (!coupling.northNeighborId && (edge === 'n' || edge === 'nw' || edge === 'ne')) {

        const primary = nextFrames[primaryId] ?? startFrames[primaryId]

        if (primary) {

          const height = Math.max(minPrimaryHeight, Math.min(maxHeight, primary.height - deltaY))

          const top = primary.top + (primary.height - height)

          nextFrames[primaryId] = { ...primary, top, height }

        }

      }



      if (deltaX !== 0 && columnStackIds.length > 1) {
        syncEastColumnStackHorizontalShift(
          nextFrames,
          startFrames,
          columnStackIds,
          primaryId,
          westExcludedIds,
        )
      }

      const rawRects = framesToWidgetRects(
        nextFrames,
        canvasRect.width,
        canvasRect.height,
        rowCount,
      )
      const resizedLayoutSnapshot = layoutSnapshot.map((entry) => ({
        ...entry,
        ...(rawRects[entry.id] ?? {}),
      }))
      const packedRects = stacksToRectsFromLayout(
        resizedLayoutSnapshot,
        layoutToStacks(resizedLayoutSnapshot),
        rowCount,
      )
      const alignedRects = alignStackedColumnWidgets(layoutSnapshot, packedRects)
      latestFrames = rectsToLiveFrames(
        alignedRects,
        canvasRect.width,
        canvasRect.height,
        rowCount,
      )

      setLiveFrames(latestFrames)

    }



    const onUp = () => {

      window.removeEventListener('mousemove', onMove)

      window.removeEventListener('mouseup', onUp)

      const rawRects = framesToWidgetRects(
        latestFrames,
        canvasRect.width,
        canvasRect.height,
        rowCount,
      )
      const layoutSnapshot = visible.map((entry) => ({ ...entry, ...getItemRect(entry) }))
      const resizedLayoutSnapshot = layoutSnapshot.map((entry) => ({
        ...entry,
        ...(rawRects[entry.id] ?? {}),
      }))
      const packedRects = stacksToRectsFromLayout(
        resizedLayoutSnapshot,
        layoutToStacks(resizedLayoutSnapshot),
        rowCount,
      )
      const nextRects = alignStackedColumnWidgets(layoutSnapshot, packedRects)

      setWidgetRects(nextRects)

      clearLiveResize()

    }



    window.addEventListener('mousemove', onMove)

    window.addEventListener('mouseup', onUp)

  }



  const activeSettingsItem = settings

    ? layout.find((item) => item.id === settings.widgetId)

    : undefined



  return (

    <div className="widget-layout">

      <div

        ref={canvasRef}

        className={`widget-grid widget-grid--customizable widget-canvas${
          draggingId ? ' widget-canvas--dragging-layout' : ''
        }${settling ? ' widget-canvas--settling' : ''}`}
        data-page-id={pageId}

        data-row-count={rowCount}

        style={{ gridTemplateRows: `repeat(${rowCount}, minmax(0, 1fr))` }}

      >

        {draggingId && dropHint.label ? (
          <div className="widget-drop-hint" aria-live="polite">
            {dropHint.label}
          </div>
        ) : null}

        {visible.map((item) => {

          const content = widgets[item.id]

          if (!content) return null



          return (

            <WidgetSlot

              key={item.id}

              item={item}

              liveFrame={liveFrames[item.id] ?? null}

              reorderable={reorderable}

              dragging={draggingId === item.id}

              dropHighlight={
                dropHint.targetId === item.id ? dropHint.mode : null
              }

              resizing={resizingIds.includes(item.id)}

              settling={settling}

              onMoveStart={(event) => startWidgetMove(item.id, event)}

              onResizeStart={(edge, event) => {

                const layoutSnapshot = visible.map((entry) => ({ ...entry, ...getItemRect(entry) }))

                const eastNeighbors = findEastNeighbors(layoutSnapshot, item.id)

                const westNeighbors = findWestNeighbors(layoutSnapshot, item.id)

                const southNeighborChain = buildSouthNeighborChain(layoutSnapshot, item.id)
                const northNeighborChain = buildNorthNeighborChain(layoutSnapshot, item.id)
                const southNeighbor = southNeighborChain[0]
                  ? { id: southNeighborChain[0]! }
                  : null
                const northNeighbor = northNeighborChain[0]
                  ? { id: northNeighborChain[0]! }
                  : null

                const eastCoupling = eastCouplingFromNeighbors(eastNeighbors)

                const westCoupling = westCouplingFromNeighbors(westNeighbors)



                if (edge === 'se' || edge === 'sw' || edge === 'ne' || edge === 'nw') {

                  startResize(item.id, edge, event, {

                    ...(edge === 'se' || edge === 'ne' ? eastCoupling : {}),

                    ...(edge === 'sw' || edge === 'nw' ? westCoupling : {}),

                    southNeighborId: edge === 'se' || edge === 'sw' ? southNeighbor?.id : undefined,
                    southNeighborIds: edge === 'se' || edge === 'sw' ? southNeighborChain : undefined,

                    northNeighborId: edge === 'ne' || edge === 'nw' ? northNeighbor?.id : undefined,
                    northNeighborIds: edge === 'ne' || edge === 'nw' ? northNeighborChain : undefined,

                  })

                  return

                }



                if (edge === 'e' && eastNeighbors.length > 0) {

                  startResize(item.id, edge, event, eastCoupling)

                  return

                }



                if (edge === 'w' && westNeighbors.length > 0) {

                  startResize(item.id, edge, event, westCoupling)

                  return

                }



                if (edge === 's' && southNeighbor) {

                  startResize(item.id, edge, event, {
                    southNeighborId: southNeighbor.id,
                    southNeighborIds: southNeighborChain,
                  })

                  return

                }



                if (edge === 'n' && northNeighbor) {

                  startResize(item.id, edge, event, {
                    northNeighborId: northNeighbor.id,
                    northNeighborIds: northNeighborChain,
                  })

                  return

                }



                startResize(item.id, edge, event)

              }}

              onOpenSettings={(anchor) =>

                setSettings({ widgetId: item.id, anchorRect: anchor.getBoundingClientRect() })

              }

            >

              {content}

            </WidgetSlot>

          )

        })}

      </div>



      {hidden.length > 0 && (

        <div className="widget-hidden-tray">

          <p className="widget-hidden-title">Hidden widgets</p>

          <div className="widget-hidden-list">

            {hidden.map((item) => (

              <button

                key={item.id}

                type="button"

                className="btn-secondary btn-tiny"

                onClick={() => setVisible(item.id, true)}

              >

                + {getWidgetLabel(item.id)}

              </button>

            ))}

          </div>

        </div>

      )}



      {settings && activeSettingsItem && (

        <>

          <button

            type="button"

            className="widget-settings-backdrop"

            aria-label="Close widget options"

            onClick={() => setSettings(null)}

          />

          <WidgetSettingsMenu

            widgetId={settings.widgetId}

            anchorRect={settings.anchorRect}

            onHide={() => {

              setVisible(settings.widgetId, false)

              setSettings(null)

            }}

            onResetLayout={resetLayout}

            onClose={() => setSettings(null)}

          />

        </>

      )}

    </div>

  )

}


