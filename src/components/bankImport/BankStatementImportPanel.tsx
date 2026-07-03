import { useMemo, useRef, useState } from 'react'
import type { AppState } from '../../types'
import type { AppActions } from '../../hooks/useAppState'
import { formatCurrency } from '../../utils/format'
import { getAccountBusinessId } from '../../utils/accounts'
import { getScopeItemLabel } from '../../utils/scope'
import { analyzeBankTransactions } from '../../bankImport/aiAdapter'
import { applyBankImportSuggestions, scopeForAccount } from '../../bankImport/applySuggestions'
import {
  categoryDisplayName,
  destinationDisplayName,
  frequencyDisplayName,
} from '../../bankImport/categorize'
import { DEMO_BANK_CSV } from '../../bankImport/demoCsv'
import {
  guessColumnMapping,
  mapRowsToTransactions,
  parseCsvText,
} from '../../bankImport/parseCsv'
import type {
  BankImportColumnKey,
  BankImportColumnMapping,
  BankImportSuggestion,
  ImportSuggestionStatus,
  SuggestionDestination,
} from '../../bankImport/types'

type WizardStep = 'account' | 'upload' | 'mapping' | 'review' | 'done'

const COLUMN_LABELS: Record<BankImportColumnKey, string> = {
  date: 'Date',
  description: 'Description',
  moneyIn: 'Money in',
  moneyOut: 'Money out',
  balance: 'Balance (optional)',
}

interface BankStatementImportPanelProps {
  state: AppState
  actions: Pick<AppActions, 'addCommitment' | 'addReceipt' | 'addReserveBill'>
  embedded?: boolean
}

function confidenceLabel(score: number): string {
  if (score >= 80) return 'High'
  if (score >= 60) return 'Medium'
  return 'Low'
}

function accountLabel(state: AppState, accountId: string): string {
  const account = state.accounts.find((item) => item.id === accountId)
  if (!account) return 'Unknown account'
  const scope = scopeForAccount(state, accountId)
  const scopeLabel = scope ? getScopeItemLabel(state, scope.scopeLevel, scope.scopeId) : ''
  return `${account.name}${scopeLabel ? ` · ${scopeLabel}` : ''}`
}

