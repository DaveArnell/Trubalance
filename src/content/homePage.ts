/**
 * Homepage marketing copy — Early Access, hospitality & leisure organiser positioning.
 */

export const HOME_HERO = {
  eyebrow: 'For independent hospitality & leisure businesses',
  headlineStart: 'Stop carrying your business finances around in your head.',
  headlineHighlight: 'Let Cash Prophet keep your financial picture organised.',
  lead:
    "Cash Prophet is a financial organiser that keeps track of what's coming up, what you need to put aside, where your business stands and where it's heading.",
  primaryCta: 'Join Early Access',
  primaryCtaSupport: 'Personal setup included',
  tryItCta: 'Try the free Snapshot',
} as const

export const HOME_PICTURE = {
  heading: "Know what's coming. Know where you stand.",
  lead:
    'Cash Prophet brings together the things you need to keep on top of, giving you a clearer financial picture whenever you want it.',
  tabs: [
    {
      id: 'bills',
      label: 'Bills coming up',
      heading: 'Keep ahead of the bills coming up',
      body:
        "See what's due, when it's due and roughly how much it will be. Regular costs such as wages, rent and utilities build into your financial picture as they accrue, rather than suddenly appearing when they're paid.",
    },
    {
      id: 'bigger',
      label: 'Bigger costs',
      heading: 'Be ready for the bigger costs ahead',
      body:
        "VAT, corporation tax, insurance, annual renewals and other larger costs shouldn't come as a surprise. The Reserve Planner works out what you should be putting aside so the money is there when you need it.",
    },
    {
      id: 'stand',
      label: 'Where you stand',
      heading: 'See the underlying position of your business',
      body:
        "Cash Prophet accounts for the obligations building up and the money you've planned for future costs, giving you a more consistent benchmark than the number sitting in your bank account.\n\nYour Cash Prophet Balance gives you a number you can quickly check to understand where the business stands.",
    },
    {
      id: 'heading',
      label: "Where you're heading",
      heading: 'See whether your position is improving',
      body:
        'Track your Cash Prophet Balance over time to see how your underlying position is changing, without the normal timing of bills and payments making the bank balance harder to interpret.\n\nSee how today compares with previous weeks and months, and whether the underlying position is getting stronger or weaker.',
    },
  ],
} as const

export const HOME_FITS = {
  heading: 'Built for running the business, not doing the books.',
  intro:
    "Your accounting software and accountant have an important job. Cash Prophet isn't trying to replace either of them.\n\nIt's there for the questions you want to answer yourself, without running reports, piecing things together or waiting to speak to someone.",
  columns: [
    {
      tag: 'Your accounting',
      body: 'Keeps the financial records of your business.',
    },
    {
      tag: 'Your accountant',
      body: 'Helps with accounts, tax and professional advice.',
    },
    {
      tag: 'Cash Prophet',
      body: 'Keeps the financial picture you need as an owner organised and easy to check.',
      accent: true,
    },
  ],
  payoffHeading: 'Less to carry around in your head.',
  payoffBody:
    "A quick check of Cash Prophet can show you what's coming up, whether you're prepared for it, where the business stands and how that position is changing.",
  payoffClose:
    'Everything accounted for. A clearer picture. More control over the day-to-day finances of your business.',
} as const

export const HOME_CHECKIN = {
  heading: 'Keep it current with a quick check-in.',
  lead:
    'Once Cash Prophet is set up around your business, keeping your financial picture current is simple. Check in daily, every few days or weekly, depending on how closely you want to follow things.',
  steps: [
    'Update your balances',
    "Tick off what's been paid",
    'Add anything new',
    'See your current position',
  ],
  support: 'For a straightforward business, it can take just a few minutes.',
} as const

export const HOME_EARLY_ACCESS = {
  heading: 'Join Cash Prophet Early Access',
  body:
    "We're opening Cash Prophet to our first group of independent hospitality and leisure businesses.\n\nThe best way to get started is with us. We'll show you how Cash Prophet works, help you get your financial picture set up properly and answer your questions as we go.",
  primaryCta: 'Get personally set up',
  primarySupport: 'Free personal setup during Early Access',
  secondaryPrompt: 'Prefer to get started yourself?',
  secondaryCta: 'Set up my account',
} as const

/** @deprecated Kept for deep links / older imports */
export const HOME_BANK_TO_PROPHET = {
  heading: "Your bank balance only shows what's in the account",
  lead: "Cash Prophet accounts for what's already building and what's still ahead.",
  body: [] as const,
} as const

/** @deprecated */
export const HOME_NEED = HOME_BANK_TO_PROPHET

/** @deprecated */
export const HOME_DOES = {
  heading: HOME_BANK_TO_PROPHET.lead,
  body: [] as const,
} as const

/** @deprecated */
export const HOME_OUTCOME = {
  heading: 'The result is confidence',
  beats: [] as const,
  closing: '',
} as const

/** @deprecated */
export const HOME_WHY_IT_WORKS = {
  heading: 'Why Cash Prophet is different',
  close: '',
} as const

/** @deprecated */
export const HOME_VIDEO = {
  heading: '',
  lead: '',
  placeholderHint: '',
} as const

/** @deprecated */
export const HOME_CTA = {
  heading: HOME_EARLY_ACCESS.heading,
  body: HOME_EARLY_ACCESS.body,
} as const

/** @deprecated */
export const HOME_ONBOARDING = {
  heading: 'Free personal setup',
  body: HOME_EARLY_ACCESS.body,
  cta: HOME_EARLY_ACCESS.primaryCta,
} as const
