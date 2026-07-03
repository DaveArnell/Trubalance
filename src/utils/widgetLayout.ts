import type { PageId } from '../navigation'

export type WidgetTextScale = 'compact' | 'normal' | 'comfortable'

/** Visual scale for all widget content (0.55–1). */
export type WidgetContentZoom = number

/** @deprecated */
export type WidgetSize = 'compact' | 'standard' | 'expanded'

export interface WidgetLayoutItem {
  id: string
  visible: boolean
  order: number
  /** 0-based grid column */
  col: number
  /** 0-based grid row */
  row: number
  colSpan: number
  rowSpan: number
  /** @deprecated migrated to contentZoom */
  textScale?: WidgetTextScale
  contentZoom: WidgetContentZoom
  /** @deprecated migrated to rowSpan */
  heightPx?: number | null
}

export type PageWidgetLayout = WidgetLayoutItem[]

const STORAGE_KEY = 'trubalance-widget-layout-v5'
const LEGACY_STORAGE_KEYS = [
  'trubalance-widget-layout-v4',
  'trubalance-widget-layout-v3',
  'trubalance-widget-layout-v2',
  'trubalance-widget-layout-v1',
] as const

export const GRID_COLUMNS = 96
/** Legacy 12-column layouts are multiplied by this on load. */
export const GRID_SCALE = 8
export const MIN_COL_SPAN = 24
export const MIN_ROW_SPAN = 2
export const MIN_WIDGET_HEIGHT = 120

export const WIDGET_LABELS: Record<string, string> = {
  'account-balances': 'Account balances',
  'reserve-status': 'Reserve accounts',
  'trends-chart': 'Trend chart',
  'trends-history': 'Balance history',
  'forecast-cash-outlook': 'Cash outlook',
  'forecast-projection': 'Trend projection',
  history: 'History',
  'committed-funds': 'Monthly accruing',
  due: 'Due',
  'expected-receipts': 'Expected receipts',
  'reserve-planner': 'Reserve planner',
  settings: 'Organisation',
  'company-vault': 'Company references',
  'business-diary': 'Business diary',
}

export const PAGE_WIDGET_IDS: Record<PageId, string[]> = {
  'committed-funds': ['committed-funds', 'due', 'expected-receipts'],
  trends: ['trends-chart', 'trends-history'],
  forecast: ['forecast-cash-outlook', 'forecast-projection'],
  history: ['history'],
  'reserve-planner': ['reserve-planner'],
  'business-hub': ['company-vault', 'business-diary'],
  settings: ['settings'],
}

type GridDefaults = Pick<WidgetLayoutItem, 'col' | 'row' | 'colSpan' | 'rowSpan'>

const TRENDS_CHART_ROW_SPAN = 10
const TRENDS_HISTORY_ROW_SPAN = 10

const DEFAULT_GRID: Record<string, GridDefaults> = {
  'reserve-status': { col: 0, row: 0, colSpan: 96, rowSpan: 10 },
  'trends-chart': { col: 0, row: 0, colSpan: 58, rowSpan: TRENDS_CHART_ROW_SPAN },
  'trends-history': { col: 58, row: 0, colSpan: 38, rowSpan: TRENDS_HISTORY_ROW_SPAN },
  'forecast-cash-outlook': { col: 0, row: 0, colSpan: 58, rowSpan: 10 },
  'forecast-projection': { col: 58, row: 0, colSpan: 38, rowSpan: 10 },
  history: { col: 0, row: 0, colSpan: 96, rowSpan: 10 },
  'committed-funds': { col: 0, row: 0, colSpan: 40, rowSpan: 10 },
  due: { col: 40, row: 0, colSpan: 56, rowSpan: 5 },
  'expected-receipts': { col: 40, row: 5, colSpan: 56, rowSpan: 5 },
  'reserve-planner': { col: 0, row: 0, colSpan: 96, rowSpan: 10 },
  settings: { col: 0, row: 0, colSpan: 96, rowSpan: 10 },
  'company-vault': { col: 0, row: 0, colSpan: 46, rowSpan: 10 },
  'business-diary': { col: 46, row: 0, colSpan: 50, rowSpan: 10 },
}

