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
          <strong className="setup-statement-helper-step-label">Download your history</strong>
          <p>
            From your bank or accounting software, download a transaction history or statement for
            this business. PDF or CSV both work. Prefer two years or more so quarterly and annual
            bills show up.
          </p>
        </li>
        <li>
          <strong className="setup-statement-helper-step-label">Copy the prompt into ChatGPT</strong>
          <p>
            Set the monthly minimum below, copy the prompt, paste it into ChatGPT, then attach the
            file. Repeat once per business if you have several.
          </p>
        </li>
        <li>
          <strong className="setup-statement-helper-step-label">Type the draft into Cash Prophet</strong>
          <p>
            Use the tables ChatGPT returns. Start with green items, check amber ones, and decide on
            red before you trust them.
          </p>
        </li>
      </ol>

      <div className="setup-statement-helper-panel">
        <label className="setup-statement-helper-field">
          <span className="setup-statement-helper-field-label">Meaningful monthly amount</span>
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
          <span className="setup-statement-helper-field-help">
            Only include monthly bills at about this size or above: costs you genuinely want to track
            and provision for. Smaller day-to-day spend stays out of the list.
          </span>
        </label>

        <div className="setup-statement-helper-actions">
          <button type="button" className="btn-primary" onClick={() => void handleCopy()}>
            {copied ? 'Copied' : 'Copy prompt'}
          </button>
          <p className="setup-statement-helper-hint">Paste into ChatGPT, then attach your file.</p>
        </div>
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
