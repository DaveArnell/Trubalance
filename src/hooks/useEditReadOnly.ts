import { useWorkspace } from '../contexts/WorkspaceContext'
import { useDemoReadOnly } from '../contexts/DemoModeContext'
import { useSubscriptionOptional } from '../contexts/SubscriptionContext'

/** True when edits should be blocked (impersonation, demo view-only, or unpaid subscription). */
export function useEditReadOnly(): boolean {
  const { readOnly: workspaceReadOnly } = useWorkspace()
  const demoReadOnly = useDemoReadOnly()
  const subscription = useSubscriptionOptional()
  return workspaceReadOnly || demoReadOnly || (subscription?.subscriptionReadOnly ?? false)
}
