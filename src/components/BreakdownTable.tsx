import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { BalanceSaveChange } from '../hooks/useAppState'
import type { Account, AppState } from '../types'
import type { BreakdownColumn } from '../utils/breakdownTable'
import { CostsBreakdownPopover } from './CostsBreakdownPopover'
import { getAccountLocationLabel } from '../utils/accounts'
import { accountFreshnessLabel } from '../utils/accountFreshness'
import { useTablePreferences } from '../contexts/TablePreferencesContext'
import { tablePreferenceClasses } from '../utils/tablePreferences'
import { toAmount, roundCurrency } from '../utils/amounts'
import { formatCurrencyExact } from '../utils/format'
import { daysBetween, getAccountsFreshness, getFreshness, getFreshnessLabel } from '../utils/snapshots'
import {
  breakdownBalanceCellIds,
  finishSheetCellEdit,
  focusBalancePopoverInput,
  handleBalancePopoverTabKey,
  handleSheetInputTabKey,
  shouldSkipSheetCellBlur,
  sheetCellActivateOnMouseDown,
  useSheetCellNavigation,
  useSheetInlineDraft,
  type SheetTabHandler,
} from '../utils/sheetCellNavigation'

interface BreakdownTableProps {
  state: AppState
  columns: BreakdownColumn[]
  showReceipts?: boolean
  compact?: boolean
  onBalanceSave?: (changes: BalanceSaveChange[]) => void
}

function cellValue(value: number) {
  return formatCurrencyExact(value)
}

function numericCellClass(value: number, extra?: string) {
  const classes = ['sheet-num', extra, value < 0 ? 'sheet-cell-negative' : ''].filter(Boolean)
  return classes.join(' ')
}

function breakdownColumnClass(column: BreakdownColumn): string | undefined {
  if (column.isRollup) return 'overview-col-rollup'
  if (column.isSharedScope) return 'overview-col-shared'
  return undefined
}

function CostsCell({
  state,
  column,
  isOpen,
  onOpen,
  onClose,
}: {
  state: AppState
  column: BreakdownColumn
  isOpen: boolean
  onOpen: () => void
  onClose: () => void
}) {
  const columnClass = breakdownColumnClass(column)
  const cellRef = useRef<HTMLTableCellElement>(null)
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null)

  const open = useCallback(() => {
    if (!cellRef.current) return
    const rect = cellRef.current.getBoundingClientRect()
    setAnchorRect(rect)
    onOpen()
  }, [onOpen])

  useLayoutEffect(() => {
    if (isOpen && cellRef.current) {
      setAnchorRect(cellRef.current.getBoundingClientRect())
    }
    if (!isOpen) setAnchorRect(null)
  }, [isOpen])

  return (
    <>
      <td
        ref={cellRef}
        className={`${numericCellClass(column.committedFunds, columnClass)} costs-hover-target costs-click-target`}
        tabIndex={0}
        role="button"
        title="Click for cost breakdown"
        onClick={open}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            open()
          }
        }}
      >
        {cellValue(column.committedFunds)}
      </td>
      {isOpen && anchorRect ? (
        <CostsBreakdownPopover
          state={state}
          column={column}
          anchorRect={anchorRect}
          onClose={onClose}
        />
      ) : null}
    </>
  )
}

function Cell({
  value,
  masked,
  highlight,
  danger,
  columnClass,
}: {
  value: number
  masked?: boolean
  highlight?: boolean
  danger?: boolean
  columnClass?: string
}) {
  if (masked) return <td className={['sheet-cell-masked', columnClass].filter(Boolean).join(' ')} />
  const className = highlight
    ? ['sheet-cell-highlight', 'sheet-num', columnClass].filter(Boolean).join(' ')
    : danger
      ? ['sheet-cell-danger', 'sheet-num', columnClass].filter(Boolean).join(' ')
      : numericCellClass(value, columnClass)
  return <td className={className}>{cellValue(value)}</td>
}

