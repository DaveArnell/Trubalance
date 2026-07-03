import { useCallback, useEffect, useState } from 'react'
import { adminFetchPayments } from '../adminApi'
import {
  AdminPageHeader,
  AdminPagination,
  AdminPlaceholderChart,
  AdminSection,
  AdminStatCard,
  AdminStatGrid,
  AdminBadge,
} from '../components/AdminUi'
import type { AdminPaymentRow } from '../types'
import { formatCurrency } from '../../utils/format'

const PAGE_SIZE = 25

export function AdminPaymentsPage() {
  const [rows, setRows] = useState<AdminPaymentRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const result = await adminFetchPayments({ page, pageSize: PAGE_SIZE })
    setRows(result.items)
    setTotal(result.total)
    setLoading(false)
  }, [page])

  useEffect(() => {
    load()
  }, [load])

  const succeeded = rows.filter((r) => r.status === 'succeeded')
  const failed = rows.filter((r) => r.status === 'failed')
  const refunded = rows.filter((r) => r.status === 'refunded')
  const revenue = succeeded.reduce((s, r) => s + r.amountCents, 0)

  return (
    <div className="admin-page">
      <AdminPageHeader
        title="Payments"
        description="Stripe-ready payment views. Connect Stripe webhooks to populate live data."
      />

      <AdminStatGrid>
        <AdminStatCard label="Successful (page)" value={succeeded.length} />
        <AdminStatCard label="Failed (page)" value={failed.length} />
        <AdminStatCard label="Refunds (page)" value={refunded.length} />
        <AdminStatCard label="Revenue (page)" value={formatCurrency(revenue / 100)} hint="Placeholder" />
        <AdminStatCard label="MRR" value={formatCurrency(2847)} hint="Placeholder" />
        <AdminStatCard label="ARR" value={formatCurrency(34164)} hint="Placeholder" />
        <AdminStatCard label="ACV" value={formatCurrency(99)} hint="Placeholder" />
        <AdminStatCard label="LTV" value="—" hint="Placeholder" />
      </AdminStatGrid>

      <AdminSection title="Revenue trend">
        <AdminPlaceholderChart label="Last 14 days" values={[12, 18, 9, 22, 15, 20, 17, 24, 19, 21, 16, 23, 18, 20]} />
      </AdminSection>

      <AdminSection title="All payments">
        <div className="admin-table-wrap">
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>User</th>
                <th>Workspace</th>
                <th>Plan</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="muted">
                    Loading…
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id}>
                    <td>{new Date(row.createdAt).toLocaleString()}</td>
                    <td>{row.userEmail}</td>
                    <td>{row.workspaceName}</td>
                    <td>
                      <AdminBadge tone="purple">{row.plan}</AdminBadge>
                    </td>
                    <td>{formatCurrency(row.amountCents / 100)}</td>
                    <td>
                      <AdminBadge
                        tone={
                          row.status === 'succeeded' ? 'green' : row.status === 'failed' ? 'red' : 'orange'
                        }
                      >
                        {row.status}
                      </AdminBadge>
                    </td>
                    <td>{row.description ?? '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <AdminPagination page={page} total={total} pageSize={PAGE_SIZE} onPage={setPage} />
      </AdminSection>
    </div>
  )
}
