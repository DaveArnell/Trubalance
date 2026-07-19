import { useTablePreferences } from '../contexts/TablePreferencesContext'
import { TablePreferenceFields } from './TablePreferenceFields'
import { DashboardViewStyleToggle } from './DashboardViewStyleToggle'

export function DisplayPreferencesPanel({ embedded = false }: { embedded?: boolean }) {
  const { globalPreferences, setGlobalPreferences } = useTablePreferences()

  const body = (
    <>
      <fieldset className="display-pref-fieldset">
        <legend>Dashboard layout</legend>
        <p className="muted display-pref-hint">
          Spreadsheet keeps the desktop tables. Cards uses the mobile-style lists for Monthly, Due,
          and Receipts — handy if you prefer that layout on a large screen too.
        </p>
        <DashboardViewStyleToggle />
      </fieldset>
      <TablePreferenceFields preferences={globalPreferences} onChange={setGlobalPreferences} />
    </>
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
            Dashboard layout (Spreadsheet or Cards), plus default table and cell formatting. Individual
            widgets can override table options from the ⋯ menu.
          </p>
        </div>
      </div>
      {body}
    </section>
  )
}
