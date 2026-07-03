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
        <strong>New to True Balance?</strong> Follow the guided setup — we will walk you through your
        business, balances, and what is already spoken for.
      </span>
      <button type="button" className="btn-primary btn-tiny" onClick={onStart}>
        Start setup guide
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
