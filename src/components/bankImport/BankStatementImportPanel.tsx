import { useEffect, useMemo, useRef, useState } from 'react'
import type { AppState } from '../../types'
import type { AppActions } from '../../hooks/useAppState'
import { useSubscription } from '../../contexts/SubscriptionContext'
import { getAccountBusinessId } from '../../utils/accounts'
import { getScopeItemLabel } from '../../utils/scope'
import { analyzeBankTransactions, getBankImportAiStatus } from '../../bankImport/aiAdapter'
import type { BankImportAiHealth } from '../../services/bankImportApi'
import { applyBankImportSuggestions, scopeForAccount } from '../../bankImport/applySuggestions'
import { BankImportMinMonthlyField } from './BankImportMinMonthlyField'
import {
  readBankImportMinMonthlyAmount,
  writeBankImportMinMonthlyAmount,
} from '../../utils/bankImportPreferences'
import { DIY_STATEMENT_DEFAULT_MIN_MONTHLY } from '../../content/diyStatementPrompt'
import { DEMO_BANK_CSV } from '../../bankImport/demoCsv'
import { guessColumnMapping, mapRowsToTransactions } from '../../bankImport/parseCsv'
import { BANK_STATEMENT_ACCEPT, parseBankStatementFile } from '../../bankImport/parseBankStatement'
import type {
  BankImportColumnKey,
  BankImportColumnMapping,
  BankImportSuggestion,
  ImportSuggestionStatus,
  ParsedBankTransaction,
} from '../../bankImport/types'
import type { ImportTrendInsight } from '../../bankImport/trendInsights'
import { getImportableAccounts } from '../../bankImport/importableAccounts'
import { BANK_IMPORT_NOTE } from '../../config/setupAutomation'
import {
  BankImportSuggestionReview,
  countAcceptedSuggestions,
} from './BankImportSuggestionReview'
import {
  cacheStatementAiSuggestions,
  hasUsedStatementAiForBusiness,
  markStatementAiUsedForBusiness,
  readCachedStatementAiSuggestions,
} from '../../utils/statementAiEntitlement'

/** User-facing steps. Mapping is only a recovery screen if auto-read fails. */
type WizardStep = 'account' | 'upload' | 'mapping' | 'analyzing' | 'review' | 'done'

const COLUMN_LABELS: Record<BankImportColumnKey, string> = {
  date: 'Date',
  description: 'Description',
  moneyIn: 'Money in',
  moneyOut: 'Money out',
  balance: 'Balance (optional)',
}

const USER_STEPS = ['account', 'upload', 'review', 'done'] as const

interface BankStatementImportPanelProps {
  state: AppState
  actions: Pick<AppActions, 'addCommitment' | 'addReceipt' | 'addReserveBill'>
  embedded?: boolean
  /** Setup wizard mode — clearer copy and continue into teaching after apply. */
  onboarding?: boolean
  onOnboardingComplete?: () => void
}

function accountLabel(state: AppState, accountId: string): string {
  const account = state.accounts.find((item) => item.id === accountId)
  if (!account) return 'Unknown account'
  const scope = scopeForAccount(state, accountId)
  const scopeLabel = scope ? getScopeItemLabel(state, scope.scopeLevel, scope.scopeId) : ''
  return `${account.name}${scopeLabel ? ` · ${scopeLabel}` : ''}`
}

function businessIdForAccount(state: AppState, accountId: string): string | null {
  const account = state.accounts.find((item) => item.id === accountId)
  if (!account) return null
  return getAccountBusinessId(state, account)
}

function progressStepIndex(step: WizardStep): number {
  if (step === 'analyzing' || step === 'mapping') return 1
  if (step === 'review') return 2
  if (step === 'done') return 3
  const idx = (USER_STEPS as readonly string[]).indexOf(step)
  return Math.max(0, idx)
}

