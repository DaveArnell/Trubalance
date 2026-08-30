/**
 * Demo-specific product tour — separate narrative from normal-user setup/page tours.
 */

import type { PageTour, TourStep } from './pageTours'
import type { DemoScenarioId } from '../data/demoScenarios'
import { formatCurrency } from '../utils/format'

export interface DemoTourScenarioConfig {
  scenarioId: DemoScenarioId
  welcomeTitle: string
  welcomeBody: string
  welcomeSupport: string
  /** Regular cost names that exist in this demo's data */
  regularCostExamples: readonly string[]
  /** Reserve bill names that exist in this demo's data */
  reserveBillExamples: readonly string[]
  multiSite?: boolean
}

const DEMO_TOUR_CONFIGS: Record<DemoScenarioId, DemoTourScenarioConfig> = {
  'independent-leisure': {
    scenarioId: 'independent-leisure',
    welcomeTitle: 'Welcome to Harbour Adventures',
    welcomeBody:
      'This example leisure business uses Cash Prophet to keep its regular bills, larger future costs and underlying financial position organised in one place.',
    welcomeSupport: "We'll show you the four things worth looking at.",
    regularCostExamples: ['Payroll', 'Rent', 'Utilities'],
    reserveBillExamples: ['VAT', 'Corporation tax', 'Public liability renewal'],
  },
  'independent-cafe': {
    scenarioId: 'independent-cafe',
    welcomeTitle: 'Welcome to Cornerstone Coffee',
    welcomeBody:
      'This two-site independent café uses Cash Prophet to keep the financial picture organised across its locations, while still seeing the position of the business as a whole.',
    welcomeSupport: "We'll show you the four things worth looking at.",
    regularCostExamples: ['Payroll', 'Rent (High Street)', 'Rent (Market)', 'Utilities'],
    reserveBillExamples: ['VAT', 'Business rates', 'Equipment insurance'],
    multiSite: true,
  },
  'independent-salon': {
    scenarioId: 'independent-salon',
    welcomeTitle: 'Welcome to Grove Hair Studio',
    welcomeBody:
      'This example salon uses Cash Prophet to keep regular overheads, larger future costs and the underlying financial position organised without turning it into another accounting job.',
    welcomeSupport: "We'll show you the four things worth looking at.",
    regularCostExamples: ['Rent', 'Stylist wages', 'Utilities'],
    reserveBillExamples: ['VAT', 'Business rates', 'Salon insurance'],
  },
}

export function getDemoTourConfig(scenarioId: string): DemoTourScenarioConfig {
  if (scenarioId in DEMO_TOUR_CONFIGS) {
    return DEMO_TOUR_CONFIGS[scenarioId as DemoScenarioId]
  }
  return DEMO_TOUR_CONFIGS['independent-leisure']
}

function listExamples(items: readonly string[]): string {
  if (items.length === 0) return ''
  if (items.length === 1) return items[0]!
  if (items.length === 2) return `${items[0]} and ${items[1]}`
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`
}

export function buildDemoProductTour(
  scenarioId: string,
  balances: { bankBalance: number; trueBalance: number },
): PageTour {
  const config = getDemoTourConfig(scenarioId)
  const costList = listExamples(config.regularCostExamples)
  const reserveList = listExamples(config.reserveBillExamples)
  const bank = formatCurrency(balances.bankBalance)
  const prophet = formatCurrency(balances.trueBalance)

  const balanceExtra = config.multiSite
    ? '\n\nIn a multi-site business like this, you can look at each location on its own as well as the combined total for the business.'
    : ''

  const steps: TourStep[] = [
    {
      id: 'demo-welcome',
      target: 'none',
      title: config.welcomeTitle,
      body: `${config.welcomeBody}\n\n${config.welcomeSupport}`,
      page: 'committed-funds',
      ctaPrimary: 'Show me around',
      ctaSecondary: 'Skip and explore',
      ctaSecondaryAction: 'skip',
    },
    {
      id: 'demo-accruing',
      target: '[data-widget-id="committed-funds"]',
      title: "See what's already building up",
      body: `Rent, wages and other regular costs build into the financial picture as the payment period progresses, rather than suddenly becoming relevant on the day they are paid.\n\nIn this example that includes ${costList}.`,
      placement: 'top',
      page: 'committed-funds',
    },
    {
      id: 'demo-balance',
      target: '[data-tour="overview-hero"]',
      title: 'See where the business stands',
      body: `The bank currently shows ${bank}. After the costs and commitments already building are accounted for, the Cash Prophet Balance is ${prophet}.\n\nThat gives the owner a more consistent benchmark for the underlying financial position of the business.${balanceExtra}`,
      placement: 'bottom',
      page: 'committed-funds',
    },
    {
      id: 'demo-trends',
      target: '[data-widget-id="trends-chart"]',
      title: 'See which way the business is heading',
      body: 'Cash Prophet logs the underlying position over time, so the owner can compare today with previous weeks and months and see whether the position is strengthening or weakening.',
      placement: 'top',
      page: 'trends',
    },
    {
      id: 'demo-reserve',
      target: '[data-tour="reserve-planner-sheet"]',
      title: 'Prepare for the bigger costs ahead',
      body: `The Reserve Planner takes larger or irregular costs such as ${reserveList} and turns them into an amount the business can prepare for gradually.\n\nEach month, Cash Prophet shows what should be moved into or out of the reserve so those costs are already planned for.`,
      placement: 'top',
      page: 'reserve-planner',
    },
    {
      id: 'demo-calendar',
      target: '[data-tour="fin-cal-month"]',
      title: 'Keep important financial dates in one place',
      body: 'The Financial Calendar keeps important dates visible alongside the rest of the financial picture, so things such as payment dates, filing deadlines or other financial reminders do not have to live in your head.',
      placement: 'top',
      page: 'calendar',
    },
    {
      id: 'demo-complete',
      target: 'none',
      title: "That's the Cash Prophet picture",
      body: "Cash Prophet keeps the key day-to-day financial picture organised: what's building up, where the business stands, where it's heading, and what needs preparing for.\n\nYou're now free to explore this example business at your own pace.",
      page: 'calendar',
      ctaPrimary: 'Explore the demo',
      ctaSecondary: 'Join Early Access',
      ctaSecondaryTo: '/early-access',
      ctaSecondaryAction: 'link',
    },
  ]

  return {
    id: `demo-product:${config.scenarioId}`,
    title: 'Demo walkthrough',
    description: 'How Cash Prophet organises this example business.',
    kind: 'demo',
    steps,
  }
}

export function isDemoProductTourId(tourId: string | undefined): boolean {
  return Boolean(tourId?.startsWith('demo-product:'))
}
