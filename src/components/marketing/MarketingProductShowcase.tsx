import { useState } from 'react'
import { HeroBalanceEquation } from './HeroBalanceEquation'
import { HeroBalanceVisual } from './HeroBalanceVisual'
import { MarketingBrowserFrame } from './MarketingBrowserFrame'

const RESERVE_BILLS = [
  { name: 'VAT', annual: 19_200, due: 'Jun' },
  { name: 'Corp tax', annual: 8_400, due: 'Dec' },
  { name: 'Insurance', annual: 2_100, due: 'Mar' },
] as const

const RESERVE_ANNUAL_TOTAL = RESERVE_BILLS.reduce((sum, bill) => sum + bill.annual, 0)
const RESERVE_MONTHLY_TARGET = Math.round(RESERVE_ANNUAL_TOTAL / 12)

const TABS = [
  {
    id: 'balance',
    label: 'Available',
    accent: 'indigo',
    title: 'One number that tells the truth',
    body: 'Cash minus what is committed, plus expected receipts. Available rolls up every account so you see what is genuinely yours, not just what the bank app shows.',
  },
  {
    id: 'month',
    label: 'Through the month',
    accent: 'teal',
    title: 'Bills build through the month, then land in Due',
    body: 'Rent, payroll and subscriptions accrue day by day. Watch commitments grow, see what is due soon, and mark items paid when they clear.',
  },
  {
    id: 'reserve',
    label: 'Reserve Planner',
    accent: 'violet',
    title: 'Irregular bills, planned month by month',
    body: 'Add VAT, tax and renewals with their due dates. Reserve Planner spreads the annual cost into a monthly set-aside and shows the transfer to make.',
  },
] as const

type TabId = (typeof TABS)[number]['id']

function formatGbp(amount: number): string {
  return `£${amount.toLocaleString('en-GB')}`
}

export function MarketingProductShowcase() {
  const [active, setActive] = useState<TabId>('month')
  const tab = TABS.find((t) => t.id === active) ?? TABS[1]!

  return (
    <section className="marketing-showcase marketing-showcase--pop" aria-labelledby="marketing-showcase-heading">
      <div className="marketing-section-inner">
        <div className="marketing-section-head marketing-section-head--center">
          <p className="marketing-eyebrow marketing-eyebrow--vivid">See it in action</p>
          <h2 id="marketing-showcase-heading">From bank balance to real clarity</h2>
          <p className="marketing-section-lead">
            Cash Prophet sits alongside your bank. Update balances when you choose, and see what is
            spoken for, what is due and what you can actually use.
          </p>
        </div>

        <div className="marketing-showcase-tabs" role="tablist" aria-label="Product views">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active === item.id}
              className={`marketing-showcase-tab marketing-showcase-tab--${item.accent}${active === item.id ? ' is-active' : ''}`}
              onClick={() => setActive(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className={`marketing-showcase-panel marketing-showcase-panel--${tab.accent}`}>
          <div className="marketing-showcase-copy">
            <h3>{tab.title}</h3>
            <p>{tab.body}</p>
          </div>
          <MarketingBrowserFrame>
            {active === 'balance' && <HeroBalanceEquation />}
            {active === 'month' && <HeroBalanceVisual />}
            {active === 'reserve' && (
              <div
                className="marketing-reserve-preview marketing-reserve-preview--pop"
                role="img"
                aria-label="Reserve planner preview"
              >
                <div className="marketing-reserve-preview-head">
                  <span>Monthly set-aside</span>
                  <strong>{formatGbp(RESERVE_MONTHLY_TARGET)} / mo</strong>
                </div>
                <p className="marketing-reserve-preview-total muted">
                  {formatGbp(RESERVE_ANNUAL_TOTAL)} across the year
                </p>
                <ul className="marketing-reserve-preview-bills">
                  {RESERVE_BILLS.map((bill) => (
                    <li key={bill.name}>
                      <span>{bill.name}</span>
                      <span>{formatGbp(bill.annual)} / yr</span>
                      <span className="marketing-reserve-preview-due">{bill.due}</span>
                    </li>
                  ))}
                </ul>
                <p className="marketing-reserve-preview-transfer">
                  Suggested transfer this month: <strong>{formatGbp(RESERVE_MONTHLY_TARGET)}</strong>
                </p>
              </div>
            )}
          </MarketingBrowserFrame>
        </div>
      </div>
    </section>
  )
}
