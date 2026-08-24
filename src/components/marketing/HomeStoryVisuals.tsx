/**
 * Homepage story visuals: messy paper → organised Cash Prophet board.
 */

import { CompactKpiStrip } from '../CompactKpiStrip'
import { CASH_PROPHET_BALANCE } from '../../content/brandFoundation'
import { formatCurrency } from '../../utils/format'
import { HabitsTrendVisual } from './HomeMarketingVisuals'

const ACCRUE_ACCENT = '#0d8f5b'

const ACCRUING = [
  { dueInDays: 2, name: 'Rent', accrued: 2300, total: 2500 },
  { dueInDays: 10, name: 'Loan / finance', accrued: 800, total: 1200 },
  { dueInDays: 12, name: 'PAYE / HMRC', accrued: 900, total: 1800 },
  { dueInDays: 15, name: 'Utilities', accrued: 210, total: 420 },
  { dueInDays: 24, name: 'Payroll', accrued: 1680, total: 8400 },
] as const

const MONTHLY_TOTAL = ACCRUING.reduce((sum, row) => sum + row.total, 0)
const ACCRUED_NOW = ACCRUING.reduce((sum, row) => sum + row.accrued, 0)
const PER_DAY = Math.round(MONTHLY_TOTAL / 30)

const PROPHET_BALANCE = 12510
const PROPHET_DELTA = 1840

function dueInLabel(days: number) {
  if (days <= 0) return 'Due today'
  if (days === 1) return 'Due in 1 day'
  return `Due in ${days} days`
}

/** Hero: a glimpse of clutter becoming one organised number. */
export function HomeHeroClutterVisual() {
  return (
    <div className="home-hero-contrast" aria-label="Messy mental notes becoming an organised Cash Prophet Balance">
      <div className="home-hero-contrast-from">
        <p className="home-hero-contrast-kicker">In your head</p>
        <p className="home-hero-contrast-bank">£18,400</p>
        <p className="home-hero-contrast-bank-note">Bank balance</p>
        <ul className="home-hero-contrast-notes">
          <li>Rent 1st</li>
          <li>Wages 28th</li>
          <li>VAT?</li>
        </ul>
        <p className="home-hero-contrast-q">So how much do I actually have?</p>
      </div>
      <p className="home-hero-contrast-arrow" aria-hidden>
        →
      </p>
      <div className="home-hero-contrast-to">
        <p className="home-hero-contrast-kicker home-hero-contrast-kicker--green">Organised</p>
        <p className="home-hero-contrast-label">{CASH_PROPHET_BALANCE}</p>
        <p className="home-hero-contrast-amount">{formatCurrency(PROPHET_BALANCE)}</p>
        <p className="home-hero-contrast-delta">↑ {formatCurrency(PROPHET_DELTA)} this month</p>
      </div>
    </div>
  )
}

/** Realistic notebook of the mental calculation owners already do. */
export function HomeMessyPaper() {
  return (
    <figure
      className="home-paper"
      aria-label="Handwritten notes around a bank balance, showing the mental calculation owners currently do"
    >
      <div className="home-paper-sheet">
        <p className="home-paper-bank-label">Bank balance</p>
        <p className="home-paper-bank">{formatCurrency(18400)}</p>

        <ul className="home-paper-notes">
          <li className="home-paper-note home-paper-note--rent">
            <strong>Rent</strong>
            <span>£3,000</span>
            <span>1st</span>
          </li>
          <li className="home-paper-note home-paper-note--wages">
            <strong>Wages</strong>
            <span>£9,000</span>
            <span>28th</span>
          </li>
          <li className="home-paper-note home-paper-note--utils">
            <strong>Utilities</strong>
            <span>£650?</span>
            <span>20th?</span>
          </li>
          <li className="home-paper-note home-paper-note--vat">
            <strong>VAT?</strong>
          </li>
          <li className="home-paper-note home-paper-note--ins">
            <strong>Insurance</strong>
            <span>£2,400 yearly</span>
          </li>
          <li className="home-paper-note home-paper-note--repairs">
            <strong>Repairs / equipment?</strong>
            <span>How much should I put aside?</span>
          </li>
        </ul>

        <p className="home-paper-ask home-paper-ask--spoken">How much is already spoken for?</p>
        <p className="home-paper-ask home-paper-ask--aside">How much should I be putting aside?</p>
        <p className="home-paper-ask home-paper-ask--main">So how much do I actually have today?</p>
      </div>
    </figure>
  )
}

