import type { PageId } from '../navigation'

export interface TourStep {
  id: string
  target: string
  title: string
  body: string
  placement?: 'top' | 'bottom' | 'left' | 'right'
}

export interface PageTour {
  id: string
  title: string
  description: string
  steps: TourStep[]
}

export const SETUP_TOUR: PageTour = {
  id: 'setup',
  title: 'Getting started',
  description: 'A quick replay of the setup guide.',
  steps: [
    {
      id: 'setup-welcome',
      target: '[data-tour="overview-hero"]',
      title: 'Your True Balance',
      body: 'True Balance shows how much money is genuinely available once money already spoken for has been accounted for.',
      placement: 'bottom',
    },
    {
      id: 'setup-scope',
      target: '[data-tour="sidebar-scope"]',
      title: 'Your business',
      body: 'Use the tree on the left to switch between your whole group, a single business, or one site. Everything follows this scope.',
      placement: 'right',
    },
    {
      id: 'setup-balances',
      target: '[data-tour="overview-balances"]',
      title: 'Your cash',
      body: 'Enter current account balances here. This gives True Balance its starting point and builds your trend history.',
      placement: 'left',
    },
    {
      id: 'setup-committed',
      target: '[data-widget-id="committed-funds"]',
      title: 'Money already spoken for',
      body: 'Regular costs like payroll, rent, and HMRC build up here. They reduce what you can safely spend.',
      placement: 'top',
    },
    {
      id: 'setup-reserve',
      target: '[data-tour="nav-reserve-planner"]',
      title: 'Big bills',
      body: 'VAT, corporation tax, and insurance often catch businesses out. Reserve Planner helps you put money aside before they arrive.',
      placement: 'right',
    },
    {
      id: 'setup-accuracy',
      target: '[data-tour="overview-balances"]',
      title: 'Keep it accurate',
      body: 'Update balances regularly and mark payments as paid. The more up to date the data is, the more useful your True Balance becomes.',
      placement: 'left',
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
        title: 'True Balance overview',
        body: 'Always visible at the top. Save account balances on the right to keep True Balance accurate.',
        placement: 'bottom',
      },
      {
        id: 'cf-commitments',
        target: '[data-widget-id="committed-funds"]',
        title: 'Monthly commitments',
        body: 'Recurring costs by month. Each row is scoped to a group, business, or venue. Amounts roll up into committed funds.',
        placement: 'top',
      },
      {
        id: 'cf-due',
        target: '[data-widget-id="due"]',
        title: 'Due now',
        body: 'Items that need paying this cycle — monthly costs at their due date, reserve bills, and one-off planned costs. Coloured dots are alerts you can acknowledge.',
        placement: 'top',
      },
      {
        id: 'cf-receipts',
        target: '[data-widget-id="expected-receipts"]',
        title: 'Expected receipts',
        body: 'Money you expect in — grants, ticket sales, refunds. Mark received when it lands to keep True Balance honest.',
        placement: 'top',
      },
    ],
  },
  trends: {
    id: 'trends',
    title: 'Trends',
    description: 'Charts and balance history.',
    steps: [
      {
        id: 'tr-chart',
        target: '[data-widget-id="trends-chart"]',
        title: 'Balance chart',
        body: 'Each point is recorded when you save bank balances in the overview. Toggle scopes and metrics to compare group, business, or venue levels.',
        placement: 'bottom',
      },
      {
        id: 'tr-log',
        target: '[data-widget-id="trends-history"]',
        title: 'Balance log',
        body: 'The same data as the chart, in a table. One row per day you saved balances. Click a daily value to correct it if needed.',
        placement: 'left',
      },
    ],
  },
  forecast: {
    id: 'forecast',
    title: 'Forecast',
    description: 'Forward cash outlook and trend projection.',
    steps: [
      {
        id: 'fc-outlook',
        target: '[data-widget-id="forecast-cash-outlook"]',
        title: 'Cash outlook',
        body: 'Projects your current account forward using scheduled costs, reserve transfers, and dated expected receipts. Set income pattern per business in Settings → Structure.',
        placement: 'bottom',
      },
      {
        id: 'fc-projection',
        target: '[data-widget-id="forecast-projection"]',
        title: 'Trend projection',
        body: 'Extrapolates from saved balance history to estimate when you might hit a target — useful alongside the cash outlook.',
        placement: 'left',
      },
    ],
  },
  history: {
    id: 'history',
    title: 'History',
    description: 'Full snapshots of past days.',
    steps: [
      {
        id: 'hi-panel',
        target: '[data-widget-id="history"]',
        title: 'Saved days',
        body: 'Each time you save balances, a full record is kept — accounts, due items, receipts, and commitments as they were that day. Pick a date to browse.',
        placement: 'bottom',
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
        body: 'Shows whether your reserve account is on track for this month — not a random colour label. “Needs attention” means top up or review transfers.',
        placement: 'bottom',
      },
      {
        id: 'rp-buffer',
        target: '[data-tour="reserve-planner-buffer"]',
        title: 'Minimum buffer',
        body: 'The lowest balance you want in reserve across the year. The outlook chart uses this as a floor.',
        placement: 'bottom',
      },
      {
        id: 'rp-month',
        target: '[data-tour="reserve-planner-month"]',
        title: 'This month',
        body: 'Confirm operating and reserve balances each month. The plan tells you how much to transfer between accounts.',
        placement: 'bottom',
      },
      {
        id: 'rp-bills',
        target: '[data-tour="reserve-planner-bills"]',
        title: 'Bill schedule',
        body: 'Add a row per bill. Enter the amount in the month it is actually due — VAT in July, insurance in March, etc. Not smoothed monthly.',
        placement: 'top',
      },
      {
        id: 'rp-chart',
        target: '[data-tour="reserve-planner-chart"]',
        title: 'Balance outlook',
        body: 'Shows how reserve should move through the year as bills land. Helps you spot tight months early.',
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
        id: 'st-display',
        target: '[data-tour="settings-display"]',
        title: 'Display preferences',
        body: 'Default table formatting across the app — alignment, wrap, and density. Individual widgets can override from their ⋯ menu.',
        placement: 'bottom',
      },
      {
        id: 'st-structure',
        target: '[data-tour="settings-structure"]',
        title: 'Organisation structure',
        body: 'Groups contain businesses, businesses contain venues. Add bank accounts at business or venue level. This is the backbone of the whole app.',
        placement: 'top',
      },
    ],
  },
  'business-hub': {
    id: 'business-hub',
    title: 'Business Hub',
    description: 'Company references and your business diary.',
    steps: [
      {
        id: 'bh-vault',
        target: '[data-widget-id="company-vault"]',
        title: 'Company references',
        body: 'VAT, PAYE, company number, and other IDs in one compact table — scoped to each business in your view.',
        placement: 'bottom',
      },
      {
        id: 'bh-diary',
        target: '[data-widget-id="business-diary"]',
        title: 'Business diary',
        body: 'Deadlines and renewals in a rolling list — closest dates first. Overdue items sit in a separate section until you clear them.',
        placement: 'top',
      },
      {
        id: 'bh-diary-add',
        target: '[data-tour="diary-add"]',
        title: 'Add a reminder',
        body: 'Pick a date, name the reminder, and add it. UK small-business templates are available as quick chips below.',
        placement: 'bottom',
      },
      {
        id: 'bh-diary-alerts',
        target: '[data-tour="diary-list"]',
        title: 'Alerts in the overview',
        body: 'Reminders due within a week show as orange alerts at the top of the app. Overdue items turn red. Click an alert to acknowledge it, or open the diary to clear or reschedule.',
        placement: 'top',
      },
    ],
  },
}

export function getTourForPage(pageId: PageId): PageTour | null {
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
      body: 'It helps you save for irregular bills — VAT, tax, insurance — month by month, in the months they are actually due.',
      placement: 'bottom',
    },
    {
      id: 'rpi-how',
      target: '[data-tour="reserve-empty-how"]',
      title: 'How you use it',
      body: 'Create a plan → add bills with due-month amounts → confirm each month and transfer. Bills show up in Due when payment is due.',
      placement: 'bottom',
    },
    {
      id: 'rpi-create',
      target: '[data-tour="reserve-empty-create"]',
      title: 'Create your first plan',
      body: 'Pick a business and its reserve savings account. You need those set up in Settings first. Then add bills to the grid.',
      placement: 'top',
    },
  ],
}
