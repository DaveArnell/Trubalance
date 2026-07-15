import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  SUBSCRIPTION_TIERS,
  TRIAL_DAYS,
  TIER_ORDER,
  formatPriceGbp,
  recommendTierForWorkspace,
  type SubscriptionTierId,
} from '../config/subscriptionTiers'
import { ManageBillingButton } from './UpgradePrompt'
import { isBillingConfigured } from '../services/billingApi'
import { useAuth } from '../contexts/AuthContext'
import { useSubscription } from '../contexts/SubscriptionContext'
import { summarizeAppState } from '../utils/localStateStorage'
import type { AppState } from '../types'

function formatTrialEnd(iso: string | null): string | null {
  if (!iso) return null
  try {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return null
  }
}

function planLimitSummary(tierId: SubscriptionTierId): string {
  const tier = SUBSCRIPTION_TIERS[tierId]
  const biz = tier.limits.businesses
  const venues = tier.limits.venues
  const bizLabel = biz == null ? 'Unlimited businesses' : biz === 1 ? '1 business' : `Up to ${biz} businesses`
  if (venues === 0) return `${bizLabel} · no venues`
  if (venues == null) return `${bizLabel} · unlimited venues`
  return `${bizLabel} · up to ${venues} venues`
}

interface AccountSubscriptionPanelProps {
  state: AppState
  embedded?: boolean
}

