import { useEffect, useId, useRef, useState } from 'react'
import { MobileRecordCard } from '../mobile/MobileRecordList'
import { formatCurrency } from '../../utils/format'

type DemoCard = {
  key: string
  name: string
  monthly: number
  progress: number
  accent: string
  fillRate: number
}

type DueDemoCard = {
  key: string
  name: string
  amount: number
  accent: string
  paidFlash: boolean
}

const TEMPLATES: Array<Omit<DemoCard, 'key' | 'progress'>> = [
  { name: 'Wages', monthly: 8400, accent: '#0f766e', fillRate: 0.2 },
  { name: 'Rent', monthly: 2500, accent: '#0369a1', fillRate: 0.14 },
  { name: 'Utilities', monthly: 420, accent: '#7c3aed', fillRate: 0.26 },
]

function makeCard(template: (typeof TEMPLATES)[number], key: string, progress = 0): DemoCard {
  return { ...template, key, progress }
}

export function SetupAccruingCycleDemo() {
  const uid = useId().replace(/:/g, '')
  const seq = useRef(0)
  const transferring = useRef(false)
  const nextKey = () => {
    seq.current += 1
    return `${uid}-${seq.current}`
  }

  const [building, setBuilding] = useState<DemoCard[]>(() =>
    TEMPLATES.map((template, index) => makeCard(template, `${uid}-init-${index}`, index * 0.2)),
  )
  const [due, setDue] = useState<DueDemoCard[]>([])

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReduced) {
      setBuilding(
        TEMPLATES.map((template, index) =>
          makeCard(template, `${uid}-static-${index}`, 0.45 + index * 0.15),
        ),
      )
      setDue([
        {
          key: `${uid}-due-static`,
          name: 'Insurance',
          amount: 1200,
          accent: '#c2410c',
          paidFlash: false,
        },
      ])
      return
    }

    const interval = window.setInterval(() => {
      if (transferring.current) return

      setBuilding((rows) => {
        const next = rows.map((row) => ({
          ...row,
          progress: Math.min(1, row.progress + row.fillRate * 0.05),
        }))
        const fullIndex = next.findIndex((row) => row.progress >= 0.999)
        if (fullIndex < 0) return next

        transferring.current = true
        const full = next[fullIndex]!
        const remaining = [...next.slice(0, fullIndex), ...next.slice(fullIndex + 1)]
        const template = TEMPLATES.find((entry) => entry.name === full.name) ?? TEMPLATES[0]!
        remaining.push(makeCard(template, nextKey(), 0))

        window.setTimeout(() => {
          setDue((prev) =>
            [
              {
                key: full.key,
                name: full.name,
                amount: full.monthly,
                accent: full.accent,
                paidFlash: false,
              },
              ...prev,
            ].slice(0, 3),
          )
          transferring.current = false

          window.setTimeout(() => {
            setDue((prev) =>
              prev.map((entry) => (entry.key === full.key ? { ...entry, paidFlash: true } : entry)),
            )
            window.setTimeout(() => {
              setDue((prev) => prev.filter((entry) => entry.key !== full.key))
            }, 750)
          }, 2400)
        }, 200)

        return remaining
      })
    }, 50)

    return () => window.clearInterval(interval)
  }, [uid])

  return (
    <div className="setup-edu-visual setup-edu-visual--cards">
      <div className="setup-accruing-cycle" aria-hidden="true">
        <div className="setup-accruing-cycle-col">
          <p className="setup-accruing-cycle-heading">Building up</p>
          <div className="setup-accruing-cycle-list">
            {building.map((card) => (
              <MobileRecordCard
                key={card.key}
                title={card.name}
                amount={formatCurrency(card.monthly * card.progress)}
                amountSecondary={`/ ${formatCurrency(card.monthly)}`}
                progress={card.progress}
                progressColor={card.accent}
                accentColor={card.accent}
              />
            ))}
          </div>
        </div>
        <div className="setup-accruing-cycle-arrow" aria-hidden>
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
                  className={`setup-accruing-cycle-due-wrap${card.paidFlash ? ' is-paid' : ''}`}
                >
                  <MobileRecordCard
                    title={card.name}
                    amount={formatCurrency(card.amount)}
                    amountNegative
                    progress={1}
                    progressColor={card.accent}
                    accentColor={card.accent}
                    meta={card.paidFlash ? 'Paid' : 'Stays until paid'}
                  />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      <p className="setup-accrual-caption">
        Cards fill left to right every cycle. When one hits full, it moves to Due and a fresh empty
        card starts building at the bottom — newest due items stay at the top.
      </p>
    </div>
  )
}
