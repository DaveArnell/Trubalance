import { useCallback, useEffect, useState } from 'react'
import { adminFetchAuditLog } from '../adminApi'
import { AdminPageHeader, AdminPagination } from '../components/AdminUi'
import type { AuditLogEntry } from '../types'

const PAGE_SIZE = 25

export function AdminAuditLogPage() {
  const [rows, setRows] = useState<AuditLogEntry[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const result = await adminFetchAuditLog({ page, pageSize: PAGE_SIZE, search })
    setRows(result.items)
    setTotal(result.total)
    setLoading(false)
  }, [page, search])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="admin-page">
      <AdminPageHeader
        title="Audit Log"
        description="Immutable record of sensitive admin actions."
      />

      <div className="admin-toolbar">
        <input
          type="search"
          className="admin-search"
          placeholder="Search action or target…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
        />
      </div>

      <div className="admin-table-wrap">
        <table className="admin-data-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Admin</th>
              <th>Action</th>
              <th>Target</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="muted">
                  Loading…
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id}>
                  <td>{new Date(row.createdAt).toLocaleString()}</td>
                  <td>{row.adminEmail}</td>
                  <td className="admin-mono">{row.action}</td>
                  <td>{row.target ?? '—'}</td>
                  <td className="muted">{row.metadata ?? '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AdminPagination page={page} total={total} pageSize={PAGE_SIZE} onPage={setPage} />
    </div>
  )
}
