import { useState } from 'react'
import type { AppState } from '../types'
import type { AppActions } from '../hooks/useAppState'
import { DisplayPreferencesPanel } from './DisplayPreferencesPanel'
import { AccountSubscriptionPanel } from './AccountSubscriptionPanel'
import { DataExportPanel } from './DataExportPanel'
import { BankStatementImportPanel } from './bankImport/BankStatementImportPanel'
import { StructureManagement } from './StructureManagement'

type SettingsSectionId = 'display' | 'plan' | 'data' | 'structure'

const SECTIONS: {
  id: SettingsSectionId
  label: string
  lead: string
}[] = [
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
    id: 'data',
    label: 'Your data',
    lead: 'Backups, restore from file, and where your workspace is stored.',
  },
  {
    id: 'structure',
    label: 'Structure',
    lead: 'Businesses, venues, and bank accounts.',
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
      if (pending === 'display' || pending === 'plan' || pending === 'data' || pending === 'structure') {
        sessionStorage.removeItem('trubalance-settings-section')
        return pending
      }
    } catch {
      /* ignore */
    }
    return 'plan'
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
            {active === 'display' && <DisplayPreferencesPanel embedded />}
            {active === 'plan' && <AccountSubscriptionPanel state={state} embedded />}
            {active === 'data' && (
              <>
                <BankStatementImportPanel
                  state={state}
                  actions={actions}
                  embedded
                />
                <DataExportPanel
                  state={state}
                  embedded
                  onReplaceState={actions.replaceEntireState}
                />
              </>
            )}
            {active === 'structure' && (
              <StructureManagement state={state} actions={actions} embedded />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
