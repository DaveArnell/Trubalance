import { useMemo } from 'react'
import type { AppState, GraphRange, IncomePattern, ViewScope } from '../types'
import { formatCurrency } from '../utils/format'
import { formatAxisCurrency, computeTrendYDomain } from '../utils/chartFormat'
import {
  buildForwardCashFlowProjection,
  cashOutlookHorizonDays,
  getIncomePatternForScope,
  type CashFlowEvent,
} from '../utils/forwardCashFlow'
import { formatProjectionDateLabel } from '../utils/trendProjection'
import { getScopeItemLabel } from '../utils/scope'
import { HelpButton } from './HelpButton'
import { WIDGET_HELP } from '../content/livingDashboard'

const PAD = { top: 20, right: 16, bottom: 48, left: 56 }

function incomePatternLabel(pattern: IncomePattern | 'mixed'): string {
  if (pattern === 'lumpy') return 'Lumpy / irregular income'
  if (pattern === 'mixed') return 'Mixed income patterns'
  return 'Steady / daily income'
}

function incomePatternHint(pattern: IncomePattern | 'mixed'): string {
  if (pattern === 'lumpy') {
    return 'Best suited for this view — add expected receipts with dates so large payments show on the outlook alongside your scheduled costs.'
  }
  if (pattern === 'mixed') {
    return 'Set income pattern per business in Settings → Structure for tailored guidance.'
  }
  return 'This outlook shows scheduled outgoings only. Daily income is not plotted — your real balance will trend higher than shown here. Use the Trends page for a more accurate picture.'
}

function eventTone(category: CashFlowEvent['category']): string {
  switch (category) {
    case 'receipt':
      return 'cash-outlook-event--in'
    case 'reserve_transfer':
      return 'cash-outlook-event--transfer'
    default:
      return 'cash-outlook-event--out'
  }
}

interface CashOutlookPanelProps {
  state: AppState
  viewScope: ViewScope
  graphRange: GraphRange
  onRangeChange?: (range: GraphRange) => void
  embedded?: boolean
  openHelp?: string | null
  setOpenHelp?: (id: string | null) => void
}

const OUTLOOK_RANGES: { key: GraphRange; label: string }[] = [
  { key: '30d', label: '30 days' },
  { key: '90d', label: '90 days' },
]

