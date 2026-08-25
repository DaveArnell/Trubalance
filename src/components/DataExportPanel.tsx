import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { AppState } from '../types'
import { useAuth } from '../contexts/AuthContext'
import { useWorkspace } from '../contexts/WorkspaceContext'
import { isSupabaseConfigured } from '../lib/supabase'
import { deleteUserAccount, finishSelfAccountDeletion } from '../services/accountDeletion'
import { backupBrowserStateToSession, readSessionBackup, sessionBackupLooksRicher, summarizeAppState } from '../utils/localStateStorage'
import { parseImportedAppState } from '../utils/importAppState'
import {
  applyRestorePointPayload,
  insertRestorePoint,
  listRestorePoints,
  loadRestorePointPayload,
  type RestorePointMeta,
} from '../services/restorePoints'

interface DataExportPanelProps {
  state: AppState
  onReplaceState: (state: AppState) => void
  embedded?: boolean
}

export function DataExportPanel({ state, onReplaceState, embedded = false }: DataExportPanelProps) {
  const { user } = useAuth()
  const { workspaceId, remoteEnabled, readOnly, cancelPendingPersist, restoreWorkspaceState } = useWorkspace()
  const [status, setStatus] = useState<string | null>(null)
  const [pendingImport, setPendingImport] = useState<AppState | null>(null)
  const [importing, setImporting] = useState(false)
  const [restoringBackup, setRestoringBackup] = useState(false)
  const [restorePoints, setRestorePoints] = useState<RestorePointMeta[]>([])
  const [restoringPointId, setRestoringPointId] = useState<string | null>(null)
  const [savingPoint, setSavingPoint] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deletingAccount, setDeletingAccount] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const sessionBackup = readSessionBackup()
  const sessionBackupSummary = sessionBackup ? summarizeAppState(sessionBackup) : null

  const summary = summarizeAppState(state)
  const signedIn = Boolean(user)
  const cloudBacked = remoteEnabled && isSupabaseConfigured

  useEffect(() => {
    if (!workspaceId) {
      setRestorePoints([])
      return
    }
    void listRestorePoints(workspaceId).then(setRestorePoints)
  }, [workspaceId, cloudBacked, state.snapshots.length, state.commitments.length])

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `cash-prophet-backup-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
    setStatus('Download started.')
  }

  const handleSaveRestorePoint = async () => {
    if (!workspaceId || readOnly) return
    setSavingPoint(true)
    setStatus(null)
    try {
      await insertRestorePoint(workspaceId, state, 'manual')
      setRestorePoints(await listRestorePoints(workspaceId))
      setStatus('Saved a copy you can restore later.')
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Could not save a copy just now. Try downloading your data instead.')
    } finally {
      setSavingPoint(false)
    }
  }

  const handleRestorePoint = async (point: RestorePointMeta) => {
    if (!workspaceId || readOnly) return
    const confirmed = window.confirm(
      `Replace your current workspace with the copy from ${point.label}?`,
    )
    if (!confirmed) return
    setRestoringPointId(point.id)
    setStatus(null)
    try {
      const payload = await loadRestorePointPayload(workspaceId, point.id)
      if (!payload) {
        setStatus('That copy could not be loaded.')
        return
      }
      cancelPendingPersist()
      const next = applyRestorePointPayload(state, payload)
      onReplaceState(next)
      if (cloudBacked) await restoreWorkspaceState(next)
      setStatus(`Restored the copy from ${point.label}.`)
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Restore failed.')
    } finally {
      setRestoringPointId(null)
    }
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setStatus(null)
    try {
      const text = await file.text()
      const parsed = JSON.parse(text) as unknown
      const result = parseImportedAppState(parsed)
      if ('error' in result) {
        setStatus(result.error)
        return
      }
      setPendingImport(result.state)
    } catch {
      setStatus('Could not read that file. Use a backup downloaded from Cash Prophet.')
    }
  }

  const handleConfirmImport = async () => {
    if (!pendingImport || readOnly) return
    setImporting(true)
    setStatus(null)
    try {
      backupBrowserStateToSession()
      cancelPendingPersist()
      const withOrigin: AppState = { ...pendingImport, workspaceOrigin: 'user' }
      onReplaceState(withOrigin)
      if (cloudBacked) await restoreWorkspaceState(withOrigin)
      const imported = summarizeAppState(withOrigin)
      setPendingImport(null)
      setStatus(`Restored ${imported.label}.`)
    } catch (err) {
      setStatus(`Restore failed: ${err instanceof Error ? err.message : 'Unknown error'}. Try again.`)
    } finally {
      setImporting(false)
    }
  }

  const handleRestoreSessionBackup = async () => {
    const backup = readSessionBackup()
    if (!backup || readOnly) return
    setRestoringBackup(true)
    setStatus(null)
    try {
      cancelPendingPersist()
      const withOrigin: AppState = { ...backup, workspaceOrigin: 'user' }
      onReplaceState(withOrigin)
      if (cloudBacked) await restoreWorkspaceState(withOrigin)
      setStatus('Restored the copy this browser still had from earlier in this session.')
    } catch (err) {
      setStatus(`Restore failed: ${err instanceof Error ? err.message : 'Unknown error'}.`)
    } finally {
      setRestoringBackup(false)
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

  const pendingSummary = pendingImport ? summarizeAppState(pendingImport) : null
  const showSessionRestore =
    Boolean(sessionBackupSummary) && sessionBackupLooksRicher(sessionBackupSummary!, summary)

  const body = (
    <>
      <div className="data-export-info">
        <article className="data-export-block">
          <h3>Where it is saved</h3>
          {cloudBacked ? (
            <p className="muted">
              Your workspace saves to your account while you are signed in. Phone and desktop stay in
              step on their own. Download a copy if you want a file on this computer.
            </p>
          ) : signedIn ? (
            <p className="muted">Your workspace is stored in this browser only.</p>
          ) : (
            <p className="muted">
              Everything stays in this browser until you{' '}
              <Link to="/signup">create a free account</Link> or download a backup.
            </p>
          )}
        </article>
      </div>

      <div className="data-export-summary">
        <p className="data-export-summary-label">
          Current workspace: <strong>{summary.label}</strong>
        </p>
        <ul className="data-export-stats muted">
          <li>{summary.businesses} businesses</li>
          <li>{summary.commitments} monthly / planned costs</li>
          <li>{summary.receipts} expected receipts</li>
          <li>{summary.planners} reserve plans</li>
          <li>{summary.accounts} accounts</li>
        </ul>
      </div>

      <div className="data-export-actions">
        <button type="button" className="btn-primary btn-tiny" disabled={readOnly} onClick={handleDownload}>
          Download a copy
        </button>
        {workspaceId ? (
          <button
            type="button"
            className="btn-secondary btn-tiny"
            disabled={readOnly || savingPoint}
            onClick={() => void handleSaveRestorePoint()}
          >
            {savingPoint ? 'Saving…' : 'Save a restore point'}
          </button>
        ) : null}
        <button
          type="button"
          className="btn-secondary btn-tiny"
          disabled={readOnly || importing}
          onClick={() => fileInputRef.current?.click()}
        >
          Restore from a file
        </button>
        {showSessionRestore ? (
          <button
            type="button"
            className="btn-secondary btn-tiny"
            disabled={readOnly || restoringBackup}
            onClick={() => void handleRestoreSessionBackup()}
          >
            Restore this browser’s earlier copy
          </button>
        ) : null}
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          onChange={(event) => void handleFileChange(event)}
        />
      </div>

      {restorePoints.length > 0 ? (
        <article className="data-export-block">
          <h3>Restore points</h3>
          <p className="muted">Saved copies of this workspace. Restoring one replaces what you see now.</p>
          <ul className="data-export-points">
            {restorePoints.map((point) => (
              <li key={point.id}>
                <span>
                  {point.label}
                  {point.kind === 'manual' ? ' (saved by you)' : ''}
                </span>
                <button
                  type="button"
                  className="btn-secondary btn-tiny"
                  disabled={readOnly || restoringPointId != null}
                  onClick={() => void handleRestorePoint(point)}
                >
                  {restoringPointId === point.id ? 'Restoring…' : 'Restore'}
                </button>
              </li>
            ))}
          </ul>
        </article>
      ) : null}

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

      {pendingImport && pendingSummary && (
        <div className="data-export-import-confirm" role="alertdialog" aria-labelledby="import-confirm-title">
          <h3 id="import-confirm-title">Replace your current workspace?</h3>
          <p className="muted">
            This will swap everything in the app for what is in the file —{' '}
            <strong>{pendingSummary.label}</strong> ({pendingSummary.businesses} businesses,{' '}
            {pendingSummary.accounts} accounts).
          </p>
          <p className="data-export-import-warning">
            Your current workspace will be overwritten. Download a backup first if you are unsure.
          </p>
          <div className="data-export-import-actions">
            <button
              type="button"
              className="btn-primary btn-tiny"
              disabled={importing}
              onClick={() => void handleConfirmImport()}
            >
              {importing ? 'Restoring…' : 'Yes, restore from file'}
            </button>
            <button
              type="button"
              className="btn-ghost btn-tiny"
              disabled={importing}
              onClick={() => setPendingImport(null)}
            >
              Cancel
            </button>
          </div>
        </div>
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
          <p className="muted data-export-lead">
            Download a copy of your workspace, restore from a file you saved, or delete your account.
          </p>
        </div>
      </div>
      {body}
    </section>
  )
}
