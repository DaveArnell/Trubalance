import { useId, useState } from 'react'
import { HOME_PICTURE } from '../../content/homePage'
import { HomeAvailablePanel, HabitsTrendVisual } from './HomeMarketingVisuals'
import { MethodReservePlannerVisual } from './MethodReservePlannerVisual'
import { MethodWorkedExample } from './MethodWorkedExample'

type TabId = (typeof HOME_PICTURE.tabs)[number]['id']

function TabVisual({ id }: { id: TabId }) {
  switch (id) {
    case 'bills':
      return <HomeAvailablePanel />
    case 'bigger':
      return <MethodReservePlannerVisual />
    case 'stand':
      return <MethodWorkedExample />
    case 'heading':
      return <HabitsTrendVisual />
    default:
      return null
  }
}

/** Interactive four-part financial picture — one story, tabbed. */
export function HomeFinancialPicture() {
  const baseId = useId()
  const [activeId, setActiveId] = useState<TabId>(HOME_PICTURE.tabs[0]!.id)
  const active = HOME_PICTURE.tabs.find((tab) => tab.id === activeId) ?? HOME_PICTURE.tabs[0]!

  return (
    <section
      className="home-band home-band--paper"
      id="financial-picture"
      aria-labelledby="financial-picture-heading"
    >
      <div className="marketing-section-inner marketing-section-inner--home home-band-stack home-picture">
        <div className="home-band-head home-band-head--center">
          <h2 id="financial-picture-heading">{HOME_PICTURE.heading}</h2>
          <p className="home-picture-lead">{HOME_PICTURE.lead}</p>
        </div>

        <div className="home-picture-tabs" role="tablist" aria-label="Parts of your financial picture">
          {HOME_PICTURE.tabs.map((tab) => {
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
                className={`home-picture-tab${selected ? ' home-picture-tab--active' : ''}`}
                onClick={() => setActiveId(tab.id)}
                onKeyDown={(event) => {
                  const tabs = HOME_PICTURE.tabs
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

        {HOME_PICTURE.tabs.map((tab) => {
          const selected = tab.id === activeId
          return (
            <div
              key={tab.id}
              role="tabpanel"
              id={`${baseId}-panel-${tab.id}`}
              aria-labelledby={`${baseId}-tab-${tab.id}`}
              hidden={!selected}
              className="home-picture-panel"
            >
              {selected && (
                <div className="home-picture-panel-grid">
                  <div className="home-picture-copy">
                    <h3>{active.heading}</h3>
                    {active.body.split('\n\n').map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                  <div className="home-picture-visual">
                    <TabVisual id={tab.id} />
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
