import type { ReactNode } from 'react'
import type { PageId } from '../../navigation'
import type { WidgetLayoutItem } from '../../utils/widgetLayout'
import { PAGE_WIDGET_IDS } from '../../utils/widgetLayout'

interface MobileWidgetStackProps {
  pageId: PageId
  widgets: Record<string, ReactNode>
  layout: WidgetLayoutItem[]
}

export function MobileWidgetStack({ pageId, widgets, layout }: MobileWidgetStackProps) {
  const pageWidgetIds = PAGE_WIDGET_IDS[pageId] ?? []
  // Home on mobile is Monthly only — Due and Receipts are their own tabs.
  const mobileIds =
    pageId === 'committed-funds'
      ? pageWidgetIds.filter((id) => id === 'committed-funds')
      : pageWidgetIds

  const visibleLayout = layout
    .filter((item) => item.visible && widgets[item.id] && mobileIds.includes(item.id))
    .sort((a, b) => a.order - b.order)

  const orderedIds =
    visibleLayout.length > 0
      ? visibleLayout.map((item) => item.id)
      : mobileIds.filter((id) => widgets[id])

  return (
    <div className="mobile-widget-stack" data-page-id={pageId}>
      {orderedIds.map((widgetId) => (
        <div key={widgetId} className="mobile-widget-stack-item">
          {widgets[widgetId]}
        </div>
      ))}
    </div>
  )
}
