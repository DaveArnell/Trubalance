import { DIY_STATEMENT_DEFAULT_MIN_MONTHLY } from '../../content/diyStatementPrompt'

interface BankImportMinMonthlyFieldProps {
  value: number
  onChange: (value: number) => void
  label?: string
  compact?: boolean
}

export function BankImportMinMonthlyField({
  value,
  onChange,
  label = 'Only suggest meaningful monthly bills',
  compact = false,
}: BankImportMinMonthlyFieldProps) {
  const effective = value > 0 ? value : DIY_STATEMENT_DEFAULT_MIN_MONTHLY

  return (
    <label
      className={`bank-import-min-amount-field${compact ? ' bank-import-min-amount-field--compact' : ''}`}
    >
      <span className="bank-import-min-amount-label">{label}</span>
      <div className="bank-import-min-amount-input">
        <span>£</span>
        <input
          type="number"
          min={0}
          step={1}
          inputMode="numeric"
          value={effective}
          onChange={(event) => {
            const parsed = Number(event.target.value)
            const next =
              Number.isFinite(parsed) && parsed > 0
                ? parsed
                : DIY_STATEMENT_DEFAULT_MIN_MONTHLY
            onChange(next)
          }}
        />
      </div>
      <small>
        Default £{DIY_STATEMENT_DEFAULT_MIN_MONTHLY}. Skip smaller recurring noise; keep clear monthly
        costs around or above this.
      </small>
    </label>
  )
}
