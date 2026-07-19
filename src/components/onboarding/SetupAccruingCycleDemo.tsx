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
  phase: 'idle' | 'departing' | 'spawn'
}

type DueCard = Template & {
  key: string
  amount: number
  phase: 'arriving' | 'waiting' | 'paid'
}

const TEMPLATES: Template[] = [
  { name: 'Rent', monthly: 2500, accent: '#0369a1' },
  { name: 'Utilities', monthly: 420, accent: '#7c3aed' },
  { name: 'Wages', monthly: 8400, accent: '#0f766e' },
]

/** Same calendar rate for every card — the month advances together. */
const FILL_PER_TICK = 0.0042
const TICK_MS = 50
const DEPART_MS = 700
const ARRIVE_MS = 420
const DUE_HOLD_MS = 2400
const PAID_FADE_MS = 750

/** Different due dates → different points in the same month. Most full = next due = top. */
const INITIAL_PROGRESS = [0.9, 0.55, 0.2]

function sortBuilding(cards: BuildingCard[]): BuildingCard[] {
  return [...cards].sort((a, b) => {
    if (a.phase === 'departing' && b.phase !== 'departing') return -1
    if (b.phase === 'departing' && a.phase !== 'departing') return 1
    return b.progress - a.progress
  })
}

export function SetupAccruingCycleDemo() {
  const uid = useId().replace(/:/g, '')
  const seq = useRef(0)
  const busy = useRef(false)
  const buildingRef = useRef<BuildingCard[]>([])
  const timers = useRef<number[]>([])
  const nextKey = () => {
    seq.current += 1
    return `${uid}-${seq.current}`
  }

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
  const [due, setDue] = useState<DueCard[]>([])
  const [transferPulse, setTransferPulse] = useState(false)

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
      setDue([
        {
          key: `${uid}-due-static`,
          name: 'Insurance',
          monthly: 1200,
          amount: 1200,
          accent: '#c2410c',
          phase: 'waiting',
        },
      ])
      return clearTimers
    }

    const interval = window.setInterval(() => {
      const advanced = buildingRef.current.map((row) =>
        row.phase === 'departing'
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
      setTransferPulse(true)
      updateBuilding(
        advanced.map((row) =>
          row.key === full.key ? { ...row, progress: 1, phase: 'departing' as const } : row,
        ),
      )

      schedule(() => {
        const template = TEMPLATES.find((entry) => entry.name === full.name) ?? TEMPLATES[0]!
        const freshKey = nextKey()

        updateBuilding([
          ...buildingRef.current.filter((row) => row.key !== full.key),
          {
            ...template,
            key: freshKey,
            progress: 0,
            phase: 'spawn',
          },
        ])

        setDue((prev) =>
          [
            {
              key: full.key,
              name: full.name,
              monthly: full.monthly,
              amount: full.monthly,
              accent: full.accent,
              phase: 'arriving' as const,
            },
            ...prev,
          ].slice(0, 3),
        )

        schedule(() => {
          setDue((prev) =>
            prev.map((entry) =>
              entry.key === full.key ? { ...entry, phase: 'waiting' as const } : entry,
            ),
          )
          updateBuilding(
            buildingRef.current.map((row) =>
              row.key === freshKey ? { ...row, phase: 'idle' as const } : row,
            ),
          )
          setTransferPulse(false)
          busy.current = false
        }, ARRIVE_MS)

        schedule(() => {
          setDue((prev) =>
            prev.map((entry) =>
              entry.key === full.key ? { ...entry, phase: 'paid' as const } : entry,
            ),
          )
          schedule(() => {
            setDue((prev) => prev.filter((entry) => entry.key !== full.key))
          }, PAID_FADE_MS)
        }, DUE_HOLD_MS)
      }, DEPART_MS)
    }, TICK_MS)

    return () => {
      window.clearInterval(interval)
      clearTimers()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- demo loop keyed to uid only
  }, [uid])

  return (
    <div className="setup-edu-visual setup-edu-visual--cards">
      <div className="setup-accruing-cycle" aria-hidden="true">
        <div className="setup-accruing-cycle-col">
          <p className="setup-accruing-cycle-heading">Building up</p>
          <div className="setup-accruing-cycle-list">
            {building.map((card) => (
              <div
                key={card.key}
                className={`setup-accruing-cycle-card-wrap${
                  card.phase === 'departing' ? ' is-departing' : ''
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
        <div
          className={`setup-accruing-cycle-arrow${transferPulse ? ' is-active' : ''}`}
          aria-hidden
        >
          →
        </div>
        <div className="setup-accruing-cycle-col">
          <p className="setup-accruing-cycle-heading">Due</p>
          <div className="setup-accruing-cycle-list">
            {due.length === 0 ? (
              <p className="setup-accruing-cycle-empty muted">When a bar fills, it moves here</p>
            ) : (
              due.map((card) => (
                <div
                  key={card.key}
                  className={`setup-accruing-cycle-due-wrap${
                    card.phase === 'arriving' ? ' is-arriving' : ''
                  }${card.phase === 'paid' ? ' is-paid' : ''}`}
                >
                  <MobileRecordCard
                    title={card.name}
                    amount={formatCurrency(card.amount)}
                    amountNegative
                    progress={1}
                    progressColor={card.accent}
                    accentColor={card.accent}
                    meta={card.phase === 'paid' ? 'Paid' : undefined}
                  />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
