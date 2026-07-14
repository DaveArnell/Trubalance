import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { MarketingFooter, MarketingHeader, MarketingShell } from '../components/marketing/MarketingLayout'
import { useAuth } from '../contexts/AuthContext'
import { isSupabaseConfigured } from '../lib/supabase'
import {
  FOUNDER_PROGRAM_BODY,
  FOUNDER_PROGRAM_FOOTNOTE,
  FOUNDER_PROGRAM_HEADLINE,
} from '../config/founderProgram'
import { LOGIN_SEO, SIGNUP_SEO } from '../content/marketingSeo'
import { usePageMeta } from '../hooks/usePageMeta'

interface AuthFormProps {
  mode: 'login' | 'signup'
}

function AuthAside({ mode }: { mode: 'login' | 'signup' }) {
  return (
    <aside className="auth-aside">
      <div className="auth-aside-inner">
        <p className="marketing-eyebrow">True Balance</p>
        <h2>{mode === 'login' ? 'Welcome back' : 'Join early access'}</h2>
        <p className="auth-aside-lead">
          {mode === 'login'
            ? 'Pick up where you left off — balances, commitments, and reserves in one place.'
            : `Follow the True Balance Method in software. ${FOUNDER_PROGRAM_HEADLINE}. ${FOUNDER_PROGRAM_BODY}`}
        </p>
        <ul className="auth-aside-points">
          <li>{FOUNDER_PROGRAM_HEADLINE}</li>
          <li>Full access — every feature unlocked</li>
          <li>No payment details required</li>
          <li>{FOUNDER_PROGRAM_FOOTNOTE}</li>
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

function GoogleIcon() {
  return (
    <svg className="auth-google-icon" width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}

export function AuthForm({ mode }: AuthFormProps) {
  const { signIn, signInWithGoogle, signUp } = useAuth()
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
          through setup. If you are among the first 50 accounts, you will have lifetime free access.
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
          ? `Confirm your email to get started. ${FOUNDER_PROGRAM_HEADLINE} if you are among the first 50 accounts — otherwise your 3-month trial begins when you confirm.`
          : 'Open your True Balance dashboard.'}
      </p>

      <form className="auth-form" onSubmit={onSubmit}>
        <button
          type="button"
          className="btn-secondary btn-large auth-submit auth-google-btn"
          disabled={loading}
          onClick={async () => {
            setError(null)
            setLoading(true)
            try {
              const result = await signInWithGoogle()
              if (result.error) setError(result.error)
            } finally {
              setLoading(false)
            }
          }}
        >
          <GoogleIcon />
          Continue with Google
        </button>
        <p className="auth-legal muted">or use your email and password</p>

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
  usePageMeta(LOGIN_SEO)
  return (
    <MarketingShell>
      <MarketingHeader />
      <div className="auth-layout-wrap">
        <div className="auth-layout">
          <AuthAside mode="login" />
          <div className="auth-main">
            <AuthForm mode="login" />
          </div>
        </div>
      </div>
      <MarketingFooter />
    </MarketingShell>
  )
}

export function SignupPage() {
  usePageMeta(SIGNUP_SEO)
  return (
    <MarketingShell>
      <MarketingHeader />
      <div className="auth-layout-wrap">
        <div className="auth-layout">
          <AuthAside mode="signup" />
          <div className="auth-main">
            <AuthForm mode="signup" />
          </div>
        </div>
      </div>
      <MarketingFooter />
    </MarketingShell>
  )
}

export function ForgotPasswordPage() {
  usePageMeta({
    title: 'Forgot password',
    description: 'Reset your True Balance password.',
    path: '/forgot-password',
    noindex: true,
  })
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
      <div className="auth-layout-wrap">
        <div className="auth-layout auth-layout--solo">
          <div className="auth-main auth-main--solo">
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
      </div>
      <MarketingFooter />
    </MarketingShell>
  )
}

export function ResetPasswordPage() {
  usePageMeta({
    title: 'Reset password',
    description: 'Choose a new True Balance password.',
    path: '/reset-password',
    noindex: true,
  })
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
        <div className="auth-layout-wrap">
          <div className="auth-layout auth-layout--solo">
            <div className="auth-main auth-main--solo">
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
        </div>
        <MarketingFooter />
      </MarketingShell>
    )
  }

  return (
    <MarketingShell>
      <MarketingHeader />
      <div className="auth-layout-wrap">
        <div className="auth-layout auth-layout--solo">
          <div className="auth-main auth-main--solo">
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
      </div>
      <MarketingFooter />
    </MarketingShell>
  )
}
