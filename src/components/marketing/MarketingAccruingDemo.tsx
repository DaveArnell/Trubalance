import { SetupAccruingCycleDemo } from '../onboarding/SetupAccruingCycleDemo'
import { METHOD_ACCRUING_DEMO } from '../../content/trueBalanceMethod'

type MarketingAccruingDemoProps = {
  /** Use home section spacing/classes when embedded on the landing page. */
  variant?: 'home' | 'method'
}

/**
 * Educational accruing-cycle demo for marketing pages.
 * Reuses the setup walkthrough animation; video slot intentionally omitted.
 */
export function MarketingAccruingDemo({ variant = 'home' }: MarketingAccruingDemoProps) {
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
          <h2 id="accruing-demo-heading">{METHOD_ACCRUING_DEMO.heading}</h2>
          <p
            className={
              variant === 'home'
                ? 'marketing-section-lead marketing-section-lead--home'
                : 'method-edu-section-lead'
            }
          >
            {METHOD_ACCRUING_DEMO.lead}
          </p>
        </div>
        <div className="marketing-accruing-demo-stage">
          <SetupAccruingCycleDemo />
        </div>
      </div>
    </section>
  )
}
