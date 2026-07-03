import { useCallback, useEffect, useState } from 'react'
import type { PageId } from '../navigation'
import type { PageWidgetLayout, WidgetRect } from '../utils/widgetLayout'
import {
  clampWidgetRect,
  getGridRowCount,
  loadPageWidgetLayout,
  resetPageWidgetLayout,
  savePageWidgetLayout,
  alignStackedColumnWidgets,
} from '../utils/widgetLayout'
import { reflowFillLayout } from '../utils/widgetLayoutReflow'

function normalizeOrder(layout: PageWidgetLayout): PageWidgetLayout {
  return [...layout]
    .sort((a, b) => a.order - b.order)
    .map((item, index) => ({ ...item, order: index }))
}

export function useWidgetLayout(pageId: PageId) {
  const [layout, setLayout] = useState<PageWidgetLayout>(() => loadPageWidgetLayout(pageId))

  useEffect(() => {
    setLayout(loadPageWidgetLayout(pageId))
  }, [pageId])

  const persist = useCallback(
    (next: PageWidgetLayout) => {
      const normalized = normalizeOrder(next)
      setLayout(normalized)
      savePageWidgetLayout(pageId, normalized)
    },
    [pageId],
  )

  const setVisible = useCallback(
    (widgetId: string, visible: boolean) => {
      persist(layout.map((item) => (item.id === widgetId ? { ...item, visible } : item)))
    },
    [layout, persist],
  )

  const setWidgetRect = useCallback(
    (widgetId: string, rect: WidgetRect) => {
      const next = clampWidgetRect(rect)
      persist(
        layout.map((item) => (item.id === widgetId ? { ...item, ...next } : item)),
      )
    },
    [layout, persist],
  )

  const setWidgetRects = useCallback(
    (updates: Record<string, WidgetRect>) => {
      const aligned = alignStackedColumnWidgets(layout, updates)
      persist(
        layout.map((item) => {
          const patch = aligned[item.id]
          return patch ? { ...item, ...clampWidgetRect(patch) } : item
        }),
      )
    },
    [layout, persist],
  )

  const placeWidget = useCallback(
    (widgetId: string, col: number, row: number) => {
      persist(
        layout.map((item) => {
          if (item.id !== widgetId) return item
          return {
            ...item,
            ...clampWidgetRect({
              col,
              row,
              colSpan: item.colSpan,
              rowSpan: item.rowSpan,
            }),
          }
        }),
      )
    },
    [layout, persist],
  )

  const swapWidgetPositions = useCallback(
    (widgetIdA: string, widgetIdB: string) => {
      const a = layout.find((item) => item.id === widgetIdA)
      const b = layout.find((item) => item.id === widgetIdB)
      if (!a || !b) return

      persist(
        layout.map((item) => {
          if (item.id === widgetIdA) return { ...item, col: b.col, row: b.row }
          if (item.id === widgetIdB) return { ...item, col: a.col, row: a.row }
          return item
        }),
      )
    },
    [layout, persist],
  )

  const swapWidgets = useCallback(
    (widgetIdA: string, widgetIdB: string) => {
      const a = layout.find((item) => item.id === widgetIdA)
      const b = layout.find((item) => item.id === widgetIdB)
      if (!a || !b) return

      persist(
        layout.map((item) => {
          if (item.id === widgetIdA) {
            return {
              ...item,
              col: b.col,
              row: b.row,
              colSpan: b.colSpan,
              rowSpan: b.rowSpan,
            }
          }
          if (item.id === widgetIdB) {
            return {
              ...item,
              col: a.col,
              row: a.row,
              colSpan: a.colSpan,
              rowSpan: a.rowSpan,
            }
          }
          return item
        }),
      )
    },
    [layout, persist],
  )

  const resetLayout = useCallback(() => {
    const defaults = resetPageWidgetLayout(pageId)
    const visibleItems = defaults.filter((item) => item.visible)
    if (visibleItems.length > 1) {
      const rowCount = getGridRowCount(defaults)
      const rects = reflowFillLayout(visibleItems, rowCount)
      const reflowed = defaults.map((item) => {
        const rect = rects[item.id]
        return rect ? { ...item, ...clampWidgetRect(rect) } : item
      })
      setLayout(reflowed)
      savePageWidgetLayout(pageId, reflowed)
      return
    }
    setLayout(defaults)
  }, [pageId])

  return {
    layout,
    setVisible,
    setWidgetRect,
    setWidgetRects,
    placeWidget,
    swapWidgetPositions,
    swapWidgets,
    resetLayout,
  }
}
