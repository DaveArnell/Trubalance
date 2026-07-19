import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'

const TRUE_BALANCE_MID = 7_500
const TRUE_BALANCE_SWING = 2_500
const MONTH_DAYS = 30
const CYCLE_MS = 18_000
const POT_MIN_SCALE = 0.56
const POT_SCALE_RANGE = 0.44

const BILLS = [
  { id: 'vat', label: 'VAT', dueDay: 5, amount: 8_400, color: '#ef4444' },
  { id: 'utilities', label: 'Utilities', dueDay: 10, amount: 2_100, color: '#fb923c' },
  { id: 'rent', label: 'Rent', dueDay: 15, amount: 18_200, color: '#f97316' },
  { id: 'paye', label: 'PAYE', dueDay: 22, amount: 6_200, color: '#e11d48' },
  { id: 'payroll', label: 'Payroll', dueDay: 28, amount: 24_800, color: '#be123c' },
] as const

type Bill = (typeof BILLS)[number]

const CHART = { left: 28, right: 352, top: 18, bottom: 92, padBottom: 108 }

function formatGbp(value: number) {
  return `£${Math.round(value).toLocaleString('en-GB')}`
}

function formatShort(value: number) {
  if (value >= 1000) return `£${(value / 1000).toFixed(1)}k`
  return `£${value}`
}

function dayToX(day: number) {
  return CHART.left + ((day - 1) / (MONTH_DAYS - 1)) * (CHART.right - CHART.left)
}

function dayToPercent(day: number) {
  return ((day - 1) / (MONTH_DAYS - 1)) * 100
}

function valueToY(value: number, min: number, max: number) {
  const t = (value - min) / (max - min)
  return CHART.bottom - t * (CHART.bottom - CHART.top)
}

/**
 * Days from payment until the bill is due again (next calendar due day).
 */
function daysInCycleAfterPayment(paidDay: number, dueDay: number): number {
  if (paidDay < dueDay) return dueDay - paidDay
  return MONTH_DAYS - paidDay + dueDay
}

/**
 * Each bill accrues toward its due day. On calendar day 1, a bill due day 5 is already
 * part-way through the cycle (carried over from the previous month).
 */
function billCycleDay(day: number, dueDay: number): number {
  if (day < dueDay) {
    const daysUntilDue = dueDay - day + 1
    return MONTH_DAYS - daysUntilDue
  }
  return MONTH_DAYS
}

function billProgress(bill: Bill, ctx: BillLedgerContext): number {
  const state = billLedgerState(bill, ctx)

  if (state === 'due') return 1

  if (state === 'building') {
    return ctx.poppingId === bill.id ? 1 : buildingCycleProgress(bill, ctx.day)
  }

  const paidDay = ctx.paymentDayByBill[bill.id] ?? bill.dueDay + DUE_HOLD_DAYS
  return regrowCycleProgress(ctx.day, paidDay, bill.dueDay)
}

/** Box size follows cycle day only (1 = smallest, 30 = largest) — not bill amount. */
function potScale(progress: number): number {
  return POT_MIN_SCALE + progress * POT_SCALE_RANGE
}

/** Simulated days a bill sits in Due before it is marked paid (matches animation pacing). */
const DUE_HOLD_DAYS = 2.5

type BillLedgerContext = {
  day: number
  poppingId: string | null
  paidBillIds: ReadonlySet<string>
  paymentDayByBill: Readonly<Record<string, number>>
}

type BillLedgerState = 'building' | 'due' | 'regrowing'

function billLedgerState(bill: Bill, ctx: BillLedgerContext): BillLedgerState {
  if (ctx.paidBillIds.has(bill.id)) return 'regrowing'

  if (ctx.day < bill.dueDay) return 'building'

  if (ctx.poppingId === bill.id) return 'building'

  if (ctx.day < bill.dueDay + DUE_HOLD_DAYS) return 'due'

  return 'regrowing'
}

function buildingCycleProgress(bill: Bill, day: number): number {
  return billCycleDay(day, bill.dueDay) / MONTH_DAYS
}

/** Linear accrual from the moment the bill leaves the account until the next due date. */
function regrowCycleProgress(day: number, paidDay: number, dueDay: number): number {
  if (day <= paidDay) return 0
  const cycleDays = daysInCycleAfterPayment(paidDay, dueDay)
  if (cycleDays <= 0) return 1
  return Math.min(1, (day - paidDay) / cycleDays)
}

function accruedForBill(bill: Bill, ctx: BillLedgerContext): number {
  const state = billLedgerState(bill, ctx)

  if (state === 'due') return 0

  if (state === 'building') {
    const progress =
      ctx.poppingId === bill.id ? 1 : buildingCycleProgress(bill, ctx.day)
    return bill.amount * progress
  }

  const paidDay = ctx.paymentDayByBill[bill.id] ?? bill.dueDay + DUE_HOLD_DAYS
  return bill.amount * regrowCycleProgress(ctx.day, paidDay, bill.dueDay)
}

