/**
 * Homepage marketing copy. Confidence first; Cash Prophet Balance later.
 */

import { BRAND_SLOGAN } from './brandFoundation'

export const HOME_HERO = {
  eyebrow: 'Cash Prophet',
  /** Slogan under the brand. */
  tagline: BRAND_SLOGAN,
  headline: 'Finally understand where your business really stands.',
  headlineStart: 'Finally understand',
  headlineHighlight: 'where your business really stands.',
  subheading: [
    "Your bank balance only shows what's sitting in the account. It doesn't show money already spoken for: rent, wages, VAT and the rest.",
    'Cash Prophet continuously accounts for important financial commitments, giving you one trusted financial number that shows where your business really stands.',
  ],
  sizzle: 'Less guessing. More confidence.',
  primaryCta: 'Start Free',
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

export const HOME_FOUNDER = {
  eyebrow: 'Why I built this',
  heading: "I built Cash Prophet because I wasn't short of financial information",
  body: [
    'I was short of a number I could trust.',
    'Like many business owners, I checked the bank and then mentally accounted for payroll, VAT, tax and everything else before I could decide what we could actually afford.',
    'Cash Prophet keeps those commitments in view for me, so I can stop carrying them in my head and get on with the business.',
  ],
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
  body: 'Start free, or see how it works first.',
} as const
