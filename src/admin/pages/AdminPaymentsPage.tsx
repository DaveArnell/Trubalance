import { useCallback, useEffect, useState } from 'react'
import { adminFetchBillingMetrics, adminFetchPayments } from '../adminApi'
import {
  AdminPageHeader,
  AdminPagination,
  AdminMrrMixChart,
  AdminPlaceholderChart,
  AdminRevenueTrendChart,
  AdminSection,
  AdminStatCard,
  AdminStatGrid,
  AdminBadge,
} from '../components/AdminUi'
import type { AdminBillingMetrics, AdminPaymentRow } from '../types'
import { SUBSCRIPTION_TIERS } from '../../config/subscriptionTiers'
import { formatCurrency } from '../../utils/format'

const PAGE_SIZE = 25

const EMPTY_METRICS: AdminBillingMetrics = {
  mrrGbp: 0,
  arrGbp: 0,
  monthlyPlanMrrGbp: 0,
  annualPlanMrrGbp: 0,
  payingCustomers: 0,
  monthlyCustomers: 0,
  annualCustomers: 0,
  trialPipelineMrrGbp: 0,
  trialCustomers: 0,
  acvGbp: null,
  byTier: [
    { tier: 'solo', count: 0, mrrGbp: 0 },
    { tier: 'multi', count: 0, mrrGbp: 0 },
    { tier: 'group', count: 0, mrrGbp: 0 },
  ],
  cashCollectedGbp: 0,
  revenueTrend: [],
  paymentCount: 0,
}

export function AdminPaymentsPage() {
  const [rows, setRows] = useState<AdminPaymentRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState<AdminBillingMetrics>(EMPTY_METRICS)
  const [metricsLoading, setMetricsLoading] = useState(true)

  const loadPayments = useCallback(async () => {
    setLoading(true)
    const result = await adminFetchPayments({ page, pageSize: PAGE_SIZE })
    setRows(result.items)
    setTotal(result.total)
    setLoading(false)
  }, [page])

  const loadMetrics = useCallback(async () => {
    setMetricsLoading(true)
    const result = await adminFetchBillingMetrics()
    setMetrics(result)
    setMetricsLoading(false)
  }, [])

  useEffect(() => {
    loadPayments()
  }, [loadPayments])

  useEffect(() => {
    loadMetrics()
  }, [loadMetrics])

  const succeeded = rows.filter((r) => r.status === 'succeeded')
  const failed = rows.filter((r) => r.status === 'failed')
  const refunded = rows.filter((r) => r.status === 'refunded')
  const pageRevenue = succeeded.reduce((s, r) => s + r.amountCents, 0)

  return (
    <div className="admin-page">
      <AdminPageHeader
        title="Payments"
        description="MRR and ARR from live subscriptions. Cash charts fill as Stripe invoices succeed."
      />

      <AdminStatGrid>
        <AdminStatCard
          label="MRR"
          value={metricsLoading ? '…' : formatCurrency(metrics.mrrGbp)}
          hint="Active + past due · annual plans ÷ 12"
        />
        <AdminStatCard
          label="ARR"
          value={metricsLoading ? '…' : formatCurrency(metrics.arrGbp)}
          hint="MRR × 12"
        />
        <AdminStatCard
          label="Paying customers"
          value={metricsLoading ? '…' : metrics.payingCustomers}
          hint={`${metrics.monthlyCustomers} monthly · ${metrics.annualCustomers} annual`}
        />
        <AdminStatCard
          label="ACV"
          value={
            metricsLoading
              ? '…'
              : metrics.acvGbp == null
                ? '—'
                : formatCurrency(metrics.acvGbp)
          }
          hint="Average annualised contract value"
        />
        <AdminStatCard
          label="Trial pipeline MRR"
          value={metricsLoading ? '…' : formatCurrency(metrics.trialPipelineMrrGbp)}
          hint={`${metrics.trialCustomers} trials · not booked yet`}
        />
        <AdminStatCard
          label="Cash collected"
          value={metricsLoading ? '…' : formatCurrency(metrics.cashCollectedGbp)}
          hint={`${metrics.paymentCount} payment records`}
        />
      </AdminStatGrid>

      <div className="admin-billing-charts">
        <AdminSection title="Cash collected">
          <AdminRevenueTrendChart series={metrics.revenueTrend} />
        </AdminSection>
        <AdminSection title="MRR by billing interval">
          <AdminMrrMixChart
            monthlyMrrGbp={metrics.monthlyPlanMrrGbp}
            annualMrrGbp={metrics.annualPlanMrrGbp}
          />
        </AdminSection>
        <AdminSection title="MRR by plan">
          <AdminPlaceholderChart
            label="Paying MRR by tier"
            values={metrics.byTier.map((t) => t.mrrGbp)}
          />
          <ul className="admin-tier-mrr-list">
            {metrics.byTier.map((row) => (
              <li key={row.tier}>
                <span>{SUBSCRIPTION_TIERS[row.tier].name}</span>
                <span className="muted">
                  {row.count} paying · {formatCurrency(row.mrrGbp)} MRR
                </span>
              </li>
            ))}
          </ul>
        </AdminSection>
      </div>

      <AdminSection title="Payment activity">
        <AdminStatGrid>
          <AdminStatCard label="Successful (page)" value={succeeded.length} />
          <AdminStatCard label="Failed (page)" value={failed.length} />
          <AdminStatCard label="Refunds (page)" value={refunded.length} />
          <AdminStatCard
            label="Revenue (page)"
            value={formatCurrency(pageRevenue / 100)}
            hint="This page of payment rows"
          />
        </AdminStatGrid>

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
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="muted">
                    No Stripe payments yet. When checkout and invoices succeed, they will appear here.
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
                          row.status === 'succeeded'
                            ? 'green'
                            : row.status === 'failed'
                              ? 'red'
                              : 'orange'
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
