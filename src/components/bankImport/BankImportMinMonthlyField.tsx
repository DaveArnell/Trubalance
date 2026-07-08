import { useState } from 'react'
import { FieldHelpTip } from '../FieldHelpTip'
import {
  BANK_IMPORT_MIN_MONTHLY_HELP,
  readBankImportMinMonthlyAmount,
  writeBankImportMinMonthlyAmount,
} from '../../utils/bankImportPreferences'

interface BankImportMinMonthlyFieldProps {
  value: number
  onChange: (value: number) => void
  label?: string
  compact?: boolean
}

export function BankImportMinMonthlyField({
  value,
  onChange,
  label = 'Minimum monthly amount',
  compact = false,
}: BankImportMinMonthlyFieldProps) {
  return (
    <label className={`bank-import-min-amount-field${compact ? ' bank-import-min-amount-field--compact' : ''}`}>
      <span className="bank-import-min-amount-label">
        {label}
        <FieldHelpTip label={label}>{BANK_IMPORT_MIN_MONTHLY_HELP}</FieldHelpTip>
      </span>
      <div className="bank-import-min-amount-input">
        <span>£</span>
        <input
          type="number"
          min={0}
          step={1}
          inputMode="numeric"
          value={value > 0 ? value : ''}
          placeholder="0"
          onChange={(event) => {
            const parsed = Number(event.target.value)
            const next = Number.isFinite(parsed) && parsed > 0 ? parsed : 0
            onChange(next)
            writeBankImportMinMonthlyAmount(next)
          }}
        />
      </div>
      <small>Recurring items below this monthly average are ignored.</small>
    </label>
  )
}

export function useBankImportMinMonthlyAmount(): [number, (value: number) => void] {
  const [value, setValue] = useState(readBankImportMinMonthlyAmount)
  return [value, setValue]
}
