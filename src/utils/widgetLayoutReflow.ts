import {
  GRID_COLUMNS,
  MIN_ROW_SPAN,
  clampWidgetRect,
  rowsOverlap,
  type WidgetLayoutItem,
  type WidgetRect,
} from './widgetLayout'

export type LayoutWidget = Pick<
  WidgetLayoutItem,
  'id' | 'visible' | 'col' | 'colSpan' | 'row' | 'rowSpan'
>

export type ColumnStack = {
  col: number
  colSpan: number
  widgetIds: string[]
}

export type WidgetDropIntent =
  | { type: 'stack-below'; targetId: string }
  | { type: 'stack-above'; targetId: string }
  | { type: 'swap'; targetId: string }
  | { type: 'place-beside-left'; targetId: string }
  | { type: 'place-beside-right'; targetId: string }

export type WidgetDropHighlightMode =
  | 'swap'
  | 'stack-below'
  | 'stack-above'
  | 'place-beside-left'
  | 'place-beside-right'

export type WidgetDropPreview = {
  intent: WidgetDropIntent | null
  label: string
  rects: Record<string, WidgetRect>
  highlightId: string | null
  highlightMode: WidgetDropHighlightMode | null
}

function visibleWidgets(layout: LayoutWidget[]): LayoutWidget[] {
  return layout.filter((item) => item.visible)
}

export function layoutToStacks(layout: LayoutWidget[]): ColumnStack[] {
  const widgets = visibleWidgets(layout)
  if (widgets.length === 0) return []

  const byCol = new Map<number, LayoutWidget[]>()
  for (const widget of widgets) {
    const group = byCol.get(widget.col) ?? []
    group.push(widget)
    byCol.set(widget.col, group)
  }

  const stacks = [...byCol.entries()]
    .sort(([a], [b]) => a - b)
    .map(([col, group]) => {
      const sorted = [...group].sort((a, b) => a.row - b.row)
      const colSpan = Math.max(...sorted.map((item) => item.colSpan))
      return { col, colSpan, widgetIds: sorted.map((item) => item.id) }
    })

  return normalizeColumnStacks(stacks)
}

export function normalizeColumnStacks(stacks: ColumnStack[]): ColumnStack[] {
  if (stacks.length === 0) return []
  if (stacks.length === 1) {
    return [{ ...stacks[0], col: 0, colSpan: GRID_COLUMNS }]
  }

  const sorted = [...stacks].sort((a, b) => a.col - b.col)
  const totalWeight = sorted.reduce((sum, stack) => sum + stack.colSpan, 0)
  let colCursor = 0
  const normalized: ColumnStack[] = []

  for (let index = 0; index < sorted.length; index += 1) {
    const stack = sorted[index]!
    const isLast = index === sorted.length - 1
    const colSpan = isLast
      ? GRID_COLUMNS - colCursor
      : Math.max(
          24,
          Math.round((stack.colSpan / totalWeight) * GRID_COLUMNS),
        )
    normalized.push({
      ...stack,
      col: colCursor,
      colSpan: isLast ? GRID_COLUMNS - colCursor : colSpan,
    })
    colCursor += normalized[normalized.length - 1]!.colSpan
  }

  return normalized
}

export function stacksToRects(stacks: ColumnStack[], rowCount: number): Record<string, WidgetRect> {
  const normalized = normalizeColumnStacks(stacks)
  const rects: Record<string, WidgetRect> = {}

  for (const stack of normalized) {
    const count = stack.widgetIds.length
    if (count === 0) continue

    let rowCursor = 0
    const baseSpan = Math.floor(rowCount / count)

    for (let index = 0; index < count; index += 1) {
      const widgetId = stack.widgetIds[index]!
      const rowSpan =
        index === count - 1 ? Math.max(MIN_ROW_SPAN, rowCount - rowCursor) : Math.max(MIN_ROW_SPAN, baseSpan)
      rects[widgetId] = clampWidgetRect({
        col: stack.col,
        row: rowCursor,
        colSpan: stack.colSpan,
        rowSpan,
      })
      rowCursor += rowSpan
    }
  }

  return rects
}

