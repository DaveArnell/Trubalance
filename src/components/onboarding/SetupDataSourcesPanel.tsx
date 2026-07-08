import { SETUP_DATA_SOURCES } from '../../config/setupAutomation'

interface SetupDataSourcesPanelProps {
  onSelectCsv?: () => void
  compact?: boolean
}

export function SetupDataSourcesPanel({ onSelectCsv, compact = false }: SetupDataSourcesPanelProps) {
  return (
    <div className={`setup-data-sources${compact ? ' setup-data-sources--compact' : ''}`}>
      <p className="setup-data-sources-lead">
        Add transaction history from any source below. Auto setup uses the same engine for all of them.
      </p>
      <div className="setup-data-sources-grid">
        {SETUP_DATA_SOURCES.map((source) => {
          const isCsv = source.id === 'csv'
          const disabled = source.status === 'coming_soon'
          return (
            <div
              key={source.id}
              className={`setup-data-source-card${disabled ? ' setup-data-source-card--soon' : ' setup-data-source-card--active'}`}
            >
              <div className="setup-data-source-head">
                <h3>{source.title}</h3>
                {source.etaLabel ? (
                  <span className="setup-data-source-badge">{source.etaLabel}</span>
                ) : (
                  <span className="setup-data-source-badge setup-data-source-badge--live">Available</span>
                )}
              </div>
              <p>{source.description}</p>
              {isCsv && onSelectCsv ? (
                <button type="button" className="btn-secondary btn-tiny" onClick={onSelectCsv}>
                  Upload file
                </button>
              ) : null}
              {disabled ? (
                <p className="setup-data-source-foot muted">Same auto-setup flow when this launches.</p>
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}
