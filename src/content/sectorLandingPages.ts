/**
 * Sector landing pages — homepage-style SEO landings for hospitality & leisure niches.
 * Copy follows Brand & Product Foundation; titles lean into “financial management software”.
 */

import { CASH_PROPHET_BALANCE } from './brandFoundation'
import type { FaqItem } from './marketingFaqs'
import {
  CAFE_SECTOR_FAQS,
  PUB_SECTOR_FAQS,
  RESTAURANT_SECTOR_FAQS,
  SOFT_PLAY_SECTOR_FAQS,
} from './marketingFaqs'
import type { RouteSeo } from './marketingSeo'
import {
  CAFE_SECTOR_SEO,
  PUB_SECTOR_SEO,
  RESTAURANT_SECTOR_SEO,
  SOFT_PLAY_SECTOR_SEO,
} from './marketingSeo'

export type SectorId = 'cafe' | 'pub' | 'restaurant' | 'soft-play'

export type SectorPictureTab = {
  id: 'bills' | 'bigger' | 'stand' | 'heading'
  label: string
  heading: string
  body: string
}

export type SectorLandingContent = {
  id: SectorId
  path: string
  seo: RouteSeo
  hero: {
    eyebrow: string
    headlineStart: string
    headlineHighlight: string
    lead: string
    primaryCta: string
    primaryCtaSupport: string
    tryItCta: string
  }
  problem: {
    heading: string
    lead: string
    points: string[]
    close: string
  }
  picture: {
    heading: string
    lead: string
    tabs: SectorPictureTab[]
  }
  reserve: {
    heading: string
    lead: string[]
    points: string[]
  }
  fits: {
    heading: string
    intro: string
    columns: ReadonlyArray<{ tag: string; body: string; accent?: boolean }>
    payoffHeading: string
    payoffBody: string
    payoffClose: string
  }
  checkin: {
    heading: string
    lead: string
    steps: readonly string[]
    support: string
  }
  earlyAccess: {
    heading: string
    body: string
    primaryCta: string
    primarySupport: string
    secondaryPrompt: string
    secondaryCta: string
  }
  faqs: FaqItem[]
  breadcrumbName: string
}

