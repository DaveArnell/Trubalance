import { useCallback, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type MouseEvent } from 'react'
import { flushSync } from 'react-dom'
import type { CommitmentDueRow } from '../types'
import type { FlatMonthlyCostRow } from './monthlyCostGrouping'

/**
 * Tab order for sheet tables: each row left-to-right, then the next row.
 * Pass rows in the same order they are rendered in the tbody.
 */
export function buildSheetTabOrder<T>(rows: T[], getCellIds: (row: T) => string[]): string[] {
  return rows.flatMap((row) => getCellIds(row))
}

function focusSheetCell(cellId: string) {
  const cell = document.querySelector<HTMLElement>(`[data-cell-id="${cellId}"]`)
  if (!cell) return
  const control = cell.querySelector<HTMLElement>('input, select, textarea')
  if (!control) return
  control.focus()
  if (control instanceof HTMLInputElement && control.type !== 'date') {
    control.select()
  }
}

function sheetCellExists(cellId: string): boolean {
  return !!document.querySelector(`[data-cell-id="${cellId}"]`)
}

export function adjacentSheetCellId(
  orderedCellIds: string[],
  currentId: string,
  direction: 'next' | 'prev',
  options?: { skipMissing?: boolean },
): string | null {
  const index = orderedCellIds.indexOf(currentId)
  if (index < 0) return null
  const step = direction === 'next' ? 1 : -1
  for (let i = index + step; i >= 0 && i < orderedCellIds.length; i += step) {
    const candidate = orderedCellIds[i]!
    if (!options?.skipMissing || sheetCellExists(candidate)) return candidate
  }
  return null
}

export function useSheetCellNavigation(orderedCellIds: string[]) {
  const [activeCell, setActiveCell] = useState<string | null>(null)

  const activate = useCallback((id: string) => setActiveCell(id), [])
  const deactivate = useCallback(() => setActiveCell(null), [])

  useLayoutEffect(() => {
    if (!activeCell) return
    focusSheetCell(activeCell)
  }, [activeCell])

  const tabFrom = useCallback(
    (currentId: string, direction: 'next' | 'prev') => {
      const nextId = adjacentSheetCellId(orderedCellIds, currentId, direction, { skipMissing: true })
      setActiveCell(nextId)
    },
    [orderedCellIds],
  )

  const makeTabHandler = useCallback(
    (cellId: string) => (direction: 'next' | 'prev') => tabFrom(cellId, direction),
    [tabFrom],
  )

  return useMemo(
    () => ({ activeCell, activate, deactivate, tabFrom, makeTabHandler }),
    [activeCell, activate, deactivate, tabFrom, makeTabHandler],
  )
}

export type SheetTabDirection = 'next' | 'prev'
export type SheetTabHandler = (direction: SheetTabDirection) => void

let skipNextSheetCellBlur = false

export function shouldSkipSheetCellBlur() {
  if (!skipNextSheetCellBlur) return false
  skipNextSheetCellBlur = false
  return true
}

/** Save and close a cell editor from Enter — ignores the blur that follows unmount. */
export function finishSheetCellEdit(commit: () => void, deactivate: () => void) {
  skipNextSheetCellBlur = true
  commit()
  flushSync(() => deactivate())
}

/** Activate on mousedown so the inline input can take focus before the first keystroke. */
export function sheetCellActivateOnMouseDown(isActive: boolean, onActivate: () => void) {
  if (isActive) return undefined
  return (event: MouseEvent) => {
    event.preventDefault()
    onActivate()
  }
}

/** Seed a draft value when a cell opens; ignore prop updates while the cell stays open. */
export function useSheetInlineDraft(isActive: boolean, seed: string) {
  const [draft, setDraft] = useState(seed)
  const wasActiveRef = useRef(false)

  useLayoutEffect(() => {
    if (isActive && !wasActiveRef.current) {
      setDraft(seed)
    }
    wasActiveRef.current = isActive
  }, [isActive, seed])

  return [draft, setDraft] as const
}

export function handleSheetInputTabKey(
  event: KeyboardEvent,
  onTab: SheetTabHandler | undefined,
  commit: () => void,
) {
  if (event.key !== 'Tab' || !onTab) return false
  event.preventDefault()
  commit()
  skipNextSheetCellBlur = true
  onTab(event.shiftKey ? 'prev' : 'next')
  return true
}

/** Tab through stacked account inputs before leaving the balance popover. */
export function handleBalancePopoverTabKey(
  event: KeyboardEvent,
  index: number,
  accountCount: number,
  inputRefs: { current: Array<HTMLInputElement | null> },
  onTab: SheetTabHandler | undefined,
  commit: () => void,
) {
  if (event.key !== 'Tab' || accountCount <= 1) return false

  if (event.shiftKey) {
    if (index > 0) {
      event.preventDefault()
      const prev = inputRefs.current[index - 1]
      prev?.focus()
      prev?.select()
      return true
    }
    return handleSheetInputTabKey(event, onTab, commit)
  }

  if (index < accountCount - 1) {
    event.preventDefault()
    const next = inputRefs.current[index + 1]
    next?.focus()
    next?.select()
    return true
  }

  return handleSheetInputTabKey(event, onTab, commit)
}

export function focusBalancePopoverInput(inputRefs: { current: Array<HTMLInputElement | null> }) {
  requestAnimationFrame(() => {
    const first = inputRefs.current[0]
    first?.focus()
    first?.select()
  })
}

export function breakdownBalanceCellIds(
  columns: {
    key: string
    isRollup: boolean
    currentAccounts: unknown[]
    savingsAccounts: unknown[]
  }[],
): string[] {
  const current: string[] = []
  const savings: string[] = []
  for (const col of columns) {
    if (col.isRollup) continue
    if (col.currentAccounts.length > 0) current.push(`${col.key}-current`)
    if (col.savingsAccounts.length > 0) savings.push(`${col.key}-savings`)
  }
  return [...current, ...savings]
}

export function monthlyCostRowEditableCellIds(commitmentId: string): string[] {
  return [`${commitmentId}-name`, `${commitmentId}-scope`, `${commitmentId}-day`, `${commitmentId}-amount`]
}

export function monthlyCostEditableCellIds(flatRows: FlatMonthlyCostRow[]): string[] {
  const leaves = flatRows.filter(
    (flat): flat is Extract<FlatMonthlyCostRow, { kind: 'leaf' }> => flat.kind === 'leaf',
  )
  return buildSheetTabOrder(leaves, (flat) => monthlyCostRowEditableCellIds(flat.row.commitment.id))
}

export function receiptEditableCellIds(receipts: { id: string }[]): string[] {
  return buildSheetTabOrder(receipts, (item) => [
    `${item.id}-name`,
    `${item.id}-scope`,
    `${item.id}-expected`,
    `${item.id}-accrual-start`,
    `${item.id}-amount`,
  ])
}

/** Editable cells for one Due row, left-to-right (skip non-editable columns). */
export function dueRowEditableCellIds(row: CommitmentDueRow): string[] {
  if (row.reserveTransferDirection) return []
  if (row.source === 'reserve') {
    return [`due-${row.id}-scope`, `due-${row.id}-timing`, `due-${row.id}-amount`]
  }
  const item = row.commitment
  return [
    `due-${item.id}-name`,
    `due-${item.id}-scope`,
    `due-${row.id}-timing`,
    `due-${item.id}-amount`,
  ]
}

export function dueEditableCellIds(rows: CommitmentDueRow[]): string[] {
  return buildSheetTabOrder(rows, dueRowEditableCellIds)
}