function dueForBill(bill: Bill, ctx: BillLedgerContext): number {
  return billLedgerState(bill, ctx) === 'due' ? bill.amount : 0
}

function totalAccrued(ctx: BillLedgerContext): number {
  return BILLS.reduce((sum, bill) => sum + accruedForBill(bill, ctx), 0)
}

function totalDue(ctx: BillLedgerContext): number {
  return BILLS.reduce((sum, bill) => sum + dueForBill(bill, ctx), 0)
}

function totalCommitted(ctx: BillLedgerContext): number {
  return totalAccrued(ctx) + totalDue(ctx)
}

function ledgerContextForDay(
  day: number,
  poppingId: string | null,
  paidBillIds: ReadonlySet<string>,
  paymentDayByBill: Readonly<Record<string, number>>,
): BillLedgerContext {
  return { day, poppingId, paidBillIds, paymentDayByBill }
}

/** Full-month outline for chart scale (deterministic payment pacing). */
function ledgerContextForMonthOutline(simDay: number): BillLedgerContext {
  const paidBillIds = new Set<string>()
  const paymentDayByBill: Record<string, number> = {}

  for (const bill of BILLS) {
    const paymentDay = bill.dueDay + DUE_HOLD_DAYS
    if (simDay >= paymentDay) {
      paidBillIds.add(bill.id)
      paymentDayByBill[bill.id] = paymentDay
    }
  }

  return { day: simDay, poppingId: null, paidBillIds, paymentDayByBill }
}

/** Other trading activity — low-frequency drift so the current account line stays smooth. */
function backgroundBankActivity(day: number): number {
  return Math.sin(day * 0.34) * 1_800 + Math.cos(day * 0.19) * 1_100 + 900
}

/** True Balance floats calmly — gap between bank and committed ≈ true + background activity. */
function trueBalanceAt(day: number): number {
  return TRUE_BALANCE_MID + Math.sin(day * 0.38) * TRUE_BALANCE_SWING
}

/** Pots stay fixed on their due-day column for the whole cycle. */
function potColumnPercent(bill: Bill): number {
  return dayToPercent(bill.dueDay)
}

function hasCrossedDueDay(bill: Bill, day: number, lastDay: number): boolean {
  return lastDay < bill.dueDay && day >= bill.dueDay
}

function buildMonthSeries() {
  const bank: number[] = []
  const truth: number[] = []
  const accrued: number[] = []

  for (let d = 1; d <= MONTH_DAYS; d += 1) {
    const ctx = ledgerContextForMonthOutline(d)
    const committedVal = totalCommitted(ctx)
    const truthVal = trueBalanceAt(d)
    const bankVal = truthVal + committedVal + backgroundBankActivity(d)
    bank.push(bankVal)
    truth.push(truthVal)
    // Committed line = gap between current account and True Balance
    accrued.push(bankVal - truthVal)
  }

  const all = [...bank, ...truth, ...accrued]
  return {
    bank,
    truth,
    accrued,
    min: Math.min(...all) - 2_500,
    max: Math.max(...all) + 2_500,
  }
}

function interpolateSeriesAtDay(series: number[], day: number): number {
  const clamped = Math.max(1, Math.min(MONTH_DAYS, day))
  const idx = clamped - 1
  const i0 = Math.floor(idx)
  const i1 = Math.min(MONTH_DAYS - 1, Math.ceil(idx))
  if (i0 === i1) return series[i0]!
  const frac = idx - i0
  return series[i0]! * (1 - frac) + series[i1]! * frac
}

/** Smooth predetermined curves — avoids jitter from live bill animation state. */
function buildSmoothChartPaths(day: number) {
  const samples = Math.max(2, Math.ceil(day * 8))
  const bankSeries: number[] = []
  const truthSeries: number[] = []
  const accruedSeries: number[] = []

  for (let i = 0; i <= samples; i += 1) {
    const simDay = 1 + (i / samples) * (day - 1)
    bankSeries.push(interpolateSeriesAtDay(MONTH_SERIES.bank, simDay))
    truthSeries.push(interpolateSeriesAtDay(MONTH_SERIES.truth, simDay))
    accruedSeries.push(interpolateSeriesAtDay(MONTH_SERIES.accrued, simDay))
  }

  return { bankSeries, truthSeries, accruedSeries }
}

function seriesToPoints(
  series: number[],
  day: number,
  min: number,
  max: number,
): string {
  const samples = series.length
  const dayAtIndex = (index: number) =>
    samples <= 1 ? day : 1 + (index / (samples - 1)) * (day - 1)

  return series
    .map((value, index) => {
      const x = dayToX(dayAtIndex(index))
      const y = valueToY(value, min, max)
      return `${x.toFixed(2)},${y.toFixed(2)}`
    })
    .join(' ')
}

