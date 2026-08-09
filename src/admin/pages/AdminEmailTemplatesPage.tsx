import { useEffect, useMemo, useState } from 'react'
import { adminFetchEmailTemplates, adminSendTestEmail } from '../adminApi'
import { AdminBadge, AdminPageHeader, AdminSection } from '../components/AdminUi'
import type { EmailTemplateRow } from '../types'

export function AdminEmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplateRow[]>([])
  const [selected, setSelected] = useState<EmailTemplateRow | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [testTo, setTestTo] = useState('')
  const [sending, setSending] = useState(false)
  const [sendMessage, setSendMessage] = useState<string | null>(null)

  useEffect(() => {
    adminFetchEmailTemplates().then((rows) => {
      setTemplates(rows)
      setSelected(rows[0] ?? null)
    })
  }, [])

  const previewHtml = useMemo(() => selected?.htmlPreview ?? '', [selected])

  const sendTest = async () => {
    if (!selected) return
    setSending(true)
    setSendMessage(null)
    const result = await adminSendTestEmail(selected.key, testTo)
    setSending(false)
    setSendMessage(result.ok ? `Sent test to ${testTo.trim()}` : result.error ?? 'Send failed')
  }

  return (
    <div className="admin-page">
      <AdminPageHeader
        title="Email Template Centre"
        description="MVP product emails via Resend. Preview the branded HTML and send a test to any address you choose."
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
                  onClick={() => {
                    setSelected(t)
                    setSendMessage(null)
                  }}
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
            <AdminSection title="Send test">
              <label className="admin-field-label" htmlFor="email-test-to">
                Send to
              </label>
              <input
                id="email-test-to"
                type="email"
                className="admin-input"
                placeholder="you@example.com"
                value={testTo}
                onChange={(e) => setTestTo(e.target.value)}
              />
              <div className="admin-action-bar" style={{ marginTop: 12 }}>
                <button
                  type="button"
                  className="btn-primary btn-tiny"
                  onClick={() => setPreviewOpen(true)}
                >
                  Preview
                </button>
                <button
                  type="button"
                  className="btn-secondary btn-tiny"
                  disabled={sending || !testTo.trim()}
                  onClick={() => void sendTest()}
                >
                  {sending ? 'Sending…' : 'Send test email'}
                </button>
              </div>
              {sendMessage && <p className="muted admin-detail-hint">{sendMessage}</p>}
            </AdminSection>
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
            <iframe
              title={`Preview ${selected.name}`}
              className="admin-email-preview-frame"
              srcDoc={previewHtml}
              sandbox=""
            />
          </div>
        </div>
      )}
    </div>
  )
}
