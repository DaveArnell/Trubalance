import { useState } from 'react'
import {
  SUBSCRIPTION_TIERS,
  TRIAL_DAYS,
  formatTierAnnualPrice,
  formatTierPriceMonthly,
  recommendTierForWorkspace,
  type SubscriptionTierId,
} from '../config/subscriptionTiers'
import { useAuth } from '../contexts/AuthContext'
import { useSubscription } from '../contexts/SubscriptionContext'
import { startCheckout, startBillingPortal, isBillingConfigured } from '../services/billingApi'
import type { TrialWarningLevel } from '../utils/subscriptionAccess'

function trialWarningCopy(level: TrialWarningLevel, daysLeft: number | null): {
  title: string
  body: string
} | null {
  switch (level) {
    case 'mid':
      return {
        title: 'Ready to keep Cash Prophet after your trial?',
        body: `You are about a week into your free trial (${daysLeft ?? TRIAL_DAYS - 7} days left). Choose a plan and add a card when you are ready — nothing is charged until the trial ends.`,
      }
    case '7days':
      return {
        title: 'Your free trial ends in about a week',
        body: `You still have full access for ${daysLeft ?? 7} more days. Add a card now so your plan starts the day after the trial — no scramble on the last day.`,
      }
    case '3days':
      return {
        title: 'Three days left on your trial',
        body: 'Nothing is charged until the trial ends. Pick a plan and add a card before then if you want to keep updating balances, commitments, and reserves.',
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
  const { trialWarningLevel, trialDaysLeft, usage, trialActive } = useSubscription()
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
        <div className="upgrade-prompt-actions upgrade-prompt-actions--stack">
          <PlanCheckoutButtons
            tierId={recommendedTier}
            deferUntilTrialEnd={trialActive}
            primaryLabel="Choose plan — monthly"
          />
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
        <strong>View-only mode</strong> — you can still explore your dashboard, but editing is locked
        until you have an active subscription. We recommend the {tier.name} plan for your setup.
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

export function PlanCheckoutButtons({
  tierId,
  deferUntilTrialEnd = true,
  primaryLabel = 'Subscribe monthly',
  showAnnual = true,
}: {
  tierId: SubscriptionTierId
  deferUntilTrialEnd?: boolean
  primaryLabel?: string
  showAnnual?: boolean
}) {
  const [loading, setLoading] = useState<'monthly' | 'annual' | null>(null)
  const billingReady = isBillingConfigured()
  const { user } = useAuth()

  const start = async (billingInterval: 'monthly' | 'annual') => {
    if (!billingReady) return
    setLoading(billingInterval)
    try {
      await startCheckout({
        tierId,
        billingInterval,
        deferUntilTrialEnd,
        userId: user?.id,
        email: user?.email,
      })
    } catch (err) {
      console.error(err)
      window.alert('Could not start checkout. Please try again or contact support.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="plan-checkout-buttons">
      <button
        type="button"
        className="btn-primary"
        disabled={!billingReady || loading != null}
        title={billingReady ? undefined : 'Online billing is being set up'}
        onClick={() => void start('monthly')}
      >
        {loading === 'monthly' ? 'Opening checkout…' : primaryLabel}
      </button>
      {showAnnual && (
        <button
          type="button"
          className="btn-secondary"
          disabled={!billingReady || loading != null}
          title={billingReady ? undefined : 'Online billing is being set up'}
          onClick={() => void start('annual')}
        >
          {loading === 'annual' ? 'Opening checkout…' : 'Subscribe annually'}
        </button>
      )}
    </div>
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
        <div className="upgrade-prompt-actions upgrade-prompt-actions--stack">
          <PlanCheckoutButtons
            tierId={upgradePrompt.requiredTier}
            deferUntilTrialEnd={trialActive}
          />
          <button type="button" className="btn-ghost" onClick={dismissUpgradePrompt}>
            Maybe later
          </button>
        </div>
      </div>
    </div>
  )
}

export function TrialBanner() {
  const { trialActive, trialDaysLeft, subscription, usage, openUpgrade } = useSubscription()

  // Founder access is a compact chip in the top bar — not a full-width banner.
  if (subscription.lifetimeAccess) return null
  if (!trialActive || trialDaysLeft == null) return null

  const recommendedTier = recommendTierForWorkspace(usage)
  const hasCardOnFile = Boolean(subscription.stripeCustomerId || subscription.stripeSubscriptionId)
  const urgent = trialDaysLeft <= 7

  return (
    <div className={`trial-banner${urgent ? ' trial-banner--urgent' : ''}`} role="status">
      <div className="trial-banner-copy">
        <strong>
          {urgent
            ? `${trialDaysLeft} day${trialDaysLeft === 1 ? '' : 's'} left on your trial`
            : `${TRIAL_DAYS} day free trial`}
        </strong>
        <span>
          {hasCardOnFile
            ? `Plan ready · full access · ${trialDaysLeft} day${trialDaysLeft === 1 ? '' : 's'} left`
            : `Full access · No charge until day ${TRIAL_DAYS + 1} · ${trialDaysLeft} day${trialDaysLeft === 1 ? '' : 's'} left`}
        </span>
      </div>
      {!hasCardOnFile && isBillingConfigured() && (
        <button
          type="button"
          className="btn-primary btn-tiny"
          onClick={() =>
            openUpgrade(
              recommendedTier,
              urgent ? 'Choose a plan before your trial ends' : 'Choose a plan when you are ready',
              urgent
                ? 'Add a card now. Your subscription starts the day after the trial — nothing is charged early.'
                : 'Add a card when you like. Your subscription starts the day after the trial ends.',
            )
          }
        >
          {urgent ? 'Choose a plan' : 'Add card for later'}
        </button>
      )}
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