export function AccountSubscriptionPanel({ state, embedded = false }: AccountSubscriptionPanelProps) {
  const { user } = useAuth()
  const { subscription, usage, trialActive, trialDaysLeft, fullAccess, openUpgrade } =
    useSubscription()

  const summary = summarizeAppState(state)
  const recommendedTierId = recommendTierForWorkspace(usage)
  const recommendedTier = SUBSCRIPTION_TIERS[recommendedTierId]
  const trialEndLabel = formatTrialEnd(subscription.trialEndsAt)

  const trialProgress = useMemo(() => {
    if (!trialActive || trialDaysLeft == null) return null
    const elapsed = TRIAL_DAYS - trialDaysLeft
    return Math.min(100, Math.max(0, Math.round((elapsed / TRIAL_DAYS) * 100)))
  }, [trialActive, trialDaysLeft])

  const verdictDetail =
    recommendedTierId === 'group'
      ? `You are running ${usage.businesses} companies — Business Group includes switching between them, group reporting, and unlimited venues.`
      : recommendedTierId === 'multi'
        ? `You have one business with ${usage.venues} venue${usage.venues === 1 ? '' : 's'} — Multi-site Business fits that structure.`
        : 'You are tracking one business without separate venues — Solo Business is the right fit when your trial ends.'

  const body = (
    <>
      <article className="account-plan-verdict">
        <p className="account-plan-verdict-eyebrow">Recommended plan</p>
        <p className="account-plan-verdict-name">{recommendedTier.name}</p>
        <p className="account-plan-verdict-why">{verdictDetail}</p>
        {(usage.venues > 0 || usage.businesses > 1) && (
          <dl className="account-plan-compare-note">
            <div>
              <dt>Solo Business</dt>
              <dd>One company, no venues — accounts on the business itself.</dd>
            </div>
            <div>
              <dt>Multi-site Business</dt>
              <dd>One company with unlimited venues and a consolidated view across those sites.</dd>
            </div>
            <div>
              <dt>Business Group</dt>
              <dd>Unlimited companies, group reporting, Business Hub.</dd>
            </div>
          </dl>
        )}
        {trialActive && (
          <p className="account-plan-verdict-trial muted">
            Your trial unlocks <strong>every plan&apos;s features</strong> until{' '}
            {trialEndLabel ?? 'it ends'}. After that, features follow the plan you choose.
          </p>
        )}
      </article>

      {trialActive && trialDaysLeft != null && (
        <article className="account-plan-block account-plan-block--trial">
          <h4>Trial progress</h4>
          <p>
            <strong>{trialDaysLeft}</strong> day{trialDaysLeft === 1 ? '' : 's'} left
            {trialEndLabel ? ` · ends ${trialEndLabel}` : ''}
          </p>
          {trialProgress != null && (
            <div
              className="account-plan-trial-bar"
              role="progressbar"
              aria-valuenow={trialProgress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Trial progress"
            >
              <span style={{ width: `${trialProgress}%` }} />
            </div>
          )}
        </article>
      )}

      <div className="account-plan-tiers">
        {TIER_ORDER.map((tierId) => {
          const tier = SUBSCRIPTION_TIERS[tierId]
          const isRecommended = tierId === recommendedTierId
          return (
            <article
              key={tierId}
              className={`account-plan-tier${isRecommended ? ' account-plan-tier--recommended' : ''}`}
            >
              {isRecommended && (
                <span className="account-plan-tier-badge">Recommended for you</span>
              )}
              <h4 className="account-plan-tier-name">{tier.name}</h4>
              <p className="account-plan-tier-price-row">
                <span className="account-plan-tier-price-main">
                  {formatPriceGbp(tier.priceMonthlyGbp)}
                  <span className="account-plan-tier-price-unit">/ month</span>
                </span>
                <span className="account-plan-tier-price-note muted">Rolling monthly contract</span>
              </p>
              <p className="account-plan-tier-price-row account-plan-tier-price-row--annual">
                <span className="account-plan-tier-price-main">
                  {formatPriceGbp(tier.priceAnnualGbp)}
                  <span className="account-plan-tier-price-unit">/ year</span>
                </span>
                <span className="account-plan-tier-price-note muted">Paid upfront · 2 months free</span>
              </p>
              <p className="account-plan-tier-for muted">{tier.perfectFor}</p>
              <p className="account-plan-tier-limit">
                <strong>{planLimitSummary(tierId)}</strong>
              </p>
              <ul className="account-plan-tier-features">
                {tier.marketingFeatures.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          )
        })}
      </div>

      <article className="account-plan-block">
        <h4>Billing & invoices</h4>
        {isBillingConfigured() ? (
          <>
            <p className="muted">
              Manage your subscription, update payment details, and download invoices from the billing
              portal.
            </p>
            <div className="account-plan-actions">
              <ManageBillingButton />
              <Link to="/pricing" className="btn-secondary btn-tiny">
                Full plan comparison
              </Link>
            </div>
          </>
        ) : (
          <>
            <p className="muted">
              Online payments are being connected. Compare plans and see pricing on our pricing page.
              When billing is live, you will manage your subscription here and download invoices.
            </p>
            <div className="account-plan-actions">
              <Link to="/pricing#billing" className="btn-primary btn-tiny">
                View pricing
              </Link>
              <Link to="/pricing" className="btn-secondary btn-tiny">
                Full plan comparison
              </Link>
            </div>
          </>
        )}
        {user?.email && (
          <p className="muted account-plan-email">
            Signed in as <strong>{user.email}</strong> · workspace <strong>{summary.label}</strong>
          </p>
        )}
        {!fullAccess && (
          <div className="account-plan-actions">
            <button
              type="button"
              className="btn-ghost btn-tiny"
              onClick={() =>
                openUpgrade(
                  recommendedTierId,
                  `${recommendedTier.name} plan recommended`,
                  verdictDetail,
                )
              }
            >
              See upgrade options
            </button>
          </div>
        )}
      </article>
    </>
  )

  if (embedded) {
    return <div className="account-plan-embedded">{body}</div>
  }

  return (
    <section className="card account-plan-card">
      <div className="card-head card-head-compact">
        <div>
          <h2>Your plan</h2>
          <p className="muted account-plan-lead">Which plan fits your setup and what each one includes.</p>
        </div>
      </div>
      {body}
    </section>
  )
}
