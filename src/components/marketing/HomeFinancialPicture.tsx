import { useEffect, useId, useState } from 'react'
import { HOME_PICTURE } from '../../content/homePage'
import { HomeAvailablePanel } from './HomeMarketingVisuals'
import { MethodReservePlannerVisual } from './MethodReservePlannerVisual'
import { MethodWorkedExample } from './MethodWorkedExample'
import { BalanceCompareTrendVisual } from './BalanceCompareTrendVisual'

type PictureTab = {
  id: 'bills' | 'bigger' | 'stand' | 'heading'
  label: string
  heading: string
  body: string
}

type PictureContent = {
  heading: string
  lead: string
  tabs: readonly PictureTab[]
}

function TabVisual({ id }: { id: PictureTab['id'] }) {
  switch (id) {
    case 'bills':
      return <HomeAvailablePanel />
    case 'bigger':
      return <MethodReservePlannerVisual />
    case 'stand':
      return <MethodWorkedExample compact />
    case 'heading':
      return <BalanceCompareTrendVisual />
    default:
      return null
  }
}

/** Interactive four-part financial picture — one bordered card, fixed-height panels. */
export function HomeFinancialPicture({ content = HOME_PICTURE }: { content?: PictureContent } = {}) {
  const baseId = useId()
  const [activeId, setActiveId] = useState<PictureTab['id']>(content.tabs[0]!.id)

  useEffect(() => {
    setActiveId(content.tabs[0]!.id)
  }, [content])

  return (
    <section
      className="home-band home-band--paper"
      id="financial-picture"
      aria-labelledby="financial-picture-heading"
    >
      <div className="marketing-section-inner marketing-section-inner--home home-picture">
        <div className="home-picture-head">
          <h2 id="financial-picture-heading">{content.heading}</h2>
          <p className="home-picture-lead">{content.lead}</p>
        </div>

        <div className="home-picture-card">
          <div className="home-picture-nav" role="tablist" aria-label="Parts of your financial picture">
            {content.tabs.map((tab) => {
              const selected = tab.id === activeId
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  id={`${baseId}-tab-${tab.id}`}
                  aria-selected={selected}
                  aria-controls={`${baseId}-panel-${tab.id}`}
                  tabIndex={selected ? 0 : -1}
                  className={`home-picture-seg${selected ? ' home-picture-seg--active' : ''}`}
                  onClick={() => setActiveId(tab.id)}
                  onKeyDown={(event) => {
                    const tabs = content.tabs
                    const index = tabs.findIndex((t) => t.id === activeId)
                    if (index < 0) return
                    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
                      event.preventDefault()
                      const next = tabs[(index + 1) % tabs.length]!
                      setActiveId(next.id)
                      document.getElementById(`${baseId}-tab-${next.id}`)?.focus()
                    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
                      event.preventDefault()
                      const prev = tabs[(index - 1 + tabs.length) % tabs.length]!
                      setActiveId(prev.id)
                      document.getElementById(`${baseId}-tab-${prev.id}`)?.focus()
                    } else if (event.key === 'Home') {
                      event.preventDefault()
                      const first = tabs[0]!
                      setActiveId(first.id)
                      document.getElementById(`${baseId}-tab-${first.id}`)?.focus()
                    } else if (event.key === 'End') {
                      event.preventDefault()
                      const last = tabs[tabs.length - 1]!
                      setActiveId(last.id)
                      document.getElementById(`${baseId}-tab-${last.id}`)?.focus()
                    }
                  }}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>

          <div className="home-picture-body">
            {content.tabs.map((tab) => {
              const selected = tab.id === activeId
              return (
                <div
                  key={tab.id}
                  role="tabpanel"
                  id={`${baseId}-panel-${tab.id}`}
                  aria-labelledby={`${baseId}-tab-${tab.id}`}
                  hidden={!selected}
                  className={`home-picture-panel${selected ? ' home-picture-panel--active' : ''}`}
                >
                  <div className="home-picture-panel-grid">
                    <div className="home-picture-copy">
                      <h3>{tab.heading}</h3>
                      {tab.body.split('\n\n').map((paragraph) => (
                        <p key={paragraph}>{paragraph}</p>
                      ))}
                    </div>
                    <div className={`home-picture-visual home-picture-visual--${tab.id}`}>
                      <TabVisual id={tab.id} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
