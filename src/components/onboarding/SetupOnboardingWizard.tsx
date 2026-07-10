import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import type { AppActions } from '../../hooks/useAppState'
import type { AppState, DashboardMetrics, IncomePattern, ViewScope } from '../../types'
import { getScopeLabel } from '../../utils/scope'
import { toAmount, roundCurrency } from '../../utils/amounts'
import {
  INCOME_PATTERN_HINTS,
  QUICK_COMMITMENT_TEMPLATES,
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
import { ReservePlannerPanel } from '../ReservePlannerPanel'

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

type CommitmentDraft = { name: string; amount: string; dueDay: string; selected: boolean }

const PREVIEW_STEP_IDS = new Set([
  'month-view',
  'due-explain',
  'receipts-explain',
  'reserve',
  'trends-explain',
  'forecast-explain',
])

const SETUP_STEP_NAV_LABELS: Record<string, string> = {
  why: 'Introduction',
  business: 'Structure',
  cash: 'Balances',
  committed: 'Commitments',
  'committed-explain': 'Accruing',
  'month-view': 'Month view',
  'due-explain': 'Due costs',
  'receipts-explain': 'Receipts',
  reserve: 'Reserve',
  'trends-explain': 'Trends',
  'forecast-explain': 'Forecast',
  reveal: 'True Balance',
  accuracy: 'Your routine',
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
  const PROGRESS_KEY = 'trubalance-setup-step-index'
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
    QUICK_COMMITMENT_TEMPLATES.map((t) => ({ name: t.name, amount: '', dueDay: '', selected: false })),
  )
  const [pendingBusinessAdvance, setPendingBusinessAdvance] = useState(false)
  const [structureError, setStructureError] = useState<string | null>(null)
  const [reserveInlineOpen, setReserveInlineOpen] = useState(false)
  const [openHelp, setOpenHelp] = useState<string | null>(null)

  const step = SETUP_ONBOARDING_STEPS[stepIndex]!
  const stepCount = SETUP_ONBOARDING_STEPS.length
  const isLast = stepIndex >= stepCount - 1
  const usesWideLayout = PREVIEW_STEP_IDS.has(step.id)

  useEffect(() => {
    if (!step.page || step.id === 'reserve') return
    onNavigate(step.page)
  }, [step.id, step.page, onNavigate])

  useEffect(() => {
    if (step.id !== 'reserve') setReserveInlineOpen(false)
  }, [step.id])

  useEffect(() => {
    const content = document.querySelector('.setup-flow-content')
    if (content instanceof HTMLElement) content.scrollTop = 0
  }, [stepIndex])

  useEffect(() => {
    try { localStorage.setItem(PROGRESS_KEY, String(stepIndex)) } catch { /* */ }
  }, [stepIndex])

  const primaryBusiness = state.businesses[0]
  const cashAccounts = useMemo(() => getOnboardingCashAccounts(state), [state])
  const onboardingReservePlanner = useMemo(() => {
    if (!primaryBusiness) return null
    return state.reservePlanners.find((planner) => planner.businessId === primaryBusiness.id) ?? null
  }, [state.reservePlanners, primaryBusiness])
  const onboardingReserveSummary = useMemo(() => {
    if (!onboardingReservePlanner) return null
    return summarizeReservePlanner(state, onboardingReservePlanner)
  }, [state, onboardingReservePlanner])
  const onboardingReserveScope = useMemo(
    () => (primaryBusiness ? ({ type: 'business' as const, id: primaryBusiness.id }) : _viewScope),
    [primaryBusiness, _viewScope],
  )

  useEffect(() => {
    if (!pendingBusinessAdvance || !primaryBusiness) return
    setPendingBusinessAdvance(false)
    actions.setBusinessIncomePattern(primaryBusiness.id, incomePatternDraft)
    setStepIndex((i) => i + 1)
  }, [pendingBusinessAdvance, primaryBusiness])

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
    const businessId = primaryBusiness?.id
    if (businessId) {
      for (const draft of commitmentDrafts) {
        if (!draft.selected) continue
        const amount = roundCurrency(toAmount(draft.amount))
        if (amount <= 0) continue
        const dueDay = parseInt(draft.dueDay, 10)
        actions.addCommitment({
          name: draft.name,
          schedule: 'monthly',
          amount,
          dueDayOfMonth: dueDay >= 1 && dueDay <= 31 ? dueDay : 28,
          scopeLevel: 'business',
          scopeId: businessId,
          status: 'healthy',
        })
      }
    }
    setStepIndex((i) => i + 1)
  }

  const handleReserveBegin = () => {
    const businessId = primaryBusiness?.id
    if (businessId && !onboardingReservePlanner) {
      actions.addReservePlanner({
        name: `${primaryBusiness!.name} Reserve Plan`,
        businessId,
        bufferAmount: 0,
        actualBalance: 0,
      })
    }
    setReserveInlineOpen(true)
  }

  const handleReserveContinue = () => {
    setReserveInlineOpen(false)
    setStepIndex((i) => i + 1)
  }

  const handleBack = () => {
    if (step.id === 'reserve' && reserveInlineOpen) {
      setReserveInlineOpen(false)
      return
    }
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
      <div className="setup-onboarding-nav setup-onboarding-nav--reserve">
        <button
          type="button"
          className="btn-secondary"
          disabled={stepIndex === 0 && !(step.id === 'reserve' && reserveInlineOpen)}
          onClick={handleBack}
        >
          Back
        </button>
        {step.id === 'reserve' ? (
          <>
            <button type="button" className="btn-ghost" onClick={handleReserveContinue}>
              I&apos;ll do this later
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={reserveInlineOpen ? handleReserveContinue : handleReserveBegin}
            >
              {reserveInlineOpen ? 'Continue' : 'Set up yours now'}
            </button>
          </>
        ) : (
          <button type="button" className="btn-primary" onClick={handleNext}>
            {isLast ? 'Finish' : 'Continue'}
          </button>
        )}
      </div>
    </>
  )

  const panel = (
    <SetupOnboardingShell
      kicker={startAtStepId ? 'App walkthrough' : 'Getting started'}
      steps={SETUP_ONBOARDING_STEPS.map((item) => ({
        id: item.id,
        label: SETUP_STEP_NAV_LABELS[item.id] ?? item.title,
      }))}
      currentStepIndex={stepIndex}
      spotlight={false}
      contentWidth={usesWideLayout ? 'wide' : 'default'}
      onSkip={handleDismiss}
      skipLabel="Skip setup"
      footer={footer}
    >
      <div
        key={step.id}
        className={`setup-flow-step-panel${usesWideLayout ? ' setup-flow-step-panel--preview' : ''}`}
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
                          className="sheet-input setup-balance-input"
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
            <div className="setup-onboarding-quick-grid">
              {commitmentDrafts.map((draft, index) => (
                <div
                  key={draft.name}
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
                    <div className="setup-quick-fields">
                      <input
                        className="sheet-input setup-quick-amount"
                        type="number"
                        step="0.01"
                        placeholder="Monthly £"
                        value={draft.amount}
                        onChange={(e) =>
                          setCommitmentDrafts((rows) =>
                            rows.map((row, i) =>
                              i === index ? { ...row, amount: e.target.value } : row,
                            ),
                          )
                        }
                      />
                      <input
                        className="sheet-input setup-quick-day"
                        type="number"
                        min="1"
                        max="31"
                        placeholder="Day"
                        title="Day of month it's due (1–31)"
                        value={draft.dueDay}
                        onChange={(e) =>
                          setCommitmentDrafts((rows) =>
                            rows.map((row, i) =>
                              i === index ? { ...row, dueDay: e.target.value } : row,
                            ),
                          )
                        }
                      />
                    </div>
                  )}
                </div>
              ))}
              <p className="setup-onboarding-hint muted">
                Tick what applies, enter the monthly amount and which day it leaves your account.
              </p>
            </div>
          )}

          {step.id === 'committed-explain' && (
            <div className="setup-edu-visual setup-edu-visual--centered">
              <div className="setup-accrual-anim" aria-hidden="true">
                <div className="setup-accrual-stage setup-accrual-stage--left">
                  <div className="setup-accrual-bar-track">
                    <div className="setup-accrual-bar setup-accrual-bar--grow" />
                  </div>
                  <span className="setup-accrual-label">Building up</span>
                </div>
                <div className="setup-accrual-arrow">
                  <span className="setup-accrual-transfer-dot" />
                  <svg width="32" height="16" viewBox="0 0 32 16" aria-hidden="true">
                    <path
                      d="M0 8h26m0 0l-5-5m5 5l-5 5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div className="setup-accrual-stage setup-accrual-stage--right">
                  <div className="setup-accrual-due-box">
                    <span className="setup-accrual-due-text">Due</span>
                    <span className="setup-accrual-paid-pop">Paid</span>
                  </div>
                  <span className="setup-accrual-label">Stays until paid</span>
                </div>
              </div>
              <p className="setup-accrual-caption">
                The bar never stops — it builds from empty to full every cycle. When it hits the top,
                the full amount moves to Due. You mark it Paid midway through the next build-up, but
                accrual for the new period is already running underneath.
              </p>
            </div>
          )}

          {step.id === 'month-view' && <SetupWidgetPreview previewId="month-view" />}

          {step.id === 'due-explain' && <SetupWidgetPreview previewId="due" />}

          {step.id === 'receipts-explain' && <SetupWidgetPreview previewId="receipts" />}

          {step.id === 'reserve' && (
            <div className="setup-reserve-step">
              {!reserveInlineOpen && (
                <>
                  <button type="button" className="btn-primary setup-reserve-cta" onClick={handleReserveBegin}>
                    Set up yours now
                  </button>
                  <p className="setup-reserve-example-label muted">Example — yours starts blank</p>
                  <SetupWidgetPreview previewId="reserve" />
                </>
              )}
              {reserveInlineOpen && (
                <div className="setup-reserve-inline">
                  {onboardingReserveSummary ? (
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
                  ) : (
                    <p className="muted setup-reserve-inline-loading">Preparing your reserve plan…</p>
                  )}
                </div>
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
