/**
 * Homepage marketing copy — Brand & Product Foundation.
 * Confidence is the product; Cash Prophet Balance is the trusted number.
 */

import { CASH_PROPHET_BALANCE, CORE_BELIEF, PHILOSOPHY_COUPLET } from './brandFoundation'

export const HOME_HERO = {
  eyebrow: 'Cash Prophet',
  tagline: CORE_BELIEF,
  headline: 'One trusted financial number.',
  headlineStart: 'One trusted',
  headlineHighlight: 'financial number.',
  subheading: [
    PHILOSOPHY_COUPLET.bank,
    `Cash Prophet continuously accounts for meaningful financial commitments and calculates your ${CASH_PROPHET_BALANCE} — so you can see where your business really stands, every day.`,
  ],
  sizzle: 'Confidence instead of guesswork.',
  primaryCta: 'Start Free',
  secondaryCta: 'See How It Works',
  graphs: {
    bank: {
      tag: 'Bank balance',
      title: 'Looks fine until the payments hit.',
      caption: 'Your bank balance only changes when money moves — timing creates noise.',
    },
    prophet: {
      tag: CASH_PROPHET_BALANCE,
      title: 'Commitments already accounted for.',
      caption: `Your ${CASH_PROPHET_BALANCE} reflects accrued commitments, so you see where the business really stands.`,
    },
  },
} as const

/** Recognition: bank balance vs where you really stand */
export const HOME_NEED = {
  heading: PHILOSOPHY_COUPLET.bank,
  lead: 'It does not reliably tell you where your business really stands.',
  body: [
    'Customer payments, VAT, payroll, supplier invoices and other commitments constantly distort the picture. The bank does not recognise those until money actually leaves the account.',
    'That is why so many owners never quite trust the number they are looking at — and carry the next few weeks of costs around in their heads before every decision.',
  ],
} as const

/** How Cash Prophet delivers the Cash Prophet Balance */
export const HOME_DOES = {
  heading: 'Cash Prophet does that work for you',
  body: [
    `Instead of expecting you to remember every future commitment yourself, Cash Prophet continuously accounts for meaningful financial commitments in the background. Regular costs build into today's position. Larger future costs are reserved for steadily. Expected income is reflected where appropriate.`,
    `Every day your ${CASH_PROPHET_BALANCE} is recalculated so you are not interpreting your bank balance alone — you have a trusted financial position that is already clearer.`,
  ],
} as const

/** Outcome: confidence */
export const HOME_OUTCOME = {
  heading: 'The result is confidence',
  beats: [
    'You know meaningful commitments are already being accounted for.',
    "You know future costs are already building into today's position.",
    `You know the ${CASH_PROPHET_BALANCE} reflects where your business really stands.`,
  ],
  closing:
    'Less second-guessing, fewer surprises, and better decisions. Less time worrying about money — more time running the business.',
} as const

/** Positioning beside accounting and banking */
export const HOME_WHY_IT_WORKS = {
  heading: 'Why Cash Prophet is different',
  close: `Cash Prophet complements your accounting software. It is not bookkeeping and not a replacement for detailed cash flow forecasting. By continuously accounting for meaningful commitments, your ${CASH_PROPHET_BALANCE} becomes the number you check every day instead of relying on an unreliable bank balance.`,
} as const

export const HOME_FOUNDER = {
  eyebrow: 'Why I built this',
  heading: "I built Cash Prophet because I realised I wasn't short of financial information",
  body: [
    'I was short of financial confidence.',
    'Like many business owners, I found myself checking the bank balance and then mentally accounting for payroll, VAT, tax, supplier payments and everything else I knew was coming before I could make even simple decisions.',
    'The information already existed. It just was not brought together in a practical way I could trust every day.',
    `Cash Prophet solves that. It continuously accounts for those commitments so I can stop carrying them in my head — and see where the business really stands.`,
  ],
} as const

export const HOME_CTA = {
  heading: CORE_BELIEF,
  body: `Start free and get your ${CASH_PROPHET_BALANCE} — one trusted financial number that shows where your business really stands.`,
} as const
