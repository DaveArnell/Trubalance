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
    body: 'Cash minus what’s spoken for, plus what’s coming in.',
  },
  {
    id: 'month',
    label: 'Through the month',
    accent: 'teal',
    title: 'Bills build — then land in Due',
    body: 'Watch commitments accrue day by day. No surprises.',
  },
  {
    id: 'reserve',
    label: 'Reserve Planner',
    accent: 'violet',
    title: 'Irregular bills, on autopilot',
    body: 'VAT, tax, insurance — how much to put aside each month, kept separate for when they\u2019re due.',
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
          <h2 id="marketing-showcase-heading">Bank balance → real clarity</h2>
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
              <div className="marketing-reserve-preview marketing-reserve-preview--pop" role="img" aria-label="Reserve planner preview">
                <div className="marketing-reserve-preview-head">
                  <span>Reserve Planner</span>
                  <strong>£840 / mo</strong>
                </div>
                <ul className="marketing-reserve-preview-bills">
                  <li><span>VAT</span><span>£19,200</span><span className="marketing-reserve-preview-due">Jun</span></li>
                  <li><span>Corp tax</span><span>£8,400</span><span className="marketing-reserve-preview-due">Dec</span></li>
                  <li><span>Insurance</span><span>£2,100</span><span className="marketing-reserve-preview-due">Mar</span></li>
                </ul>
                <p className="marketing-reserve-preview-transfer">
                  This month: <strong>£1,240</strong>
                </p>
              </div>
            )}
          </MarketingBrowserFrame>
        </div>
      </div>
    </section>
  )
}
