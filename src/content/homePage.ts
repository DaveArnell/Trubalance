/**
 * Homepage marketing copy. Short: problem, dashboard, why the bank misleads, try it.
 */

import { TRIAL_DAYS } from '../config/subscriptionTiers'

export const HOME_HERO = {
  category: 'Simple money management for small businesses',
  headlineStart: 'Finally understand',
  headlineHighlight: 'where your business really stands.',
  subheading: [
    "Keeping it all in your head gets messy. Your bank balance is easy to see. What's harder is remembering everything it already needs to cover.",
    'Cash Prophet puts it all in order. Regular costs, larger bills, and one Cash Prophet Balance you can actually use.',
  ],
  primaryCta: 'Try the free Snapshot',
  secondaryCta: `Start ${TRIAL_DAYS} days free`,
  noCard: 'No card required.',
  onboarding: 'Free personal onboarding',
} as const

export const HOME_BANK = {
  heading: 'Why the bank balance can be misleading.',
  lead: 'Many business costs are building every day, even though the cash only leaves the bank now and then. The account can look healthy simply because a bill has not hit yet.',
} as const

export const HOME_SNAPSHOT = {
  heading: 'See it with your own numbers.',
  lead: 'Enter your current bank balance and some regular commitments. The free Snapshot shows how much of that balance is already spoken for, based on those figures.',
  points: ['No account required', 'No card', 'Takes only a few minutes'],
  cta: 'Try the free Snapshot',
} as const

export const HOME_CTA = {
  heading: 'Know where your business really stands',
  body: `Start ${TRIAL_DAYS} days free, or try the free Snapshot with your own figures.`,
  footnote: `${TRIAL_DAYS} days free. No card required. Personal onboarding available.`,
  primary: 'Try the free Snapshot',
  secondary: `Start ${TRIAL_DAYS} days free`,
  onboarding: 'Personal onboarding',
} as const
