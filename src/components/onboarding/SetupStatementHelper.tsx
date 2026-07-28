import { useMemo, useState } from 'react'
import {
  DIY_STATEMENT_DEFAULT_MIN_MONTHLY,
  buildDiyStatementPrompt,
} from '../../content/diyStatementPrompt'
import { getCurrencySymbol } from '../../utils/format'

export function SetupStatementHelper() {
  const [minMonthly, setMinMonthly] = useState(DIY_STATEMENT_DEFAULT_MIN_MONTHLY)
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState<string | null>(null)
  const symbol = getCurrencySymbol()

  const prompt = useMemo(
    () =>
      buildDiyStatementPrompt({
        minMonthly: Number.isFinite(minMonthly) ? minMonthly : DIY_STATEMENT_DEFAULT_MIN_MONTHLY,
      }),
    [minMonthly],
  )

  const handleCopy = async () => {
    setCopyError(null)
    try {
      await navigator.clipboard.writeText(prompt)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2500)
    } catch {
      setCopyError('Could not copy automatically. Select the prompt below and copy it manually.')
    }
  }

  return (
    <div className="setup-statement-helper">
      <ol className="setup-statement-helper-steps">
        <li>
          From your bank or accounting software, download a{' '}
          <strong>transaction history / statement</strong> for this business (
          <strong>PDF or CSV</strong> — either is fine). Prefer <strong>two years or more</strong> so
          quarterly and annual bills show up.
        </li>
        <li>
          Set the monthly minimum below, then <strong>Copy prompt</strong>. Paste it into ChatGPT,
          then upload the file. Repeat once per business if you have several.
        </li>
        <li>
          Type the tables it returns into Cash Prophet. Start with 🟢, check 🟠, decide on 🔴.
        </li>
      </ol>

      <div className="setup-statement-helper-thresholds">
        <label className="setup-statement-helper-field">
          <span>Meaningful monthly amount</span>
          <span className="setup-statement-helper-input">
            <span aria-hidden>{symbol}</span>
            <input
              type="number"
              min={1}
              step={50}
              value={minMonthly}
              onChange={(e) => setMinMonthly(Number(e.target.value) || 0)}
              aria-label="Meaningful monthly amount in pounds"
            />
          </span>
          <span className="muted">
            Only include monthly bills at about this size or above — costs you genuinely want to
            track and provision for. Smaller day-to-day spend stays out of the list.
          </span>
        </label>
      </div>

      <div className="setup-statement-helper-actions">
        <button type="button" className="btn-primary" onClick={() => void handleCopy()}>
          {copied ? 'Copied' : 'Copy prompt'}
        </button>
        <p className="muted setup-statement-helper-hint">
          Paste into ChatGPT, then attach your file.
        </p>
      </div>

      {copyError && (
        <p className="setup-onboarding-form-error" role="alert">
          {copyError}
        </p>
      )}

      <details className="setup-statement-helper-preview">
        <summary>Show prompt text</summary>
        <pre className="setup-statement-helper-pre">{prompt}</pre>
      </details>
    </div>
  )
}