const MONTH_SERIES = buildMonthSeries()

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])
  return reduced
}

function useMonthSimulation(active: boolean) {
  const [day, setDay] = useState(1)
  const [poppingId, setPoppingId] = useState<string | null>(null)
  const [paidBillIds, setPaidBillIds] = useState<Set<string>>(() => new Set())
  const [paymentDayByBill, setPaymentDayByBill] = useState<Record<string, number>>({})
  const cycleRef = useRef(0)
  const firedRef = useRef<Set<string>>(new Set())
  const lastDayRef = useRef(1)
  const dayRef = useRef(1)
  const timeoutsRef = useRef<number[]>([])

  useEffect(() => {
    if (!active) {
      setDay(1)
      setPoppingId(null)
      setPaidBillIds(new Set())
      setPaymentDayByBill({})
      lastDayRef.current = 1
      dayRef.current = 1
      return
    }

    const start = performance.now()
    let raf = 0

    const clearTimers = () => {
      for (const id of timeoutsRef.current) window.clearTimeout(id)
      timeoutsRef.current = []
    }

    const schedule = (fn: () => void, ms: number) => {
      const id = window.setTimeout(fn, ms)
      timeoutsRef.current.push(id)
    }

    const resetMonth = () => {
      clearTimers()
      firedRef.current = new Set()
      lastDayRef.current = 1
      dayRef.current = 1
      setPoppingId(null)
      setPaidBillIds(new Set())
      setPaymentDayByBill({})
    }

    const tick = (now: number) => {
      const elapsed = now - start
      const cycle = Math.floor(elapsed / CYCLE_MS)
      if (cycle !== cycleRef.current) {
        cycleRef.current = cycle
        resetMonth()
      }

      const phase = (elapsed % CYCLE_MS) / CYCLE_MS
      const nextDay = 1 + phase * (MONTH_DAYS - 1)
      const prevDay = lastDayRef.current
      lastDayRef.current = nextDay
      dayRef.current = nextDay
      setDay(nextDay)

      for (const bill of BILLS) {
        const triggerKey = `${cycle}-${bill.id}`
        if (firedRef.current.has(triggerKey)) continue
        if (!hasCrossedDueDay(bill, nextDay, prevDay)) continue

        firedRef.current.add(triggerKey)
        setPoppingId(bill.id)

        schedule(() => {
          const paidDay = dayRef.current
          setPoppingId(null)
          setPaidBillIds((ids) => new Set([...ids, bill.id]))
          setPaymentDayByBill((map) => ({ ...map, [bill.id]: paidDay }))
        }, 480)
      }

      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      clearTimers()
    }
  }, [active])

  return { day, poppingId, paidBillIds, paymentDayByBill }
}

function MonthChart({
  day,
  reducedMotion,
}: {
  day: number
  reducedMotion: boolean
}) {
  const marks = [1, 7, 14, 21, 28, 30]

  const { bankPath, truthPath, accruedPath, headBank, headTruth, headAccrued } =
    useMemo(() => {
      const { bankSeries, truthSeries, accruedSeries } = buildSmoothChartPaths(day)
      const bankNow = interpolateSeriesAtDay(MONTH_SERIES.bank, day)
      const truthNow = interpolateSeriesAtDay(MONTH_SERIES.truth, day)
      const accruedNow = interpolateSeriesAtDay(MONTH_SERIES.accrued, day)

      const bx = dayToX(day)
      const bankY = valueToY(bankNow, MONTH_SERIES.min, MONTH_SERIES.max)
      const truthY = valueToY(truthNow, MONTH_SERIES.min, MONTH_SERIES.max)
      const accruedY = valueToY(accruedNow, MONTH_SERIES.min, MONTH_SERIES.max)

      return {
        bankPath: seriesToPoints(bankSeries, day, MONTH_SERIES.min, MONTH_SERIES.max),
        truthPath: seriesToPoints(truthSeries, day, MONTH_SERIES.min, MONTH_SERIES.max),
        accruedPath: seriesToPoints(accruedSeries, day, MONTH_SERIES.min, MONTH_SERIES.max),
        headBank: { x: bx, y: bankY },
        headTruth: { x: bx, y: truthY },
        headAccrued: { x: bx, y: accruedY },
      }
    }, [day])

  return (
    <div className="hero-chart-wrap">
      <svg className="hero-month-graph" viewBox="0 0 360 120" preserveAspectRatio="xMidYMid meet">
        {marks.map((mark) => (
          <g key={mark}>
            <line
              x1={dayToX(mark)}
              x2={dayToX(mark)}
              y1={CHART.top}
              y2={CHART.bottom}
              className="hero-month-grid-line"
            />
            <text x={dayToX(mark)} y={CHART.padBottom} className="hero-month-axis-label" textAnchor="middle">
              {mark}
            </text>
          </g>
        ))}
        <text x={CHART.left} y={CHART.padBottom} className="hero-month-axis-label" textAnchor="start">
          Day
        </text>

        <polyline className="hero-month-line hero-month-line--accrued" points={accruedPath} />
        <polyline className="hero-month-line hero-month-line--bank" points={bankPath} />
        <polyline className="hero-month-line hero-month-line--true" points={truthPath} />

        {!reducedMotion && (
          <line
            x1={headBank.x}
            x2={headBank.x}
            y1={CHART.top}
            y2={CHART.bottom}
            className="hero-month-today"
          />
        )}

        <circle cx={headAccrued.x} cy={headAccrued.y} r={3.5} className="hero-month-dot hero-month-dot--accrued" />
        <circle cx={headBank.x} cy={headBank.y} r={4} className="hero-month-dot hero-month-dot--bank" />
        <circle cx={headTruth.x} cy={headTruth.y} r={3.5} className="hero-month-dot hero-month-dot--true" />
      </svg>
    </div>
  )
}

