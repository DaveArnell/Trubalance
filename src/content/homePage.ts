/**
 * Homepage marketing copy.
 * Problem first: messy business money. Then organisation, then one Cash Prophet Balance.
 */

import { BRAND_SLOGAN } from './brandFoundation'
import { TRIAL_DAYS } from '../config/subscriptionTiers'

export const HOME_HERO = {
  slogan: BRAND_SLOGAN,
  headlineStart: 'Your business finances are messy enough.',
  headlineHighlight: 'Cash Prophet keeps them organised.',
  lead: "Know what's already spoken for, stay ahead of regular and larger bills, and see what your business can actually afford today.",
  beats: [
    'No mental maths.',
    'No trying to remember what the bank balance needs to cover.',
    'No nasty surprises from costs you knew were coming.',
  ],
  primaryCta: 'Try the free Snapshot',
  secondaryCta: `Start ${TRIAL_DAYS} days free`,
  noCard: 'No card required.',
  onboarding: 'Free personal onboarding',
} as const

export const HOME_MESSY = {
  heading: 'Keeping it all in your head gets messy.',
  lead: "Your bank balance is easy to see. What's harder is remembering everything it already needs to cover.",
} as const

export const HOME_ORDER = {
  heading: 'Cash Prophet puts it all in order.',
  lead: 'Cash Prophet keeps your regular costs, larger future bills and reserves organised in one place, then turns them into a daily balance you can actually use.',
} as const

export const HOME_EXPLAIN = {
  heading: 'Your business budget, kept up to date every day.',
  lead: 'Cash Prophet continuously accounts for the regular costs building up behind your bank balance and helps you provision for larger future bills.',
  body: 'That gives you a Cash Prophet Balance: a clearer indication of what your business can actually afford after the things already spoken for have been accounted for.',
  layers: [
    {
      title: 'Regular costs',
      body: 'Account for costs such as rent, payroll, utilities and finance as they build through their payment cycle.',
    },
    {
      title: 'Reserve Planner',
      body: 'Gradually provide for VAT, insurance, equipment, tax and other larger future costs.',
    },
    {
      title: 'Cash Prophet Balance',
      body: 'Bring it together into one daily number that gives the owner a clearer position to work from.',
    },
    {
      title: 'Balance trend',
      body: 'Track that number over time to see whether the underlying financial position of the business is strengthening or weakening.',
    },
  ],
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

export const HOME_BENEFITS = {
  heading: 'What changes when the clutter is organised',
  items: [
    "Know what's already spoken for.",
    'Stop mentally subtracting bills from your bank balance.',
    'Stay ahead of recurring costs.',
    'Build money gradually towards larger bills.',
    'See what the business can actually afford today.',
    'See whether your underlying position is improving.',
    'Reduce financial surprises.',
    'Keep the budgeting habit running quietly in the background.',
  ],
} as const

export const HOME_WHO = {
  heading: 'Who it is for',
  lead: 'Cash Prophet is for owner-managed businesses where money regularly comes in, regular operating costs build through the month, and larger periodic bills need planning for. It is a clearer daily view, without a complicated finance system.',
  examplesLabel: 'Typical examples',
  examples: [
    'Cafés and coffee shops',
    'Hospitality',
    'Retail',
    'Leisure businesses',
    'Salons',
    'Clinics',
    'Small premises-based businesses',
    'Other owner-managed businesses with regular operating costs',
  ],
  cafeNote: 'If you run a café or coffee shop, there is a page written for that.',
  more: 'See who it is for',
} as const

export const HOME_SITS = {
  heading: 'Where Cash Prophet sits',
  slogan: BRAND_SLOGAN,
  lead: 'It is a practical day-to-day financial management and budgeting layer for the business owner. It sits alongside accounting and bookkeeping. It does not replace them.',
  not: [
    { title: 'Not accounting software', body: 'It does not replace your accounts package.' },
    { title: 'Not bookkeeping software', body: 'It does not replace your bookkeeper.' },
    { title: 'Not a replacement for an accountant', body: 'It sits alongside the professional you already use.' },
    { title: 'Not tax or financial advice', body: 'It is a planning tool for the owner, not regulated advice.' },
  ],
} as const

export const HOME_CTA = {
  heading: 'Stop trying to work it all out from the bank balance.',
  body: "Let Cash Prophet keep what's spoken for, what's coming and what you're putting aside organised for you.",
  footnote: `${TRIAL_DAYS} days free. No card required. Personal onboarding available.`,
  primary: 'Try the free Snapshot',
  secondary: `Start ${TRIAL_DAYS} days free`,
  onboarding: 'Personal onboarding',
} as const
