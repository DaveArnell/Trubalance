import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CanonicalLink } from '../components/CanonicalLink'
import { ReferenceDateProvider } from '../contexts/ReferenceDateContext'
import { DemoModeProvider } from '../contexts/DemoModeContext'
import { AppShell } from '../App'
import {
  buildDemoScenarioState,
  DEFAULT_DEMO_SCENARIO_ID,
  DEMO_FROZEN_DATE_KEY,
  DEMO_SCENARIOS,
} from '../data/demoScenarios'
import { DEMO_SEO } from '../content/marketingSeo'
import { usePageMeta } from '../hooks/usePageMeta'
import { formatSnapshotDateLong } from '../utils/snapshots'

export function DemoPage() {
  const { scenarioId } = useParams<{ scenarioId?: string }>()
  const navigate = useNavigate()
  const resolvedId = scenarioId ?? DEFAULT_DEMO_SCENARIO_ID
  const scenarioIndex = Math.max(
    0,
    DEMO_SCENARIOS.findIndex((scenario) => scenario.id === resolvedId),
  )
  const activeId = DEMO_SCENARIOS[scenarioIndex]?.id ?? DEFAULT_DEMO_SCENARIO_ID

  const { meta, state: initialState } = useMemo(() => buildDemoScenarioState(activeId), [activeId])

  usePageMeta({
    ...DEMO_SEO,
    title: `${meta.title} Demo | Cash Prophet Available Balance`,
    description: meta.description,
    path: `/demo/${meta.id}`,
    imageAlt: `${meta.title} — Cash Prophet interactive demo`,
  })
  const canEditDemo = false
  const [demoState, setDemoState] = useState(initialState)
  const [loadedScenarioId, setLoadedScenarioId] = useState(activeId)

  if (activeId !== loadedScenarioId) {
    setLoadedScenarioId(activeId)
    setDemoState(initialState)
  }

  const externalState = canEditDemo ? demoState : initialState

  const handleScenarioChange = (nextId: string) => {
    if (nextId === activeId) return
    navigate(`/demo/${nextId}`, { replace: true })
  }

  const cycleScenario = (direction: -1 | 1) => {
    const nextIndex = (scenarioIndex + direction + DEMO_SCENARIOS.length) % DEMO_SCENARIOS.length
    handleScenarioChange(DEMO_SCENARIOS[nextIndex]!.id)
  }

  return (
    <ReferenceDateProvider forcedDateKey={DEMO_FROZEN_DATE_KEY}>
      <DemoModeProvider
        scenario={meta}
        onScenarioChange={handleScenarioChange}
        canEditDemo={canEditDemo}
      >
        <div className={`interactive-demo-shell${canEditDemo ? '' : ' interactive-demo-shell--locked'}`}>
          <div className="interactive-demo-banner">
            <span className="interactive-demo-badge" aria-hidden>
              Demo
            </span>
            <div className="interactive-demo-scenario-picker">
              <span className="interactive-demo-scenario-picker-label">Example business</span>
              <div className="interactive-demo-scenario-controls">
                <button
                  type="button"
                  className="interactive-demo-scenario-nav"
                  onClick={() => cycleScenario(-1)}
                  aria-label="Previous example business"
                >
                  ‹
                </button>
                <select
                  value={activeId}
                  onChange={(e) => handleScenarioChange(e.target.value)}
                  className="interactive-demo-scenario-select"
                  aria-label="Choose example business"
                >
                  {DEMO_SCENARIOS.map((scenario) => (
                    <option key={scenario.id} value={scenario.id}>
                      {scenario.title}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="interactive-demo-scenario-nav"
                  onClick={() => cycleScenario(1)}
                  aria-label="Next example business"
                >
                  ›
                </button>
              </div>
            </div>
            <p className="interactive-demo-banner-message">
              Frozen snapshot as of {formatSnapshotDateLong(DEMO_FROZEN_DATE_KEY)} — explore freely.
              Nothing here is saved.
            </p>
            <div className="interactive-demo-banner-actions">
              {canEditDemo && (
                <span className="interactive-demo-admin-hint">Admin edit mode</span>
              )}
              <CanonicalLink to="/" className="btn-ghost btn-tiny">
                Home
              </CanonicalLink>
              <CanonicalLink to="/see-how-it-works" className="btn-ghost btn-tiny">
                All demos
              </CanonicalLink>
              <CanonicalLink to="/signup" className="btn-primary btn-tiny">
                Start free trial
              </CanonicalLink>
            </div>
          </div>

          <AppShell
            key={activeId}
            workspaceId={null}
            externalState={externalState}
            externalStateVersion={`${activeId}:${meta.historyMonths}:v4-wavy-trends`}
            defaultViewScope={meta.defaultViewScope}
            readOnly={!canEditDemo}
            skipLocalPersist
            onStateChange={canEditDemo ? setDemoState : undefined}
            isInteractiveDemo
          />
        </div>
      </DemoModeProvider>
    </ReferenceDateProvider>
  )
}
