import { type ReactNode, useCallback } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { isSupabaseConfigured } from '../../lib/supabase'
import { COMPANY_INFO } from '../../content/companyInfo'
import { FOUNDER_PROGRAM_FOOTNOTE, FOUNDER_PROGRAM_HEADLINE } from '../../config/founderProgram'
import { CompanyLegalNotice } from './CompanyLegalNotice'

const NAV = [
  { id: 'features', label: 'Features' },
  { id: 'how-it-works', label: 'How it works' },
  { id: 'pricing', label: 'Pricing' },
] as const

const DEMO_NAV = { to: '/see-how-it-works', label: 'Try demo' } as const
const BLOG_NAV = { to: '/blog', label: 'Blog' } as const

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
  const { user, loading } = useAuth()

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
          <Link to={DEMO_NAV.to}>{DEMO_NAV.label}</Link>
          <Link to={BLOG_NAV.to}>{BLOG_NAV.label}</Link>
        </nav>

        <div className="marketing-header-cta">
          {!loading && user ? (
            <Link to="/app" className="btn-primary marketing-nav-btn">
              Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn-ghost marketing-nav-btn">
                Log in
              </Link>
              <Link to="/signup" className="btn-primary marketing-nav-btn">
                Get started
              </Link>
            </>
          )}
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
            Know what is genuinely yours, not just what is in the account.
          </p>
          <CompanyLegalNotice variant="footer" />
        </div>

        <div className="marketing-footer-columns">
          <div>
            <p className="marketing-footer-heading">Company</p>
            <a href={`mailto:${COMPANY_INFO.contactEmail}`}>Contact</a>
            <span className="marketing-footer-plain">Vocatio.io</span>
          </div>
          <div>
            <p className="marketing-footer-heading">Product</p>
            <Link to="/#features">Features</Link>
            <Link to="/#how-it-works">How it works</Link>
            <Link to="/#pricing">Pricing</Link>
            <Link to="/true-balance-method">The method</Link>
            <Link to="/blog">Blog</Link>
            <Link to="/see-how-it-works">Demo</Link>
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
        </div>
      </div>

      <div className="marketing-footer-bottom">
        <p>
          © {new Date().getFullYear()} {COMPANY_INFO.legalName}. All rights reserved.{' '}
          <Link to="/privacy">Privacy</Link>
          {' · '}
          <Link to="/terms">Terms</Link>
        </p>
        <p className="marketing-footer-trial muted">
          {FOUNDER_PROGRAM_HEADLINE}. {FOUNDER_PROGRAM_FOOTNOTE}
        </p>
      </div>
    </footer>
  )
}
