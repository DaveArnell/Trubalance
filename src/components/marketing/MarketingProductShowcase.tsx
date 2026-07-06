import { useState } from 'react'
import { HeroBalanceEquation } from './HeroBalanceEquation'
import { HeroBalanceVisual } from './HeroBalanceVisual'
import { MarketingBrowserFrame } from './MarketingBrowserFrame'

const TABS = [
  {
    id: 'balance',
    label: 'True Balance',
    accent: 'indigo',
    title: 'One number that tells the truth',
    body: 'Cash in the bank minus what is already committed, plus expected receipts. True Balance rolls up every account and scope so you see what is genuinely available — not just what the bank app shows.',
  },
  {
    id: 'month',
    label: 'Through the month',
    accent: 'teal',
    title: 'Bills build through the month — then land in Due',
    body: 'Rent, payroll, and subscriptions accrue day by day. Watch commitments grow, see what is due soon, and mark items paid when they clear — so the dashboard always reflects reality.',
  },
  {
    id: 'reserve',
    label: 'Reserve Planner',
    accent: 'violet',
    title: 'Irregular bills, planned month by month',
    body: 'VAT, corporation tax, insurance renewals — add the bill, set the due date, and Reserve Planner works out how much to put aside each month. Track transfers and stay on target before the payment lands.',
  },
] as const

type TabId = (typeof TABS)[number]['id']

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
            True Balance sits alongside your bank — not instead of it. Update balances when you choose,
            and the dashboard shows what is spoken for, what is due, and what you can actually use.
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
                  <span>Reserve Planner</span>
                  <strong>£840 / mo</strong>
                </div>
                <ul className="marketing-reserve-preview-bills">
                  <li>
                    <span>VAT</span>
                    <span>£19,200</span>
                    <span className="marketing-reserve-preview-due">Jun</span>
                  </li>
                  <li>
                    <span>Corp tax</span>
                    <span>£8,400</span>
                    <span className="marketing-reserve-preview-due">Dec</span>
                  </li>
                  <li>
                    <span>Insurance</span>
                    <span>£2,100</span>
                    <span className="marketing-reserve-preview-due">Mar</span>
                  </li>
                </ul>
                <p className="marketing-reserve-preview-transfer">
                  Suggested transfer this month: <strong>£1,240</strong>
                </p>
              </div>
            )}
          </MarketingBrowserFrame>
        </div>
      </div>
    </section>
  )
}
