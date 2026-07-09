import { useEffect, type ReactNode } from 'react'

export interface SetupFlowStep {
  id: string
  label: string
}

interface SetupOnboardingShellProps {
  kicker?: string
  sidebarTitle?: string
  sidebarLead?: string
  steps?: SetupFlowStep[]
  currentStepIndex?: number
  /** Manual tour — app stays visible beside the sidebar */
  spotlight?: boolean
  contentWidth?: 'default' | 'wide' | 'import' | 'review' | 'path-choice' | 'spotlight'
  onSkip: () => void
  skipLabel?: string
  footer?: ReactNode
  children: ReactNode
}

export function SetupFlowBrand({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`setup-flow-brand${compact ? ' setup-flow-brand--compact' : ''}`}>
      <span className="setup-flow-brand-mark" aria-hidden="true">
        TB
      </span>
      <div>
        <p className="setup-flow-brand-name">True Balance</p>
        {!compact && <p className="setup-flow-brand-tag">Financial clarity</p>}
      </div>
    </div>
  )
}

function SetupFlowStepNav({
  steps,
  currentStepIndex,
}: {
  steps: SetupFlowStep[]
  currentStepIndex: number
}) {
  return (
    <ol className="setup-flow-steps" aria-label="Setup progress">
      {steps.map((step, index) => {
        const done = index < currentStepIndex
        const active = index === currentStepIndex
        return (
          <li
            key={step.id}
            className={
              done
                ? 'setup-flow-step setup-flow-step--done'
                : active
                  ? 'setup-flow-step setup-flow-step--active'
                  : 'setup-flow-step'
            }
            aria-current={active ? 'step' : undefined}
          >
            <span className="setup-flow-step-indicator" aria-hidden="true">
              {done ? (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M2.5 6l2.5 2.5 4.5-5"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <span className="setup-flow-step-dot" />
              )}
            </span>
            <span className="setup-flow-step-label">{step.label}</span>
          </li>
        )
      })}
    </ol>
  )
}

export function SetupOnboardingShell({
  kicker,
  sidebarTitle,
  sidebarLead,
  steps,
  currentStepIndex = 0,
  spotlight = false,
  contentWidth = 'default',
  onSkip,
  skipLabel = 'Skip for now',
  footer,
  children,
}: SetupOnboardingShellProps) {
  useEffect(() => {
    if (!spotlight) return
    document.body.classList.add('setup-onboarding-spotlight-active')
    return () => {
      document.body.classList.remove('setup-onboarding-spotlight-active')
    }
  }, [spotlight])

  return (
    <div
      className={`setup-flow-root${spotlight ? ' setup-flow-root--spotlight' : ''}`}
      role="presentation"
    >
      {spotlight ? <div className="setup-flow-spotlight-shade" aria-hidden="true" /> : null}

      <div
        className={`setup-flow-layout${contentWidth === 'path-choice' ? ' setup-flow-layout--path-choice' : ''}`}
      >
        <aside className="setup-flow-sidebar">
          <SetupFlowBrand />

          {kicker ? <p className="setup-flow-kicker">{kicker}</p> : null}

          {sidebarTitle ? <h1 className="setup-flow-sidebar-title">{sidebarTitle}</h1> : null}
          {sidebarLead ? <p className="setup-flow-sidebar-lead">{sidebarLead}</p> : null}

          {steps && steps.length > 0 ? (
            <SetupFlowStepNav steps={steps} currentStepIndex={currentStepIndex} />
          ) : null}

          <div className="setup-flow-sidebar-spacer" />

          <button type="button" className="setup-flow-skip" onClick={onSkip}>
            {skipLabel}
          </button>
        </aside>

        <main
          className={`setup-flow-main setup-flow-main--${contentWidth}`}
          role="dialog"
          aria-modal={!spotlight}
        >
          <div className="setup-flow-content">{children}</div>
          {footer ? <footer className="setup-flow-footer">{footer}</footer> : null}
        </main>
      </div>
    </div>
  )
}
