import { useCallback, useEffect, useState } from 'react'
import { adminFetchSupportTickets } from '../adminApi'
import { AdminBadge, AdminPageHeader, AdminPagination } from '../components/AdminUi'
import type { SupportTicketRow } from '../types'

const PAGE_SIZE = 25

function priorityTone(p: SupportTicketRow['priority']) {
  if (p === 'urgent') return 'red'
  if (p === 'high') return 'orange'
  if (p === 'normal') return 'blue'
  return 'neutral'
}

export function AdminSupportPage() {
  const [tickets, setTickets] = useState<SupportTicketRow[]>([])
  const [selected, setSelected] = useState<SupportTicketRow | null>(null)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const result = await adminFetchSupportTickets({ page, pageSize: PAGE_SIZE })
    setTickets(result.items)
    setTotal(result.total)
    setSelected((current) => current ?? result.items[0] ?? null)
    setLoading(false)
  }, [page])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="admin-page">
      <AdminPageHeader
        title="Support"
        description="Support tickets for Cash Prophet users. Conversation and replies are placeholders until messaging is integrated."
      />

      <div className="admin-support-layout">
        <div className="admin-table-wrap admin-support-list">
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Status</th>
                <th>Priority</th>
                <th>User</th>
                <th>Assigned</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="muted">
                    Loading…
                  </td>
                </tr>
              ) : (
                tickets.map((t) => (
                  <tr
                    key={t.id}
                    className={selected?.id === t.id ? 'admin-row--selected' : ''}
                    onClick={() => setSelected(t)}
                  >
                    <td>{t.subject}</td>
                    <td>
                      <AdminBadge>{t.status}</AdminBadge>
                    </td>
                    <td>
                      <AdminBadge tone={priorityTone(t.priority)}>{t.priority}</AdminBadge>
                    </td>
                    <td>{t.userEmail}</td>
                    <td>{t.assignedAdmin ?? '—'}</td>
                    <td>{new Date(t.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <AdminPagination page={page} total={total} pageSize={PAGE_SIZE} onPage={setPage} />
        </div>

        <aside className="admin-panel-card admin-support-detail">
          {selected ? (
            <>
              <h2>{selected.subject}</h2>
              <p className="muted">
                {selected.userName} · {selected.userEmail}
              </p>
              <div className="admin-detail-meta">
                <AdminBadge>{selected.status}</AdminBadge>
                <AdminBadge tone={priorityTone(selected.priority)}>{selected.priority}</AdminBadge>
              </div>
              <div className="admin-support-thread">
                <p className="muted admin-empty">
                  Conversation placeholder — connect your support provider to show messages here.
                </p>
              </div>
              <label className="admin-field-block">
                <span>Admin notes</span>
                <textarea
                  rows={4}
                  className="admin-notes-input"
                  placeholder="Internal notes…"
                  defaultValue={selected.adminNotes ?? ''}
                  readOnly
                />
              </label>
              <button type="button" className="btn-secondary btn-tiny" disabled>
                Reply (coming soon)
              </button>
            </>
          ) : (
            <p className="muted">Select a ticket</p>
          )}
        </aside>
      </div>
    </div>
  )
}