function defaultItem(id: string, order: number): WidgetLayoutItem {
  const grid = DEFAULT_GRID[id] ?? { col: 0, row: 0, colSpan: 96, rowSpan: 4 }
  return {
    id,
    visible: true,
    order,
    ...grid,
    contentZoom: 1,
  }
}

const DEFAULT_LAYOUTS: Record<PageId, PageWidgetLayout> = {
  trends: [defaultItem('trends-chart', 0), defaultItem('trends-history', 1)],
  forecast: [defaultItem('forecast-cash-outlook', 0), defaultItem('forecast-projection', 1)],
  history: [defaultItem('history', 0)],
  'committed-funds': [
    defaultItem('committed-funds', 0),
    defaultItem('due', 1),
    defaultItem('expected-receipts', 2),
  ],
  'reserve-planner': [defaultItem('reserve-planner', 0)],
  'business-hub': [defaultItem('company-vault', 0), defaultItem('business-diary', 1)],
  settings: [defaultItem('settings', 0)],
}

type LegacyItem = Partial<WidgetLayoutItem> & { id: string; size?: WidgetSize }

function hasGridFields(item: LegacyItem): item is LegacyItem & GridDefaults {
  return (
    typeof item.col === 'number' &&
    typeof item.row === 'number' &&
    typeof item.colSpan === 'number' &&
    typeof item.rowSpan === 'number'
  )
}

function normalizeItem(raw: LegacyItem, def: WidgetLayoutItem): WidgetLayoutItem {
  if (hasGridFields(raw)) {
    return {
      id: def.id,
      visible: raw.visible ?? def.visible,
      order: raw.order ?? def.order,
      col: clampCol(raw.col),
      row: Math.max(0, Math.round(raw.row)),
      colSpan: clampColSpan(raw.colSpan, raw.col),
      rowSpan: clampRowSpan(raw.rowSpan),
      contentZoom: 1,
    }
  }

  return { ...def }
}

function migrateToGrid(pageId: PageId, saved: LegacyItem[]): PageWidgetLayout {
  const defaults = DEFAULT_LAYOUTS[pageId]
  return defaults.map((def, index) => {
    const existing = saved.find((item) => item.id === def.id)
    if (!existing) return { ...def, order: index }
    if (hasGridFields(existing)) return { ...normalizeItem(existing, def), order: index }
    return {
      ...def,
      visible: existing.visible ?? def.visible,
      order: index,
      contentZoom: 1,
    }
  })
}

function isLegacy12ColLayout(layout: PageWidgetLayout): boolean {
  if (layout.length === 0) return false
  const maxEdge = Math.max(...layout.map((item) => item.col + item.colSpan))
  return maxEdge <= 12
}

function scaleLayoutToFineGrid(layout: PageWidgetLayout): PageWidgetLayout {
  return layout.map((item) => ({
    ...item,
    col: item.col * GRID_SCALE,
    colSpan: item.colSpan * GRID_SCALE,
  }))
}

function repairPageCollapsedLayout(pageId: PageId, layout: PageWidgetLayout): PageWidgetLayout {
  const visible = layout.filter((item) => item.visible)
  if (visible.length < 2) return layout

  const uniqueCols = new Set(visible.map((item) => item.col))
  if (uniqueCols.size > 1) return layout

  const defaults = DEFAULT_LAYOUTS[pageId]
  return defaults.map((def) => {
    const existing = layout.find((item) => item.id === def.id)
    if (!existing) return { ...def }
    return {
      ...existing,
      col: def.col,
      row: def.row,
      colSpan: def.colSpan,
      rowSpan: def.rowSpan,
    }
  })
}

