import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { AppActions } from '../../hooks/useAppState'
import type { Account, AppState, DashboardMetrics, ViewScope } from '../../types'
import type { PageId } from '../../navigation'
import {
  AI_SETUP_STEPS,
  AUTO_SETUP_STEPS,
  GUIDED_SETUP_EDITABLE_NOTE,
  GUIDED_SETUP_PATH_OPTIONS,
  WHY_TRUE_BALANCE_CONTENT,
  RESERVE_PLANNER_SETUP_CONTENT,
  formatSetupApplySummary,
  type SetupWizardStepId,
  type GuidedSetupPath,
} from '../../content/guidedSetup'
import { BANK_IMPORT_RULE_BASED_NOTE } from '../../config/setupAutomation'
import { dismissSetupOnboardingLocally, INCOME_PATTERN_HINTS } from '../../content/setupOnboarding'
import { SetupOnboardingWizard } from './SetupOnboardingWizard'
import { SetupOnboardingShell } from './SetupOnboardingShell'
import { SetupDataSourcesPanel } from './SetupDataSourcesPanel'
import { BankImportSuggestionReview } from '../bankImport/BankImportSuggestionReview'
import { runAutoApplyFromImportResults } from '../../bankImport/autoApply'
import { applyImportBalancesToAccounts } from '../../bankImport/importBalances'
import { forecastDailyIncomeUpdatesFromImports } from '../../bankImport/forecastIncomeSync'
import { analyzeBankTransactions } from '../../bankImport/aiAdapter'
import { BankImportMinMonthlyField } from '../bankImport/BankImportMinMonthlyField'
import { readBankImportMinMonthlyAmount } from '../../utils/bankImportPreferences'
import {
  businessDraftToPayload,
  businessDraftsFromState,
  defaultBusinessDraft,
  defaultVenueDraft,
  type BusinessStructureDraft,
  type VenueStructureDraft,
} from '../../utils/structureDraftSync'
import { applyBankImportSuggestions, scopeForAccount } from '../../bankImport/applySuggestions'
import type { AccountImportResult } from '../../bankImport/importCentre'
import { mergeAccountImportInsights, mergeAccountImportSuggestions } from '../../bankImport/importCentre'
import { DEMO_BANK_CSV } from '../../bankImport/demoCsv'
import {
  guessColumnMapping,
  mapRowsToTransactions,
} from '../../bankImport/parseCsv'
import { BANK_STATEMENT_ACCEPT, parseBankStatementFile } from '../../bankImport/parseBankStatement'
import type { BankImportColumnKey, BankImportColumnMapping, BankImportSuggestion } from '../../bankImport/types'
import { historySpanMonths } from '../../bankImport/trendInsights'
import { describeImportAnalysis, summarizeImportAnalysis } from '../../bankImport/summarizeImportAnalysis'
import { formatCurrency } from '../../utils/format'
import { calculateDashboard } from '../../utils/calculations'
import { useTour } from '../../contexts/TourContext'
import { latestClosingBalanceFromTransactions } from '../../bankImport/importBalances'
import { getScopeLabel } from '../../utils/scope'
import {
  getImportableAccounts,
  businessHasImportableCashAccount,
} from '../../bankImport/importableAccounts'

const COLUMN_LABELS: Record<BankImportColumnKey, string> = {
  date: 'Date',
  description: 'Description',
  moneyIn: 'Money in',
  moneyOut: 'Money out',
  balance: 'Balance (optional)',
}

const BUSINESS_DRAFT_ACCENTS = ['var(--accent)', '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

interface GuidedSetupWizardProps {
  state: AppState
  viewScope: ViewScope
  metrics: DashboardMetrics
  actions: AppActions
  onNavigate: (pageId: PageId, reservePlannerId?: string | null) => void
  onComplete: () => void
  onDismiss: () => void
}

function businessHasVenueCurrentAccount(state: AppState, businessId: string): boolean {
  for (const account of state.accounts) {
    if (!account.active || account.type !== 'current' || !account.venueId) continue
    const venue = state.venues.find((item) => item.id === account.venueId)
    if (venue?.businessId === businessId) return true
  }
  return false
}

function ensureBusinessHasImportableAccount(
  state: AppState,
  actions: AppActions,
  businessId: string,
): void {
  if (businessHasVenueCurrentAccount(state, businessId)) return
  if (businessHasImportableCashAccount(state, businessId)) return
  actions.addBusinessAccount(businessId, 'Current account', 'current')
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
  if (venue) {
    return [business?.name, venue.name, account.name].filter(Boolean).join(' → ')
  }
  if (business) {
    return `${business.name} (business) → ${account.name}`
  }
  return account.name
}

function nextPendingImportAccountId(
  accounts: Account[],
  importResults: AccountImportResult[],
): string | null {
  return (
    accounts.find((account) => !importResults.some((item) => item.accountId === account.id))?.id ??
    null
  )
}

export function GuidedSetupWizard(props: GuidedSetupWizardProps) {
  const { onComplete, onDismiss } = props
  const { startSetupTour } = useTour()
  const [path, setPath] = useState<GuidedSetupPath>('choose')
  const primaryBusiness = props.state.businesses[0]

  const handleStartAppWalkthrough = () => {
    dismissSetupOnboardingLocally()
    onComplete()
    window.setTimeout(() => startSetupTour(), 120)
  }

  if (path === 'manual') {
    return <SetupOnboardingWizard {...props} onBackToPathChoice={() => setPath('choose')} />
  }

  if (path === 'auto' || path === 'ai') {
    return createPortal(
      <GuidedSetupAiWizard
        {...props}
        setupMode={path === 'auto' ? 'auto' : 'guided'}
        primaryBusinessId={primaryBusiness?.id}
        onBack={() => setPath('choose')}
        onFinishSetup={() => {
          dismissSetupOnboardingLocally()
          onComplete()
        }}
        onStartWalkthrough={handleStartAppWalkthrough}
        onDismiss={onDismiss}
      />,
      document.body,
    )
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

  return null
}

const PATH_OPTION_ICONS: Record<'auto' | 'ai' | 'manual', string> = {
  auto: '⚡',
  ai: '✓',
  manual: '✎',
}

function GuidedSetupPathChoice({
  onSelect,
  onDismiss,
}: {
  onSelect: (path: 'auto' | 'ai' | 'manual') => void
  onDismiss: () => void
}) {
  return (
    <SetupOnboardingShell
      kicker="Get started"
      sidebarTitle="How would you like to set up?"
      sidebarLead="Pick a path below. You can change everything later in Settings."
      contentWidth="path-choice"
      onSkip={onDismiss}
    >
      <div className="setup-flow-page setup-flow-page--path-choice">
        <div className="guided-setup-path-grid guided-setup-path-grid--flow">
          {GUIDED_SETUP_PATH_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`guided-setup-path-card${option.id === 'auto' ? ' guided-setup-path-card--recommended' : ''}`}
              onClick={() => onSelect(option.id)}
            >
              <span className="guided-setup-path-icon" aria-hidden="true">
                {PATH_OPTION_ICONS[option.id]}
              </span>
              {'badge' in option && option.badge ? (
                <span className="guided-setup-path-badge">{option.badge}</span>
              ) : null}
              <h3>{option.title}</h3>
              {'subtitle' in option && option.subtitle ? (
                <p className="guided-setup-path-subtitle">{option.subtitle}</p>
              ) : null}
              <p className="guided-setup-path-lead">{option.lead}</p>
              <ul>
                {option.highlights.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p className="guided-setup-path-time">
                <span>{option.timeEstimate}</span>
              </p>
            </button>
          ))}
        </div>
      </div>
    </SetupOnboardingShell>
  )
}

