import { MUTED_APP_PAGES, type PageId } from '../navigation'

export interface TourStep {
  id: string
  target: string
  title: string
  body: string
  placement?: 'top' | 'bottom' | 'left' | 'right'
  /** Navigate to this page before spotlighting the target */
  page?: PageId
  /** Optional — reserved for when tour clips return; not shown in UI for now */
  videoUrl?: string
  videoLabel?: string
}

export interface PageTour {
  id: string
  title: string
  description: string
  steps: TourStep[]
}

export const SETUP_TOUR: PageTour = {
  id: 'setup',
  title: 'Set up your dashboard',
  description: 'Add your real numbers where you’ll use them every day.',
  steps: [
    {
      id: 'setup-balances',
      target: '[data-tour="overview-hero"]',
      title: 'Add your current accounts',
      body: 'Your Cash Prophet Balance sits top left. Enter what’s in each current account in the table beside it — that gives the number its starting point.\n\nUse More for more overview detail. Save when you’re done.',
      placement: 'bottom',
      page: 'committed-funds',
    },
    {
      id: 'setup-committed',
      target: '[data-widget-id="committed-funds"]',
      title: 'Add monthly accruing costs',
      body: 'Rent, wages, subscriptions — regular bills that build up a little every day.\n\nUse + Add next to the view controls to add each one.',
      placement: 'top',
      page: 'committed-funds',
    },
    {
      id: 'setup-due',
      target: '[data-widget-id="due"]',
      title: 'Due and one-off costs',
      body: 'Anything ready to pay lands here — monthly bills at their due date, plus one-offs you earmark or build up toward.\n\nFor planned costs, choose whether they come off your Cash Prophet Balance straight away or build a little each day to the due date. Use + Add planned to add a one-off.',
      placement: 'top',
      page: 'committed-funds',
    },
    {
      id: 'setup-receipts',
      target: '[data-widget-id="expected-receipts"]',
      title: 'Expected receipts',
      body: 'Money you know is coming — invoices, grants, refunds. Add them here so they can count toward your Cash Prophet Balance.\n\nMark Received when the cash lands.',
      placement: 'top',
      page: 'committed-funds',
    },
    {
      id: 'setup-true-balance',
      target: '[data-tour="overview-hero"]',
      title: 'Your Cash Prophet Balance',
      body: 'As you add balances and costs, your Cash Prophet Balance updates. That’s the figure to trust day to day.\n\nWhen you’re ready for VAT and other irregular bills, open Reserve Planner in the sidebar.',
      placement: 'bottom',
      page: 'committed-funds',
    },
  ],
}

