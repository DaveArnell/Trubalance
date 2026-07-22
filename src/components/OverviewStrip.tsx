import { useState, type CSSProperties } from 'react'

import type { BalanceSaveChange, BalanceSaveResult } from '../hooks/useAppState'
import type { OverviewSize } from '../hooks/useOverviewSize'
import { useMobileNav } from '../hooks/useMobileNav'

import type { AppState, AttentionItem, DashboardMetrics, ViewScope } from '../types'

import type { BreakdownColumn } from '../utils/breakdownTable'

import { BreakdownTable } from './BreakdownTable'

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
 * Desktop balances strip. True Balance hero lives on mobile (MobileOverview);
 * desktop keeps account balances where they’re edited day to day.
 *
 * Balances-only layout sizes to content (no fixed height) so demos and short
 * tables don’t leave a large empty band under the Available row.
 */
export function OverviewStrip({
  metrics: _metrics,
  attentionItems: _attentionItems,
  onNotificationClick: _onNotificationClick,
  onDismissNotification: _onDismissNotification,
  openHelp: _openHelp,
  setOpenHelp: _setOpenHelp,
  state,
  viewScope: _viewScope,
  breakdownColumns = [],
  onBalanceSave,
  size: _size,
  onSizeChange: _onSizeChange,
  readOnly = false,
}: OverviewStripProps) {
  const [saveMessage, setSaveMessage] = useState('')
  const { isMobile } = useMobileNav()

  const showAccounts = breakdownColumns.length > 0 && !!state

  const handleBalanceSave = (changes: BalanceSaveChange[]) => {
    if (!onBalanceSave) return
    const result = onBalanceSave(changes)
    if (result.updated > 0) {
      setSaveMessage(`Updated ${result.updated} account${result.updated === 1 ? '' : 's'}.`)
      window.setTimeout(() => setSaveMessage(''), 4000)
    }
  }

  if (!showAccounts) return null

  const stripStyle = {
    height: 'auto',
    '--overview-height': 'auto',
  } as CSSProperties

  return (
    <section
      className={`overview-strip overview-strip--balances-only${isMobile ? ' overview-strip--mobile' : ''}`}
      style={stripStyle}
      aria-label="Account balances"
      data-tour="overview-hero"
    >
      <div className="overview-strip-body">
        <div className="overview-strip-split overview-strip-split--solo">
          <div className="overview-strip-table" data-tour="overview-balances">
            <BreakdownTable
              state={state}
              columns={breakdownColumns}
              compact
              onBalanceSave={readOnly ? undefined : handleBalanceSave}
            />
            {saveMessage && <p className="overview-accounts-save-msg">{saveMessage}</p>}
          </div>
        </div>
      </div>
    </section>
  )
}
