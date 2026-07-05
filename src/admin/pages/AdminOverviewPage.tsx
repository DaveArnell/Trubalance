import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminFetchOverview, adminFetchUsers } from '../adminApi'
import {
  AdminPageHeader,
  AdminPlaceholderChart,
  AdminSection,
  AdminStatCard,
  AdminStatGrid,
  HealthStatusBadge,
  RiskBadge,
} from '../components/AdminUi'
import { SUBSCRIPTION_TIERS } from '../../config/subscriptionTiers'
import type {
  AdminNote,
  AdminUserHealthRow,
  AdminUserListItem,
  PlatformOverviewStats,
} from '../types'

export function AdminOverviewPage() {
  const [stats, setStats] = useState<PlatformOverviewStats | null>(null)
  const [atRisk, setAtRisk] = useState<AdminUserHealthRow[]>([])
  const [recentNotes, setRecentNotes] = useState<AdminNote[]>([])
  const [trialUsers, setTrialUsers] = useState<AdminUserListItem[]>([])
  const [allUsers, setAllUsers] = useState<AdminUserListItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      adminFetchOverview(),
      adminFetchUsers({ page: 1, pageSize: 100 }),
    ]).then(([overview, users]) => {
      setStats(overview.stats)
      setAtRisk(overview.usersAtRisk)
      setRecentNotes(overview.recentNotes)
      setAllUsers(users.items)
      setTrialUsers(
        users.items.filter((u) => u.subscriptionStatus === 'trialing'),
      )
      setLoading(false)
    })
  }, [])

  if (loading || !stats) {
    return <p className="admin-loading muted">Loading platform overview…</p>
  }

  const recentSignups = [...allUsers]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8)

  return (
    <div className="admin-page">
      <AdminPageHeader
        title="Platform Overview"
        description="True Balance at a glance — users, trial pipeline, and platform health."
      />

      <AdminStatGrid>
        <AdminStatCard label="Total users" value={stats.totalUsers.toLocaleString()} />
        <AdminStatCard label="Active (logged in last 7d)" value={stats.dau > 0 ? stats.dau : stats.activeUsers} />
        <AdminStatCard label="On trial" value={trialUsers.length} />
        <AdminStatCard label="Paying" value={stats.payingUsers} />
        <AdminStatCard label="New today" value={stats.newUsersToday} />
        <AdminStatCard label="New this week" value={stats.newUsersWeek} />
        <AdminStatCard label="New this month" value={stats.newUsersMonth} />
      </AdminStatGrid>

      <div className="admin-overview-panels">
        <TrialPipelinePanel users={trialUsers} />
        <RecentSignupsPanel users={recentSignups} />
        <AtRiskPanel users={atRisk} />
        <NotesPanel notes={recentNotes} />
      </div>

      <AdminSection title="Signup trend (14 days)">
        <AdminPlaceholderChart
          label="Daily signups"
          values={[2, 1, 3, 2, 4, 1, 2, 3, 2, 5, 3, 2, 4, stats.newUsersToday]}
        />
      </AdminSection>
    </div>
  )
}

