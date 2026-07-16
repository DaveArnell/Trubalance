import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { AppState } from '../types'
import { useAuth } from '../contexts/AuthContext'
import { useWorkspace } from '../contexts/WorkspaceContext'
import { isSupabaseConfigured } from '../lib/supabase'
import { deleteUserAccount, finishSelfAccountDeletion } from '../services/accountDeletion'
import { backupBrowserStateToSession, readSessionBackup, summarizeAppState } from '../utils/localStateStorage'
import { parseImportedAppState } from '../utils/importAppState'

interface DataExportPanelProps {
  state: AppState
  onReplaceState: (state: AppState) => void
  embedded?: boolean
}

export function DataExportPanel({ state, onReplaceState, embedded = false }: DataExportPanelProps) {
  const { user } = useAuth()
  const { remoteEnabled, readOnly, cancelPendingPersist, restoreWorkspaceState } = useWorkspace()
  const [status, setStatus] = useState<string | null>(null)
  const [pendingImport, setPendingImport] = useState<AppState | null>(null)
  const [importing, setImporting] = useState(false)
  const [restoringBackup, setRestoringBackup] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deletingAccount, setDeletingAccount] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const sessionBackup = readSessionBackup()
  const sessionBackupSummary = sessionBackup ? summarizeAppState(sessionBackup) : null

  const summary = summarizeAppState(state)
  const signedIn = Boolean(user)
  const cloudBacked = remoteEnabled && isSupabaseConfigured

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `trubalance-export-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
    setStatus('Download started.')
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
      setStatus('Could not read that file. Check it is a Trubalance JSON export.')
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
      console.log('[Import] State to restore:', {
        commitments: withOrigin.commitments.length,
        receipts: withOrigin.expectedReceipts.length,
        planners: withOrigin.reservePlanners.length,
        sampleCommitment: withOrigin.commitments[0] ? {
          name: withOrigin.commitments[0].name,
          lastPaidPeriod: withOrigin.commitments[0].lastPaidPeriod,
          createdAt: withOrigin.commitments[0].createdAt,
        } : null,
      })
      onReplaceState(withOrigin)
      if (cloudBacked) {
        await restoreWorkspaceState(withOrigin)
      }
      const summary = summarizeAppState(withOrigin)
      setPendingImport(null)
      setStatus(
        `Restored "${summary.label}" — ${summary.commitments} costs, ${summary.receipts} receipts, ${summary.planners} planners.` +
        (cloudBacked ? ' Saved to your account.' : ''),
      )
    } catch (err) {
      console.error('[Import] Failed:', err)
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
      if (cloudBacked) {
        await restoreWorkspaceState(withOrigin)
      }
      const restored = summarizeAppState(withOrigin)
      setStatus(
        `Restored browser backup from this session — ${restored.receipts} expected receipts, ${restored.commitments} costs.` +
          (cloudBacked ? ' Saved to your account.' : ''),
      )
    } catch (err) {
      console.error('[Restore backup] Failed:', err)
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

  const body = (
    <>
      <div className="data-export-info">
        <article className="data-export-block">
          <h3>Where it is saved</h3>
          {cloudBacked ? (
            <ul className="data-export-points">
              <li>
                <strong>Your account</strong> — structure, balances, commitments, reserves, and history
                sync to our database when you are signed in.
              </li>
              <li>
                <strong>This browser</strong> — a working copy while you use the app. Changes save to your
                account automatically.
              </li>
            </ul>
          ) : signedIn ? (
            <p className="muted">
              Cloud sync is not configured in this environment. Your workspace is stored in this browser
              only.
            </p>
          ) : (
            <ul className="data-export-points">
              <li>
                <strong>This browser only</strong> — everything stays on this device until you create an
                account or download a backup.
              </li>
              <li>
                <Link to="/signup">Create a free account</Link> to keep your data when you switch
                browsers or computers.
              </li>
            </ul>
          )}
        </article>

        <article className="data-export-block">
          <h3>Could you lose it?</h3>
          <ul className="data-export-points">
            {cloudBacked ? (
              <>
                <li>
                  Signing in on another device reloads your workspace from your account — you should not
                  lose data by changing browser or computer.
                </li>
                <li>
                  Download an export occasionally for your own records.
                </li>
              </>
            ) : (
              <>
                <li>
                  <strong className="data-export-risk">Yes, without an account</strong> — clearing browser
                  data or using another device means starting fresh unless you have a backup file.
                </li>
                <li>Download a JSON export before trying anything that might reset this browser.</li>
              </>
            )}
          </ul>
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
          <li>{summary.accounts} accounts</li>
        </ul>
      </div>

      <div className="data-export-actions">
        <button
          type="button"
          className="btn-primary btn-tiny"
          disabled={readOnly}
          onClick={handleDownload}
        >
          Download your data
        </button>
        <button
          type="button"
          className="btn-secondary btn-tiny"
          disabled={readOnly || importing}
          onClick={() => fileInputRef.current?.click()}
        >
          Restore from file
        </button>
        {sessionBackupSummary && sessionBackupSummary.receipts > summary.receipts ? (
          <button
            type="button"
            className="btn-secondary btn-tiny"
            disabled={readOnly || restoringBackup}
            onClick={handleRestoreSessionBackup}
          >
            Restore browser backup
          </button>
        ) : null}
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          onChange={handleFileChange}
        />
        <p className="muted data-export-legal">
          Read our <Link to="/privacy">Privacy policy</Link> and <Link to="/terms">Terms of service</Link>.
        </p>
      </div>

      {signedIn && (
        <article className="data-export-block data-export-danger-zone">
          <h3>Delete your account and data</h3>
          <p className="muted">
            Under UK GDPR you can request erasure of your personal data. This permanently removes your
            account, workspace, balances, commitments, and history from our servers. Download an export
            first if you want a copy.
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
            onClick={handleDeleteAccount}
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
              onClick={handleConfirmImport}
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
            Download a copy of your workspace any time, or restore from a file you saved earlier. Layout
            preferences stay in this browser only and are not included in exports.
          </p>
        </div>
      </div>
      {body}
    </section>
  )
}