export function stacksToRectsFromLayout(
  layout: LayoutWidget[],
  stacks: ColumnStack[],
  rowCount: number,
): Record<string, WidgetRect> {
  const normalized = normalizeColumnStacks(stacks)
  const byId = new Map(layout.map((widget) => [widget.id, widget]))
  const rects: Record<string, WidgetRect> = {}

  for (const stack of normalized) {
    const widgets = stack.widgetIds
      .map((id) => byId.get(id))
      .filter((widget): widget is LayoutWidget => Boolean(widget))

    if (widgets.length === 0) continue

    if (widgets.length === 1) {
      const widget = widgets[0]!
      rects[widget.id] = clampWidgetRect({
        col: stack.col,
        row: 0,
        colSpan: stack.colSpan,
        rowSpan: rowCount,
      })
      continue
    }

    const totalSpan = widgets.reduce((sum, widget) => sum + widget.rowSpan, 0)
    const scale = totalSpan > rowCount ? rowCount / totalSpan : 1
    let rowCursor = 0

    for (let index = 0; index < widgets.length; index += 1) {
      const widget = widgets[index]!
      const isLast = index === widgets.length - 1
      const scaledSpan = Math.max(MIN_ROW_SPAN, Math.round(widget.rowSpan * scale))
      const rowSpan = isLast ? Math.max(MIN_ROW_SPAN, rowCount - rowCursor) : scaledSpan
      rects[widget.id] = clampWidgetRect({
        col: stack.col,
        row: rowCursor,
        colSpan: stack.colSpan,
        rowSpan,
      })
      rowCursor += rowSpan
    }
  }

  return rects
}

export function reflowFillLayout(
  layout: LayoutWidget[],
  rowCount: number,
): Record<string, WidgetRect> {
  return stacksToRects(layoutToStacks(layout), rowCount)
}

function findStackIndex(stacks: ColumnStack[], widgetId: string): {
  stackIndex: number
  widgetIndex: number
} | null {
  for (let stackIndex = 0; stackIndex < stacks.length; stackIndex += 1) {
    const widgetIndex = stacks[stackIndex]!.widgetIds.indexOf(widgetId)
    if (widgetIndex >= 0) return { stackIndex, widgetIndex }
  }
  return null
}

function removeFromStacks(stacks: ColumnStack[], widgetId: string): ColumnStack[] {
  return stacks
    .map((stack) => ({
      ...stack,
      widgetIds: stack.widgetIds.filter((id) => id !== widgetId),
    }))
    .filter((stack) => stack.widgetIds.length > 0)
}

export function applyStackAbove(
  stacks: ColumnStack[],
  draggedId: string,
  targetId: string,
): ColumnStack[] {
  if (draggedId === targetId) return stacks

  let next = removeFromStacks(stacks, draggedId)
  const targetLoc = findStackIndex(next, targetId)
  if (!targetLoc) return stacks

  const targetStack = next[targetLoc.stackIndex]!
  const insertIndex = targetLoc.widgetIndex
  const updatedStack: ColumnStack = {
    ...targetStack,
    widgetIds: [
      ...targetStack.widgetIds.slice(0, insertIndex),
      draggedId,
      ...targetStack.widgetIds.slice(insertIndex),
    ],
  }

  next = [...next]
  next[targetLoc.stackIndex] = updatedStack
  return normalizeColumnStacks(next)
}

export function applyStackBelow(
  stacks: ColumnStack[],
  draggedId: string,
  targetId: string,
): ColumnStack[] {
  if (draggedId === targetId) return stacks

  let next = removeFromStacks(stacks, draggedId)
  const targetLoc = findStackIndex(next, targetId)
  if (!targetLoc) return stacks

  const targetStack = next[targetLoc.stackIndex]!
  const insertIndex = targetLoc.widgetIndex + 1
  const updatedStack: ColumnStack = {
    ...targetStack,
    widgetIds: [
      ...targetStack.widgetIds.slice(0, insertIndex),
      draggedId,
      ...targetStack.widgetIds.slice(insertIndex),
    ],
  }

  next = [...next]
  next[targetLoc.stackIndex] = updatedStack
  return normalizeColumnStacks(next)
}

