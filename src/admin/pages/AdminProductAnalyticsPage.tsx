import { useEffect, useState } from 'react'
import { adminFetchProductAnalytics } from '../adminApi'
import {
  AdminPageHeader,
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
        title="Product Usage"
        description="How deeply users are engaging with True Balance features — setup depth, data volume, and feature adoption."
      />

      <AdminSection title="Setup depth">
        <AdminStatGrid>
          <AdminStatCard label="Workspaces" value={data.workspacesCreated} />
          <AdminStatCard label="Businesses" value={data.businessesCreated} />
          <AdminStatCard label="Venues" value={data.venuesCreated} />
          <AdminStatCard label="Accounts" value={data.accountsCreated} />
        </AdminStatGrid>
      </AdminSection>

      <AdminSection title="Feature adoption">
        <AdminStatGrid>
          <AdminStatCard label="Monthly costs entered" value={data.committedFundsCreated} />
          <AdminStatCard label="Reserve planners" value={data.reservePlannersCreated} />
          <AdminStatCard label="Expected receipts" value={data.expectedReceiptsCreated} />
          <AdminStatCard label="Balance snapshots" value={data.balanceUpdatesCreated.toLocaleString()} />
        </AdminStatGrid>
      </AdminSection>

      <AdminSection title="Engagement quality">
        <AdminStatGrid>
          <AdminStatCard label="Avg days between updates" value={data.avgDaysBetweenBalanceUpdates || '—'} />
          <AdminStatCard label="Stale balances" value={data.usersWithStaleBalances} />
          <AdminStatCard label="No committed funds" value={data.usersWithNoCommittedFunds} />
          <AdminStatCard label="No reserve planner" value={data.usersWithNoReservePlanner} />
          <AdminStatCard
            label="Onboarding complete"
            value={data.onboardingCompletionRate > 0 ? `${Math.round(data.onboardingCompletionRate * 100)}%` : '—'}
          />
        </AdminStatGrid>
      </AdminSection>

      {data.featureUsage.length > 0 && (
        <AdminSection title="Feature volume">
          <ul className="admin-bar-list">
            {data.featureUsage
              .filter((row) => row.count > 0)
              .map((row) => (
                <li key={row.feature}>
                  <span>{row.feature}</span>
                  <span className="admin-bar-track">
                    <span
                      className="admin-bar-fill"
                      style={{ width: `${(row.count / Math.max(1, data.featureUsage[0]!.count)) * 100}%` }}
                    />
                  </span>
                  <strong>{row.count}</strong>
                </li>
              ))}
          </ul>
        </AdminSection>
      )}
    </div>
  )
}