export function BankStatementImportPanel({
  state,
  actions,
  embedded = false,
  onboarding = false,
  onOnboardingComplete,
}: BankStatementImportPanelProps) {
  const { subscription, updateSubscription } = useSubscription()
  const unlimited = Boolean(subscription.statementAiUnlimited)
  const serverUsage = subscription.statementAiUsage ?? {}
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<WizardStep>('account')
  const [accountId, setAccountId] = useState(state.accounts.find((a) => a.active)?.id ?? '')
  const [fileName, setFileName] = useState('')
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<string[][]>([])
  const [mapping, setMapping] = useState<BankImportColumnMapping>({ date: 0, description: 1 })
  const [suggestions, setSuggestions] = useState<BankImportSuggestion[]>([])
  const [insights, setInsights] = useState<ImportTrendInsight[]>([])
  const [analyzing, setAnalyzing] = useState(false)
  const [applySummary, setApplySummary] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [minMonthlyAmount, setMinMonthlyAmount] = useState(() => {
    const stored = readBankImportMinMonthlyAmount()
    return stored > 0 ? stored : DIY_STATEMENT_DEFAULT_MIN_MONTHLY
  })
  const [aiHealth, setAiHealth] = useState<BankImportAiHealth | null>(null)
  const [aiNotes, setAiNotes] = useState<string | null>(null)
  const [parsedCount, setParsedCount] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const [analyzingStatus, setAnalyzingStatus] = useState(
    'Reading your statement and preparing the draft…',
  )
  const dragDepthRef = useRef(0)

  useEffect(() => {
    void getBankImportAiStatus().then(setAiHealth)
  }, [])

  useEffect(() => {
    writeBankImportMinMonthlyAmount(minMonthlyAmount)
  }, [minMonthlyAmount])

  const cashAccounts = useMemo(() => getImportableAccounts(state), [state.accounts, state.venues])
  const previewRows = rows.slice(0, 4)
  const selectedBusinessId = accountId ? businessIdForAccount(state, accountId) : null
  const analysisAlreadyUsed =
    Boolean(selectedBusinessId) &&
    hasUsedStatementAiForBusiness(selectedBusinessId!, {
      unlimited,
      serverUsage,
    })
  const activeProgress = progressStepIndex(step)

  const clearRawStatementData = () => {
    setHeaders([])
    setRows([])
    setFileName('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const runAiAnalysis = async (
    transactions: ParsedBankTransaction[],
    sourceFileName: string,
  ) => {
    const scope = scopeForAccount(state, accountId)
    if (!scope) {
      setError('Select an account linked to a business or venue.')
      setStep('account')
      return
    }

    const businessId = businessIdForAccount(state, accountId)
    if (!businessId) {
      setError('Select an account linked to a business.')
      setStep('account')
      return
    }

    if (hasUsedStatementAiForBusiness(businessId, { unlimited, serverUsage })) {
      setError(
        'This business already used its statement analysis. Open the saved review, or add anything else by hand.',
      )
      setStep('account')
      return
    }

    setAnalyzing(true)
    setStep('analyzing')
    setError(null)
    setAiNotes(null)
    setAnalyzingStatus('Reading your statement and preparing the draft…')
    try {
      const result = await analyzeBankTransactions(
        {
          transactions,
          scopeLevel: scope.scopeLevel,
          scopeId: scope.scopeId,
          businessId,
          minMonthlyAmount: minMonthlyAmount > 0 ? minMonthlyAmount : undefined,
        },
        {
          sourceAccountId: accountId,
          fileName: sourceFileName,
          onStatus: setAnalyzingStatus,
        },
      )

      if (!result.aiConfigured || result.suggestions.length === 0) {
        setAiNotes(
          result.aiNotes ??
            'AI could not suggest anything from that file. Try another export, or add costs manually.',
        )
        setStep('upload')
        return
      }

      setSuggestions(result.suggestions)
      setInsights(result.insights ?? [])
      setParsedCount(transactions.length)
      markStatementAiUsedForBusiness(businessId, undefined, { unlimited })
      if (!unlimited) {
        const usedAt = new Date().toISOString()
        updateSubscription({
          statementAiUsage: { ...serverUsage, [businessId]: usedAt },
        })
      }
      cacheStatementAiSuggestions(businessId, {
        suggestions: result.suggestions,
        insights: result.insights ?? [],
      })
      clearRawStatementData()
      setStep('review')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed.')
      setStep('upload')
    } finally {
      setAnalyzing(false)
    }
  }

  const processParsedFile = async (
    nextRows: string[][],
    nextFileName: string,
    nextMapping: BankImportColumnMapping,
    allowMappingFallback: boolean,
  ) => {
    const transactions = mapRowsToTransactions(nextRows, nextMapping)
    if (transactions.length === 0) {
      if (allowMappingFallback) {
        setError(
          'We could not read the transactions automatically. Match the columns below, then continue.',
        )
        setStep('mapping')
        return
      }
      setError('No transactions found. Check the file and try again.')
      setStep('upload')
      return
    }

    await runAiAnalysis(transactions, nextFileName)
  }

  const loadStatement = async (file: File) => {
    const parsed = await parseBankStatementFile(file)
    if (parsed.headers.length === 0 || parsed.rows.length === 0) {
      setError('That file looks empty. Check it is a bank statement with dates and amounts.')
      return
    }
    const nextMapping = guessColumnMapping(parsed.headers)
    setError(null)
    setFileName(file.name)
    setHeaders(parsed.headers)
    setRows(parsed.rows)
    setMapping(nextMapping)
    await processParsedFile(parsed.rows, file.name, nextMapping, true)
  }

  const loadCsv = (text: string, name: string) => {
    void loadStatement(new File([text], name, { type: 'text/csv' }))
  }

  const acceptDroppedFile = (file: File | undefined) => {
    if (!file || analyzing || aiHealth?.ok === false) return
    void loadStatement(file).catch((loadError) => {
      setError(loadError instanceof Error ? loadError.message : 'Could not read that file.')
      setStep('upload')
    })
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      await loadStatement(file)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not read that file.')
      setStep('upload')
    }
  }

  const handleDemoCsv = () => {
    loadCsv(DEMO_BANK_CSV, 'demo-statement.csv')
  }

  const handleRetryWithMapping = async () => {
    setError(null)
    await processParsedFile(rows, fileName, mapping, false)
  }

  const openCachedReview = () => {
    if (!selectedBusinessId) return
    const cached = readCachedStatementAiSuggestions<{
      suggestions: BankImportSuggestion[]
      insights?: ImportTrendInsight[]
    }>(selectedBusinessId)
    if (!cached?.suggestions?.length) {
      setError('No saved suggestions for this business. Add bills manually on the dashboard.')
      return
    }
    setSuggestions(cached.suggestions)
    setInsights(cached.insights ?? [])
    setStep('review')
    setError(null)
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
    clearRawStatementData()
    setStep('done')
  }

  const resetWizard = () => {
    setStep('account')
    clearRawStatementData()
    setSuggestions([])
    setInsights([])
    setApplySummary(null)
    setError(null)
    setParsedCount(0)
    setAiNotes(null)
  }

  const acceptedCount = countAcceptedSuggestions(suggestions)
  const stageTitles: Record<(typeof USER_STEPS)[number], string> = {
    account: 'Choose the account',
    upload: 'Upload your statement',
    review: 'Review the draft',
    done: 'Done',
  }
  const stageKey: (typeof USER_STEPS)[number] =
    step === 'analyzing' || step === 'mapping'
      ? 'upload'
      : step === 'review'
        ? 'review'
        : step === 'done'
          ? 'done'
          : step === 'account'
            ? 'account'
            : 'upload'
  const stageNumber = activeProgress + 1
  const stageTotal = USER_STEPS.length

  return (
    <section
      className={`bank-import${embedded ? ' bank-import--embedded' : ''}${onboarding ? ' bank-import--onboarding' : ''}`}
    >
      <header className="bank-import-header">
        <div>
          <h3 className="bank-import-title">
            {onboarding ? 'Statement upload' : 'Bank statement import'}
          </h3>
          <p className="muted bank-import-lead">
            {onboarding
              ? 'We prepare a draft list of bills from your statement. You review before anything is added.'
              : BANK_IMPORT_NOTE}
          </p>
        </div>
        <span className="bank-import-badge">CSV or PDF</span>
      </header>

      {aiHealth && !error && (
        <p
          className={`bank-import-ai-status${aiHealth.ok ? ' bank-import-ai-status--ok' : ' bank-import-ai-status--off'}`}
          role="status"
        >
          {aiHealth.message}
        </p>
      )}

      <div className="bank-import-stage" aria-label={`Stage ${stageNumber} of ${stageTotal}`}>
        <div className="bank-import-stage-top">
          <p className="bank-import-stage-kicker">
            Stage {stageNumber} of {stageTotal}
          </p>
          <h4 className="bank-import-stage-title">{stageTitles[stageKey]}</h4>
        </div>
        <div
          className="bank-import-stage-bar"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={stageTotal}
          aria-valuenow={stageNumber}
        >
          <span style={{ width: `${(stageNumber / stageTotal) * 100}%` }} />
        </div>
      </div>

      {error && (
        <p className="bank-import-error" role="alert">
          {error}
        </p>
      )}
      {aiNotes && step === 'upload' && (
        <p className="bank-import-error" role="alert">
          {aiNotes}
        </p>
      )}

      {step === 'account' && (
        <div className="bank-import-panel">
          <label className="bank-import-field">
            <span>Which current account is this statement for?</span>
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
              .
            </p>
          )}
          <BankImportMinMonthlyField
            label="Only suggest meaningful monthly bills"
            value={minMonthlyAmount}
            onChange={setMinMonthlyAmount}
          />
          <p className="muted bank-import-privacy-note">
            Your statement is processed securely to prepare a draft. We do not keep the file after
            analysis.
          </p>
          {analysisAlreadyUsed && (
            <p className="bank-import-hint" role="status">
              This business already used its AI pass.{' '}
              <button type="button" className="btn-ghost btn-tiny" onClick={openCachedReview}>
                Open saved review
              </button>
            </p>
          )}
          <div className="bank-import-actions">
            <button
              type="button"
              className="btn-primary"
              disabled={!accountId || analysisAlreadyUsed}
              onClick={() => setStep('upload')}
            >
              Continue
            </button>
            {analysisAlreadyUsed && onboarding && onOnboardingComplete ? (
              <button type="button" className="btn-secondary" onClick={onOnboardingComplete}>
                Continue setup
              </button>
            ) : null}
          </div>
        </div>
      )}

      {step === 'upload' && (
        <div className="bank-import-panel">
          <aside className="bank-import-privacy" role="note">
            <strong>Private by design.</strong> Your file is sent securely for analysis, then
            discarded from Cash Prophet. We do not keep the statement, and we do not use it to train
            models.
          </aside>
          <p className="bank-import-hint">
            Drop a CSV or PDF into the box below for{' '}
            <strong>{accountLabel(state, accountId)}</strong>. A longer history (ideally a year or
            more) usually gives a better draft.
          </p>
          <div
            className={`bank-import-dropzone${dragOver ? ' is-dragover' : ''}${analyzing || aiHealth?.ok === false ? ' is-disabled' : ''}`}
            onDragEnter={(event) => {
              event.preventDefault()
              event.stopPropagation()
              if (analyzing || aiHealth?.ok === false) return
              dragDepthRef.current += 1
              setDragOver(true)
            }}
            onDragOver={(event) => {
              event.preventDefault()
              event.stopPropagation()
              if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy'
            }}
            onDragLeave={(event) => {
              event.preventDefault()
              event.stopPropagation()
              dragDepthRef.current = Math.max(0, dragDepthRef.current - 1)
              if (dragDepthRef.current === 0) setDragOver(false)
            }}
            onDrop={(event) => {
              event.preventDefault()
              event.stopPropagation()
              dragDepthRef.current = 0
              setDragOver(false)
              acceptDroppedFile(event.dataTransfer.files?.[0])
            }}
          >
            <input
              ref={fileInputRef}
              id="bank-import-file"
              type="file"
              accept={BANK_STATEMENT_ACCEPT}
              className="sr-only"
              onChange={handleFileChange}
            />
            <p className="bank-import-dropzone-title">Drop your statement in this box</p>
            <p className="muted bank-import-dropzone-sub">CSV or PDF — or use Choose file</p>
            <div className="bank-import-upload-row">
              <button
                type="button"
                className="btn-primary"
                disabled={analyzing || aiHealth?.ok === false}
                onClick={() => fileInputRef.current?.click()}
              >
                Choose file
              </button>
              {!onboarding ? (
                <button type="button" className="btn-secondary" onClick={handleDemoCsv}>
                  Try demo data
                </button>
              ) : null}
            </div>
          </div>
          <div className="bank-import-actions">
            <button type="button" className="btn-ghost" onClick={() => setStep('account')}>
              Back
            </button>
          </div>
        </div>
      )}

      {step === 'analyzing' && (
        <div className="bank-import-panel">
          <p className="bank-import-hint" role="status">
            {analyzingStatus}
          </p>
          <p className="muted bank-import-hint">
            Please keep this page open. Most drafts finish in under a minute.
          </p>
        </div>
      )}

      {step === 'mapping' && (
        <div className="bank-import-panel">
          <p className="bank-import-hint">
            We could not read <strong>{fileName || 'that file'}</strong> automatically. Match the
            columns once, then continue — you will not normally see this step.
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
              onClick={() => void handleRetryWithMapping()}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {step === 'review' && (
        <div className="bank-import-panel">
          <p className="bank-import-hint">
            Draft ready
            {parsedCount > 0 ? (
              <>
                {' '}
                from <strong>{parsedCount}</strong> transactions
              </>
            ) : null}
            . Same style of tables as before — edit day, amount, or ignore rows, then add what you
            want.
          </p>

          <BankImportSuggestionReview
            suggestions={suggestions}
            onUpdate={updateSuggestion}
            onSetStatus={setSuggestionStatus}
            insights={insights}
          />

          <div className="bank-import-actions">
            <button
              type="button"
              className="btn-primary"
              disabled={acceptedCount === 0}
              onClick={handleApply}
            >
              Add {acceptedCount} accepted item{acceptedCount === 1 ? '' : 's'} to Cash Prophet
            </button>
          </div>
        </div>
      )}

      {step === 'done' && (
        <div className="bank-import-panel">
          {applySummary && <p className="bank-import-success">{applySummary}</p>}
          <p className="muted">
            {onboarding
              ? 'Next we will walk through how Cash Prophet works with your numbers on the screens.'
              : 'Nothing is added without your approval. You can import another statement or add anything missed manually in Committed Funds.'}
          </p>
          <div className="bank-import-actions">
            {onboarding && onOnboardingComplete ? (
              <button type="button" className="btn-primary" onClick={onOnboardingComplete}>
                Continue setup
              </button>
            ) : (
              <button type="button" className="btn-primary" onClick={resetWizard}>
                Import another statement
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