function repairTrendsLayout(layout: PageWidgetLayout): PageWidgetLayout {
  const next = repairPageCollapsedLayout('trends', layout)

  const chart = next.find((item) => item.id === 'trends-chart' && item.visible)
  const history = next.find((item) => item.id === 'trends-history' && item.visible)
  if (!chart || !history) return next

  const chartDef = DEFAULT_GRID['trends-chart']!
  const historyDef = DEFAULT_GRID['trends-history']!

  // Side-by-side: both widgets should share the full canvas height (never shrink user expansions).
  const sideBySide =
    chart.col === chartDef.col &&
    history.col === historyDef.col &&
    chart.row === chartDef.row &&
    history.row === historyDef.row

  if (!sideBySide) return next

  const fullHeight = Math.max(chart.rowSpan, history.rowSpan, TRENDS_HISTORY_ROW_SPAN)

  return next.map((item) => {
    if (item.id === 'trends-chart' || item.id === 'trends-history') {
      if (item.rowSpan >= fullHeight) return item
      return { ...item, rowSpan: fullHeight }
    }
    return item
  })
}

function repairForecastLayout(layout: PageWidgetLayout): PageWidgetLayout {
  return repairPageCollapsedLayout('forecast', layout)
}

type LayoutGeometry = Pick<WidgetLayoutItem, 'id' | 'visible' | 'col' | 'colSpan' | 'row' | 'rowSpan'>

/** Keep vertically stacked widgets sharing the same column band aligned horizontally. */
export function alignStackedColumnWidgets(
  layout: LayoutGeometry[],
  updates: Record<string, WidgetRect>,
): Record<string, WidgetRect> {
  const visible = layout.filter((item) => item.visible)
  const next: Record<string, WidgetRect> = {}

  for (const item of visible) {
    const patch = updates[item.id]
    next[item.id] = patch
      ? { ...patch }
      : { col: item.col, row: item.row, colSpan: item.colSpan, rowSpan: item.rowSpan }
  }

  let changed = true
  while (changed) {
    changed = false
    const resolved = visible.map((item) => ({ ...item, ...next[item.id]! }))

    for (const item of resolved) {
      const rect = next[item.id]!
      const south = findSouthNeighbor(resolved, item.id)
      if (south) {
        const mate = next[south.id]!
        if (mate.col !== rect.col || mate.colSpan !== rect.colSpan) {
          next[south.id] = { ...mate, col: rect.col, colSpan: rect.colSpan }
          changed = true
        }
      }
      const north = findNorthNeighbor(resolved, item.id)
      if (north) {
        const mate = next[north.id]!
        if (mate.col !== rect.col || mate.colSpan !== rect.colSpan) {
          next[north.id] = { ...mate, col: rect.col, colSpan: rect.colSpan }
          changed = true
        }
      }
    }
  }

  return next
}

function mergeWithDefaults(pageId: PageId, saved: PageWidgetLayout | undefined): PageWidgetLayout {
  const defaults = DEFAULT_LAYOUTS[pageId]
  if (!saved?.length) return defaults.map((item) => ({ ...item }))

  let normalized = saved
  if (isLegacy12ColLayout(saved)) {
    normalized = scaleLayoutToFineGrid(saved)
  }

  const needsGridMigration = normalized.some((item) => !hasGridFields(item as LegacyItem))
  if (needsGridMigration) {
    return migrateToGrid(pageId, normalized as LegacyItem[])
  }

  const defaultIds = new Set(defaults.map((item) => item.id))
  const merged: PageWidgetLayout = []

  for (const def of defaults) {
    const existing = normalized.find((item) => item.id === def.id)
    merged.push(existing ? normalizeItem(existing as LegacyItem, def) : { ...def })
  }

  for (const item of normalized) {
    if (!defaultIds.has(item.id)) merged.push({ ...item })
  }

  const allowedIds = new Set(PAGE_WIDGET_IDS[pageId])

  const sorted = merged
    .filter((item) => allowedIds.has(item.id))
    .sort((a, b) => a.order - b.order)
    .map((item, index) => ({ ...item, order: index }))

  if (pageId === 'trends') return repairTrendsLayout(sorted)
  if (pageId === 'forecast') return repairForecastLayout(sorted)
  return sorted
}

