import type { ReactNode } from 'react'

export function MobileRecordList({
  children,
  emptyMessage,
}: {
  children?: ReactNode
  emptyMessage?: string
}) {
  if (!children) {
    return emptyMessage ? <p className="mobile-record-empty muted">{emptyMessage}</p> : null
  }
  return <div className="mobile-record-list">{children}</div>
}

export function MobileSectionLabel({ children }: { children: ReactNode }) {
  return <p className="mobile-record-section-label">{children}</p>
}

export function MobileRecordCard({
  title,
  amount,
  meta,
  amountNegative,
  children,
  actions,
}: {
  title: ReactNode
  amount: ReactNode
  meta?: ReactNode
  amountNegative?: boolean
  children?: ReactNode
  actions?: ReactNode
}) {
  return (
    <article className="mobile-record-card">
      <div className="mobile-record-card-main">
        <div className="mobile-record-card-text">
          <h3 className="mobile-record-card-title">{title}</h3>
          {meta ? <p className="mobile-record-card-meta">{meta}</p> : null}
        </div>
        <p
          className={`mobile-record-card-amount${amountNegative ? ' mobile-record-card-amount--neg' : ''}`}
        >
          {amount}
        </p>
      </div>
      {children ? <div className="mobile-record-card-body">{children}</div> : null}
      {actions ? <div className="mobile-record-card-actions">{actions}</div> : null}
    </article>
  )
}
