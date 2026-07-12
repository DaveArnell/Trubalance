import { useEffect, useMemo, useRef, useState } from 'react'
import type { AppState } from '../../types'
import type { AppActions } from '../../hooks/useAppState'
import { getAccountBusinessId } from '../../utils/accounts'
import { getScopeItemLabel } from '../../utils/scope'
import { analyzeBankTransactions, getBankImportAiStatus } from '../../bankImport/aiAdapter'
import type { BankImportAiHealth } from '../../services/bankImportApi'
import { applyBankImportSuggestions, scopeForAccount } from '../../bankImport/applySuggestions'
import { BankImportMinMonthlyField } from './BankImportMinMonthlyField'
import { readBankImportMinMonthlyAmount } from '../../utils/bankImportPreferences'
import { DEMO_BANK_CSV } from '../../bankImport/demoCsv'
import { guessColumnMapping, mapRowsToTransactions } from '../../bankImport/parseCsv'
import { BANK_STATEMENT_ACCEPT, parseBankStatementFile } from '../../bankImport/parseBankStatement'
import type {
  BankImportColumnKey,
  BankImportColumnMapping,
  BankImportSuggestion,
  ImportSuggestionStatus,
} from '../../bankImport/types'
import type { ImportTrendInsight } from '../../bankImport/trendInsights'
import { historySpanMonths } from '../../bankImport/trendInsights'
import { getImportableAccounts } from '../../bankImport/importableAccounts'
import { BANK_IMPORT_NOTE } from '../../config/setupAutomation'
import {
  BankImportSuggestionReview,
  countAcceptedSuggestions,
} from './BankImportSuggestionReview'

