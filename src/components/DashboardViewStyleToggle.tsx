import { useDashboardViewPreferences } from '../contexts/DashboardViewPreferencesContext'
import { useEditReadOnly } from '../hooks/useEditReadOnly'

export function DashboardViewStyleToggle({
  compact = false,
}: {
  /** Sidebar-friendly compact control */
  compact?: boolean
}) {
  const editReadOnly = useEditReadOnly()
  const { viewStyle, setViewStyle } = useDashboardViewPreferences()

  if (editReadOnly) return null

  return (
    <div
      className={`view-mode-toggle${compact ? ' view-mode-toggle--sidebar' : ''}`}
      role="group"
      aria-label="Dashboard layout"
    >
      <button
        type="button"
        className={`view-mode-toggle-btn${viewStyle === 'spreadsheet' ? ' view-mode-toggle-btn--active' : ''}`}
        onClick={() => setViewStyle('spreadsheet')}
        title="Spreadsheet layout — tables like the desktop app"
      >
        {compact ? 'Sheet' : 'Spreadsheet'}
      </button>
      <button
        type="button"
        className={`view-mode-toggle-btn${viewStyle === 'cards' ? ' view-mode-toggle-btn--active' : ''}`}
        onClick={() => setViewStyle('cards')}
        title="Cards layout — same style as the mobile app"
      >
        Cards
      </button>
    </div>
  )
}
