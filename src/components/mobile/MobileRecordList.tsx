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
  amountSecondary,
  meta,
  amountNegative,
  progress,
  progressColor,
  accentColor,
  onClick,
  children,
  actions,
}: {
  title: ReactNode
  amount: ReactNode
  amountSecondary?: ReactNode
  meta?: ReactNode
  amountNegative?: boolean
  /** 0–1 fill for accrual cycle progress */
  progress?: number
  progressColor?: string
  /** Business/venue accent — left edge colour */
  accentColor?: string
  onClick?: () => void
  children?: ReactNode
  actions?: ReactNode
}) {
  const fill = progress != null ? Math.max(0, Math.min(1, progress)) : null
  const interactive = Boolean(onClick)
  const accent = accentColor || progressColor

  const body = (
    <>
      {fill != null ? (
        <div className="mobile-record-card-progress" aria-hidden>
          <div
            className="mobile-record-card-progress-fill"
            style={{
              width: `${Math.round(fill * 100)}%`,
              background: accent || 'var(--scope-accent, #0f766e)',
            }}
          />
        </div>
      ) : null}
      <div className="mobile-record-card-main">
        <div className="mobile-record-card-text">
          <h3 className="mobile-record-card-title">{title}</h3>
          {meta ? <p className="mobile-record-card-meta">{meta}</p> : null}
        </div>
        <div
          className={`mobile-record-card-amount-block${amountNegative ? ' mobile-record-card-amount-block--neg' : ''}`}
        >
          <p className="mobile-record-card-amount">{amount}</p>
          {amountSecondary ? (
            <p className="mobile-record-card-amount-secondary">{amountSecondary}</p>
          ) : null}
        </div>
      </div>
      {children ? <div className="mobile-record-card-body">{children}</div> : null}
      {actions ? <div className="mobile-record-card-actions">{actions}</div> : null}
    </>
  )

  const style = accent ? ({ borderLeftColor: accent } as const) : undefined
  const className = `mobile-record-card${accent ? ' mobile-record-card--accented' : ''}${
    interactive ? ' mobile-record-card--button' : ''
  }`

  if (interactive) {
    return (
      <button type="button" className={className} style={style} onClick={onClick}>
        {body}
      </button>
    )
  }

  return (
    <article className={className} style={style}>
      {body}
    </article>
  )
}
