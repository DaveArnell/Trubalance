import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { AppState } from '../types'
import { useAuth } from '../contexts/AuthContext'
import { useWorkspace } from '../contexts/WorkspaceContext'
import { isSupabaseConfigured } from '../lib/supabase'
import { deleteUserAccount, finishSelfAccountDeletion } from '../services/accountDeletion'
import { backupBrowserStateToSession, readSessionBackup, sessionBackupLooksRicher, summarizeAppState } from '../utils/localStateStorage'
import { parseImportedAppState } from '../utils/importAppState'
import {
  diagnoseReservePlanners,
  recoverWorkspaceFromHistory,
  reservePlannersMissingDeposit,
} from '../utils/workspaceRecovery'

interface DataExportPanelProps {
  state: AppState
  onReplaceState: (state: AppState) => void
  embedded?: boolean
}

export function DataExportPanel({ state, onReplaceState, embedded = false }: DataExportPanelProps) {
  const { user } = useAuth()
  const {
    remoteEnabled,
    readOnly,
    cancelPendingPersist,
    restoreWorkspaceState,
    syncMissingLocalToCloud,
    reload,
  } = useWorkspace()
  const [status, setStatus] = useState<string | null>(null)
  const [pendingImport, setPendingImport] = useState<AppState | null>(null)
  const [importing, setImporting] = useState(false)
  const [restoringBackup, setRestoringBackup] = useState(false)
  const [recoveringHistory, setRecoveringHistory] = useState(false)
  const [syncingDevice, setSyncingDevice] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deletingAccount, setDeletingAccount] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const sessionBackup = readSessionBackup()
  const sessionBackupSummary = sessionBackup ? summarizeAppState(sessionBackup) : null

  const summary = summarizeAppState(state)
  const signedIn = Boolean(user)
  const cloudBacked = remoteEnabled && isSupabaseConfigured
  const emptyReservePlans = reservePlannersMissingDeposit(state)
  const historyReceiptCount = (state.historyRecords ?? []).reduce(
    (max, record) => Math.max(max, record.expectedReceipts?.length ?? 0),
    0,
  )
  const canRecoverFromHistory =
    (state.historyRecords?.length ?? 0) > 0 &&
    (summary.receipts < historyReceiptCount || emptyReservePlans.length > 0)

  const handleSyncThisDevice = async () => {
    if (!cloudBacked || readOnly) return
    setSyncingDevice(true)
    setStatus(null)
    try {
      const openReceipts = state.expectedReceipts.filter((receipt) => !receipt.received).length
      const added = await syncMissingLocalToCloud(state)
      if (!added) {
        setStatus('Could not sync — check you are signed in.')
        return
      }
      if (added.total === 0 && openReceipts === 0) {
        setStatus(
          'This device has no open expected receipts to upload. If the phone still shows some, stay on Receipts there, then sync again.',
        )
      } else if (added.total === 0) {
        setStatus(
          `Account already had these receipts (${openReceipts} open on this device). Hard-refresh the PC (Ctrl+Shift+R). If it is still empty, check Viewing scope matches the phone.`,
        )
      } else {
        setStatus(
          `Uploaded to your account (${openReceipts} open receipt${openReceipts === 1 ? '' : 's'} on this device). Now hard-refresh the PC (Ctrl+Shift+R).`,
        )
      }
      await reload()
    } catch (err) {
      console.error('[Sync] Failed:', err)
      setStatus(`Sync failed: ${err instanceof Error ? err.message : 'Unknown error'}. Try again.`)
    } finally {
      setSyncingDevice(false)
    }
  }

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

  const handleRecoverFromHistory = async () => {
    if (readOnly) return
    setRecoveringHistory(true)
    setStatus(null)
    try {
      const result = recoverWorkspaceFromHistory(state)
      if (result.receiptsRestored === 0 && result.plannersRepaired.length === 0) {
        const empty = diagnoseReservePlanners(state)
          .filter((row) => row.monthlyDeposit <= 0)
          .map((row) => row.name)
        setStatus(
          empty.length > 0
            ? `No history snapshot had enough detail to rebuild ${empty.join(', ')}. Open each Reserve Planner and re-add the bills, or restore an older JSON export if you have one.`
            : 'History did not contain missing receipts to restore.',
        )
        return
      }
      cancelPendingPersist()
      onReplaceState(result.state)
      if (cloudBacked) {
        await restoreWorkspaceState(result.state)
      }
      const parts: string[] = []
      if (result.receiptsRestored > 0) parts.push(`${result.receiptsRestored} expected receipts`)
      if (result.plannersRepaired.length > 0) {
        parts.push(`reserve bills for ${result.plannersRepaired.length} plan(s)`)
      }
      setStatus(
        `Recovered from your balance history: ${parts.join(' and ')}.` +
          (cloudBacked ? ' Saved to your account.' : '') +
          ' Check expected dates on restored receipts, and open each repaired Reserve Planner to confirm the monthly amounts.',
      )
    } catch (err) {
      console.error('[History recover] Failed:', err)
      setStatus(`Recovery failed: ${err instanceof Error ? err.message : 'Unknown error'}.`)
    } finally {
      setRecoveringHistory(false)
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
            <p className="muted">
              Your workspace syncs to your account when you are signed in. If phone and desktop disagree
              (for example expected receipts on one device only), open Settings on the device that looks
              correct and tap <strong>Sync this device to account</strong>, then refresh the other device.
            </p>
          ) : signedIn ? (
            <p className="muted">
              Cloud sync is not configured in this environment. Your workspace is stored in this browser
              only.
            </p>
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
        <button
          type="button"
          className="btn-primary btn-tiny"
          disabled={readOnly}
          onClick={handleDownload}
        >
          Download your data
        </button>
        {cloudBacked ? (
          <button
            type="button"
            className="btn-secondary btn-tiny"
            disabled={readOnly || syncingDevice}
            onClick={handleSyncThisDevice}
            title="Uploads receipts, costs and reserve plans that exist on this device but not yet in your account. Safe — does not delete anything."
          >
            {syncingDevice ? 'Syncing…' : 'Sync this device to account'}
          </button>
        ) : null}
        <button
          type="button"
          className="btn-secondary btn-tiny"
          disabled={readOnly || importing}
          onClick={() => fileInputRef.current?.click()}
        >
          Restore from file
        </button>
        {sessionBackupSummary && sessionBackupLooksRicher(sessionBackupSummary, summary) ? (
          <button
            type="button"
            className="btn-secondary btn-tiny"
            disabled={readOnly || restoringBackup}
            onClick={handleRestoreSessionBackup}
          >
            Restore browser backup
            {sessionBackupSummary.planners > summary.planners ||
            sessionBackupSummary.receipts > summary.receipts
              ? ` (${sessionBackupSummary.planners} plans, ${sessionBackupSummary.receipts} receipts)`
              : ''}
          </button>
        ) : null}
        {canRecoverFromHistory ? (
          <button
            type="button"
            className="btn-secondary btn-tiny"
            disabled={readOnly || recoveringHistory}
            onClick={handleRecoverFromHistory}
          >
            {recoveringHistory ? 'Recovering…' : 'Recover from balance history'}
          </button>
        ) : null}
        {emptyReservePlans.length > 0 ? (
          <p className="muted data-export-warning">
            These reserve plans have no monthly bills right now, so they will not show in Accruing:{' '}
            {emptyReservePlans.join(', ')}. Use recovery above, or re-add bills in each Reserve Planner.
          </p>
        ) : null}
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          onChange={handleFileChange}
        />
      </div>

      {signedIn && (
        <article className="data-export-block data-export-danger-zone">
          <h3>Delete your account and data</h3>
          <p className="muted">
            Permanently removes your account and workspace. Download an export first if you want a copy.
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
