import { useState } from 'react'
import type { CSSProperties } from 'react'
import type { BalanceSaveChange, BalanceSaveResult } from '../hooks/useAppState'
import type { OverviewSize } from '../hooks/useOverviewSize'
import { useMobileNav } from '../hooks/useMobileNav'
import type { AppState, AttentionItem, DashboardMetrics, ViewScope } from '../types'
import type { BreakdownColumn } from '../utils/breakdownTable'
import { BreakdownTable } from './BreakdownTable'
import { BalancePositionHero } from './BalancePositionHero'

interface OverviewStripProps {
  metrics: DashboardMetrics
  attentionItems: AttentionItem[]
  onNotificationClick: (item: AttentionItem) => void
  onDismissNotification?: (item: AttentionItem) => void
  openHelp: string | null
  setOpenHelp: (id: string | null) => void
  state?: AppState
  viewScope: ViewScope
  breakdownColumns?: BreakdownColumn[]
  onBalanceSave?: (changes: BalanceSaveChange[]) => BalanceSaveResult
  size: OverviewSize
  onSizeChange: (size: OverviewSize) => void
  readOnly?: boolean
}

/**
 * Collapsed: Cash Prophet Balance + week/month change.
 * Expanded: full account breakdown table (same as before), no duplicate hero.
 */
export function OverviewStrip({
  metrics,
  attentionItems: _attentionItems,
  onNotificationClick: _onNotificationClick,
  onDismissNotification: _onDismissNotification,
  openHelp: _openHelp,
  setOpenHelp: _setOpenHelp,
  state,
  viewScope,
  breakdownColumns = [],
  onBalanceSave,
  size,
  onSizeChange,
  readOnly = false,
}: OverviewStripProps) {
  const [saveMessage, setSaveMessage] = useState('')
  const { isMobile } = useMobileNav()

  const showAccounts = breakdownColumns.length > 0 && !!state
  const expanded = size === 'detailed'

  const handleBalanceSave = (changes: BalanceSaveChange[]) => {
    if (!onBalanceSave) return
    const result = onBalanceSave(changes)
    if (result.updated > 0) {
      setSaveMessage(`Updated ${result.updated} account${result.updated === 1 ? '' : 's'}.`)
      window.setTimeout(() => setSaveMessage(''), 4000)
    }
  }

  if (!showAccounts || !state) return null

  const stripStyle = {
    height: 'auto',
    '--overview-height': 'auto',
  } as CSSProperties

  if (!expanded) {
    return (
      <section
        className={`overview-strip overview-strip--position-hero overview-strip--collapsed${
          isMobile ? ' overview-strip--mobile' : ''
        }`}
        style={stripStyle}
        aria-label="Cash Prophet Balance"
        data-tour="overview-hero"
      >
        <div className="overview-strip-body">
          <BalancePositionHero
            metrics={metrics}
            state={state}
            viewScope={viewScope}
            onExpand={() => onSizeChange('detailed')}
            readOnly={readOnly}
          />
        </div>
      </section>
    )
  }

  return (
    <section
      className={`overview-strip overview-strip--balances-only overview-strip--expanded${
        isMobile ? ' overview-strip--mobile' : ''
      }`}
      style={stripStyle}
      aria-label="Account balances"
      data-tour="overview-hero"
    >
        <div className="overview-strip-body">
          <button
            type="button"
            className="overview-collapse-bar"
            onClick={() => onSizeChange('default')}
          >
            <span aria-hidden>▴</span>
            <span>Show Cash Prophet Balance</span>
          </button>
          <div className="overview-strip-split overview-strip-split--solo">
            <div className="overview-strip-table" data-tour="overview-balances">
              <BreakdownTable
                state={state}
                columns={breakdownColumns}
                compact
                onBalanceSave={readOnly ? undefined : handleBalanceSave}
              />
              {saveMessage ? <p className="overview-accounts-save-msg">{saveMessage}</p> : null}
            </div>
          </div>
        </div>
    </section>
  )
}