export function BankStatementImportPanel({
  state,
  actions,
  embedded = false,
}: BankStatementImportPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<WizardStep>('account')
  const [accountId, setAccountId] = useState(state.accounts.find((a) => a.active)?.id ?? '')
  const [fileName, setFileName] = useState('')
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<string[][]>([])
  const [mapping, setMapping] = useState<BankImportColumnMapping>({ date: 0, description: 1 })
  const [transactions, setTransactions] = useState<ReturnType<typeof mapRowsToTransactions>>([])
  const [suggestions, setSuggestions] = useState<BankImportSuggestion[]>([])
  const [analyzing, setAnalyzing] = useState(false)
  const [applySummary, setApplySummary] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const cashAccounts = useMemo(
    () =>
      state.accounts.filter(
        (account) => account.active && (account.type === 'current' || account.type === 'savings'),
      ),
    [state.accounts],
  )

  const previewRows = rows.slice(0, 4)

  const loadCsv = (text: string, name: string) => {
    const parsed = parseCsvText(text)
    if (parsed.headers.length === 0 || parsed.rows.length === 0) {
      setError('That file looks empty. Check it is a CSV with a header row.')
      return
    }
    setError(null)
    setFileName(name)
    setHeaders(parsed.headers)
    setRows(parsed.rows)
    setMapping(guessColumnMapping(parsed.headers))
    setStep('mapping')
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      const text = await file.text()
      loadCsv(text, file.name)
    } catch {
      setError('Could not read that file.')
    }
  }

  const handleDemoCsv = () => {
    loadCsv(DEMO_BANK_CSV, 'demo-statement.csv')
  }

  const handleParseAndAnalyze = async () => {
    setError(null)
    const parsed = mapRowsToTransactions(rows, mapping)
    if (parsed.length === 0) {
      setError('No transactions found. Check your column mapping and try again.')
      return
    }

    const scope = scopeForAccount(state, accountId)
    if (!scope) {
      setError('Select an account linked to a business or venue.')
      return
    }

    setTransactions(parsed)
    setAnalyzing(true)
    try {
      const result = await analyzeBankTransactions({
        transactions: parsed,
        scopeLevel: scope.scopeLevel,
        scopeId: scope.scopeId,
      })
      setSuggestions(result.suggestions)
      setStep('review')
    } finally {
      setAnalyzing(false)
    }
  }

  const updateSuggestion = (id: string, patch: Partial<BankImportSuggestion>) => {
    setSuggestions((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    )
  }

  const setSuggestionStatus = (id: string, status: ImportSuggestionStatus) => {
    updateSuggestion(id, { status })
  }

  const handleApply = () => {
    const result = applyBankImportSuggestions(state, accountId, suggestions, actions)
    const parts = [
      result.commitmentsCreated > 0
        ? `${result.commitmentsCreated} commitment${result.commitmentsCreated === 1 ? '' : 's'}`
        : null,
      result.receiptsCreated > 0
        ? `${result.receiptsCreated} receipt${result.receiptsCreated === 1 ? '' : 's'}`
        : null,
      result.reserveBillsCreated > 0
        ? `${result.reserveBillsCreated} reserve bill${result.reserveBillsCreated === 1 ? '' : 's'}`
        : null,
      result.ignored > 0 ? `${result.ignored} ignored` : null,
    ].filter(Boolean)

    setApplySummary(
      parts.length > 0
        ? `Created ${parts.join(', ')}. Nothing was added without your review.`
        : 'No items were created.',
    )
    if (result.errors.length > 0) {
      setError(result.errors.join(' '))
    }
    setStep('done')
  }

  const resetWizard = () => {
    setStep('account')
    setFileName('')
    setHeaders([])
    setRows([])
    setTransactions([])
    setSuggestions([])
    setApplySummary(null)
    setError(null)
  }

  const acceptedCount = suggestions.filter((item) => {
    if (item.status !== 'accepted' && item.status !== 'edited') return false
    return (item.editedDestination ?? item.destination) !== 'ignore'
  }).length

  return (
    <section className={`bank-import${embedded ? ' bank-import--embedded' : ''}`}>
      <header className="bank-import-header">
        <div>
          <h3 className="bank-import-title">Bank statement import</h3>
          <p className="muted bank-import-lead">
            Upload a CSV to detect recurring costs, receipts, and irregular bills. Review every
            suggestion before anything is added — nothing is created automatically.
          </p>
        </div>
        <span className="bank-import-badge">CSV only · Open Banking later</span>
      </header>

      <ol className="bank-import-steps" aria-label="Import progress">
        {(['account', 'upload', 'mapping', 'review', 'done'] as WizardStep[]).map((key, index) => {
          const labels: Record<WizardStep, string> = {
            account: 'Account',
            upload: 'Upload',
            mapping: 'Map columns',
            review: 'Review',
            done: 'Done',
          }
          const active =
            step === key ||
            (step === 'done' && key === 'done') ||
            (['mapping', 'review', 'done'].includes(step) && key === 'account') ||
            (['review', 'done'].includes(step) && key === 'upload') ||
            (['review', 'done'].includes(step) && key === 'mapping')
          const current = step === key
          return (
            <li
              key={key}
              className={`bank-import-step${active ? ' is-active' : ''}${current ? ' is-current' : ''}`}
            >
              <span className="bank-import-step-num">{index + 1}</span>
              {labels[key]}
            </li>
          )
        })}
      </ol>

      {error && (
        <p className="bank-import-error" role="alert">
          {error}
        </p>
      )}

      {step === 'account' && (
        <div className="bank-import-panel">
          <label className="bank-import-field">
            <span>Which account is this statement for?</span>
            <select
              className="bank-import-select"
              value={accountId}
              onChange={(event) => setAccountId(event.target.value)}
            >
              {cashAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {accountLabel(state, account.id)}
                </option>
              ))}
            </select>
          </label>
          {accountId && (
            <p className="muted bank-import-hint">
              Suggestions will attach to{' '}
              <strong>
                {(() => {
                  const scope = scopeForAccount(state, accountId)
                  return scope
                    ? getScopeItemLabel(state, scope.scopeLevel, scope.scopeId)
                    : 'this scope'
                })()}
              </strong>
              {getAccountBusinessId(state, state.accounts.find((a) => a.id === accountId)!) &&
                state.reservePlanners.length === 0 &&
                ' · Create a reserve planner first if you want irregular bills there'}
              .
            </p>
          )}
          <div className="bank-import-actions">
            <button
              type="button"
              className="btn-primary"
              disabled={!accountId}
              onClick={() => setStep('upload')}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {step === 'upload' && (
        <div className="bank-import-panel">
          <p className="bank-import-hint">
            Export a transaction list from your bank as CSV. We do not connect to your bank yet.
          </p>
          <div className="bank-import-upload-row">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              onChange={handleFileChange}
            />
            <button
              type="button"
              className="btn-primary"
              onClick={() => fileInputRef.current?.click()}
            >
              Choose CSV file
            </button>
            <button type="button" className="btn-secondary" onClick={handleDemoCsv}>
              Try demo data
            </button>
          </div>
          <div className="bank-import-actions">
            <button type="button" className="btn-ghost" onClick={() => setStep('account')}>
              Back
            </button>
          </div>
        </div>
      )}

      {step === 'mapping' && (
        <div className="bank-import-panel">
          <p className="bank-import-hint">
            File: <strong>{fileName}</strong> · {rows.length} rows
          </p>
          <div className="bank-import-mapping-grid">
            {(Object.keys(COLUMN_LABELS) as BankImportColumnKey[]).map((key) => (
              <label key={key} className="bank-import-field">
                <span>{COLUMN_LABELS[key]}</span>
                <select
                  className="bank-import-select"
                  value={mapping[key] ?? ''}
                  onChange={(event) => {
                    const value = event.target.value
                    setMapping((current) => ({
                      ...current,
                      [key]: value === '' ? undefined : Number(value),
                    }))
                  }}
                >
                  {key === 'balance' || key === 'moneyIn' || key === 'moneyOut' ? (
                    <option value="">— Not in file —</option>
                  ) : null}
                  {headers.map((header, index) => (
                    <option key={`${key}-${index}`} value={index}>
                      {header || `Column ${index + 1}`}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>

          {previewRows.length > 0 && (
            <div className="bank-import-preview-wrap">
              <table className="bank-import-preview">
                <thead>
                  <tr>
                    {headers.map((header, index) => (
                      <th key={index}>{header || `Col ${index + 1}`}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {headers.map((_, colIndex) => (
                        <td key={colIndex}>{row[colIndex] ?? ''}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="bank-import-actions">
            <button type="button" className="btn-ghost" onClick={() => setStep('upload')}>
              Back
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled={analyzing}
              onClick={handleParseAndAnalyze}
            >
              {analyzing ? 'Analysing…' : 'Analyse transactions'}
            </button>
          </div>
        </div>
      )}

      {step === 'review' && (
        <div className="bank-import-panel">
          <p className="bank-import-hint">
            Parsed <strong>{transactions.length}</strong> transactions ·{' '}
            <strong>{suggestions.length}</strong> suggestions · Accept, edit, or ignore each one
            before applying.
          </p>

          <div className="bank-import-suggestion-list">
            {suggestions.map((suggestion) => (
              <article
                key={suggestion.id}
                className={`bank-import-suggestion bank-import-suggestion--${suggestion.status}`}
              >
                <div className="bank-import-suggestion-head">
                  <div>
                    <input
                      className="bank-import-name-input"
                      value={suggestion.editedName ?? suggestion.suggestedName}
                      onChange={(event) =>
                        updateSuggestion(suggestion.id, {
                          editedName: event.target.value,
                          status: 'edited',
                        })
                      }
                    />
                    <p className="bank-import-suggestion-meta muted">
                      {categoryDisplayName(suggestion.category)} ·{' '}
                      {frequencyDisplayName(suggestion.frequency)}
                      {suggestion.likelyDueDay ? ` · around day ${suggestion.likelyDueDay}` : ''}
                    </p>
                  </div>
                  <div className="bank-import-confidence">
                    <span
                      className={`bank-import-confidence-pill bank-import-confidence-pill--${confidenceLabel(suggestion.confidence).toLowerCase()}`}
                    >
                      {confidenceLabel(suggestion.confidence)} · {suggestion.confidence}%
                    </span>
                  </div>
                </div>

                <p className="bank-import-reason">{suggestion.reason}</p>
                {suggestion.sampleDescriptions.length > 0 && (
                  <p className="muted bank-import-samples">
                    e.g. {suggestion.sampleDescriptions.join(' · ')}
                  </p>
                )}

                <div className="bank-import-suggestion-fields">
                  <label className="bank-import-field bank-import-field--inline">
                    <span>Amount</span>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      className="bank-import-input"
                      value={suggestion.editedAmount ?? suggestion.averageAmount}
                      onChange={(event) =>
                        updateSuggestion(suggestion.id, {
                          editedAmount: Number(event.target.value),
                          status: 'edited',
                        })
                      }
                    />
                  </label>
                  <label className="bank-import-field bank-import-field--inline">
                    <span>Add as</span>
                    <select
                      className="bank-import-select"
                      value={suggestion.editedDestination ?? suggestion.destination}
                      onChange={(event) =>
                        updateSuggestion(suggestion.id, {
                          editedDestination: event.target.value as SuggestionDestination,
                          status: 'edited',
                        })
                      }
                    >
                      {(
                        [
                          'commitment',
                          'reserve_bill',
                          'expected_receipt',
                          'ignore',
                        ] as SuggestionDestination[]
                      ).map((destination) => (
                        <option key={destination} value={destination}>
                          {destinationDisplayName(destination)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <p className="bank-import-amount-hint muted">
                    Typical {formatCurrency(suggestion.averageAmount)}
                    {suggestion.amount !== suggestion.averageAmount
                      ? ` · max ${formatCurrency(suggestion.amount)}`
                      : ''}
                  </p>
                </div>

                <div className="bank-import-suggestion-actions">
                  <button
                    type="button"
                    className={`btn-tiny${suggestion.status === 'accepted' || suggestion.status === 'edited' ? ' btn-primary' : ' btn-secondary'}`}
                    onClick={() =>
                      setSuggestionStatus(
                        suggestion.id,
                        suggestion.status === 'edited' ? 'edited' : 'accepted',
                      )
                    }
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    className="btn-tiny btn-ghost"
                    onClick={() => setSuggestionStatus(suggestion.id, 'ignored')}
                  >
                    Ignore
                  </button>
                </div>
              </article>
            ))}
          </div>

          {suggestions.length === 0 && (
            <p className="muted">No patterns detected. Try a longer statement or different account.</p>
          )}

          <div className="bank-import-actions">
            <button type="button" className="btn-ghost" onClick={() => setStep('mapping')}>
              Back
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled={acceptedCount === 0}
              onClick={handleApply}
            >
              Add {acceptedCount} accepted item{acceptedCount === 1 ? '' : 's'}
            </button>
          </div>
        </div>
      )}

      {step === 'done' && (
        <div className="bank-import-panel">
          {applySummary && <p className="bank-import-success">{applySummary}</p>}
          <p className="muted">
            Open Banking and AI-assisted categorisation can plug in later — suggestions will still
            require your approval.
          </p>
          <div className="bank-import-actions">
            <button type="button" className="btn-primary" onClick={resetWizard}>
              Import another statement
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