function TrialPipelinePanel({ users }: { users: AdminUserListItem[] }) {
  const now = Date.now()
  const TRIAL_DAYS = 90

  const withDaysLeft = users.map((u) => {
    const created = new Date(u.createdAt).getTime()
    const elapsed = Math.floor((now - created) / (1000 * 60 * 60 * 24))
    const remaining = Math.max(0, TRIAL_DAYS - elapsed)
    return { ...u, daysLeft: remaining, elapsed }
  })

  const expiringSoon = withDaysLeft.filter((u) => u.daysLeft <= 14 && u.daysLeft > 0)
  const expired = withDaysLeft.filter((u) => u.daysLeft === 0)

  const potentialMRR = users.reduce((sum, u) => {
    const tier = SUBSCRIPTION_TIERS[u.subscriptionTier]
    return sum + (tier?.priceMonthlyGbp ?? 0)
  }, 0)

  return (
    <section className="admin-panel-card">
      <h2>Trial Pipeline</h2>
      <div className="admin-pipeline-stats">
        <div className="admin-pipeline-stat">
          <span className="admin-pipeline-num">{users.length}</span>
          <span className="admin-pipeline-label">On trial</span>
        </div>
        <div className="admin-pipeline-stat">
          <span className="admin-pipeline-num">{expiringSoon.length}</span>
          <span className="admin-pipeline-label">Expiring ≤14d</span>
        </div>
        <div className="admin-pipeline-stat">
          <span className="admin-pipeline-num">{expired.length}</span>
          <span className="admin-pipeline-label">Expired</span>
        </div>
        <div className="admin-pipeline-stat">
          <span className="admin-pipeline-num">£{potentialMRR.toFixed(2)}</span>
          <span className="admin-pipeline-label">Potential MRR</span>
        </div>
      </div>

      {withDaysLeft.length === 0 ? (
        <p className="muted admin-empty">No trial users yet.</p>
      ) : (
        <ul className="admin-pipeline-list">
          {withDaysLeft.slice(0, 10).map((u) => (
            <li key={u.id} className="admin-pipeline-row">
              <Link to={`/platform-admin/users/${u.id}`} className="admin-link">
                {u.fullName || u.email}
              </Link>
              <span className="admin-pipeline-tier">{u.subscriptionTier}</span>
              <span className="admin-pipeline-biz">{u.businessCount} biz</span>
              <span className={`admin-pipeline-days ${u.daysLeft <= 14 ? 'admin-pipeline-days--urgent' : ''}`}>
                {u.daysLeft > 0 ? `${u.daysLeft}d left` : 'Expired'}
              </span>
            </li>
          ))}
        </ul>
      )}

      <Link to="/platform-admin/subscriptions" className="admin-panel-link">
        View all subscriptions →
      </Link>
    </section>
  )
}

function RecentSignupsPanel({ users }: { users: AdminUserListItem[] }) {
  return (
    <section className="admin-panel-card">
      <h2>Recent signups</h2>
      {users.length === 0 ? (
        <p className="muted admin-empty">No signups yet.</p>
      ) : (
        <ul className="admin-activity-list">
          {users.map((u) => (
            <li key={u.id}>
              <span className="admin-activity-icon" aria-hidden>＋</span>
              <div>
                <Link to={`/platform-admin/users/${u.id}`} className="admin-link">
                  <p className="admin-activity-title">{u.fullName || u.email}</p>
                </Link>
                <p className="muted admin-activity-sub">
                  {u.businessCount} business{u.businessCount !== 1 ? 'es' : ''} · {u.subscriptionTier}
                </p>
              </div>
              <time className="muted">{new Date(u.createdAt).toLocaleDateString()}</time>
            </li>
          ))}
        </ul>
      )}
      <Link to="/platform-admin/users" className="admin-panel-link">
        View all users →
      </Link>
    </section>
  )
}

function AtRiskPanel({ users }: { users: AdminUserHealthRow[] }) {
  return (
    <section className="admin-panel-card">
      <h2>Users at risk</h2>
      {users.length === 0 ? (
        <p className="muted admin-empty">No high-risk users right now.</p>
      ) : (
        <ul className="admin-activity-list">
          {users.map((user) => (
            <li key={user.userId}>
              <div>
                <Link to={`/platform-admin/users/${user.userId}`} className="admin-link">
                  <p className="admin-activity-title">{user.fullName}</p>
                </Link>
                <p className="muted admin-activity-sub">{user.workspaceName}</p>
                <div className="admin-detail-meta admin-detail-meta--compact">
                  <HealthStatusBadge status={user.healthStatus} />
                  <RiskBadge risk={user.riskStatus} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      <Link to="/platform-admin/user-health" className="admin-panel-link">
        Open User Health →
      </Link>
    </section>
  )
}

function NotesPanel({ notes }: { notes: AdminNote[] }) {
  return (
    <section className="admin-panel-card">
      <h2>Recent admin notes</h2>
      {notes.length === 0 ? (
        <p className="muted admin-empty">No admin notes yet. Add notes on a user profile.</p>
      ) : (
        <ul className="admin-notes-list admin-notes-list--compact">
          {notes.map((note) => (
            <li key={note.id}>
              <p>{note.text}</p>
              <span className="muted">
                <Link to={`/platform-admin/users/${note.userId}`} className="admin-link">
                  View user
                </Link>{' '}
                · {new Date(note.createdAt).toLocaleDateString()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