function StructureBusinessDraftEditor({
  draft,
  index,
  totalBusinesses,
  accentColor,
  onChange,
  onRemove,
}: {
  draft: BusinessStructureDraft
  index: number
  totalBusinesses: number
  accentColor: string
  onChange: (next: BusinessStructureDraft) => void
  onRemove: () => void
}) {
  const updateVenue = (venueIndex: number, patch: Partial<VenueStructureDraft>) => {
    onChange({
      ...draft,
      venues: draft.venues.map((venue, i) => (i === venueIndex ? { ...venue, ...patch } : venue)),
    })
  }

  return (
    <div className="structure-tree-node structure-tree-node--business">
      {totalBusinesses > 1 ? (
        <p className="structure-tree-business-index">Business {index + 1}</p>
      ) : null}
      <div className="structure-tree-node-head">
        <span className="structure-tree-swatch" style={{ background: accentColor }} />
        <input
          className="structure-tree-name-input"
          value={draft.name}
          onChange={(event) => onChange({ ...draft, name: event.target.value })}
          placeholder="Business name"
          autoFocus={index === 0}
        />
        {totalBusinesses > 1 ? (
          <button type="button" className="structure-tree-remove" title="Remove business" onClick={onRemove}>
            ×
          </button>
        ) : null}
      </div>
      <label className="structure-tree-toggle">
        <input
          type="checkbox"
          checked={draft.singleSite}
          onChange={(event) => onChange({ ...draft, singleSite: event.target.checked })}
        />
        <span>Single site (no separate venues)</span>
      </label>

      {draft.singleSite ? (
        <div className="structure-tree-accounts structure-tree-accounts--editable">
          <div className="structure-tree-account-row">
            <span className="structure-tree-account-icon">🏦</span>
            <input
              className="structure-tree-name-input structure-tree-name-input--small"
              value={draft.currentAccountName}
              onChange={(event) => onChange({ ...draft, currentAccountName: event.target.value })}
              placeholder="Current account name"
            />
          </div>
          <label className="structure-tree-toggle">
            <input
              type="checkbox"
              checked={draft.includeBusinessSavings}
              onChange={(event) => onChange({ ...draft, includeBusinessSavings: event.target.checked })}
            />
            <span>Add savings account</span>
          </label>
          {draft.includeBusinessSavings ? (
            <div className="structure-tree-account-row">
              <span className="structure-tree-account-icon">💰</span>
              <input
                className="structure-tree-name-input structure-tree-name-input--small"
                value={draft.businessSavingsName}
                onChange={(event) => onChange({ ...draft, businessSavingsName: event.target.value })}
                placeholder="Savings account name"
              />
            </div>
          ) : null}
        </div>
      ) : (
        <>
          <div className="structure-tree-accounts structure-tree-accounts--editable" style={{ marginTop: '8px' }}>
            <label className="structure-tree-toggle">
              <input
                type="checkbox"
                checked={draft.includeBusinessSavings}
                onChange={(event) => onChange({ ...draft, includeBusinessSavings: event.target.checked })}
              />
              <span>Business-level savings account</span>
            </label>
            {draft.includeBusinessSavings ? (
              <div className="structure-tree-account-row">
                <span className="structure-tree-account-icon">💰</span>
                <input
                  className="structure-tree-name-input structure-tree-name-input--small"
                  value={draft.businessSavingsName}
                  onChange={(event) => onChange({ ...draft, businessSavingsName: event.target.value })}
                  placeholder="Savings account name"
                />
              </div>
            ) : null}
          </div>
          <div className="structure-tree-children">
            {draft.venues.map((venue, venueIndex) => (
              <div key={venueIndex} className="structure-tree-node structure-tree-node--venue">
                <div className="structure-tree-connector" />
                <div className="structure-tree-node-head">
                  <span
                    className="structure-tree-swatch"
                    style={{ background: BUSINESS_DRAFT_ACCENTS[(venueIndex + 1) % BUSINESS_DRAFT_ACCENTS.length] }}
                  />
                  <input
                    className="structure-tree-name-input"
                    value={venue.name}
                    onChange={(event) => updateVenue(venueIndex, { name: event.target.value })}
                    placeholder={`Venue ${venueIndex + 1} name`}
                  />
                  {draft.venues.length > 1 ? (
                    <button
                      type="button"
                      className="structure-tree-remove"
                      title="Remove venue"
                      onClick={() =>
                        onChange({
                          ...draft,
                          venues: draft.venues.filter((_, i) => i !== venueIndex),
                        })
                      }
                    >
                      ×
                    </button>
                  ) : null}
                </div>
                <div className="structure-tree-accounts structure-tree-accounts--editable">
                  <div className="structure-tree-account-row">
                    <span className="structure-tree-account-icon">🏦</span>
                    <input
                      className="structure-tree-name-input structure-tree-name-input--small"
                      value={venue.currentAccountName}
                      onChange={(event) => updateVenue(venueIndex, { currentAccountName: event.target.value })}
                      placeholder="Current account"
                    />
                  </div>
                  <label className="structure-tree-toggle">
                    <input
                      type="checkbox"
                      checked={venue.includeSavings}
                      onChange={(event) => updateVenue(venueIndex, { includeSavings: event.target.checked })}
                    />
                    <span>Savings</span>
                  </label>
                  {venue.includeSavings ? (
                    <div className="structure-tree-account-row">
                      <span className="structure-tree-account-icon">💰</span>
                      <input
                        className="structure-tree-name-input structure-tree-name-input--small"
                        value={venue.savingsName}
                        onChange={(event) => updateVenue(venueIndex, { savingsName: event.target.value })}
                        placeholder="Savings account"
                      />
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
            <button
              type="button"
              className="btn-ghost btn-tiny structure-tree-add-btn"
              onClick={() => onChange({ ...draft, venues: [...draft.venues, defaultVenueDraft()] })}
            >
              + Add another venue
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function GuidedSetupAiWizard({
  state,
  viewScope: _viewScope,
  metrics,
  actions,
  primaryBusinessId: _primaryBusinessId,
  setupMode,
  onBack,
  onFinishSetup,
  onStartWalkthrough,
  onDismiss,
}: GuidedSetupWizardProps & {
  primaryBusinessId?: string
  setupMode: 'auto' | 'guided'
  onBack: () => void
  onFinishSetup: () => void
  onStartWalkthrough: () => void
}) {
  const setupSteps = setupMode === 'auto' ? AUTO_SETUP_STEPS : AI_SETUP_STEPS
  const [aiStep, setAiStep] = useState<SetupWizardStepId>(
    setupMode === 'auto' ? 'structure' : 'why',
  )
  const [businessDrafts, setBusinessDrafts] = useState<BusinessStructureDraft[]>([defaultBusinessDraft()])
  const [incomePatternDraft, setIncomePatternDraft] = useState<'steady' | 'lumpy'>('steady')
  const [includeReserveBuffer] = useState(false)
  const [reserveBufferAmount] = useState(0)
  const [pendingStructureAdvance, setPendingStructureAdvance] = useState(false)
  const [autoProcessing, setAutoProcessing] = useState(false)

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
  const [uploadDragOver, setUploadDragOver] = useState(false)
  const [minMonthlyAmount, setMinMonthlyAmount] = useState(() => readBankImportMinMonthlyAmount())
  const structureHydratedRef = useRef(false)
  const importResultsRef = useRef<AccountImportResult[]>([])
  const minMonthlyReanalyzeSkipRef = useRef(true)
  const [importActivity, setImportActivity] = useState<
    | { phase: 'idle' }
    | { phase: 'parsing'; page: number; total: number }
    | { phase: 'analyzing'; transactionCount: number }
  >({ phase: 'idle' })
  const [setupReservePlanners, setSetupReservePlanners] = useState(false)
  const [pendingAutoImportResults, setPendingAutoImportResults] = useState<AccountImportResult[] | null>(null)
  const [pendingGuidedApply, setPendingGuidedApply] = useState(false)
  const [setupFinalizePhase, setSetupFinalizePhase] = useState<'idle' | 'creating-reserve' | 'applying'>('idle')
  const [setupStats, setSetupStats] = useState({
    statementsAnalysed: 0,
    suggestionsFound: 0,
    balancesUpdated: 0,
  })

  const accounts = useMemo(() => getImportableAccounts(state), [state.accounts, state.venues])
  const stepIndex = setupSteps.findIndex((step) => step.id === aiStep)

  useEffect(() => {
    importResultsRef.current = importResults
  }, [importResults])

  const effectiveActiveImportAccountId =
    activeImportAccountId &&
    accounts.some((account) => account.id === activeImportAccountId)
      ? activeImportAccountId
      : nextPendingImportAccountId(accounts, importResults)

  const replaceImportResults = (updater: (current: AccountImportResult[]) => AccountImportResult[]) => {
    setImportResults((current) => {
      const next = updater(current)
      importResultsRef.current = next
      return next
    })
  }

  useEffect(() => {
    if (!pendingStructureAdvance || state.businesses.length === 0) return
    setPendingStructureAdvance(false)
    if (setupMode !== 'auto') {
      for (const biz of state.businesses) {
        actions.setBusinessIncomePattern(biz.id, incomePatternDraft)
      }
    }
    for (const biz of state.businesses) {
      ensureBusinessHasImportableAccount(state, actions, biz.id)
    }
    setAiStep(setupMode === 'auto' ? 'preferences' : 'import')
  }, [pendingStructureAdvance, state.businesses, state, actions, incomePatternDraft, setupMode])

  const mergedSuggestions = useMemo(
    () => mergeAccountImportSuggestions(importResults),
    [importResults],
  )

  const mergedInsights = useMemo(
    () => mergeAccountImportInsights(importResults),
    [importResults],
  )

  useEffect(() => {
    if (aiStep !== 'structure') {
      structureHydratedRef.current = false
      return
    }
    if (state.businesses.length > 0 && !structureHydratedRef.current) {
      setBusinessDrafts(businessDraftsFromState(state))
      structureHydratedRef.current = true
    }
  }, [aiStep, state])

  useEffect(() => {
    if (aiStep === 'review') {
      setReviewSuggestions(mergedSuggestions)
    }
  }, [aiStep, mergedSuggestions])

  useEffect(() => {
    if (aiStep !== 'import') return
    if (accounts.length === 0) return
    const hasValidActive =
      activeImportAccountId !== null &&
      accounts.some((account) => account.id === activeImportAccountId)
    if (hasValidActive) return
    setActiveImportAccountId(nextPendingImportAccountId(accounts, importResults))
  }, [aiStep, accounts, activeImportAccountId, importResults])

  useEffect(() => {
    if (aiStep !== 'import') return
    if (minMonthlyReanalyzeSkipRef.current) {
      minMonthlyReanalyzeSkipRef.current = false
      return
    }

    const analysed = importResults.filter(
      (item) => !item.skipped && item.session.transactions.length > 0,
    )
    if (analysed.length === 0) return

    let cancelled = false
    const timer = window.setTimeout(() => {
      void (async () => {
        setAnalyzing(true)
        try {
          for (const result of analysed) {
            if (cancelled) return
            await analyzeTransactionsForAccount(
              result.accountId,
              result.session.transactions,
              result.fileName,
              mapping,
            )
          }
        } finally {
          if (!cancelled) setAnalyzing(false)
        }
      })()
    }, 400)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [minMonthlyAmount])

  const advanceImportQueue = (results: AccountImportResult[]) => {
    setFileName('')
    setHeaders([])
    setRows([])
    setActiveImportAccountId(nextPendingImportAccountId(accounts, results))
  }

  const applyIncomePatternToBusinesses = () => {
    for (const biz of state.businesses) {
      actions.setBusinessIncomePattern(biz.id, incomePatternDraft)
    }
  }

  const ensureAllReservePlanners = () => {
    for (const biz of state.businesses) {
      if (state.reservePlanners.some((planner) => planner.businessId === biz.id)) continue
      const reserveAccount = state.accounts.find(
        (account) =>
          account.type === 'reserve' &&
          (account.businessId === biz.id ||
            (account.venueId &&
              state.venues.find((v) => v.id === account.venueId)?.businessId === biz.id)),
      )
      actions.addReservePlanner({
        name: `${biz.name} Reserve`,
        businessId: biz.id,
        bufferAmount: includeReserveBuffer ? reserveBufferAmount : 0,
        actualBalance: reserveAccount ? reserveAccount.balance : 0,
        reserveAccountId: reserveAccount?.id,
        bills: [],
      })
    }
  }

  const handlePreferencesContinue = () => {
    applyIncomePatternToBusinesses()
    setAiStep('import')
  }

  const handleStructureSave = () => {
    const payloads = businessDrafts
      .map(businessDraftToPayload)
      .filter((item): item is NonNullable<ReturnType<typeof businessDraftToPayload>> => item !== null)
    if (payloads.length === 0) return

    if (state.businesses.length > 0) {
      actions.syncGuidedStructureFromDrafts(payloads)
      setPendingStructureAdvance(true)
      return
    }

    actions.setupGuidedWorkspace({ businesses: payloads })
    setPendingStructureAdvance(true)
  }

  const loadStatementForAccount = async (file: File) => {
    const parsed = await parseBankStatementFile(file)
    if (parsed.headers.length === 0 || parsed.rows.length === 0) {
      setImportError('That file looks empty. Check it is a bank statement with dates and amounts.')
      return
    }
    setImportError(null)
    setFileName(file.name)
    setHeaders(parsed.headers)
    setRows(parsed.rows)
    setMapping(guessColumnMapping(parsed.headers))
  }

  const loadCsvForAccount = (text: string, name: string) => {
    void loadStatementForAccount(new File([text], name, { type: 'text/csv' }))
  }

  const handleUploadFile = async (file: File | undefined) => {
    const accountId = effectiveActiveImportAccountId
    if (!file || !accountId) {
      if (!accountId && file) {
        setImportError('Select an account on the left before uploading.')
      }
      return
    }
    try {
      setImportError(null)
      setImportActivity({ phase: 'parsing', page: 0, total: 0 })
      const parsed = await parseBankStatementFile(file, (page, total) => {
        setImportActivity({ phase: 'parsing', page, total })
      })
      if (parsed.headers.length === 0 || parsed.rows.length === 0) {
        setImportActivity({ phase: 'idle' })
        setImportError('That file looks empty. Check it is a bank statement with dates and amounts.')
        return
      }
      const columnMapping = guessColumnMapping(parsed.headers)
      const transactions = mapRowsToTransactions(parsed.rows, columnMapping)

      if (transactions.length > 0) {
        setImportActivity({ phase: 'analyzing', transactionCount: transactions.length })
        const nextResults = await analyzeTransactionsForAccount(
          accountId,
          transactions,
          file.name,
          columnMapping,
        )
        setImportActivity({ phase: 'idle' })
        if (nextResults) advanceImportQueue(nextResults)
        return
      }

      if (setupMode === 'auto') {
        setImportActivity({ phase: 'idle' })
        setImportError(
          `Read ${parsed.rows.length} row${parsed.rows.length === 1 ? '' : 's'} from the PDF but could not match dates and amounts. Try exporting CSV from your bank if this keeps happening.`,
        )
        return
      }

      setImportActivity({ phase: 'idle' })
      setImportError(
        `Read ${parsed.rows.length} row${parsed.rows.length === 1 ? '' : 's'} but could not match dates and amounts automatically. Adjust the column mapping below if needed.`,
      )
      setFileName(file.name)
      setHeaders(parsed.headers)
      setRows(parsed.rows)
      setMapping(columnMapping)
    } catch (error) {
      setImportActivity({ phase: 'idle' })
      setImportError(error instanceof Error ? error.message : 'Could not read that file.')
    }
  }

  const analyzeTransactionsForAccount = async (
    accountId: string,
    parsedTransactions: ReturnType<typeof mapRowsToTransactions>,
    sourceFileName: string,
    columnMapping: BankImportColumnMapping,
  ): Promise<AccountImportResult[] | null> => {
    const scope = scopeForAccount(state, accountId)
    if (!scope) {
      setImportError('Could not link this account to a business. Go back to structure and check your setup.')
      return null
    }
    setAnalyzing(true)
    try {
      const result = await analyzeBankTransactions({
        transactions: parsedTransactions,
        scopeLevel: scope.scopeLevel,
        scopeId: scope.scopeId,
        minMonthlyAmount: minMonthlyAmount > 0 ? minMonthlyAmount : undefined,
      })
      const taggedSuggestions = result.suggestions.map((suggestion) => ({
        ...suggestion,
        sourceAccountId: accountId,
      }))
      let nextResults: AccountImportResult[] = []
      replaceImportResults((current) => {
        const without = current.filter((item) => item.accountId !== accountId)
        nextResults = [
          ...without,
          {
            accountId,
            fileName: sourceFileName,
            insights: result.insights,
            session: {
              transactions: parsedTransactions,
              suggestions: taggedSuggestions,
              scopeLevel: scope.scopeLevel,
              scopeId: scope.scopeId,
            },
          },
        ]
        return nextResults
      })
      setMapping(columnMapping)
      return nextResults
    } finally {
      setAnalyzing(false)
    }
  }

  useEffect(() => {
    if (aiStep !== 'review') return
    for (const update of forecastDailyIncomeUpdatesFromImports(state, importResults)) {
      actions.setBusinessForecastDailyIncome(update.businessId, update.forecastDailyIncome)
    }
  }, [aiStep, importResults, state, actions])

  const handleAnalyzeCurrentImport = async () => {
    if (!activeImportAccountId) return
    setImportError(null)
    const parsed = mapRowsToTransactions(rows, mapping)
    if (parsed.length === 0) {
      setImportError('No transactions found. Check your column mapping.')
      return
    }
    const nextResults = await analyzeTransactionsForAccount(
      activeImportAccountId,
      parsed,
      fileName,
      mapping,
    )
    if (nextResults) advanceImportQueue(nextResults)
  }

  const skipCurrentImport = () => {
    if (!activeImportAccountId) return
    const scope = scopeForAccount(state, activeImportAccountId)
    let nextResults: AccountImportResult[] = []
    replaceImportResults((current) => {
      const without = current.filter((item) => item.accountId !== activeImportAccountId)
      nextResults = [
        ...without,
        {
          accountId: activeImportAccountId,
          fileName: '',
          skipped: true,
          session: {
            transactions: [],
            suggestions: [],
            scopeLevel: scope?.scopeLevel ?? 'business',
            scopeId: scope?.scopeId ?? '',
          },
        },
      ]
      return nextResults
    })
    advanceImportQueue(nextResults)
  }

  const updateSuggestion = (id: string, patch: Partial<BankImportSuggestion>) => {
    setReviewSuggestions((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    )
  }

  const setSuggestionStatus = (id: string, status: BankImportSuggestion['status']) => {
    updateSuggestion(id, { status })
  }

  const importAnalysis = useMemo(() => summarizeImportAnalysis(importResults), [importResults])

  const finalizeAutoApply = (results: AccountImportResult[], reserveEnabled: boolean) => {
    const analysis = summarizeImportAnalysis(results)
    let balancesUpdated = 0

    for (const result of results) {
      if (result.skipped) continue
      const balance = latestClosingBalanceFromTransactions(result.session.transactions)
      if (balance == null) continue
      const scope = scopeForAccount(state, result.accountId)
      if (!scope) continue
      const viewScope = { type: scope.scopeLevel, id: scope.scopeId } as ViewScope
      const { updated } = actions.saveBalanceUpdate(
        viewScope,
        getScopeLabel(state, viewScope),
        [{ accountId: result.accountId, balance }],
        'Imported from bank statement',
        true,
      )
      if (updated > 0) balancesUpdated++
    }

    const summary = runAutoApplyFromImportResults(state, results, actions)
    setSetupStats({
      statementsAnalysed: analysis.statementsAnalysed,
      suggestionsFound: analysis.suggestionCount,
      balancesUpdated,
    })
    setApplySummary(
      formatSetupApplySummary({
        commitmentsCreated: summary.commitmentsCreated,
        reserveBillsCreated: summary.reserveBillsCreated,
        receiptsCreated: summary.receiptsCreated,
        statementsAnalysed: analysis.statementsAnalysed,
        suggestionsFound: analysis.suggestionCount,
        transactionCount: analysis.transactionCount,
        outflowCount: analysis.outflowCount,
        autoAddCount: analysis.autoAddCount,
        skippedLowConfidence: analysis.skippedLowConfidence,
        balancesUpdated,
        reservePlannersEnabled: reserveEnabled,
      }),
    )
    if (summary.errors.length > 0) {
      setImportError(summary.errors.join(' '))
    }
    setPendingAutoImportResults(null)
    setSetupFinalizePhase('idle')
    setAiStep('complete')
  }

  const finalizeGuidedApply = () => {
    const accepted = reviewSuggestions.filter(
      (item) => item.status === 'accepted' || item.status === 'edited',
    )

    if (accepted.length === 0) {
      setApplySummary(
        formatSetupApplySummary({
          commitmentsCreated: 0,
          reserveBillsCreated: 0,
          receiptsCreated: 0,
          statementsAnalysed: setupStats.statementsAnalysed,
          suggestionsFound: setupStats.suggestionsFound,
          balancesUpdated: setupStats.balancesUpdated,
          reservePlannersEnabled: setupReservePlanners,
        }),
      )
      setPendingGuidedApply(false)
      setSetupFinalizePhase('idle')
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

    setApplySummary(
      formatSetupApplySummary({
        commitmentsCreated,
        reserveBillsCreated,
        receiptsCreated,
        statementsAnalysed: setupStats.statementsAnalysed,
        suggestionsFound: setupStats.suggestionsFound,
        balancesUpdated: setupStats.balancesUpdated,
        reservePlannersEnabled: setupReservePlanners,
      }),
    )
    if (errors.length > 0) {
      setImportError(errors.join(' '))
    }
    setPendingGuidedApply(false)
    setSetupFinalizePhase('idle')
    setAiStep('complete')
  }

  useEffect(() => {
    if (setupFinalizePhase !== 'creating-reserve') return
    const allReady =
      !setupReservePlanners ||
      state.businesses.every((biz) => state.reservePlanners.some((planner) => planner.businessId === biz.id))
    if (!allReady) return
    setSetupFinalizePhase('applying')
  }, [setupFinalizePhase, setupReservePlanners, state.businesses, state.reservePlanners])

  useEffect(() => {
    if (setupFinalizePhase !== 'applying') return
    if (pendingAutoImportResults === null) return
    finalizeAutoApply(pendingAutoImportResults, setupReservePlanners)
    if (pendingGuidedApply) {
      finalizeGuidedApply()
    }
    setAutoProcessing(false)
  }, [setupFinalizePhase, pendingAutoImportResults, pendingGuidedApply, setupReservePlanners])

  const handleAutoSetupComplete = async () => {
    const currentResults = importResultsRef.current
    const analysis = summarizeImportAnalysis(currentResults)
    if (analysis.transactionCount === 0) {
      setImportError(
        'No transactions were imported yet. Upload a bank statement and wait for the summary to show how many transactions were read before continuing.',
      )
      return
    }

    setImportError(null)
    setAutoProcessing(true)
    setPendingAutoImportResults(currentResults)

    try {
      if (setupReservePlanners) {
        ensureAllReservePlanners()
        setSetupFinalizePhase('creating-reserve')
        return
      }
      setSetupFinalizePhase('applying')
    } catch (error) {
      setAutoProcessing(false)
      setPendingAutoImportResults(null)
      setSetupFinalizePhase('idle')
      setImportError(error instanceof Error ? error.message : 'Setup failed. Try again.')
    }
  }

  const handleReserveContinue = () => {
    if (setupReservePlanners) {
      ensureAllReservePlanners()
      setSetupFinalizePhase('creating-reserve')
      return
    }
    setSetupFinalizePhase('applying')
  }

  const handleBuildTrueBalance = () => {
    for (const update of forecastDailyIncomeUpdatesFromImports(state, importResults)) {
      actions.setBusinessForecastDailyIncome(update.businessId, update.forecastDailyIncome)
    }

    const analysed = importResults.filter((item) => !item.skipped && item.session.transactions.length > 0)
    const suggestionsFound = analysed.reduce((sum, item) => sum + item.session.suggestions.length, 0)
    const balancesUpdated = applyImportBalancesToAccounts(importResults, actions)
    setSetupStats({
      statementsAnalysed: analysed.length,
      suggestionsFound,
      balancesUpdated,
    })
    setPendingGuidedApply(true)
    setAiStep('reserve')
  }

  const importedCount = importResults.filter((item) => !item.skipped && item.session.transactions.length > 0).length
  const activeAccount = accounts.find((account) => account.id === effectiveActiveImportAccountId)
  const activeAccountResult = effectiveActiveImportAccountId
    ? importResults.find((item) => item.accountId === effectiveActiveImportAccountId)
    : undefined
  const pendingImportAccounts = accounts.filter(
    (account) => !importResults.some((item) => item.accountId === account.id),
  )
  const hasAnalysedImport =
    importAnalysis.statementsAnalysed > 0 && importAnalysis.transactionCount > 0
  const canAutoSetup =
    hasAnalysedImport &&
    setupFinalizePhase === 'idle' &&
    !autoProcessing &&
    !analyzing &&
    importActivity.phase === 'idle'
  const autoSetupBlockReason = !hasAnalysedImport
    ? 'Upload a bank statement and wait for the analysis summary before continuing.'
    : analyzing || importActivity.phase !== 'idle'
      ? 'Still analysing your statement…'
      : undefined

  const setupMetrics = useMemo(() => {
    const groupId = state.groups[0]?.id ?? state.businesses[0]?.groupId
    if (!groupId) return metrics
    return calculateDashboard(state, { type: 'group', id: groupId })
  }, [state, metrics])

  const showTrueBalanceReveal =
    setupMetrics.cash > 0 || setupMetrics.committedFunds > 0 || setupMetrics.expectedReceipts > 0

  const contentWidth =
    aiStep === 'review' ? 'review' : aiStep === 'import' ? 'import' : 'default'

  const footer = (
    <>
      <div className="setup-flow-footer-meta">
        {setupMode === 'auto' ? 'Auto setup' : 'Guided setup'} · Step {stepIndex + 1} of {setupSteps.length}
      </div>
      <div className="setup-onboarding-nav">
        <button
          type="button"
          className="btn-secondary"
          onClick={() => {
            if (aiStep === 'why') onBack()
            else if (aiStep === 'structure') {
              if (setupMode === 'auto') onBack()
              else setAiStep('why')
            } else if (aiStep === 'preferences') setAiStep('structure')
            else if (aiStep === 'import') setAiStep(setupMode === 'auto' ? 'preferences' : 'structure')
            else if (aiStep === 'review') setAiStep('import')
            else if (aiStep === 'reserve') {
              if (setupMode === 'auto') setAiStep('import')
              else setAiStep('review')
            } else if (aiStep === 'complete') {
              setAiStep(setupMode === 'auto' ? 'import' : 'reserve')
            }
          }}
        >
          Back
        </button>
        {aiStep === 'why' && setupMode === 'guided' && (
          <button type="button" className="btn-primary" onClick={() => setAiStep('structure')}>
            Let&apos;s get started
          </button>
        )}
        {aiStep === 'structure' && (
          <button type="button" className="btn-primary" onClick={handleStructureSave}>
            Continue
          </button>
        )}
        {aiStep === 'preferences' && (
          <button type="button" className="btn-primary" onClick={handlePreferencesContinue}>
            Continue
          </button>
        )}
        {aiStep === 'import' && setupMode === 'auto' && (
          <button
            type="button"
            className="btn-primary"
            disabled={!canAutoSetup}
            title={!canAutoSetup ? autoSetupBlockReason ?? undefined : undefined}
            onClick={handleAutoSetupComplete}
          >
            {autoProcessing || setupFinalizePhase !== 'idle'
              ? 'Setting up…'
              : analyzing
                ? 'Re-analysing…'
                : 'Set up automatically'}
          </button>
        )}
        {aiStep === 'import' && setupMode === 'guided' && (
          <button type="button" className="btn-primary" onClick={() => setAiStep('review')}>
            Continue to review
          </button>
        )}
        {aiStep === 'review' && (
          <button type="button" className="btn-primary" onClick={handleBuildTrueBalance}>
            Build True Balance
          </button>
        )}
        {aiStep === 'reserve' && (
          <button
            type="button"
            className="btn-primary"
            disabled={setupFinalizePhase !== 'idle'}
            onClick={handleReserveContinue}
          >
            {setupFinalizePhase === 'applying' ? 'Finishing…' : 'Continue'}
          </button>
        )}
        {aiStep === 'complete' && (
          <button type="button" className="btn-primary" onClick={onStartWalkthrough}>
            Show me how it works
          </button>
        )}
        {aiStep === 'complete' && (
          <button type="button" className="btn-secondary" onClick={onFinishSetup}>
            Go to dashboard
          </button>
        )}
      </div>
    </>
  )

  return (
    <SetupOnboardingShell
      kicker={setupMode === 'auto' ? 'Auto setup' : 'Guided setup'}
      sidebarTitle={setupSteps[stepIndex]?.label ?? 'Setup'}
      sidebarLead="A few steps to your honest cash number."
      steps={setupSteps.map((step) => ({ id: step.id, label: step.label }))}
      currentStepIndex={stepIndex}
      contentWidth={contentWidth}
      onSkip={onDismiss}
      skipLabel="Skip setup"
      footer={footer}
    >
      <div key={aiStep} className="setup-flow-step-panel guided-setup-ai-body">
          {aiStep === 'why' && (
            <>
              <h2 id="guided-ai-title">{WHY_TRUE_BALANCE_CONTENT.title}</h2>
              <p className="setup-onboarding-explain">{WHY_TRUE_BALANCE_CONTENT.lead}</p>
              <ul className="setup-why-bullets">
                {WHY_TRUE_BALANCE_CONTENT.bullets.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </>
          )}

          {aiStep === 'structure' && (
            <>
              <h2 id="guided-ai-title">Your group structure</h2>
              <p className="setup-onboarding-explain">
                Add each business in your group, then add venues and accounts under each one.
              </p>
              <div className="structure-tree structure-tree--editable structure-tree--group">
                <p className="structure-tree-group-label">Group</p>
                {businessDrafts.map((draft, index) => (
                  <StructureBusinessDraftEditor
                    key={index}
                    draft={draft}
                    index={index}
                    totalBusinesses={businessDrafts.length}
                    accentColor={BUSINESS_DRAFT_ACCENTS[index % BUSINESS_DRAFT_ACCENTS.length]!}
                    onChange={(next) =>
                      setBusinessDrafts((current) => current.map((row, i) => (i === index ? next : row)))
                    }
                    onRemove={() => setBusinessDrafts((current) => current.filter((_, i) => i !== index))}
                  />
                ))}
                <button
                  type="button"
                  className="btn-secondary structure-tree-add-business-btn"
                  onClick={() => setBusinessDrafts((current) => [...current, defaultBusinessDraft()])}
                >
                  + Add another business
                </button>
              </div>

              {setupMode === 'guided' ? (
              <fieldset className="setup-income-pattern">
                <legend>How does money come into your business?</legend>
                <label className={`setup-income-option${incomePatternDraft === 'steady' ? ' setup-income-option--active' : ''}`}>
                  <input
                    type="radio"
                    name="aiIncomePattern"
                    value="steady"
                    checked={incomePatternDraft === 'steady'}
                    onChange={() => setIncomePatternDraft('steady')}
                  />
                  <span>
                    <strong>Steady / daily</strong>
                    <small>Retail, hospitality, trade — money comes in most days</small>
                  </span>
                </label>
                <label className={`setup-income-option${incomePatternDraft === 'lumpy' ? ' setup-income-option--active' : ''}`}>
                  <input
                    type="radio"
                    name="aiIncomePattern"
                    value="lumpy"
                    checked={incomePatternDraft === 'lumpy'}
                    onChange={() => setIncomePatternDraft('lumpy')}
                  />
                  <span>
                    <strong>Irregular / invoiced</strong>
                    <small>Contractors, agencies, consultancies — larger payments at varying intervals</small>
                  </span>
                </label>
              </fieldset>
              ) : null}
            </>
          )}

          {aiStep === 'preferences' && (
            <>
              <h2 id="guided-ai-title">How does money come in?</h2>
              <p className="setup-onboarding-explain">
                One quick choice so your forecast matches how you trade. You can change this in Settings later.
              </p>
              <fieldset className="setup-income-pattern setup-income-pattern--spacious">
                <legend className="sr-only">Income pattern</legend>
                <label className={`setup-income-option${incomePatternDraft === 'steady' ? ' setup-income-option--active' : ''}`}>
                  <input
                    type="radio"
                    name="autoIncomePattern"
                    value="steady"
                    checked={incomePatternDraft === 'steady'}
                    onChange={() => setIncomePatternDraft('steady')}
                  />
                  <span>
                    <strong>Steady / daily</strong>
                    <small>Retail, hospitality, trade — money comes in most days</small>
                  </span>
                </label>
                <label className={`setup-income-option${incomePatternDraft === 'lumpy' ? ' setup-income-option--active' : ''}`}>
                  <input
                    type="radio"
                    name="autoIncomePattern"
                    value="lumpy"
                    checked={incomePatternDraft === 'lumpy'}
                    onChange={() => setIncomePatternDraft('lumpy')}
                  />
                  <span>
                    <strong>Irregular / invoiced</strong>
                    <small>Larger payments at varying intervals</small>
                  </span>
                </label>
              </fieldset>
            </>
          )}

          {aiStep === 'import' && (
            <>
              <h2 id="guided-ai-title">
                {setupMode === 'auto' ? 'Add bank data' : 'Upload bank statements'}
              </h2>
              {setupMode === 'auto' ? (
                <>
                  <p className="setup-onboarding-lead">
                    Upload a bank statement (PDF or CSV) for each account. We scan for repeating outgoing payments — monthly costs, quarterly and annual bills — and build your setup automatically.
                  </p>
                  <p className="setup-onboarding-explain muted bank-import-rule-note">{BANK_IMPORT_RULE_BASED_NOTE}</p>
                  {minMonthlyAmount >= 100 ? (
                    <p className="bank-import-hint" role="status">
                      Minimum monthly is set to {formatCurrency(minMonthlyAmount)} — most bills under that are hidden.
                      Lower it to <strong>0</strong> to include smaller subscriptions.
                    </p>
                  ) : null}
                  <SetupDataSourcesPanel
                    compact
                    onUpload={() => fileInputRef.current?.click()}
                  />
                </>
              ) : (
                <p className="setup-onboarding-lead">
                  Upload a PDF or CSV bank statement for each account below. We read it automatically and suggest recurring costs for you to approve — column mapping is only needed if the file format is unusual.
                </p>
              )}

              {importActivity.phase === 'parsing' && importActivity.total > 0 && (
                <p className="bank-import-hint" role="status">
                  Reading PDF… page {importActivity.page} of {importActivity.total}
                </p>
              )}
              {importActivity.phase === 'analyzing' && (
                <p className="bank-import-hint" role="status">
                  Analysing {importActivity.transactionCount.toLocaleString()} transaction
                  {importActivity.transactionCount === 1 ? '' : 's'}…
                </p>
              )}

              {accounts.length === 0 ? (
                <div className="guided-setup-empty-state">
                  <p>Add at least one current or savings account before uploading statements.</p>
                  <button type="button" className="btn-secondary" onClick={() => setAiStep('structure')}>
                    Back to business setup
                  </button>
                </div>
              ) : (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={BANK_STATEMENT_ACCEPT}
                    className="sr-only"
                    onChange={async (event) => {
                      const file = event.target.files?.[0]
                      event.target.value = ''
                      await handleUploadFile(file)
                    }}
                  />
                  <div className="guided-setup-import-layout">
                    <div className="guided-setup-import-sidebar">
                      <p className="guided-setup-import-sidebar-label">Your accounts</p>
                      <ul className="guided-setup-import-queue">
                        {accounts.map((account) => {
                          const result = importResults.find((item) => item.accountId === account.id)
                          const status = result?.skipped
                            ? 'Skipped'
                            : result && result.session.transactions.length > 0
                              ? result.session.suggestions.length > 0
                                ? `${result.session.suggestions.length} found`
                                : 'Analysed'
                              : account.id === activeImportAccountId
                                ? 'Ready'
                                : 'Pending'
                          return (
                            <li key={account.id}>
                              <button
                                type="button"
                                className={`guided-setup-import-queue-btn${account.id === activeImportAccountId ? ' is-active' : ''}`}
                                onClick={() => setActiveImportAccountId(account.id)}
                              >
                                <span className="guided-setup-import-path">{accountPathLabel(state, account)}</span>
                                <span
                                  className={`guided-setup-import-status guided-setup-import-status--${status.toLowerCase().replace(' ', '-')}`}
                                >
                                  {status}
                                </span>
                              </button>
                            </li>
                          )
                        })}
                      </ul>
                      <p className="guided-setup-history-note">
                        12+ months of history works best. 24 months helps spot annual bills.
                      </p>
                      <BankImportMinMonthlyField
                        compact
                        value={minMonthlyAmount}
                        onChange={setMinMonthlyAmount}
                      />
                      {importAnalysis.statementsAnalysed > 0 && (
                        <p className="guided-setup-import-analysis">
                          {describeImportAnalysis(importAnalysis)}
                        </p>
                      )}
                      {analyzing && importAnalysis.statementsAnalysed > 0 && (
                        <p className="bank-import-hint" role="status">
                          Re-analysing with minimum monthly of{' '}
                          {minMonthlyAmount > 0 ? formatCurrency(minMonthlyAmount) : '£0'}…
                        </p>
                      )}
                      {pendingImportAccounts.length > 0 && hasAnalysedImport && (
                        <p className="bank-import-hint guided-setup-import-optional-note">
                          {pendingImportAccounts.length} account
                          {pendingImportAccounts.length === 1 ? '' : 's'} still pending — optional if you
                          only use one bank account. You can skip or upload now.
                        </p>
                      )}
                    </div>

                    {activeAccount ? (
                      <div className="guided-setup-import-main">
                        {activeAccountResult &&
                        !activeAccountResult.skipped &&
                        activeAccountResult.session.transactions.length > 0 ? (
                          <div className="guided-setup-import-done">
                            <p className="guided-setup-import-done-kicker">Statement analysed</p>
                            <h3>{activeAccountResult.fileName || 'Bank statement'}</h3>
                            <p className="bank-import-hint">
                              <strong>
                                {activeAccountResult.session.transactions.length.toLocaleString()}
                              </strong>{' '}
                              transaction
                              {activeAccountResult.session.transactions.length === 1 ? '' : 's'} · about{' '}
                              <strong>
                                {historySpanMonths(activeAccountResult.session.transactions)}
                              </strong>{' '}
                              months of history
                              {activeAccountResult.session.suggestions.length > 0 && (
                                <>
                                  {' '}
                                  · <strong>{activeAccountResult.session.suggestions.length}</strong>{' '}
                                  recurring suggestion
                                  {activeAccountResult.session.suggestions.length === 1 ? '' : 's'}
                                </>
                              )}
                            </p>
                            <div className="guided-setup-upload-actions">
                              <button
                                type="button"
                                className="btn-secondary btn-tiny"
                                onClick={() => {
                                  replaceImportResults((current) =>
                                    current.filter((item) => item.accountId !== activeAccount.id),
                                  )
                                  setFileName('')
                                  setHeaders([])
                                  setRows([])
                                  setImportError(null)
                                }}
                              >
                                Upload a different file
                              </button>
                            </div>
                          </div>
                        ) : activeAccountResult?.skipped ? (
                          <div className="guided-setup-import-done guided-setup-import-done--skipped">
                            <p className="guided-setup-import-done-kicker">Skipped</p>
                            <p className="bank-import-hint">
                              No statement uploaded for <em>{accountPathLabel(state, activeAccount)}</em>.
                            </p>
                            <button
                              type="button"
                              className="btn-secondary btn-tiny"
                              onClick={() => {
                                replaceImportResults((current) =>
                                  current.filter((item) => item.accountId !== activeAccount.id),
                                )
                              }}
                            >
                              Upload a statement
                            </button>
                          </div>
                        ) : headers.length === 0 ? (
                          <>
                            {setupMode === 'auto' &&
                            !activeAccountResult &&
                            hasAnalysedImport &&
                            activeAccount &&
                            pendingImportAccounts.some((account) => account.id === activeAccount.id) ? (
                              <div className="guided-setup-import-done guided-setup-import-done--skipped">
                                <p className="guided-setup-import-done-kicker">Optional account</p>
                                <p className="bank-import-hint">
                                  No statement needed for <em>{accountPathLabel(state, activeAccount)}</em>{' '}
                                  if this is the same bank account you already uploaded.
                                </p>
                                <button
                                  type="button"
                                  className="btn-secondary btn-tiny"
                                  onClick={() => skipCurrentImport()}
                                >
                                  Skip this account
                                </button>
                              </div>
                            ) : null}
                            <button
                              type="button"
                              className={`guided-setup-upload-zone${uploadDragOver ? ' is-dragover' : ''}`}
                              disabled={importActivity.phase !== 'idle' || analyzing}
                              onClick={() => fileInputRef.current?.click()}
                              onDragEnter={(event) => {
                                event.preventDefault()
                                setUploadDragOver(true)
                              }}
                              onDragOver={(event) => {
                                event.preventDefault()
                                setUploadDragOver(true)
                              }}
                              onDragLeave={() => setUploadDragOver(false)}
                              onDrop={async (event) => {
                                event.preventDefault()
                                setUploadDragOver(false)
                                await handleUploadFile(event.dataTransfer.files[0])
                              }}
                            >
                              <span className="guided-setup-upload-icon" aria-hidden="true">
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                                  <path
                                    d="M12 16V4m0 0l-4 4m4-4l4 4M4 17v1a3 3 0 003 3h10a3 3 0 003-3v-1"
                                    stroke="currentColor"
                                    strokeWidth="1.75"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </span>
                              <strong>Drop PDF or CSV here, or click to browse</strong>
                              <span>
                                Uploading for <em>{accountPathLabel(state, activeAccount)}</em>
                              </span>
                            </button>
                            <div className="guided-setup-upload-alt">
                              <button
                                type="button"
                                className="btn-ghost btn-tiny"
                                onClick={() => loadCsvForAccount(DEMO_BANK_CSV, 'demo-statement.csv')}
                              >
                                Try demo data
                              </button>
                              <button type="button" className="btn-ghost btn-tiny" onClick={skipCurrentImport}>
                                Skip this account
                              </button>
                            </div>
                          </>
                        ) : (
                          <div className="guided-setup-import-panel">
                            <p className="bank-import-hint">
                              <strong>{fileName}</strong>
                              {rows.length > 0 && (
                                <>
                                  {' '}
                                  · {rows.length.toLocaleString()} row{rows.length === 1 ? '' : 's'}
                                  {(() => {
                                    const parsed = mapRowsToTransactions(rows, mapping)
                                    if (parsed.length === 0) return null
                                    return (
                                      <>
                                        {' '}
                                        · {parsed.length.toLocaleString()} transaction
                                        {parsed.length === 1 ? '' : 's'} · about{' '}
                                        {historySpanMonths(parsed)} months of history
                                      </>
                                    )
                                  })()}
                                </>
                              )}
                            </p>
                            <p className="setup-onboarding-explain muted">
                              We could not read every row automatically. Adjust the mapping below if needed, then
                              analyse.
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
                            <div className="guided-setup-upload-actions">
                              <button
                                type="button"
                                className="btn-secondary btn-tiny"
                                onClick={() => {
                                  setFileName('')
                                  setHeaders([])
                                  setRows([])
                                  setImportError(null)
                                }}
                              >
                                Choose different file
                              </button>
                              <button
                                type="button"
                                className="btn-primary"
                                disabled={analyzing}
                                onClick={handleAnalyzeCurrentImport}
                              >
                                {analyzing ? 'Analysing…' : 'Analyse statement'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : importResults.length > 0 ? (
                      <div className="guided-setup-import-main">
                        <div className="guided-setup-import-done">
                          <p className="guided-setup-import-done-kicker">All accounts processed</p>
                          <h3>{setupMode === 'auto' ? 'Ready to set up' : 'Ready to review'}</h3>
                          <p className="bank-import-hint">{describeImportAnalysis(importAnalysis)}</p>
                          <p className="setup-onboarding-explain muted">
                            {setupMode === 'auto' ? (
                              <>
                                Click <strong>Set up automatically</strong> below to add recurring costs, apply your
                                closing balance, and finish setup.
                              </>
                            ) : (
                              <>
                                Use <strong>Continue to review</strong> below to approve recurring costs before they are
                                added.
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {importError && (
                    <p className="bank-import-error" role="alert">
                      {importError}
                    </p>
                  )}

                  {setupMode === 'auto' && (
                    <div className="guided-setup-auto-reserve">
                      <label className="setup-reserve-opt-in">
                        <input
                          type="checkbox"
                          checked={setupReservePlanners}
                          onChange={(event) => setSetupReservePlanners(event.target.checked)}
                        />
                        <span>
                          <strong>{RESERVE_PLANNER_SETUP_CONTENT.optInLabel}</strong>
                          <small>{RESERVE_PLANNER_SETUP_CONTENT.optInHint}</small>
                        </span>
                      </label>
                    </div>
                  )}
                </>
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

          {aiStep === 'reserve' && (
            <>
              <h2 id="guided-ai-title">{RESERVE_PLANNER_SETUP_CONTENT.title}</h2>
              <p className="setup-onboarding-explain">{RESERVE_PLANNER_SETUP_CONTENT.lead}</p>
              <ul className="setup-why-bullets">
                {RESERVE_PLANNER_SETUP_CONTENT.bullets.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <label className="setup-reserve-opt-in">
                <input
                  type="checkbox"
                  checked={setupReservePlanners}
                  onChange={(event) => setSetupReservePlanners(event.target.checked)}
                />
                <span>
                  <strong>{RESERVE_PLANNER_SETUP_CONTENT.optInLabel}</strong>
                  <small>{RESERVE_PLANNER_SETUP_CONTENT.optInHint}</small>
                </span>
              </label>
              {!setupReservePlanners && (
                <p className="setup-onboarding-explain muted">{RESERVE_PLANNER_SETUP_CONTENT.skipHint}</p>
              )}
              {setupMode === 'auto' && pendingAutoImportResults && (
                <p className="bank-import-hint">
                  {setupStats.statementsAnalysed > 0 ? (
                    <>
                      <strong>{setupStats.statementsAnalysed}</strong> statement
                      {setupStats.statementsAnalysed === 1 ? '' : 's'} ready to process
                      {setupStats.suggestionsFound > 0 && (
                        <>
                          {' '}
                          · <strong>{setupStats.suggestionsFound}</strong> recurring items detected
                        </>
                      )}
                    </>
                  ) : (
                    <>No bank statements uploaded yet — we&apos;ll still set up your structure.</>
                  )}
                </p>
              )}
            </>
          )}

          {aiStep === 'complete' && (
            <>
              <h2 id="guided-ai-title">Your True Balance is ready</h2>
              {applySummary && <p className="bank-import-success">{applySummary}</p>}
              <div className="setup-complete-stats">
                <p>
                  <strong>{state.businesses.length}</strong> business
                  {state.businesses.length === 1 ? '' : 'es'} in your group
                </p>
                {setupStats.statementsAnalysed > 0 && (
                  <p>
                    <strong>{setupStats.statementsAnalysed}</strong> bank statement
                    {setupStats.statementsAnalysed === 1 ? '' : 's'} analysed
                  </p>
                )}
                {setupReservePlanners && state.reservePlanners.length > 0 && (
                  <p>
                    <strong>{state.reservePlanners.length}</strong> reserve planner
                    {state.reservePlanners.length === 1 ? '' : 's'} ready
                  </p>
                )}
              </div>
              {showTrueBalanceReveal ? (
                <>
                  <p className="setup-onboarding-explain">
                    Your bank says one number, but now you can see what&apos;s genuinely available across your group.
                  </p>
                  <div className="setup-onboarding-reveal">
                    <dl className="setup-reveal-math">
                      <div>
                        <dt>Cash in bank</dt>
                        <dd>{formatCurrency(setupMetrics.cash)}</dd>
                      </div>
                      <div>
                        <dt>Already spoken for</dt>
                        <dd>−{formatCurrency(setupMetrics.committedFunds)}</dd>
                      </div>
                      {setupMetrics.expectedReceipts > 0 && (
                        <div>
                          <dt>Expected in</dt>
                          <dd>+{formatCurrency(setupMetrics.expectedReceipts)}</dd>
                        </div>
                      )}
                      <div className="setup-reveal-total">
                        <dt>Your True Balance</dt>
                        <dd>{formatCurrency(setupMetrics.trueBalance)}</dd>
                      </div>
                    </dl>
                  </div>
                </>
              ) : (
                <p className="setup-onboarding-explain">
                  <strong>Next step:</strong> enter your current bank balance on the dashboard (or import a statement with a
                  balance column). Your True Balance will update as soon as the numbers are in.
                </p>
              )}
              <p className="setup-income-hint">
                {INCOME_PATTERN_HINTS[incomePatternDraft]}
              </p>
              <p className="setup-onboarding-explain muted" style={{ marginTop: 'var(--space-2)' }}>
                <strong>Your routine:</strong> Update your bank balance every day or two. Mark things paid as they go out.
                {setupReservePlanners
                  ? ' Once a month, do the reserve check-in (5 minutes). The system handles the rest.'
                  : ' Add reserve planners when you are ready for annual and quarterly bills.'}
              </p>
              <p className="setup-onboarding-explain">
                Tap <strong>Show me how it works</strong> for a guided walkthrough of each page — or go straight to your dashboard.
              </p>
              <p className="muted" style={{ fontSize: '0.78rem' }}>
                Everything remains editable — add, rename, or delete anything in Settings or each section.
              </p>
            </>
          )}
        </div>
    </SetupOnboardingShell>
  )
}
