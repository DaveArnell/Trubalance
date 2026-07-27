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
          From your bank or accounting software, download a <strong>transaction log / export</strong>{' '}
          for this business (CSV is best; PDF statements also work). Aim for <strong>two years or
          more</strong> — longer history finds quarterly and annual bills more reliably.
        </li>
        <li>
          Set your monthly minimum below, then <strong>Copy prompt</strong>. Open your own ChatGPT (or
          similar), paste the prompt, and upload the file. Repeat once per business if you have
          several.
        </li>
        <li>
          Use the tables it returns to enter monthly costs and Reserve Planner bills in Cash Prophet.
          Start with 🟢, check 🟠, decide on 🔴.
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
          <span className="muted">Ignore recurring noise below this each month.</span>
        </label>
      </div>

      <div className="setup-statement-helper-actions">
        <button type="button" className="btn-primary" onClick={() => void handleCopy()}>
          {copied ? 'Copied' : 'Copy prompt'}
        </button>
        <p className="muted setup-statement-helper-hint">
          The prompt includes your monthly minimum. Paste it, then upload the transaction file.
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
