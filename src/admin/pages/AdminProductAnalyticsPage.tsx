import { useEffect, useState } from 'react'
import { adminFetchProductAnalytics } from '../adminApi'
import {
  AdminPageHeader,
  AdminPlaceholderChart,
  AdminSection,
  AdminStatCard,
  AdminStatGrid,
} from '../components/AdminUi'
import type { ProductAnalyticsSnapshot } from '../types'

export function AdminProductAnalyticsPage() {
  const [data, setData] = useState<ProductAnalyticsSnapshot | null>(null)

  useEffect(() => {
    adminFetchProductAnalytics().then(setData)
  }, [])

  if (!data) return <p className="admin-loading muted">Loading product analytics…</p>

  return (
    <div className="admin-page">
      <AdminPageHeader
        title="Product Analytics"
        description="True Balance-specific usage — workspaces, balances, committed funds, and setup depth."
      />

      <AdminStatGrid>
        <AdminStatCard label="Total users" value={data.totalUsers} />
        <AdminStatCard label="Active users" value={data.activeUsers} />
        <AdminStatCard label="Workspaces created" value={data.workspacesCreated} />
        <AdminStatCard label="Businesses created" value={data.businessesCreated} />
        <AdminStatCard label="Venues created" value={data.venuesCreated} />
        <AdminStatCard label="Accounts created" value={data.accountsCreated} />
        <AdminStatCard label="Committed funds" value={data.committedFundsCreated} />
        <AdminStatCard label="Reserve planners" value={data.reservePlannersCreated} />
        <AdminStatCard label="Balance updates" value={data.balanceUpdatesCreated.toLocaleString()} />
        <AdminStatCard label="Graph snapshots" value={data.graphSnapshotsCreated} />
        <AdminStatCard label="Expected receipts" value={data.expectedReceiptsCreated} />
        <AdminStatCard label="Avg days between balance updates" value={data.avgDaysBetweenBalanceUpdates} />
        <AdminStatCard label="Users with stale balances" value={data.usersWithStaleBalances} />
        <AdminStatCard label="No committed funds" value={data.usersWithNoCommittedFunds} />
        <AdminStatCard label="No reserve planner" value={data.usersWithNoReservePlanner} />
        <AdminStatCard
          label="Onboarding complete"
          value={`${Math.round(data.onboardingCompletionRate * 100)}%`}
        />
      </AdminStatGrid>

      <div className="admin-analytics-charts">
        <AdminSection title="Daily signups">
          <AdminPlaceholderChart label="14 days" values={data.dailySignups.map((d) => d.count)} />
        </AdminSection>
      </div>

      <AdminSection title="Feature usage (True Balance)">
        <ul className="admin-bar-list">
          {data.featureUsage.map((row) => (
            <li key={row.feature}>
              <span>{row.feature}</span>
              <span className="admin-bar-track">
                <span
                  className="admin-bar-fill"
                  style={{ width: `${(row.count / data.featureUsage[0]!.count) * 100}%` }}
                />
              </span>
              <strong>{row.count}</strong>
            </li>
          ))}
        </ul>
      </AdminSection>
    </div>
  )
}
