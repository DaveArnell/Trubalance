import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminFetchSubscriptions } from '../adminApi'
import { AdminBadge, AdminPageHeader, AdminPagination } from '../components/AdminUi'
import type { AdminSubscriptionRow } from '../types'

const PAGE_SIZE = 25

export function AdminSubscriptionsPage() {
  const [rows, setRows] = useState<AdminSubscriptionRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const result = await adminFetchSubscriptions({ page, pageSize: PAGE_SIZE, search })
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
        title="Subscriptions"
        description="Every workspace subscription. Stripe IDs are placeholders until billing is connected."
      />

      <div className="admin-toolbar">
        <input
          type="search"
          className="admin-search"
          placeholder="Search user or email…"
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
              <th>User</th>
              <th>Plan</th>
              <th>Status</th>
              <th>Trial expiry</th>
              <th>Renewal</th>
              <th>Payment</th>
              <th>Stripe ID</th>
              <th>Lifetime</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="muted">
                  Loading…
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <div>{row.userName}</div>
                    <div className="muted admin-cell-sub">{row.userEmail}</div>
                  </td>
                  <td>
                    <AdminBadge tone="purple">{row.plan}</AdminBadge>
                  </td>
                  <td>
                    <AdminBadge>{row.status}</AdminBadge>
                  </td>
                  <td>{row.trialEndsAt ? new Date(row.trialEndsAt).toLocaleDateString() : '—'}</td>
                  <td>{row.renewalAt ? new Date(row.renewalAt).toLocaleDateString() : '—'}</td>
                  <td>{row.paymentStatus}</td>
                  <td className="admin-mono">{row.stripeSubscriptionId ?? '—'}</td>
                  <td>{row.lifetimeAccess ? 'Yes' : '—'}</td>
                  <td>
                    <div className="admin-row-actions">
                      <button type="button" className="btn-ghost btn-tiny" disabled>
                        Upgrade
                      </button>
                      <button type="button" className="btn-ghost btn-tiny" disabled>
                        Extend trial
                      </button>
                      <Link to={`/vocatio-admin/users/${row.userId}`} className="btn-secondary btn-tiny">
                        User
                      </Link>
                    </div>
                  </td>
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
