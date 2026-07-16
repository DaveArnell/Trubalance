import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { isSupabaseConfigured } from '../../lib/supabase'
import { COMPANY_INFO } from '../../content/companyInfo'
import { FOUNDER_PROGRAM_FOOTNOTE, FOUNDER_PROGRAM_HEADLINE } from '../../config/founderProgram'
import { REGULATORY_POSITION } from '../../content/regulatoryNotice'
import { CompanyLegalNotice } from './CompanyLegalNotice'

/** All primary nav items are full pages — keeps the site map clear. */
const PRIMARY_NAV = [
  { to: '/true-balance-method', label: 'The Method' },
  { to: '/how-it-works', label: 'How it works' },
  { to: '/habits', label: 'Habits' },
  { to: '/who-its-for', label: 'Who it’s for' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/see-how-it-works', label: 'Try demo' },
  { to: '/blog', label: 'Blog' },
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
  const { user, loading } = useAuth()

  return (
    <header className="marketing-header">
      <div className="marketing-header-inner">
        <Link to="/" className="marketing-logo">
          <span className="marketing-logo-mark" aria-hidden />
          True Balance
        </Link>

        <nav className="marketing-nav" aria-label="Main">
          {PRIMARY_NAV.map((item) => (
            <Link key={item.to} to={item.to}>
              {item.label}
            </Link>
          ))}
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
            Know what’s already committed. Make day-to-day decisions with confidence.
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
            <p className="marketing-footer-heading">Learn</p>
            <Link to="/true-balance-method">The Method</Link>
            <Link to="/how-it-works">How it works</Link>
            <Link to="/habits">Habits</Link>
            <Link to="/who-its-for">Who it’s for</Link>
            <Link to="/blog">Blog</Link>
          </div>
          <div>
            <p className="marketing-footer-heading">Product</p>
            <Link to="/pricing">Pricing</Link>
            <Link to="/see-how-it-works">Try demo</Link>
            <Link to="/signup">Start free trial</Link>
            <Link to="/login">Log in</Link>
            {!isSupabaseConfigured && <Link to="/app">Try locally</Link>}
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
        <p className="marketing-footer-regulatory muted">{REGULATORY_POSITION.shortFooter}</p>
      </div>
    </footer>
  )
}
