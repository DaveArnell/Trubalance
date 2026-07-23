import { useRef, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { isSupabaseConfigured } from '../../lib/supabase'
import { COMPANY_INFO } from '../../content/companyInfo'
import { FOUNDER_PROGRAM_FOOTNOTE, FOUNDER_PROGRAM_HEADLINE } from '../../config/founderProgram'
import { REGULATORY_POSITION } from '../../content/regulatoryNotice'
import { CompanyLegalNotice } from './CompanyLegalNotice'
import { useMarketingReveal } from '../../hooks/useMarketingReveal'

/** Primary nav follows the buying journey, not the site map. Habits & blog live in the footer. */
const PRIMARY_NAV = [
  { to: '/cash-prophet', label: 'Why Cash Prophet' },
  { to: '/how-it-works', label: 'How it works' },
  { to: '/who-its-for', label: 'Who it’s for' },
  { to: '/see-how-it-works', label: 'See it' },
  { to: '/pricing', label: 'Pricing' },
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
  const shellRef = useRef<HTMLDivElement>(null)
  useMarketingReveal(shellRef)

  return (
    <div className="marketing-shell" ref={shellRef}>
      {children}
    </div>
  )
}

export function MarketingHeader() {
  const { user, loading } = useAuth()

  return (
    <header className="marketing-header">
      <div className="marketing-header-inner">
        <Link to="/" className="marketing-logo">
          <span className="marketing-logo-mark" aria-hidden />
          Cash Prophet
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
            Cash Prophet
          </Link>
          <p className="marketing-footer-tagline">
            Stop carrying your business finances around in your head.
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
            <Link to="/cash-prophet">Why Cash Prophet</Link>
            <Link to="/how-it-works">How it works</Link>
            <Link to="/who-its-for">Who it’s for</Link>
            <Link to="/how-it-works#habits">Habits</Link>
            <Link to="/blog">Blog</Link>
          </div>
          <div>
            <p className="marketing-footer-heading">Product</p>
            <Link to="/see-how-it-works">See it</Link>
            <Link to="/pricing">Pricing</Link>
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
