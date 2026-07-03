import { type ReactNode, useCallback } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { isSupabaseConfigured } from '../../lib/supabase'

const NAV = [
  { id: 'features', label: 'Features' },
  { id: 'how-it-works', label: 'How it works' },
  { id: 'pricing', label: 'Pricing' },
] as const

export function scrollToMarketingSection(id: string) {
  const shell = document.querySelector('.marketing-shell')
  const target = document.getElementById(id)
  if (!shell || !target) return
  const shellTop = shell.getBoundingClientRect().top
  const targetTop = target.getBoundingClientRect().top
  shell.scrollTo({
    top: shell.scrollTop + (targetTop - shellTop) - 72,
    behavior: 'smooth',
  })
}

export function MarketingShell({ children }: { children: ReactNode }) {
  return <div className="marketing-shell">{children}</div>
}

export function MarketingHeader() {
  const location = useLocation()
  const isLanding = location.pathname === '/'

  const handleNav = useCallback(
    (id: string) => (event: React.MouseEvent) => {
      if (!isLanding) return
      event.preventDefault()
      scrollToMarketingSection(id)
    },
    [isLanding],
  )

  return (
    <header className="marketing-header">
      <div className="marketing-header-inner">
        <Link to="/" className="marketing-logo">
          <span className="marketing-logo-mark" aria-hidden />
          True Balance
        </Link>

        <nav className="marketing-nav" aria-label="Main">
          {NAV.map((item) =>
            isLanding ? (
              <a key={item.id} href={`#${item.id}`} onClick={handleNav(item.id)}>
                {item.label}
              </a>
            ) : (
              <Link key={item.id} to={`/#${item.id}`}>
                {item.label}
              </Link>
            ),
          )}
        </nav>

        <div className="marketing-header-cta">
          <Link to="/login" className="btn-ghost marketing-nav-btn">
            Log in
          </Link>
          <Link to="/signup" className="btn-primary marketing-nav-btn">
            Get started
          </Link>
        </div>
      </div>
    </header>
  )
}

export function MarketingFooter() {
  return (
    <footer className="marketing-footer">
      <div className="marketing-footer-inner">
        <div className="marketing-footer-brand">
          <Link to="/" className="marketing-logo marketing-logo--footer">
            <span className="marketing-logo-mark" aria-hidden />
            True Balance
          </Link>
          <p className="marketing-footer-tagline">
            Know what is genuinely yours — not just what is in the account.
          </p>
        </div>

        <div className="marketing-footer-columns">
          <div>
            <p className="marketing-footer-heading">Product</p>
            <Link to="/#features">Features</Link>
            <Link to="/#how-it-works">How it works</Link>
            <Link to="/#pricing">Pricing</Link>
            {!isSupabaseConfigured && <Link to="/app">Try locally</Link>}
          </div>
          <div>
            <p className="marketing-footer-heading">Account</p>
            <Link to="/signup">Start free trial</Link>
            <Link to="/login">Log in</Link>
          </div>
          <div>
            <p className="marketing-footer-heading">Legal</p>
            <Link to="/privacy">Privacy policy</Link>
            <Link to="/terms">Terms of service</Link>
          </div>
          <div>
            <p className="marketing-footer-heading">Team</p>
            <Link to="/platform-admin">Platform admin</Link>
          </div>
        </div>
      </div>

      <div className="marketing-footer-bottom">
        <p>
          © {new Date().getFullYear()} True Balance. All rights reserved.{' '}
          <Link to="/privacy">Privacy</Link>
          {' · '}
          <Link to="/terms">Terms</Link>
        </p>
        <p className="marketing-footer-trial muted">3-month free trial on all plans. No card required to start.</p>
      </div>
    </footer>
  )
}