export const PAGE_TOURS: Partial<Record<PageId, PageTour>> = {
  'committed-funds': {
    id: 'committed-funds',
    title: 'Committed Funds',
    description: 'Outgoings, due items, and receipts.',
    steps: [
      {
        id: 'cf-hero',
        target: '[data-tour="overview-hero"]',
        title: 'Your balances',
        body: 'Your Cash Prophet Balance sits top left. Enter current account balances in the table beside it — that is the starting point for this number and for Trends.\n\nUse More to open more detail in this overview. Save whenever you reconcile so the numbers stay honest.',
        placement: 'bottom',
      },
      {
        id: 'cf-commitments',
        target: '[data-widget-id="committed-funds"]',
        title: 'Monthly accruing costs',
        body: 'These are your regular predictable bills — rent, payroll, subscriptions, direct debits. Each row builds toward its next due date, so you always know how much is already spoken for.\n\nHow much has built up depends on where you are in that cost’s own cycle — not simply “early or late in the calendar month.” Add one row per recurring cost. For irregular or one-off bills, use Reserve Planner instead.',
        placement: 'top',
      },
      {
        id: 'cf-due',
        target: '[data-widget-id="due"]',
        title: 'Due now',
        body: 'Everything that needs paying this cycle lands here — monthly costs at their due date, reserve bills, and one-off planned costs.\n\nFor planned costs you add yourself, choose how they come off your Cash Prophet Balance: take the amount straight away, or build a little each day up to the due date. Mark items paid once the money has left the account.',
        placement: 'top',
      },
      {
        id: 'cf-receipts',
        target: '[data-widget-id="expected-receipts"]',
        title: 'Expected receipts',
        body: 'Money you expect in — grants, ticket sales, refunds, invoices. Accruing receipts can build up toward a date; lump sums sit until they land.\n\nMark received when the cash arrives so your Cash Prophet Balance stays accurate.',
        placement: 'top',
      },
    ],
  },
  trends: {
    id: 'trends',
    title: 'Trends',
    description: 'Charts and balance log.',
    steps: [
      {
        id: 'tr-chart',
        target: '[data-widget-id="trends-chart"]',
        title: 'Balance chart',
        body: 'Each point is recorded when you save bank balances in the overview. The chart shows how your Cash Prophet Balance and related metrics move over time.\n\nToggle scopes and metrics to compare group, business, or venue levels and see which parts of the business drive the shape of the line.',
        placement: 'top',
      },
      {
        id: 'tr-log',
        target: '[data-widget-id="trends-history"]',
        title: 'Balance log',
        body: 'The same data as the chart, in a table — one row per day you saved balances.\n\nClick a daily value to correct it if a save was wrong. Those corrections keep the chart honest.',
        placement: 'left',
      },
    ],
  },
  'reserve-planner': {
    id: 'reserve-planner',
    title: 'Using your reserve plan',
    description: 'How to work with bills, transfers, and month-end.',
    steps: [
      {
        id: 'rp-status',
        target: '[data-tour="reserve-planner-status"]',
        title: 'Plan health',
        body: 'Shows whether your reserve account is on track for this month — not a random colour label.\n\n“Needs attention” usually means top up the reserve or review this month’s transfers so the plan stays credible.',
        placement: 'bottom',
      },
      {
        id: 'rp-buffer',
        target: '[data-tour="reserve-planner-buffer"]',
        title: 'Average transfer and buffer',
        body: 'Average monthly transfer is your annual reserve bills divided by 12 — a planning guide, not this month’s action.\n\nBuffer is the lowest balance you want sitting in reserve across the year. The outlook chart treats it as a floor.',
        placement: 'bottom',
      },
      {
        id: 'rp-month',
        target: '[data-tour="reserve-planner-month"]',
        title: 'This month’s transfer',
        body: 'Each month: check reserve now, see what it should be after, then move the amount shown between accounts.\n\nTick Transfer done, enter the new reserve funds, and Confirm. That habit keeps big bills funded before they land.',
        placement: 'bottom',
      },
      {
        id: 'rp-bills',
        target: '[data-tour="reserve-planner-bills"]',
        title: 'Bill schedule',
        body: 'Add a row per bill. Enter the amount in the month it is actually due — VAT in July, insurance in March, and so on.\n\nDo not smooth them into monthly averages here; the whole point is to plan for the real due months.',
        placement: 'top',
      },
      {
        id: 'rp-chart',
        target: '[data-tour="reserve-planner-chart"]',
        title: 'Balance outlook',
        body: 'Shows how reserve should move through the year as bills land and transfers top it up.\n\nUse it to spot tight months early and adjust buffers or transfer amounts before you get there.',
        placement: 'top',
      },
    ],
  },
  settings: {
    id: 'settings',
    title: 'Settings',
    description: 'Organisation and display.',
    steps: [
      {
        id: 'st-structure',
        target: '[data-tour="settings-structure"]',
        title: 'Company structure',
        body: 'Groups contain businesses, businesses contain venues. Add bank accounts at business or venue level.\n\nThis structure is the backbone of scope, colours, and reporting everywhere else in Cash Prophet.',
        placement: 'top',
      },
      {
        id: 'st-display',
        target: '[data-tour="settings-display"]',
        title: 'Display preferences',
        body: 'Default table formatting across spreadsheet views — alignment, wrap, and density.\n\nChange Spreadsheet vs Cards for the dashboard under Display too.',
        placement: 'bottom',
      },
    ],
  },
  calendar: {
    id: 'calendar',
    title: 'Financial calendar',
    description: 'Financial reminders on a calendar.',
    steps: [
      {
        id: 'cal-overview',
        target: '[data-tour="financial-calendar"]',
        title: 'Calendar and tick list',
        body: 'Your reminders — add anything you want to track.\n\nComing up — see dates ahead.\n\nTo do now — tick when the date arrives; recurring reminders come back next time.',
        placement: 'top',
        page: 'calendar',
      },
    ],
  },
}

export function getTourForPage(pageId: PageId): PageTour | null {
  if (MUTED_APP_PAGES.has(pageId)) return null
  return PAGE_TOURS[pageId] ?? null
}

export const RESERVE_PLANNER_INTRO_TOUR: PageTour = {
  id: 'reserve-planner-intro',
  title: 'Reserve Planner',
  description: 'What it is and how to create your first plan.',
  steps: [
    {
      id: 'rpi-welcome',
      target: '[data-tour="reserve-empty"]',
      title: 'What is Reserve Planner?',
      body: 'It helps you save for irregular bills — VAT, tax, insurance — month by month, in the months they are actually due.\n\nUnlike monthly accruing costs, these do not hit every month, so you build a dedicated reserve instead of pretending they are a flat monthly average.',
      placement: 'bottom',
    },
    {
      id: 'rpi-how',
      target: '[data-tour="reserve-empty-how"]',
      title: 'How you use it',
      body: 'Create a plan, add bills with amounts in their due months, then each month confirm balances and transfer what the plan asks for.\n\nWhen a bill’s due month arrives, it shows up in Due so you can mark it paid like any other payment.',
      placement: 'bottom',
    },
    {
      id: 'rpi-create',
      target: '[data-tour="reserve-empty-create"]',
      title: 'Create your first plan',
      body: 'Pick a business and its reserve savings account. Those need to exist in Settings first. A proper higher-interest savings account is ideal — not another current account — so money waiting for bigger bills can earn something.\n\nOnce the plan is created, add bills to the grid and the outlook chart will start to show how the year looks.',
      placement: 'top',
    },
  ],
}
