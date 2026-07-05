import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { MarketingFooter, MarketingHeader, MarketingShell } from '../components/marketing/MarketingLayout'
import { useAuth } from '../contexts/AuthContext'
import { isSupabaseConfigured } from '../lib/supabase'

interface AuthFormProps {
  mode: 'login' | 'signup'
}

function AuthAside({ mode }: { mode: 'login' | 'signup' }) {
  return (
    <aside className="auth-aside">
      <div className="auth-aside-inner">
        <p className="marketing-eyebrow">True Balance</p>
        <h2>{mode === 'login' ? 'Welcome back' : 'Start your free trial'}</h2>
        <p className="auth-aside-lead">
          {mode === 'login'
            ? 'Pick up where you left off — balances, commitments, and reserves in one place.'
            : 'Three months free with full access. Set up your business and see your True Balance in minutes.'}
        </p>
        <ul className="auth-aside-points">
          <li>3-month free trial — every feature unlocked</li>
          <li>No payment details required</li>
          <li>No charge until day 91 · cancel anytime</li>
          <li>Guided setup on first login</li>
        </ul>
        <div className="auth-aside-video">
          <div className="marketing-video-placeholder marketing-video-placeholder--compact">
            <span className="marketing-video-play marketing-video-play--small" aria-hidden>
              ▶
            </span>
            <p>Product overview video</p>
          </div>
        </div>
      </div>
    </aside>
  )
}

export function AuthForm({ mode }: AuthFormProps) {
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [signupDone, setSignupDone] = useState(false)

  const redirect = searchParams.get('redirect') ?? '/app'

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (mode === 'login') {
        const result = await signIn(email, password)
        if (result.error) {
          setError(result.error)
          return
        }
        navigate(redirect)
      } else {
        const result = await signUp(email, password, fullName)
        if (result.error) {
          setError(result.error)
          return
        }
        setSignupDone(true)
      }
    } finally {
      setLoading(false)
    }
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="auth-card">
        <h1>{mode === 'login' ? 'Log in' : 'Create account'}</h1>
        <p className="muted">
          Supabase is not configured. Copy <code>.env.example</code> to <code>.env.local</code> and add your
          project URL and anon key, then restart the dev server.
        </p>
        <Link to="/app" className="btn-primary btn-large">
          Continue without account (local only)
        </Link>
        <p className="auth-switch">
          <Link to="/">← Back to home</Link>
        </p>
      </div>
    )
  }

  if (signupDone) {
    return (
      <div className="auth-card">
        <h1>Check your email</h1>
        <p className="muted">
          We sent a confirmation link to <strong>{email}</strong>. Once confirmed, log in and we will walk you
          through setup.
        </p>
        <Link to="/login" className="btn-primary btn-large">
          Go to log in
        </Link>
      </div>
    )
  }

  return (
    <div className="auth-card">
      <h1>{mode === 'login' ? 'Log in' : 'Create your account'}</h1>
      <p className="auth-card-lead muted">
        {mode === 'signup'
          ? 'Your 3-month free trial starts when you confirm your email. No plan to choose — just start building.'
          : 'Open your True Balance dashboard.'}
      </p>

      <form className="auth-form" onSubmit={onSubmit}>
        {mode === 'signup' && (
          <label className="auth-field">
            <span>Full name</span>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              autoComplete="name"
              placeholder="Jane Smith"
            />
          </label>
        )}
        <label className="auth-field">
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="you@company.com"
          />
        </label>
        <label className="auth-field">
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            placeholder="At least 6 characters"
          />
        </label>

        {error && <p className="auth-error">{error}</p>}

        <button type="submit" className="btn-primary btn-large auth-submit" disabled={loading}>
          {loading ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Start free trial'}
        </button>

        {mode === 'signup' && (
          <p className="auth-legal muted">
            By starting a trial you agree to our <Link to="/terms">Terms of service</Link> and{' '}
            <Link to="/privacy">Privacy policy</Link>.
          </p>
        )}
      </form>

      {mode === 'login' && (
        <p className="auth-forgot">
          <Link to="/forgot-password">Forgot your password?</Link>
        </p>
      )}

      <p className="auth-switch">
        {mode === 'login' ? (
          <>
            No account? <Link to="/signup">Start free trial</Link>
          </>
        ) : (
          <>
            Already have an account? <Link to="/login">Log in</Link>
          </>
        )}
      </p>
    </div>
  )
}

