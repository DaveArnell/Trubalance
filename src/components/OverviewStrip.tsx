import { useState, type CSSProperties } from 'react'

import type { BalanceSaveChange, BalanceSaveResult } from '../hooks/useAppState'
import type { OverviewSize } from '../hooks/useOverviewSize'
import { useOverviewHeight } from '../hooks/useOverviewHeight'
import { useMobileNav } from '../hooks/useMobileNav'

import type { AppState, AttentionItem, DashboardMetrics, ViewScope } from '../types'

import type { BreakdownColumn } from '../utils/breakdownTable'

import { BreakdownTable } from './BreakdownTable'

import { HelpButton } from './HelpButton'

import { WIDGET_HELP } from '../content/livingDashboard'

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
 */
export function OverviewStrip({
  metrics: _metrics,
  attentionItems: _attentionItems,
  onNotificationClick: _onNotificationClick,
  onDismissNotification: _onDismissNotification,
  openHelp,
  setOpenHelp,
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
  const { height, startHeightDrag, resetHeight } = useOverviewHeight()

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
    ...(isMobile ? {} : { height: `${height}px` }),
    '--overview-height': `${height}px`,
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
            <div className="overview-balances-toolbar">
              <h2 className="overview-balances-title">Balances</h2>
              <HelpButton
                id="hero"
                className="help-btn-hero"
                openHelp={openHelp}
                setOpenHelp={setOpenHelp}
                text={WIDGET_HELP.trueBalance}
              />
            </div>
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

      {!readOnly && !isMobile && (
        <div
          className="overview-height-handle"
          role="separator"
          aria-orientation="horizontal"
          aria-label="Resize overview height"
          title="Drag to resize · double-click to reset height"
          onPointerDown={startHeightDrag}
          onDoubleClick={resetHeight}
        />
      )}
    </section>
  )
}