export function applySwap(stacks: ColumnStack[], draggedId: string, targetId: string): ColumnStack[] {
  if (draggedId === targetId) return stacks

  const draggedLoc = findStackIndex(stacks, draggedId)
  const targetLoc = findStackIndex(stacks, targetId)
  if (!draggedLoc || !targetLoc) return stacks

  const next = stacks.map((stack) => ({ ...stack, widgetIds: [...stack.widgetIds] }))

  if (draggedLoc.stackIndex === targetLoc.stackIndex) {
    const ids = next[draggedLoc.stackIndex]!.widgetIds
    ;[ids[draggedLoc.widgetIndex], ids[targetLoc.widgetIndex]] = [
      ids[targetLoc.widgetIndex]!,
      ids[draggedLoc.widgetIndex]!,
    ]
    return next
  }

  // Cross-column centre swap: move dragged into the target column stack.
  return applyStackBelow(next, draggedId, targetId)
}

export function applyPlaceBeside(
  stacks: ColumnStack[],
  draggedId: string,
  targetId: string,
  side: 'left' | 'right',
): ColumnStack[] {
  if (draggedId === targetId) return stacks

  const draggedLoc = findStackIndex(stacks, draggedId)
  const movingStack =
    draggedLoc && stacks[draggedLoc.stackIndex]!.widgetIds.length > 0
      ? stacks[draggedLoc.stackIndex]!
      : { col: 0, colSpan: 24, widgetIds: [draggedId] }
  const movingIds = [...movingStack.widgetIds]

  let next = stacks
  for (const id of movingIds) {
    next = removeFromStacks(next, id)
  }

  const relocatedTarget = findStackIndex(next, targetId)
  if (!relocatedTarget) return stacks

  const normalized = normalizeColumnStacks(next)
  const targetLoc = findStackIndex(normalized, targetId)
  if (!targetLoc) return stacks

  const targetStack = normalized[targetLoc.stackIndex]!
  const movingColumn: ColumnStack = {
    col: 0,
    colSpan: Math.max(24, movingStack.colSpan || Math.floor(targetStack.colSpan * 0.45)),
    widgetIds: movingIds,
  }

  const insertAt = side === 'left' ? targetLoc.stackIndex : targetLoc.stackIndex + 1
  const result = [...normalized]
  result.splice(insertAt, 0, movingColumn)
  return normalizeColumnStacks(result)
}

function isSameStack(stacks: ColumnStack[], widgetIdA: string, widgetIdB: string): boolean {
  const a = findStackIndex(stacks, widgetIdA)
  const b = findStackIndex(stacks, widgetIdB)
  return Boolean(a && b && a.stackIndex === b.stackIndex)
}

function stackAtPointer(stacks: ColumnStack[], pointerCol: number): ColumnStack | null {
  return (
    stacks.find(
      (stack) => pointerCol >= stack.col && pointerCol < stack.col + stack.colSpan,
    ) ?? null
  )
}

type WidgetHitFrame = {
  id: string
  left: number
  top: number
  width: number
  height: number
  bottom: number
}

function widgetFrameAtPoint(
  layout: LayoutWidget[],
  canvasWidth: number,
  canvasHeight: number,
  rowCount: number,
  clientX: number,
  clientY: number,
  canvasLeft: number,
  canvasTop: number,
  excludeId?: string,
): WidgetHitFrame | null {
  const x = clientX - canvasLeft
  const y = clientY - canvasTop
  const colUnit = canvasWidth / GRID_COLUMNS
  const rowUnit = canvasHeight / rowCount

  for (const item of layout) {
    if (!item.visible || item.id === excludeId) continue
    const left = item.col * colUnit
    const top = item.row * rowUnit
    const width = item.colSpan * colUnit
    const height = item.rowSpan * rowUnit
    if (x >= left && x <= left + width && y >= top && y <= top + height) {
      return { id: item.id, left, top, width, height, bottom: top + height }
    }
  }
  return null
}

