import { useEffect, useState } from 'react'
import { adminFetchDeveloperInfo } from '../adminApi'
import { AdminPageHeader, AdminSection, AdminStatCard, AdminStatGrid } from '../components/AdminUi'
import type { DeveloperInfo } from '../types'
import { isLocalDevMode } from '../../lib/devMode'
import { getAppEnvironment, isStagingEnvironment } from '../../lib/appEnvironment'
import { loadLocalSubscription, saveLocalSubscription } from '../../services/subscriptionStorage'
import { SUBSCRIPTION_TIERS, TIER_ORDER, type SubscriptionTierId } from '../../config/subscriptionTiers'
import type { WorkspaceSubscription } from '../../types/subscription'
import { addDays } from '../../utils/subscriptionAccess'

export function AdminDeveloperToolsPage() {
  const [info, setInfo] = useState<DeveloperInfo | null>(null)
  const localDev = isLocalDevMode()
  const [subscription, setSubscription] = useState<WorkspaceSubscription>(() => loadLocalSubscription())

  useEffect(() => {
    adminFetchDeveloperInfo().then(setInfo)
  }, [])

  const persistSub = (next: WorkspaceSubscription) => {
    setSubscription(next)
    saveLocalSubscription(next)
  }

  if (!info) return <p className="admin-loading muted">Loading…</p>

  const mvpChecks = [
    {
      label: 'Supabase connected',
      ok: info.supabaseConfigured,
      hint: info.supabaseConfigured ? 'Cloud auth and sync enabled' : 'Add VITE_SUPABASE_URL and anon key',
    },
    {
      label: 'Environment labelled',
      ok: getAppEnvironment() !== 'development' || isLocalDevMode(),
      hint: 'Set VITE_APP_ENV=production or staging on deployed hosts',
    },
    {
      label: 'Staging isolated from production',
      ok: !isStagingEnvironment() || info.supabaseConfigured,
      hint: 'Use a separate Supabase project for staging deploys',
    },
    {
      label: 'Row-level security (migrations)',
      ok: info.supabaseConfigured,
      hint: 'Run all files in supabase/migrations/ on each Supabase project',
    },
    {
      label: 'Admin role assigned',
      ok: info.supabaseConfigured,
      hint: 'UPDATE profiles SET role = super_admin for your email after signup',
    },
    {
      label: 'Users & workspaces (live data)',
      ok: info.supabaseConfigured && !isLocalDevMode(),
      hint: 'Users / Overview pages load from Supabase when connected',
    },
  ]

  return (
    <div className="admin-page">
      <AdminPageHeader
        title="Developer Tools"
        description="Internal tools for platform admins only."
      />

      <AdminStatGrid>
        <AdminStatCard label="Version" value={info.version} />
        <AdminStatCard label="Environment" value={info.environment} />
        <AdminStatCard label="Supabase" value={info.supabaseConfigured ? 'Connected' : 'Not configured'} />
        <AdminStatCard label="Database" value={info.databaseStatus} />
        <AdminStatCard label="Last migration" value={info.lastMigration} />
      </AdminStatGrid>

      <div className="admin-detail-grid">
        <AdminSection title="MVP launch checklist">
          <p className="muted">
            Minimum steps before inviting testers. Use one Supabase project for production (your real
            data) and a second for staging (mock trials).
          </p>
          <ul className="admin-checklist">
            {mvpChecks.map((item) => (
              <li key={item.label} className={item.ok ? 'admin-checklist-item--ok' : ''}>
                <span className="admin-checklist-mark" aria-hidden>
                  {item.ok ? '✓' : '○'}
                </span>
                <div>
                  <strong>{item.label}</strong>
                  <p className="muted admin-checklist-hint">{item.hint}</p>
                </div>
              </li>
            ))}
          </ul>
        </AdminSection>

        <AdminSection title="Feature flags (runtime)">
          <p className="muted">Toggle experimental features for testing.</p>
          <ul className="admin-flag-list">
            <li>
              <label className="admin-check-block">
                <input type="checkbox" defaultChecked />
                <span>reserve_planner</span>
              </label>
            </li>
            <li>
              <label className="admin-check-block">
                <input type="checkbox" defaultChecked />
                <span>trend_forecast</span>
              </label>
            </li>
            <li>
              <label className="admin-check-block">
                <input type="checkbox" />
                <span>ai_assistant</span>
              </label>
            </li>
          </ul>
        </AdminSection>

        <AdminSection title="Test data">
          <div className="admin-action-bar">
            <button type="button" className="btn-secondary btn-tiny" disabled>
              Generate test users
            </button>
            <button type="button" className="btn-secondary btn-tiny" disabled>
              Clear demo data
            </button>
          </div>
        </AdminSection>

        <AdminSection title="Local app subscription (dev)">
          {localDev ? (
            <div className="admin-subscription-form">
              <label className="admin-field-block">
                <span>Tier</span>
                <select
                  className="admin-input"
                  value={subscription.tierId}
                  onChange={(e) =>
                    persistSub({ ...subscription, tierId: e.target.value as SubscriptionTierId })
                  }
                >
                  {TIER_ORDER.map((id) => (
                    <option key={id} value={id}>
                      {SUBSCRIPTION_TIERS[id].name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="admin-check-block">
                <input
                  type="checkbox"
                  checked={subscription.lifetimeAccess}
                  onChange={(e) => persistSub({ ...subscription, lifetimeAccess: e.target.checked })}
                />
                <span>Lifetime access</span>
              </label>
              <div className="admin-action-bar">
                <button
                  type="button"
                  className="btn-secondary btn-tiny"
                  onClick={() => persistSub({ ...subscription, trialEndsAt: addDays(new Date(), 90) })}
                >
                  Extend trial 90d
                </button>
                <button
                  type="button"
                  className="btn-secondary btn-tiny"
                  onClick={() => persistSub({ ...subscription, trialEndsAt: addDays(new Date(), -1) })}
                >
                  End trial
                </button>
              </div>
            </div>
          ) : (
            <p className="muted">Available in local build without Supabase.</p>
          )}
        </AdminSection>

        <AdminSection title="System health">
          <dl className="admin-dl">
            <dt>API</dt>
            <dd>Placeholder — healthy</dd>
            <dt>Background jobs</dt>
            <dd>Placeholder — none configured</dd>
            <dt>Email delivery</dt>
            <dd>Placeholder — not connected</dd>
          </dl>
        </AdminSection>
      </div>
    </div>
  )
}
