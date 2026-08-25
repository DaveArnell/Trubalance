import { useRef, useState } from 'react'
import type { AppState } from '../types'
import { useAuth } from '../contexts/AuthContext'
import { useWorkspace } from '../contexts/WorkspaceContext'
import { isSupabaseConfigured } from '../lib/supabase'
import { deleteUserAccount, finishSelfAccountDeletion } from '../services/accountDeletion'
import { summarizeAppState } from '../utils/localStateStorage'

interface DataExportPanelProps {
  state: AppState
  /** Kept for call-site compatibility; restore-from-file was removed. */
  onReplaceState?: (state: AppState) => void
  embedded?: boolean
}

export function DataExportPanel({ state, embedded = false }: DataExportPanelProps) {
  const { user } = useAuth()
  const { remoteEnabled, readOnly, cancelPendingPersist } = useWorkspace()
  const [status, setStatus] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deletingAccount, setDeletingAccount] = useState(false)
  const downloadInFlight = useRef(false)

  const summary = summarizeAppState(state)
  const signedIn = Boolean(user)
  const cloudBacked = remoteEnabled && isSupabaseConfigured

  const handleDownload = () => {
    if (downloadInFlight.current) return
    downloadInFlight.current = true
    try {
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `cash-prophet-backup-${new Date().toISOString().slice(0, 10)}.json`
      link.click()
      URL.revokeObjectURL(url)
      setStatus('Download started.')
    } finally {
      downloadInFlight.current = false
    }
  }

  const handleDeleteAccount = async () => {
    if (!signedIn || readOnly || deleteConfirm.trim().toUpperCase() !== 'DELETE') return
    const confirmed = window.confirm(
      'This permanently deletes your account, workspace, and all saved data. You will be signed out. Continue?',
    )
    if (!confirmed) return

    setDeletingAccount(true)
    setStatus(null)
    try {
      cancelPendingPersist()
      const { error } = await deleteUserAccount()
      if (error) {
        setStatus(error)
        return
      }
      await finishSelfAccountDeletion()
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Could not delete your account.')
      setDeletingAccount(false)
    }
  }

  const body = (
    <>
      <div className="data-export-summary">
        <p className="data-export-summary-label">
          Workspace: <strong>{summary.label}</strong>
        </p>
        <ul className="data-export-stats muted">
          <li>{summary.businesses} businesses</li>
          <li>{summary.commitments} monthly / planned costs</li>
          <li>{summary.receipts} expected receipts</li>
          <li>{summary.planners} reserve plans</li>
          <li>{summary.accounts} accounts</li>
        </ul>
        <p className="muted">
          {cloudBacked
            ? 'Your numbers save to your account automatically. You can download a file copy if you want one.'
            : 'Download a file copy of this workspace any time.'}
        </p>
      </div>

      <div className="data-export-actions">
        <button type="button" className="btn-primary btn-tiny" disabled={readOnly} onClick={handleDownload}>
          Download a copy
        </button>
      </div>

      {signedIn && (
        <article className="data-export-block data-export-danger-zone">
          <h3>Delete your account and data</h3>
          <p className="muted">
            Permanently removes your account and workspace. Download a copy first if you want to keep one.
          </p>
          <label className="data-export-delete-confirm">
            <span className="muted">Type DELETE to confirm</span>
            <input
              className="admin-input"
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="DELETE"
              disabled={readOnly || deletingAccount}
              autoComplete="off"
            />
          </label>
          <button
            type="button"
            className="btn-ghost btn-tiny admin-danger-btn"
            disabled={readOnly || deletingAccount || deleteConfirm.trim().toUpperCase() !== 'DELETE'}
            onClick={() => void handleDeleteAccount()}
          >
            {deletingAccount ? 'Deleting…' : 'Delete my account and all data'}
          </button>
        </article>
      )}

      {status && <p className="data-export-status">{status}</p>}
    </>
  )

  if (embedded) {
    return <div className="data-export-embedded">{body}</div>
  }

  return (
    <section className="card data-export-card">
      <div className="card-head card-head-compact">
        <div>
          <h2>Your data</h2>
          <p className="muted data-export-lead">Download a copy, or delete your account.</p>
        </div>
      </div>
      {body}
    </section>
  )
}