function previewFromStacks(
  layout: LayoutWidget[],
  stacks: ColumnStack[],
  rowCount: number,
  intent: WidgetDropIntent,
  label: string,
  highlightId: string,
  highlightMode: WidgetDropHighlightMode,
): WidgetDropPreview {
  return {
    intent,
    label,
    rects: stacksToRectsFromLayout(layout, stacks, rowCount),
    highlightId,
    highlightMode,
  }
}

function widgetAboveInStack(
  stack: ColumnStack,
  layout: LayoutWidget[],
  pointerRow: number,
): string | null {
  const widgets = stack.widgetIds
    .map((id) => layout.find((item) => item.id === id))
    .filter((item): item is LayoutWidget => Boolean(item))
    .sort((a, b) => a.row - b.row)

  let candidate: string | null = null
  for (const widget of widgets) {
    if (widget.row <= pointerRow) candidate = widget.id
    else break
  }
  return candidate
}

/** West column widget spanning the full height of an east column stack (e.g. monthly accruing beside due/receipts). */
export function findCoupledWestColumn(
  layout: LayoutWidget[],
  widgetId: string,
): { westWidgetIds: string[]; eastStack: ColumnStack } | null {
  const stacks = layoutToStacks(layout)
  const loc = findStackIndex(stacks, widgetId)
  if (!loc) return null

  const eastStack = stacks[loc.stackIndex]!
  const eastWidgets = eastStack.widgetIds
    .map((id) => layout.find((item) => item.id === id))
    .filter((item): item is LayoutWidget => Boolean(item))
  if (eastWidgets.length === 0) return null

  const eastRowStart = Math.min(...eastWidgets.map((w) => w.row))
  const eastRowEnd = Math.max(...eastWidgets.map((w) => w.row + w.rowSpan))
  const eastBand: WidgetRect = {
    col: eastStack.col,
    row: eastRowStart,
    colSpan: eastStack.colSpan,
    rowSpan: eastRowEnd - eastRowStart,
  }

  const westWidgetIds = layout
    .filter(
      (other) =>
        other.visible &&
        !eastStack.widgetIds.includes(other.id) &&
        other.col + other.colSpan === eastStack.col &&
        rowsOverlap(other, eastBand) &&
        other.row <= eastRowStart &&
        other.row + other.rowSpan >= eastRowEnd,
    )
    .map((w) => w.id)

  if (westWidgetIds.length === 0) return null
  return { westWidgetIds, eastStack }
}

function redirectHitForCoupledColumn(
  layout: LayoutWidget[],
  draggedId: string,
  hit: WidgetHitFrame,
  pointerRow: number,
  colUnit: number,
  rowUnit: number,
): WidgetHitFrame {
  const couple = findCoupledWestColumn(layout, draggedId)
  if (!couple || !couple.westWidgetIds.includes(hit.id)) return hit

  const anchorId =
    widgetAboveInStack(couple.eastStack, layout, pointerRow) ?? couple.eastStack.widgetIds[0]!
  const anchor = layout.find((item) => item.id === anchorId)
  if (!anchor) return hit

  return {
    id: anchorId,
    left: anchor.col * colUnit,
    top: anchor.row * rowUnit,
    width: anchor.colSpan * colUnit,
    height: anchor.rowSpan * rowUnit,
    bottom: (anchor.row + anchor.rowSpan) * rowUnit,
  }
}

