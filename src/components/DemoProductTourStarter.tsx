import { useEffect, useRef } from 'react'
import { useTour } from '../contexts/TourContext'
import { useDemoMode } from '../contexts/DemoModeContext'
import { buildDemoProductTour } from '../content/demoTour'
import { markDemoProductTourSeen, wasDemoProductTourSeen } from '../utils/demoTourSession'

/**
 * Auto-starts the demo product walkthrough once per demo scenario per browser session.
 * Does not affect normal-user setup or page tours.
 */
export function DemoProductTourStarter({
  bankBalance,
  trueBalance,
}: {
  bankBalance: number
  trueBalance: number
}) {
  const demo = useDemoMode()
  const { startTour, isTourActive } = useTour()
  const startedFor = useRef<string | null>(null)

  useEffect(() => {
    if (!demo?.isInteractiveDemo) return
    const scenarioId = demo.scenario.id
    if (startedFor.current === scenarioId) return
    if (wasDemoProductTourSeen(scenarioId)) return
    if (isTourActive) return

    const timer = window.setTimeout(() => {
      if (wasDemoProductTourSeen(scenarioId)) return
      startedFor.current = scenarioId
      markDemoProductTourSeen(scenarioId)
      startTour(
        buildDemoProductTour(scenarioId, {
          bankBalance,
          trueBalance,
        }),
      )
    }, 650)

    return () => window.clearTimeout(timer)
  }, [demo, bankBalance, trueBalance, startTour, isTourActive])

  return null
}
