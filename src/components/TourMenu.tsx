import { useTour } from '../contexts/TourContext'
import { getTourForPage } from '../content/pageTours'

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
        <strong>New to True Balance?</strong> A short guide explains how it works, then we help you
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

export function TourMenuButton({ onSetupGuide }: { onSetupGuide?: () => void }) {
  const { activePageId, startPageTour, startSetupTour, isTourActive } = useTour()
  if (isTourActive) return null

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
