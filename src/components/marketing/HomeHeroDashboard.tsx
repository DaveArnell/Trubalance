/**
 * Compact Cash Prophet dashboard for the homepage hero.
 * Same layout and figures as the product monitor, drawn flat so it fills the card.
 */
const BUILDING = [
  { name: 'Business Rates', accrued: '£1,850', total: '£2,000', pct: 92.5 },
  { name: 'Loan', accrued: '£1,100', total: '£1,300', pct: 84.6 },
  { name: 'Insurance', accrued: '£180', total: '£400', pct: 45 },
  { name: 'Rent', accrued: '£2,200', total: '£5,800', pct: 37.9 },
] as const

const TREND =
  'M8 52 C 28 46, 48 48, 68 38 C 88 28, 108 34, 128 26 C 148 18, 168 22, 188 14 C 200 10, 212 12, 224 8'

const RESERVE =
  'M6 48 L 28 42 L 52 10 L 54 50 L 88 44 L 118 8 L 120 52 L 152 40 L 178 18 L 180 48 L 210 36 L 224 28'

export function HomeHeroDashboard() {
  return (
    <div
      className="home-hero-dash"
      aria-label="Cash Prophet dashboard: Cash Prophet Balance, accruing costs, due bills, balance trend and Reserve Planner"
    >
      <div className="home-hero-dash-hero">
        <p className="home-hero-dash-kicker">Cash Prophet Balance</p>
        <p className="home-hero-dash-amount">£21,880</p>
        <p className="home-hero-dash-delta">↑ Up £410 this week · Up £1,860 this month</p>
      </div>

      <div className="home-hero-dash-side">
        <div className="home-hero-dash-card">
          <h3>Business</h3>
          <div className="home-hero-dash-kv">
            <span>Bank balance</span>
            <strong>£33,350</strong>
          </div>
          <div className="home-hero-dash-kv">
            <span>Cash Prophet Balance</span>
            <strong className="home-hero-dash-kv--teal">£21,880</strong>
          </div>
        </div>
        <div className="home-hero-dash-card">
          <h3>Due bills</h3>
          <div className="home-hero-dash-kv">
            <span>VAT</span>
            <strong className="home-hero-dash-kv--due">£5,400</strong>
          </div>
          <div className="home-hero-dash-kv">
            <span>Corporation tax</span>
            <strong className="home-hero-dash-kv--due">£3,600</strong>
          </div>
          <div className="home-hero-dash-kv">
            <span>Public liability</span>
            <strong className="home-hero-dash-kv--due">£1,200</strong>
          </div>
        </div>
        <div className="home-hero-dash-card">
          <h3>Expected receipts</h3>
          <div className="home-hero-dash-kv">
            <span>Client payment</span>
            <strong className="home-hero-dash-kv--in">£4,800</strong>
          </div>
        </div>
      </div>

      <div className="home-hero-dash-card home-hero-dash-building">
        <h3>Building up</h3>
        <ul>
          {BUILDING.map((row) => (
            <li key={row.name} className="home-hero-dash-row">
              <span className="home-hero-dash-row-fill" style={{ width: `${row.pct}%` }} />
              <span className="home-hero-dash-row-name">{row.name}</span>
              <span className="home-hero-dash-row-amt">
                <strong>{row.accrued}</strong> / {row.total}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="home-hero-dash-charts">
        <div className="home-hero-dash-card home-hero-dash-chart">
          <h3>Cash Prophet Balance trend</h3>
          <svg viewBox="0 0 232 60" aria-hidden>
            <path d={`${TREND} L 224 58 L 8 58 Z`} fill="#0d8f5b" opacity="0.14" />
            <path d={TREND} fill="none" stroke="#0d8f5b" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </div>
        <div className="home-hero-dash-card home-hero-dash-chart">
          <h3>Reserve planner</h3>
          <svg viewBox="0 0 232 60" aria-hidden>
            <path d={RESERVE} fill="none" stroke="#16a34a" strokeWidth="2.2" strokeLinejoin="round" />
            <line x1="52" y1="10" x2="52" y2="50" stroke="#dc2626" strokeWidth="1.4" />
            <line x1="118" y1="8" x2="118" y2="52" stroke="#dc2626" strokeWidth="1.4" />
            <circle cx="52" cy="10" r="2.6" fill="#dc2626" />
            <circle cx="118" cy="8" r="2.6" fill="#dc2626" />
            <text x="52" y="7" textAnchor="middle" fontSize="8" fontWeight="700" fill="#dc2626">
              VAT
            </text>
            <text x="118" y="6" textAnchor="middle" fontSize="8" fontWeight="700" fill="#dc2626">
              Corp tax
            </text>
          </svg>
        </div>
      </div>
    </div>
  )
}
