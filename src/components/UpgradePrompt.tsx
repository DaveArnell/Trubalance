import { SUBSCRIPTION_TIERS, TRIAL_DAYS, formatTierAnnualPrice, formatTierPriceMonthly } from '../config/subscriptionTiers'
import { useSubscription } from '../contexts/SubscriptionContext'

export function UpgradePrompt() {
  const { upgradePrompt, dismissUpgradePrompt } = useSubscription()

  if (!upgradePrompt?.open) return null

  const tier = SUBSCRIPTION_TIERS[upgradePrompt.requiredTier]

  return (
    <div className="upgrade-prompt-backdrop" role="presentation" onClick={dismissUpgradePrompt}>
      <div
        className="upgrade-prompt"
        role="dialog"
        aria-labelledby="upgrade-prompt-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="upgrade-prompt-title">{upgradePrompt.headline}</h2>
        <p>{upgradePrompt.body}</p>
        <p className="upgrade-prompt-tier muted">
          {tier.name} · {formatTierPriceMonthly(upgradePrompt.requiredTier)} or{' '}
          {formatTierAnnualPrice(upgradePrompt.requiredTier)}
        </p>
        <div className="upgrade-prompt-actions">
          <button type="button" className="btn-primary" disabled title="Stripe billing coming soon">
            Upgrade
          </button>
          <button type="button" className="btn-ghost" onClick={dismissUpgradePrompt}>
            Maybe later
          </button>
        </div>
      </div>
    </div>
  )
}

export function TrialBanner() {
  const { trialActive, trialDaysLeft, subscription } = useSubscription()

  if (subscription.lifetimeAccess) {
    return (
      <div className="trial-banner trial-banner--founder" role="status">
        <strong>Founder access</strong>
        <span>
          Lifetime free access — thank you for helping shape True Balance in early access.
        </span>
      </div>
    )
  }

  if (!trialActive || trialDaysLeft == null) return null

  return (
    <div className="trial-banner" role="status">
      <strong>{TRIAL_DAYS / 30}-month free trial</strong>
      <span>
        Full access to every feature · No payment details required · {trialDaysLeft} day
        {trialDaysLeft === 1 ? '' : 's'} left · No charge until day {TRIAL_DAYS + 1}
      </span>
    </div>
  )
}

export function PostTrialNotice() {
  const { postTrialNotice, openUpgrade } = useSubscription()

  if (!postTrialNotice) return null

  return (
    <div className="post-trial-notice" role="status">
      <p>
        <strong>{postTrialNotice.headline}</strong> {postTrialNotice.message}
      </p>
      <button
        type="button"
        className="btn-secondary btn-tiny"
        onClick={() =>
          openUpgrade(postTrialNotice.requiredTier, postTrialNotice.headline, postTrialNotice.message)
        }
      >
        View plans
      </button>
    </div>
  )
}
