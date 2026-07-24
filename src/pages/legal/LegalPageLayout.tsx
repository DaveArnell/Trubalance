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
  /** Document title / OG title when different from the visible H1. */
  seoTitle?: string
  imageAlt?: string
  children: ReactNode
}

export function LegalPageLayout({
  title,
  updated,
  description,
  path,
  seoTitle,
  imageAlt,
  children,
}: LegalPageLayoutProps) {
  usePageMeta({ title: seoTitle ?? title, description, path, imageAlt })
  return (
    <MarketingShell>
      <MarketingHeader />
      <main className="legal-page">
        <div className="legal-page-inner">
          <p className="marketing-eyebrow">
            <Link to="/">Cash Prophet</Link>
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
