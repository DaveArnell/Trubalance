import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ReferenceDateProvider } from '../contexts/ReferenceDateContext'
import { DemoModeProvider } from '../contexts/DemoModeContext'
import { AppShell } from '../App'
import {
  buildDemoScenarioState,
  DEFAULT_DEMO_SCENARIO_ID,
  DEMO_SCENARIOS,
} from '../data/demoScenarios'
import { DEMO_SEO } from '../content/marketingSeo'
import { usePageMeta } from '../hooks/usePageMeta'

export function DemoPage() {
  usePageMeta(DEMO_SEO)
  const { scenarioId } = useParams<{ scenarioId?: string }>()
  const navigate = useNavigate()
  const resolvedId = scenarioId ?? DEFAULT_DEMO_SCENARIO_ID

  const { meta, state: initialState } = useMemo(() => buildDemoScenarioState(resolvedId), [resolvedId])
  const canEditDemo = false
  const [demoState, setDemoState] = useState(initialState)
  const [loadedScenarioId, setLoadedScenarioId] = useState(resolvedId)

  if (resolvedId !== loadedScenarioId) {
    setLoadedScenarioId(resolvedId)
    setDemoState(initialState)
  }

  const externalState = canEditDemo ? demoState : initialState

  const handleScenarioChange = (nextId: string) => {
    if (nextId === resolvedId) return
    navigate(`/demo/${nextId}`, { replace: true })
  }

  return (
    <ReferenceDateProvider>
      <DemoModeProvider
        scenario={meta}
        onScenarioChange={handleScenarioChange}
        canEditDemo={canEditDemo}
      >
        <div className={`interactive-demo-shell${canEditDemo ? '' : ' interactive-demo-shell--locked'}`}>
          <div className="interactive-demo-banner">
            <label className="interactive-demo-scenario-picker">
              <span className="interactive-demo-scenario-picker-label">Example business</span>
              <select
                value={resolvedId}
                onChange={(e) => handleScenarioChange(e.target.value)}
                className="interactive-demo-scenario-select"
              >
                {DEMO_SCENARIOS.map((scenario) => (
                  <option key={scenario.id} value={scenario.id}>
                    {scenario.title}
                  </option>
                ))}
              </select>
            </label>
            <div className="interactive-demo-banner-actions">
              {canEditDemo && (
                <span className="interactive-demo-admin-hint">Admin edit mode</span>
              )}
              <Link to="/see-how-it-works" className="btn-ghost btn-tiny">
                All demos
              </Link>
              <Link to="/signup" className="btn-primary btn-tiny">
                Start free trial
              </Link>
            </div>
          </div>

          <AppShell
            key={resolvedId}
            workspaceId={null}
            externalState={externalState}
            externalStateVersion={`${resolvedId}:${meta.historyMonths}`}
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
