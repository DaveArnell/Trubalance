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
  headline: 'Your daily finance dashboard. A position you can trust.',
  headlineStart: 'Your daily finance dashboard.',
  headlineHighlight: 'A position you can trust.',
  lead: "Know what's already spoken for, stay ahead of regular and larger bills, and see what your business can actually afford today.",
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

/** Recognition: bank balance vs what's already committed */
export const HOME_NEED = {
  heading: "Your bank balance tells you what's in the account",
  lead: "It doesn't tell you what's already committed.",
  body: [
    "Payroll, VAT, tax, rent, insurance and supplier payments are already spoken for, but the bank doesn't show that until the money leaves.",
    "That's why so many owners never quite trust the balance they're looking at. Before almost any decision, they run through everything that's coming in their head.",
  ],
} as const

/** How Cash Prophet does the mental accounting for you */
export const HOME_DOES = {
  heading: 'Cash Prophet does that work for you',
  body: [
    'Regular costs build into today’s position. Larger bills are provisioned for steadily instead of arriving as a surprise. Expected income is reflected where it belongs.',
    'That trusted number updates every day, so you can stop interpreting the bank balance and get on with running the business.',
  ],
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
