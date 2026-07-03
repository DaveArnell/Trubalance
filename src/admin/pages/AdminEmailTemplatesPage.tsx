import { useEffect, useMemo, useState } from 'react'
import { adminFetchEmailTemplates } from '../adminApi'
import { AdminBadge, AdminPageHeader, AdminSection } from '../components/AdminUi'
import type { EmailTemplateRow } from '../types'

function renderPreview(template: EmailTemplateRow) {
  return template.bodyPreview
    .replace(/\{\{user_name\}\}/g, 'Alex Smith')
    .replace(/\{\{workspace_name\}\}/g, 'Oak & Co workspace')
    .replace(/\{\{trial_end_date\}\}/g, '15 July 2026')
    .replace(/\{\{trial_days_left\}\}/g, '42')
    .replace(/\{\{true_balance\}\}/g, '£67,240')
    .replace(/\{\{committed_total\}\}/g, '£18,200')
    .replace(/\{\{verify_link\}\}/g, 'https://trubalance.app/verify/demo')
    .replace(/\{\{reset_link\}\}/g, 'https://trubalance.app/reset/demo')
    .replace(/\{\{support_message\}\}/g, 'Here is how to set up your reserve planner…')
}

export function AdminEmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplateRow[]>([])
  const [selected, setSelected] = useState<EmailTemplateRow | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  useEffect(() => {
    adminFetchEmailTemplates().then((rows) => {
      setTemplates(rows)
      setSelected(rows[0] ?? null)
    })
  }, [])

  const previewBody = useMemo(
    () => (selected ? renderPreview(selected) : ''),
    [selected],
  )

  return (
    <div className="admin-page">
      <AdminPageHeader
        title="Email Template Centre"
        description="Preview True Balance platform emails. Sending and editing will connect to Resend later."
      />

      <div className="admin-split-editor">
        <div className="admin-table-wrap">
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>Template</th>
                <th>Status</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((t) => (
                <tr
                  key={t.id}
                  className={selected?.id === t.id ? 'admin-row--selected' : ''}
                  onClick={() => setSelected(t)}
                >
                  <td>{t.name}</td>
                  <td>
                    <AdminBadge tone={t.enabled ? 'green' : 'neutral'}>
                      {t.enabled ? 'Enabled' : 'Disabled'}
                    </AdminBadge>
                  </td>
                  <td>{new Date(t.updatedAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selected && (
          <aside className="admin-panel-card">
            <h2>{selected.name}</h2>
            <p className="admin-mono muted">{selected.key}</p>
            <AdminSection title="Subject">
              <p className="admin-preview-subject">{selected.subject}</p>
            </AdminSection>
            <AdminSection title="Variables">
              <div className="admin-chip-row">
                {selected.variables.map((v) => (
                  <code key={v} className="admin-code-chip">
                    {v}
                  </code>
                ))}
              </div>
            </AdminSection>
            <div className="admin-action-bar">
              <button
                type="button"
                className="btn-primary btn-tiny"
                onClick={() => setPreviewOpen(true)}
              >
                Preview
              </button>
              <button type="button" className="btn-ghost btn-tiny" disabled title="Resend integration coming soon">
                Send test email
              </button>
              <button type="button" className="btn-ghost btn-tiny" disabled title="Editing coming soon">
                Edit template
              </button>
            </div>
          </aside>
        )}
      </div>

      {previewOpen && selected && (
        <div className="admin-modal-backdrop" onClick={() => setPreviewOpen(false)}>
          <div
            className="admin-modal admin-email-preview"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="email-preview-title"
          >
            <header className="admin-modal-header">
              <h2 id="email-preview-title">Preview — {selected.name}</h2>
              <button type="button" className="btn-ghost btn-tiny" onClick={() => setPreviewOpen(false)}>
                Close
              </button>
            </header>
            <p className="admin-preview-subject">
              <strong>Subject:</strong> {selected.subject}
            </p>
            <pre className="admin-email-preview-body">{previewBody}</pre>
            <p className="muted admin-detail-hint">
              Sample data is substituted for placeholders. Real sending via Resend is not connected yet.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
