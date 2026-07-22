/**
 * Homepage marketing copy — one continuous conversation.
 * Scene → recognition → stress → relief → how → why → platform.
 */

import { METHOD_PAGE_PATH } from './trueBalanceMethod'

export const HOME_HERO = {
  eyebrow: 'Cash Prophet',
  headline: 'Stop carrying your business finances around in your head.',
  headlineStart: 'Stop carrying your business finances',
  headlineHighlight: 'around in your head.',
  subheading:
    "You already know what's coming. You shouldn't have to keep subtracting it every time you open the bank.",
} as const

/** Scene: recreate the experience, don't explain it */
export const HOME_PROBLEM = {
  heading: 'Sound familiar?',
  paragraphs: [
    'You check your bank balance.',
    'It looks healthy enough.',
    'Then the mental checklist starts.',
    'Payroll.',
    'VAT.',
    'Rent.',
    'Insurance.',
    'Have I forgotten anything?',
    "That loop is the problem. Not the bank figure. The second screen you're running in your head.",
  ],
} as const

/** Shared recognition — normalise the bank-check loop before introducing Cash Prophet */
export const HOME_WHO_FOR = {
  heading: "You're not unusual for doing it",
  lead: "This is how most owner-managed businesses operate. You don't have a finance team watching every commitment in the background. So the bank app becomes the quick check, and your head does the rest.",
  points: [
    "You rely on your bank balance because it's the fastest thing to check",
    'You already know the big bills that are coming',
    'You subtract them in your head every time you look',
    "You'd rather spend time running the business than bookkeeping",
    "You're not bad with money. You're carrying too much information in your head",
  ],
} as const

/** Why that loop creates stress */
export const HOME_STRESS = {
  eyebrow: 'What that does to you',
  heading: 'Which is why opening the bank never feels settled',
  lead: "The number on the screen is only half the story. Your head is doing the rest.",
  points: [
    {
      title: 'Cash today',
      body: "The balance shows what's there right now. Not what's already spoken for.",
    },
    {
      title: 'Bills in your head',
      body: 'So every glance turns into another calculation. Even when nothing has changed.',
    },
    {
      title: 'The doubt stays',
      body: "Can I afford this? Will VAT catch me again? The figure looks fine. You're still not sure.",
    },
  ],
} as const

/** Relief: introduce Cash Prophet as the answer to that loop */
export const HOME_RELIEF = {
  eyebrow: 'What changes',
  heading: 'Cash Prophet takes that loop off you',
  lead: 'It keeps hold of the commitments you already know about. You look at one number. You know where you stand.',
  points: [
    {
      title: 'The checklist leaves your head',
      body: "Payroll, rent, VAT and the rest don't need replaying every time you open the bank.",
    },
    {
      title: 'You stop guessing',
      body: "You can see what's genuinely available. Not just what's sitting there.",
    },
    {
      title: 'Big bills lose their sting',
      body: "They don't arrive as shocks. You've been preparing without thinking about it all month.",
    },
  ],
} as const

/** How it works — after they care */
export const HOME_HOW_IT_WORKS_SYSTEM = {
  eyebrow: 'Under the hood',
  heading: 'Once the worry eases, this is what’s going on',
  lead: 'Two things replace the mental tracking. That’s it.',
  pillars: [
    {
      id: 'daily-clarity',
      title: 'Known costs build every day',
      lead: "They don't wait for payday.",
      body: 'Payroll, rent, subscriptions. They chip away day by day, so you can see what’s spoken for before the money leaves.',
    },
    {
      id: 'reserve-planning',
      title: 'Big irregular bills become monthly',
      lead: 'VAT and insurance stop feeling like ambushes.',
      body: 'They turn into a steady amount set aside over time. Planned. Not a panic on the due date.',
    },
  ],
} as const

/** Why it works beside existing tools */
export const HOME_WHY_IT_WORKS = {
  heading: 'It doesn’t replace what you already trust',
  lead: "Your accountant still does the accounts. Your bank still holds the money. Cash Prophet answers a different question.",
  items: [
    {
      title: 'Bookkeeping',
      body: 'Looks after the past. What happened. What was owed. What got paid.',
    },
    {
      title: 'Your bank balance',
      body: "Shows where money sits today. It can't tell you how much of it is already spoken for.",
    },
    {
      title: 'Cash Prophet',
      body: 'Holds the commitments you know about, and shows what’s left to work with.',
    },
  ],
} as const

/** Platform */
export const HOME_PLATFORM = {
  eyebrow: 'Keeping it going',
  headingStart: 'You don’t need a finance team ',
  headingHighlight: 'to stay on top of it.',
  lead: 'Cash Prophet is the system. The app is how you keep it honest without it becoming another job.',
  steps: [
    {
      title: 'Costs build through the month',
      body: "You see what's spoken for before payday. Not only when the payment goes out.",
    },
    {
      title: 'Big bills get a monthly rhythm',
      body: 'VAT, insurance, annual costs. A planned move into reserve. They stop catching you out.',
    },
    {
      title: 'One number for decisions',
      body: "Cash, minus what's committed, plus money you're still realistically owed. That's what you use day to day.",
    },
  ],
} as const

export const HOME_EXPLORE = [
  {
    title: 'Why Cash Prophet works',
    body: 'More on the problem, the relief, and what sits underneath.',
    to: METHOD_PAGE_PATH,
    cta: 'Read more',
  },
  {
    title: 'See it with a live business',
    body: 'Open a demo and feel what it’s like when that mental checklist isn’t yours.',
    to: '/see-how-it-works',
    cta: 'Try demo',
  },
  {
    title: 'Daily & monthly habits',
    body: 'A light check each day. A short reserve look each month.',
    to: '/habits',
    cta: 'See the habits',
  },
  {
    title: 'Pricing',
    body: 'Start free. Then pick the plan that matches how you’re set up.',
    to: '/pricing',
    cta: 'View pricing',
  },
] as const

export const HOME_FOUNDER = {
  eyebrow: 'Why I built this',
  heading: 'I’ve lived with that bank-check worry for years',
  body: "I've run businesses for over 17 years. Even with decent accounts, I'd still wake up asking the same things. Can I afford this? How much is already spoken for? Will VAT catch me again? Cash Prophet is what I wish I'd had sooner.",
} as const

export const HOME_CTA = {
  heading: 'Ready to put that checklist down?',
  body: 'Start free, or open a demo and see how it feels when opening the bank isn’t a test.',
} as const

/** @deprecated aliases */
export const HOME_WHAT_IT_DOES = HOME_RELIEF
export const HOME_BANK_GAP = HOME_STRESS
