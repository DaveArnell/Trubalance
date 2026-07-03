import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { AppActions } from '../../hooks/useAppState'
import type { Account, AccountType, AppState, DashboardMetrics, ViewScope } from '../../types'
import type { PageId } from '../../navigation'
import {
  AI_SETUP_STEPS,
  GUIDED_SETUP_EDITABLE_NOTE,
  GUIDED_SETUP_PATH_OPTIONS,
  STATEMENT_HISTORY_TIPS,
  type AiSetupStepId,
  type GuidedSetupPath,
} from '../../content/guidedSetup'
import { dismissSetupOnboardingLocally } from '../../content/setupOnboarding'
import { SetupOnboardingWizard } from './SetupOnboardingWizard'
import { BankImportSuggestionReview } from '../bankImport/BankImportSuggestionReview'
import { analyzeBankTransactions } from '../../bankImport/aiAdapter'
import { applyBankImportSuggestions, scopeForAccount } from '../../bankImport/applySuggestions'
import type { AccountImportResult } from '../../bankImport/importCentre'
import { mergeAccountImportInsights, mergeAccountImportSuggestions } from '../../bankImport/importCentre'
import { DEMO_BANK_CSV } from '../../bankImport/demoCsv'
import {
  guessColumnMapping,
  mapRowsToTransactions,
  parseCsvText,
} from '../../bankImport/parseCsv'
import type { BankImportColumnKey, BankImportColumnMapping, BankImportSuggestion } from '../../bankImport/types'
import { historySpanMonths } from '../../bankImport/trendInsights'
import { formatCurrency } from '../../utils/format'
import { getScopeLabel } from '../../utils/scope'

const COLUMN_LABELS: Record<BankImportColumnKey, string> = {
  date: 'Date',
  description: 'Description',
  moneyIn: 'Money in',
  moneyOut: 'Money out',
  balance: 'Balance (optional)',
}

interface VenueStructureDraft {
  name: string
  currentAccountName: string
  includeSavings: boolean
  savingsName: string
  includeReserve: boolean
  reserveName: string
}

interface GuidedSetupWizardProps {
  state: AppState
  viewScope: ViewScope
  metrics: DashboardMetrics
  actions: AppActions
  onNavigate: (pageId: PageId) => void
  onComplete: () => void
  onDismiss: () => void
}

function defaultVenueDraft(): VenueStructureDraft {
  return {
    name: '',
    currentAccountName: 'Current account',
    includeSavings: false,
    savingsName: 'Savings account',
    includeReserve: false,
    reserveName: 'Reserve account',
  }
}

function importableAccounts(state: AppState): Account[] {
  return state.accounts.filter(
    (account) => account.active && (account.type === 'current' || account.type === 'savings'),
  )
}

function accountPathLabel(state: AppState, account: Account): string {
  const business = account.businessId
    ? state.businesses.find((item) => item.id === account.businessId)
    : account.venueId
      ? state.businesses.find(
          (item) => item.id === state.venues.find((v) => v.id === account.venueId)?.businessId,
        )
      : undefined
  const venue = account.venueId ? state.venues.find((item) => item.id === account.venueId) : undefined
  return [business?.name, venue?.name, account.name].filter(Boolean).join(' → ')
}

export function GuidedSetupWizard(props: GuidedSetupWizardProps) {
  const { state, onComplete, onDismiss } = props
  const [path, setPath] = useState<GuidedSetupPath>('choose')
  const primaryBusiness = state.businesses[0]

  if (path === 'manual') {
    return <SetupOnboardingWizard {...props} onBackToPathChoice={() => setPath('choose')} />
  }

  if (path === 'choose') {
    return createPortal(
      <GuidedSetupPathChoice
        onSelect={(selected) => setPath(selected)}
        onDismiss={onDismiss}
      />,
      document.body,
    )
  }

  return createPortal(
    <GuidedSetupAiWizard
      {...props}
      primaryBusinessId={primaryBusiness?.id}
      onBack={() => setPath('choose')}
      onComplete={() => {
        dismissSetupOnboardingLocally()
        onComplete()
      }}
      onDismiss={onDismiss}
    />,
    document.body,
  )
}

