import { useEffect, useState } from 'react'
import { adminFetchAnalytics } from '../adminApi'
import {
  AdminPageHeader,
  AdminPlaceholderChart,
  AdminSection,
  AdminStatCard,
  AdminStatGrid,
} from '../components/AdminUi'
import type { AdminAnalyticsSnapshot } from '../types'

export function AdminAnalyticsPage() {
  const [data, setData] = useState<AdminAnalyticsSnapshot | null>(null)

  useEffect(() => {
    adminFetchAnalytics().then(setData)
  }, [])

  if (!data) return <p className="admin-loading muted">Loading analytics…</p>

  return (
    <div className="admin-page">
      <AdminPageHeader
        title="Analytics"
        description="Platform-wide usage and engagement metrics."
      />

      <AdminStatGrid>
        <AdminStatCard label="Businesses created" value={data.businessesCreated} />
        <AdminStatCard label="Reserve planners" value={data.reservePlannersCreated} />
        <AdminStatCard label="Balance updates" value={data.balanceUpdates.toLocaleString()} />
        <AdminStatCard label="Reports generated" value={data.reportsGenerated} />
        <AdminStatCard label="Graph interactions" value={data.graphInteractions} />
        <AdminStatCard label="Avg updates / week" value={data.avgUpdatesPerWeek} />
        <AdminStatCard label="Avg days between logins" value={data.avgDaysBetweenLogins} />
        <AdminStatCard
          label="Onboarding complete"
          value={`${Math.round(data.onboardingCompletionPct * 100)}%`}
        />
      </AdminStatGrid>

      <div className="admin-analytics-charts">
        <AdminSection title="Daily signups">
          <AdminPlaceholderChart
            label="14 days"
            values={data.dailySignups.map((d) => d.count)}
          />
        </AdminSection>
        <AdminSection title="Daily logins">
          <AdminPlaceholderChart
            label="14 days"
            values={data.dailyLogins.map((d) => d.count)}
          />
        </AdminSection>
      </div>

      <div className="admin-detail-grid">
        <AdminSection title="Feature usage">
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

        <AdminSection title="Widget usage">
          <ul className="admin-bar-list">
            {data.widgetUsage.map((row) => (
              <li key={row.widget}>
                <span>{row.widget}</span>
                <span className="admin-bar-track">
                  <span
                    className="admin-bar-fill"
                    style={{ width: `${(row.count / data.widgetUsage[0]!.count) * 100}%` }}
                  />
                </span>
                <strong>{row.count}</strong>
              </li>
            ))}
          </ul>
        </AdminSection>

        <AdminSection title="Retention">
          <ul className="admin-simple-list">
            {data.retentionWeeks.map((w) => (
              <li key={w.week}>
                <span>{w.week}</span>
                <strong>{Math.round(w.rate * 100)}%</strong>
              </li>
            ))}
          </ul>
        </AdminSection>

        <AdminSection title="Devices">
          <ul className="admin-simple-list">
            {data.devices.map((d) => (
              <li key={d.label}>
                <span>{d.label}</span>
                <strong>{d.pct}%</strong>
              </li>
            ))}
          </ul>
        </AdminSection>

        <AdminSection title="Browsers">
          <ul className="admin-simple-list">
            {data.browsers.map((b) => (
              <li key={b.label}>
                <span>{b.label}</span>
                <strong>{b.pct}%</strong>
              </li>
            ))}
          </ul>
        </AdminSection>

        <AdminSection title="Countries">
          <ul className="admin-simple-list">
            {data.countries.map((c) => (
              <li key={c.label}>
                <span>{c.label}</span>
                <strong>{c.pct}%</strong>
              </li>
            ))}
          </ul>
        </AdminSection>
      </div>
    </div>
  )
}