function loadAllLayouts(): Partial<Record<PageId, PageWidgetLayout>> {
  for (const key of [STORAGE_KEY, ...LEGACY_STORAGE_KEYS]) {
    try {
      const raw = localStorage.getItem(key)
      if (!raw) continue
      return JSON.parse(raw) as Partial<Record<PageId, PageWidgetLayout>>
    } catch {
      /* try next */
    }
  }
  return {}
}

export function loadPageWidgetLayout(pageId: PageId): PageWidgetLayout {
  const all = loadAllLayouts()
  return mergeWithDefaults(pageId, all[pageId])
}

export function savePageWidgetLayout(pageId: PageId, layout: PageWidgetLayout) {
  try {
    const all = loadAllLayouts()
    all[pageId] = layout
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  } catch {
    /* ignore quota errors */
  }
}

export function resetPageWidgetLayout(pageId: PageId): PageWidgetLayout {
  const layout = DEFAULT_LAYOUTS[pageId].map((item) => ({ ...item }))
  savePageWidgetLayout(pageId, layout)
  return layout
}

export function getWidgetLabel(widgetId: string) {
  return WIDGET_LABELS[widgetId] ?? widgetId
}

export function isLayoutCustomizable(pageId: PageId) {
  return PAGE_WIDGET_IDS[pageId].length > 0
}

export function clampCol(col: number) {
  return Math.max(0, Math.min(GRID_COLUMNS - MIN_COL_SPAN, Math.round(col)))
}

export function clampColSpan(colSpan: number, col: number) {
  return Math.max(MIN_COL_SPAN, Math.min(GRID_COLUMNS - col, Math.round(colSpan)))
}

export function clampRowSpan(rowSpan: number) {
  return Math.max(MIN_ROW_SPAN, Math.round(rowSpan))
}

export function getGridRowCount(layout: PageWidgetLayout) {
  const visible = layout.filter((item) => item.visible)
  if (visible.length === 0) return 10
  return Math.max(10, ...visible.map((item) => item.row + item.rowSpan))
}

export type WidgetRect = Pick<WidgetLayoutItem, 'col' | 'row' | 'colSpan' | 'rowSpan'>

export function clampWidgetRect(rect: WidgetRect): WidgetRect {
  const col = clampCol(rect.col)
  const colSpan = clampColSpan(rect.colSpan, col)
  const row = Math.max(0, Math.round(rect.row))
  const rowSpan = clampRowSpan(rect.rowSpan)
  return { col, row, colSpan, rowSpan }
}

export function swapWidgetRects(a: WidgetRect, b: WidgetRect): [WidgetRect, WidgetRect] {
  return [b, a]
}

export function rowsOverlap(a: WidgetRect, b: WidgetRect): boolean {
  return a.row < b.row + b.rowSpan && b.row < a.row + a.rowSpan
}

export function colsOverlap(a: WidgetRect, b: WidgetRect): boolean {
  return a.col < b.col + b.colSpan && b.col < a.col + a.colSpan
}

export function findWestNeighbors(
  layout: Pick<WidgetLayoutItem, 'id' | 'visible' | 'col' | 'colSpan' | 'row' | 'rowSpan'>[],
  widgetId: string,
) {
  const item = layout.find((entry) => entry.id === widgetId && entry.visible)
  if (!item) return []
  const westEdge = item.col
  return layout.filter(
    (other) =>
      other.visible &&
      other.id !== widgetId &&
      other.col + other.colSpan === westEdge &&
      rowsOverlap(item, other),
  )
}

export function findWestNeighbor(
  layout: Pick<WidgetLayoutItem, 'id' | 'visible' | 'col' | 'colSpan' | 'row' | 'rowSpan'>[],
  widgetId: string,
) {
  return findWestNeighbors(layout, widgetId)[0] ?? null
}

export function findNorthNeighbor(
  layout: Pick<WidgetLayoutItem, 'id' | 'visible' | 'col' | 'colSpan' | 'row' | 'rowSpan'>[],
  widgetId: string,
) {
  const item = layout.find((entry) => entry.id === widgetId && entry.visible)
  if (!item) return null
  const northEdge = item.row
  return (
    layout.find(
      (other) =>
        other.visible &&
        other.id !== widgetId &&
        other.row + other.rowSpan === northEdge &&
        colsOverlap(item, other),
    ) ?? null
  )
}