function GuidedSetupPathChoice({
  onSelect,
  onDismiss,
}: {
  onSelect: (path: 'ai' | 'manual') => void
  onDismiss: () => void
}) {
  return (
    <div className="setup-onboarding-root" role="presentation">
      <button type="button" className="setup-onboarding-shade" aria-label="Close setup" onClick={onDismiss} />
      <aside
        className="setup-onboarding-panel setup-onboarding-panel--wide"
        role="dialog"
        aria-labelledby="guided-setup-path-title"
      >
        <header className="setup-onboarding-header">
          <p className="setup-onboarding-kicker">True Balance · Guided setup</p>
          <h2 id="guided-setup-path-title">How would you like to set up your business?</h2>
          <p className="setup-onboarding-explain">{GUIDED_SETUP_EDITABLE_NOTE}</p>
        </header>
        <div className="guided-setup-path-grid">
          {GUIDED_SETUP_PATH_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`guided-setup-path-card${option.id === 'ai' ? ' guided-setup-path-card--recommended' : ''}`}
              onClick={() => onSelect(option.id)}
            >
              {'badge' in option && option.badge ? (
                <span className="guided-setup-path-badge">{option.badge}</span>
              ) : null}
              <h3>{option.title}</h3>
              {'subtitle' in option && option.subtitle ? (
                <p className="guided-setup-path-subtitle">{option.subtitle}</p>
              ) : null}
              <p>{option.lead}</p>
              <ul>
                {option.highlights.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p className="guided-setup-path-time">
                Estimated setup: <strong>{option.timeEstimate}</strong>
              </p>
            </button>
          ))}
        </div>
        <footer className="setup-onboarding-footer">
          <button type="button" className="btn-ghost btn-tiny" onClick={onDismiss}>
            Skip for now
          </button>
        </footer>
      </aside>
    </div>
  )
}

