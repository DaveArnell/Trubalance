import { useEffect, useState } from 'react'
import { adminFetchPlatformSettings } from '../adminApi'
import { AdminPageHeader, AdminSection } from '../components/AdminUi'
import type { PlatformSettings } from '../types'

export function AdminSettingsPage() {
  const [settings, setSettings] = useState<PlatformSettings | null>(null)

  useEffect(() => {
    adminFetchPlatformSettings().then(setSettings)
  }, [])

  if (!settings) return <p className="admin-loading muted">Loading settings…</p>

  return (
    <div className="admin-page">
      <AdminPageHeader
        title="Platform Settings"
        description="Global configuration for branding, trials, pricing, and feature flags."
        actions={
          <button type="button" className="btn-primary btn-tiny" disabled>
            Save settings
          </button>
        }
      />

      <div className="admin-settings-grid">
        <AdminSection title="General">
          <label className="admin-field-block">
            <span>Platform name</span>
            <input className="admin-input" defaultValue={settings.platformName} />
          </label>
          <label className="admin-field-block">
            <span>Logo URL</span>
            <input className="admin-input" defaultValue={settings.logoUrl} placeholder="https://…" />
          </label>
          <label className="admin-field-block">
            <span>Primary colour</span>
            <input className="admin-input" type="color" defaultValue={settings.primaryColor} />
          </label>
          <label className="admin-check-block">
            <input type="checkbox" defaultChecked={settings.maintenanceMode} />
            <span>Maintenance mode</span>
          </label>
        </AdminSection>

        <AdminSection title="Trials & pricing">
          <label className="admin-field-block">
            <span>Default trial length (days)</span>
            <input className="admin-input" type="number" defaultValue={settings.defaultTrialDays} />
          </label>
          <label className="admin-field-block">
            <span>Solo price (£/month)</span>
            <input className="admin-input" type="number" step="0.01" defaultValue={settings.soloPriceGbp} />
          </label>
          <label className="admin-field-block">
            <span>Business price (£/month)</span>
            <input className="admin-input" type="number" step="0.01" defaultValue={settings.businessPriceGbp} />
          </label>
          <label className="admin-field-block">
            <span>Group price (£/month)</span>
            <input className="admin-input" type="number" step="0.01" defaultValue={settings.groupPriceGbp} />
          </label>
        </AdminSection>

        <AdminSection title="Email">
          <label className="admin-field-block">
            <span>From name</span>
            <input className="admin-input" defaultValue={settings.emailFromName} />
          </label>
          <label className="admin-field-block">
            <span>From address</span>
            <input className="admin-input" defaultValue={settings.emailFromAddress} />
          </label>
        </AdminSection>

        <AdminSection title="Feature flags">
          <ul className="admin-flag-list">
            {Object.entries(settings.featureFlags).map(([key, enabled]) => (
              <li key={key}>
                <label className="admin-check-block">
                  <input type="checkbox" defaultChecked={enabled} />
                  <span>{key.replace(/_/g, ' ')}</span>
                </label>
              </li>
            ))}
          </ul>
        </AdminSection>

        <AdminSection title="Future integrations">
          <label className="admin-check-block">
            <input type="checkbox" defaultChecked={settings.aiEnabled} />
            <span>AI assistant (future)</span>
          </label>
          <label className="admin-check-block">
            <input type="checkbox" defaultChecked={settings.openBankingEnabled} />
            <span>Open Banking (future)</span>
          </label>
        </AdminSection>
      </div>
    </div>
  )
}