export function CashOutlookPanel({
  state,
  viewScope,
  graphRange,
  onRangeChange,
  embedded = false,
  openHelp = null,
  setOpenHelp = () => {},
}: CashOutlookPanelProps) {
  const outlookRange = graphRange === '30d' ? '30d' : '90d'

  const rangeToggle = onRangeChange ? (
    <div className="range-toggles range-toggles--compact cash-outlook-range">
      {OUTLOOK_RANGES.map((range) => (
        <button
          key={range.key}
          type="button"
          className={outlookRange === range.key ? 'active' : ''}
          onClick={() => onRangeChange(range.key)}
        >
          {range.label}
        </button>
      ))}
    </div>
  ) : null

  const horizonDays = cashOutlookHorizonDays(outlookRange)
  const scopeLabel = getScopeItemLabel(state, viewScope.type, viewScope.id)

  const projection = useMemo(
    () => buildForwardCashFlowProjection(state, viewScope, horizonDays),
    [horizonDays, state, viewScope],
  )

  const incomePattern = getIncomePatternForScope(state, viewScope)

  const chart = useMemo(() => {
    const width = 640
    const height = 220
    const plotW = width - PAD.left - PAD.right
    const plotH = height - PAD.top - PAD.bottom

    const cashValues = projection.days.map((d) => d.balance)
    const trueValues = projection.days.map((d) => d.trueBalance)
    const showTrueBalance = projection.days.some(
      (day) => Math.abs(day.trueBalance - day.balance) > 0.5,
    )
    const allValues = showTrueBalance
      ? [projection.openingCurrentBalance, projection.openingTrueBalance, ...cashValues, ...trueValues]
      : [projection.openingCurrentBalance, ...cashValues]
    const minVal = Math.min(...allValues)
    const maxVal = Math.max(...allValues)
    const { yMin, yMax } = computeTrendYDomain(minVal, maxVal, 0.1)

    const xForIndex = (index: number) => PAD.left + (index / Math.max(1, projection.days.length - 1)) * plotW
    const yForValue = (value: number) => PAD.top + plotH - ((value - yMin) / Math.max(1, yMax - yMin)) * plotH

    const linePoints = projection.days
      .map((day, index) => `${xForIndex(index)},${yForValue(day.balance)}`)
      .join(' ')

    const trueLinePoints = showTrueBalance
      ? projection.days
          .map((day, index) => `${xForIndex(index)},${yForValue(day.trueBalance)}`)
          .join(' ')
      : null

    const zeroY =
      yMin < 0 && yMax > 0 ? yForValue(0) : null

    const eventMarkers = projection.events.map((event) => {
      const dayIndex = projection.days.findIndex((d) => d.date === event.date)
      if (dayIndex < 0) return null
      return {
        event,
        x: xForIndex(dayIndex),
        y: yForValue(projection.days[dayIndex]!.balance),
      }
    }).filter(Boolean) as { event: CashFlowEvent; x: number; y: number }[]

    const yTicks = [yMin, (yMin + yMax) / 2, yMax]

    const startDate = projection.startDate
    const endDate = projection.days[projection.days.length - 1]?.date ?? startDate
    const midIndex = Math.floor((projection.days.length - 1) / 2)
    const midDate = projection.days[midIndex]?.date ?? startDate

    const xTicks = [
      { index: 0, date: startDate, label: 'Today', sublabel: formatProjectionDateLabel(startDate) },
      ...(projection.days.length > 14
        ? [{ index: midIndex, date: midDate, label: formatProjectionDateLabel(midDate), sublabel: null }]
        : []),
      {
        index: projection.days.length - 1,
        date: endDate,
        label: formatProjectionDateLabel(endDate),
        sublabel: null,
      },
    ]

    return {
      width,
      height,
      plotW,
      plotH,
      linePoints,
      trueLinePoints,
      showTrueBalance,
      zeroY,
      eventMarkers,
      yTicks,
      yForValue,
      xForIndex,
      startDate,
      endDate,
      xTicks,
    }
  }, [projection])

  const body = (
    <div className="cash-outlook-body">
      <div className="cash-outlook-summary">
        <div className="cash-outlook-kpi">
          <span className="cash-outlook-kpi-label">Current account now</span>
          <strong className="cash-outlook-kpi-value">{formatCurrency(projection.openingCurrentBalance)}</strong>
        </div>
        <div className="cash-outlook-kpi">
          <span className="cash-outlook-kpi-label">True Balance now</span>
          <strong className="cash-outlook-kpi-value">{formatCurrency(projection.openingTrueBalance)}</strong>
        </div>
        <div className="cash-outlook-kpi">
          <span className="cash-outlook-kpi-label">Lowest cash in outlook</span>
          <strong
            className={`cash-outlook-kpi-value${projection.lowestBalance < 0 ? ' cash-outlook-kpi-value--danger' : ''}`}
          >
            {formatCurrency(projection.lowestBalance)}
          </strong>
          <span className="cash-outlook-kpi-meta muted">{formatProjectionDateLabel(projection.lowestBalanceDate)}</span>
        </div>
        <div className="cash-outlook-kpi">
          <span className="cash-outlook-kpi-label">End of period (cash)</span>
          <strong className="cash-outlook-kpi-value">{formatCurrency(projection.endingBalance)}</strong>
          <span className="cash-outlook-kpi-meta muted">
            {formatProjectionDateLabel(chart.endDate)}
          </span>
        </div>
        {chart.showTrueBalance ? (
          <div className="cash-outlook-kpi">
            <span className="cash-outlook-kpi-label">End of period (True Balance)</span>
            <strong className="cash-outlook-kpi-value">{formatCurrency(projection.endingTrueBalance)}</strong>
            <span className="cash-outlook-kpi-meta muted">
              {formatProjectionDateLabel(chart.endDate)}
            </span>
          </div>
        ) : null}
      </div>

      <p className="cash-outlook-date-range" aria-hidden>
        <span className="cash-outlook-date-range-from">
          <span className="cash-outlook-date-range-tag">From</span>
          {formatProjectionDateLabel(chart.startDate)}
          <span className="cash-outlook-date-range-note">(today)</span>
        </span>
        <span className="cash-outlook-date-range-arrow" aria-hidden>
          →
        </span>
        <span className="cash-outlook-date-range-to">
          <span className="cash-outlook-date-range-tag">To</span>
          {formatProjectionDateLabel(chart.endDate)}
        </span>
      </p>

      <p className="cash-outlook-pattern muted">
        <strong>{incomePatternLabel(incomePattern)}</strong> · {incomePatternHint(incomePattern)}
      </p>

      <div className="cash-outlook-chart-wrap">
        <svg
          className="cash-outlook-chart"
          viewBox={`0 0 ${chart.width} ${chart.height}`}
          role="img"
          aria-label={`Current account outlook for ${scopeLabel} over ${horizonDays} days`}
        >
          {chart.zeroY != null && (
            <line
              x1={PAD.left}
              x2={PAD.left + chart.plotW}
              y1={chart.zeroY}
              y2={chart.zeroY}
              className="cash-outlook-zero-line"
            />
          )}

          {chart.yTicks.map((tick) => (
            <g key={tick}>
              <line
                x1={PAD.left}
                x2={PAD.left + chart.plotW}
                y1={chart.yForValue(tick)}
                y2={chart.yForValue(tick)}
                className="cash-outlook-grid-line"
              />
              <text x={PAD.left - 8} y={chart.yForValue(tick) + 4} textAnchor="end" className="cash-outlook-axis-label">
                {formatAxisCurrency(tick)}
              </text>
            </g>
          ))}

          <line
            x1={PAD.left}
            x2={PAD.left + chart.plotW}
            y1={PAD.top + chart.plotH}
            y2={PAD.top + chart.plotH}
            className="cash-outlook-axis-line"
          />

          <line
            x1={PAD.left}
            x2={PAD.left}
            y1={PAD.top}
            y2={PAD.top + chart.plotH}
            className="cash-outlook-today-line"
          />

          {chart.xTicks.map((tick) => {
            const x = chart.xForIndex(tick.index)
            const y = PAD.top + chart.plotH + 14
            return (
              <g key={`${tick.date}-${tick.index}`}>
                <line
                  x1={x}
                  x2={x}
                  y1={PAD.top + chart.plotH}
                  y2={PAD.top + chart.plotH + 4}
                  className="cash-outlook-axis-tick"
                />
                <text
                  x={x}
                  y={y}
                  textAnchor={tick.index === 0 ? 'start' : tick.index === projection.days.length - 1 ? 'end' : 'middle'}
                  className="cash-outlook-axis-label cash-outlook-axis-label--x"
                >
                  {tick.label}
                </text>
                {tick.sublabel ? (
                  <text
                    x={x}
                    y={y + 11}
                    textAnchor="start"
                    className="cash-outlook-axis-label cash-outlook-axis-label--x-sub"
                  >
                    {tick.sublabel}
                  </text>
                ) : null}
              </g>
            )
          })}

          <polyline className="cash-outlook-line cash-outlook-line--cash" points={chart.linePoints} fill="none" />
          {chart.trueLinePoints ? (
            <polyline
              className="cash-outlook-line cash-outlook-line--true-balance"
              points={chart.trueLinePoints}
              fill="none"
            />
          ) : null}

          {chart.eventMarkers.map(({ event, x, y }) => (
            <circle
              key={`${event.date}-${event.label}-${event.amount}`}
              cx={x}
              cy={y}
              r={event.amount > 0 ? 4 : 3.5}
              className={`cash-outlook-event-dot ${eventTone(event.category)}`}
            >
              <title>
                {formatProjectionDateLabel(event.date)} · {event.label} ·{' '}
                {event.amount > 0 ? '+' : ''}
                {formatCurrency(event.amount)}
              </title>
            </circle>
          ))}
        </svg>
      </div>

      {chart.showTrueBalance ? (
        <p className="cash-outlook-chart-legend" aria-hidden>
          <span className="cash-outlook-chart-legend--cash">
            <i /> Current account
          </span>
          <span className="cash-outlook-chart-legend--true">
            <i /> True Balance (includes receipt build-up)
          </span>
        </p>
      ) : null}

      <div className="cash-outlook-events">
        <h3 className="cash-outlook-events-title">Scheduled movements</h3>
        {projection.events.length === 0 ? (
          <p className="muted cash-outlook-empty">No dated costs or receipts in this period.</p>
        ) : (
          <ul className="cash-outlook-event-list">
            {projection.events.map((event) => (
              <li key={`${event.date}-${event.label}-${event.amount}`} className={`cash-outlook-event ${eventTone(event.category)}`}>
                <span className="cash-outlook-event-date">{formatProjectionDateLabel(event.date)}</span>
                <span className="cash-outlook-event-label">{event.label}</span>
                <span className="cash-outlook-event-amount">
                  {event.amount > 0 ? '+' : ''}
                  {formatCurrency(event.amount)}
                </span>
              </li>
            ))}
          </ul>
        )}

        {projection.unscheduledReceipts.length > 0 && (
          <div className="cash-outlook-unscheduled">
            <p className="cash-outlook-unscheduled-title">
              Receipts without a date ({projection.unscheduledReceipts.length})
            </p>
            <p className="muted cash-outlook-unscheduled-hint">
              {incomePattern === 'lumpy'
                ? 'Irregular businesses rely on these — add a date in Expected receipts so they appear on the chart.'
                : 'Add expected dates so these appear on the outlook.'}
            </p>
            <ul className="cash-outlook-event-list cash-outlook-event-list--muted">
              {projection.unscheduledReceipts.map((item) => (
                <li key={item.id} className="cash-outlook-event">
                  <span className="cash-outlook-event-label">{item.label}</span>
                  <span className="cash-outlook-event-amount">+{formatCurrency(item.amount)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )

  if (embedded) {
    return (
      <div className="cash-outlook-embedded" data-tour="cash-outlook">
        <div className="cash-outlook-head">
          <div>
            <h2 className="cash-outlook-title">Cash outlook</h2>
            <p className="muted cash-outlook-lead">
              {scopeLabel} · current account · next {horizonDays} days
            </p>
          </div>
          <div className="cash-outlook-head-actions">
            {rangeToggle}
            <HelpButton
              id="cash-outlook"
              openHelp={openHelp}
              setOpenHelp={setOpenHelp}
              text={WIDGET_HELP.cashOutlook}
            />
          </div>
        </div>
        {body}
      </div>
    )
  }

  return (
    <section className="card cash-outlook-card" data-tour="cash-outlook">
      <div className="card-head card-head-compact">
        <div>
          <h2>Cash outlook</h2>
          <p className="muted cash-outlook-lead">
            Forward current-account balance from scheduled costs, reserve transfers, and expected receipts.
          </p>
        </div>
      </div>
      {body}
    </section>
  )
}
