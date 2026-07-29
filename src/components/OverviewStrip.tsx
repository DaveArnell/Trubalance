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
 * Desktop split: Cash Prophet Balance hero on the left; compact Current Acc + CPB
 * table on the right (expandable to full breakdown).
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

  return (
    <section
      className={`overview-strip overview-strip--position-split${
        expanded ? ' overview-strip--expanded' : ' overview-strip--collapsed'
      }${isMobile ? ' overview-strip--mobile' : ''}`}
      style={stripStyle}
      aria-label="Position and balances"
      data-tour="overview-hero"
    >
      <div className="overview-strip-body">
        <div className="overview-strip-split overview-strip-split--position">
          <aside className="overview-strip-aside overview-strip-aside--hero">
            <BalancePositionHero
              metrics={metrics}
              state={state}
              viewScope={viewScope}
              expanded={expanded}
              onToggleExpanded={() => onSizeChange(expanded ? 'default' : 'detailed')}
            />
          </aside>
          <div className="overview-strip-divider" aria-hidden />
          <div className="overview-strip-table" data-tour="overview-balances">
            <BreakdownTable
              state={state}
              columns={breakdownColumns}
              compact
              density={expanded ? 'detailed' : 'summary'}
              onBalanceSave={readOnly ? undefined : handleBalanceSave}
            />
            {saveMessage ? <p className="overview-accounts-save-msg">{saveMessage}</p> : null}
          </div>
        </div>
      </div>
    </section>
  )
}
