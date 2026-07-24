import { useEffect, useId, useRef, useState } from 'react'
import { MobileRecordCard } from '../mobile/MobileRecordList'
import { formatCurrency } from '../../utils/format'

type Template = {
  name: string
  monthly: number
  accent: string
}

type BuildingCard = Template & {
  key: string
  progress: number
  phase: 'idle' | 'paid' | 'spawn'
}

const TEMPLATES: Template[] = [
  { name: 'Rent', monthly: 2500, accent: '#0369a1' },
  { name: 'Utilities', monthly: 420, accent: '#7c3aed' },
  { name: 'Wages', monthly: 8400, accent: '#0f766e' },
]

/** Same calendar rate for every card. The month advances together. */
const FILL_PER_TICK = 0.0042
const TICK_MS = 50
/** Hold green paid pop, then restart from the bottom. */
const PAID_HOLD_MS = 1100

/** Different due dates: most full = next due = top. */
const INITIAL_PROGRESS = [0.9, 0.55, 0.2]

function sortBuilding(cards: BuildingCard[]): BuildingCard[] {
  return [...cards].sort((a, b) => {
    if (a.phase === 'paid' && b.phase !== 'paid') return -1
    if (b.phase === 'paid' && a.phase !== 'paid') return 1
    return b.progress - a.progress
  })
}

/**
 * Marketing / onboarding demo: known costs build day by day.
 * When a bar hits full it gets a green paid pop, then drops to the bottom and builds again.
 * No Due column (keeps the first explanation focused on building).
 */
export function SetupAccruingCycleDemo() {
  const uid = useId().replace(/:/g, '')
  const busy = useRef(false)
  const buildingRef = useRef<BuildingCard[]>([])
  const dayProgressRef = useRef(0.72)
  const timers = useRef<number[]>([])

  const [building, setBuilding] = useState<BuildingCard[]>(() => {
    const initial = sortBuilding(
      TEMPLATES.map((template, index) => ({
        ...template,
        key: `${uid}-init-${index}`,
        progress: INITIAL_PROGRESS[index] ?? 0,
        phase: 'idle' as const,
      })),
    )
    buildingRef.current = initial
    return initial
  })
  const [monthDay, setMonthDay] = useState(22)

  const updateBuilding = (next: BuildingCard[]) => {
    const sorted = sortBuilding(next)
    buildingRef.current = sorted
    setBuilding(sorted)
  }

  useEffect(() => {
    const clearTimers = () => {
      timers.current.forEach((id) => window.clearTimeout(id))
      timers.current = []
    }

    const schedule = (fn: () => void, ms: number) => {
      const id = window.setTimeout(fn, ms)
      timers.current.push(id)
      return id
    }

    const prefersReduced =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReduced) {
      updateBuilding(
        TEMPLATES.map((template, index) => ({
          ...template,
          key: `${uid}-static-${index}`,
          progress: INITIAL_PROGRESS[index] ?? 0.4,
          phase: 'idle' as const,
        })),
      )
      setMonthDay(22)
      return clearTimers
    }

    const interval = window.setInterval(() => {
      dayProgressRef.current = (dayProgressRef.current + FILL_PER_TICK) % 1
      setMonthDay(Math.max(1, Math.min(30, Math.round(dayProgressRef.current * 30) || 1)))

      const advanced = buildingRef.current.map((row) =>
        row.phase === 'paid'
          ? row
          : {
              ...row,
              progress: Math.min(1, row.progress + FILL_PER_TICK),
              phase: row.phase === 'spawn' ? ('idle' as const) : row.phase,
            },
      )

      const full =
        !busy.current
          ? advanced.find((row) => row.progress >= 0.999 && row.phase === 'idle')
          : undefined

      if (!full) {
        updateBuilding(advanced)
        return
      }

      busy.current = true
      updateBuilding(
        advanced.map((row) =>
          row.key === full.key ? { ...row, progress: 1, phase: 'paid' as const } : row,
        ),
      )

      schedule(() => {
        const template = TEMPLATES.find((entry) => entry.name === full.name) ?? TEMPLATES[0]!
        updateBuilding([
          ...buildingRef.current.filter((row) => row.key !== full.key),
          {
            ...template,
            key: full.key,
            progress: 0,
            phase: 'spawn',
          },
        ])
        busy.current = false
      }, PAID_HOLD_MS)
    }, TICK_MS)

    return () => {
      window.clearInterval(interval)
      clearTimers()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- demo loop keyed to uid only
  }, [uid])

  return (
    <div className="setup-edu-visual setup-edu-visual--cards">
      <div className="setup-accruing-day" aria-hidden="true">
        <div className="setup-accruing-day-label">
          <span>Day of month</span>
          <strong>
            {monthDay}
            <span className="setup-accruing-day-of"> / 30</span>
          </strong>
        </div>
        <div className="setup-accruing-day-track" role="presentation">
          <div
            className="setup-accruing-day-fill"
            style={{ width: `${(monthDay / 30) * 100}%` }}
          />
          <span
            className="setup-accruing-day-marker"
            style={{ left: `${((monthDay - 1) / 29) * 100}%` }}
          />
        </div>
      </div>
      <div className="setup-accruing-cycle setup-accruing-cycle--building-only" aria-hidden="true">
        <div className="setup-accruing-cycle-col">
          <p className="setup-accruing-cycle-heading">Building up</p>
          <div className="setup-accruing-cycle-list">
            {building.map((card) => (
              <div
                key={card.key}
                className={`setup-accruing-cycle-card-wrap${
                  card.phase === 'paid' ? ' is-paid' : ''
                }${card.phase === 'spawn' ? ' is-spawn' : ''}`}
              >
                <MobileRecordCard
                  title={card.name}
                  amount={formatCurrency(card.monthly * card.progress)}
                  amountSecondary={`/ ${formatCurrency(card.monthly)}`}
                  progress={card.progress}
                  progressColor={card.accent}
                  accentColor={card.accent}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