function HomeAccruingBars() {
  return (
    <div className="home-dash home-dash--cards home-dash--accruing">
      <div className="home-dash-hero home-dash-hero--accruing">
        <p className="home-snap-label home-snap-label--teal">Monthly accruing costs</p>
        <div className="home-dash-kpis">
          <CompactKpiStrip
            items={[
              { label: 'Monthly total', value: formatCurrency(MONTHLY_TOTAL) },
              { label: 'Accrued now', value: formatCurrency(ACCRUED_NOW), emphasis: true },
              { label: 'Per day', value: formatCurrency(PER_DAY) },
            ]}
          />
        </div>
      </div>
      <ul className="home-dash-cards home-dash-cards--bars">
        {ACCRUING.map((row) => {
          const progress = row.accrued / row.total
          return (
            <li key={row.name} className="home-accrue-row">
              <div
                className="home-accrue-row-fill"
                style={{ width: `${Math.round(progress * 100)}%`, background: ACCRUE_ACCENT }}
                aria-hidden
              />
              <span className="home-accrue-row-due">{dueInLabel(row.dueInDays)}</span>
              <span className="home-accrue-row-name">{row.name}</span>
              <span className="home-accrue-row-amount">
                <strong>{formatCurrency(row.accrued)}</strong>
                <span> / {formatCurrency(row.total)}</span>
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/** Condensed Reserve Planner sawtooth: build, bill, drop, build again. */
function HomeReserveSawtooth() {
  return (
    <figure className="home-order-card home-order-reserve" aria-label="Reserve Planner: money builds, a larger bill is paid, then it builds again">
      <p className="home-snap-label home-snap-label--teal">Reserve Planner</p>
      <p className="home-order-card-lead">Builds gradually, drops when a larger bill is paid, then starts again.</p>
      <svg className="home-reserve-svg" viewBox="0 0 360 130" role="img" aria-hidden>
        <line x1="16" y1="108" x2="344" y2="108" className="home-reserve-axis" />
        <path
          className="home-reserve-area"
          d="M16 96 L52 72 L52 88 L96 54 L96 90 L148 48 L148 86 L200 40 L200 78 L252 36 L252 70 L304 28 L304 66 L344 44 L344 108 L16 108 Z"
        />
        <path
          className="home-reserve-line"
          d="M16 96 L52 72 L52 88 L96 54 L96 90 L148 48 L148 86 L200 40 L200 78 L252 36 L252 70 L304 28 L304 66 L344 44"
        />
        <text x="96" y="18" className="home-reserve-label" textAnchor="middle">
          VAT
        </text>
        <text x="200" y="18" className="home-reserve-label" textAnchor="middle">
          Insurance
        </text>
        <text x="304" y="18" className="home-reserve-label" textAnchor="middle">
          Tax
        </text>
      </svg>
    </figure>
  )
}

/** Organised product board: one number, accruing costs, reserves, trend. */
export function HomeOrganisedBoard() {
  return (
    <div className="home-order-board" aria-label="Organised Cash Prophet view: balance, accruing costs, reserves and trend">
      <div className="home-order-hero">
        <p className="home-order-hero-label">{CASH_PROPHET_BALANCE}</p>
        <p className="home-order-hero-amount">{formatCurrency(PROPHET_BALANCE)}</p>
        <p className="home-order-hero-delta">↑ {formatCurrency(PROPHET_DELTA)} this month</p>
      </div>
      <HomeAccruingBars />
      <HomeReserveSawtooth />
      <div className="home-order-trend">
        <p className="home-snap-label home-snap-label--teal">Cash Prophet Balance trend</p>
        <p className="home-order-card-lead">Where you are today, and whether that position is improving.</p>
        <HabitsTrendVisual />
      </div>
    </div>
  )
}