export function computeWidgetDropPreview(
  layout: LayoutWidget[],
  draggedId: string,
  rowCount: number,
  clientX: number,
  clientY: number,
  canvasLeft: number,
  canvasTop: number,
  canvasWidth: number,
  canvasHeight: number,
): WidgetDropPreview {
  const stacks = layoutToStacks(layout)
  const colUnit = canvasWidth / GRID_COLUMNS
  const rowUnit = canvasHeight / rowCount
  const pointerCol = Math.max(0, Math.min(GRID_COLUMNS - 1, Math.floor((clientX - canvasLeft) / colUnit)))
  const pointerRow = Math.max(0, Math.floor((clientY - canvasTop) / rowUnit))

  let hit = widgetFrameAtPoint(
    layout,
    canvasWidth,
    canvasHeight,
    rowCount,
    clientX,
    clientY,
    canvasLeft,
    canvasTop,
    draggedId,
  )

  const couple = findCoupledWestColumn(layout, draggedId)
  const westHit = Boolean(couple && hit && couple.westWidgetIds.includes(hit.id))

  if (westHit && hit && couple) {
    const relXOnWest = (clientX - canvasLeft - hit.left) / hit.width
    if (relXOnWest <= 0.28) {
      const nextStacks = applyPlaceBeside(stacks, draggedId, hit.id, 'left')
      return previewFromStacks(
        layout,
        nextStacks,
        rowCount,
        { type: 'place-beside-left', targetId: hit.id },
        'Move column beside attached widget',
        hit.id,
        'place-beside-left',
      )
    }
    hit = redirectHitForCoupledColumn(layout, draggedId, hit, pointerRow, colUnit, rowUnit)
  }

  if (hit) {
    const relativeX = (clientX - canvasLeft - hit.left) / hit.width
    const relativeY = (clientY - canvasTop - hit.top) / hit.height
    const sameStack = isSameStack(stacks, draggedId, hit.id)

    if (!sameStack) {
      if (relativeX <= 0.22) {
        const nextStacks = applyPlaceBeside(stacks, draggedId, hit.id, 'left')
        return previewFromStacks(
          layout,
          nextStacks,
          rowCount,
          { type: 'place-beside-left', targetId: hit.id },
          'Place in column to the left',
          hit.id,
          'place-beside-left',
        )
      }
      if (relativeX >= 0.78) {
        const nextStacks = applyPlaceBeside(stacks, draggedId, hit.id, 'right')
        return previewFromStacks(
          layout,
          nextStacks,
          rowCount,
          { type: 'place-beside-right', targetId: hit.id },
          'Place in column to the right',
          hit.id,
          'place-beside-right',
        )
      }
      if (relativeY <= 0.38) {
        const nextStacks = applyStackAbove(stacks, draggedId, hit.id)
        return previewFromStacks(
          layout,
          nextStacks,
          rowCount,
          { type: 'stack-above', targetId: hit.id },
          'Stack in this column (above)',
          hit.id,
          'stack-above',
        )
      }
      if (relativeY >= 0.62) {
        const nextStacks = applyStackBelow(stacks, draggedId, hit.id)
        return previewFromStacks(
          layout,
          nextStacks,
          rowCount,
          { type: 'stack-below', targetId: hit.id },
          'Stack in this column (below)',
          hit.id,
          'stack-below',
        )
      }

      const nextStacks = applyStackBelow(stacks, draggedId, hit.id)
      return previewFromStacks(
        layout,
        nextStacks,
        rowCount,
        { type: 'stack-below', targetId: hit.id },
        'Move into this column',
        hit.id,
        'stack-below',
      )
    }

    if (relativeY <= 0.42) {
      const nextStacks = applyStackAbove(stacks, draggedId, hit.id)
      return previewFromStacks(
        layout,
        nextStacks,
        rowCount,
        { type: 'stack-above', targetId: hit.id },
        'Place above',
        hit.id,
        'stack-above',
      )
    }
    if (relativeY >= 0.58) {
      const nextStacks = applyStackBelow(stacks, draggedId, hit.id)
      return previewFromStacks(
        layout,
        nextStacks,
        rowCount,
        { type: 'stack-below', targetId: hit.id },
        'Place below',
        hit.id,
        'stack-below',
      )
    }

    const nextStacks = applySwap(stacks, draggedId, hit.id)
    return previewFromStacks(
      layout,
      nextStacks,
      rowCount,
      { type: 'swap', targetId: hit.id },
      'Swap order',
      hit.id,
      'swap',
    )
  }

  const stack = stackAtPointer(stacks, pointerCol)
  if (stack) {
    const stackLeftPx = stack.col * colUnit
    const relXInStack = (clientX - canvasLeft - stackLeftPx) / (stack.colSpan * colUnit)
    const draggedLoc = findStackIndex(stacks, draggedId)
    const anchorId = stack.widgetIds[0]
    const anchorLoc = anchorId ? findStackIndex(stacks, anchorId) : null

    if (draggedLoc && anchorLoc && draggedLoc.stackIndex !== anchorLoc.stackIndex && anchorId) {
      if (relXInStack <= 0.2) {
        const nextStacks = applyPlaceBeside(stacks, draggedId, anchorId, 'left')
        return previewFromStacks(
          layout,
          nextStacks,
          rowCount,
          { type: 'place-beside-left', targetId: anchorId },
          'Place in column to the left',
          anchorId,
          'place-beside-left',
        )
      }
      if (relXInStack >= 0.8) {
        const nextStacks = applyPlaceBeside(stacks, draggedId, anchorId, 'right')
        return previewFromStacks(
          layout,
          nextStacks,
          rowCount,
          { type: 'place-beside-right', targetId: anchorId },
          'Place in column to the right',
          anchorId,
          'place-beside-right',
        )
      }
    }

    const aboveId = widgetAboveInStack(stack, layout, pointerRow)
    if (aboveId && aboveId !== draggedId) {
      const nextStacks = applyStackBelow(stacks, draggedId, aboveId)
      return previewFromStacks(
        layout,
        nextStacks,
        rowCount,
        { type: 'stack-below', targetId: aboveId },
        'Place below',
        aboveId,
        'stack-below',
      )
    }
  }

  const idleRects = stacksToRectsFromLayout(layout, stacks, rowCount)
  return {
    intent: null,
    label: '',
    rects: idleRects,
    highlightId: null,
    highlightMode: null,
  }
}

