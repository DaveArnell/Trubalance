import { useTablePreferences } from '../contexts/TablePreferencesContext'
import { TablePreferenceFields } from './TablePreferenceFields'

export function DisplayPreferencesPanel({ embedded = false }: { embedded?: boolean }) {
  const { globalPreferences, setGlobalPreferences } = useTablePreferences()

  const body = (
    <TablePreferenceFields preferences={globalPreferences} onChange={setGlobalPreferences} />
  )

  if (embedded) {
    return (
      <div className="display-preferences-embedded" data-tour="settings-display">
        {body}
      </div>
    )
  }

  return (
    <section className="card display-preferences-card" data-tour="settings-display">
      <div className="card-head card-head-compact">
        <div>
          <h2>Display</h2>
          <p className="muted display-preferences-lead">
            Default table and cell formatting across the app — alignment, wrap, and currency. Individual
            widgets can override table options from the ⋯ menu.
          </p>
        </div>
      </div>
      {body}
    </section>
  )
}
