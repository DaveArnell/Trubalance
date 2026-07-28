import { useState } from 'react'
import type { CSSProperties } from 'react'
import type { BalanceSaveChange, BalanceSaveResult } from '../hooks/useAppState'
import type { OverviewSize } from '../hooks/useOverviewSize'
import { useMobileNav } from '../hooks/useMobileNav'
import type { AppState, AttentionItem, DashboardMetrics, ViewScope } from '../types'
import type { BreakdownColumn } from '../utils/breakdownTable'
import { BreakdownTable } from './BreakdownTable'
import { BalancePositionHero } from './BalancePositionHero'
import { UpdateBalancesModal } from './UpdateBalancesModal'

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
 * Desktop position hero: Cash Prophet Balance collapsed by default with week/month
 * change; expands to the full account breakdown table.
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
  const [balancesModalOpen, setBalancesModalOpen] = useState(false)
  const { isMobile } = useMobileNav()

  const showAccounts = breakdownColumns.length > 0 && !!state
  const expanded = size === 'detailed'

  const handleBalanceSave = (changes: BalanceSaveChange[]): BalanceSaveResult => {
    if (!onBalanceSave) return { updated: 0, snapshotted: false }
    const result = onBalanceSave(changes)
    if (result.updated > 0) {
      setSaveMessage(`Updated ${result.updated} account${result.updated === 1 ? '' : 's'}.`)
      window.setTimeout(() => setSaveMessage(''), 4000)
    }
    return result
  }

  if (!showAccounts || !state) return null

  const stripStyle = {
    height: 'auto',
    '--overview-height': 'auto',
  } as CSSProperties

  return (
    <section
      className={`overview-strip overview-strip--position-hero${isMobile ? ' overview-strip--mobile' : ''}${
        expanded ? ' overview-strip--expanded' : ' overview-strip--collapsed'
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
          expanded={expanded}
          onToggleExpanded={() => onSizeChange(expanded ? 'default' : 'detailed')}
          onUpdateBalances={() => setBalancesModalOpen(true)}
          readOnly={readOnly}
        />

        {expanded ? (
          <div className="overview-strip-table" data-tour="overview-balances">
            <BreakdownTable
              state={state}
              columns={breakdownColumns}
              compact
              onBalanceSave={readOnly ? undefined : handleBalanceSave}
            />
            {saveMessage ? <p className="overview-accounts-save-msg">{saveMessage}</p> : null}
          </div>
        ) : null}
      </div>

      {!readOnly ? (
        <UpdateBalancesModal
          open={balancesModalOpen}
          onClose={() => setBalancesModalOpen(false)}
          state={state}
          columns={breakdownColumns}
          onBalanceSave={handleBalanceSave}
        />
      ) : null}
    </section>
  )
}
