import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { CanonicalLink } from '../CanonicalLink'
import { useAuth } from '../../contexts/AuthContext'
import { isSupabaseConfigured } from '../../lib/supabase'
import { COMPANY_INFO } from '../../content/companyInfo'
import { BRAND_SLOGAN } from '../../content/brandFoundation'
import { FOUNDER_PROGRAM_FOOTNOTE, FOUNDER_PROGRAM_HEADLINE } from '../../config/founderProgram'
import { REGULATORY_POSITION } from '../../content/regulatoryNotice'
import { CompanyLegalNotice } from './CompanyLegalNotice'
import { CashProphetLogo } from './CashProphetLogo'
import { useMarketingReveal } from '../../hooks/useMarketingReveal'
import { PRIMARY_NAV } from '../../content/marketingNav'
import { openCookiePreferences } from '../../utils/cookieConsent'

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
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuId = useId()
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    const onPointer = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null
      if (target && menuRef.current && !menuRef.current.contains(target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('touchstart', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('touchstart', onPointer)
    }
  }, [menuOpen])

  return (
    <header className="marketing-header">
      <div className="marketing-header-inner">
        <div className="marketing-brand-cluster" ref={menuRef}>
          <CanonicalLink to="/" className="marketing-logo" aria-label="Cash Prophet home">
            <CashProphetLogo variant="header" />
          </CanonicalLink>

          <button
            type="button"
            className={`marketing-menu-toggle${menuOpen ? ' is-open' : ''}`}
            aria-expanded={menuOpen}
            aria-controls={menuId}
            aria-label={menuOpen ? 'Close site menu' : 'Open site menu'}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="marketing-menu-toggle-chevron" aria-hidden />
          </button>

          <div
            id={menuId}
            className={`marketing-mobile-drawer${menuOpen ? ' is-open' : ''}`}
            hidden={!menuOpen}
          >
            <nav className="marketing-mobile-drawer-nav" aria-label="Site">
              <CanonicalLink to="/" onClick={() => setMenuOpen(false)}>
                Home
              </CanonicalLink>
              {PRIMARY_NAV.map((item) => (
                <CanonicalLink key={item.to} to={item.to} onClick={() => setMenuOpen(false)}>
                  {item.label}
                </CanonicalLink>
              ))}
            </nav>
            <div className="marketing-mobile-drawer-cta">
              {!loading && user ? (
                <CanonicalLink
                  to="/app"
                  className="btn-primary marketing-nav-btn"
                  onClick={() => setMenuOpen(false)}
                >
                  Dashboard
                </CanonicalLink>
              ) : (
                <>
                  <CanonicalLink
                    to="/login"
                    className="btn-ghost marketing-nav-btn"
                    onClick={() => setMenuOpen(false)}
                  >
                    Log in
                  </CanonicalLink>
                  <CanonicalLink
                    to="/signup"
                    className="btn-primary marketing-nav-btn"
                    onClick={() => setMenuOpen(false)}
                  >
                    Get started
                  </CanonicalLink>
                  <CanonicalLink
                    to="/try-it"
                    className="btn-secondary marketing-nav-btn"
                    onClick={() => setMenuOpen(false)}
                  >
                    Free cash check
                  </CanonicalLink>
                </>
              )}
            </div>
          </div>
        </div>

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
          <p className="marketing-footer-tagline">{BRAND_SLOGAN}</p>
          <CompanyLegalNotice variant="footer" />
        </div>

        <div className="marketing-footer-columns">
          <div>
            <p className="marketing-footer-heading">Company</p>
            <CanonicalLink to="/contact">Enquire / onboarding</CanonicalLink>
            <CanonicalLink to="/partners">Partner with Cash Prophet</CanonicalLink>
            <a className="marketing-footer-email" href={`mailto:${COMPANY_INFO.contactEmail}`}>
              {COMPANY_INFO.contactEmail}
            </a>
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
            <CanonicalLink to="/try-it">Try It</CanonicalLink>
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
            <button type="button" className="marketing-footer-btn" onClick={() => openCookiePreferences()}>
              Cookie preferences
            </button>
          </div>
        </div>
      </div>

      <div className="marketing-footer-bottom">
        <p>
          © {new Date().getFullYear()} {COMPANY_INFO.legalName}. All rights reserved.{' '}
          <CanonicalLink to="/privacy">Privacy</CanonicalLink>
          {' · '}
          <CanonicalLink to="/terms">Terms</CanonicalLink>
          {' · '}
          <button type="button" className="marketing-footer-inline-btn" onClick={() => openCookiePreferences()}>
            Cookies
          </button>
        </p>
        <p className="marketing-footer-trial muted">
          {FOUNDER_PROGRAM_HEADLINE}. {FOUNDER_PROGRAM_FOOTNOTE}
        </p>
        <p className="marketing-footer-regulatory muted">{REGULATORY_POSITION.shortFooter}</p>
      </div>
    </footer>
  )
}
