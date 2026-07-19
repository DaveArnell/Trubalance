import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { AppActions } from '../../hooks/useAppState'
import type { AppState, DashboardMetrics, IncomePattern, PlannedFundingMethod, ScopeLevel, ViewScope } from '../../types'
import { getScopeLabel } from '../../utils/scope'
import { toAmount, roundCurrency } from '../../utils/amounts'
import {
  INCOME_PATTERN_HINTS,
  QUICK_COMMITMENT_TEMPLATES,
  SETUP_ONBOARDING_STEP_LABELS,
  SETUP_ONBOARDING_STEPS,
  dismissSetupOnboardingLocally,
} from '../../content/setupOnboarding'
import { QUICK_HABITS } from '../../content/livingDashboard'
import { WHY_TRUE_BALANCE_CONTENT } from '../../content/guidedSetup'
import { formatCurrency } from '../../utils/format'
import { getOnboardingCashAccounts } from '../../utils/calculations'
import { scopeForAccount } from '../../bankImport/applySuggestions'
import { summarizeReservePlanner } from '../../utils/reserveCalculations'
import type { PageId } from '../../navigation'
import { SetupOnboardingShell } from './SetupOnboardingShell'
import { SetupWidgetPreview } from './SetupWidgetPreview'
import { SetupStructureTree } from './SetupStructureTree'
import { SetupAccruingCycleDemo } from './SetupAccruingCycleDemo'
import { SetupDueCardsDemo } from './SetupDueCardsDemo'
import { SetupReceiptCardsDemo } from './SetupReceiptCardsDemo'
import { SetupVideoSlot } from './SetupVideoSlot'
import { MobileRecordCard, MobileRecordList } from '../mobile/MobileRecordList'
import { ReservePlannerPanel } from '../ReservePlannerPanel'
import { useAuth } from '../../contexts/AuthContext'
import { trackEvent } from '../../services/eventTracking'
import {
  formatScopeOptionLabel,
  getCommitmentScopeOptionsForView,
} from '../../utils/scope'

interface SetupOnboardingWizardProps {
  state: AppState
  viewScope: ViewScope
  metrics: DashboardMetrics
  actions: AppActions
  onNavigate: (pageId: PageId, reservePlannerId?: string | null) => void
  onComplete: () => void
  onDismiss: () => void
  /** Start the walkthrough at a specific step */
  startAtStepId?: string
}

type CommitmentDraft = {
  templateId: string
  name: string
  customName: string
  amount: string
  dueDay: string
  selected: boolean
  scopeKey: string
}
type PlannedDueDraft = {
  name: string
  amount: string
  dueDate: string
  selected: boolean
  fundingMethod: PlannedFundingMethod
  scopeKey: string
}
type ReceiptDraft = {
  name: string
  amount: string
  expectedDate: string
  selected: boolean
  scopeKey: string
}

const PREVIEW_STEP_IDS = new Set([
  'committed-explain',
  'month-view',
  'due-explain',
  'receipts-explain',
  'trends-explain',
  'forecast-explain',
])

const TEACH_VIDEO_STEPS = new Set([
  'why',
  'committed-explain',
  'month-view',
  'due-explain',
  'receipts-explain',
  'reserve',
  'trends-explain',
  'forecast-explain',
])

function parseScopeKey(key: string): { scopeLevel: ScopeLevel; scopeId: string } | null {
  const [scopeLevel, scopeId] = key.split(':') as [ScopeLevel, string]
  if (!scopeLevel || !scopeId) return null
  return { scopeLevel, scopeId }
}

