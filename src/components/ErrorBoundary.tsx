import { Component, type ErrorInfo, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Trubalance render error', error, info.componentStack)
  }

  private reload = () => {
    window.location.reload()
  }

  private clearStorageAndReload = () => {
    try {
      localStorage.removeItem('trubalance-app-state-v4')
      localStorage.removeItem('trubalance-app-state-v3')
      localStorage.removeItem('trubalance-app-state-v2')
    } catch {
      /* ignore */
    }
    window.location.reload()
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="app-error-fallback" role="alert">
        <h1>Something went wrong</h1>
        <p className="muted">
          The app hit an unexpected error while loading. Try refreshing, or reset saved data if the
          problem continues.
        </p>
        <pre className="app-error-detail">{this.state.error.message}</pre>
        <div className="app-error-actions">
          <button type="button" className="btn btn-primary" onClick={this.reload}>
            Refresh page
          </button>
          <button type="button" className="btn btn-secondary" onClick={this.clearStorageAndReload}>
            Reset saved data
          </button>
        </div>
      </div>
    )
  }
}
