import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { SubscriptionLimitKey, SubscriptionTierId, SubscriptionFeatureFlag } from '../config/subscriptionTiers'
import { SUBSCRIPTION_TIERS } from '../config/subscriptionTiers'
import {
  buildUsageFromAppState,
  loadLocalSubscription,
  saveLocalSubscription,
  SUBSCRIPTION_UPDATED_EVENT,
} from '../services/subscriptionStorage'
import type { AppState } from '../types'
import type { UpgradePromptState, WorkspaceSubscription, WorkspaceUsage } from '../types/subscription'
import {
  checkFeature,
  checkLimit,
  effectiveTier,
  hasFeature,
  hasFullTrialAccess,
  isTrialActive,
  subscriptionNeedsUpgrade,
  trialDaysRemaining,
} from '../utils/subscriptionAccess'
import { isLocalDevMode } from '../lib/devMode'

interface SubscriptionContextValue {
  subscription: WorkspaceSubscription
  usage: WorkspaceUsage
  effectiveTierId: SubscriptionTierId
  trialActive: boolean
  trialDaysLeft: number | null
  fullAccess: boolean
  updateSubscription: (patch: Partial<WorkspaceSubscription>) => void
  requestLimit: (limit: SubscriptionLimitKey, nextCount: number) => boolean
  requestFeature: (feature: SubscriptionFeatureFlag) => boolean
  canUseFeature: (feature: SubscriptionFeatureFlag) => boolean
  upgradePrompt: UpgradePromptState | null
  dismissUpgradePrompt: () => void
  openUpgrade: (requiredTier: SubscriptionTierId, headline: string, body: string) => void
  postTrialNotice: { requiredTier: SubscriptionTierId; headline: string; message: string } | null
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null)

export function SubscriptionProvider({
  children,
  state,
  userCount = 1,
  remoteSubscription = null,
}: {
  children: ReactNode
  state: AppState
  userCount?: number
  remoteSubscription?: WorkspaceSubscription | null
}) {
  const [subscription, setSubscription] = useState<WorkspaceSubscription>(() => loadLocalSubscription())
  const [upgradePrompt, setUpgradePrompt] = useState<UpgradePromptState | null>(null)

  useEffect(() => {
    if (!remoteSubscription) return
    setSubscription(remoteSubscription)
    saveLocalSubscription(remoteSubscription)
  }, [remoteSubscription])

  useEffect(() => {
    const reload = () => setSubscription(loadLocalSubscription())
    window.addEventListener(SUBSCRIPTION_UPDATED_EVENT, reload)
    return () => window.removeEventListener(SUBSCRIPTION_UPDATED_EVENT, reload)
  }, [])

  const usage = useMemo(() => buildUsageFromAppState(state, userCount), [state, userCount])
  const now = useMemo(() => new Date(), [subscription, state])

  const effectiveTierId = useMemo(
    () => effectiveTier(subscription, usage, now),
    [subscription, usage, now],
  )

  const trialActive = isTrialActive(subscription, now)
  const trialDaysLeft = trialDaysRemaining(subscription, now)
  const fullAccess = hasFullTrialAccess(subscription, now)
  const postTrialNotice = subscriptionNeedsUpgrade(subscription, usage, now)

  const updateSubscription = useCallback((patch: Partial<WorkspaceSubscription>) => {
    setSubscription((current) => {
      const next = { ...current, ...patch }
      if (isLocalDevMode()) saveLocalSubscription(next)
      return next
    })
  }, [])

  const openUpgrade = useCallback((requiredTier: SubscriptionTierId, headline: string, body: string) => {
    setUpgradePrompt({ open: true, requiredTier, headline, body })
  }, [])

  const dismissUpgradePrompt = useCallback(() => setUpgradePrompt(null), [])

  const requestLimit = useCallback(
    (limit: SubscriptionLimitKey, nextCount: number) => {
      const result = checkLimit(subscription, usage, limit, nextCount, now)
      if (!result.allowed && result.requiredTier && result.headline && result.message) {
        openUpgrade(result.requiredTier, result.headline, result.message)
        return false
      }
      return true
    },
    [subscription, usage, now, openUpgrade],
  )

  const requestFeature = useCallback(
    (feature: SubscriptionFeatureFlag) => {
      const result = checkFeature(subscription, usage, feature, now)
      if (!result.allowed && result.requiredTier && result.headline && result.message) {
        openUpgrade(result.requiredTier, result.headline, result.message)
        return false
      }
      return true
    },
    [subscription, usage, now, openUpgrade],
  )

  const canUseFeature = useCallback(
    (feature: SubscriptionFeatureFlag) => hasFeature(subscription, usage, feature, now),
    [subscription, usage, now],
  )

  const value = useMemo(
    () => ({
      subscription,
      usage,
      effectiveTierId,
      trialActive,
      trialDaysLeft,
      fullAccess,
      updateSubscription,
      requestLimit,
      requestFeature,
      canUseFeature,
      upgradePrompt,
      dismissUpgradePrompt,
      openUpgrade,
      postTrialNotice,
    }),
    [
      subscription,
      usage,
      effectiveTierId,
      trialActive,
      trialDaysLeft,
      fullAccess,
      updateSubscription,
      requestLimit,
      requestFeature,
      canUseFeature,
      upgradePrompt,
      dismissUpgradePrompt,
      openUpgrade,
      postTrialNotice,
    ],
  )

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext)
  if (!ctx) throw new Error('useSubscription must be used within SubscriptionProvider')
  return ctx
}

export function formatUpgradeTierLabel(tierId: SubscriptionTierId): string {
  const tier = SUBSCRIPTION_TIERS[tierId]
  return `${tier.name} — £${tier.priceMonthlyGbp.toFixed(2)}/month`
}
