import { useTour } from '../contexts/TourContext'
import { getTourForPage, type PageTour } from '../content/pageTours'
import { useDemoMode } from '../contexts/DemoModeContext'
import { buildDemoProductTour } from '../content/demoTour'
import { markDemoProductTourSeen } from '../utils/demoTourSession'

export function SetupTourBanner({
  visible,
  onStart,
}: {
  visible: boolean
  onStart: () => void
}) {
  const { isTourActive } = useTour()
  if (!visible || isTourActive) return null

  return (
    <div className="onboarding-banner" role="status">
      <span>
        <strong>New to Cash Prophet?</strong> A short guide explains how it works, then we help you
        set up balances and costs on your live dashboard.
      </span>
      <button type="button" className="btn-primary btn-tiny" onClick={onStart}>
        Start setup guide
      </button>
    </div>
  )
}

export function MobileTourLinks({ onSetupGuide }: { onSetupGuide: () => void }) {
  return (
    <div className="sidebar-mobile-tours">
      <button type="button" className="sidebar-account-link" onClick={onSetupGuide}>
        Setup guide
      </button>
    </div>
  )
}

export function TourMenuButton({
  onSetupGuide,
  demoBalances,
}: {
  onSetupGuide?: () => void
  /** When provided in demo mode, Restart tour uses live dashboard balances. */
  demoBalances?: { bankBalance: number; trueBalance: number }
}) {
  const demo = useDemoMode()
  const { activePageId, startPageTour, startSetupTour, startTour, isTourActive } = useTour()
  if (isTourActive) return null

  if (demo?.isInteractiveDemo && demoBalances) {
    return (
      <div className="tour-menu">
        <button
          type="button"
          className="btn-ghost btn-tiny"
          onClick={() => {
            markDemoProductTourSeen(demo.scenario.id)
            startTour(buildDemoProductTour(demo.scenario.id, demoBalances) as PageTour)
          }}
        >
          Restart tour
        </button>
      </div>
    )
  }

  const pageTour = activePageId ? getTourForPage(activePageId) : null

  return (
    <div className="tour-menu">
      {pageTour && (
        <button type="button" className="btn-ghost btn-tiny" onClick={() => startPageTour()}>
          Page tour
        </button>
      )}
      <button type="button" className="btn-ghost btn-tiny" onClick={onSetupGuide ?? startSetupTour}>
        Setup guide
      </button>
    </div>
  )
}
