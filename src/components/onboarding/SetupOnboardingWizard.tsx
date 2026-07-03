import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import type { AppActions } from '../../hooks/useAppState'
import type { AppState, DashboardMetrics, ViewScope } from '../../types'
import { getScopeLabel } from '../../utils/scope'
import { toAmount, roundCurrency } from '../../utils/amounts'
import {
  QUICK_COMMITMENT_TEMPLATES,
  SETUP_ONBOARDING_STEPS,
  dismissSetupOnboardingLocally,
} from '../../content/setupOnboarding'
import { QUICK_HABITS } from '../../content/livingDashboard'
import { MANUAL_SETUP_REASSURANCE } from '../../content/guidedSetup'
import { formatCurrency } from '../../utils/format'
import { getCashAccounts, getAccountsForScope } from '../../utils/calculations'
import type { PageId } from '../../navigation'

interface SetupOnboardingWizardProps {
  state: AppState
  viewScope: ViewScope
  metrics: DashboardMetrics
  actions: Pick<
    AppActions,
    'setupMinimalWorkspace' | 'saveBalanceUpdate' | 'addCommitment'
  >
  onNavigate: (pageId: PageId) => void
  onComplete: () => void
  onDismiss: () => void
  onBackToPathChoice?: () => void
}

type CommitmentDraft = { name: string; amount: string; selected: boolean }

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
  const [stepIndex, setStepIndex] = useState(0)
  const [businessName, setBusinessName] = useState('')
  const [venueName, setVenueName] = useState('')
  const [accountName, setAccountName] = useState('Current account')
  const [balanceDrafts, setBalanceDrafts] = useState<Record<string, string>>({})
  const [commitmentDrafts, setCommitmentDrafts] = useState<CommitmentDraft[]>(() =>
    QUICK_COMMITMENT_TEMPLATES.map((t) => ({ name: t.name, amount: '', selected: false })),
  )
  const [pendingBusinessAdvance, setPendingBusinessAdvance] = useState(false)

  const step = SETUP_ONBOARDING_STEPS[stepIndex]!
  const stepCount = SETUP_ONBOARDING_STEPS.length
  const isLast = stepIndex >= stepCount - 1

  const primaryBusiness = state.businesses[0]
  const cashAccounts = useMemo(
    () => getCashAccounts(getAccountsForScope(state, viewScope)),
    [state, viewScope],
  )

  useEffect(() => {
    if (!pendingBusinessAdvance || !primaryBusiness) return
    setPendingBusinessAdvance(false)
    setStepIndex((i) => i + 1)
  }, [pendingBusinessAdvance, primaryBusiness])

  useEffect(() => {
    const selector = step.spotlight
    if (!selector) return
    const el = document.querySelector(selector)
    if (!el) return
    el.setAttribute('data-onboarding-focus', 'true')
    el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
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
    dismissSetupOnboardingLocally()
    onDismiss()
  }

  const handleBusinessNext = () => {
    if (primaryBusiness) {
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
        actions.addCommitment({
          name: draft.name,
          schedule: 'monthly',
          amount,
          dueDayOfMonth: 28,
          scopeLevel: 'business',
          scopeId: businessId,
          status: 'healthy',
        })
      }
    }
    setStepIndex((i) => i + 1)
  }

  const handleReserveSetup = () => {
    onNavigate('reserve-planner')
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
      <button
        type="button"
        className="setup-onboarding-shade"
        aria-label="Close setup guide"
        onClick={handleDismiss}
      />

      <aside className="setup-onboarding-panel" role="dialog" aria-labelledby="setup-onboarding-title">
        <header className="setup-onboarding-header">
          <p className="setup-onboarding-kicker">
            {onBackToPathChoice ? 'Manual setup' : 'Setup guide'} · Step {stepIndex + 1} of {stepCount}
          </p>
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
                <span className="setup-onboarding-check-label">{item.title.split('.')[0]}</span>
              </li>
            ))}
          </ol>
        </header>

        <div className="setup-onboarding-body">
          <h2 id="setup-onboarding-title">{step.title}</h2>
          <p className="setup-onboarding-explain">{step.explain}</p>
          {onBackToPathChoice && stepIndex === 0 && (
            <p className="setup-onboarding-explain muted">{MANUAL_SETUP_REASSURANCE}</p>
          )}

          {step.id === 'business' && (
            <div className="setup-onboarding-form">
              {primaryBusiness ? (
                <p className="muted">
                  Using <strong>{primaryBusiness.name}</strong>. You can add more in Settings later.
                </p>
              ) : (
                <>
                  <label className="setup-field">
                    <span>Business name</span>
                    <input
                      className="sheet-input"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g. Acme Ltd"
                      autoFocus
                    />
                  </label>
                  <label className="setup-field">
                    <span>Site or venue (optional)</span>
                    <input
                      className="sheet-input"
                      value={venueName}
                      onChange={(e) => setVenueName(e.target.value)}
                      placeholder="Leave blank if you only need one location"
                    />
                  </label>
                  <label className="setup-field">
                    <span>Main account name</span>
                    <input
                      className="sheet-input"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                    />
                  </label>
                </>
              )}
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
                  )}
                </div>
              ))}
              <p className="setup-onboarding-hint muted">
                Tick what applies and enter a typical monthly amount. You can refine these anytime.
              </p>
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
                  <dd>{formatCurrency(trueBalance)}</dd>
                </div>
              </dl>
              {exampleGap > 0 && bankBalance > 0 && (
                <p className="setup-reveal-example muted">
                  Your bank balance might say {formatCurrency(bankBalance)}, but your True Balance is{' '}
                  {formatCurrency(trueBalance)} once committed money is accounted for.
                </p>
              )}
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