export function HeroBalanceVisual() {
  const reducedMotion = usePrefersReducedMotion()
  const { day, poppingId, paidBillIds, paymentDayByBill } = useMonthSimulation(!reducedMotion)

  const ledgerCtx = useMemo(
    () => ledgerContextForDay(day, poppingId, paidBillIds, paymentDayByBill),
    [day, poppingId, paidBillIds, paymentDayByBill],
  )

  const { bank: bankNow, truth: trueNow, committed: committedNow } = useMemo(
    () => ({
      bank: interpolateSeriesAtDay(MONTH_SERIES.bank, day),
      truth: interpolateSeriesAtDay(MONTH_SERIES.truth, day),
      committed: interpolateSeriesAtDay(MONTH_SERIES.accrued, day),
    }),
    [day],
  )

  const pots = useMemo(
    () =>
      BILLS.map((bill) => {
        const state = billLedgerState(bill, ledgerCtx)
        const popping = poppingId === bill.id

        if (state === 'due') {
          const daysSinceDue = day - bill.dueDay
          const daysUntilNextDue = MONTH_DAYS
          const regrowProgress = daysSinceDue > 0 ? Math.min(1, daysSinceDue / daysUntilNextDue) : 0
          const scale = potScale(regrowProgress)
          const amount = Math.round(bill.amount * regrowProgress)
          const atColumn = potColumnPercent(bill)
          return { bill, state: 'regrowing' as BillLedgerState, progress: regrowProgress, scale, amount, popping: false, atColumn }
        }

        const progress = billProgress(bill, ledgerCtx)
        const scale = potScale(progress)
        const amount = Math.round(accruedForBill(bill, ledgerCtx) + dueForBill(bill, ledgerCtx))
        const atColumn = potColumnPercent(bill)
        return { bill, state, progress, scale, amount, popping, atColumn }
      }),
    [ledgerCtx, day, poppingId],
  )

  return (
    <div className="hero-balance-visual" aria-hidden>
      <div className="hero-balance-visual-glow" />

      <div className="hero-graph-card">
        <div className="hero-graph-head">
          <div className="hero-graph-stat hero-graph-stat--bank">
            <p className="hero-graph-stat-label">Current account</p>
            <p className="hero-graph-stat-value">{formatGbp(bankNow)}</p>
          </div>
          <div className="hero-graph-stat hero-graph-stat--accrued">
            <p className="hero-graph-stat-label">Committed money</p>
            <p className="hero-graph-stat-value">{formatGbp(committedNow)}</p>
          </div>
          <div className="hero-graph-stat hero-graph-stat--true">
            <p className="hero-graph-stat-label">True Balance</p>
            <p className="hero-graph-stat-value">{formatGbp(trueNow)}</p>
          </div>
        </div>

        <MonthChart day={day} reducedMotion={reducedMotion} />

        <div className="hero-pots-zone">
          <p className="hero-zone-label">Building up</p>
          <div className="hero-pots-track">
            {pots.map(({ bill, scale, amount, popping, atColumn }) => (
              <div
                key={bill.id}
                className={`hero-pot hero-pot--timed${popping ? ' hero-pot--popping' : ''}`}
                style={
                  {
                    left: `${atColumn}%`,
                    '--pot-color': bill.color,
                    '--pot-scale': scale,
                  } as CSSProperties
                }
              >
                <span className="hero-pot-label">{bill.label}</span>
                <span className="hero-pot-amount">{formatShort(amount)}</span>
                <span className="hero-pot-due muted">Day {bill.dueDay}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
