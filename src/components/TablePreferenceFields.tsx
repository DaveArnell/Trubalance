import type {
  CellTextAlign,
  CellTextWrap,
  CellVerticalAlign,
  TableDensity,
  TablePreferences,
  TableStyle,
} from '../utils/tablePreferences'
import { DISPLAY_CURRENCY_OPTIONS, type DisplayCurrency } from '../utils/format'

const STYLE_OPTIONS: { value: TableStyle; label: string }[] = [
  { value: 'modern', label: 'Modern' },
  { value: 'platform', label: 'Spreadsheet' },
  { value: 'minimal', label: 'Minimal' },
]

const DENSITY_OPTIONS: { value: TableDensity; label: string }[] = [
  { value: 'dense', label: 'Dense' },
  { value: 'compact', label: 'Compact' },
  { value: 'comfortable', label: 'Comfortable' },
]

const HORIZONTAL_ALIGN_OPTIONS: { value: CellTextAlign; label: string }[] = [
  { value: 'left', label: 'Align left' },
  { value: 'center', label: 'Align center' },
  { value: 'right', label: 'Align right' },
]

const VERTICAL_ALIGN_OPTIONS: { value: CellVerticalAlign; label: string }[] = [
  { value: 'top', label: 'Align top' },
  { value: 'middle', label: 'Align middle' },
  { value: 'bottom', label: 'Align bottom' },
]

const WRAP_OPTIONS: { value: CellTextWrap; label: string }[] = [
  { value: 'nowrap', label: 'Single line (clip)' },
  { value: 'wrap', label: 'Wrap text' },
]

interface TablePreferenceFieldsProps {
  preferences: TablePreferences
  onChange: (patch: Partial<TablePreferences>) => void
  compact?: boolean
  includeCurrency?: boolean
}

export function TablePreferenceFields({
  preferences,
  onChange,
  compact = false,
  includeCurrency = true,
}: TablePreferenceFieldsProps) {
  const fieldClass = compact ? 'widget-settings-field widget-settings-field--compact' : 'widget-settings-field'

  return (
    <div className="table-preference-fields">
      <fieldset className="table-preference-group">
        <legend className="table-preference-legend">Table</legend>
        <label className={fieldClass}>
          <span>Style</span>
          <select value={preferences.style} onChange={(e) => onChange({ style: e.target.value as TableStyle })}>
            {STYLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <label className={fieldClass}>
          <span>Row density</span>
          <select value={preferences.density} onChange={(e) => onChange({ density: e.target.value as TableDensity })}>
            {DENSITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </fieldset>

      <fieldset className="table-preference-group">
        <legend className="table-preference-legend">Cells</legend>
        <label className={fieldClass}>
          <span>Horizontal align</span>
          <select
            value={preferences.textAlign}
            onChange={(e) => onChange({ textAlign: e.target.value as CellTextAlign })}
          >
            {HORIZONTAL_ALIGN_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <label className={fieldClass}>
          <span>Vertical align</span>
          <select
            value={preferences.verticalAlign}
            onChange={(e) => onChange({ verticalAlign: e.target.value as CellVerticalAlign })}
          >
            {VERTICAL_ALIGN_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <label className={fieldClass}>
          <span>Text control</span>
          <select
            value={preferences.textWrap}
            onChange={(e) => onChange({ textWrap: e.target.value as CellTextWrap })}
          >
            {WRAP_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </fieldset>

      {includeCurrency && (
        <fieldset className="table-preference-group">
          <legend className="table-preference-legend">Numbers</legend>
          <label className={fieldClass}>
            <span>Currency</span>
            <select
              value={preferences.currency}
              onChange={(e) => onChange({ currency: e.target.value as DisplayCurrency })}
            >
              {DISPLAY_CURRENCY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        </fieldset>
      )}
    </div>
  )
}
