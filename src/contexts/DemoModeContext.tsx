import { createContext, useContext, type ReactNode } from 'react'
import type { DemoScenarioMeta } from '../data/demoScenarios'

interface DemoModeContextValue {
  isInteractiveDemo: true
  scenario: DemoScenarioMeta
  onScenarioChange: (scenarioId: string) => void
  /** Super admins can edit demo figures in-session; everyone else is view-only. */
  canEditDemo: boolean
}

const DemoModeContext = createContext<DemoModeContextValue | null>(null)

export function DemoModeProvider({
  children,
  scenario,
  onScenarioChange,
  canEditDemo = false,
}: {
  children: ReactNode
  scenario: DemoScenarioMeta
  onScenarioChange: (scenarioId: string) => void
  canEditDemo?: boolean
}) {
  return (
    <DemoModeContext.Provider
      value={{ isInteractiveDemo: true, scenario, onScenarioChange, canEditDemo }}
    >
      {children}
    </DemoModeContext.Provider>
  )
}

export function useDemoMode() {
  return useContext(DemoModeContext)
}

/** True inside the interactive demo when the viewer cannot edit (default for visitors). */
export function useDemoReadOnly() {
  const demo = useDemoMode()
  if (!demo) return false
  return !demo.canEditDemo
}
