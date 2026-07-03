import { AdminPageHeader, AdminSection } from '../components/AdminUi'

const REPORTS = [
  { id: 'users', name: 'Users export', formats: ['CSV', 'PDF'] },
  { id: 'revenue', name: 'Revenue report', formats: ['CSV', 'PDF'] },
  { id: 'subscriptions', name: 'Subscriptions export', formats: ['CSV'] },
  { id: 'analytics', name: 'Analytics summary', formats: ['CSV', 'PDF'] },
]

export function AdminReportsPage() {
  return (
    <div className="admin-page">
      <AdminPageHeader
        title="Reports"
        description="Export platform data. CSV and PDF generation are placeholders until reporting service is connected."
      />

      <div className="admin-reports-grid">
        {REPORTS.map((report) => (
          <article key={report.id} className="admin-panel-card">
            <h2>{report.name}</h2>
            <p className="muted">Scheduled and on-demand exports</p>
            <div className="admin-action-bar">
              {report.formats.map((fmt) => (
                <button key={fmt} type="button" className="btn-secondary btn-tiny" disabled>
                  Export {fmt}
                </button>
              ))}
            </div>
          </article>
        ))}
      </div>

      <AdminSection title="Scheduled reports">
        <p className="muted admin-empty">No scheduled reports configured yet.</p>
      </AdminSection>
    </div>
  )
}