const sharedFits = {
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

const sharedCheckin = {
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

const sharedEarlyAccess = {
  heading: 'Join Cash Prophet Early Access',
  body:
    "We're opening Cash Prophet to our first group of independent hospitality and leisure businesses.\n\nThe best way to get started is with us. We'll show you how Cash Prophet works, help you get your financial picture set up properly and answer your questions as we go.",
  primaryCta: 'Get personally set up',
  primarySupport: 'Free personal setup during Early Access',
  secondaryPrompt: 'Prefer to get started yourself?',
  secondaryCta: 'Set up my account',
} as const

export const CAFE_LANDING: SectorLandingContent = {
  id: 'cafe',
  path: '/cafe-financial-management-software',
  seo: CAFE_SECTOR_SEO,
  breadcrumbName: 'Café financial management',
  hero: {
    eyebrow: 'Financial management software for independent cafés',
    headlineStart: 'Stop carrying the café finances around in your head.',
    headlineHighlight: 'Let Cash Prophet keep the picture organised.',
    lead:
      'Cash Prophet is financial management software that keeps track of what’s coming up, what you need to put aside, where your café stands and where it’s heading, without turning day-to-day running into another accounting job.',
    primaryCta: 'Join Early Access',
    primaryCtaSupport: 'Personal setup included',
    tryItCta: 'Try the free Snapshot',
  },
  problem: {
    heading: 'Still keeping too much of the café picture in your head?',
    lead:
      'Most café owners already know what’s roughly coming up. The hard part is keeping wages, rent, suppliers, VAT and the bigger costs organised in one place you can trust, instead of piecing it together from the bank balance and memory.',
    points: [
      'What bills have we got coming up, and how much is already building?',
      'Are we putting enough aside for VAT, insurance and the larger costs ahead?',
      'Where does the café actually stand today, beyond what’s in the account?',
      'Is that underlying position getting stronger or weaker over time?',
    ],
    close:
      'If you regularly find yourself working these things out yourself, Cash Prophet gives you one place to keep the café’s financial picture organised.',
  },
  picture: {
    heading: 'Your café’s financial picture, organised.',
    lead:
      'Cash Prophet brings together the things you need to keep on top of, so you can quickly understand where the café stands and what needs your attention.',
    tabs: [
      {
        id: 'bills',
        label: 'Bills coming up',
        heading: 'Keep ahead of wages, rent and suppliers',
        body:
          'See what’s due, when it’s due and roughly how much it will be. Regular café costs such as wages, rent, utilities and supplier payments build into your financial picture as they accrue, rather than suddenly appearing when they’re paid.',
      },
      {
        id: 'bigger',
        label: 'Bigger costs',
        heading: 'Be ready for VAT and renewals',
        body:
          'VAT, insurance, equipment and other larger costs shouldn’t come as a surprise. The Reserve Planner works out what you should be putting aside so the money is there when you need it.',
      },
      {
        id: 'stand',
        label: 'Where you stand',
        heading: 'See the underlying position of the café',
        body:
          `Cash Prophet accounts for the obligations building up and the money you’ve planned for future costs, giving you a more consistent benchmark than the number sitting in your bank account.\n\nYour ${CASH_PROPHET_BALANCE} gives you a number you can quickly check to understand where the business stands.`,
      },
      {
        id: 'heading',
        label: "Where you're heading",
        heading: 'See whether your position is improving',
        body:
          `Track your ${CASH_PROPHET_BALANCE} over time to see how your underlying position is changing, without the normal timing of bills and payments making the bank balance harder to interpret.\n\nSee how today compares with previous weeks and months, and whether the underlying position is getting stronger or weaker.`,
      },
    ],
  },
  reserve: {
    heading: 'Reserve Planner for café VAT, rent and insurance',
    lead: [
      'Larger café costs rarely arrive monthly. VAT quarters, insurance renewals and rent can wipe a healthy-looking current account if you have not been putting money aside.',
      'The Reserve Planner turns those bills into a clear monthly set-aside and shows the planned reserve balance after each due date.',
    ],
    points: [
      'See annual and monthly totals for VAT, rent and other irregular costs.',
      'Know what the reserve should hold after each bill lands.',
      'Transfer what you choose. The plan stays honest either way.',
    ],
  },
  fits: { ...sharedFits },
  checkin: { ...sharedCheckin },
  earlyAccess: { ...sharedEarlyAccess },
  faqs: CAFE_SECTOR_FAQS,
}

export const PUB_LANDING: SectorLandingContent = {
  id: 'pub',
  path: '/pub-financial-management-software',
  seo: PUB_SECTOR_SEO,
  breadcrumbName: 'Pub financial management',
  hero: {
    eyebrow: 'Financial management software for independent pubs & bars',
    headlineStart: 'Stop carrying the pub finances around in your head.',
    headlineHighlight: 'Let Cash Prophet keep the picture organised.',
    lead:
      'Cash Prophet is financial management software that keeps track of what’s coming up, what you need to put aside, where your pub stands and where it’s heading, without turning day-to-day running into another accounting job.',
    primaryCta: 'Join Early Access',
    primaryCtaSupport: 'Personal setup included',
    tryItCta: 'Try the free Snapshot',
  },
  problem: {
    heading: 'Still keeping too much of the pub picture in your head?',
    lead:
      'Wages, stock, rent, VAT and the larger costs ahead are usually known in outline. What wears people down is keeping that picture organised, instead of judging the pub from the bank balance and whatever you can remember.',
    points: [
      'What bills have we got coming up, and how much is already building?',
      'Are we putting enough aside for VAT, insurance and the larger costs ahead?',
      'Where does the pub actually stand today, beyond what’s in the account?',
      'Is that underlying position getting stronger or weaker over time?',
    ],
    close:
      'If you regularly find yourself working these things out yourself, Cash Prophet gives you one place to keep the pub’s financial picture organised.',
  },
  picture: {
    heading: 'Your pub’s financial picture, organised.',
    lead:
      'Cash Prophet brings together the things you need to keep on top of, so you can quickly understand where the pub stands and what needs your attention.',
    tabs: [
      {
        id: 'bills',
        label: 'Bills coming up',
        heading: 'Keep ahead of wages, rent and stock',
        body:
          'See what’s due, when it’s due and roughly how much it will be. Regular pub costs such as wages, rent, utilities and supplier payments build into your financial picture as they accrue, rather than suddenly appearing when they’re paid.',
      },
      {
        id: 'bigger',
        label: 'Bigger costs',
        heading: 'Be ready for VAT and insurance',
        body:
          'VAT, building insurance, licence renewals and other larger costs shouldn’t come as a surprise. The Reserve Planner works out what you should be putting aside so the money is there when you need it.',
      },
      {
        id: 'stand',
        label: 'Where you stand',
        heading: 'See the underlying position of the pub',
        body:
          `Cash Prophet accounts for the obligations building up and the money you’ve planned for future costs, giving you a more consistent benchmark than the number sitting in your bank account.\n\nYour ${CASH_PROPHET_BALANCE} gives you a number you can quickly check to understand where the business stands.`,
      },
      {
        id: 'heading',
        label: "Where you're heading",
        heading: 'See whether your position is improving',
        body:
          `Track your ${CASH_PROPHET_BALANCE} over time to see how your underlying position is changing, without the normal timing of bills and payments making the bank balance harder to interpret.\n\nSee how today compares with previous weeks and months, and whether the underlying position is getting stronger or weaker.`,
      },
    ],
  },
  reserve: {
    heading: 'Reserve Planner for pub VAT, rent and insurance',
    lead: [
      'Pub bills such as VAT, rent and insurance rarely line up neatly with week-to-week takings. Without a plan, a healthy-looking current account can disappear when those costs land.',
      'The Reserve Planner turns larger costs into a clear monthly set-aside and shows the planned reserve balance after each due date.',
    ],
    points: [
      'Map VAT quarters, rent and insurance on one plan.',
      'See the reserve balance after each bill is due.',
      'Confirm transfers when you choose. The plan stays visible either way.',
    ],
  },
  fits: { ...sharedFits },
  checkin: { ...sharedCheckin },
  earlyAccess: { ...sharedEarlyAccess },
  faqs: PUB_SECTOR_FAQS,
}

export const RESTAURANT_LANDING: SectorLandingContent = {
  id: 'restaurant',
  path: '/restaurant-financial-management-software',
  seo: RESTAURANT_SECTOR_SEO,
  breadcrumbName: 'Restaurant financial management',
  hero: {
    eyebrow: 'Financial management software for independent restaurants',
    headlineStart: 'Stop carrying the restaurant finances around in your head.',
    headlineHighlight: 'Let Cash Prophet keep the picture organised.',
    lead:
      'Cash Prophet is financial management software that keeps track of what’s coming up, what you need to put aside, where your restaurant stands and where it’s heading, without turning day-to-day running into another accounting job.',
    primaryCta: 'Join Early Access',
    primaryCtaSupport: 'Personal setup included',
    tryItCta: 'Try the free Snapshot',
  },
  problem: {
    heading: 'Still keeping too much of the restaurant picture in your head?',
    lead:
      'Kitchen and front-of-house wages, rent, suppliers and VAT are part of running the place. The hard part is keeping them organised so you can see where the restaurant stands, without reconstructing it from the bank balance each time.',
    points: [
      'What bills have we got coming up, and how much is already building?',
      'Are we putting enough aside for VAT, insurance and the larger costs ahead?',
      'Where does the restaurant actually stand today, beyond what’s in the account?',
      'Is that underlying position getting stronger or weaker over time?',
    ],
    close:
      'If you regularly find yourself working these things out yourself, Cash Prophet gives you one place to keep the restaurant’s financial picture organised.',
  },
  picture: {
    heading: 'Your restaurant’s financial picture, organised.',
    lead:
      'Cash Prophet brings together the things you need to keep on top of, so you can quickly understand where the restaurant stands and what needs your attention.',
    tabs: [
      {
        id: 'bills',
        label: 'Bills coming up',
        heading: 'Keep ahead of wages, rent and suppliers',
        body:
          'See what’s due, when it’s due and roughly how much it will be. Regular restaurant costs such as kitchen and front-of-house wages, rent, utilities and suppliers build into your financial picture as they accrue, rather than suddenly appearing when they’re paid.',
      },
      {
        id: 'bigger',
        label: 'Bigger costs',
        heading: 'Be ready for VAT and renewals',
        body:
          'VAT, insurance, equipment and other larger costs shouldn’t come as a surprise. The Reserve Planner works out what you should be putting aside so the money is there when you need it.',
      },
      {
        id: 'stand',
        label: 'Where you stand',
        heading: 'See the underlying position of the restaurant',
        body:
          `Cash Prophet accounts for the obligations building up and the money you’ve planned for future costs, giving you a more consistent benchmark than the number sitting in your bank account.\n\nYour ${CASH_PROPHET_BALANCE} gives you a number you can quickly check to understand where the business stands.`,
      },
      {
        id: 'heading',
        label: "Where you're heading",
        heading: 'See whether your position is improving',
        body:
          `Track your ${CASH_PROPHET_BALANCE} over time to see how your underlying position is changing, without the normal timing of bills and payments making the bank balance harder to interpret.\n\nSee how today compares with previous weeks and months, and whether the underlying position is getting stronger or weaker.`,
      },
    ],
  },
  reserve: {
    heading: 'Reserve Planner for restaurant VAT, rent and insurance',
    lead: [
      'Restaurant VAT, rent and insurance rarely arrive in neat monthly amounts. Without a reserve plan, a strong-looking current account can disappear when those costs land.',
      'The Reserve Planner turns larger costs into a clear monthly set-aside and shows the planned reserve balance after each due date.',
    ],
    points: [
      'Plan VAT, rent and insurance on one reserve view.',
      'See what should remain after each bill is due.',
      'Move money when you choose. The target stays visible.',
    ],
  },
  fits: { ...sharedFits },
  checkin: { ...sharedCheckin },
  earlyAccess: { ...sharedEarlyAccess },
  faqs: RESTAURANT_SECTOR_FAQS,
}

export const SOFT_PLAY_LANDING: SectorLandingContent = {
  id: 'soft-play',
  path: '/soft-play-financial-management-software',
  seo: SOFT_PLAY_SECTOR_SEO,
  breadcrumbName: 'Soft play financial management',
  hero: {
    eyebrow: 'Financial management software for soft play & leisure venues',
    headlineStart: 'Stop carrying the venue finances around in your head.',
    headlineHighlight: 'Let Cash Prophet keep the picture organised.',
    lead:
      'Cash Prophet is financial management software that keeps track of what’s coming up, what you need to put aside, where your venue stands and where it’s heading, without turning day-to-day running into another accounting job.',
    primaryCta: 'Join Early Access',
    primaryCtaSupport: 'Personal setup included',
    tryItCta: 'Try the free Snapshot',
  },
  problem: {
    heading: 'Still keeping too much of the venue picture in your head?',
    lead:
      'Staffing costs, rent, insurance and VAT are part of running a soft play. The hard part is keeping that picture organised week to week, instead of judging the venue from the bank balance alone.',
    points: [
      'What bills have we got coming up, and how much is already building?',
      'Are we putting enough aside for VAT, insurance and the larger costs ahead?',
      'Where does the venue actually stand today, beyond what’s in the account?',
      'Is that underlying position getting stronger or weaker over time?',
    ],
    close:
      'If you regularly find yourself working these things out yourself, Cash Prophet gives you one place to keep the venue’s financial picture organised.',
  },
  picture: {
    heading: 'Your venue’s financial picture, organised.',
    lead:
      'Cash Prophet brings together the things you need to keep on top of, so you can quickly understand where the soft play stands and what needs your attention.',
    tabs: [
      {
        id: 'bills',
        label: 'Bills coming up',
        heading: 'Keep ahead of staffing costs, rent and utilities',
        body:
          'See what’s due, when it’s due and roughly how much it will be. Regular soft play costs such as staffing costs, rent, utilities and supplier payments build into your financial picture as they accrue, rather than suddenly appearing when they’re paid.',
      },
      {
        id: 'bigger',
        label: 'Bigger costs',
        heading: 'Be ready for VAT, insurance and renewals',
        body:
          'VAT, building and public liability insurance, equipment and other larger costs shouldn’t come as a surprise. The Reserve Planner works out what you should be putting aside so the money is there when you need it.',
      },
      {
        id: 'stand',
        label: 'Where you stand',
        heading: 'See the underlying position of the venue',
        body:
          `Cash Prophet accounts for the obligations building up and the money you’ve planned for future costs, giving you a more consistent benchmark than the number sitting in your bank account.\n\nYour ${CASH_PROPHET_BALANCE} gives you a number you can quickly check to understand where the business stands.`,
      },
      {
        id: 'heading',
        label: "Where you're heading",
        heading: 'See whether your position is improving',
        body:
          `Track your ${CASH_PROPHET_BALANCE} over time to see how your underlying position is changing, without the normal timing of bills and payments making the bank balance harder to interpret.\n\nSee how today compares with previous weeks and months, and whether the underlying position is getting stronger or weaker.`,
      },
    ],
  },
  reserve: {
    heading: 'Reserve Planner for soft play VAT, rent and insurance',
    lead: [
      'Soft play VAT, rent and insurance rarely line up neatly with week-to-week takings. Without a plan, a healthy-looking current account can disappear when those costs land.',
      'The Reserve Planner turns larger costs into a clear monthly set-aside and shows the planned reserve balance after each due date.',
    ],
    points: [
      'Map VAT, rent and insurance on one reserve plan.',
      'See the planned balance after each bill is due.',
      'Confirm transfers when you choose. The target stays visible.',
    ],
  },
  fits: { ...sharedFits },
  checkin: { ...sharedCheckin },
  earlyAccess: { ...sharedEarlyAccess },
  faqs: SOFT_PLAY_SECTOR_FAQS,
}

export const SECTOR_LANDINGS: Record<SectorId, SectorLandingContent> = {
  cafe: CAFE_LANDING,
  pub: PUB_LANDING,
  restaurant: RESTAURANT_LANDING,
  'soft-play': SOFT_PLAY_LANDING,
}

export const SECTOR_LANDING_LIST: SectorLandingContent[] = [
  CAFE_LANDING,
  PUB_LANDING,
  RESTAURANT_LANDING,
  SOFT_PLAY_LANDING,
]
