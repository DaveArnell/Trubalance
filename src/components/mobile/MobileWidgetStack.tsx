import type { ReactNode } from 'react'
import type { PageId } from '../../navigation'
import type { WidgetLayoutItem } from '../../utils/widgetLayout'
import { PAGE_WIDGET_IDS } from '../../utils/widgetLayout'
import type { MobileHomeSection } from './MobileHomeSectionTabs'

interface MobileWidgetStackProps {
  pageId: PageId
  widgets: Record<string, ReactNode>
  layout: WidgetLayoutItem[]
  /** On Home, which panel to show (Accruing / Due / Receipts). */
  homeSection?: MobileHomeSection
}

export function MobileWidgetStack({
  pageId,
  widgets,
  layout,
  homeSection = 'committed-funds',
}: MobileWidgetStackProps) {
  const pageWidgetIds = PAGE_WIDGET_IDS[pageId] ?? []
  const mobileIds = pageId === 'committed-funds' ? [homeSection] : pageWidgetIds

  const visibleLayout = layout
    .filter((item) => item.visible && widgets[item.id] && mobileIds.includes(item.id))
    .sort((a, b) => a.order - b.order)

  const orderedIds =
    visibleLayout.length > 0
      ? visibleLayout.map((item) => item.id)
      : mobileIds.filter((id) => widgets[id])

  return (
    <div className="mobile-widget-stack" data-page-id={pageId} data-home-section={homeSection}>
      {orderedIds.map((widgetId) => (
        <div key={widgetId} className="mobile-widget-stack-item">
          {widgets[widgetId]}
        </div>
      ))}
    </div>
  )
}