export function findEastNeighbors(
  layout: Pick<WidgetLayoutItem, 'id' | 'visible' | 'col' | 'colSpan' | 'row' | 'rowSpan'>[],
  widgetId: string,
) {
  const item = layout.find((entry) => entry.id === widgetId && entry.visible)
  if (!item) return []
  const eastEdge = item.col + item.colSpan
  return layout.filter(
    (other) =>
      other.visible &&
      other.id !== widgetId &&
      other.col === eastEdge &&
      rowsOverlap(item, other),
  )
}

export function findEastNeighbor(
  layout: Pick<WidgetLayoutItem, 'id' | 'visible' | 'col' | 'colSpan' | 'row' | 'rowSpan'>[],
  widgetId: string,
) {
  return findEastNeighbors(layout, widgetId)[0] ?? null
}

export function findSouthNeighbor(
  layout: Pick<WidgetLayoutItem, 'id' | 'visible' | 'col' | 'colSpan' | 'row' | 'rowSpan'>[],
  widgetId: string,
) {
  const item = layout.find((entry) => entry.id === widgetId && entry.visible)
  if (!item) return null
  const southEdge = item.row + item.rowSpan
  return (
    layout.find(
      (other) =>
        other.visible &&
        other.id !== widgetId &&
        other.row === southEdge &&
        colsOverlap(item, other),
    ) ?? null
  )
}

export function maxEastColSpan(
  layout: Pick<WidgetLayoutItem, 'id' | 'visible' | 'col' | 'colSpan' | 'row' | 'rowSpan'>[],
  item: WidgetRect,
  widgetId: string,
): number {
  let max = GRID_COLUMNS - item.col
  for (const other of layout) {
    if (!other.visible || other.id === widgetId || !rowsOverlap(item, other)) continue
    if (other.col >= item.col) {
      max = Math.min(max, other.col - item.col)
    }
  }
  return Math.max(MIN_COL_SPAN, max)
}

export function maxSouthRowSpan(
  layout: Pick<WidgetLayoutItem, 'id' | 'visible' | 'col' | 'colSpan' | 'row' | 'rowSpan'>[],
  item: WidgetRect,
  widgetId: string,
): number {
  let max = 200
  for (const other of layout) {
    if (!other.visible || other.id === widgetId || !colsOverlap(item, other)) continue
    if (other.row >= item.row) {
      max = Math.min(max, other.row - item.row)
    }
  }
  return Math.max(MIN_ROW_SPAN, max)
}

export function resizeWithEastNeighbor(
  primary: WidgetRect,
  neighbor: WidgetRect,
  deltaCols: number,
  smooth = false,
): [WidgetRect, WidgetRect] {
  const totalSpan = primary.colSpan + neighbor.colSpan
  const rawPrimarySpan = primary.colSpan + deltaCols
  const nextPrimarySpan = smooth
    ? Math.max(MIN_COL_SPAN, Math.min(totalSpan - MIN_COL_SPAN, rawPrimarySpan))
    : Math.max(
        MIN_COL_SPAN,
        Math.min(totalSpan - MIN_COL_SPAN, Math.round(rawPrimarySpan)),
      )
  const nextNeighborSpan = totalSpan - nextPrimarySpan
  return [
    smooth
      ? { ...primary, colSpan: nextPrimarySpan }
      : clampWidgetRect({ ...primary, colSpan: nextPrimarySpan }),
    smooth
      ? { ...neighbor, col: primary.col + nextPrimarySpan, colSpan: nextNeighborSpan }
      : clampWidgetRect({
          ...neighbor,
          col: primary.col + nextPrimarySpan,
          colSpan: nextNeighborSpan,
        }),
  ]
}