function GuidedSetupAiWizard({
  state,
  viewScope,
  metrics,
  actions,
  primaryBusinessId,
  onBack,
  onComplete,
  onDismiss,
}: GuidedSetupWizardProps & {
  primaryBusinessId?: string
  onBack: () => void
}) {
  const [aiStep, setAiStep] = useState<AiSetupStepId>(primaryBusinessId ? 'import' : 'structure')
  const [businessName, setBusinessName] = useState('')
  const [singleSite, setSingleSite] = useState(false)
  const [venues, setVenues] = useState<VenueStructureDraft[]>([defaultVenueDraft()])
  const [businessCurrentName, setBusinessCurrentName] = useState('Current account')
  const [includeBusinessSavings, setIncludeBusinessSavings] = useState(false)
  const [businessSavingsName, setBusinessSavingsName] = useState('Savings account')
  const [pendingStructureAdvance, setPendingStructureAdvance] = useState(false)

  const [activeImportAccountId, setActiveImportAccountId] = useState<string | null>(null)
  const [importResults, setImportResults] = useState<AccountImportResult[]>([])
  const [fileName, setFileName] = useState('')
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<string[][]>([])
  const [mapping, setMapping] = useState<BankImportColumnMapping>({ date: 0, description: 1 })
  const [analyzing, setAnalyzing] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [reviewSuggestions, setReviewSuggestions] = useState<BankImportSuggestion[]>([])
  const [applySummary, setApplySummary] = useState<string | null>(null)

  const accounts = useMemo(() => importableAccounts(state), [state.accounts])
  const stepIndex = AI_SETUP_STEPS.findIndex((step) => step.id === aiStep)
  const business = state.businesses[0]

  useEffect(() => {
    if (!pendingStructureAdvance || !business) return
    setPendingStructureAdvance(false)
    setAiStep('import')
    if (accounts[0]) setActiveImportAccountId(accounts[0].id)
  }, [pendingStructureAdvance, business, accounts])

  const mergedSuggestions = useMemo(
    () => mergeAccountImportSuggestions(importResults),
    [importResults],
  )

  const mergedInsights = useMemo(
    () => mergeAccountImportInsights(importResults),
    [importResults],
  )

  useEffect(() => {
    if (aiStep === 'review') {
      setReviewSuggestions(mergedSuggestions)
    }
  }, [aiStep, mergedSuggestions])

  const handleStructureSave = () => {
    if (business) {
      setAiStep('import')
      if (accounts[0]) setActiveImportAccountId(accounts[0].id)
      return
    }
    const name = businessName.trim()
    if (!name) return

    if (singleSite) {
      const businessAccounts: Array<{ name: string; type: AccountType }> = [
        { name: businessCurrentName.trim() || 'Current account', type: 'current' },
      ]
      if (includeBusinessSavings) {
        businessAccounts.push({
          name: businessSavingsName.trim() || 'Savings account',
          type: 'savings',
        })
      }
      actions.setupGuidedWorkspace({ businessName: name, venues: [], businessAccounts })
    } else {
      const venuePayload = venues
        .filter((venue) => venue.name.trim())
        .map((venue) => {
          const accountList: Array<{ name: string; type: AccountType }> = [
            { name: venue.currentAccountName.trim() || 'Current account', type: 'current' },
          ]
          if (venue.includeSavings) {
            accountList.push({
              name: venue.savingsName.trim() || 'Savings account',
              type: 'savings',
            })
          }
          if (venue.includeReserve) {
            accountList.push({
              name: venue.reserveName.trim() || 'Reserve account',
              type: 'reserve',
            })
          }
          return { name: venue.name.trim(), accounts: accountList }
        })
      actions.setupGuidedWorkspace({ businessName: name, venues: venuePayload })
    }
    setPendingStructureAdvance(true)
  }

  const loadCsvForAccount = (text: string, name: string) => {
    const parsed = parseCsvText(text)
    if (parsed.headers.length === 0 || parsed.rows.length === 0) {
      setImportError('That file looks empty. Check it is a CSV with a header row.')
      return
    }
    setImportError(null)
    setFileName(name)
    setHeaders(parsed.headers)
    setRows(parsed.rows)
    setMapping(guessColumnMapping(parsed.headers))
  }

  const handleAnalyzeCurrentImport = async () => {
    if (!activeImportAccountId) return
    setImportError(null)
    const parsed = mapRowsToTransactions(rows, mapping)
    if (parsed.length === 0) {
      setImportError('No transactions found. Check your column mapping.')
      return
    }
    const scope = scopeForAccount(state, activeImportAccountId)
    if (!scope) {
      setImportError('Could not determine scope for this account.')
      return
    }
    setAnalyzing(true)
    try {
      const result = await analyzeBankTransactions({
        transactions: parsed,
        scopeLevel: scope.scopeLevel,
        scopeId: scope.scopeId,
      })
      const taggedSuggestions = result.suggestions.map((suggestion) => ({
        ...suggestion,
        sourceAccountId: activeImportAccountId,
      }))
      setImportResults((current) => {
        const without = current.filter((item) => item.accountId !== activeImportAccountId)
        return [
          ...without,
          {
            accountId: activeImportAccountId,
            fileName,
            insights: result.insights,
            session: {
              transactions: parsed,
              suggestions: taggedSuggestions,
              scopeLevel: scope.scopeLevel,
              scopeId: scope.scopeId,
            },
          },
        ]
      })
      setFileName('')
      setHeaders([])
      setRows([])
      const nextAccount = accounts.find(
        (account) =>
          account.id !== activeImportAccountId &&
          !importResults.some(
            (item) => item.accountId === account.id && item.accountId !== activeImportAccountId,
          ),
      )
      setActiveImportAccountId(nextAccount?.id ?? null)
    } finally {
      setAnalyzing(false)
    }
  }

  const skipCurrentImport = () => {
    if (!activeImportAccountId) return
    setImportResults((current) => {
      const without = current.filter((item) => item.accountId !== activeImportAccountId)
      return [
        ...without,
        {
          accountId: activeImportAccountId,
          fileName: '',
          skipped: true,
          session: {
            transactions: [],
            suggestions: [],
            scopeLevel: 'business',
            scopeId: business?.id ?? '',
          },
        },
      ]
    })
    setFileName('')
    setHeaders([])
    setRows([])
    const nextAccount = accounts.find((account) => account.id !== activeImportAccountId)
    setActiveImportAccountId(nextAccount?.id ?? null)
  }

  const updateSuggestion = (id: string, patch: Partial<BankImportSuggestion>) => {
    setReviewSuggestions((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    )
  }

  const setSuggestionStatus = (id: string, status: BankImportSuggestion['status']) => {
    updateSuggestion(id, { status })
  }

  const ensureReservePlanner = () => {
    if (!business) return
    if (state.reservePlanners.some((planner) => planner.businessId === business.id)) return
    const reserveAccount = state.accounts.find(
      (account) =>
        account.type === 'reserve' &&
        (account.businessId === business.id ||
          (account.venueId &&
            state.venues.find((v) => v.id === account.venueId)?.businessId === business.id)),
    )
    actions.addReservePlanner({
      name: `${business.name} Reserve`,
      businessId: business.id,
      bufferAmount: 0,
      actualBalance: reserveAccount ? reserveAccount.balance : 0,
      reserveAccountId: reserveAccount?.id,
      bills: [],
    })
  }

  const handleBuildTrueBalance = () => {
    ensureReservePlanner()

    const accepted = reviewSuggestions.filter(
      (item) => item.status === 'accepted' || item.status === 'edited',
    )

    if (accepted.length === 0) {
      setApplySummary('Setup complete. You can add items manually anytime.')
      setAiStep('complete')
      return
    }

    const byAccount = new Map<string, BankImportSuggestion[]>()
    for (const suggestion of accepted) {
      const accountId =
        suggestion.sourceAccountId ??
        importResults.find((item) =>
          item.session.suggestions.some((s) => s.id === suggestion.id),
        )?.accountId ??
        accounts[0]?.id
      if (!accountId) continue
      const list = byAccount.get(accountId) ?? []
      list.push(suggestion)
      byAccount.set(accountId, list)
    }

    let commitmentsCreated = 0
    let receiptsCreated = 0
    let reserveBillsCreated = 0
    const errors: string[] = []

    for (const [accountId, suggestions] of byAccount) {
      const result = applyBankImportSuggestions(state, accountId, suggestions, actions)
      commitmentsCreated += result.commitmentsCreated
      receiptsCreated += result.receiptsCreated
      reserveBillsCreated += result.reserveBillsCreated
      errors.push(...result.errors)
    }

    const parts = [
      commitmentsCreated > 0 ? `${commitmentsCreated} commitments` : null,
      receiptsCreated > 0 ? `${receiptsCreated} receipts` : null,
      reserveBillsCreated > 0 ? `${reserveBillsCreated} reserve bills` : null,
    ].filter(Boolean)

    setApplySummary(
      parts.length > 0
        ? `Created ${parts.join(', ')}. Everything remains editable.`
        : 'Setup complete. You can add items manually anytime.',
    )
    if (errors.length > 0) {
      setImportError(errors.join(' '))
    }
    setAiStep('complete')
  }

  const importedCount = importResults.filter((item) => !item.skipped && item.session.suggestions.length > 0).length
  const activeAccount = accounts.find((account) => account.id === activeImportAccountId)

  const panel = (
    <div className="setup-onboarding-root" role="presentation">
      <button type="button" className="setup-onboarding-shade" aria-label="Close setup" onClick={onDismiss} />
      <aside
        className={`setup-onboarding-panel setup-onboarding-panel--wide${aiStep === 'review' ? ' setup-onboarding-panel--review' : ''}`}
        role="dialog"
        aria-labelledby="guided-ai-title"
      >
        <header className="setup-onboarding-header">
          <p className="setup-onboarding-kicker">
            AI-assisted setup · Step {stepIndex + 1} of {AI_SETUP_STEPS.length}
          </p>
          <ol className="setup-onboarding-checklist" aria-label="Progress">
            {AI_SETUP_STEPS.map((step, index) => (
              <li
                key={step.id}
                className={
                  index < stepIndex
                    ? 'setup-onboarding-check setup-onboarding-check--done'
                    : index === stepIndex
                      ? 'setup-onboarding-check setup-onboarding-check--active'
                      : 'setup-onboarding-check'
                }
              >
                <span className="setup-onboarding-check-dot" aria-hidden />
                <span className="setup-onboarding-check-label">{step.label}</span>
              </li>
            ))}
          </ol>
        </header>

        <div className="setup-onboarding-body guided-setup-ai-body">
          {aiStep === 'structure' && (
            <>
              <h2 id="guided-ai-title">Set up your business structure</h2>
              <p className="setup-onboarding-explain">
                Tell us where each bank account lives so statements import to the right place. You
                can skip accounts and add them later.
              </p>
              {business ? (
                <p className="muted">
                  Using <strong>{business.name}</strong>. Continue to upload statements.
                </p>
              ) : (
                <div className="setup-onboarding-form">
                  <label className="setup-field">
                    <span>Business name</span>
                    <input
                      className="sheet-input"
                      value={businessName}
                      onChange={(event) => setBusinessName(event.target.value)}
                      placeholder="e.g. Laser Tag Leisure Ltd"
                      autoFocus
                    />
                  </label>
                  <label className="setup-field setup-field--checkbox">
                    <input
                      type="checkbox"
                      checked={singleSite}
                      onChange={(event) => setSingleSite(event.target.checked)}
                    />
                    <span>Single site — no separate venues</span>
                  </label>
                  {singleSite ? (
                    <>
                      <label className="setup-field">
                        <span>Current account name</span>
                        <input
                          className="sheet-input"
                          value={businessCurrentName}
                          onChange={(event) => setBusinessCurrentName(event.target.value)}
                        />
                      </label>
                      <label className="setup-field setup-field--checkbox">
                        <input
                          type="checkbox"
                          checked={includeBusinessSavings}
                          onChange={(event) => setIncludeBusinessSavings(event.target.checked)}
                        />
                        <span>Also add a savings account</span>
                      </label>
                      {includeBusinessSavings && (
                        <label className="setup-field">
                          <span>Savings account name</span>
                          <input
                            className="sheet-input"
                            value={businessSavingsName}
                            onChange={(event) => setBusinessSavingsName(event.target.value)}
                          />
                        </label>
                      )}
                    </>
                  ) : (
                    <div className="guided-setup-venue-list">
                      {venues.map((venue, index) => (
                        <div key={index} className="guided-setup-venue-card">
                          <label className="setup-field">
                            <span>Venue {venues.length > 1 ? index + 1 : ''} name</span>
                            <input
                              className="sheet-input"
                              value={venue.name}
                              onChange={(event) =>
                                setVenues((current) =>
                                  current.map((row, rowIndex) =>
                                    rowIndex === index ? { ...row, name: event.target.value } : row,
                                  ),
                                )
                              }
                              placeholder="e.g. Bournemouth"
                            />
                          </label>
                          <label className="setup-field">
                            <span>Current account</span>
                            <input
                              className="sheet-input"
                              value={venue.currentAccountName}
                              onChange={(event) =>
                                setVenues((current) =>
                                  current.map((row, rowIndex) =>
                                    rowIndex === index
                                      ? { ...row, currentAccountName: event.target.value }
                                      : row,
                                  ),
                                )
                              }
                            />
                          </label>
                          <label className="setup-field setup-field--checkbox">
                            <input
                              type="checkbox"
                              checked={venue.includeSavings}
                              onChange={(event) =>
                                setVenues((current) =>
                                  current.map((row, rowIndex) =>
                                    rowIndex === index
                                      ? { ...row, includeSavings: event.target.checked }
                                      : row,
                                  ),
                                )
                              }
                            />
                            <span>Savings account</span>
                          </label>
                          <label className="setup-field setup-field--checkbox">
                            <input
                              type="checkbox"
                              checked={venue.includeReserve}
                              onChange={(event) =>
                                setVenues((current) =>
                                  current.map((row, rowIndex) =>
                                    rowIndex === index
                                      ? { ...row, includeReserve: event.target.checked }
                                      : row,
                                  ),
                                )
                              }
                            />
                            <span>Reserve account (optional)</span>
                          </label>
                        </div>
                      ))}
                      <button
                        type="button"
                        className="btn-ghost btn-tiny"
                        onClick={() => setVenues((current) => [...current, defaultVenueDraft()])}
                      >
                        + Add another venue
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {aiStep === 'import' && (
            <>
              <h2 id="guided-ai-title">Upload bank statements</h2>
              <p className="setup-onboarding-explain">
                Pick an account, then upload its statement. True Balance will look for recurring
                costs, larger bills and expected receipts — you review everything before it is added.
              </p>
              <ul className="guided-setup-history-tips">
                {STATEMENT_HISTORY_TIPS.map((tip) => (
                  <li key={tip.months}>{tip.text}</li>
                ))}
              </ul>
              <ul className="guided-setup-import-queue">
                {accounts.map((account) => {
                  const result = importResults.find((item) => item.accountId === account.id)
                  const status = result?.skipped
                    ? 'Skipped'
                    : result
                      ? 'Imported'
                      : account.id === activeImportAccountId
                        ? 'In progress'
                        : 'Pending'
                  return (
                    <li key={account.id}>
                      <button
                        type="button"
                        className={`guided-setup-import-queue-btn${account.id === activeImportAccountId ? ' is-active' : ''}`}
                        onClick={() => setActiveImportAccountId(account.id)}
                      >
                        <span className="guided-setup-import-path">{accountPathLabel(state, account)}</span>
                        <span className={`guided-setup-import-status guided-setup-import-status--${status.toLowerCase().replace(' ', '-')}`}>
                          {status}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>

              {activeAccount && (
                <div className="guided-setup-import-panel">
                  <p className="bank-import-hint">
                    Upload statement for <strong>{accountPathLabel(state, activeAccount)}</strong>
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    className="sr-only"
                    onChange={async (event) => {
                      const file = event.target.files?.[0]
                      event.target.value = ''
                      if (!file) return
                      try {
                        loadCsvForAccount(await file.text(), file.name)
                      } catch {
                        setImportError('Could not read that file.')
                      }
                    }}
                  />
                  <div className="bank-import-upload-row">
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Choose CSV
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => loadCsvForAccount(DEMO_BANK_CSV, 'demo-statement.csv')}
                    >
                      Try demo data
                    </button>
                    <button type="button" className="btn-ghost" onClick={skipCurrentImport}>
                      Skip this account
                    </button>
                  </div>

                  {headers.length > 0 && (
                    <>
                      <p className="bank-import-hint">
                        <strong>{fileName}</strong> · map columns then analyse
                        {rows.length > 0 && (
                          <>
                            {' '}
                            · about {historySpanMonths(mapRowsToTransactions(rows, mapping))} months
                            of history
                          </>
                        )}
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
                      <button
                        type="button"
                        className="btn-primary"
                        disabled={analyzing}
                        onClick={handleAnalyzeCurrentImport}
                      >
                        {analyzing ? 'Analysing…' : 'Analyse this statement'}
                      </button>
                    </>
                  )}
                </div>
              )}

              {importError && (
                <p className="bank-import-error" role="alert">
                  {importError}
                </p>
              )}
            </>
          )}

          {aiStep === 'review' && (
            <>
              <h2 id="guided-ai-title">Review suggestions</h2>
              <p className="setup-onboarding-explain">
                Nothing is added until you accept it. For each item you can see why we suggested it,
                then accept, edit or ignore. {GUIDED_SETUP_EDITABLE_NOTE}
              </p>
              <p className="bank-import-hint">
                From <strong>{importedCount}</strong> statement{importedCount === 1 ? '' : 's'} ·{' '}
                <strong>{reviewSuggestions.length}</strong> suggestions
              </p>
              <BankImportSuggestionReview
                suggestions={reviewSuggestions}
                onUpdate={updateSuggestion}
                onSetStatus={setSuggestionStatus}
                insights={mergedInsights}
                compact
              />
            </>
          )}

          {aiStep === 'complete' && (
            <>
              <h2 id="guided-ai-title">Your True Balance is ready</h2>
              {applySummary && <p className="bank-import-success">{applySummary}</p>}
              <div className="setup-onboarding-reveal">
                <dl className="setup-reveal-math">
                  <div>
                    <dt>Cash</dt>
                    <dd>{formatCurrency(metrics.cash)}</dd>
                  </div>
                  <div>
                    <dt>Committed funds</dt>
                    <dd>−{formatCurrency(metrics.committedFunds)}</dd>
                  </div>
                  {metrics.expectedReceipts > 0 && (
                    <div>
                      <dt>Expected receipts</dt>
                      <dd>+{formatCurrency(metrics.expectedReceipts)}</dd>
                    </div>
                  )}
                  <div className="setup-reveal-total">
                    <dt>True Balance</dt>
                    <dd>{formatCurrency(metrics.trueBalance)}</dd>
                  </div>
                </dl>
              </div>
              <p className="muted">
                Viewing <strong>{getScopeLabel(state, viewScope)}</strong>. Add, rename, or delete
                anything in Settings or each section — nothing is locked because you used assisted
                setup.
              </p>
            </>
          )}
        </div>

        <footer className="setup-onboarding-footer">
          <button type="button" className="btn-ghost btn-tiny" onClick={onDismiss}>
            Skip setup
          </button>
          <div className="setup-onboarding-nav">
            <button
              type="button"
              className="btn-secondary btn-tiny"
              onClick={() => {
                if (aiStep === 'structure') onBack()
                else if (aiStep === 'import') setAiStep('structure')
                else if (aiStep === 'review') setAiStep('import')
                else if (aiStep === 'complete') setAiStep('review')
              }}
            >
              Back
            </button>
            {aiStep === 'structure' && (
              <button type="button" className="btn-primary btn-tiny" onClick={handleStructureSave}>
                Continue
              </button>
            )}
            {aiStep === 'import' && (
              <button
                type="button"
                className="btn-primary btn-tiny"
                onClick={() => setAiStep('review')}
              >
                Continue to review
              </button>
            )}
            {aiStep === 'review' && (
              <button
                type="button"
                className="btn-primary btn-tiny"
                onClick={handleBuildTrueBalance}
              >
                Build True Balance
              </button>
            )}
            {aiStep === 'complete' && (
              <button type="button" className="btn-primary btn-tiny" onClick={onComplete}>
                Go to dashboard
              </button>
            )}
          </div>
        </footer>
      </aside>
    </div>
  )

  return panel
}
