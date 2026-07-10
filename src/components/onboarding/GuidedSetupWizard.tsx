import type { AppActions } from '../../hooks/useAppState'
import type { AppState, DashboardMetrics, ViewScope } from '../../types'
import type { PageId } from '../../navigation'
import { SetupOnboardingWizard } from './SetupOnboardingWizard'

interface GuidedSetupWizardProps {
  state: AppState
  viewScope: ViewScope
  metrics: DashboardMetrics
  actions: AppActions
  onNavigate: (pageId: PageId, reservePlannerId?: string | null) => void
  onComplete: () => void
  onDismiss: () => void
}

/** First-run setup — manual onboarding only while bank import is coming soon. */
export function GuidedSetupWizard(props: GuidedSetupWizardProps) {
  return <SetupOnboardingWizard {...props} />
}
