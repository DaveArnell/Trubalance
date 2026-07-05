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
import { MANUAL_SETUP_REASSURANCE, WHY_TRUE_BALANCE_CONTENT } from '../../content/guidedSetup'
import { formatCurrency } from '../../utils/format'
import { getCashAccounts, getAccountsForScope } from '../../utils/calculations'
import type { PageId } from '../../navigation'

interface SetupOnboardingWizardProps {
  state: AppState
  viewScope: ViewScope
  metrics: DashboardMetrics
  actions: Pick<
    AppActions,
    'setupMinimalWorkspace' | 'saveBalanceUpdate' | 'addCommitment' | 'setBusinessIncomePattern' | 'addBusiness' | 'addReservePlanner'
  >
  onNavigate: (pageId: PageId, reservePlannerId?: string | null) => void
  onComplete: () => void
  onDismiss: () => void
  onBackToPathChoice?: () => void
}

type CommitmentDraft = { name: string; amount: string; dueDay: string; selected: boolean }

export function SetupOnboardingWizard({
  state,
  viewScope,
  metrics,
  actions,
  onNavigate,
  onComplete,
  onDismiss,
  onBackToPathChoice,
}: SetupOnboardingWizardProps) {
  const PROGRESS_KEY = 'trubalance-setup-step-index'
  const [stepIndex, setStepIndex] = useState(() => {
    try {
      const saved = localStorage.getItem(PROGRESS_KEY)
      const idx = saved ? parseInt(saved, 10) : 0
      return idx >= 0 && idx < SETUP_ONBOARDING_STEPS.length ? idx : 0
    } catch { return 0 }
  })
  const [businessName, setBusinessName] = useState('')
  const [venueName, setVenueName] = useState('')
  const [accountName, setAccountName] = useState('Current account')
  const [incomePatternDraft, setIncomePatternDraft] = useState<IncomePattern>('steady')
  const [balanceDrafts, setBalanceDrafts] = useState<Record<string, string>>({})
  const [commitmentDrafts, setCommitmentDrafts] = useState<CommitmentDraft[]>(() =>
    QUICK_COMMITMENT_TEMPLATES.map((t) => ({ name: t.name, amount: '', dueDay: '', selected: false })),
  )
  const [pendingBusinessAdvance, setPendingBusinessAdvance] = useState(false)

  const step = SETUP_ONBOARDING_STEPS[stepIndex]!
  const stepCount = SETUP_ONBOARDING_STEPS.length
  const isLast = stepIndex >= stepCount - 1

  useEffect(() => {
    try { localStorage.setItem(PROGRESS_KEY, String(stepIndex)) } catch { /* */ }
  }, [stepIndex])

  const primaryBusiness = state.businesses[0]
  const cashAccounts = useMemo(
    () => getCashAccounts(getAccountsForScope(state, viewScope)),
    [state, viewScope],
  )

  useEffect(() => {
    if (!pendingBusinessAdvance || !primaryBusiness) return
    setPendingBusinessAdvance(false)
    actions.setBusinessIncomePattern(primaryBusiness.id, incomePatternDraft)
    setStepIndex((i) => i + 1)
  }, [pendingBusinessAdvance, primaryBusiness])

  useEffect(() => {
    if (step.spotlight && step.spotlight.includes('data-widget-id')) {
      onNavigate('committed-funds')
    }
    if (step.id === 'month-view') {
      window.dispatchEvent(new CustomEvent('tb-set-accruing-view', { detail: 'period' }))
      return () => {
        window.dispatchEvent(new CustomEvent('tb-set-accruing-view', { detail: 'list' }))
      }
    }
  }, [step.id])

  const [panelPlacement, setPanelPlacement] = useState<'center' | 'left' | 'right'>('center')

  useEffect(() => {
    const selector = step.spotlight
    if (!selector) { setPanelPlacement('center'); return }
    const el = document.querySelector(selector)
    if (!el) { setPanelPlacement('center'); return }
    el.setAttribute('data-onboarding-focus', 'true')
    el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })

    const rect = el.getBoundingClientRect()
    const midX = rect.left + rect.width / 2
    const vpWidth = window.innerWidth
    if (step.explain) {
      setPanelPlacement(midX < vpWidth * 0.5 ? 'right' : 'left')
    } else {
      setPanelPlacement(midX < vpWidth * 0.5 ? 'right' : 'left')
    }

    return () => el.removeAttribute('data-onboarding-focus')
  }, [step.id, step.spotlight])

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
    if (primaryBusiness) {
      actions.setBusinessIncomePattern(primaryBusiness.id, incomePatternDraft)
      setStepIndex((i) => i + 1)
      return
    }
    if (!businessName.trim()) return
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
      const scopeLabel = getScopeLabel(state, viewScope)
      actions.saveBalanceUpdate(viewScope, scopeLabel, changes, undefined, true)
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

  const handleReserveSetup = () => {
    const businessId = primaryBusiness?.id
    if (businessId) {
      const existingPlanner = state.reservePlanners.find((p) => p.businessId === businessId)
      if (!existingPlanner) {
        const plannerId = actions.addReservePlanner({
          name: `${primaryBusiness.name} Reserve Plan`,
          businessId,
          bufferAmount: 0,
          actualBalance: 0,
        })
        onNavigate('reserve-planner', plannerId)
      } else {
        onNavigate('reserve-planner', existingPlanner.id)
      }
    } else {
      onNavigate('reserve-planner')
    }
    setStepIndex((i) => i + 1)
  }

  const handleReserveSkip = () => {
    setStepIndex((i) => i + 1)
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

  const panel = (
    <div className="setup-onboarding-root" role="presentation">
      <div className="setup-onboarding-shade" aria-hidden="true" />

      <aside className={`setup-onboarding-panel setup-onboarding-panel--wide${step.spotlight ? ` setup-onboarding-panel--${panelPlacement}` : ''}`} role="dialog" aria-labelledby="setup-onboarding-title">
        <header className="setup-onboarding-header">
          <div className="setup-onboarding-header-row">
            <p className="setup-onboarding-kicker">
              Getting started · {stepIndex + 1} / {stepCount}
            </p>
            <button type="button" className="btn-ghost btn-tiny setup-onboarding-skip" onClick={handleDismiss}>
              Skip setup
            </button>
          </div>
          <ol className="setup-onboarding-checklist" aria-label="Progress">
            {SETUP_ONBOARDING_STEPS.map((item, index) => (
              <li
                key={item.id}
                className={
                  index < stepIndex
                    ? 'setup-onboarding-check setup-onboarding-check--done'
                    : index === stepIndex
                      ? 'setup-onboarding-check setup-onboarding-check--active'
                      : 'setup-onboarding-check'
                }
              >
                <span className="setup-onboarding-check-dot" aria-hidden />
              </li>
            ))}
          </ol>
        </header>

        <div className="setup-onboarding-body">
          <h2 id="setup-onboarding-title">{step.title}</h2>
          {step.explain.split('\n\n').map((para, i) => (
            <p key={i} className="setup-onboarding-explain">{para}</p>
          ))}
          {onBackToPathChoice && stepIndex === 0 && (
            <p className="setup-onboarding-explain muted">{MANUAL_SETUP_REASSURANCE}</p>
          )}

          {step.id === 'why' && (
            <div className="setup-why-pillars">
              {WHY_TRUE_BALANCE_CONTENT.pillars.map((pillar) => (
                <div key={pillar.heading} className="setup-why-pillar">
                  <h3>{pillar.heading}</h3>
                  <p>{pillar.body}</p>
                </div>
              ))}
              <p className="setup-why-closing">
                <strong>{WHY_TRUE_BALANCE_CONTENT.closing}</strong>
              </p>
            </div>
          )}

          {step.id === 'business' && (
            <div className="setup-onboarding-form">
              {primaryBusiness ? (
                <div className="structure-tree">
                  {state.businesses.map((biz) => (
                    <div key={biz.id} className="structure-tree-node structure-tree-node--business">
                      <div className="structure-tree-node-head">
                        <span className="structure-tree-swatch" style={{ background: biz.accentColor || 'var(--accent)' }} />
                        <span className="structure-tree-node-label">{biz.name}</span>
                      </div>
                      <div className="structure-tree-accounts">
                        {state.accounts
                          .filter((a) => a.businessId === biz.id && !a.venueId)
                          .map((a) => (
                            <span key={a.id} className="structure-tree-account-chip">
                              {a.type === 'current' ? '🏦' : '💰'} {a.name}
                            </span>
                          ))}
                      </div>
                      {state.venues.filter((v) => v.businessId === biz.id).length > 0 && (
                        <div className="structure-tree-children">
                          {state.venues.filter((v) => v.businessId === biz.id).map((venue) => (
                            <div key={venue.id} className="structure-tree-node structure-tree-node--venue">
                              <div className="structure-tree-connector" />
                              <div className="structure-tree-node-head">
                                <span className="structure-tree-swatch" style={{ background: venue.accentColor || '#6366f1' }} />
                                <span className="structure-tree-node-label">{venue.name}</span>
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
                    </div>
                  ))}
                  <button
                    type="button"
                    className="structure-tree-add-btn"
                    onClick={() => {
                      const name = `Business ${state.businesses.length + 1}`
                      actions.addBusiness(undefined, name, true)
                    }}
                  >
                    + Add another business
                  </button>
                  <p className="muted" style={{ marginTop: '8px', fontSize: '0.78rem' }}>
                    You can rename, add venues, or reorganise in Settings anytime.
                  </p>
                </div>
              ) : (
                <div className="structure-tree structure-tree--editable">
                  <div className="structure-tree-node structure-tree-node--business">
                    <div className="structure-tree-node-head">
                      <span className="structure-tree-swatch" style={{ background: 'var(--accent)' }} />
                      <input
                        className="structure-tree-name-input"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder="Your business name"
                        autoFocus
                      />
                    </div>
                    <div className="structure-tree-accounts structure-tree-accounts--editable">
                      <div className="structure-tree-account-row">
                        <span className="structure-tree-account-icon">🏦</span>
                        <input
                          className="structure-tree-name-input structure-tree-name-input--small"
                          value={accountName}
                          onChange={(e) => setAccountName(e.target.value)}
                          placeholder="Current account name"
                        />
                      </div>
                    </div>
                    {venueName ? (
                      <div className="structure-tree-children">
                        <div className="structure-tree-node structure-tree-node--venue">
                          <div className="structure-tree-connector" />
                          <div className="structure-tree-node-head">
                            <span className="structure-tree-swatch" style={{ background: '#6366f1' }} />
                            <input
                              className="structure-tree-name-input structure-tree-name-input--small"
                              value={venueName}
                              onChange={(e) => setVenueName(e.target.value)}
                              placeholder="Site / venue name"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="structure-tree-add-btn"
                        onClick={() => setVenueName('Site 1')}
                      >
                        + Add a venue / site
                      </button>
                    )}
                  </div>
                  <p className="muted" style={{ marginTop: '12px', fontSize: '0.78rem' }}>
                    Keep it simple — one business, one account. You can add more later.
                  </p>
                </div>
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
            <div className="setup-onboarding-form">
              {cashAccounts.length === 0 ? (
                <p className="muted">Add a business first, then enter balances here.</p>
              ) : (
                cashAccounts.map((account) => (
                  <label key={account.id} className="setup-field setup-field--row">
                    <span>{account.name}</span>
                    <input
                      className="sheet-input"
                      type="number"
                      step="0.01"
                      value={balanceDrafts[account.id] ?? ''}
                      onChange={(e) =>
                        setBalanceDrafts((d) => ({ ...d, [account.id]: e.target.value }))
                      }
                    />
                  </label>
                ))
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
              <div className="setup-accrual-anim">
                <div className="setup-accrual-stage setup-accrual-stage--left">
                  <div className="setup-accrual-bar-track">
                    <div className="setup-accrual-bar setup-accrual-bar--grow" />
                  </div>
                  <span className="setup-accrual-label">Building up</span>
                </div>
                <div className="setup-accrual-arrow">
                  <svg width="32" height="16" viewBox="0 0 32 16"><path d="M0 8h26m0 0l-5-5m5 5l-5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <div className="setup-accrual-stage setup-accrual-stage--right">
                  <div className="setup-accrual-due-box">
                    <span className="setup-accrual-due-text">Due</span>
                  </div>
                  <span className="setup-accrual-paid-pop">Paid</span>
                  <span className="setup-accrual-label">Stays until paid</span>
                </div>
              </div>
              <p className="setup-accrual-caption">
                Each bill builds up daily — it never stops. Once the date hits, the full amount
                moves to Due. You mark it paid when it leaves your account. Meanwhile, it&apos;s
                already building up again from day one.
              </p>
            </div>
          )}

          {step.id === 'due-explain' && (
            <div className="setup-edu-visual">
              <div className="setup-edu-funding-options">
                <div className="setup-edu-funding-option">
                  <div className="setup-edu-funding-bar setup-edu-funding-bar--immediate" />
                  <span>Deduct now</span>
                </div>
                <div className="setup-edu-funding-option">
                  <div className="setup-edu-funding-bar setup-edu-funding-bar--accrual" />
                  <span>Build up</span>
                </div>
                <div className="setup-edu-funding-option">
                  <div className="setup-edu-funding-bar setup-edu-funding-bar--hybrid" />
                  <span>Part + build</span>
                </div>
              </div>
            </div>
          )}

          {step.id === 'reserve' && (
            <div className="setup-onboarding-actions-stack">
              <button type="button" className="btn-primary" onClick={handleReserveSetup}>
                Set up Reserve Planner now
              </button>
              <button type="button" className="btn-ghost" onClick={handleReserveSkip}>
                I&apos;ll do this later
              </button>
            </div>
          )}

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
            <ul className="setup-accuracy-list">
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

        <footer className="setup-onboarding-footer">
          <button type="button" className="btn-ghost btn-tiny" onClick={handleDismiss}>
            Skip setup
          </button>
          <div className="setup-onboarding-nav">
            <button
              type="button"
              className="btn-secondary btn-tiny"
              disabled={stepIndex === 0 && !onBackToPathChoice}
              onClick={() => {
                if (stepIndex === 0 && onBackToPathChoice) onBackToPathChoice()
                else setStepIndex((i) => Math.max(0, i - 1))
              }}
            >
              Back
            </button>
            {step.id !== 'reserve' && (
              <button type="button" className="btn-primary btn-tiny" onClick={handleNext}>
                {isLast ? 'Finish' : 'Next'}
              </button>
            )}
          </div>
        </footer>
      </aside>
    </div>
  )

  return createPortal(panel, document.body)
}