export function LoginPage() {
  return (
    <MarketingShell>
      <MarketingHeader />
      <div className="auth-layout">
        <AuthAside mode="login" />
        <div className="auth-main">
          <AuthForm mode="login" />
        </div>
      </div>
      <MarketingFooter />
    </MarketingShell>
  )
}

export function SignupPage() {
  return (
    <MarketingShell>
      <MarketingHeader />
      <div className="auth-layout">
        <AuthAside mode="signup" />
        <div className="auth-main">
          <AuthForm mode="signup" />
        </div>
      </div>
      <MarketingFooter />
    </MarketingShell>
  )
}

export function ForgotPasswordPage() {
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const result = await resetPassword(email)
      if (result.error) {
        setError(result.error)
        return
      }
      setSent(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <MarketingShell>
      <MarketingHeader />
      <div className="auth-layout">
        <div className="auth-main">
          <div className="auth-card">
            {sent ? (
              <>
                <h1>Check your email</h1>
                <p className="muted">
                  If an account exists for <strong>{email}</strong>, we've sent a password reset link.
                  Check your inbox and follow the link to set a new password.
                </p>
                <Link to="/login" className="btn-primary btn-large">
                  Back to log in
                </Link>
              </>
            ) : (
              <>
                <h1>Forgot your password?</h1>
                <p className="auth-card-lead muted">
                  Enter the email address you signed up with and we'll send you a link to reset your password.
                </p>
                {error && <p className="auth-error">{error}</p>}
                <form onSubmit={onSubmit} className="auth-form">
                  <label className="auth-field">
                    <span>Email</span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoFocus
                    />
                  </label>
                  <button type="submit" className="btn-primary btn-large auth-submit" disabled={loading}>
                    {loading ? 'Sending…' : 'Send reset link'}
                  </button>
                </form>
                <p className="auth-switch">
                  <Link to="/login">← Back to log in</Link>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
      <MarketingFooter />
    </MarketingShell>
  )
}

export function ResetPasswordPage() {
  const { updatePassword } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    try {
      const result = await updatePassword(password)
      if (result.error) {
        setError(result.error)
        return
      }
      setDone(true)
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <MarketingShell>
        <MarketingHeader />
        <div className="auth-layout">
          <div className="auth-main">
            <div className="auth-card">
              <h1>Password updated</h1>
              <p className="muted">Your password has been changed. You can now log in with your new password.</p>
              <button
                type="button"
                className="btn-primary btn-large"
                onClick={() => navigate('/app')}
              >
                Go to dashboard
              </button>
            </div>
          </div>
        </div>
        <MarketingFooter />
      </MarketingShell>
    )
  }

  return (
    <MarketingShell>
      <MarketingHeader />
      <div className="auth-layout">
        <div className="auth-main">
          <div className="auth-card">
            <h1>Set a new password</h1>
            <p className="auth-card-lead muted">Choose a new password for your True Balance account.</p>
            {error && <p className="auth-error">{error}</p>}
            <form onSubmit={onSubmit} className="auth-form">
              <label className="auth-field">
                <span>New password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoFocus
                  minLength={8}
                />
              </label>
              <label className="auth-field">
                <span>Confirm password</span>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  minLength={8}
                />
              </label>
              <button type="submit" className="btn-primary btn-large auth-submit" disabled={loading}>
                {loading ? 'Updating…' : 'Update password'}
              </button>
            </form>
          </div>
        </div>
      </div>
      <MarketingFooter />
    </MarketingShell>
  )
}