export function resizeWithSouthNeighbor(
  primary: WidgetRect,
  neighbor: WidgetRect,
  deltaRows: number,
  smooth = false,
): [WidgetRect, WidgetRect] {
  const totalSpan = primary.rowSpan + neighbor.rowSpan
  const rawPrimarySpan = primary.rowSpan + deltaRows
  const nextPrimarySpan = smooth
    ? Math.max(MIN_ROW_SPAN, Math.min(totalSpan - MIN_ROW_SPAN, rawPrimarySpan))
    : Math.max(
        MIN_ROW_SPAN,
        Math.min(totalSpan - MIN_ROW_SPAN, Math.round(rawPrimarySpan)),
      )
  const nextNeighborSpan = totalSpan - nextPrimarySpan
  return [
    smooth
      ? { ...primary, rowSpan: nextPrimarySpan }
      : clampWidgetRect({ ...primary, rowSpan: nextPrimarySpan }),
    smooth
      ? { ...neighbor, row: primary.row + nextPrimarySpan, rowSpan: nextNeighborSpan }
      : clampWidgetRect({
          ...neighbor,
          row: primary.row + nextPrimarySpan,
          rowSpan: nextNeighborSpan,
        }),
  ]
}

export type WidgetLiveFrame = {
  left: number
  top: number
  width: number
  height: number
}

export function captureWidgetFrames(
  canvas: HTMLElement,
  widgetIds: string[],
): Record<string, WidgetLiveFrame> {
  const canvasRect = canvas.getBoundingClientRect()
  const frames: Record<string, WidgetLiveFrame> = {}

  for (const id of widgetIds) {
    const element = canvas.querySelector<HTMLElement>(`[data-widget-id="${id}"]`)
    if (!element) continue
    const rect = element.getBoundingClientRect()
    frames[id] = {
      left: rect.left - canvasRect.left,
      top: rect.top - canvasRect.top,
      width: rect.width,
      height: rect.height,
    }
  }

  return frames
}

export function gridPositionFromPointer(
  clientX: number,
  clientY: number,
  canvas: HTMLElement,
  rowCount: number,
): { col: number; row: number } {
  const rect = canvas.getBoundingClientRect()
  const colUnit = rect.width / GRID_COLUMNS
  const rowUnit = rect.height / rowCount
  return {
    col: clampCol(Math.floor((clientX - rect.left) / colUnit)),
    row: Math.max(0, Math.floor((clientY - rect.top) / rowUnit)),
  }
}

export function framesToWidgetRects(
  frames: Record<string, WidgetLiveFrame>,
  canvasWidth: number,
  canvasHeight: number,
  rowCount: number,
): Record<string, WidgetRect> {
  const colUnit = canvasWidth / GRID_COLUMNS
  const rowUnit = canvasHeight / rowCount
  const result: Record<string, WidgetRect> = {}

  for (const [id, frame] of Object.entries(frames)) {
    result[id] = clampWidgetRect({
      col: frame.left / colUnit,
      row: frame.top / rowUnit,
      colSpan: frame.width / colUnit,
      rowSpan: frame.height / rowUnit,
    })
  }

  return result
}

export function layoutItemToFrame(
  item: Pick<WidgetLayoutItem, 'col' | 'row' | 'colSpan' | 'rowSpan'>,
  canvasWidth: number,
  canvasHeight: number,
  rowCount: number,
): WidgetLiveFrame {
  const colUnit = canvasWidth / GRID_COLUMNS
  const rowUnit = canvasHeight / rowCount
  return {
    left: item.col * colUnit,
    top: item.row * rowUnit,
    width: item.colSpan * colUnit,
    height: item.rowSpan * rowUnit,
  }
}

export function canSwapWidgetPositions(
  layout: Pick<WidgetLayoutItem, 'id' | 'visible' | 'col' | 'colSpan' | 'row' | 'rowSpan'>[],
  widgetIdA: string,
  widgetIdB: string,
): boolean {
  const a = layout.find((item) => item.id === widgetIdA && item.visible)
  const b = layout.find((item) => item.id === widgetIdB && item.visible)
  if (!a || !b) return false

  const aAtB = clampWidgetRect({
    col: b.col,
    row: b.row,
    colSpan: a.colSpan,
    rowSpan: a.rowSpan,
  })
  const bAtA = clampWidgetRect({
    col: a.col,
    row: a.row,
    colSpan: b.colSpan,
    rowSpan: b.rowSpan,
  })

  for (const other of layout) {
    if (!other.visible || other.id === widgetIdA || other.id === widgetIdB) continue
    if (widgetsOverlap(aAtB, other) || widgetsOverlap(bAtA, other)) return false
  }

  return true
}

