import { useState, type CSSProperties } from 'react'

import type { BalanceSaveChange, BalanceSaveResult } from '../hooks/useAppState'
import type { OverviewSize } from '../hooks/useOverviewSize'
import { useOverviewHeight } from '../hooks/useOverviewHeight'
import { useMobileNav } from '../hooks/useMobileNav'
import { useOverviewSplit } from '../hooks/useOverviewSplit'

import type { AppState, AttentionItem, DashboardMetrics, ViewScope } from '../types'

import type { BreakdownColumn } from '../utils/breakdownTable'

import { formatCurrency } from '../utils/format'

import { AccountFreshnessList } from './AccountFreshnessList'

import { BreakdownTable } from './BreakdownTable'

import { HelpButton } from './HelpButton'

import { WIDGET_HELP } from '../content/livingDashboard'

const SIZE_OPTIONS: { value: OverviewSize; label: string }[] = [
  { value: 'default', label: 'Default' },
  { value: 'detailed', label: 'More detail' },
]

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

function alertTone(level: AttentionItem['level']) {
  return level === 'yellow' ? 'orange' : level
}

function OverviewAlertsDetailed({
  items,
  onAlertClick,
}: {
  items: AttentionItem[]
  onAlertClick: (item: AttentionItem) => void
}) {
  if (items.length === 0) return null

  const redItems = items.filter((item) => item.level === 'red')
  const orangeItems = items.filter((item) => item.level === 'orange' || item.level === 'yellow')

  const renderChip = (item: AttentionItem) => (
    <li key={item.id}>
      <button
        type="button"
        className={`overview-freshness-chip overview-alert-chip overview-alert-chip--${alertTone(item.level)}`}
        onClick={() => onAlertClick(item)}
        title={item.detail}
      >
        <span className={`overview-freshness-dot overview-freshness-dot--${alertTone(item.level)}`} aria-hidden />
        <span>{item.title}</span>
      </button>
    </li>
  )

  return (
    <div className="overview-freshness overview-alerts-strip" aria-label="Alerts">
      <p className="overview-freshness-heading">Alerts</p>
      {redItems.length > 0 && (
        <div className="overview-alerts-group">
          <p className="overview-alerts-group-label overview-alerts-group-label--red">Needs attention</p>
          <ul className="overview-freshness-groups">{redItems.map(renderChip)}</ul>
        </div>
      )}
      {orangeItems.length > 0 && (
        <div className="overview-alerts-group">
          <p className="overview-alerts-group-label overview-alerts-group-label--orange">Coming up</p>
          <ul className="overview-freshness-groups">{orangeItems.map(renderChip)}</ul>
        </div>
      )}
    </div>
  )
}

export function OverviewStrip({
  metrics,
  attentionItems,
  onNotificationClick,
  onDismissNotification,
  openHelp,
  setOpenHelp,
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
  const { asideFr, containerRef, startDrag } = useOverviewSplit()
  const { height, startHeightDrag, resetHeight } = useOverviewHeight()
  const showDetailed = size === 'detailed'

  const showAccounts = breakdownColumns.length > 0 && !!state

  const handleBalanceSave = (changes: BalanceSaveChange[]) => {
    if (!onBalanceSave) return
    const result = onBalanceSave(changes)
    if (result.updated > 0) {
      setSaveMessage(`Updated ${result.updated} account${result.updated === 1 ? '' : 's'}.`)
      window.setTimeout(() => setSaveMessage(''), 4000)
    }
  }

  const handleAlertClick = (item: AttentionItem) => {
    if (item.dismissible && onDismissNotification) {
      onDismissNotification(item)
      return
    }
    onNotificationClick(item)
  }

  const stripStyle = {
    ...(isMobile ? {} : { height: `${height}px` }),
    '--overview-height': `${height}px`,
  } as CSSProperties

  const splitGridColumns = showAccounts
    ? `minmax(0, ${asideFr}fr) 5px minmax(0, ${100 - asideFr}fr)`
    : undefined

  return (
    <section
      className={`overview-strip overview-strip--${size}${isMobile ? ' overview-strip--mobile' : ''}`}
      style={stripStyle}
      aria-label="True Balance overview"
    >
      <div className="overview-strip-body">
        <div
          ref={containerRef}
          className={`overview-strip-split${showAccounts ? '' : ' overview-strip-split--solo'}`}
          style={
            splitGridColumns
              ? {
                  gridTemplateColumns: splitGridColumns,
                }
              : undefined
          }
        >
          <aside className="overview-strip-aside">
            <div className="overview-hero" data-tour="overview-hero">
              <div className="overview-hero-header">
                <p className="overview-hero-label">True Balance</p>
                <div className="overview-hero-toolbar">
                  {!readOnly && (
                    <label className="overview-strip-size-select-wrap">
                      <span className="sr-only">Overview detail</span>
                      <select
                        className="overview-strip-size-select"
                        value={size}
                        onChange={(e) => onSizeChange(e.target.value as OverviewSize)}
                        aria-label="Overview detail level"
                      >
                        {SIZE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  <HelpButton
                    id="hero"
                    className="help-btn-hero"
                    openHelp={openHelp}
                    setOpenHelp={setOpenHelp}
                    text={WIDGET_HELP.trueBalance}
                  />
                </div>
              </div>

              <p className="overview-hero-value">{formatCurrency(metrics.trueBalance)}</p>

              {showDetailed && (
                <p className="overview-hero-tagline muted">
                  Cash minus committed costs, plus expected receipts — for the location shown above.
                </p>
              )}

              {state && !readOnly && <AccountFreshnessList state={state} viewScope={viewScope} />}

              {showDetailed && !readOnly && (
                <OverviewAlertsDetailed items={attentionItems} onAlertClick={handleAlertClick} />
              )}
            </div>
          </aside>

          {showAccounts && (
            <>
              <div
                className={`overview-split-handle${readOnly ? ' overview-split-handle--readonly' : ''}`}
                role={readOnly ? undefined : 'separator'}
                aria-orientation="vertical"
                aria-hidden={readOnly ? true : undefined}
                aria-label={readOnly ? undefined : 'Resize True Balance panels'}
                onPointerDown={readOnly ? undefined : startDrag}
              />

              <div className="overview-strip-table" data-tour="overview-balances">
                <BreakdownTable
                  state={state}
                  columns={breakdownColumns}
                  compact
                  onBalanceSave={readOnly ? undefined : handleBalanceSave}
                />
                {saveMessage && <p className="overview-accounts-save-msg">{saveMessage}</p>}
              </div>
            </>
          )}
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
