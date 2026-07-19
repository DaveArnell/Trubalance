import type { PageId } from '../navigation'

export interface TourStep {
  id: string
  target: string
  title: string
  body: string
  placement?: 'top' | 'bottom' | 'left' | 'right'
  /** Navigate to this page before spotlighting the target */
  page?: PageId
  /** Optional walkthrough clip; omit = show placeholder CTA */
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
      target: '[data-tour="overview-balances"]',
      title: 'Add your current accounts',
      body: 'Enter what’s in each current account right now. That gives True Balance its starting point.\n\nSave when you’re done — each save also feeds Trends and History.\n\nYou can click inside the highlighted area to do this now — the guide stays open.',
      placement: 'left',
      page: 'committed-funds',
    },
    {
      id: 'setup-committed',
      target: '[data-widget-id="committed-funds"]',
      title: 'Add monthly accruing costs',
      body: 'Rent, wages, subscriptions — regular bills that build up a little every day.\n\nUse + Add next to the view controls. You can click inside this area and add costs without leaving the guide.',
      placement: 'top',
      page: 'committed-funds',
    },
    {
      id: 'setup-due',
      target: '[data-widget-id="due"]',
      title: 'Due and one-off costs',
      body: 'Anything ready to pay lands here — monthly bills at their due date, plus one-offs you earmark or build up toward.\n\nUse + Add planned to add one. Click inside the highlight — the guide stays with you.',
      placement: 'top',
      page: 'committed-funds',
    },
    {
      id: 'setup-receipts',
      target: '[data-widget-id="expected-receipts"]',
      title: 'Expected receipts',
      body: 'Money you know is coming — invoices, grants, refunds. Add them here so True Balance can count them in.\n\nMark Received when the cash lands. Click inside to add while this step is open.',
      placement: 'top',
      page: 'committed-funds',
    },
    {
      id: 'setup-true-balance',
      target: '[data-tour="overview-hero"]',
      title: 'Your True Balance',
      body: 'As you add balances and costs, this number updates — cash minus what’s spoken for, plus realistic receipts.\n\nThat’s the figure to trust day to day. When you’re ready for VAT and other lumpy bills, open Reserve Planner in the sidebar — a red alert marks it if you haven’t set one up yet.',
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
        title: 'True Balance overview',
        body: 'This strip stays at the top while you work. It shows how much is genuinely available after money already spoken for is taken into account.\n\nSave account balances on the right whenever you reconcile — that keeps True Balance honest and feeds Trends and History.',
        placement: 'bottom',
      },
      {
        id: 'cf-commitments',
        target: '[data-widget-id="committed-funds"]',
        title: 'Monthly accruing costs',
        body: 'These are your regular predictable bills — rent, payroll, subscriptions, direct debits. Each row builds up day by day toward its monthly total, so you always know how much is already spoken for.\n\nOn the 1st, little has accrued yet; by late month, most of the amount has built up. Add one row per recurring cost. For irregular or one-off bills, use Reserve Planner instead.',
        placement: 'top',
      },
      {
        id: 'cf-views',
        target: '[data-tour="committed-views"]',
        title: 'Ways to view your costs',
        body: 'Costs shows the editable list. Month view draws a timeline of how committed balance builds through the month and drops when bills are paid — useful for spotting tight weeks.\n\nIn the list, Grouped keeps matching names together (with expand/collapse). Timeline sorts by next due date, the same order you see on mobile. You can also switch the whole dashboard between Sheet and Cards from the view controls.',
        placement: 'bottom',
      },
      {
        id: 'cf-due',
        target: '[data-widget-id="due"]',
        title: 'Due now',
        body: 'Everything that needs paying this cycle lands here — monthly costs at their due date, reserve bills, and one-off planned costs.\n\nColoured dots flag alerts you can acknowledge. Mark items paid once the money has left the account so True Balance stays in step with reality.',
        placement: 'top',
      },
      {
        id: 'cf-receipts',
        target: '[data-widget-id="expected-receipts"]',
        title: 'Expected receipts',
        body: 'Money you expect in — grants, ticket sales, refunds, invoices. Accruing receipts can build up toward a date; lump sums sit until they land.\n\nMark received when the cash arrives so True Balance and the cash outlook stay accurate.',
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
        body: 'Each point is recorded when you save bank balances in the overview. The chart shows how True Balance and related metrics move over time.\n\nToggle scopes and metrics to compare group, business, or venue levels and see which parts of the business drive the shape of the line.',
        placement: 'top',
      },
      {
        id: 'tr-log',
        target: '[data-widget-id="trends-history"]',
        title: 'Balance log',
        body: 'The same data as the chart, in a table — one row per day you saved balances.\n\nClick a daily value to correct it if a save was wrong. Those corrections keep both the chart and your history honest.',
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
        body: 'Projects your current account forward from scheduled outgoings, reserve transfers, and dated receipts.\n\nBest when you have identifiable incoming payments (invoices, contracts). For steady daily income such as retail or hospitality, this mainly shows outgoings — use Trends for your overall trajectory.',
        placement: 'top',
      },
      {
        id: 'fc-projection',
        target: '[data-widget-id="forecast-projection"]',
        title: 'Trend projection',
        body: 'Extrapolates from saved balance history to estimate when you might hit a target balance.\n\nUse it alongside the cash outlook: one looks at scheduled cash movements, the other at the pattern of balances you have already recorded.',
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
        body: 'Each time you save balances, a full record is kept — accounts, due items, receipts, and commitments as they were that day.\n\nPick a date to browse what the business looked like then. It is a useful audit trail when something does not line up.',
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
        body: 'Shows whether your reserve account is on track for this month — not a random colour label.\n\n“Needs attention” usually means top up the reserve or review this month’s transfers so the plan stays credible.',
        placement: 'bottom',
      },
      {
        id: 'rp-buffer',
        target: '[data-tour="reserve-planner-buffer"]',
        title: 'Minimum buffer',
        body: 'The lowest balance you want sitting in reserve across the year.\n\nThe outlook chart treats this as a floor, so you can see months that would dip below your comfort level.',
        placement: 'bottom',
      },
      {
        id: 'rp-month',
        target: '[data-tour="reserve-planner-month"]',
        title: 'This month',
        body: 'Confirm operating and reserve balances each month. The plan then tells you how much to transfer between accounts.\n\nTreat that transfer as the monthly habit that keeps big bills funded before they land.',
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
        id: 'st-display',
        target: '[data-tour="settings-display"]',
        title: 'Display preferences',
        body: 'Default table formatting across the app — alignment, wrap, and density.\n\nIndividual widgets can still override from their ⋯ menu when a single sheet needs different settings.',
        placement: 'bottom',
      },
      {
        id: 'st-structure',
        target: '[data-tour="settings-structure"]',
        title: 'Organisation structure',
        body: 'Groups contain businesses, businesses contain venues. Add bank accounts at business or venue level.\n\nThis structure is the backbone of scope, colours, and reporting everywhere else in True Balance.',
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
      body: 'Pick a business and its reserve savings account. Those need to exist in Settings first.\n\nOnce the plan is created, add bills to the grid and the outlook chart will start to show how the year looks.',
      placement: 'top',
    },
  ],
}