export function findOverlappingWidget(
  layout: Pick<WidgetLayoutItem, 'id' | 'visible' | 'col' | 'colSpan' | 'row' | 'rowSpan'>[],
  widgetId: string,
  rect: WidgetRect,
): string | null {
  const placed = clampWidgetRect(rect)
  for (const other of layout) {
    if (!other.visible || other.id === widgetId) continue
    if (widgetsOverlap(placed, other)) return other.id
  }
  return null
}

const NEIGHBOR_SNAP_THRESHOLD = 5

export function snapWidgetRectToNeighbors(
  layout: Pick<WidgetLayoutItem, 'id' | 'visible' | 'col' | 'colSpan' | 'row' | 'rowSpan'>[],
  widgetId: string,
  rect: WidgetRect,
): WidgetRect {
  let next = clampWidgetRect(rect)

  for (const other of layout) {
    if (!other.visible || other.id === widgetId) continue

    if (rowsOverlap(next, other)) {
      const theirRight = other.col + other.colSpan
      if (Math.abs(next.col - theirRight) <= NEIGHBOR_SNAP_THRESHOLD) {
        next = clampWidgetRect({ ...next, col: theirRight })
      }
      const ourRight = next.col + next.colSpan
      if (Math.abs(ourRight - other.col) <= NEIGHBOR_SNAP_THRESHOLD) {
        next = clampWidgetRect({ ...next, col: other.col - next.colSpan })
      }
    }

    if (colsOverlap(next, other)) {
      const theirBottom = other.row + other.rowSpan
      if (Math.abs(next.row - theirBottom) <= NEIGHBOR_SNAP_THRESHOLD) {
        next = clampWidgetRect({ ...next, row: theirBottom })
      }
      const ourBottom = next.row + next.rowSpan
      if (Math.abs(ourBottom - other.row) <= NEIGHBOR_SNAP_THRESHOLD) {
        next = clampWidgetRect({ ...next, row: other.row - next.rowSpan })
      }
    }
  }

  return next
}

export function applyNeighborSnapIfValid(
  layout: Pick<WidgetLayoutItem, 'id' | 'visible' | 'col' | 'colSpan' | 'row' | 'rowSpan'>[],
  widgetId: string,
  rect: WidgetRect,
): WidgetRect {
  const snapped = snapWidgetRectToNeighbors(layout, widgetId, rect)
  return canPlaceWidget(layout, widgetId, snapped) ? snapped : rect
}

/** Keeps the previous position when the desired one would overlap another widget. */
export function resolveWidgetDragRect(
  layout: Pick<WidgetLayoutItem, 'id' | 'visible' | 'col' | 'colSpan' | 'row' | 'rowSpan'>[],
  widgetId: string,
  desired: WidgetRect,
  fallback: WidgetRect,
): WidgetRect {
  const clamped = clampWidgetRect(desired)
  return canPlaceWidget(layout, widgetId, clamped) ? clamped : fallback
}

export function pointerToWidgetRect(
  clientX: number,
  clientY: number,
  canvasLeft: number,
  canvasTop: number,
  canvasWidth: number,
  canvasHeight: number,
  rowCount: number,
  colSpan: number,
  rowSpan: number,
  grabOffsetX: number,
  grabOffsetY: number,
): WidgetRect {
  const colUnit = canvasWidth / GRID_COLUMNS
  const rowUnit = canvasHeight / rowCount
  const left = clientX - canvasLeft - grabOffsetX
  const top = clientY - canvasTop - grabOffsetY
  return clampWidgetRect({
    col: left / colUnit,
    row: top / rowUnit,
    colSpan,
    rowSpan,
  })
}

