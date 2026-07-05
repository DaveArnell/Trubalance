import { createPortal } from 'react-dom'
import { useRef, useState, useCallback } from 'react'
import type { AccountFreshnessEntry } from '../utils/accountFreshness'

export function FreshnessAccountTooltip({
  accounts,
}: {
  accounts: Pick<AccountFreshnessEntry, 'label' | 'freshnessLabel'>[]
}) {
  if (accounts.length === 0) return null
  return <TooltipInner accounts={accounts} />
}

function TooltipInner({
  accounts,
}: {
  accounts: Pick<AccountFreshnessEntry, 'label' | 'freshnessLabel'>[]
}) {
  const triggerRef = useRef<HTMLSpanElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)

  const show = useCallback(() => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    setPos({ top: rect.bottom + 6, left: rect.left })
  }, [])

  const hide = useCallback(() => setPos(null), [])

  return (
    <>
      <span
        ref={triggerRef}
        className="freshness-tooltip-trigger"
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        aria-hidden
      />
      {pos &&
        createPortal(
          <span
            className="freshness-account-tooltip"
            role="tooltip"
            style={{ top: pos.top, left: pos.left }}
          >
            <ul className="freshness-account-tooltip-list">
              {accounts.map((account, index) => (
                <li key={`${account.label}-${index}`}>
                  <span className="freshness-account-tooltip-name">{account.label}</span>
                  <span className="freshness-account-tooltip-when">{account.freshnessLabel}</span>
                </li>
              ))}
            </ul>
          </span>,
          document.body,
        )}
    </>
  )
}
