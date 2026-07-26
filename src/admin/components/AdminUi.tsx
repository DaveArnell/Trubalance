import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { SortDirection } from '../hooks/useTableSort'

export function AdminPageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <header className="admin-page-header">
      <div>
        <h1>{title}</h1>
        {description && <p className="admin-page-lead muted">{description}</p>}
      </div>
      {actions && <div className="admin-page-actions">{actions}</div>}
    </header>
  )
}

export function AdminSection({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="admin-section-block">
      {title && <h2 className="admin-section-title">{title}</h2>}
      {children}
    </section>
  )
}

export function AdminStatCard({
  label,
  value,
  hint,
}: {
  label: string
  value: string | number
  hint?: string
}) {
  return (
    <article className="admin-kpi-card">
      <p className="admin-kpi-label">{label}</p>
      <p className="admin-kpi-value">{value}</p>
      {hint && <p className="admin-kpi-hint muted">{hint}</p>}
    </article>
  )
}

export function AdminStatGrid({ children }: { children: ReactNode }) {
  return <div className="admin-kpi-grid">{children}</div>
}

export function AdminBadge({
  tone = 'neutral',
  children,
}: {
  tone?: 'neutral' | 'green' | 'yellow' | 'orange' | 'red' | 'blue' | 'purple'
  children: ReactNode
}) {
  return <span className={`admin-badge admin-badge--${tone}`}>{children}</span>
}

