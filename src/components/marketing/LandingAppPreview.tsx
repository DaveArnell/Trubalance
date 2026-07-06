import { Link } from 'react-router-dom'
import { MarketingBrowserFrame } from './MarketingBrowserFrame'

const FORECAST_POINTS_CASH =
  '28,72 48,68 72,58 96,52 120,48 144,55 168,62 192,58 216,52 240,46 264,42 288,38 312,36'
const FORECAST_POINTS_TRUE =
  '28,78 48,76 72,74 96,72 120,70 144,68 168,66 192,64 216,62 240,60 264,58 288,56 312,54'

function OverviewWidget() {
  return (
    <div className="landing-preview-widget landing-preview-widget--overview">
      <div className="landing-preview-widget-head">
        <span className="landing-preview-scope">Riverside Building Ltd</span>
        <span className="landing-preview-badge">Demo</span>
      </div>
      <div className="landing-preview-kpis">
        <div className="landing-preview-kpi">
          <span className="landing-preview-kpi-label">Current account</span>
          <strong>£34,200</strong>
        </div>
        <div className="landing-preview-kpi landing-preview-kpi--committed">
          <span className="landing-preview-kpi-label">Committed</span>
          <strong>£18,400</strong>
        </div>
        <div className="landing-preview-kpi landing-preview-kpi--true">
          <span className="landing-preview-kpi-label">True Balance</span>
          <strong>£19,850</strong>
        </div>
      </div>
    </div>
  )
}

function CommittedWidget() {
  return (
    <div className="landing-preview-widget landing-preview-widget--committed">
      <p className="landing-preview-widget-title">Committed funds</p>
      <div className="landing-preview-rows">
        <div className="landing-preview-row">
          <span className="landing-preview-row-label">Payroll</span>
          <span className="landing-preview-row-meta">Building up</span>
          <span className="landing-preview-row-value">£4,960</span>
        </div>
        <div className="landing-preview-row">
          <span className="landing-preview-row-label">Replacement van</span>
          <span className="landing-preview-row-meta">Planned</span>
          <span className="landing-preview-row-value">£7,330</span>
        </div>
        <div className="landing-preview-row landing-preview-row--due">
          <span className="landing-preview-row-label">CIS / PAYE</span>
          <span className="landing-preview-row-meta">Due</span>
          <span className="landing-preview-row-value">£1,450</span>
        </div>
        <div className="landing-preview-row">
          <span className="landing-preview-row-label">Extension, interim</span>
          <span className="landing-preview-row-meta">Expected</span>
          <span className="landing-preview-row-value">£8,200</span>
        </div>
      </div>
    </div>
  )
}

function ForecastWidget() {
  return (
    <div className="landing-preview-widget landing-preview-widget--forecast">
      <div className="landing-preview-widget-head">
        <p className="landing-preview-widget-title">Cash outlook · 90 days</p>
        <span className="landing-preview-legend">
          <i className="landing-preview-legend-cash" /> Cash
          <i className="landing-preview-legend-true" /> True Balance
        </span>
      </div>
      <svg className="landing-preview-chart" viewBox="0 0 340 100" aria-hidden>
        <line x1="20" y1="82" x2="320" y2="82" className="landing-preview-chart-axis" />
        <polyline className="landing-preview-chart-line landing-preview-chart-line--cash" points={FORECAST_POINTS_CASH} />
        <polyline className="landing-preview-chart-line landing-preview-chart-line--true" points={FORECAST_POINTS_TRUE} />
        <text x="20" y="96" className="landing-preview-chart-label">
          Today
        </text>
        <text x="320" y="96" className="landing-preview-chart-label" textAnchor="end">
          90 days
        </text>
      </svg>
      <p className="landing-preview-chart-note muted">
        Scheduled costs, receipts and the van purchase, from the trades demo.
      </p>
    </div>
  )
}

interface LandingAppPreviewProps {
  variant?: 'section'
}

export function LandingAppPreview({ variant = 'section' }: LandingAppPreviewProps) {
  if (variant !== 'section') {
    return null
  }

  return (
    <section className="landing-preview-section" aria-labelledby="landing-preview-heading">
      <div className="marketing-section-inner">
        <div className="marketing-section-head marketing-section-head--center">
          <p className="marketing-eyebrow marketing-eyebrow--vivid">Inside the app</p>
          <h2 id="landing-preview-heading">The parts that matter, not the whole dashboard</h2>
          <p className="marketing-section-lead">
            The live workspace has a lot going on. On the marketing site we show individual
            widgets, the numbers and panels owners actually use, from the Riverside Building demo.
          </p>
        </div>

        <MarketingBrowserFrame>
          <div className="landing-preview landing-preview--section">
            <OverviewWidget />
            <CommittedWidget />
            <ForecastWidget />
          </div>
        </MarketingBrowserFrame>

        <div className="landing-preview-footer">
          <p className="muted">
            Pick a café, trades business or leisure group. Every page is live in the demo.
          </p>
          <Link to="/see-how-it-works" className="btn-primary btn-large">
            Explore the demo
          </Link>
        </div>
      </div>
    </section>
  )
}
