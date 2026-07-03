import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { MarketingFooter, MarketingHeader, MarketingShell } from '../../components/marketing/MarketingLayout'

interface LegalPageLayoutProps {
  title: string
  updated: string
  children: ReactNode
}

export function LegalPageLayout({ title, updated, children }: LegalPageLayoutProps) {
  return (
    <MarketingShell>
      <MarketingHeader />
      <main className="legal-page">
        <div className="legal-page-inner">
          <p className="marketing-eyebrow">
            <Link to="/">True Balance</Link>
          </p>
          <h1>{title}</h1>
          <p className="legal-page-updated muted">Last updated: {updated}</p>
          <div className="legal-prose">{children}</div>
        </div>
      </main>
      <MarketingFooter />
    </MarketingShell>
  )
}
