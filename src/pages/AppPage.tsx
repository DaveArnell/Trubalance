import { Navigate } from 'react-router-dom'
import { ReferenceDateProvider } from '../contexts/ReferenceDateContext'
import { useAuth } from '../contexts/AuthContext'
import { useWorkspace } from '../contexts/WorkspaceContext'
import { AppShell } from '../App'

export function AppPage() {
  const { configured, loading: authLoading, user } = useAuth()
  const {
    loading: wsLoading,
    workspaceId,
    initialRemoteState,
    remoteStateVersion,
    remoteEnabled,
    persistState,
    readOnly,
    workspaceSubscription,
  } = useWorkspace()

  if (configured && authLoading) {
    return (
      <div className="auth-page">
        <p className="muted">Loading your account…</p>
      </div>
    )
  }

  if (configured && !user) {
    return <Navigate to="/login?redirect=/app" replace />
  }

  if (remoteEnabled && wsLoading) {
    return (
      <div className="auth-page">
        <p className="muted">Loading your dashboard…</p>
      </div>
    )
  }

  return (
    <ReferenceDateProvider>
      <AppShell
        workspaceId={remoteEnabled ? workspaceId : null}
        externalState={remoteEnabled ? initialRemoteState : null}
        externalStateVersion={remoteEnabled ? remoteStateVersion : undefined}
        remotePersist={remoteEnabled}
        onStateChange={persistState}
        readOnly={readOnly}
        remoteSubscription={remoteEnabled ? workspaceSubscription : null}
      />
    </ReferenceDateProvider>
  )
}