export function widgetRectToFrame(
  rect: WidgetRect,
  canvasWidth: number,
  canvasHeight: number,
  rowCount: number,
): WidgetLiveFrame {
  return layoutItemToFrame(rect, canvasWidth, canvasHeight, rowCount)
}

export function findWidgetAtPoint(
  layout: Pick<WidgetLayoutItem, 'id' | 'visible' | 'col' | 'colSpan' | 'row' | 'rowSpan'>[],
  canvasWidth: number,
  canvasHeight: number,
  rowCount: number,
  clientX: number,
  clientY: number,
  canvasLeft: number,
  canvasTop: number,
  excludeId?: string,
): string | null {
  const x = clientX - canvasLeft
  const y = clientY - canvasTop
  if (x < 0 || y < 0 || x > canvasWidth || y > canvasHeight) return null

  const colUnit = canvasWidth / GRID_COLUMNS
  const rowUnit = canvasHeight / rowCount

  for (const item of layout) {
    if (!item.visible || item.id === excludeId) continue
    const left = item.col * colUnit
    const top = item.row * rowUnit
    const width = item.colSpan * colUnit
    const height = item.rowSpan * rowUnit
    if (x >= left && x <= left + width && y >= top && y <= top + height) {
      return item.id
    }
  }
  return null
}

export function widgetsOverlap(a: WidgetRect, b: WidgetRect): boolean {
  return colsOverlap(a, b) && rowsOverlap(a, b)
}

export function canPlaceWidget(
  layout: Pick<WidgetLayoutItem, 'id' | 'visible' | 'col' | 'colSpan' | 'row' | 'rowSpan'>[],
  widgetId: string,
  rect: WidgetRect,
): boolean {
  const placed = clampWidgetRect(rect)
  for (const other of layout) {
    if (!other.visible || other.id === widgetId) continue
    if (widgetsOverlap(placed, other)) return false
  }
  return true
}

export function frameToWidgetRect(
  frame: WidgetLiveFrame,
  canvasWidth: number,
  canvasHeight: number,
  rowCount: number,
): WidgetRect {
  const rects = framesToWidgetRects({ move: frame }, canvasWidth, canvasHeight, rowCount)
  return rects.move
}

export interface WidgetSplitHandle {
  axis: 'vertical' | 'horizontal'
  leftId: string
  rightId: string
  col: number
  row: number
  colSpan: number
  rowSpan: number
}

export function getWidgetSplitHandles(
  layout: Pick<WidgetLayoutItem, 'id' | 'visible' | 'col' | 'colSpan' | 'row' | 'rowSpan'>[],
): WidgetSplitHandle[] {
  const visible = layout.filter((item) => item.visible)
  const handles: WidgetSplitHandle[] = []
  const seen = new Set<string>()

  for (const left of visible) {
    const right = findEastNeighbor(visible, left.id)
    if (!right) continue
    const key = `v:${left.id}:${right.id}`
    if (seen.has(key)) continue
    seen.add(key)

    const row = Math.max(left.row, right.row)
    const rowEnd = Math.min(left.row + left.rowSpan, right.row + right.rowSpan)
    handles.push({
      axis: 'vertical',
      leftId: left.id,
      rightId: right.id,
      col: left.col + left.colSpan,
      row,
      colSpan: 0,
      rowSpan: rowEnd - row,
    })
  }

  for (const top of visible) {
    const bottom = findSouthNeighbor(visible, top.id)
    if (!bottom) continue
    const key = `h:${top.id}:${bottom.id}`
    if (seen.has(key)) continue
    seen.add(key)

    const col = Math.max(top.col, bottom.col)
    const colEnd = Math.min(top.col + top.colSpan, bottom.col + bottom.colSpan)
    handles.push({
      axis: 'horizontal',
      leftId: top.id,
      rightId: bottom.id,
      col,
      row: top.row + top.rowSpan,
      colSpan: colEnd - col,
      rowSpan: 0,
    })
  }

  return handles
}