export function applyWidgetDropIntent(
  layout: LayoutWidget[],
  draggedId: string,
  intent: WidgetDropIntent,
  rowCount: number,
): Record<string, WidgetRect> {
  const stacks = layoutToStacks(layout)
  let nextStacks: ColumnStack[]
  switch (intent.type) {
    case 'stack-below':
      nextStacks = applyStackBelow(stacks, draggedId, intent.targetId)
      break
    case 'stack-above':
      nextStacks = applyStackAbove(stacks, draggedId, intent.targetId)
      break
    case 'place-beside-left':
      nextStacks = applyPlaceBeside(stacks, draggedId, intent.targetId, 'left')
      break
    case 'place-beside-right':
      nextStacks = applyPlaceBeside(stacks, draggedId, intent.targetId, 'right')
      break
    default:
      nextStacks = applySwap(stacks, draggedId, intent.targetId)
  }
  return stacksToRectsFromLayout(layout, nextStacks, rowCount)
}

export function rectsToLiveFrames(
  rects: Record<string, WidgetRect>,
  canvasWidth: number,
  canvasHeight: number,
  rowCount: number,
): Record<string, { left: number; top: number; width: number; height: number }> {
  const colUnit = canvasWidth / GRID_COLUMNS
  const rowUnit = canvasHeight / rowCount
  const frames: Record<string, { left: number; top: number; width: number; height: number }> = {}
  for (const [id, rect] of Object.entries(rects)) {
    frames[id] = {
      left: rect.col * colUnit,
      top: rect.row * rowUnit,
      width: rect.colSpan * colUnit,
      height: rect.rowSpan * rowUnit,
    }
  }
  return frames
}
