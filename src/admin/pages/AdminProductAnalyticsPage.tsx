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

  const funnel = data.setupFunnel
  const funnelMax = Math.max(1, ...funnel.steps.map((step) => step.usersReached))

  return (
    <div className="admin-page">
      <AdminPageHeader
        title="Product Usage"
        description="How deeply users are engaging with Cash Prophet features — setup depth, data volume, and feature adoption."
      />

      <AdminSection title="Setup funnel">
        <AdminStatGrid>
          <AdminStatCard label="Started setup" value={funnel.usersStarted} />
          <AdminStatCard label="Finished setup" value={funnel.usersCompleted} />
          <AdminStatCard label="Skipped setup" value={funnel.usersDismissed} />
          <AdminStatCard
            label="Completion rate"
            value={
              funnel.usersStarted > 0
                ? `${Math.round((funnel.usersCompleted / funnel.usersStarted) * 100)}%`
                : '—'
            }
          />
        </AdminStatGrid>
        {funnel.usersStarted > 0 ? (
          <>
            <ul className="admin-bar-list admin-setup-funnel-list">
              {funnel.steps.map((step) => (
                <li key={step.stepId}>
                  <span>
                    {step.label}
                    {step.dropOffFromPrevious > 0 ? (
                      <span className="admin-setup-funnel-drop muted"> −{step.dropOffFromPrevious}</span>
                    ) : null}
                  </span>
                  <span className="admin-bar-track">
                    <span
                      className="admin-bar-fill"
                      style={{ width: `${(step.usersReached / funnelMax) * 100}%` }}
                    />
                  </span>
                  <strong>
                    {step.usersReached}
                    <span className="muted"> ({step.pctOfStarted}%)</span>
                  </strong>
                </li>
              ))}
            </ul>
            {funnel.dismissByStep.length > 0 ? (
              <div className="admin-setup-funnel-skips">
                <p className="admin-section-lead muted">Most common skip points</p>
                <ul className="admin-simple-list">
                  {funnel.dismissByStep.map((row) => (
                    <li key={row.stepId}>
                      <span>{row.label}</span>
                      <strong>{row.count}</strong>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </>
        ) : (
          <p className="muted admin-section-lead">
            No setup funnel data yet. Counts appear after users open the setup guide.
          </p>
        )}
      </AdminSection>

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
