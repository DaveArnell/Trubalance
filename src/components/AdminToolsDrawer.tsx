import { useState } from 'react'
import { useReferenceDate } from '../contexts/ReferenceDateContext'
import { getReferenceDateKey } from '../utils/referenceDate'
import { formatSnapshotDateLong } from '../utils/snapshots'

interface AdminToolsDrawerProps {
  open: boolean
  onClose: () => void
}

export function AdminToolsDrawer({ open, onClose }: AdminToolsDrawerProps) {
  const { simulatedDateKey, setSimulatedDateKey, clearSimulatedDate, referenceDateKey } = useReferenceDate()
  const [draftDate, setDraftDate] = useState(simulatedDateKey ?? referenceDateKey)

  if (!open) return null

  const applySimulatedDate = () => {
    if (!draftDate) return
    setSimulatedDateKey(draftDate)
  }

  return (
    <>
      <button type="button" className="dev-tools-backdrop" aria-label="Close dev tools" onClick={onClose} />
      <aside className="dev-tools-drawer" role="dialog" aria-labelledby="dev-tools-title" aria-modal="true">
        <header className="dev-tools-head">
          <div>
            <h2 id="dev-tools-title">Dev tools</h2>
            <p className="muted dev-tools-lead">
              Testing helpers — not part of day-to-day use. Simulate &ldquo;today&rdquo; to preview due items and
              notifications without waiting.
            </p>
          </div>
          <button type="button" className="btn-ghost btn-tiny" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </header>

        <section className="dev-tools-section">
          <h3>Simulated today</h3>
          <p className="muted dev-tools-hint">
            The whole app treats this as today — due dates, accruals, freshness, and alerts all follow it.
          </p>
          <label className="admin-field">
            <span>Date</span>
            <input type="date" value={draftDate} onChange={(e) => setDraftDate(e.target.value)} />
          </label>
          <div className="admin-panel-actions">
            <button type="button" className="btn-primary btn-tiny" onClick={applySimulatedDate}>
              Apply simulated date
            </button>
            <button type="button" className="btn-secondary btn-tiny" onClick={() => setDraftDate(getReferenceDateKey())}>
              Use real today
            </button>
            {simulatedDateKey && (
              <button type="button" className="btn-ghost btn-tiny" onClick={clearSimulatedDate}>
                Clear simulation
              </button>
            )}
          </div>
          {simulatedDateKey ? (
            <p className="admin-panel-status admin-panel-status--active">
              Active: viewing as {formatSnapshotDateLong(simulatedDateKey)}
            </p>
          ) : (
            <p className="admin-panel-status muted">Using real calendar date.</p>
          )}
        </section>
      </aside>
    </>
  )
}
