import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { AppActions } from '../../hooks/useAppState'
import type { Account, AccountType, AppState, DashboardMetrics, ViewScope } from '../../types'
import type { PageId } from '../../navigation'
import {
  AI_SETUP_STEPS,
  AUTO_SETUP_STEPS,
  GUIDED_SETUP_EDITABLE_NOTE,
  GUIDED_SETUP_PATH_OPTIONS,
  WHY_TRUE_BALANCE_CONTENT,
  type SetupWizardStepId,
  type GuidedSetupPath,
} from '../../content/guidedSetup'
import { dismissSetupOnboardingLocally, INCOME_PATTERN_HINTS } from '../../content/setupOnboarding'
import { SetupOnboardingWizard } from './SetupOnboardingWizard'
import { SetupOnboardingShell } from './SetupOnboardingShell'
import { SetupDataSourcesPanel } from './SetupDataSourcesPanel'
import { BankImportSuggestionReview } from '../bankImport/BankImportSuggestionReview'
import { runAutoApplyFromImportResults } from '../../bankImport/autoApply'
import { forecastDailyIncomeUpdatesFromImports } from '../../bankImport/forecastIncomeSync'
import { analyzeBankTransactions } from '../../bankImport/aiAdapter'
import {
  readBankImportMinMonthlyAmount,
  writeBankImportMinMonthlyAmount,
} from '../../utils/bankImportPreferences'
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
import { formatCurrency } from '../../utils/format'

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

interface BusinessStructureDraft {
  name: string
  singleSite: boolean
  currentAccountName: string
  includeBusinessSavings: boolean
  businessSavingsName: string
  venues: VenueStructureDraft[]
}

