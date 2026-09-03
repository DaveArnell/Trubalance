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
    headlineStart: 'Busy till. Full head.',
    headlineHighlight: 'Cash Prophet organises the café finances you still carry around.',
    lead:
      'Cash Prophet is financial management software that keeps track of what’s coming up, what you need to put aside, where your café stands and where it’s heading, without turning day-to-day running into another accounting job.',
    primaryCta: 'Join Early Access',
    primaryCtaSupport: 'Personal setup included',
    tryItCta: 'Try the free Snapshot',
  },
  problem: {
    heading: 'What café owners are usually searching for',
    lead:
      'Searches for café finance software, cash management or “where do we really stand?” often come from the same place: the bank balance looks fine until wages, rent, suppliers and VAT all land.',
    points: [
      'Regular costs such as wages, rent, utilities and suppliers keep building before payday.',
      'Larger costs such as VAT and insurance need preparing for months ahead.',
      'The till can be busy while the underlying position is harder to see.',
      'Accounting software records what happened. It does not organise what you need to decide today.',
    ],
    close:
      'Cash Prophet sits beside your books as a financial organiser: one place for commitments, reserves and your Cash Prophet Balance.',
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
    headlineStart: 'Quiet midweeks. Busy weekends.',
    headlineHighlight: 'Cash Prophet keeps pub finances organised between the peaks.',
    lead:
      'Cash Prophet is financial management software that keeps track of wages, stock, rent, VAT and other commitments, so you can see where the pub stands without guessing from the bank balance alone.',
    primaryCta: 'Join Early Access',
    primaryCtaSupport: 'Personal setup included',
    tryItCta: 'Try the free Snapshot',
  },
  problem: {
    heading: 'What pub owners are usually searching for',
    lead:
      'Searches for pub cash flow or pub finance software often mean: the till is up and down, wages and stock are constant, and VAT still arrives whether the week was quiet or busy.',
    points: [
      'Staff wages and PAYE build through the week before payday.',
      'Rent, utilities and deliveries keep landing on a rhythm of their own.',
      'VAT and insurance need a reserve, not a scramble when the bill arrives.',
      'The bank balance answers “what’s in the account”, not “what’s already spoken for”.',
    ],
    close:
      'Cash Prophet is financial management software for the day-to-day picture: commitments building, reserves planned, and one Cash Prophet Balance you can check quickly.',
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
          `Track your ${CASH_PROPHET_BALANCE} over time to see how your underlying position is changing, without quiet midweeks and busy weekends making the bank balance harder to interpret.\n\nSee how today compares with previous weeks and months, and whether the underlying position is getting stronger or weaker.`,
      },
    ],
  },
  reserve: {
    heading: 'Reserve Planner for pub VAT, rent and insurance',
    lead: [
      'Pub bills such as VAT, rent and insurance rarely match the weekly rhythm of takings. Without a plan, a healthy-looking current account can disappear when those costs land.',
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
    headlineStart: 'Covers on. Bills building.',
    headlineHighlight: 'Cash Prophet organises the restaurant finances you still carry in your head.',
    lead:
      'Cash Prophet is financial management software that keeps track of kitchen and front-of-house wages, rent, suppliers, VAT and other commitments, so you can see where the restaurant stands between service and payday.',
    primaryCta: 'Join Early Access',
    primaryCtaSupport: 'Personal setup included',
    tryItCta: 'Try the free Snapshot',
  },
  problem: {
    heading: 'What restaurant owners are usually searching for',
    lead:
      'Searches for restaurant finance software or cash management often mean: covers look strong, but payroll, rent, food suppliers and VAT are still only partly visible until they hit the account.',
    points: [
      'Kitchen and front-of-house wages build through the week before payday.',
      'Rent, utilities and supplier payments keep landing on their own schedule.',
      'VAT and insurance need preparing for, not reacting to.',
      'Accounting records the past; owners still need a day-to-day organised picture.',
    ],
    close:
      'Cash Prophet sits alongside your books as financial management software for owners: commitments, reserves and a Cash Prophet Balance you can check quickly.',
  },
  picture: {
    heading: 'Your restaurant’s financial picture, organised.',
    lead:
      'Cash Prophet brings together the things you need to keep on top of, so you can quickly understand where the restaurant stands and what needs your attention.',
    tabs: [
      {
        id: 'bills',
        label: 'Bills coming up',
        heading: 'Keep ahead of payroll, rent and suppliers',
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
      'Restaurant VAT, rent and insurance rarely arrive in neat weekly amounts. Without a reserve plan, a strong-looking current account can disappear when those costs land.',
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
    headlineStart: 'Busy sessions. Quiet midweeks.',
    headlineHighlight: 'Cash Prophet organises soft play finances beyond the bank balance.',
    lead:
      'Cash Prophet is financial management software that keeps track of staffing, rent, insurance, VAT and other commitments, so you can see where the venue stands when takings rise and fall through the week.',
    primaryCta: 'Join Early Access',
    primaryCtaSupport: 'Personal setup included',
    tryItCta: 'Try the free Snapshot',
  },
  problem: {
    heading: 'What soft play owners are usually searching for',
    lead:
      'Searches for leisure or soft play finance software often mean: parties and weekends look strong, but staffing, rent, insurance and VAT still need organising between busy days.',
    points: [
      'Staffing costs build through the week before payday.',
      'Rent, utilities and insurance keep landing on their own schedule.',
      'VAT and larger renewals need a planned reserve, not a last-minute scramble.',
      'The bank balance does not show what is already spoken for.',
    ],
    close:
      'Cash Prophet is financial management software for owner-managed leisure venues: commitments organised, reserves planned, and a Cash Prophet Balance you can check quickly.',
  },
  picture: {
    heading: 'Your venue’s financial picture, organised.',
    lead:
      'Cash Prophet brings together the things you need to keep on top of, so you can quickly understand where the soft play stands and what needs your attention.',
    tabs: [
      {
        id: 'bills',
        label: 'Bills coming up',
        heading: 'Keep ahead of staffing, rent and utilities',
        body:
          'See what’s due, when it’s due and roughly how much it will be. Regular soft play costs such as staffing, rent, utilities and supplier payments build into your financial picture as they accrue, rather than suddenly appearing when they’re paid.',
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
          `Track your ${CASH_PROPHET_BALANCE} over time to see how your underlying position is changing, without busy weekends and quieter midweeks making the bank balance harder to interpret.\n\nSee how today compares with previous weeks and months, and whether the underlying position is getting stronger or weaker.`,
      },
    ],
  },
  reserve: {
    heading: 'Reserve Planner for soft play VAT, rent and insurance',
    lead: [
      'Soft play VAT, rent and insurance rarely match the weekly rhythm of parties and walk-ins. Without a plan, a healthy-looking current account can disappear when those costs land.',
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
