import type { ReactNode } from 'react'
import type { PageId } from '../../navigation'
import type { WidgetLayoutItem } from '../../utils/widgetLayout'
import { PAGE_WIDGET_IDS } from '../../utils/widgetLayout'

interface MobileWidgetStackProps {
  pageId: PageId
  widgets: Record<string, ReactNode>
  layout: WidgetLayoutItem[]
}

const DASHBOARD_SECTIONS = [
  { widgetId: 'committed-funds', hash: 'committed-funds', label: 'Monthly' },
  { widgetId: 'due', hash: 'due-now', label: 'Due' },
  { widgetId: 'expected-receipts', hash: 'expected-receipts', label: 'Receipts' },
] as const

function MobileDashboardNav() {
  return (
    <nav className="mobile-dashboard-nav" aria-label="Dashboard sections">
      {DASHBOARD_SECTIONS.map((section) => (
        <a key={section.hash} href={`#${section.hash}`} className="mobile-dashboard-nav-link">
          {section.label}
        </a>
      ))}
    </nav>
  )
}

export function MobileWidgetStack({ pageId, widgets, layout }: MobileWidgetStackProps) {
  const pageWidgetIds = PAGE_WIDGET_IDS[pageId] ?? []
  const visibleLayout = layout
    .filter((item) => item.visible && widgets[item.id])
    .sort((a, b) => a.order - b.order)

  const orderedIds =
    visibleLayout.length > 0
      ? visibleLayout.map((item) => item.id)
      : pageWidgetIds.filter((id) => widgets[id])

  return (
    <div className="mobile-widget-stack" data-page-id={pageId}>
      {pageId === 'committed-funds' && <MobileDashboardNav />}
      {orderedIds.map((widgetId) => (
        <div key={widgetId} className="mobile-widget-stack-item">
          {widgets[widgetId]}
        </div>
      ))}
    </div>
  )
}