function EditableBalanceCell({
  cellId,
  value,
  accounts,
  state,
  editable,
  showFreshness,
  isActive,
  onActivate,
  onDeactivate,
  onSave,
  onTab,
  columnClass,
}: {
  cellId: string
  value: number
  accounts: Account[]
  state: AppState
  editable: boolean
  showFreshness: boolean
  isActive: boolean
  onActivate: () => void
  onDeactivate: () => void
  onSave?: (changes: BalanceSaveChange[]) => void
  onTab?: SheetTabHandler
  columnClass?: string
}) {
  const cellRef = useRef<HTMLTableCellElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const accountInputRefs = useRef<Array<HTMLInputElement | null>>([])
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [panelPos, setPanelPos] = useState({ top: 0, left: 0 })
  const draftsRef = useRef(drafts)
  draftsRef.current = drafts

  const updatePanelPos = useCallback(() => {
    if (!cellRef.current) return
    const rect = cellRef.current.getBoundingClientRect()
    const panelWidth = popoverRef.current?.offsetWidth ?? 240
    const left = Math.max(8, Math.min(rect.right - panelWidth, window.innerWidth - panelWidth - 8))
    setPanelPos({ top: rect.bottom + 4, left })
  }, [])

  useLayoutEffect(() => {
    if (!isActive || accounts.length !== 1) return
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [isActive, accounts.length])

  const singleAccount = accounts.length === 1 ? accounts[0] : null
  const [singleDraft, setSingleDraft] = useSheetInlineDraft(
    isActive && !!singleAccount,
    singleAccount ? String(toAmount(singleAccount.balance)) : '',
  )

  const commitDrafts = useCallback(() => {
    const changes: BalanceSaveChange[] = []
    for (const account of accounts) {
      const raw = draftsRef.current[account.id]
      if (raw === undefined || raw.trim() === '') continue
      const balance = roundCurrency(toAmount(raw))
      if (balance !== toAmount(account.balance)) {
        changes.push({ accountId: account.id, balance })
      }
    }
    if (changes.length > 0) onSave?.(changes)
    onDeactivate()
    setDrafts({})
  }, [accounts, onSave, onDeactivate])

  useLayoutEffect(() => {
    if (!isActive || accounts.length <= 1) return
    updatePanelPos()
    requestAnimationFrame(updatePanelPos)
    focusBalancePopoverInput(accountInputRefs)
  }, [isActive, accounts.length, updatePanelPos])

  useEffect(() => {
    accountInputRefs.current.length = accounts.length
  }, [accounts.length])

  useEffect(() => {
    if (!isActive || accounts.length <= 1) return

    const handleLayout = () => updatePanelPos()
    window.addEventListener('resize', handleLayout)
    window.addEventListener('scroll', handleLayout, true)

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (cellRef.current?.contains(target) || popoverRef.current?.contains(target)) return
      commitDrafts()
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      window.removeEventListener('resize', handleLayout)
      window.removeEventListener('scroll', handleLayout, true)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isActive, accounts.length, commitDrafts, updatePanelPos])

  useEffect(() => {
    if (isActive && accounts.length > 1) {
      setDrafts(Object.fromEntries(accounts.map((a) => [a.id, String(toAmount(a.balance))])))
    }
  }, [isActive, accounts])

  if (!editable) {
    return <td className={numericCellClass(value, columnClass)}>{cellValue(value)}</td>
  }

  const saveSingle = (raw: string, account: Account) => {
    const balance = roundCurrency(toAmount(raw))
    if (balance === roundCurrency(toAmount(account.balance))) return
    onSave?.([{ accountId: account.id, balance }])
  }

  const commitSingle = () => {
    if (!singleAccount) return
    saveSingle(singleDraft, singleAccount)
  }

  const freshness = showFreshness ? getAccountsFreshness(accounts) : null

  const accountFreshnessTitle = showFreshness
    ? accounts
        .map((account) => {
          const daysAgo = daysBetween(account.updatedAt)
          return `${accountFreshnessLabel(state, account)}: ${getFreshnessLabel(daysAgo)}`
        })
        .join(' · ')
    : null

  const idleTitle = accountFreshnessTitle
    ? `${accountFreshnessTitle}. Click to update balance`
    : 'Click to update balance'

  const tdClassName = [
    'sheet-cell-editable',
    'sheet-num',
    columnClass,
    showFreshness && 'freshness-box',
    showFreshness && freshness,
    isActive ? 'sheet-cell-active' : '',
    value < 0 ? 'sheet-cell-negative' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const balancePopover =
    isActive &&
    accounts.length > 1 &&
    createPortal(
      <div
        ref={popoverRef}
        className="sheet-balance-popover sheet-balance-popover--portal"
        style={{ top: panelPos.top, left: panelPos.left }}
        role="dialog"
        aria-label="Update balances"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <p className="sheet-popover-title">Update balances</p>
        {accounts.map((account, index) => {
          const daysAgo = daysBetween(account.updatedAt)
          const accountFreshness = getFreshness(daysAgo)
          const rowClassName = [
            'sheet-popover-row',
            showFreshness && 'freshness-box',
            showFreshness && accountFreshness,
          ]
            .filter(Boolean)
            .join(' ')
          return (
            <label
              key={account.id}
              className={rowClassName}
              title={showFreshness ? getFreshnessLabel(daysAgo) : undefined}
            >
              <span>{getAccountLocationLabel(state, account)}</span>
              <input
                ref={(element) => {
                  accountInputRefs.current[index] = element
                }}
                className="sheet-input"
                type="number"
                step="1"
                value={drafts[account.id] ?? ''}
                onChange={(e) => setDrafts((d) => ({ ...d, [account.id]: e.target.value }))}
                onKeyDown={(e) => {
                  if (
                    handleBalancePopoverTabKey(
                      e,
                      index,
                      accounts.length,
                      accountInputRefs,
                      onTab,
                      commitDrafts,
                    )
                  ) {
                    return
                  }
                  if (e.key === 'Enter') commitDrafts()
                  if (e.key === 'Escape') {
                    onDeactivate()
                    setDrafts({})
                  }
                }}
              />
            </label>
          )
        })}
      </div>,
      document.body,
    )

  return (
    <td
      ref={cellRef}
      className={tdClassName}
      onMouseDown={sheetCellActivateOnMouseDown(isActive, onActivate)}
      title={!isActive ? idleTitle : undefined}
      data-cell-id={cellId}
    >
      <span className="sheet-cell-value">{cellValue(value)}</span>

      {isActive && accounts.length === 1 && singleAccount && (
        <input
          ref={inputRef}
          className="sheet-cell-inline-input"
          type="number"
          step="1"
          value={singleDraft}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => setSingleDraft(e.target.value)}
          onBlur={() => {
            if (shouldSkipSheetCellBlur()) return
            commitSingle()
            onDeactivate()
          }}
          onKeyDown={(e) => {
            if (handleSheetInputTabKey(e, onTab, commitSingle)) return
            if (e.key === 'Enter') {
              e.preventDefault()
              finishSheetCellEdit(commitSingle, onDeactivate)
            }
            if (e.key === 'Escape') onDeactivate()
          }}
        />
      )}

      {balancePopover}
    </td>
  )
}

export function BreakdownTable({
  state,
  columns,
  showReceipts = true,
  compact = false,
  onBalanceSave,
}: BreakdownTableProps) {
  const balanceCellIds = useMemo(() => breakdownBalanceCellIds(columns), [columns])
  const { activeCell, activate, deactivate, makeTabHandler } = useSheetCellNavigation(balanceCellIds)
  const canEditBalances = !!onBalanceSave
  const { preferences: tablePreferences } = useTablePreferences('overview-breakdown')
  const tablePrefClasses = tablePreferenceClasses(tablePreferences, 'overview-breakdown')
  const [openCostsKey, setOpenCostsKey] = useState<string | null>(null)

  if (columns.length === 0) return null

  const hasSavings = columns.some((col) => col.savingsAccounts.length > 0)
  const hasReceipts = showReceipts && columns.some((col) => col.expectedReceipts !== 0)

  const balanceRow = (rowType: 'current' | 'savings', label: string) => (
    <tr className={`sheet-row-balance${rowType === 'savings' ? ' sheet-row-savings' : ''}`}>
      <td className="sheet-row-label">{label}</td>
      {columns.map((col) => {
        const accounts = rowType === 'current' ? col.currentAccounts : col.savingsAccounts
        const value = rowType === 'current' ? col.current : col.savings
        const cellId = `${col.key}-${rowType}`
        const editable = canEditBalances && !col.isRollup && accounts.length > 0
        const columnClass = breakdownColumnClass(col)

        if (col.isRollup) {
          return (
            <td key={col.key} className={numericCellClass(value, columnClass)}>
              {cellValue(value)}
            </td>
          )
        }

        return (
          <EditableBalanceCell
            key={col.key}
            cellId={cellId}
            value={value}
            accounts={accounts}
            state={state}
            editable={editable}
            showFreshness={rowType === 'current'}
            isActive={activeCell === cellId}
            onActivate={() => activate(cellId)}
            onDeactivate={deactivate}
            onTab={makeTabHandler(cellId)}
            columnClass={columnClass}
            onSave={
              canEditBalances
                ? (changes) => {
                    onBalanceSave!(changes)
                    deactivate()
                  }
                : undefined
            }
          />
        )
      })}
    </tr>
  )

  return (
    <div className={compact ? `overview-breakdown-wrap table-pref-surface ${tablePrefClasses}` : 'sheet-wrap'}>
      <table
        className={
          compact
                    ? `sheet-table overview-breakdown-table table-pref-table ${tablePrefClasses}`
            : 'sheet-table'
        }
      >
        <thead>
          <tr>
            <th className="sheet-label-col" />
            {columns.map((col) => (
              <th
                key={col.key}
                className={breakdownColumnClass(col)}
                title={col.columnTitle}
              >
                <span className="sheet-col-label">{col.label}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {balanceRow('current', 'Current Acc')}
          {hasSavings && balanceRow('savings', 'Savings Acc')}
          <tr className="sheet-row-gap">
            <td colSpan={columns.length + 1} />
          </tr>
          <tr className="sheet-row-costs">
            <td className="sheet-row-label">Total costs</td>
            {columns.map((col) => (
              <CostsCell
                key={col.key}
                state={state}
                column={col}
                isOpen={openCostsKey === col.key}
                onOpen={() => setOpenCostsKey(col.key)}
                onClose={() => setOpenCostsKey(null)}
              />
            ))}
          </tr>
          {hasReceipts && (
            <tr className="sheet-row-receipts">
              <td className="sheet-row-label">Expected receipts</td>
              {columns.map((col) => (
                <Cell key={col.key} value={col.expectedReceipts} columnClass={breakdownColumnClass(col)} />
              ))}
            </tr>
          )}
          <tr className="sheet-row-gap">
            <td colSpan={columns.length + 1} />
          </tr>
          <tr className="sheet-row-final">
            <td className="sheet-row-label">Available</td>
            {columns.map((col) => (
              <Cell
                key={col.key}
                value={col.trueBalance}
                highlight={col.isRollup && col.trueBalance > 0}
                danger={col.isRollup && col.trueBalance < 0}
                columnClass={breakdownColumnClass(col)}
              />
            ))}
          </tr>
        </tbody>
      </table>
      <p className="sheet-edit-hint">
        Click a Current Acc{hasSavings ? ' or Savings Acc' : ''} cell to update balances. Click a Total
        costs cell for the breakdown.
      </p>
    </div>
  )
}