type WizardStep = 'account' | 'upload' | 'mapping' | 'extract' | 'review' | 'done'

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
  const [insights, setInsights] = useState<ImportTrendInsight[]>([])
  const [analyzing, setAnalyzing] = useState(false)
  const [applySummary, setApplySummary] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [minMonthlyAmount, setMinMonthlyAmount] = useState(() => readBankImportMinMonthlyAmount())
  const [aiHealth, setAiHealth] = useState<BankImportAiHealth | null>(null)
  const [aiNotes, setAiNotes] = useState<string | null>(null)

  useEffect(() => {
    void getBankImportAiStatus().then(setAiHealth)
  }, [])

  const cashAccounts = useMemo(() => getImportableAccounts(state), [state.accounts, state.venues])

  const previewRows = rows.slice(0, 4)

  const loadStatement = async (file: File) => {
    const parsed = await parseBankStatementFile(file)
    if (parsed.headers.length === 0 || parsed.rows.length === 0) {
      setError('That file looks empty. Check it is a bank statement with dates and amounts.')
      return
    }
    setError(null)
    setFileName(file.name)
    setHeaders(parsed.headers)
    setRows(parsed.rows)
    setMapping(guessColumnMapping(parsed.headers))
    setStep('mapping')
  }

  const loadCsv = (text: string, name: string) => {
    void loadStatement(new File([text], name, { type: 'text/csv' }))
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      await loadStatement(file)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Could not read that file.')
    }
  }

  const handleDemoCsv = () => {
    loadCsv(DEMO_BANK_CSV, 'demo-statement.csv')
  }

  const handleContinueToExtract = () => {
    setError(null)
    const parsed = mapRowsToTransactions(rows, mapping)
    if (parsed.length === 0) {
      setError('No transactions found. Check your column mapping and try again.')
      return
    }
    setTransactions(parsed)
    setStep('extract')
  }

  const handleRunAiAnalysis = async () => {
    const scope = scopeForAccount(state, accountId)
    if (!scope) {
      setError('Select an account linked to a business or venue.')
      return
    }

    setAnalyzing(true)
    setError(null)
    setAiNotes(null)
    try {
      const result = await analyzeBankTransactions(
        {
          transactions,
          scopeLevel: scope.scopeLevel,
          scopeId: scope.scopeId,
          minMonthlyAmount: minMonthlyAmount > 0 ? minMonthlyAmount : undefined,
        },
        { sourceAccountId: accountId, fileName },
      )

      if (!result.aiConfigured || result.suggestions.length === 0) {
        setAiNotes(
          result.aiNotes ??
            'AI could not suggest anything. Check OpenAI is connected in Supabase, or add costs manually.',
        )
      }

      setSuggestions(result.suggestions)
      setInsights(result.insights ?? [])
      setStep('review')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed.')
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
    setInsights([])
    setApplySummary(null)
    setError(null)
  }

  const acceptedCount = countAcceptedSuggestions(suggestions)

  return (
    <section className={`bank-import${embedded ? ' bank-import--embedded' : ''}`}>
      <header className="bank-import-header">
        <div>
          <h3 className="bank-import-title">Bank statement import</h3>
          <p className="muted bank-import-lead">{BANK_IMPORT_NOTE}</p>
        </div>
        <span className="bank-import-badge">CSV or PDF · AI assisted</span>
      </header>

      {aiHealth && (
        <p
          className={`bank-import-ai-status${aiHealth.ok ? ' bank-import-ai-status--ok' : ' bank-import-ai-status--off'}`}
          role="status"
        >
          {aiHealth.message}
        </p>
      )}

      <ol className="bank-import-steps" aria-label="Import progress">
        {(['account', 'upload', 'mapping', 'extract', 'review', 'done'] as WizardStep[]).map((key, index) => {
          const labels: Record<WizardStep, string> = {
            account: 'Account',
            upload: 'Upload',
            mapping: 'Map columns',
            extract: 'Check rows',
            review: 'Review',
            done: 'Done',
          }
          const active =
            step === key ||
            (step === 'done' && key === 'done') ||
            (['mapping', 'extract', 'review', 'done'].includes(step) && key === 'account') ||
            (['extract', 'review', 'done'].includes(step) && key === 'upload') ||
            (['extract', 'review', 'done'].includes(step) && key === 'mapping') ||
            (['review', 'done'].includes(step) && key === 'extract')
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
            CSV exports from your bank usually work best. PDF also supported.
          </p>
          <div className="bank-import-upload-row">
            <input
              ref={fileInputRef}
              type="file"
              accept={BANK_STATEMENT_ACCEPT}
              className="sr-only"
              onChange={handleFileChange}
            />
            <button
              type="button"
              className="btn-primary"
              onClick={() => fileInputRef.current?.click()}
            >
              Choose file
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

          <BankImportMinMonthlyField
            label="Minimum monthly amount to suggest"
            value={minMonthlyAmount}
            onChange={setMinMonthlyAmount}
          />

          <div className="bank-import-actions">
            <button type="button" className="btn-ghost" onClick={() => setStep('upload')}>
              Back
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={handleContinueToExtract}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {step === 'extract' && (
        <div className="bank-import-panel">
          <p className="bank-import-hint">
            We read <strong>{transactions.length}</strong> transactions from <strong>{fileName}</strong>.
            Check the sample below, then run AI analysis.
          </p>
          <div className="bank-import-preview-wrap">
            <table className="bank-import-preview">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {transactions.slice(0, 8).map((row) => (
                  <tr key={row.id}>
                    <td>{row.date}</td>
                    <td>{row.description}</td>
                    <td>{row.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {aiNotes && <p className="bank-import-error" role="alert">{aiNotes}</p>}
          <div className="bank-import-actions">
            <button type="button" className="btn-ghost" onClick={() => setStep('mapping')}>
              Back
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled={analyzing || aiHealth?.ok === false}
              onClick={() => void handleRunAiAnalysis()}
            >
              {analyzing ? 'Analysing with AI…' : 'Analyse with AI'}
            </button>
          </div>
        </div>
      )}

      {step === 'review' && (
        <div className="bank-import-panel">
          <p className="bank-import-hint">
            Parsed <strong>{transactions.length}</strong> transactions · about{' '}
            <strong>{historySpanMonths(transactions)}</strong> months of history ·{' '}
            <strong>{suggestions.length}</strong> suggestions · Accept, edit, or ignore each one
            before applying.
          </p>

          <BankImportSuggestionReview
            suggestions={suggestions}
            onUpdate={updateSuggestion}
            onSetStatus={setSuggestionStatus}
            insights={insights}
          />

          <div className="bank-import-actions">
            <button type="button" className="btn-ghost" onClick={() => setStep('extract')}>
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
            Nothing is added without your approval. You can import another statement or add anything
            missed manually in Committed Funds.
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
