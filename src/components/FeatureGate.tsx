import type { ReactNode } from 'react'
import type { SubscriptionFeatureFlag } from '../config/subscriptionTiers'
import { SUBSCRIPTION_TIERS } from '../config/subscriptionTiers'
import { useSubscription } from '../contexts/SubscriptionContext'
import { tierRequiredForFeature } from '../utils/subscriptionAccess'

interface FeatureGateProps {
  feature: SubscriptionFeatureFlag
  headline: string
  body: string
  savedCount?: number
  savedLabel?: string
  children: ReactNode
}

export function FeatureGate({
  feature,
  headline,
  body,
  savedCount = 0,
  savedLabel = 'items saved',
  children,
}: FeatureGateProps) {
  const { canUseFeature, requestFeature } = useSubscription()
  const requiredTierId = tierRequiredForFeature(feature)
  const requiredTierName = SUBSCRIPTION_TIERS[requiredTierId].name

  if (canUseFeature(feature)) {
    return <>{children}</>
  }

  return (
    <div className="feature-gate">
      <div className="feature-gate-content feature-gate-content--locked" aria-hidden>
        {children}
      </div>
      <div className="feature-gate-overlay">
        <div className="feature-gate-card">
          <p className="feature-gate-badge">{requiredTierName} plan</p>
          <h3>{headline}</h3>
          <p>{body}</p>
          {savedCount > 0 && (
            <p className="feature-gate-saved muted">
              You have <strong>{savedCount}</strong> {savedLabel} — upgrade to keep access.
            </p>
          )}
          <button type="button" className="btn-primary" onClick={() => requestFeature(feature)}>
            View {requiredTierName} plan
          </button>
        </div>
      </div>
    </div>
  )
}
