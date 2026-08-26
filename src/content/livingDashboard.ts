import type { HealthLevel } from '../types'

/** Short line under the Cash Prophet Balance hero — living dashboard mindset. */
export const LIVING_DASHBOARD_TAGLINE =
  'A living dashboard — update as life happens, and your Available number stays trustworthy.'

export const FRESHNESS_ENCOURAGEMENT: Record<HealthLevel, string> = {
  green: 'Balances are fresh. You can trust what’s Available right now.',
  yellow: 'Updated recently. A quick refresh every few days keeps you confident.',
  orange: 'Getting older — two minutes updating balances brings your picture back.',
  red: 'Needs an update — Available is only as accurate as your latest figures.',
}

export const FRESHNESS_SECTION_HEADING = 'Balance freshness'

export const MONTHLY_RESERVE_CHECKIN_HEADLINE = 'Reserve planner — monthly review'

export const MONTHLY_RESERVE_CHECKIN_INTRO =
  'A short monthly reminder to review your reserve targets and transfers. This is not a bank check-in — it is about your Reserve Planner in Cash Prophet.'

export const MONTHLY_RESERVE_CHECKIN_STEPS = [
  'Review this month’s reserve target.',
  'Confirm the recommended transfer.',
  'Check the reserve account matches the target.',
  'Glance at any large bills coming up.',
] as const

export const WIDGET_HELP = {
  trueBalance:
    'Cash Prophet Balance is what you can work with once money already spoken for has been accounted for.\n\nUpdate balances regularly — the fresher the figures, the more you can trust this number.',
  committedFunds:
    'Regular monthly costs — rent, payroll, subscriptions, loan repayments.\n\nEach one builds day by day toward its next due date, so you always know how much of your balance is already spoken for.\n\nFor irregular bills like VAT or annual insurance, use the Reserve Planner instead.',
  due: 'Everything that needs paying this cycle lands here — monthly costs on their due date, reserve bills, and one-off planned costs.\n\nFor a planned cost you add yourself, choose how it comes off your Cash Prophet Balance: take the full amount straight away, or build a little each day up to the due date.\n\nMark items paid once the money has left the account. That frees up your Cash Prophet Balance and clears what needs attention.',
  expectedReceipts:
    'Money you expect to receive.\n\nSet the Expected date for when cash should arrive. You can count the full amount toward your position straight away, or build it up day by day to the Expected date.\n\nWhen the real amount differs from your estimate, edit it — history for that period updates automatically.',
  reservePlanner:
    'Save toward irregular bills such as VAT, corporation tax and insurance.\n\nAdd each bill in the month it is actually due. The chart shows the planned reserve balance; each month confirm what is in the reserve and complete any transfer.\n\nWhen a bill’s due month arrives, it appears in Due so you can mark it paid.',
  trends:
    'Every time you save balances, a point is recorded so you can see whether the business is drifting up or down.\n\nUse Trend to overlay a straight or smoothed line and a short forward outlook. Forecast always starts from your latest saved balance.',
  cashOutlook:
    'Projects your current account forward using dated monthly costs, planned payments, reserve transfers, and expected receipts.\n\nWorks best when income arrives as identifiable payments. For steady daily trade, Trends is usually a clearer picture of direction.',
  forecast:
    'Forward-looking view: cash outlook from scheduled movements, plus trend projection from saved balance history.\n\nIf your income arrives steadily through the month, the Trends page is often the better guide.',
  financialCalendar:
    'Your financial calendar and tick list.\n\nAdd any reminder you want to track — under Your reminders. Coming up shows the next dates. When a date arrives it moves to To do now until you tick it; recurring reminders come back on the next due date.\n\nThis is not bookkeeping or tax filing. It is simply a place to keep financial dates visible.',
} as const

export const QUICK_HABITS = [
  'Update bank balances',
  'Mark commitments paid',
  'Mark receipts received',
  'Adjust amounts when plans change',
] as const
