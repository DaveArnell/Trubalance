import type { ReactNode } from 'react'

interface MarketingBrowserFrameProps {
  children: ReactNode
  url?: string
}

export function MarketingBrowserFrame({
  children,
  url = 'app.truebalanceapp.io',
}: MarketingBrowserFrameProps) {
  return (
    <div className="marketing-browser-frame">
      <div className="marketing-browser-chrome">
        <div className="marketing-browser-dots" aria-hidden>
          <span />
          <span />
          <span />
        </div>
        <div className="marketing-browser-url">{url}</div>
      </div>
      <div className="marketing-browser-body">{children}</div>
    </div>
  )
}
