/**
 * Homepage marketing copy. Confidence first; Cash Prophet Balance later.
 */

import { BRAND_SLOGAN } from './brandFoundation'

export const HOME_HERO = {
  eyebrow: 'Cash Prophet',
  /** What the product is — category line near the top of the hero. */
  category: 'Simple money management for small businesses',
  /** Slogan under the brand. */
  tagline: BRAND_SLOGAN,
  headline:
    'Stop carrying your business finances around in your head. Let Cash Prophet keep them organised.',
  headlineStart: 'Stop carrying your business finances around in your head.',
  headlineHighlight: 'Let Cash Prophet keep them organised.',
  lead:
    'Keep track of your regular bills, account for costs as they build up, and work out what to put aside for the bigger expenses ahead. Cash Prophet brings it all together so you can see where your business really stands and stay in control.',
  earlyAccessBadge: 'Early access',
  earlyAccessLine: 'Join our first group of businesses using Cash Prophet.',
  withoutLabel: 'Without Cash Prophet',
  withLabel: 'With Cash Prophet',
  subheading: [
    "Your bank balance only shows what's in the account. It doesn't show regular costs already building, or larger bills still ahead.",
    'Cash Prophet automatically accounts for those commitments as they build and helps you prepare for bigger future costs, so you get a daily financial position you can trust.',
  ],
  sizzle: 'Less guessing. More confidence.',
  /** Full product trial (account). */
  primaryCta: 'Start Free',
  /** Interactive tool — no account; wording must not echo “Start Free”. */
  tryItCta: 'Try the free snapshot',
  secondaryCta: 'See How It Works',
  graphs: {
    bank: {
      tag: 'Bank balance',
      title: 'Looks fine until the payments hit.',
      caption: 'Your bank balance only changes when money moves.',
    },
    prophet: {
      tag: 'Cash Prophet',
      title: 'Your commitments are already accounted for.',
      caption:
        'Important costs are kept in view day by day, so you see where the business really stands.',
    },
  },
} as const

/** Recognition + solution: bank balance vs Cash Prophet doing the work */
export const HOME_BANK_TO_PROPHET = {
  heading: "Your bank balance only shows what's in the account",
  lead: "Cash Prophet accounts for what's already building and what's still ahead.",
  body: [
    'Payroll, VAT, rent and the rest are spoken for long before the money leaves — but the bank does not show that until it is too late.',
    'Regular costs build into today’s position. Larger bills are provisioned steadily. Expected income is reflected where it belongs — so you get a daily number you can trust without running the maths in your head.',
  ],
} as const

/** @deprecated Use HOME_BANK_TO_PROPHET — kept for any deep links / tests */
export const HOME_NEED = HOME_BANK_TO_PROPHET

/** @deprecated Use HOME_BANK_TO_PROPHET */
export const HOME_DOES = {
  heading: HOME_BANK_TO_PROPHET.lead,
  body: [HOME_BANK_TO_PROPHET.body[1]!],
} as const

/** Outcome: confidence from a balance you can trust */
export const HOME_OUTCOME = {
  heading: 'The result is confidence',
  beats: [
    'You know your commitments are already being accounted for.',
    "You know future costs are already building into today's position.",
    "You know the balance you're looking at reflects what your business can realistically afford.",
  ],
  closing:
    'Less second-guessing, fewer surprises, and better decisions. Less time worrying about cash, and more time running the business.',
} as const

/** Positioning beside accounting and banking */
export const HOME_WHY_IT_WORKS = {
  heading: 'Why Cash Prophet is different',
  close:
    'By continuously accounting for your financial commitments, it gives you a clearer picture of what your business can safely afford right now. That’s the number you rely on instead of your bank balance.',
} as const

/** Homepage product snapshot band: monitor image until the walkthrough video is ready. */
export const HOME_VIDEO = {
  heading: 'One simple dashboard that keeps you on track',
  lead: 'Everything you need to know about where your business stands, without the mental maths.',
  placeholderHint:
    'Try a live demo or start free while the short walkthrough video is in production.',
} as const

export const HOME_CTA = {
  heading: 'Know where your business really stands',
  body: 'Start a free trial, run a free cash check with no account, or book free personal onboarding.',
} as const

export const HOME_ONBOARDING = {
  heading: 'Free personal onboarding',
  body: 'If you would like to book in for a free 30 to 60 minute personal onboarding session, please get in touch. We help you get balances, commitments and reserves in place, and you have a real person to ask when something is unclear.',
  cta: 'Enquire / book onboarding',
} as const
