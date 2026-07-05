import type { HealthLevel } from '../types'

/** Short line under the True Balance hero — living dashboard mindset. */
export const LIVING_DASHBOARD_TAGLINE =
  'A living dashboard — update as life happens, and your True Balance stays trustworthy.'

export const FRESHNESS_ENCOURAGEMENT: Record<HealthLevel, string> = {
  green: 'Balances are fresh. You can trust this True Balance right now.',
  yellow: 'Updated recently. A quick refresh every few days keeps you confident.',
  orange: 'Getting older — two minutes updating balances brings your picture back.',
  red: 'Needs an update — your True Balance is only as accurate as your latest figures.',
}

export const FRESHNESS_SECTION_HEADING = 'Balance freshness'

export const MONTHLY_RESERVE_CHECKIN_HEADLINE = 'Reserve planner — monthly review'

export const MONTHLY_RESERVE_CHECKIN_INTRO =
  'A short monthly reminder to review your reserve targets and transfers. This is not a bank check-in — it is about your Reserve Planner in True Balance.'

export const MONTHLY_RESERVE_CHECKIN_STEPS = [
  'Review this month’s reserve target.',
  'Confirm the recommended transfer.',
  'Check the reserve account matches the target.',
  'Glance at any large bills coming up.',
] as const

export const WIDGET_HELP = {
  trueBalance:
    'True Balance shows how much money is genuinely available once money already spoken for has been accounted for. Update balances regularly — the fresher the data, the more you can trust this number. Most people refresh every day or two, or whenever significant money moves.',
  committedFunds:
    'For regular, predictable bills that come out every month — rent, payroll, subscriptions, insurance DD, loan repayments. These build up (accrue) daily so you always know how much of your balance is already spoken for. Not for one-off or irregular costs — use Reserve Planner for those.',
  due: 'As things get paid, mark them here. That frees up your True Balance and clears what needs attention.',
  expectedReceipts:
    'Money you expect to receive. Choose Lump sum (counts in full straight away) or Build up (accrues daily toward the expected date). When the actual amount differs from your estimate, edit the amount in Due or pay with the real figure — history for that month is corrected automatically.',
  reservePlanner:
    'Put money aside for irregular bills like VAT, corporation tax and insurance. Add bills with amounts in the months they are due. Follow the balance outlook chart — the solid line is planned balance; the dashed line is what you have confirmed. Each month, confirm balances and complete any transfer. Bills appear in Due when payment is due.',
  trends:
    'Every time you save balances, a point is recorded. The chart shows whether you are drifting up or down over time.',
  cashOutlook:
    'Projects your current account forward using dated monthly costs, planned payments, reserve transfers, and expected receipts. Works best for businesses with identifiable incoming payments (e.g. invoiced clients, grants, contract payments). For businesses with steady daily income (e.g. retail, hospitality), outgoings are plotted but income is not — your actual balance will be higher than shown. Set income pattern per business in Settings → Structure.',
  forecast:
    'Forward-looking view: cash outlook from scheduled movements, plus trend projection from saved balance history. The cash outlook is most accurate for businesses with dated incoming payments. If your income arrives steadily (daily trade), the Trends page gives a better picture of your overall trajectory.',
} as const

export const QUICK_HABITS = [
  'Update bank balances',
  'Mark commitments paid',
  'Mark receipts received',
  'Adjust amounts when plans change',
] as const
