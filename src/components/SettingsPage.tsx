import { useState } from 'react'
import type { AppState } from '../types'
import type { AppActions } from '../hooks/useAppState'
import { DisplayPreferencesPanel } from './DisplayPreferencesPanel'
import { AccountSubscriptionPanel } from './AccountSubscriptionPanel'
import { DataExportPanel } from './DataExportPanel'
import { StructureManagement } from './StructureManagement'
import { SupportMessagePanel } from './SupportMessagePanel'

type SettingsSectionId = 'structure' | 'display' | 'plan' | 'data' | 'support'

const SECTIONS: {
  id: SettingsSectionId
  label: string
  lead: string
}[] = [
  {
    id: 'structure',
    label: 'Company structure',
    lead: 'Groups, businesses, venues, and bank accounts.',
  },
  {
    id: 'display',
    label: 'Display',
    lead: 'Table style, currency, spacing, and how numbers line up across the app.',
  },
  {
    id: 'plan',
    label: 'Your plan',
    lead: 'Which plan fits your setup, trial progress, and billing.',
  },
  {
    id: 'support',
    label: 'Support',
    lead: 'Send a message to the Cash Prophet team.',
  },
  {
    id: 'data',
    label: 'Your data',
    lead: 'Download a backup, restore from file, or delete your account.',
  },
]

interface SettingsPageProps {
  state: AppState
  actions: AppActions
}

export function SettingsPage({ state, actions }: SettingsPageProps) {
  const [active, setActive] = useState<SettingsSectionId>(() => {
    try {
      const pending = sessionStorage.getItem('trubalance-settings-section')
      if (
        pending === 'display' ||
        pending === 'plan' ||
        pending === 'data' ||
        pending === 'structure' ||
        pending === 'support'
      ) {
        sessionStorage.removeItem('trubalance-settings-section')
        return pending
      }
    } catch {
      /* ignore */
    }
    return 'structure'
  })

  const section = SECTIONS.find((item) => item.id === active) ?? SECTIONS[0]!

  return (
    <div className="settings-page card widget-compact" data-tour="settings-page">
      <header className="settings-page-head">
        <h2 className="settings-page-title">Settings</h2>
        <p className="muted settings-page-intro">Choose a topic from the list — one section at a time.</p>
      </header>

      <div className="settings-page-body">
        <nav className="settings-contents" aria-label="Settings sections">
          <ul className="settings-contents-list">
            {SECTIONS.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className={`settings-contents-btn${active === item.id ? ' settings-contents-btn--active' : ''}`}
                  aria-current={active === item.id ? 'page' : undefined}
                  onClick={() => setActive(item.id)}
                >
                  <span className="settings-contents-label">{item.label}</span>
                  <span className="settings-contents-hint">{item.lead}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="settings-panel">
          <header className="settings-panel-head">
            <h3>{section.label}</h3>
            <p className="muted">{section.lead}</p>
          </header>

          <div className="settings-panel-body">
            {active === 'structure' && (
              <StructureManagement state={state} actions={actions} embedded />
            )}
            {active === 'display' && <DisplayPreferencesPanel embedded />}
            {active === 'plan' && <AccountSubscriptionPanel state={state} embedded />}
            {active === 'support' && <SupportMessagePanel embedded />}
            {active === 'data' && (
              <DataExportPanel
                state={state}
                embedded
                onReplaceState={actions.replaceEntireState}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
