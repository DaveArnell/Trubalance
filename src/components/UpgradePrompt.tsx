import { useState } from 'react'
import {
  SUBSCRIPTION_TIERS,
  TRIAL_DAYS,
  formatTierAnnualPrice,
  formatTierPriceMonthly,
  recommendTierForWorkspace,
  type SubscriptionTierId,
} from '../config/subscriptionTiers'
import { useSubscription } from '../contexts/SubscriptionContext'
import { startCheckout, startBillingPortal, isBillingConfigured } from '../services/billingApi'
import type { TrialWarningLevel } from '../utils/subscriptionAccess'

function trialWarningCopy(level: TrialWarningLevel, daysLeft: number | null): {
  title: string
  body: string
} | null {
  switch (level) {
    case '7days':
      return {
        title: 'Your free trial ends in about a week',
        body: `You still have full access for ${daysLeft ?? 7} more days. When the trial ends, your workspace stays — you will need a plan to keep editing.`,
      }
    case '3days':
      return {
        title: 'Three days left on your trial',
        body: 'Nothing is charged automatically. Pick a plan before your trial ends if you want to keep updating balances, commitments, and reserves.',
      }
    case '1day':
      return {
        title: 'Your trial ends tomorrow',
        body: 'Your data stays safe. Subscribe to keep editing — or stay in view-only mode until you are ready.',
      }
    case 'expired':
      return {
        title: 'Your trial has ended',
        body: 'You can still view your dashboard and trends. Choose a plan to unlock editing again.',
      }
    default:
      return null
  }
}

const TRIAL_WARNING_DISMISS_KEY = 'trubalance-trial-warning-dismissed'

function wasTrialWarningDismissed(level: TrialWarningLevel): boolean {
  try {
    return sessionStorage.getItem(`${TRIAL_WARNING_DISMISS_KEY}-${level}`) === '1'
  } catch {
    return false
  }
}

function dismissTrialWarning(level: TrialWarningLevel): void {
  try {
    sessionStorage.setItem(`${TRIAL_WARNING_DISMISS_KEY}-${level}`, '1')
  } catch {
    /* ignore */
  }
}

export function TrialWarningModal() {
  const { trialWarningLevel, trialDaysLeft, usage } = useSubscription()
  const copy = trialWarningCopy(trialWarningLevel, trialDaysLeft)
  const [dismissed, setDismissed] = useState(() => wasTrialWarningDismissed(trialWarningLevel))

  if (!copy || dismissed || trialWarningLevel === 'none') return null

  const recommendedTier = recommendTierForWorkspace(usage)

  const handleDismiss = () => {
    dismissTrialWarning(trialWarningLevel)
    setDismissed(true)
  }

  return (
    <div className="upgrade-prompt-backdrop" role="presentation" onClick={handleDismiss}>
      <div
        className="upgrade-prompt trial-warning-modal"
        role="dialog"
        aria-labelledby="trial-warning-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="trial-warning-title">{copy.title}</h2>
        <p>{copy.body}</p>
        <div className="upgrade-prompt-actions">
          <UpgradeButton tierId={recommendedTier} label="View plans" />
          <button type="button" className="btn-ghost" onClick={handleDismiss}>
            Remind me later
          </button>
        </div>
      </div>
    </div>
  )
}

export function ReadOnlyLockBanner() {
  const { subscriptionReadOnly, usage, openUpgrade } = useSubscription()

  if (!subscriptionReadOnly) return null

  const recommendedTier = recommendTierForWorkspace(usage)
  const tier = SUBSCRIPTION_TIERS[recommendedTier]

  return (
    <div className="read-only-lock-banner" role="status">
      <p>
        <strong>View-only mode</strong> — your trial has ended. You can explore your dashboard, but
        editing is locked until you subscribe. We recommend the {tier.name} plan for your setup.
      </p>
      <button
        type="button"
        className="btn-primary btn-tiny"
        onClick={() =>
          openUpgrade(
            recommendedTier,
            'Choose a plan to keep editing',
            `Your workspace is saved. Subscribe to the ${tier.name} plan to unlock changes again.`,
          )
        }
      >
        Choose a plan
      </button>
    </div>
  )
}

function UpgradeButton({
  tierId,
  label = 'Upgrade',
  billingInterval = 'monthly',
  deferUntilTrialEnd = true,
}: {
  tierId: SubscriptionTierId
  label?: string
  billingInterval?: 'monthly' | 'annual'
  deferUntilTrialEnd?: boolean
}) {
  const [loading, setLoading] = useState(false)
  const billingReady = isBillingConfigured()

  const handleClick = async () => {
    if (!billingReady) return
    setLoading(true)
    try {
      await startCheckout({ tierId, billingInterval, deferUntilTrialEnd })
    } catch (err) {
      console.error(err)
      window.alert('Could not start checkout. Please try again or contact support.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      className="btn-primary"
      disabled={!billingReady || loading}
      title={billingReady ? undefined : 'Online billing is being set up'}
      onClick={() => void handleClick()}
    >
      {loading ? 'Opening checkout…' : label}
    </button>
  )
}

export function UpgradePrompt() {
  const { upgradePrompt, dismissUpgradePrompt, trialActive, trialDaysLeft } = useSubscription()

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
        {trialActive && trialDaysLeft != null && trialDaysLeft > 0 && (
          <p className="upgrade-prompt-note muted">
            Pay now and your subscription starts the day after your trial ends — you keep full access
            until then.
          </p>
        )}
        <div className="upgrade-prompt-actions">
          <UpgradeButton tierId={upgradePrompt.requiredTier} deferUntilTrialEnd={trialActive} />
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
          Lifetime free access — thank you for helping shape Cash Prophet in early access.
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

export function ManageBillingButton({ className }: { className?: string }) {
  const [loading, setLoading] = useState(false)
  const billingReady = isBillingConfigured()

  const handleClick = async () => {
    if (!billingReady) return
    setLoading(true)
    try {
      await startBillingPortal()
    } catch (err) {
      console.error(err)
      window.alert('Could not open billing portal. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      className={className ?? 'btn-primary btn-tiny'}
      disabled={!billingReady || loading}
      title={billingReady ? undefined : 'Online billing is being set up'}
      onClick={() => void handleClick()}
    >
      {loading ? 'Opening…' : 'Manage billing'}
    </button>
  )
}
