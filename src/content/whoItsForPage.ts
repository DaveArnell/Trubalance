/**
 * Who It's For page — audience recognition for hospitality & leisure owner-managed businesses.
 */

import { WHO_FOR_RELATED_GUIDES } from './trueBalanceMethod'

export const WHO_FOR_HERO = {
  heading: 'Who Cash Prophet is for',
  lead:
    'Built for independent business owners who are still keeping too much of the financial picture in their head.',
  support:
    'Cash Prophet keeps your regular bills, growing commitments and bigger future costs organised, so you can quickly see where the business stands without working it all out yourself.',
} as const

export const WHO_FOR_FAMILIAR = {
  heading: 'Does this sound familiar?',
  lead:
    'Cash Prophet is particularly useful if questions like these are still being answered from a mixture of your bank account, spreadsheets, calendars and memory.',
  questions: [
    'What bills have I got coming up?',
    'How much is already building up before those bills are paid?',
    'Am I putting enough aside for VAT, tax and the bigger costs ahead?',
    'Where does the business actually stand today?',
    'Is that underlying position getting better or worse?',
  ],
  close:
    'If you regularly find yourself working these things out in your head, Cash Prophet gives you one place to keep the picture organised.',
} as const

export const WHO_FOR_OWNER_MANAGED = {
  heading: 'Built around owner-managed businesses',
  lead:
    'Cash Prophet works particularly well when you are close enough to the finances to be checking the bank, paying bills and making day-to-day decisions yourself.',
  traits: [
    'You have regular overheads such as wages, rent, utilities and subscriptions.',
    'You have larger costs such as VAT, corporation tax, insurance or equipment that need preparing for.',
    'You want to know what is coming up without keeping it all in your head.',
    'You want a clearer view of where the business stands between payment dates.',
    'You want to see whether the underlying position is improving or weakening over time.',
    'You do not have a finance team producing management information for you every day.',
  ],
  qualification:
    'Cash Prophet is a day-to-day financial organiser, not detailed cash-flow forecasting. Businesses built around highly irregular projects or occasional large contracts may need forecasting tools alongside or instead of Cash Prophet.',
} as const

export const WHO_FOR_SECTOR = {
  heading: 'Made with hospitality and leisure businesses in mind',
  lead: [
    'Cash Prophet was created from first-hand experience of running a hospitality and leisure business, where money is moving constantly while wages, rent, utilities, tax and other commitments are building in the background.',
    'That makes it particularly relevant to independent hospitality and leisure businesses where the owner wants a simple way to stay close to the financial picture without turning it into another accounting job.',
  ],
  examples: [
    {
      label: 'Cafés',
      to: '/cafe-financial-management-software',
    },
    {
      label: 'Restaurants',
      to: '/restaurant-financial-management-software',
    },
    {
      label: 'Pubs & bars',
      to: '/pub-financial-management-software',
    },
    {
      label: 'Soft play & leisure',
      to: '/soft-play-financial-management-software',
    },
    {
      label: 'Gyms & studios',
      to: null,
    },
    {
      label: 'Independent attractions',
      to: null,
    },
  ],
  note: 'The fit is ultimately about how you run the business, not simply the sector you are in.',
} as const

export const WHO_FOR_GUIDES = {
  heading: 'Explore it in businesses like yours',
  lead: 'See how the same financial challenges show up across hospitality, leisure and other owner-managed businesses.',
  items: WHO_FOR_RELATED_GUIDES,
} as const

export const WHO_FOR_EARLY_ACCESS = {
  heading: 'Join Cash Prophet Early Access',
  body:
    'Cash Prophet is now open to our first group of independent hospitality and leisure businesses. We can help you get everything set up around your business so you start with a useful financial picture from the beginning.',
  primaryCta: 'Get personally set up',
  primarySupport: 'Free personal setup during Early Access',
  secondaryPrompt: 'Prefer to get started yourself?',
  secondaryCta: 'Set up my account',
} as const