interface GuidedBusinessPayload {
  name: string
  venues: Array<{
    name: string
    accounts: Array<{ name: string; type: AccountType }>
  }>
  businessAccounts?: Array<{ name: string; type: AccountType }>
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

function defaultBusinessDraft(): BusinessStructureDraft {
  return {
    name: '',
    singleSite: false,
    currentAccountName: 'Current account',
    includeBusinessSavings: false,
    businessSavingsName: 'Savings account',
    venues: [defaultVenueDraft()],
  }
}

function businessDraftToPayload(draft: BusinessStructureDraft): GuidedBusinessPayload | null {
  const name = draft.name.trim()
  if (!name) return null

  if (draft.singleSite) {
    const businessAccounts: Array<{ name: string; type: AccountType }> = [
      { name: draft.currentAccountName.trim() || 'Current account', type: 'current' },
    ]
    if (draft.includeBusinessSavings) {
      businessAccounts.push({
        name: draft.businessSavingsName.trim() || 'Savings account',
        type: 'savings',
      })
    }
    return { name, venues: [], businessAccounts }
  }

  const venuePayload = draft.venues
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

  const businessAccounts: Array<{ name: string; type: AccountType }> = []
  if (draft.includeBusinessSavings) {
    businessAccounts.push({
      name: draft.businessSavingsName.trim() || 'Savings account',
      type: 'savings',
    })
  }
  if (venuePayload.length === 0 && !businessAccounts.some((account) => account.type === 'current')) {
    businessAccounts.unshift({ name: 'Current account', type: 'current' })
  }

  return { name, venues: venuePayload, businessAccounts }
}

function importableAccounts(state: AppState): Account[] {
  return state.accounts.filter(
    (account) => account.active && (account.type === 'current' || account.type === 'savings'),
  )
}

function ensureBusinessHasImportableAccount(
  state: AppState,
  actions: AppActions,
  businessId: string,
): void {
  const hasImportable = importableAccounts(state).some(
    (account) =>
      account.businessId === businessId ||
      (account.venueId &&
        state.venues.find((venue) => venue.id === account.venueId)?.businessId === businessId),
  )
  if (!hasImportable) {
    actions.addBusinessAccount(businessId, 'Current account', 'current')
  }
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
  const { onComplete, onDismiss } = props
  const [path, setPath] = useState<GuidedSetupPath>('choose')
  const [appWalkthrough, setAppWalkthrough] = useState(false)
  const primaryBusiness = props.state.businesses[0]

  if (appWalkthrough) {
    return createPortal(
      <SetupOnboardingWizard
        {...props}
        startAtStepId="cash"
        onComplete={() => {
          dismissSetupOnboardingLocally()
          onComplete()
        }}
        onDismiss={onDismiss}
      />,
      document.body,
    )
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
        onStartWalkthrough={() => setAppWalkthrough(true)}
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

  const accounts = useMemo(() => importableAccounts(state), [state.accounts])
  const stepIndex = setupSteps.findIndex((step) => step.id === aiStep)
  const business = state.businesses[0]

  useEffect(() => {
    if (!pendingStructureAdvance || !business) return
    setPendingStructureAdvance(false)
    if (setupMode !== 'auto') {
      actions.setBusinessIncomePattern(business.id, incomePatternDraft)
    }
    ensureBusinessHasImportableAccount(state, actions, business.id)
    setAiStep(setupMode === 'auto' ? 'preferences' : 'import')
  }, [pendingStructureAdvance, business, state, actions, incomePatternDraft, setupMode])

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

  useEffect(() => {
    if (aiStep !== 'import') return
    if (accounts.length === 0) return
    if (!activeImportAccountId || !accounts.some((account) => account.id === activeImportAccountId)) {
      setActiveImportAccountId(accounts[0]!.id)
    }
  }, [aiStep, accounts, activeImportAccountId])

  const advanceToImport = () => {
    const targetBusiness = state.businesses[0]
    if (targetBusiness) {
      ensureBusinessHasImportableAccount(state, actions, targetBusiness.id)
    }
    setAiStep('import')
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
    ensureAllReservePlanners()
    setAiStep('import')
  }

  const handleStructureSave = () => {
    if (business) {
      if (setupMode !== 'auto') {
        actions.setBusinessIncomePattern(business.id, incomePatternDraft)
      }
      ensureBusinessHasImportableAccount(state, actions, business.id)
      if (setupMode === 'auto') {
        setAiStep('preferences')
      } else {
        advanceToImport()
      }
      return
    }

    const businesses = businessDrafts
      .map(businessDraftToPayload)
      .filter((item): item is GuidedBusinessPayload => item !== null)
    if (businesses.length === 0) return

    actions.setupGuidedWorkspace({ businesses })
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

  const promptAddBusiness = () => {
    const name = prompt('Business name:')
    if (name?.trim()) actions.addBusiness(undefined, name.trim(), true)
  }

  const handleUploadFile = async (file: File | undefined) => {
    if (!file || !activeImportAccountId) return
    try {
      const parsed = await parseBankStatementFile(file)
      if (parsed.headers.length === 0 || parsed.rows.length === 0) {
        setImportError('That file looks empty. Check it is a bank statement with dates and amounts.')
        return
      }
      const columnMapping = guessColumnMapping(parsed.headers)
      const transactions = mapRowsToTransactions(parsed.rows, columnMapping)
      if (setupMode === 'auto' && transactions.length > 0) {
        setImportError(null)
        await analyzeTransactionsForAccount(activeImportAccountId, transactions, file.name, columnMapping)
        const nextAccount = accounts.find(
          (account) =>
            account.id !== activeImportAccountId &&
            !importResults.some((item) => item.accountId === account.id),
        )
        setActiveImportAccountId(nextAccount?.id ?? null)
        return
      }
      setImportError(null)
      setFileName(file.name)
      setHeaders(parsed.headers)
      setRows(parsed.rows)
      setMapping(columnMapping)
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Could not read that file.')
    }
  }

  const analyzeTransactionsForAccount = async (
    accountId: string,
    parsedTransactions: ReturnType<typeof mapRowsToTransactions>,
    sourceFileName: string,
    columnMapping: BankImportColumnMapping,
  ) => {
    const scope = scopeForAccount(state, accountId)
    if (!scope) return
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
      setImportResults((current) => {
        const without = current.filter((item) => item.accountId !== accountId)
        return [
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
      })
      setFileName('')
      setHeaders([])
      setRows([])
      setMapping(columnMapping)
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
        minMonthlyAmount: minMonthlyAmount > 0 ? minMonthlyAmount : undefined,
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
    ensureAllReservePlanners()
  }

  const handleAutoSetupComplete = async () => {
    setImportError(null)
    setAutoProcessing(true)
    try {
      let results = importResults
      if (activeImportAccountId && headers.length > 0 && rows.length > 0) {
        const parsed = mapRowsToTransactions(rows, mapping)
        const scope = scopeForAccount(state, activeImportAccountId)
        if (parsed.length > 0 && scope) {
          const result = await analyzeBankTransactions({
            transactions: parsed,
            scopeLevel: scope.scopeLevel,
            scopeId: scope.scopeId,
            minMonthlyAmount: minMonthlyAmount > 0 ? minMonthlyAmount : undefined,
          })
          const taggedSuggestions = result.suggestions.map((suggestion) => ({
            ...suggestion,
            sourceAccountId: activeImportAccountId,
          }))
          const without = results.filter((item) => item.accountId !== activeImportAccountId)
          results = [
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
          setImportResults(results)
        }
      }
      ensureAllReservePlanners()
      const summary = runAutoApplyFromImportResults(state, results, actions)
      const parts = [
        summary.commitmentsCreated > 0 ? `${summary.commitmentsCreated} monthly costs` : null,
        summary.reserveBillsCreated > 0 ? `${summary.reserveBillsCreated} reserve bills` : null,
        summary.receiptsCreated > 0 ? `${summary.receiptsCreated} expected receipts` : null,
      ].filter(Boolean)
      setApplySummary(
        parts.length > 0
          ? `Auto setup added ${parts.join(', ')}. Adjust anything in Settings.`
          : 'Your structure is ready. Add bank CSVs anytime in Settings to auto-fill costs.',
      )
      if (summary.errors.length > 0) {
        setImportError(summary.errors.join(' '))
      }
      setAiStep('complete')
    } finally {
      setAutoProcessing(false)
    }
  }

  const handleBuildTrueBalance = () => {
    ensureReservePlanner()

    for (const update of forecastDailyIncomeUpdatesFromImports(state, importResults)) {
      actions.setBusinessForecastDailyIncome(update.businessId, update.forecastDailyIncome)
    }

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
            else if (aiStep === 'complete') setAiStep(setupMode === 'auto' ? 'import' : 'review')
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
            disabled={autoProcessing || analyzing}
            onClick={handleAutoSetupComplete}
          >
            {autoProcessing ? 'Setting up…' : 'Set up automatically'}
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
              {state.businesses.length > 0 ? (
                <div className="structure-tree">
                  <button
                    type="button"
                    className="btn-secondary btn-tiny structure-tree-add-btn"
                    onClick={promptAddBusiness}
                  >
                    + Add another business
                  </button>
                  {state.businesses.map((biz) => {
                    const bizVenues = state.venues.filter((v) => v.businessId === biz.id)
                    const bizAccounts = state.accounts.filter(
                      (a) => a.businessId === biz.id || bizVenues.some((v) => a.venueId === v.id),
                    )
                    return (
                      <div key={biz.id} className="structure-tree-node structure-tree-node--business">
                        <div className="structure-tree-node-head">
                          <span className="structure-tree-swatch" style={{ background: biz.accentColor || 'var(--accent)' }} />
                          <span className="structure-tree-node-label">{biz.name}</span>
                          {state.businesses.length > 1 && (
                            <button
                              type="button"
                              className="structure-tree-remove"
                              title="Delete business"
                              onClick={() => actions.deleteBusiness(biz.id)}
                            >
                              ×
                            </button>
                          )}
                        </div>
                        <div className="structure-tree-accounts">
                          {bizAccounts
                            .filter((a) => a.businessId === biz.id)
                            .map((a) => (
                              <span key={a.id} className="structure-tree-account-chip">
                                {a.type === 'current' ? '🏦' : '💰'} {a.name}
                              </span>
                            ))}
                        </div>
                        {bizVenues.length > 0 && (
                          <div className="structure-tree-children">
                            {bizVenues.map((venue) => (
                              <div key={venue.id} className="structure-tree-node structure-tree-node--venue">
                                <div className="structure-tree-connector" />
                                <div className="structure-tree-node-head">
                                  <span className="structure-tree-swatch" style={{ background: venue.accentColor || '#6366f1' }} />
                                  <span className="structure-tree-node-label">{venue.name}</span>
                                  <button
                                    type="button"
                                    className="structure-tree-remove"
                                    title="Remove venue"
                                    onClick={() => actions.deleteVenue(venue.id)}
                                  >
                                    ×
                                  </button>
                                </div>
                                <div className="structure-tree-accounts">
                                  {state.accounts
                                    .filter((a) => a.venueId === venue.id)
                                    .map((a) => (
                                      <span key={a.id} className="structure-tree-account-chip">
                                        {a.type === 'current' ? '🏦' : '💰'} {a.name}
                                      </span>
                                    ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="structure-tree-add-actions">
                          <button
                            type="button"
                            className="btn-ghost btn-tiny"
                            onClick={() => {
                              const name = prompt('Venue name:')
                              if (name?.trim()) actions.addVenue(biz.id, name.trim())
                            }}
                          >
                            + Venue
                          </button>
                          <button
                            type="button"
                            className="btn-ghost btn-tiny"
                            onClick={() => actions.addBusinessAccount(biz.id, 'Current account', 'current')}
                          >
                            + Current
                          </button>
                          <button
                            type="button"
                            className="btn-ghost btn-tiny"
                            onClick={() => actions.addBusinessAccount(biz.id, 'Savings account', 'savings')}
                          >
                            + Savings
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
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
              )}

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
                    Upload a bank statement (PDF or CSV) for each account. We analyse and build your setup automatically — no review step.
                  </p>
                  <SetupDataSourcesPanel
                    compact
                    onSelectCsv={() => fileInputRef.current?.click()}
                  />
                </>
              ) : (
                <p className="setup-onboarding-lead">
                  Upload a PDF or CSV bank statement for each account below. We will suggest recurring costs for you to approve.
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
                  <div className="guided-setup-import-layout">
                    <div className="guided-setup-import-sidebar">
                      <p className="guided-setup-import-sidebar-label">Your accounts</p>
                      <ul className="guided-setup-import-queue">
                        {accounts.map((account) => {
                          const result = importResults.find((item) => item.accountId === account.id)
                          const status = result?.skipped
                            ? 'Skipped'
                            : result
                              ? 'Imported'
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
                      <label className="bank-import-min-amount-field">
                        <span>Minimum monthly amount</span>
                        <div className="bank-import-min-amount-input">
                          <span>£</span>
                          <input
                            type="number"
                            min={0}
                            step={1}
                            inputMode="numeric"
                            value={minMonthlyAmount > 0 ? minMonthlyAmount : ''}
                            placeholder="0"
                            onChange={(event) => {
                              const parsed = Number(event.target.value)
                              const next = Number.isFinite(parsed) && parsed > 0 ? parsed : 0
                              setMinMonthlyAmount(next)
                              writeBankImportMinMonthlyAmount(next)
                            }}
                          />
                        </div>
                        <small>Ignore recurring items below this average per month.</small>
                      </label>
                    </div>

                    {activeAccount && (
                      <div className="guided-setup-import-main">
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

                        {headers.length === 0 ? (
                          <>
                            <button
                              type="button"
                              className={`guided-setup-upload-zone${uploadDragOver ? ' is-dragover' : ''}`}
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
                                  · about {historySpanMonths(mapRowsToTransactions(rows, mapping))} months of history
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
                            <div className="guided-setup-upload-actions">
                              <button
                                type="button"
                                className="btn-secondary btn-tiny"
                                onClick={() => {
                                  setFileName('')
                                  setHeaders([])
                                  setRows([])
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
                    )}
                  </div>

                  {importError && (
                    <p className="bank-import-error" role="alert">
                      {importError}
                    </p>
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

          {aiStep === 'complete' && (
            <>
              <h2 id="guided-ai-title">Your True Balance is ready</h2>
              {applySummary && <p className="bank-import-success">{applySummary}</p>}
              <p className="setup-onboarding-explain">
                Your bank says one number, but now you can see what&apos;s genuinely available.
              </p>
              <div className="setup-onboarding-reveal">
                <dl className="setup-reveal-math">
                  <div>
                    <dt>Cash in bank</dt>
                    <dd>{formatCurrency(metrics.cash)}</dd>
                  </div>
                  <div>
                    <dt>Already spoken for</dt>
                    <dd>−{formatCurrency(metrics.committedFunds)}</dd>
                  </div>
                  {metrics.expectedReceipts > 0 && (
                    <div>
                      <dt>Expected in</dt>
                      <dd>+{formatCurrency(metrics.expectedReceipts)}</dd>
                    </div>
                  )}
                  <div className="setup-reveal-total">
                    <dt>Your True Balance</dt>
                    <dd>{formatCurrency(metrics.trueBalance)}</dd>
                  </div>
                </dl>
              </div>
              <p className="setup-income-hint">
                {INCOME_PATTERN_HINTS[incomePatternDraft]}
              </p>
              <p className="setup-onboarding-explain muted" style={{ marginTop: 'var(--space-2)' }}>
                <strong>Your routine:</strong> Update your bank balance every day or two. Mark things paid as they go out.
                Once a month, do the reserve check-in (5 minutes). The system handles the rest.
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
