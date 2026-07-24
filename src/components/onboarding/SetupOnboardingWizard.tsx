import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import type { AppActions } from '../../hooks/useAppState'
import type { AppState, DashboardMetrics, IncomePattern, ViewScope } from '../../types'
import {
  SETUP_ONBOARDING_STEP_LABELS,
  dismissSetupOnboardingLocally,
  getSetupOnboardingSteps,
} from '../../content/setupOnboarding'
import { WHY_TRUE_BALANCE_CONTENT } from '../../content/guidedSetup'
import { getOnboardingCashAccounts } from '../../utils/calculations'
import type { PageId } from '../../navigation'
import { SetupOnboardingShell } from './SetupOnboardingShell'
import { SetupWidgetPreview } from './SetupWidgetPreview'
import { SetupStructureTree } from './SetupStructureTree'
import { SetupAccruingCycleDemo } from './SetupAccruingCycleDemo'
import { SetupDueCardsDemo } from './SetupDueCardsDemo'
import { SetupReceiptCardsDemo } from './SetupReceiptCardsDemo'
import { useAuth } from '../../contexts/AuthContext'
import { trackEvent } from '../../services/eventTracking'

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

const PREVIEW_STEP_IDS = new Set([
  'committed-explain',
  'month-view',
  'due-explain',
  'receipts-explain',
  'trends-explain',
  'forecast-explain',
])

export function SetupOnboardingWizard({
  state,
  viewScope: _viewScope,
  metrics: _metrics,
  actions,
  onNavigate,
  onComplete,
  onDismiss,
  startAtStepId,
}: SetupOnboardingWizardProps) {
  const { user } = useAuth()
  const PROGRESS_KEY = 'trubalance-setup-step-index-v3'
  const [incomePatternDraft, setIncomePatternDraft] = useState<IncomePattern>(() => {
    const existing = state.businesses[0]?.incomePattern
    return existing === 'lumpy' ? 'lumpy' : 'steady'
  })
  const steps = useMemo(
    () => getSetupOnboardingSteps(incomePatternDraft),
    [incomePatternDraft],
  )

  const initialStepIndex = (() => {
    if (startAtStepId) {
      const idx = steps.findIndex((item) => item.id === startAtStepId)
      return idx >= 0 ? idx : 0
    }
    try {
      const saved = localStorage.getItem(PROGRESS_KEY)
      const idx = saved ? parseInt(saved, 10) : 0
      return idx >= 0 && idx < steps.length ? idx : 0
    } catch {
      return 0
    }
  })()

  const [stepIndex, setStepIndex] = useState(initialStepIndex)
  const [businessName, setBusinessName] = useState('')
  const [venueName, setVenueName] = useState('')
  const [accountName, setAccountName] = useState('Current account')
  const [pendingBusinessAdvance, setPendingBusinessAdvance] = useState(false)
  const [structureError, setStructureError] = useState<string | null>(null)

  // Keep index valid when forecast step appears/disappears
  useEffect(() => {
    setStepIndex((i) => Math.min(i, Math.max(0, steps.length - 1)))
  }, [steps.length])

  const step = steps[stepIndex]!
  const stepCount = steps.length
  const isLast = stepIndex >= stepCount - 1
  const isReserveStep = step.id === 'reserve'
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
    try {
      localStorage.setItem(PROGRESS_KEY, String(stepIndex))
    } catch {
      /* */
    }
  }, [stepIndex])

  useEffect(() => {
    if (!user?.id) return
    const currentStep = steps[stepIndex]
    if (!currentStep) return
    void trackEvent('setup_step_view', user.id, undefined, {
      stepId: currentStep.id,
      stepIndex,
      stepLabel: SETUP_ONBOARDING_STEP_LABELS[currentStep.id] ?? currentStep.title,
    })
  }, [stepIndex, user?.id, steps])

  const primaryBusiness = state.businesses[0]
  const cashAccounts = useMemo(() => getOnboardingCashAccounts(state), [state])

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

  const handleDismiss = () => {
    if (user?.id) {
      void trackEvent('setup_step_dismiss', user.id, undefined, {
        stepId: step.id,
        stepIndex,
        stepLabel: SETUP_ONBOARDING_STEP_LABELS[step.id] ?? step.title,
      })
    }
    try {
      localStorage.removeItem(PROGRESS_KEY)
    } catch {
      /* */
    }
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

  const handleBack = () => {
    setStepIndex((i) => Math.max(0, i - 1))
  }

  const handleNext = () => {
    if (step.id === 'business') {
      handleBusinessNext()
      return
    }
    if (isLast) {
      try {
        localStorage.removeItem(PROGRESS_KEY)
      } catch {
        /* */
      }
      dismissSetupOnboardingLocally()
      onNavigate('committed-funds')
      onComplete()
      return
    }
    setStepIndex((i) => i + 1)
  }

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
        <button type="button" className="btn-primary" onClick={handleNext}>
          {isLast ? 'Open dashboard' : 'Continue'}
        </button>
      </div>
    </>
  )

  const panel = (
    <SetupOnboardingShell
      kicker={startAtStepId ? 'App walkthrough' : 'Getting started'}
      steps={steps.map((item) => ({
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
              <label
                className={`setup-income-option${incomePatternDraft === 'steady' ? ' setup-income-option--active' : ''}`}
              >
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
              <label
                className={`setup-income-option${incomePatternDraft === 'lumpy' ? ' setup-income-option--active' : ''}`}
              >
                <input
                  type="radio"
                  name="incomePattern"
                  value="lumpy"
                  checked={incomePatternDraft === 'lumpy'}
                  onChange={() => setIncomePatternDraft('lumpy')}
                />
                <span>
                  <strong>Irregular / invoiced</strong>
                  <small>
                    Contractors, agencies, consultancies — larger payments at varying intervals
                  </small>
                </span>
              </label>
            </fieldset>
          </div>
        )}

        {step.id === 'committed-explain' && <SetupAccruingCycleDemo />}
        {step.id === 'due-explain' && <SetupDueCardsDemo />}
        {step.id === 'receipts-explain' && <SetupReceiptCardsDemo />}
        {step.id === 'month-view' && <SetupWidgetPreview previewId="month-view" />}
        {step.id === 'reserve' && (
          <div className="setup-reserve-step">
            <SetupWidgetPreview previewId="reserve" />
          </div>
        )}
        {step.id === 'trends-explain' && <SetupWidgetPreview previewId="trends" />}
        {step.id === 'forecast-explain' && <SetupWidgetPreview previewId="forecast" />}

        {step.id === 'handoff' && (
          <ol className="setup-handoff-list">
            <li>Add today’s balances on your current accounts</li>
            <li>Add monthly accruing costs</li>
            <li>Add anything due or one-off</li>
            <li>Add expected receipts</li>
            <li>Set up your reserve plan (optional)</li>
          </ol>
        )}
      </div>
    </SetupOnboardingShell>
  )

  return createPortal(panel, document.body)
}
