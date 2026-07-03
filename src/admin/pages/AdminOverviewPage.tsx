import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminFetchOverview } from '../adminApi'
import {
  AdminPageHeader,
  AdminPlaceholderChart,
  AdminSection,
  AdminStatCard,
  AdminStatGrid,
  HealthStatusBadge,
  RiskBadge,
} from '../components/AdminUi'
import type { AdminActivityRow, AdminNote, AdminUserHealthRow, PlatformOverviewStats } from '../types'

function activityIcon(type: AdminActivityRow['type']) {
  switch (type) {
    case 'signup':
      return '＋'
    case 'login':
      return '→'
    case 'payment':
      return '£'
    case 'support':
      return '?'
    default:
      return '!'
  }
}

export function AdminOverviewPage() {
  const [stats, setStats] = useState<PlatformOverviewStats | null>(null)
  const [activity, setActivity] = useState<AdminActivityRow[]>([])
  const [atRisk, setAtRisk] = useState<AdminUserHealthRow[]>([])
  const [recentNotes, setRecentNotes] = useState<AdminNote[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminFetchOverview().then((data) => {
      setStats(data.stats)
      setActivity(data.recentActivity)
      setAtRisk(data.usersAtRisk)
      setRecentNotes(data.recentNotes)
      setLoading(false)
    })
  }, [])

  if (loading || !stats) {
    return <p className="admin-loading muted">Loading platform overview…</p>
  }

  const signups = activity.filter((a) => a.type === 'signup')
  const recentActivity = activity.filter((a) => a.type !== 'signup')

  return (
    <div className="admin-page">
      <AdminPageHeader
        title="Platform Overview"
        description="True Balance at a glance — who is active, who needs help, and how the product is being used."
      />

      <AdminStatGrid>
        <AdminStatCard label="Total users" value={stats.totalUsers.toLocaleString()} />
        <AdminStatCard label="Active users" value={stats.activeUsers.toLocaleString()} />
        <AdminStatCard label="Trial users" value={stats.trialUsers} />
        <AdminStatCard label="Beta / lifetime" value={stats.lifetimeUsers + stats.betaUsers} />
        <AdminStatCard label="Paying users" value={stats.payingUsers} hint="Placeholder" />
        <AdminStatCard label="Stale users" value={stats.staleUsers} />
        <AdminStatCard label="Users needing help" value={stats.usersNeedingHelp} />
        <AdminStatCard label="Total balance updates" value={stats.totalBalanceUpdates.toLocaleString()} />
        <AdminStatCard label="Total reserve planners" value={stats.totalReservePlanners} />
        <AdminStatCard
          label="Onboarding complete"
          value={`${Math.round(stats.onboardingCompletionPct * 100)}%`}
        />
        <AdminStatCard label="New today" value={stats.newUsersToday} />
        <AdminStatCard label="New this week" value={stats.newUsersWeek} />
      </AdminStatGrid>

      <div className="admin-overview-panels">
        <ActivityPanel title="Recent signups" items={signups} empty="No recent signups." linkTo="/platform-admin/users" />
        <ActivityPanel title="Recent activity" items={recentActivity} empty="No recent activity." />
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

function ActivityPanel({
  title,
  items,
  empty,
  linkTo,
}: {
  title: string
  items: AdminActivityRow[]
  empty: string
  linkTo?: string
}) {
  return (
    <section className="admin-panel-card">
      <h2>{title}</h2>
      {items.length === 0 ? (
        <p className="muted admin-empty">{empty}</p>
      ) : (
        <ul className="admin-activity-list">
          {items.map((item) => (
            <li key={item.id}>
              <span className="admin-activity-icon" aria-hidden>
                {activityIcon(item.type)}
              </span>
              <div>
                <p className="admin-activity-title">{item.title}</p>
                {item.subtitle && <p className="muted admin-activity-sub">{item.subtitle}</p>}
              </div>
              <time className="muted">{new Date(item.createdAt).toLocaleString()}</time>
            </li>
          ))}
        </ul>
      )}
      {linkTo && (
        <Link to={linkTo} className="admin-panel-link">
          View all users →
        </Link>
      )}
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