export function AdminPagination({
  page,
  total,
  pageSize,
  onPage,
}: {
  page: number
  total: number
  pageSize: number
  onPage: (page: number) => void
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  return (
    <div className="admin-pagination">
      <button type="button" className="btn-ghost btn-tiny" disabled={page <= 1} onClick={() => onPage(page - 1)}>
        ← Previous
      </button>
      <span className="muted">
        Page {page} of {totalPages} · {total.toLocaleString()} total
      </span>
      <button
        type="button"
        className="btn-ghost btn-tiny"
        disabled={page >= totalPages}
        onClick={() => onPage(page + 1)}
      >
        Next →
      </button>
    </div>
  )
}

export function AdminPlaceholderChart({ label, values }: { label: string; values: number[] }) {
  const max = Math.max(...values, 1)
  const total = values.reduce((sum, value) => sum + value, 0)
  return (
    <div className="admin-mini-chart" aria-label={label}>
      <p className="admin-mini-chart-label">{label}</p>
      {total === 0 ? (
        <p className="admin-mini-chart-empty muted">No data in this period yet.</p>
      ) : (
        <div className="admin-mini-chart-bars">
          {values.map((v, i) => (
            <div
              key={i}
              className="admin-mini-chart-bar"
              style={{ height: `${Math.max(8, (v / max) * 100)}%` }}
              title={String(v)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function AdminSignupTrendChart({
  series,
}: {
  series: Array<{ date: string; count: number }>
}) {
  const max = Math.max(...series.map((row) => row.count), 1)
  const total = series.reduce((sum, row) => sum + row.count, 0)

  return (
    <div className="admin-mini-chart" aria-label="Daily signups over the last 14 days">
      <p className="admin-mini-chart-label">Daily signups (last 14 days)</p>
      {total === 0 ? (
        <p className="admin-mini-chart-empty muted">No signups in the last 14 days yet.</p>
      ) : (
        <div className="admin-mini-chart-bars admin-mini-chart-bars--labeled">
          {series.map((row) => (
            <div key={row.date} className="admin-mini-chart-column">
              <div
                className="admin-mini-chart-bar"
                style={{ height: `${Math.max(8, (row.count / max) * 100)}%` }}
                title={`${row.date}: ${row.count}`}
              />
              <span className="admin-mini-chart-day">{row.date.slice(8)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function buildDailySignupSeries(
  users: Array<{ createdAt: string }>,
  days = 14,
): Array<{ date: string; count: number }> {
  const series: Array<{ date: string; count: number }> = []
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const day = new Date()
    day.setHours(0, 0, 0, 0)
    day.setDate(day.getDate() - offset)
    const key = day.toISOString().slice(0, 10)
    const count = users.filter((user) => user.createdAt.slice(0, 10) === key).length
    series.push({ date: key, count })
  }
  return series
}

export { buildDailySignupSeries }

export function AdminEmptyState({ message }: { message: string }) {
  return <p className="admin-empty muted">{message}</p>
}

export function HealthStatusBadge({ status }: { status: 'green' | 'yellow' | 'orange' | 'red' }) {
  const labels = { green: 'Healthy', yellow: 'Watch', orange: 'At risk', red: 'Critical' }
  return <AdminBadge tone={status}>{labels[status]}</AdminBadge>
}

export function RiskBadge({ risk }: { risk: 'low' | 'medium' | 'high' }) {
  const tone = risk === 'high' ? 'red' : risk === 'medium' ? 'orange' : 'green'
  return <AdminBadge tone={tone}>{risk} risk</AdminBadge>
}

export function FreshnessBadge({
  status,
}: {
  status: 'fresh' | 'aging' | 'stale' | 'unknown'
}) {
  const tone =
    status === 'fresh' ? 'green' : status === 'aging' ? 'yellow' : status === 'stale' ? 'red' : 'neutral'
  const labels = {
    fresh: 'Fresh',
    aging: 'Aging',
    stale: 'Stale',
    unknown: 'Unknown',
  }
  return <AdminBadge tone={tone}>{labels[status]}</AdminBadge>
}

export function AdminTimeline({
  events,
}: {
  events: Array<{ id: string; label: string; detail: string | null; at: string }>
}) {
  if (events.length === 0) {
    return <AdminEmptyState message="No timeline events yet." />
  }
  return (
    <ol className="admin-timeline">
      {events.map((event) => (
        <li key={event.id} className="admin-timeline-item">
          <span className="admin-timeline-dot" aria-hidden />
          <div className="admin-timeline-body">
            <p className="admin-timeline-label">{event.label}</p>
            {event.detail && <p className="admin-timeline-detail muted">{event.detail}</p>}
            <time className="admin-timeline-time muted">{new Date(event.at).toLocaleString()}</time>
          </div>
        </li>
      ))}
    </ol>
  )
}

export function AdminSortableTh({
  label,
  active,
  direction,
  onSort,
  className,
}: {
  label: string
  active: boolean
  direction: SortDirection
  onSort: () => void
  className?: string
}) {
  return (
    <th className={className}>
      <button type="button" className={`admin-sort-th${active ? ' admin-sort-th--active' : ''}`} onClick={onSort}>
        <span>{label}</span>
        <span className="admin-sort-icon" aria-hidden>
          {active ? (direction === 'asc' ? '↑' : '↓') : '↕'}
        </span>
      </button>
    </th>
  )
}

export function AdminUserCell({
  userId,
  name,
  email,
}: {
  userId: string
  name: string
  email: string
}) {
  return (
    <div className="admin-user-cell">
      <Link to={`/platform-admin/users/${userId}`} className="admin-user-cell-name">
        {name}
      </Link>
      <span className="admin-user-cell-email">{email}</span>
    </div>
  )
}

export function AdminDataModeBanner({
  mode,
  onModeChange,
  supabaseConnected,
}: {
  mode: 'demo' | 'live'
  onModeChange: (mode: 'demo' | 'live') => void
  supabaseConnected: boolean
}) {
  let message: ReactNode
  if (supabaseConnected) {
    message = <span>Live platform data from Supabase.</span>
  } else if (mode === 'demo') {
    message = (
      <span>
        <strong>Demo data</strong> — sample users and metrics for exploring the admin panel.
      </span>
    )
  } else {
    message = (
      <span>
        <strong>Live mode</strong> — empty until Supabase is connected. Use demo data locally, or set{' '}
        <code>VITE_ADMIN_DEMO_DEFAULT=true</code> on a staging deploy.
      </span>
    )
  }

  return (
    <div className={`admin-data-mode-banner admin-data-mode-banner--${mode}`}>
      {message}
      {!supabaseConnected && (
        <div className="admin-data-mode-toggle" role="group" aria-label="Admin data source">
          <button
            type="button"
            className={`admin-data-mode-btn${mode === 'live' ? ' admin-data-mode-btn--active' : ''}`}
            onClick={() => onModeChange('live')}
          >
            Live (empty)
          </button>
          <button
            type="button"
            className={`admin-data-mode-btn${mode === 'demo' ? ' admin-data-mode-btn--active' : ''}`}
            onClick={() => onModeChange('demo')}
          >
            Demo data
          </button>
        </div>
      )}
    </div>
  )
}
