import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { MarketingFooter, MarketingHeader, MarketingShell } from '../../components/marketing/MarketingLayout'
import { CompanyLegalNotice } from '../../components/marketing/CompanyLegalNotice'
import { usePageMeta } from '../../hooks/usePageMeta'

interface LegalPageLayoutProps {
  title: string
  updated: string
  description: string
  path: string
  children: ReactNode
}

export function LegalPageLayout({ title, updated, description, path, children }: LegalPageLayoutProps) {
  usePageMeta({ title, description, path })
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
          <CompanyLegalNotice variant="legal" />
          <div className="legal-prose">{children}</div>
        </div>
      </main>
      <MarketingFooter />
    </MarketingShell>
  )
}
