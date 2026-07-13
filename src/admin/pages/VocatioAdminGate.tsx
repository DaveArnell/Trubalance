import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getSupabase, isSupabaseConfigured } from '../../lib/supabase'
import { useAdminAuth } from '../../contexts/AdminAuthContext'
import { useAuth } from '../../contexts/AuthContext'

function isVocatioEmail(email: string): boolean {
  return email.toLowerCase().endsWith('@vocatio.io')
}

export function VocatioAdminGate() {
  const { signIn, signOut } = useAuth()
  const {
    loading,
    state,
    email,
    error,
    infoMessage,
    sendEmailCode,
    submitEmailCode,
    refresh,
  } = useAdminAuth()

  const [emailInput, setEmailInput] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [codeSent, setCodeSent] = useState(false)

  useEffect(() => {
    if (state !== 'needs_2fa' || codeSent || error) return
    void (async () => {
      setBusy(true)
      const sent = await sendEmailCode()
      if (sent) setCodeSent(true)
      setBusy(false)
    })()
  }, [state, codeSent, error, sendEmailCode])

  const handleGoogleSignIn = async () => {
    if (!isSupabaseConfigured) return
    setBusy(true)
    setFormError(null)
    const supabase = getSupabase()
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/vocatio-admin`,
      },
    })
    if (oauthError) setFormError(oauthError.message)
    setBusy(false)
  }

  if (loading) {
    return (
      <div className="admin-gate">
        <p className="muted">Checking admin access…</p>
      </div>
    )
  }

  if (state === 'unconfigured') {
    return (
      <div className="admin-gate">
        <div className="auth-card">
          <h1>Vocatio admin</h1>
          <p className="muted">Supabase must be configured for the admin panel.</p>
          <Link to="/" className="btn-secondary">
            ← Home
          </Link>
        </div>
      </div>
    )
  }

  if (state === 'wrong_account') {
    return (
      <div className="admin-gate">
        <div className="auth-card admin-auth-card">
          <h1>Wrong account</h1>
          <p className="muted">
            You are signed in as <strong>{email}</strong>. Admin only works with an{' '}
            <strong>@vocatio.io</strong> account such as <strong>admin@vocatio.io</strong>.
          </p>
          {error && <p className="auth-error">{error}</p>}
          <button
            type="button"
            className="btn-primary"
            disabled={busy}
            onClick={async () => {
              setBusy(true)
              await signOut()
              setBusy(false)
            }}
          >
            Sign out and try again
          </button>
          <Link to="/app" className="btn-ghost btn-tiny">
            ← Back to True Balance
          </Link>
        </div>
      </div>
    )
  }

  if (state === 'unauthenticated') {
    const handleSignIn = async (event: React.FormEvent) => {
      event.preventDefault()
      const trimmedEmail = emailInput.trim()
      if (!isVocatioEmail(trimmedEmail)) {
        setFormError('Use your @vocatio.io email for admin access.')
        return
      }

      setBusy(true)
      setFormError(null)
      const result = await signIn(trimmedEmail, password)
      if (result.error) {
        setFormError(result.error)
        setBusy(false)
        return
      }
      setCodeSent(false)
      await refresh()
      setBusy(false)
    }

    return (
      <div className="admin-gate">
        <div className="auth-card admin-auth-card">
          <h1>Vocatio admin</h1>
          <p className="muted">
            Sign in with your <strong>@vocatio.io</strong> account. Your personal True Balance login
            cannot access this area.
          </p>
          <form onSubmit={handleSignIn} className="admin-auth-form">
            <label>
              Email
              <input
                type="email"
                autoComplete="username"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="admin@vocatio.io"
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>
            {(formError || error) && <p className="auth-error">{formError || error}</p>}
            <button type="submit" className="btn-primary" disabled={busy}>
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
          <button type="button" className="btn-ghost admin-auth-google" onClick={handleGoogleSignIn} disabled={busy}>
            Continue with Google
          </button>
          <Link to="/" className="btn-ghost btn-tiny">
            ← Back to True Balance
          </Link>
        </div>
      </div>
    )
  }

  if (state === 'not_enrolled') {
    return (
      <div className="admin-gate">
        <div className="auth-card">
          <h1>Access denied</h1>
          <p className="muted">
            {error ??
              'This Vocatio account is not enrolled for platform admin. Ask an existing operator to add you in Supabase.'}
          </p>
          <button
            type="button"
            className="btn-secondary"
            disabled={busy}
            onClick={async () => {
              setBusy(true)
              await signOut()
              setBusy(false)
            }}
          >
            Sign out
          </button>
        </div>
      </div>
    )
  }

  if (state === 'needs_2fa') {
    return (
      <div className="admin-gate">
        <div className="auth-card admin-auth-card">
          <h1>Confirm it&apos;s you</h1>
          <p className="muted">
            Signed in as <strong>{email}</strong>. Enter the 6-digit code we email to that address to
            unlock admin for 30 days on this browser.
          </p>
          {infoMessage && <p className="muted">{infoMessage}</p>}
          <form
            onSubmit={async (event) => {
              event.preventDefault()
              setBusy(true)
              setFormError(null)
              const ok = await submitEmailCode(code.trim())
              if (!ok && !error) setFormError('Invalid code')
              setBusy(false)
            }}
            className="admin-auth-form"
          >
            <label>
              6-digit email code
              <input
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />
            </label>
            {(formError || error) && <p className="auth-error">{formError || error}</p>}
            <button type="submit" className="btn-primary" disabled={busy}>
              {busy ? 'Verifying…' : 'Verify and continue'}
            </button>
          </form>
          <button
            type="button"
            className="btn-ghost btn-tiny"
            disabled={busy}
            onClick={async () => {
              setBusy(true)
              setFormError(null)
              const sent = await sendEmailCode()
              if (sent) setCodeSent(true)
              setBusy(false)
            }}
          >
            Resend code
          </button>
        </div>
      </div>
    )
  }

  return null
}
