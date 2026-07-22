/**
 * Homepage marketing copy — Cash Prophet as one continuous story.
 * Recognition → shared problem → stress → relief → how → why → platform.
 */

import { METHOD_PAGE_PATH } from './trueBalanceMethod'

export const HOME_HERO = {
  eyebrow: 'Cash Prophet',
  headline: 'Stop carrying your business finances around in your head.',
  headlineStart: 'Stop carrying your business finances',
  headlineHighlight: 'around in your head.',
  subheading:
    "You already know what's coming. You just shouldn't have to keep subtracting it every time you open the bank.",
} as const

/** The hidden problem */
export const HOME_PROBLEM = {
  heading: 'You already know what’s coming',
  lead: 'Payroll. Rent. VAT. Corporation tax. Insurance. Subscriptions. Quarterly bills. Annual renewals.',
  body: "You don't forget those bills. You carry them around in your head. Every time you look at your bank balance, you mentally subtract them.",
  close: "That's exhausting. And it's how a lot of owners run the business.",
} as const

/** You're not alone — recognition that others do this too */
export const HOME_WHO_FOR = {
  heading: "You're not the only one",
  lead: 'If this sounds familiar, you\'re in good company.',
  points: [
    'You check the bank to judge how the business is doing',
    "You don't enjoy bookkeeping",
    'You leave year-end to your accountant',
    'You want confidence without another complicated tool',
    'You have costs you can see coming a mile off',
  ],
} as const

/** Why the bank check creates stress */
export const HOME_STRESS = {
  eyebrow: 'Why it weighs on you',
  heading: 'That’s why looking at the bank feels stressful',
  lead: "The number on the screen isn't the full story. Your head is filling in the rest.",
  points: [
    {
      title: 'Today’s cash only',
      body: "Your bank balance shows what's there right now. It doesn't show what's already spoken for.",
    },
    {
      title: 'The rest lives in your head',
      body: 'Future bills stay mental. So every glance at the account becomes another calculation.',
    },
    {
      title: 'Uncertainty sticks around',
      body: "Even when the balance looks fine, you're still second-guessing. Can I afford this? Will VAT catch me out again?",
    },
  ],
} as const

/** Cash Prophet removes the burden — emotional relief before mechanics */
export const HOME_RELIEF = {
  eyebrow: 'The relief',
  heading: 'Cash Prophet takes that load off you',
  lead: "It keeps track of the commitments you already know about, so you can look at one number and feel sure.",
  points: [
    {
      title: 'Less mental maths',
      body: "Payroll, rent, VAT and the rest don't have to live in your head anymore.",
    },
    {
      title: 'More confidence',
      body: "You stop guessing from the bank app. You know what's genuinely available.",
    },
    {
      title: 'A calmer day-to-day',
      body: 'Big bills stop arriving as shocks. The worry eases because the picture stays honest.',
    },
  ],
} as const

/** How it works — only after the reader cares */
export const HOME_HOW_IT_WORKS_SYSTEM = {
  eyebrow: 'How it works',
  heading: 'Two habits that replace the mental tracking',
  lead: "Once the worry is off your shoulders, this is what Cash Prophet is doing in the background.",
  pillars: [
    {
      id: 'daily-clarity',
      title: 'Known costs build every day',
      lead: 'They don’t wait for payday.',
      body: 'Payroll, rent and subscriptions chip away at the picture day by day. So you can see what’s spoken for before the money leaves.',
    },
    {
      id: 'reserve-planning',
      title: 'Big irregular bills become monthly',
      lead: 'VAT and insurance stop feeling like ambushes.',
      body: 'Larger costs get turned into a steady monthly amount set aside over time. The hit is planned, not a surprise.',
    },
  ],
} as const

/** Why it works — different job from bookkeeping */
export const HOME_WHY_IT_WORKS = {
  heading: 'It sits beside what you already use',
  lead: "Cash Prophet isn't trying to replace your accountant or your bookkeeping. It answers a different question.",
  items: [
    {
      title: 'Bookkeeping',
      body: 'Looks after the past: what happened, what was owed, what got paid.',
    },
    {
      title: 'Your bank balance',
      body: "Shows where money sits today. It can't tell you how much of it is already spoken for.",
    },
    {
      title: 'Cash Prophet',
      body: 'Keeps the commitments you know about organised, and shows what’s left to work with.',
    },
  ],
} as const

/** Platform last */
export const HOME_PLATFORM = {
  eyebrow: 'The app',
  headingStart: 'Made to feel ',
  headingHighlight: 'light to use.',
  lead: "Cash Prophet is the system. The app is just how you keep it up to date without turning it into another job.",
  steps: [
    {
      title: 'Costs build through the month',
      body: "You see what's spoken for before payday, not only when the payment goes out.",
    },
    {
      title: 'Big bills get a monthly rhythm',
      body: 'VAT, insurance and annual costs become a planned move into reserve, so they stop catching you out.',
    },
    {
      title: 'One number for decisions',
      body: "Cash, minus what's committed, plus money you're realistically still owed. That's the figure you use day to day.",
    },
  ],
} as const

export const HOME_EXPLORE = [
  {
    title: 'Why Cash Prophet works',
    body: 'A deeper look at the problem, the relief, and what sits underneath.',
    to: METHOD_PAGE_PATH,
    cta: 'Read more',
  },
  {
    title: 'See it with a live business',
    body: 'Open a demo and feel what it’s like when the mental maths isn’t yours to carry.',
    to: '/see-how-it-works',
    cta: 'Try demo',
  },
  {
    title: 'Daily & monthly habits',
    body: 'A light check each day, and a short reserve review each month.',
    to: '/habits',
    cta: 'See the habits',
  },
  {
    title: 'Pricing',
    body: 'Start free, then pick the plan that matches how your business is set up.',
    to: '/pricing',
    cta: 'View pricing',
  },
] as const

export const HOME_FOUNDER = {
  eyebrow: 'Why this exists',
  heading: 'Built from years of living with the same worry',
  body: "I've run businesses for over 17 years. Even with decent accounts, I still woke up asking the same things: can I afford this, how much is already spoken for, will VAT catch me out again? Cash Prophet is what I wish I'd had sooner. The app just makes it easy to stick with.",
} as const

export const HOME_CTA = {
  heading: 'Ready to put the worry down?',
  body: 'Start free, or open a demo and see how it feels when the bank check stops being a test.',
} as const

/** @deprecated aliases for older imports */
export const HOME_WHAT_IT_DOES = HOME_RELIEF
export const HOME_BANK_GAP = HOME_STRESS
