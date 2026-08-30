import { SetupAccruingCycleDemo } from '../onboarding/SetupAccruingCycleDemo'
import { METHOD_ACCRUING_DEMO } from '../../content/trueBalanceMethod'

type MarketingAccruingDemoProps = {
  /** Use home section spacing/classes when embedded on the landing page. */
  variant?: 'home' | 'method'
  heading?: string
  lead?: string
}

/**
 * Educational accruing-cycle demo for marketing pages.
 * Uses the building-only loop (no Due column). Onboarding teaches the Due handoff separately.
 */
export function MarketingAccruingDemo({
  variant = 'home',
  heading = METHOD_ACCRUING_DEMO.heading,
  lead = METHOD_ACCRUING_DEMO.lead,
}: MarketingAccruingDemoProps) {
  const sectionClass =
    variant === 'home'
      ? 'marketing-accruing-demo marketing-accruing-demo--home'
      : 'marketing-accruing-demo marketing-accruing-demo--method'

  return (
    <section
      className={sectionClass}
      id="accruing-costs"
      aria-labelledby="accruing-demo-heading"
    >
      <div
        className={
          variant === 'home'
            ? 'marketing-section-inner marketing-section-inner--home'
            : 'method-edu-inner'
        }
      >
        <div className={variant === 'home' ? 'marketing-section-head' : 'method-edu-section-head'}>
          <h2 id="accruing-demo-heading">{heading}</h2>
          <p
            className={
              variant === 'home'
                ? 'marketing-section-lead marketing-section-lead--home'
                : 'method-edu-section-lead'
            }
          >
            {lead}
          </p>
        </div>
        <div className="marketing-accruing-demo-stage">
          <SetupAccruingCycleDemo mode="building-only" />
        </div>
      </div>
    </section>
  )
}
