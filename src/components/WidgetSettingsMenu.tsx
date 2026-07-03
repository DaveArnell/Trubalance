import { useEffect, useRef } from 'react'
import { useTablePreferences } from '../contexts/TablePreferencesContext'
import { getWidgetLabel } from '../utils/widgetLayout'
import { TablePreferenceFields } from './TablePreferenceFields'

interface WidgetSettingsMenuProps {
  widgetId: string
  anchorRect: DOMRect
  onHide: () => void
  onResetLayout: () => void
  onClose: () => void
}

export function WidgetSettingsMenu({
  widgetId,
  anchorRect,
  onHide,
  onResetLayout,
  onClose,
}: WidgetSettingsMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const { preferences, setWidgetPreferences, clearWidgetPreferences, globalPreferences } =
    useTablePreferences(widgetId)

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (menuRef.current?.contains(event.target as Node)) return
      onClose()
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('mousedown', onPointerDown)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('mousedown', onPointerDown)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [onClose])

  const top = anchorRect.bottom + 6
  const right = Math.max(12, window.innerWidth - anchorRect.right)
  const hasWidgetOverrides = JSON.stringify(preferences) !== JSON.stringify(globalPreferences)

  return (
    <div
      ref={menuRef}
      className="widget-settings-menu"
      style={{ top, right }}
      role="dialog"
      aria-label={`${getWidgetLabel(widgetId)} settings`}
    >
      <p className="widget-settings-menu-title">{getWidgetLabel(widgetId)}</p>

      <div className="widget-settings-section">
        <p className="widget-settings-label">Table &amp; cell formatting</p>
        <TablePreferenceFields
          compact
          includeCurrency={false}
          preferences={preferences}
          onChange={(patch) => setWidgetPreferences(widgetId, patch)}
        />
        {hasWidgetOverrides && (
          <button
            type="button"
            className="btn-ghost btn-tiny widget-settings-reset-prefs"
            onClick={() => clearWidgetPreferences(widgetId)}
          >
            Use global defaults
          </button>
        )}
      </div>

      <div className="widget-settings-actions">
        <button type="button" className="btn-ghost btn-tiny" onClick={onHide}>
          Hide widget
        </button>
        <button
          type="button"
          className="btn-ghost btn-tiny"
          onClick={() => {
            onResetLayout()
            onClose()
          }}
        >
          Reset page layout
        </button>
      </div>
    </div>
  )
}
