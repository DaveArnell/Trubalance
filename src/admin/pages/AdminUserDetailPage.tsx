import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  adminCreateAdminNote,
  adminDeleteUser,
  adminFetchAccessOverride,
  adminFetchAdminNotes,
  adminFetchUserDetail,
  adminFetchUserTimeline,
  adminFetchWorkspaceInspector,
  adminSaveAccessOverride,
} from '../adminApi'
import {
  AdminBadge,
  AdminPageHeader,
  AdminSection,
  AdminStatCard,
  AdminStatGrid,
  AdminTimeline,
  FreshnessBadge,
  HealthStatusBadge,
  RiskBadge,
} from '../components/AdminUi'
import type { AdminNote, AdminUserDetail, WorkspaceAccessOverride, WorkspaceAccessType } from '../types'
import { SUBSCRIPTION_TIERS, TIER_ORDER, type SubscriptionTierId } from '../../config/subscriptionTiers'
import { computeUserHealth } from '../utils/userHealth'
import { formatCurrency } from '../../utils/format'
import { useAuth } from '../../contexts/AuthContext'

export function AdminUserDetailPage() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const { user: adminUser } = useAuth()
  const [user, setUser] = useState<AdminUserDetail | null>(null)
  const [notes, setNotes] = useState<AdminNote[]>([])
  const [noteDraft, setNoteDraft] = useState('')
  const [timeline, setTimeline] = useState<Awaited<ReturnType<typeof adminFetchUserTimeline>>>([])
  const [workspace, setWorkspace] = useState<Awaited<ReturnType<typeof adminFetchWorkspaceInspector>>>(null)
  const [access, setAccess] = useState<WorkspaceAccessOverride | null>(null)
  const [loading, setLoading] = useState(true)
  const [savingNote, setSavingNote] = useState(false)
  const [savingAccess, setSavingAccess] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    const [detail, noteList, events, inspector, override] = await Promise.all([
      adminFetchUserDetail(userId),
      adminFetchAdminNotes(userId),
      adminFetchUserTimeline(userId),
      adminFetchWorkspaceInspector(userId),
      adminFetchAccessOverride(userId),
    ])
    setUser(detail)
    setNotes(noteList)
    setTimeline(events)
    setWorkspace(inspector)
    setAccess(override)
    setLoading(false)
  }, [userId])

  useEffect(() => {
    load()
  }, [load])

  const handleAddNote = async () => {
    if (!userId || !noteDraft.trim()) return
    setSavingNote(true)
    await adminCreateAdminNote(userId, noteDraft)
    setNoteDraft('')
    const [noteList, events] = await Promise.all([
      adminFetchAdminNotes(userId),
      adminFetchUserTimeline(userId),
    ])
    setNotes(noteList)
    setTimeline(events)
    setSavingNote(false)
  }

  const handleSaveAccess = async () => {
    if (!access) return
    setSavingAccess(true)
    const saved = await adminSaveAccessOverride(access)
    setAccess(saved)
    await load()
    setSavingAccess(false)
  }

  const patchAccess = (patch: Partial<WorkspaceAccessOverride>) => {
    setAccess((current) => (current ? { ...current, ...patch } : current))
  }

  const applyAccessType = (accessType: WorkspaceAccessType) => {
    setAccess((current) => {
      if (!current) return current
      return {
        ...current,
        accessType,
        betaTester: accessType === 'beta_tester',
        lifetimeAccess: accessType === 'lifetime',
      }
    })
  }

  const handleDeleteAccount = async () => {
    if (!userId || !user) return
    if (user.isPlatformAdmin) {
      setDeleteError('Remove platform admin access before deleting this account.')
      return
    }
    const confirmed = window.confirm(
      `Permanently delete ${user.fullName} (${user.email})?\n\nThis removes their workspace, balances, commitments, and login. This cannot be undone.`,
    )
    if (!confirmed) return

    setDeleting(true)
    setDeleteError(null)
    const { error } = await adminDeleteUser(userId, adminUser?.id ?? 'local-dev')
    setDeleting(false)
    if (error) {
      setDeleteError(error)
      return
    }
    navigate('/platform-admin/users', { replace: true })
  }

  if (loading) return <p className="admin-loading muted">Loading user…</p>
  if (!user) {
    return (
      <div className="admin-page">
        <p className="muted">User not found.</p>
        <Link to="/platform-admin/users">← Back to users</Link>
      </div>
    )
  }

  const tierLimits = SUBSCRIPTION_TIERS[user.subscriptionTier].limits
  const health = computeUserHealth({
    lastLoginAt: user.lastLoginAt,
    lastBalanceUpdateAt: user.lastBalanceUpdateAt,
    onboardingPct: user.onboardingPct,
    trialEndsAt: user.trialEndsAt,
    isActive: user.isActive,
  })

  return (
    <div className="admin-page">
      <AdminPageHeader
        title={user.fullName}
        description={`${user.email} · ${user.workspaceName ?? 'No workspace'}`}
        actions={
          <>
            <Link to="/platform-admin/users" className="btn-ghost btn-tiny">
              ← Users
            </Link>
            <Link to="/platform-admin/user-health" className="btn-ghost btn-tiny">
              User health
            </Link>
            <button type="button" className="btn-secondary btn-tiny" disabled title="Coming soon">
              Impersonate
            </button>
          </>
        }
      />

      <div className="admin-detail-meta">
        <AdminBadge tone={user.isActive ? 'green' : 'neutral'}>{user.isActive ? 'Active' : 'Inactive'}</AdminBadge>
        <AdminBadge tone="purple">{user.subscriptionTier}</AdminBadge>
        <AdminBadge>{user.subscriptionStatus}</AdminBadge>
        {user.lifetimeAccess && <AdminBadge tone="green">Lifetime</AdminBadge>}
        {user.betaTester && <AdminBadge tone="blue">Beta tester</AdminBadge>}
        {user.isPlatformAdmin && <AdminBadge tone="blue">Platform admin</AdminBadge>}
        <HealthStatusBadge status={health.healthStatus} />
        <RiskBadge risk={health.riskStatus} />
        <FreshnessBadge status={user.freshnessStatus} />
      </div>

      <div className="admin-detail-grid">
        <AdminSection title="Personal details">
          <dl className="admin-dl">
            <dt>Email</dt>
            <dd>{user.email}</dd>
            <dt>Phone</dt>
            <dd>{user.phone ?? '—'}</dd>
            <dt>Email verified</dt>
            <dd>{user.emailVerified ? 'Yes' : 'No'}</dd>
            <dt>Onboarding</dt>
            <dd>{user.onboardingPct}% {user.onboardingCompleted ? '(complete)' : ''}</dd>
            <dt>Joined</dt>
            <dd>{new Date(user.createdAt).toLocaleString()}</dd>
            <dt>Last login</dt>
            <dd>{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : '—'}</dd>
            <dt>Last balance update</dt>
            <dd>
              {user.lastBalanceUpdateAt ? new Date(user.lastBalanceUpdateAt).toLocaleString() : '—'}
            </dd>
          </dl>
        </AdminSection>

        <AdminSection title="Beta / lifetime access">
          {access && (
            <div className="admin-access-form">
              <label className="admin-field-block">
                <span>Access type</span>
                <select
                  className="admin-input"
                  value={access.accessType}
                  onChange={(e) => applyAccessType(e.target.value as WorkspaceAccessType)}
                >
                  <option value="normal_trial">Normal trial</option>
                  <option value="paid">Paid (placeholder)</option>
                  <option value="beta_tester">Beta tester</option>
                  <option value="lifetime">Lifetime access</option>
                  <option value="cancelled">Cancelled (placeholder)</option>
                </select>
              </label>
              <label className="admin-field-block">
                <span>Subscription plan</span>
                <select
                  className="admin-input"
                  value={access.subscriptionPlan}
                  onChange={(e) =>
                    patchAccess({ subscriptionPlan: e.target.value as SubscriptionTierId })
                  }
                >
                  {TIER_ORDER.map((id) => (
                    <option key={id} value={id}>
                      {SUBSCRIPTION_TIERS[id].name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="admin-field-block">
                <span>Trial expiry</span>
                <input
                  className="admin-input"
                  type="date"
                  value={access.trialEndsAt ? access.trialEndsAt.slice(0, 10) : ''}
                  onChange={(e) =>
                    patchAccess({
                      trialEndsAt: e.target.value ? new Date(e.target.value).toISOString() : null,
                    })
                  }
                />
              </label>
              <label className="admin-check-block">
                <input
                  type="checkbox"
                  checked={access.betaTester}
                  onChange={(e) => patchAccess({ betaTester: e.target.checked })}
                />
                <span>Beta tester flag</span>
              </label>
              <label className="admin-check-block">
                <input
                  type="checkbox"
                  checked={access.lifetimeAccess}
                  onChange={(e) => patchAccess({ lifetimeAccess: e.target.checked })}
                />
                <span>Lifetime access</span>
              </label>
              <p className="muted admin-detail-hint">
                Saved locally for now. Will sync to Supabase when billing is connected.
              </p>
              <button
                type="button"
                className="btn-primary btn-tiny"
                onClick={handleSaveAccess}
                disabled={savingAccess}
              >
                {savingAccess ? 'Saving…' : 'Save access override'}
              </button>
            </div>
          )}
        </AdminSection>

        <AdminSection title="Workspace inspector">
          {workspace ? (
            <>
              <AdminStatGrid>
                <AdminStatCard label="True Balance" value={formatCurrency(workspace.latestTrueBalance ?? 0)} />
                <AdminStatCard label="Cash balance" value={formatCurrency(workspace.latestCashBalance ?? 0)} />
                <AdminStatCard
                  label="Committed total"
                  value={formatCurrency(workspace.latestCommittedTotal ?? 0)}
                />
                <AdminStatCard
                  label="Expected receipts"
                  value={formatCurrency(workspace.latestExpectedReceipts ?? 0)}
                />
                <AdminStatCard label="Businesses" value={workspace.businesses.length} />
                <AdminStatCard label="Venues" value={workspace.venueCount} />
                <AdminStatCard label="Accounts" value={workspace.accountCount} />
                <AdminStatCard label="Committed funds" value={workspace.commitmentCount} />
                <AdminStatCard label="Reserve planners" value={workspace.reservePlannerCount} />
              </AdminStatGrid>
              <p className="admin-detail-hint muted">
                Last balance update:{' '}
                {workspace.lastBalanceUpdateAt
                  ? new Date(workspace.lastBalanceUpdateAt).toLocaleString()
                  : '—'}{' '}
                · <FreshnessBadge status={workspace.freshnessStatus} />
              </p>

              <h3 className="admin-subsection-title">Businesses</h3>
              <ul className="admin-simple-list">
                {workspace.businesses.map((b) => (
                  <li key={b.id}>
                    <span>{b.name}</span>
                    <span className="muted">
                      {b.venueCount} venues · {b.accountCount} accounts
                    </span>
                  </li>
                ))}
              </ul>

              <h3 className="admin-subsection-title">Sample committed funds</h3>
              <ul className="admin-simple-list">
                {workspace.committedFundsSample.map((item) => (
                  <li key={item.name}>
                    <span>{item.name}</span>
                    <strong>{formatCurrency(item.amount)}</strong>
                    <span className="muted">{item.dueLabel}</span>
                  </li>
                ))}
              </ul>

              <h3 className="admin-subsection-title">Expected receipts</h3>
              <ul className="admin-simple-list">
                {workspace.expectedReceiptsSample.map((item) => (
                  <li key={item.name}>
                    <span>{item.name}</span>
                    <strong>{formatCurrency(item.amount)}</strong>
                    <span className="muted">{item.dueLabel}</span>
                  </li>
                ))}
              </ul>

              <h3 className="admin-subsection-title">Reserve planners</h3>
              <ul className="admin-simple-list">
                {workspace.reservePlannersSample.map((item) => (
                  <li key={item.name}>
                    <span>{item.name}</span>
                    <strong>{formatCurrency(item.target)}</strong>
                    <AdminBadge tone={item.status === 'On track' ? 'green' : 'orange'}>
                      {item.status}
                    </AdminBadge>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="muted">Workspace data not available.</p>
          )}
        </AdminSection>

        <AdminSection title="User timeline">
          <AdminTimeline events={timeline} />
        </AdminSection>

        <AdminSection title="Admin notes">
          <ul className="admin-notes-list">
            {notes.length === 0 ? (
              <li className="muted">No admin notes yet.</li>
            ) : (
              notes.map((note) => (
                <li key={note.id}>
                  <p>{note.text}</p>
                  <span className="muted">
                    {note.author} · {new Date(note.createdAt).toLocaleString()}
                  </span>
                </li>
              ))
            )}
          </ul>
          <textarea
            className="admin-notes-input"
            rows={3}
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            placeholder='e.g. "Spoke to Dave about reserve planner setup"'
          />
          <button
            type="button"
            className="btn-secondary btn-tiny"
            onClick={handleAddNote}
            disabled={savingNote || !noteDraft.trim()}
          >
            {savingNote ? 'Saving…' : 'Add note'}
          </button>
        </AdminSection>

        <AdminSection title="Subscription">
          <dl className="admin-dl">
            <dt>Plan</dt>
            <dd>{user.subscriptionTier}</dd>
            <dt>Status</dt>
            <dd>{user.subscriptionStatus}</dd>
            <dt>Trial ends</dt>
            <dd>{user.trialEndsAt ? new Date(user.trialEndsAt).toLocaleDateString() : '—'}</dd>
            <dt>Renewal</dt>
            <dd>{user.subscriptionRenewalAt ? new Date(user.subscriptionRenewalAt).toLocaleDateString() : '—'}</dd>
            <dt>Stripe customer</dt>
            <dd className="admin-mono">{user.stripeCustomerId ?? '—'}</dd>
          </dl>
        </AdminSection>

        <AdminSection title="Subscription limits (current plan)">
          <dl className="admin-dl">
            <dt>Max businesses</dt>
            <dd>{tierLimits.businesses ?? 'Unlimited'}</dd>
            <dt>Max users</dt>
            <dd>{tierLimits.users ?? 'Unlimited'}</dd>
          </dl>
        </AdminSection>

        <AdminSection title="Recent logins">
          <ul className="admin-simple-list">
            {user.recentLogins.map((row, i) => (
              <li key={i}>
                <span>{new Date(row.at).toLocaleString()}</span>
                <span className="muted">{row.device}</span>
              </li>
            ))}
          </ul>
        </AdminSection>

        <AdminSection title="Recent balance updates">
          <ul className="admin-simple-list">
            {user.recentBalanceUpdates.map((row, i) => (
              <li key={i}>
                <span>{row.account}</span>
                <strong>{formatCurrency(row.amount)}</strong>
                <time className="muted">{new Date(row.at).toLocaleDateString()}</time>
              </li>
            ))}
          </ul>
        </AdminSection>

        <AdminSection title="Support history">
          <ul className="admin-simple-list">
            {user.supportTickets.map((t) => (
              <li key={t.id}>
                <span>{t.subject}</span>
                <AdminBadge>{t.status}</AdminBadge>
              </li>
            ))}
          </ul>
        </AdminSection>
      </div>

      <div className="admin-action-bar">
        <button type="button" className="btn-secondary btn-tiny" disabled>
          Edit user
        </button>
        <button type="button" className="btn-secondary btn-tiny" disabled>
          Reset password
        </button>
        <button type="button" className="btn-secondary btn-tiny" disabled>
          Verify email
        </button>
        <button type="button" className="btn-secondary btn-tiny" disabled>
          Extend trial
        </button>
        <button type="button" className="btn-ghost btn-tiny admin-danger-btn" disabled={deleting} onClick={handleDeleteAccount}>
          {deleting ? 'Deleting…' : 'Delete account'}
        </button>
        {deleteError && <p className="admin-delete-error muted">{deleteError}</p>}
        <button type="button" className="btn-primary btn-tiny" onClick={() => navigate('/app')}>
          View app (local)
        </button>
      </div>
    </div>
  )
}
