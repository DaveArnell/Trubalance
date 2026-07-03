import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { BalanceSaveChange } from '../hooks/useAppState'
import type { BreakdownColumn } from '../utils/breakdownTable'
import { toAmount, roundCurrency } from '../utils/amounts'
import { formatCurrencyCompact } from '../utils/format'
import { breakdownBalanceCellIds, finishSheetCellEdit, shouldSkipSheetCellBlur, useSheetCellNavigation, useSheetInlineDraft } from '../utils/sheetCellNavigation'

function SlimColumnPill({
  column,
  isActive,
  onActivate,
  onDeactivate,
  onSave,
}: {
  column: BreakdownColumn
  isActive: boolean
  onActivate: () => void
  onDeactivate: () => void
  onSave: (changes: BalanceSaveChange[]) => void
}) {
  const columnRef = useRef<HTMLElement>(null)
  const accounts = [...column.currentAccounts, ...column.savingsAccounts]
  const editable = !column.isRollup && accounts.length > 0
  const inputRef = useRef<HTMLInputElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [panelPos, setPanelPos] = useState({ top: 0, left: 0 })

  const updatePanelPos = useCallback(() => {
    if (!columnRef.current) return
    const rect = columnRef.current.getBoundingClientRect()
    const panelWidth = popoverRef.current?.offsetWidth ?? 176
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - panelWidth - 8))
    setPanelPos({ top: rect.bottom + 4, left })
  }, [])

  useLayoutEffect(() => {
    if (!isActive || accounts.length !== 1) return
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [isActive, accounts.length])

  const singleAccount = accounts.length === 1 ? accounts[0]! : null
  const [singleDraft, setSingleDraft] = useSheetInlineDraft(
    isActive && !!singleAccount,
    singleAccount ? String(toAmount(singleAccount.balance)) : '',
  )

  const commitDrafts = useCallback(() => {
    const changes: BalanceSaveChange[] = []
    for (const account of accounts) {
      const raw = drafts[account.id]
      if (raw === undefined || raw.trim() === '') continue
      const balance = roundCurrency(toAmount(raw))
      if (balance !== toAmount(account.balance)) {
        changes.push({ accountId: account.id, balance })
      }
    }
    if (changes.length > 0) onSave(changes)
    onDeactivate()
    setDrafts({})
  }, [accounts, drafts, onSave, onDeactivate])

  useLayoutEffect(() => {
    if (!isActive || accounts.length <= 1) return
    updatePanelPos()
    requestAnimationFrame(updatePanelPos)
  }, [isActive, accounts.length, updatePanelPos])

  useEffect(() => {
    if (!isActive || accounts.length <= 1) return

    const handleLayout = () => updatePanelPos()
    window.addEventListener('resize', handleLayout)
    window.addEventListener('scroll', handleLayout, true)

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (columnRef.current?.contains(target) || popoverRef.current?.contains(target)) return
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

  const commitSingle = () => {
    if (!singleAccount) return
    const balance = roundCurrency(toAmount(singleDraft))
    if (balance !== roundCurrency(toAmount(singleAccount.balance))) {
      onSave([{ accountId: singleAccount.id, balance }])
    }
  }

  const tbClass =
    column.isRollup && column.trueBalance < 0
      ? 'overview-slim-tb overview-slim-tb--danger'
      : column.isRollup && column.trueBalance > 0
        ? 'overview-slim-tb overview-slim-tb--highlight'
        : 'overview-slim-tb'

  const balancePopover =
    editable &&
    isActive &&
    accounts.length > 1 &&
    createPortal(
      <div
        ref={popoverRef}
        className="overview-slim-edit-popover overview-slim-edit-popover--portal"
        style={{ top: panelPos.top, left: panelPos.left }}
        role="dialog"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <p className="overview-slim-edit-title">Update balances</p>
        {accounts.map((account) => (
          <label key={account.id} className="overview-slim-edit-row">
            <span>{account.name}</span>
            <input
              type="number"
              step="0.01"
              value={drafts[account.id] ?? ''}
              onChange={(e) => setDrafts((d) => ({ ...d, [account.id]: e.target.value }))}
            />
          </label>
        ))}
        <div className="overview-slim-edit-actions">
          <button type="button" className="btn-ghost btn-tiny" onClick={onDeactivate}>
            Cancel
          </button>
          <button type="button" className="btn-primary btn-tiny" onClick={commitDrafts}>
            Save
          </button>
        </div>
      </div>,
      document.body,
    )

  return (
    <article
      ref={columnRef}
      className={`overview-slim-col${column.isRollup ? ' overview-slim-col--rollup' : ''}${column.isSharedScope ? ' overview-slim-col--shared' : ''}${isActive ? ' overview-slim-col--active' : ''}`}
    >
      <span className="overview-slim-col-label" title={column.columnTitle}>
        {column.label}
      </span>

      {editable && isActive && accounts.length === 1 && singleAccount ? (
        <input
          ref={inputRef}
          className="overview-slim-cash-input"
          type="number"
          step="0.01"
          value={singleDraft}
          onChange={(e) => setSingleDraft(e.target.value)}
          onBlur={() => {
            if (shouldSkipSheetCellBlur()) return
            commitSingle()
            onDeactivate()
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              finishSheetCellEdit(commitSingle, onDeactivate)
            }
            if (e.key === 'Escape') onDeactivate()
          }}
        />
      ) : (
        <button
          type="button"
          className={`overview-slim-cash${editable ? ' overview-slim-cash--editable' : ''}`}
          onMouseDown={
            editable
              ? (e) => {
                  e.preventDefault()
                  onActivate()
                }
              : undefined
          }
          disabled={!editable}
          title={editable ? 'Click to update cash balance' : undefined}
        >
          {formatCurrencyCompact(column.cash)}
        </button>
      )}

      <span className={tbClass}>{formatCurrencyCompact(column.trueBalance)}</span>

      {balancePopover}
    </article>
  )
}

interface BreakdownSlimBarProps {
  columns: BreakdownColumn[]
  onBalanceSave: (changes: BalanceSaveChange[]) => void
}

export function BreakdownSlimBar({ columns, onBalanceSave }: BreakdownSlimBarProps) {
  const balanceCellIds = useMemo(() => breakdownBalanceCellIds(columns), [columns])
  const { activeCell, activate, deactivate } = useSheetCellNavigation(balanceCellIds)

  if (columns.length === 0) return null

  return (
    <div className="overview-slim-bar">
      <div className="overview-slim-cols">
        {columns.map((col) => {
          const cellId = `${col.key}-current`
          return (
            <SlimColumnPill
              key={col.key}
              column={col}
              isActive={activeCell === cellId}
              onActivate={() => activate(cellId)}
              onDeactivate={deactivate}
              onSave={(changes) => {
                onBalanceSave(changes)
                deactivate()
              }}
            />
          )
        })}
      </div>
    </div>
  )
}
