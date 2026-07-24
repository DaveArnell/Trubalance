import { useRef, type ReactNode } from 'react'
import { CanonicalLink } from '../CanonicalLink'
import { useAuth } from '../../contexts/AuthContext'
import { isSupabaseConfigured } from '../../lib/supabase'
import { COMPANY_INFO } from '../../content/companyInfo'
import { FOUNDER_PROGRAM_FOOTNOTE, FOUNDER_PROGRAM_HEADLINE } from '../../config/founderProgram'
import { REGULATORY_POSITION } from '../../content/regulatoryNotice'
import { CompanyLegalNotice } from './CompanyLegalNotice'
import { CashProphetLogo } from './CashProphetLogo'
import { useMarketingReveal } from '../../hooks/useMarketingReveal'
import { PRIMARY_NAV } from '../../content/marketingNav'

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
        <CanonicalLink to="/" className="marketing-logo" aria-label="Cash Prophet home">
          <CashProphetLogo variant="header" />
        </CanonicalLink>

        <nav className="marketing-nav" aria-label="Main">
          {PRIMARY_NAV.map((item) => (
            <CanonicalLink key={item.to} to={item.to}>
              {item.label}
            </CanonicalLink>
          ))}
        </nav>

        <div className="marketing-header-cta">
          {!loading && user ? (
            <CanonicalLink to="/app" className="btn-primary marketing-nav-btn">
              Dashboard
            </CanonicalLink>
          ) : (
            <>
              <CanonicalLink to="/login" className="btn-ghost marketing-nav-btn">
                Log in
              </CanonicalLink>
              <CanonicalLink to="/signup" className="btn-primary marketing-nav-btn">
                Get started
              </CanonicalLink>
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
          <CanonicalLink to="/" className="marketing-logo marketing-logo--footer" aria-label="Cash Prophet home">
            <CashProphetLogo variant="footer" />
          </CanonicalLink>
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
            <CanonicalLink to="/how-it-works">How it works</CanonicalLink>
            <CanonicalLink to="/who-its-for">Who it’s for</CanonicalLink>
            <CanonicalLink to="/how-it-works#habits">Habits</CanonicalLink>
            <CanonicalLink to="/blog">Blog</CanonicalLink>
          </div>
          <div>
            <p className="marketing-footer-heading">Product</p>
            <CanonicalLink to="/see-how-it-works">See it</CanonicalLink>
            <CanonicalLink to="/pricing">Pricing</CanonicalLink>
            <CanonicalLink to="/signup">Start free trial</CanonicalLink>
            <CanonicalLink to="/login">Log in</CanonicalLink>
            {!isSupabaseConfigured && <CanonicalLink to="/app">Try locally</CanonicalLink>}
          </div>
          <div>
            <p className="marketing-footer-heading">Legal</p>
            <CanonicalLink to="/privacy">Privacy policy</CanonicalLink>
            <CanonicalLink to="/terms">Terms of service</CanonicalLink>
          </div>
        </div>
      </div>

      <div className="marketing-footer-bottom">
        <p>
          © {new Date().getFullYear()} {COMPANY_INFO.legalName}. All rights reserved.{' '}
          <CanonicalLink to="/privacy">Privacy</CanonicalLink>
          {' · '}
          <CanonicalLink to="/terms">Terms</CanonicalLink>
        </p>
        <p className="marketing-footer-trial muted">
          {FOUNDER_PROGRAM_HEADLINE}. {FOUNDER_PROGRAM_FOOTNOTE}
        </p>
        <p className="marketing-footer-regulatory muted">{REGULATORY_POSITION.shortFooter}</p>
      </div>
    </footer>
  )
}