export function SetupOnboardingWizard({
  state,
  viewScope: _viewScope,
  metrics,
  actions,
  onNavigate,
  onComplete,
  onDismiss,
  startAtStepId,
}: SetupOnboardingWizardProps) {
  const { user } = useAuth()
  const PROGRESS_KEY = 'trubalance-setup-step-index-v2'
  const initialStepIndex = (() => {
    if (startAtStepId) {
      const idx = SETUP_ONBOARDING_STEPS.findIndex((item) => item.id === startAtStepId)
      return idx >= 0 ? idx : 0
    }
    try {
      const saved = localStorage.getItem(PROGRESS_KEY)
      const idx = saved ? parseInt(saved, 10) : 0
      return idx >= 0 && idx < SETUP_ONBOARDING_STEPS.length ? idx : 0
    } catch {
      return 0
    }
  })()
  const [stepIndex, setStepIndex] = useState(initialStepIndex)
  const [businessName, setBusinessName] = useState('')
  const [venueName, setVenueName] = useState('')
  const [accountName, setAccountName] = useState('Current account')
  const [incomePatternDraft, setIncomePatternDraft] = useState<IncomePattern>('steady')
  const [balanceDrafts, setBalanceDrafts] = useState<Record<string, string>>({})
  const [commitmentDrafts, setCommitmentDrafts] = useState<CommitmentDraft[]>(() =>
    QUICK_COMMITMENT_TEMPLATES.map((t) => ({
      templateId: t.id,
      name: t.name,
      customName: '',
      amount: '',
      dueDay: '',
      selected: false,
      scopeKey: '',
    })),
  )
  const [dueDrafts, setDueDrafts] = useState<PlannedDueDraft[]>([
    { name: '', amount: '', dueDate: '', selected: false, fundingMethod: 'accrue_until_due', scopeKey: '' },
  ])
  const [receiptDrafts, setReceiptDrafts] = useState<ReceiptDraft[]>([
    { name: '', amount: '', expectedDate: '', selected: false, scopeKey: '' },
  ])
  const [setupBusinessId, setSetupBusinessId] = useState<string>('')
  const [pendingBusinessAdvance, setPendingBusinessAdvance] = useState(false)
  const [structureError, setStructureError] = useState<string | null>(null)
  const [openHelp, setOpenHelp] = useState<string | null>(null)
  const [reserveSetupStarted, setReserveSetupStarted] = useState(false)
  const reservePanelRef = useRef<HTMLDivElement>(null)

  const step = SETUP_ONBOARDING_STEPS[stepIndex]!
  const stepCount = SETUP_ONBOARDING_STEPS.length
  const isLast = stepIndex >= stepCount - 1
  const isReserveStep = step.id === 'reserve' || step.id === 'setup-reserve'
  const usesWideLayout = PREVIEW_STEP_IDS.has(step.id)
  const contentWidth = isReserveStep ? 'reserve' : usesWideLayout ? 'wide' : 'default'

  useEffect(() => {
    if (!step.page || step.id === 'reserve') return
    onNavigate(step.page)
  }, [step.id, step.page, onNavigate])

  useEffect(() => {
    const content = document.querySelector('.setup-flow-content')
    if (content instanceof HTMLElement) content.scrollTop = 0
  }, [stepIndex])

  useEffect(() => {
    try { localStorage.setItem(PROGRESS_KEY, String(stepIndex)) } catch { /* */ }
  }, [stepIndex])

  useEffect(() => {
    if (!user?.id) return
    const currentStep = SETUP_ONBOARDING_STEPS[stepIndex]
    if (!currentStep) return
    void trackEvent('setup_step_view', user.id, undefined, {
      stepId: currentStep.id,
      stepIndex,
      stepLabel: SETUP_ONBOARDING_STEP_LABELS[currentStep.id] ?? currentStep.title,
    })
  }, [stepIndex, user?.id])

  const primaryBusiness = state.businesses[0]
  const cashAccounts = useMemo(() => getOnboardingCashAccounts(state), [state])
  const setupBusiness =
    state.businesses.find((business) => business.id === setupBusinessId) ?? primaryBusiness

  useEffect(() => {
    if (setupBusinessId || !primaryBusiness) return
    setSetupBusinessId(primaryBusiness.id)
  }, [setupBusinessId, primaryBusiness])

  const setupScopeOptions = useMemo(() => {
    if (!setupBusiness) return []
    return getCommitmentScopeOptionsForView(state, { type: 'business', id: setupBusiness.id })
  }, [state, setupBusiness])

  const defaultScopeKey = useMemo(() => {
    if (!setupBusiness) return ''
    return `business:${setupBusiness.id}`
  }, [setupBusiness])

  useEffect(() => {
    if (!defaultScopeKey) return
    setCommitmentDrafts((rows) =>
      rows.map((row) => (row.scopeKey ? row : { ...row, scopeKey: defaultScopeKey })),
    )
    setDueDrafts((rows) =>
      rows.map((row) => (row.scopeKey ? row : { ...row, scopeKey: defaultScopeKey })),
    )
    setReceiptDrafts((rows) =>
      rows.map((row) => (row.scopeKey ? row : { ...row, scopeKey: defaultScopeKey })),
    )
  }, [defaultScopeKey])

  const onboardingReservePlanner = useMemo(() => {
    if (!setupBusiness) return null
    return state.reservePlanners.find((planner) => planner.businessId === setupBusiness.id) ?? null
  }, [state.reservePlanners, setupBusiness])
  const onboardingReserveSummary = useMemo(() => {
    if (!onboardingReservePlanner) return null
    return summarizeReservePlanner(state, onboardingReservePlanner)
  }, [state, onboardingReservePlanner])
  const onboardingReserveScope = useMemo(
    () => (setupBusiness ? ({ type: 'business' as const, id: setupBusiness.id }) : _viewScope),
    [setupBusiness, _viewScope],
  )

  useEffect(() => {
    if (step.id !== 'setup-reserve') {
      setReserveSetupStarted(false)
    }
  }, [step.id])

  useEffect(() => {
    if (!pendingBusinessAdvance || !primaryBusiness) return
    setPendingBusinessAdvance(false)
    actions.setBusinessIncomePattern(primaryBusiness.id, incomePatternDraft)
    setStepIndex((i) => i + 1)
  }, [pendingBusinessAdvance, primaryBusiness, actions, incomePatternDraft])

  useEffect(() => {
    document.querySelectorAll('[data-onboarding-focus]').forEach((el) => {
      el.removeAttribute('data-onboarding-focus')
    })
    document.body.classList.remove('setup-onboarding-spotlight-active')
  }, [stepIndex])

  useEffect(() => {
    document.querySelectorAll('[data-onboarding-focus]').forEach((el) => {
      el.removeAttribute('data-onboarding-focus')
    })
    document.body.classList.remove('setup-onboarding-spotlight-active')
  }, [])

  useEffect(() => {
    if (step.id !== 'cash') return
    setBalanceDrafts(
      Object.fromEntries(
        cashAccounts.map((account) => [account.id, String(toAmount(account.balance))]),
      ),
    )
  }, [step.id, cashAccounts])

  const handleDismiss = () => {
    if (user?.id) {
      void trackEvent('setup_step_dismiss', user.id, undefined, {
        stepId: step.id,
        stepIndex,
        stepLabel: SETUP_ONBOARDING_STEP_LABELS[step.id] ?? step.title,
      })
    }
    try { localStorage.removeItem(PROGRESS_KEY) } catch { /* */ }
    dismissSetupOnboardingLocally()
    onDismiss()
  }

  const handleBusinessNext = () => {
    setStructureError(null)
    if (primaryBusiness) {
      if (cashAccounts.length === 0) {
        setStructureError('Add at least one current or savings account before continuing.')
        return
      }
      actions.setBusinessIncomePattern(primaryBusiness.id, incomePatternDraft)
      setStepIndex((i) => i + 1)
      return
    }
    if (!businessName.trim()) {
      setStructureError('Enter a business name to continue.')
      return
    }
    actions.setupMinimalWorkspace({
      businessName: businessName.trim(),
      venueName: venueName.trim() || undefined,
      currentAccountName: accountName.trim() || 'Current account',
    })
    setPendingBusinessAdvance(true)
  }

  const handleCashNext = () => {
    const changes = cashAccounts
      .map((account) => {
        const raw = balanceDrafts[account.id]
        if (raw === undefined || raw.trim() === '') return null
        const balance = roundCurrency(toAmount(raw))
        if (balance === roundCurrency(toAmount(account.balance))) return null
        return { accountId: account.id, balance }
      })
      .filter((c): c is { accountId: string; balance: number } => Boolean(c))

    if (changes.length > 0) {
      for (const change of changes) {
        const scope = scopeForAccount(state, change.accountId)
        if (!scope) continue
        const accountScope = { type: scope.scopeLevel, id: scope.scopeId } as ViewScope
        actions.saveBalanceUpdate(
          accountScope,
          getScopeLabel(state, accountScope),
          [change],
          undefined,
          true,
        )
      }
    }
    setStepIndex((i) => i + 1)
  }

  const handleCommittedNext = () => {
    for (const draft of commitmentDrafts) {
      if (!draft.selected) continue
      const amount = roundCurrency(toAmount(draft.amount))
      if (amount <= 0) continue
      const displayName =
        draft.templateId === 'other' ? draft.customName.trim() || draft.name : draft.name
      if (draft.templateId === 'other' && !draft.customName.trim()) continue
      const scope = parseScopeKey(draft.scopeKey || defaultScopeKey)
      if (!scope) continue
      const dueDay = parseInt(draft.dueDay, 10)
      actions.addCommitment({
        name: displayName,
        schedule: 'monthly',
        amount,
        dueDayOfMonth: dueDay >= 1 && dueDay <= 31 ? dueDay : 28,
        scopeLevel: scope.scopeLevel,
        scopeId: scope.scopeId,
        status: 'healthy',
      })
    }
    setStepIndex((i) => i + 1)
  }

  const handleDueDraftsSave = () => {
    for (const draft of dueDrafts) {
      if (!draft.selected) continue
      const amount = roundCurrency(toAmount(draft.amount))
      if (amount <= 0 || !draft.name.trim() || !draft.dueDate) continue
      const scope = parseScopeKey(draft.scopeKey || defaultScopeKey)
      if (!scope) continue
      actions.addCommitment({
        name: draft.name.trim(),
        schedule: 'planned',
        amount,
        plannedDueDate: draft.dueDate,
        fundingMethod: draft.fundingMethod,
        scopeLevel: scope.scopeLevel,
        scopeId: scope.scopeId,
        status: 'healthy',
      })
    }
  }

  const handleReceiptDraftsSave = () => {
    for (const draft of receiptDrafts) {
      if (!draft.selected) continue
      const amount = roundCurrency(toAmount(draft.amount))
      if (amount <= 0 || !draft.name.trim()) continue
      const scope = parseScopeKey(draft.scopeKey || defaultScopeKey)
      if (!scope) continue
      actions.addReceipt({
        name: draft.name.trim(),
        amount,
        expectedDate: draft.expectedDate || undefined,
        receiptTiming: 'accrual',
        scopeLevel: scope.scopeLevel,
        scopeId: scope.scopeId,
      })
    }
  }

  const handleReserveFocus = () => {
    const businessId = setupBusiness?.id
    if (!businessId || !setupBusiness) return
    setReserveSetupStarted(true)
    if (!onboardingReservePlanner) {
      actions.addReservePlanner({
        name: `${setupBusiness.name} Reserve Plan`,
        businessId,
        bufferAmount: 0,
        actualBalance: 0,
      })
    }
    window.setTimeout(() => {
      reservePanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      const focusable = reservePanelRef.current?.querySelector<HTMLElement>(
        'input, button, select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      focusable?.focus()
    }, 80)
  }

  const handleBack = () => {
    setStepIndex((i) => Math.max(0, i - 1))
  }

  const handleNext = () => {
    if (step.id === 'business') {
      handleBusinessNext()
      return
    }
    if (step.id === 'cash') {
      handleCashNext()
      return
    }
    if (step.id === 'committed') {
      handleCommittedNext()
      return
    }
    if (step.id === 'setup-planned') {
      handleDueDraftsSave()
      setStepIndex((i) => i + 1)
      return
    }
    if (step.id === 'setup-receipts') {
      handleReceiptDraftsSave()
      setStepIndex((i) => i + 1)
      return
    }
    if (isLast) {
      try { localStorage.removeItem(PROGRESS_KEY) } catch { /* */ }
      dismissSetupOnboardingLocally()
      onComplete()
      return
    }
    setStepIndex((i) => i + 1)
  }

  const bankBalance = metrics.cash
  const trueBalance = metrics.trueBalance
  const exampleGap = Math.max(0, bankBalance - trueBalance)

  const explainParagraphs = step.explain.split('\n\n')
  const leadParagraph = explainParagraphs[0] ?? ''
  const detailParagraphs = explainParagraphs.slice(1)

  const footer = (
    <>
      <div className="setup-flow-footer-meta">
        Step {stepIndex + 1} of {stepCount}
      </div>
      <div className="setup-onboarding-nav">
        <button
          type="button"
          className="btn-secondary"
          disabled={stepIndex === 0}
          onClick={handleBack}
        >
          Back
        </button>
        {step.id === 'setup-reserve' ? (
          <button type="button" className="btn-primary setup-onboarding-nav-cta" onClick={handleReserveFocus}>
            Set up now
          </button>
        ) : null}
        <button type="button" className="btn-primary" onClick={handleNext}>
          {isLast ? 'Finish' : 'Continue'}
        </button>
      </div>
    </>
  )

  const panel = (
    <SetupOnboardingShell
      kicker={startAtStepId ? 'App walkthrough' : 'Getting started'}
      steps={SETUP_ONBOARDING_STEPS.map((item) => ({
        id: item.id,
        label: SETUP_ONBOARDING_STEP_LABELS[item.id] ?? item.title,
      }))}
      currentStepIndex={stepIndex}
      spotlight={false}
      contentWidth={contentWidth}
      onSkip={handleDismiss}
      skipLabel="Skip setup"
      footer={footer}
    >
      <div
        key={step.id}
        className={`setup-flow-step-panel${
          usesWideLayout ? ' setup-flow-step-panel--preview' : ''
        }${isReserveStep ? ' setup-flow-step-panel--reserve' : ''}`}
      >
        <header className="setup-flow-page-header">
          <h2 id="setup-onboarding-title">{step.title}</h2>
          <p className="setup-flow-page-lead">{leadParagraph}</p>
        </header>
        {detailParagraphs.map((para, i) => (
          <p key={i} className="setup-onboarding-explain">
            {para}
          </p>
        ))}

        {TEACH_VIDEO_STEPS.has(step.id) ? <SetupVideoSlot label="Watch video" /> : null}

          {step.id === 'why' && (
            <ul className="setup-why-bullets">
              {WHY_TRUE_BALANCE_CONTENT.bullets.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}

          {step.id === 'business' && (
            <div className="setup-onboarding-form">
              <SetupStructureTree
                state={state}
                actions={actions}
                draft={{ businessName, venueName, accountName }}
                onDraftChange={(patch) => {
                  if (patch.businessName !== undefined) setBusinessName(patch.businessName)
                  if (patch.venueName !== undefined) setVenueName(patch.venueName)
                  if (patch.accountName !== undefined) setAccountName(patch.accountName)
                  if (structureError) setStructureError(null)
                }}
              />
              {structureError && (
                <p className="setup-onboarding-form-error" role="alert">
                  {structureError}
                </p>
              )}
              <fieldset className="setup-income-pattern">
                <legend>How does money come into your business?</legend>
                <label className={`setup-income-option${incomePatternDraft === 'steady' ? ' setup-income-option--active' : ''}`}>
                  <input
                    type="radio"
                    name="incomePattern"
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
                    name="incomePattern"
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
            </div>
          )}

          {step.id === 'cash' && (
            <div className="setup-onboarding-form setup-onboarding-form--balances">
              <p className="setup-onboarding-form-hint">
                Enter what you see in your bank app right now — you can update this any time from the dashboard.
              </p>
              {cashAccounts.length === 0 ? (
                <p className="muted">Add a business first, then enter balances here.</p>
              ) : (
                cashAccounts.map((account) => {
                  const venue = account.venueId
                    ? state.venues.find((item) => item.id === account.venueId)
                    : undefined
                  const business = account.businessId
                    ? state.businesses.find((item) => item.id === account.businessId)
                    : venue
                      ? state.businesses.find((item) => item.id === venue.businessId)
                      : undefined
                  const accountLabel = [business?.name, venue?.name, account.name]
                    .filter(Boolean)
                    .join(' → ')
                  return (
                    <label key={account.id} className="setup-field setup-field--row setup-field--balance">
                      <span>{accountLabel}</span>
                      <div className="setup-balance-input-wrap">
                        <span className="setup-balance-currency" aria-hidden="true">
                          £
                        </span>
                        <input
                          className="setup-balance-input"
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={balanceDrafts[account.id] ?? ''}
                          onChange={(e) =>
                            setBalanceDrafts((d) => ({ ...d, [account.id]: e.target.value }))
                          }
                        />
                      </div>
                    </label>
                  )
                })
              )}
            </div>
          )}

          {step.id === 'committed' && (
            <div className="setup-onboarding-form setup-onboarding-form--committed">
              {state.businesses.length > 1 ? (
                <label className="setup-field setup-field--business">
                  <span>Setting up</span>
                  <select
                    className="sheet-input"
                    value={setupBusinessId || setupBusiness?.id || ''}
                    onChange={(e) => setSetupBusinessId(e.target.value)}
                  >
                    {state.businesses.map((business) => (
                      <option key={business.id} value={business.id}>
                        {business.name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : setupBusiness ? (
                <p className="setup-onboarding-form-hint">
                  Setting up <strong>{setupBusiness.name}</strong>
                </p>
              ) : null}

              <div className="setup-onboarding-quick-grid setup-onboarding-quick-grid--compact">
                {commitmentDrafts.map((draft, index) => (
                  <div
                    key={draft.templateId}
                    className={`setup-quick-item${draft.selected ? ' setup-quick-item--on' : ''}`}
                  >
                    <label className="setup-quick-toggle">
                      <input
                        type="checkbox"
                        checked={draft.selected}
                        onChange={(e) =>
                          setCommitmentDrafts((rows) =>
                            rows.map((row, i) =>
                              i === index ? { ...row, selected: e.target.checked } : row,
                            ),
                          )
                        }
                      />
                      <span>{draft.name}</span>
                    </label>
                    {draft.selected && (
                      <div className="setup-quick-fields setup-quick-fields--compact">
                        {draft.templateId === 'other' ? (
                          <label className="setup-quick-field setup-quick-field--name">
                            <span>Name</span>
                            <input
                              className="sheet-input setup-quick-name"
                              type="text"
                              placeholder="e.g. Software subscription"
                              value={draft.customName}
                              onChange={(e) =>
                                setCommitmentDrafts((rows) =>
                                  rows.map((row, i) =>
                                    i === index ? { ...row, customName: e.target.value } : row,
                                  ),
                                )
                              }
                            />
                          </label>
                        ) : null}
                        <label className="setup-quick-field">
                          <span>Amount</span>
                          <input
                            className="sheet-input setup-quick-amount"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={draft.amount}
                            onChange={(e) =>
                              setCommitmentDrafts((rows) =>
                                rows.map((row, i) =>
                                  i === index ? { ...row, amount: e.target.value } : row,
                                ),
                              )
                            }
                          />
                        </label>
                        <label className="setup-quick-field setup-quick-field--day">
                          <span>Due day</span>
                          <input
                            className="sheet-input setup-quick-day"
                            type="number"
                            min="1"
                            max="31"
                            placeholder="28"
                            aria-label={`Day of month ${draft.name} is paid`}
                            value={draft.dueDay}
                            onChange={(e) =>
                              setCommitmentDrafts((rows) =>
                                rows.map((row, i) =>
                                  i === index ? { ...row, dueDay: e.target.value } : row,
                                ),
                              )
                            }
                          />
                        </label>
                        {setupScopeOptions.length > 1 ? (
                          <label className="setup-quick-field setup-quick-field--scope">
                            <span>Applies to</span>
                            <select
                              className="sheet-input"
                              value={draft.scopeKey || defaultScopeKey}
                              onChange={(e) =>
                                setCommitmentDrafts((rows) =>
                                  rows.map((row, i) =>
                                    i === index ? { ...row, scopeKey: e.target.value } : row,
                                  ),
                                )
                              }
                            >
                              {setupScopeOptions.map((opt) => (
                                <option key={`${opt.level}:${opt.id}`} value={`${opt.level}:${opt.id}`}>
                                  {formatScopeOptionLabel(opt.level, opt.label)}
                                </option>
                              ))}
                            </select>
                          </label>
                        ) : null}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {commitmentDrafts.some(
                (d) => d.selected && roundCurrency(toAmount(d.amount)) > 0,
              ) ? (
                <div className="setup-commitment-preview">
                  <p className="setup-onboarding-form-hint">Preview</p>
                  <MobileRecordList>
                    {commitmentDrafts
                      .filter((d) => d.selected && roundCurrency(toAmount(d.amount)) > 0)
                      .map((draft) => {
                        const displayName =
                          draft.templateId === 'other'
                            ? draft.customName.trim() || draft.name
                            : draft.name
                        const day = parseInt(draft.dueDay, 10)
                        const dueLabel =
                          day >= 1 && day <= 31 ? `Due day ${day}` : 'Due day 28'
                        const scopeOpt = setupScopeOptions.find(
                          (opt) => `${opt.level}:${opt.id}` === (draft.scopeKey || defaultScopeKey),
                        )
                        return (
                          <MobileRecordCard
                            key={draft.templateId}
                            title={displayName}
                            scopeLabel={scopeOpt?.label}
                            amount={formatCurrency(roundCurrency(toAmount(draft.amount)))}
                            meta={dueLabel}
                            amountNegative
                            accentColor={setupBusiness?.accentColor}
                          />
                        )
                      })}
                  </MobileRecordList>
                </div>
              ) : null}

              <p className="setup-onboarding-hint">
                Tick what applies. Enter the <strong>monthly amount</strong> and the{' '}
                <strong>day it leaves your account</strong> each month (e.g. 28 for the 28th).
              </p>
            </div>
          )}

          {step.id === 'committed-explain' && <SetupAccruingCycleDemo />}

          {step.id === 'due-explain' && <SetupDueCardsDemo />}

          {step.id === 'setup-planned' && (
            <div className="setup-onboarding-form setup-onboarding-form--quick-add">
              <p className="setup-onboarding-form-hint">
                Optional — already know a one-off cost (tax, deposit, equipment)? Add it here.
                You can always add more later.
              </p>
              {dueDrafts.map((draft, index) => (
                <div
                  key={`due-${index}`}
                  className={`setup-quick-item${draft.selected ? ' setup-quick-item--on' : ''}`}
                >
                  <label className="setup-quick-toggle">
                    <input
                      type="checkbox"
                      checked={draft.selected}
                      onChange={(e) =>
                        setDueDrafts((rows) =>
                          rows.map((row, i) =>
                            i === index ? { ...row, selected: e.target.checked } : row,
                          ),
                        )
                      }
                    />
                    <input
                      className="sheet-input setup-quick-name"
                      type="text"
                      placeholder="e.g. Corporation tax"
                      value={draft.name}
                      onChange={(e) =>
                        setDueDrafts((rows) =>
                          rows.map((row, i) =>
                            i === index ? { ...row, name: e.target.value, selected: true } : row,
                          ),
                        )
                      }
                    />
                  </label>
                  {draft.selected && (
                    <div className="setup-quick-fields">
                      <label className="setup-quick-field">
                        <span>Amount</span>
                        <input
                          className="sheet-input setup-quick-amount"
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={draft.amount}
                          onChange={(e) =>
                            setDueDrafts((rows) =>
                              rows.map((row, i) =>
                                i === index ? { ...row, amount: e.target.value } : row,
                              ),
                            )
                          }
                        />
                      </label>
                      <label className="setup-quick-field setup-quick-field--date">
                        <span>Due date</span>
                        <input
                          className="sheet-input setup-quick-date"
                          type="date"
                          value={draft.dueDate}
                          onChange={(e) =>
                            setDueDrafts((rows) =>
                              rows.map((row, i) =>
                                i === index ? { ...row, dueDate: e.target.value } : row,
                              ),
                            )
                          }
                        />
                      </label>
                      {setupScopeOptions.length > 1 ? (
                        <label className="setup-quick-field setup-quick-field--scope">
                          <span>Applies to</span>
                          <select
                            className="sheet-input"
                            value={draft.scopeKey || defaultScopeKey}
                            onChange={(e) =>
                              setDueDrafts((rows) =>
                                rows.map((row, i) =>
                                  i === index ? { ...row, scopeKey: e.target.value } : row,
                                ),
                              )
                            }
                          >
                            {setupScopeOptions.map((opt) => (
                              <option key={`${opt.level}:${opt.id}`} value={`${opt.level}:${opt.id}`}>
                                {formatScopeOptionLabel(opt.level, opt.label)}
                              </option>
                            ))}
                          </select>
                        </label>
                      ) : null}
                      <fieldset className="setup-quick-funding">
                        <legend>How should this affect True Balance?</legend>
                        <label className="setup-quick-funding-option">
                          <input
                            type="radio"
                            name={`due-funding-${index}`}
                            checked={draft.fundingMethod === 'immediate'}
                            onChange={() =>
                              setDueDrafts((rows) =>
                                rows.map((row, i) =>
                                  i === index ? { ...row, fundingMethod: 'immediate' } : row,
                                ),
                              )
                            }
                          />
                          <span>
                            <strong>Reserve the full amount now</strong>
                            <small>Deduct from True Balance straight away</small>
                          </span>
                        </label>
                        <label className="setup-quick-funding-option">
                          <input
                            type="radio"
                            name={`due-funding-${index}`}
                            checked={draft.fundingMethod === 'accrue_until_due'}
                            onChange={() =>
                              setDueDrafts((rows) =>
                                rows.map((row, i) =>
                                  i === index ? { ...row, fundingMethod: 'accrue_until_due' } : row,
                                ),
                              )
                            }
                          />
                          <span>
                            <strong>Build it up until the due date</strong>
                            <small>Spread the amount evenly from today</small>
                          </span>
                        </label>
                      </fieldset>
                    </div>
                  )}
                </div>
              ))}
              <button
                type="button"
                className="btn-ghost btn-tiny setup-quick-add-row"
                onClick={() =>
                  setDueDrafts((rows) => [
                    ...rows,
                    {
                      name: '',
                      amount: '',
                      dueDate: '',
                      selected: false,
                      fundingMethod: 'accrue_until_due',
                      scopeKey: defaultScopeKey || '',
                    },
                  ])
                }
              >
                + Add another planned cost
              </button>
            </div>
          )}

          {step.id === 'receipts-explain' && <SetupReceiptCardsDemo />}

          {step.id === 'setup-receipts' && (
            <div className="setup-onboarding-form setup-onboarding-form--quick-add">
              <p className="setup-onboarding-form-hint">
                Optional — already know money that&apos;s coming in? Add it here. You can always
                add more later.
              </p>
              {receiptDrafts.map((draft, index) => (
                <div
                  key={`receipt-${index}`}
                  className={`setup-quick-item${draft.selected ? ' setup-quick-item--on' : ''}`}
                >
                  <label className="setup-quick-toggle">
                    <input
                      type="checkbox"
                      checked={draft.selected}
                      onChange={(e) =>
                        setReceiptDrafts((rows) =>
                          rows.map((row, i) =>
                            i === index ? { ...row, selected: e.target.checked } : row,
                          ),
                        )
                      }
                    />
                    <input
                      className="sheet-input setup-quick-name"
                      type="text"
                      placeholder="e.g. Client invoice"
                      value={draft.name}
                      onChange={(e) =>
                        setReceiptDrafts((rows) =>
                          rows.map((row, i) =>
                            i === index ? { ...row, name: e.target.value, selected: true } : row,
                          ),
                        )
                      }
                    />
                  </label>
                  {draft.selected && (
                    <div className="setup-quick-fields">
                      <label className="setup-quick-field">
                        <span>Amount</span>
                        <input
                          className="sheet-input setup-quick-amount"
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={draft.amount}
                          onChange={(e) =>
                            setReceiptDrafts((rows) =>
                              rows.map((row, i) =>
                                i === index ? { ...row, amount: e.target.value } : row,
                              ),
                            )
                          }
                        />
                      </label>
                      <label className="setup-quick-field setup-quick-field--date">
                        <span>Expected by</span>
                        <input
                          className="sheet-input setup-quick-date"
                          type="date"
                          value={draft.expectedDate}
                          onChange={(e) =>
                            setReceiptDrafts((rows) =>
                              rows.map((row, i) =>
                                i === index ? { ...row, expectedDate: e.target.value } : row,
                              ),
                            )
                          }
                        />
                      </label>
                      {setupScopeOptions.length > 1 ? (
                        <label className="setup-quick-field setup-quick-field--scope">
                          <span>Applies to</span>
                          <select
                            className="sheet-input"
                            value={draft.scopeKey || defaultScopeKey}
                            onChange={(e) =>
                              setReceiptDrafts((rows) =>
                                rows.map((row, i) =>
                                  i === index ? { ...row, scopeKey: e.target.value } : row,
                                ),
                              )
                            }
                          >
                            {setupScopeOptions.map((opt) => (
                              <option key={`${opt.level}:${opt.id}`} value={`${opt.level}:${opt.id}`}>
                                {formatScopeOptionLabel(opt.level, opt.label)}
                              </option>
                            ))}
                          </select>
                        </label>
                      ) : null}
                    </div>
                  )}
                </div>
              ))}
              <button
                type="button"
                className="btn-ghost btn-tiny setup-quick-add-row"
                onClick={() =>
                  setReceiptDrafts((rows) => [
                    ...rows,
                    {
                      name: '',
                      amount: '',
                      expectedDate: '',
                      selected: false,
                      scopeKey: defaultScopeKey || '',
                    },
                  ])
                }
              >
                + Add another expected receipt
              </button>
            </div>
          )}

          {step.id === 'month-view' && <SetupWidgetPreview previewId="month-view" />}

          {step.id === 'reserve' && (
            <div className="setup-reserve-step">
              <p className="setup-reserve-yours-hint">
                Example: a new month — see the transfer amount, then set up your own plan in the next
                step.
              </p>
              <SetupWidgetPreview previewId="reserve" />
            </div>
          )}

          {step.id === 'setup-reserve' && (
            <div className="setup-reserve-step" ref={reservePanelRef}>
              {!reserveSetupStarted ? (
                <p className="setup-reserve-yours-hint">
                  Ready when you are — click <strong>Set up now</strong> for{' '}
                  <strong>{setupBusiness?.name ?? 'your business'}</strong>.
                </p>
              ) : (
                <>
                  <p className="setup-reserve-yours-hint">
                    Your plan for <strong>{setupBusiness?.name ?? 'your business'}</strong> — add
                    buffer and bills. It saves as you go.
                  </p>
                  {onboardingReserveSummary ? (
                    <div className="setup-reserve-inline">
                      <ReservePlannerPanel
                        state={state}
                        viewScope={onboardingReserveScope}
                        summary={onboardingReserveSummary}
                        reserveRouteId={onboardingReservePlanner?.id ?? null}
                        actions={actions}
                        openHelp={openHelp}
                        setOpenHelp={setOpenHelp}
                        onPlannerDeleted={() => undefined}
                        onPlannerCreated={() => undefined}
                      />
                    </div>
                  ) : (
                    <p className="muted setup-reserve-inline-loading">Preparing your reserve plan…</p>
                  )}
                </>
              )}
            </div>
          )}

          {step.id === 'trends-explain' && <SetupWidgetPreview previewId="trends" />}

          {step.id === 'forecast-explain' && <SetupWidgetPreview previewId="forecast" />}

          {step.id === 'reveal' && (
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
                  <dd>{formatCurrency(trueBalance)}</dd>
                </div>
              </dl>
              {exampleGap > 0 && bankBalance > 0 && (
                <p className="setup-reveal-example">
                  Your bank says <strong>{formatCurrency(bankBalance)}</strong>, but{' '}
                  <strong>{formatCurrency(exampleGap)}</strong> is already spoken for.
                  Your real available money is <strong>{formatCurrency(trueBalance)}</strong>.
                </p>
              )}
              <p className="setup-income-hint">
                {INCOME_PATTERN_HINTS[incomePatternDraft]}
              </p>
            </div>
          )}

          {step.id === 'accuracy' && (
            <ul className="setup-routine-list">
              {QUICK_HABITS.map((habit) => (
                <li key={habit}>{habit}</li>
              ))}
              <li>
                Each month, confirm your <strong>Reserve Planner</strong> — a quick check-in, not a big
                accounts exercise.
              </li>
              <li>
                Use the <strong>?</strong> icons on any widget for plain-English help.
              </li>
            </ul>
          )}
      </div>
    </SetupOnboardingShell>
  )

  return createPortal(panel, document.body)
}
