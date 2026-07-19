import type { ReactNode } from 'react'

export type CompactKpiItem = {
  label: string
  value: ReactNode
  emphasis?: boolean
}

/** Single-line KPI strip for Accruing / Due / Receipts card headers. */
export function CompactKpiStrip({ items }: { items: CompactKpiItem[] }) {
  return (
    <div className="compact-kpi-strip" role="group">
      {items.map((item) => (
        <div
          key={item.label}
          className={`compact-kpi-strip-item${item.emphasis ? ' compact-kpi-strip-item--emphasis' : ''}`}
        >
          <span className="compact-kpi-strip-label">{item.label}</span>
          <span className="compact-kpi-strip-value">{item.value}</span>
        </div>
      ))}
    </div>
  )
}
