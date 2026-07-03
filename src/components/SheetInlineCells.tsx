import { useLayoutEffect, useRef, type CSSProperties, type ReactNode } from 'react'
import type { AppState, Commitment, ScopeLevel } from '../types'
import { getScopeItemLabel, isCommitmentScopeAllowed, isValidScopeReference } from '../utils/scope'
import { formatCurrency } from '../utils/format'
import { formatPlannedDueDate } from '../utils/plannedFunding'
import {
  handleSheetInputTabKey,
  finishSheetCellEdit,
  shouldSkipSheetCellBlur,
  sheetCellActivateOnMouseDown,
  useSheetInlineDraft,
  type SheetTabHandler,
} from '../utils/sheetCellNavigation'

export type { SheetTabHandler }

export function InlineTextCell({
  cellId,
  value,
  isActive,
  placeholder,
  hint,
  className,
  style,
  onActivate,
  onDeactivate,
  onSave,
  onTab,
}: {
  cellId: string
  value: string
  isActive: boolean
  placeholder?: string
  hint?: string
  className?: string
  style?: CSSProperties
  onActivate: () => void
  onDeactivate: () => void
  onSave: (value: string) => void
  onTab?: SheetTabHandler
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [draft, setDraft] = useSheetInlineDraft(isActive, value)

  useLayoutEffect(() => {
    if (!isActive) return
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [isActive])

  const commit = () => onSave(draft.trim())

  return (
    <td
      className={`sheet-cell-editable${isActive ? ' sheet-cell-active' : ''}${className ? ` ${className}` : ''}`}
      style={style}
      onMouseDown={sheetCellActivateOnMouseDown(isActive, onActivate)}
      data-cell-id={cellId}
    >
      <span className="sheet-cell-value">{value || placeholder || '—'}</span>
      {hint && !isActive && <span className="sheet-row-hint">{hint}</span>}
      {isActive && (
        <input
          ref={inputRef}
          className="sheet-cell-inline-input"
          type="text"
          value={draft}
          placeholder={placeholder}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            if (shouldSkipSheetCellBlur()) return
            commit()
            onDeactivate()
          }}
          onKeyDown={(e) => {
            if (handleSheetInputTabKey(e, onTab, commit)) return
            if (e.key === 'Enter') {
              e.preventDefault()
              finishSheetCellEdit(commit, onDeactivate)
              return
            }
            if (e.key === 'Escape') onDeactivate()
          }}
        />
      )}
    </td>
  )
}

export function InlineNumberCell({
  cellId,
  value,
  isActive,
  onActivate,
  onDeactivate,
  onSave,
  onTab,
}: {
  cellId: string
  value: number
  isActive: boolean
  onActivate: () => void
  onDeactivate: () => void
  onSave: (value: number) => void
  onTab?: SheetTabHandler
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [draft, setDraft] = useSheetInlineDraft(isActive, value ? String(value) : '')

  useLayoutEffect(() => {
    if (!isActive) return
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [isActive])

  const commit = () => {
    const raw = draft.trim()
    onSave(raw === '' ? 0 : Number(raw))
  }

  return (
    <td
      className={`sheet-cell-editable sheet-num${isActive ? ' sheet-cell-active' : ''}`}
      onMouseDown={sheetCellActivateOnMouseDown(isActive, onActivate)}
      data-cell-id={cellId}
    >
      <span className="sheet-cell-value">{formatCurrency(value)}</span>
      {isActive && (
        <input
          ref={inputRef}
          className="sheet-cell-inline-input"
          type="number"
          step="0.01"
          value={draft}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            if (shouldSkipSheetCellBlur()) return
            commit()
            onDeactivate()
          }}
          onKeyDown={(e) => {
            if (handleSheetInputTabKey(e, onTab, commit)) return
            if (e.key === 'Enter') {
              e.preventDefault()
              finishSheetCellEdit(commit, onDeactivate)
              return
            }
            if (e.key === 'Escape') onDeactivate()
          }}
        />
      )}
    </td>
  )
}

export function InlineDayCell({
  cellId,
  value,
  isActive,
  onActivate,
  onDeactivate,
  onSave,
  onTab,
}: {
  cellId: string
  value: number
  isActive: boolean
  onActivate: () => void
  onDeactivate: () => void
  onSave: (value: number) => void
  onTab?: SheetTabHandler
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [draft, setDraft] = useSheetInlineDraft(isActive, String(value))

  useLayoutEffect(() => {
    if (!isActive) return
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [isActive])

  const commit = () => {
    const n = Math.min(31, Math.max(1, Number(draft) || 1))
    onSave(n)
  }

  const ordinalDay = (day: number) => {
    if (day >= 11 && day <= 13) return `${day}th`
    const mod = day % 10
    if (mod === 1) return `${day}st`
    if (mod === 2) return `${day}nd`
    if (mod === 3) return `${day}rd`
    return `${day}th`
  }

  return (
    <td
      className={`sheet-cell-editable${isActive ? ' sheet-cell-active' : ''}`}
      onMouseDown={sheetCellActivateOnMouseDown(isActive, onActivate)}
      title="Day of month when full amount becomes due"
      data-cell-id={cellId}
    >
      <span className="sheet-cell-value">{ordinalDay(value)}</span>
      {isActive && (
        <input
          ref={inputRef}
          className="sheet-cell-inline-input"
          type="number"
          min={1}
          max={31}
          value={draft}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            if (shouldSkipSheetCellBlur()) return
            commit()
            onDeactivate()
          }}
          onKeyDown={(e) => {
            if (handleSheetInputTabKey(e, onTab, commit)) return
            if (e.key === 'Enter') {
              e.preventDefault()
              finishSheetCellEdit(commit, onDeactivate)
              return
            }
            if (e.key === 'Escape') onDeactivate()
          }}
        />
      )}
    </td>
  )
}

export type ScopeOption = { level: ScopeLevel; id: string; label: string }

export function ScopeSelectCell({
  cellId,
  state,
  scopeLevel,
  scopeId,
  options,
  commitmentScope,
  isActive,
  onActivate,
  onDeactivate,
  onChange,
  onTab,
  className,
}: {
  cellId: string
  state: AppState
  scopeLevel: ScopeLevel
  scopeId: string
  options: ScopeOption[]
  commitmentScope?: boolean
  isActive: boolean
  onActivate: () => void
  onDeactivate: () => void
  onChange: (level: ScopeLevel, id: string) => void
  onTab?: SheetTabHandler
  className?: string
}) {
  const selectRef = useRef<HTMLSelectElement>(null)
  const valid = commitmentScope
    ? isCommitmentScopeAllowed(state, scopeLevel, scopeId)
    : isValidScopeReference(state, scopeLevel, scopeId)
  const label =
    options.find((o) => o.level === scopeLevel && o.id === scopeId)?.label ??
    getScopeItemLabel(state, scopeLevel, scopeId)
  const currentValue = `${scopeLevel}:${scopeId}`
  const valueInOptions = options.some((o) => `${o.level}:${o.id}` === currentValue)

  useLayoutEffect(() => {
    if (!isActive) return
    selectRef.current?.focus()
    try {
      selectRef.current?.showPicker?.()
    } catch {
      /* showPicker not supported */
    }
  }, [isActive])

  return (
    <td
      className={`committed-scope-col sheet-row-label sheet-scope--${scopeLevel} sheet-cell-editable${valid ? '' : ' sheet-scope-invalid'}${className ? ` ${className}` : ''}${isActive ? ' sheet-cell-active' : ''}`}
      onMouseDown={sheetCellActivateOnMouseDown(isActive, onActivate)}
      data-cell-id={cellId}
      title={valid ? undefined : commitmentScope ? 'Choose a business or venue' : 'Choose where this applies'}
    >
      {isActive ? (
        <select
          ref={selectRef}
          className="sheet-cell-full-select"
          value={currentValue}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => {
            const [level, id] = e.target.value.split(':')
            onChange(level as ScopeLevel, id)
            onDeactivate()
          }}
          onBlur={() => {
            if (shouldSkipSheetCellBlur()) return
            onDeactivate()
          }}
          onKeyDown={(e) => {
            if (handleSheetInputTabKey(e, onTab, () => {})) return
            if (e.key === 'Escape') onDeactivate()
          }}
        >
          {!valueInOptions && (
            <option value={currentValue}>{label} — choose business or venue</option>
          )}
          {options.map((o) => (
            <option key={`${o.level}:${o.id}`} value={`${o.level}:${o.id}`}>
              {o.label}
            </option>
          ))}
        </select>
      ) : (
        <span className="sheet-cell-value">{label}</span>
      )}
    </td>
  )
}

export function InlinePlannedDueCell({
  cellId,
  commitment,
  statusDot,
  isActive,
  onActivate,
  onDeactivate,
  onSave,
  onTab,
}: {
  cellId: string
  commitment: Commitment
  statusDot?: ReactNode
  isActive: boolean
  onActivate: () => void
  onDeactivate: () => void
  onSave: (plannedDueDate: string | undefined, displayLabel: string) => void
  onTab?: SheetTabHandler
}) {
  const display = formatPlannedDueDate(commitment.plannedDueDate, commitment.plannedLabel)
  const editValue = commitment.plannedDueDate ?? ''
  const [draft, setDraft] = useSheetInlineDraft(isActive, editValue)

  const commit = () => {
    const raw = draft
    if (!raw) {
      onSave(undefined, '')
    } else {
      onSave(raw, formatPlannedDueDate(raw))
    }
  }

  return (
    <td
      className={`committed-due-timing sheet-cell-editable${isActive ? ' sheet-cell-active' : ''}`}
      onMouseDown={sheetCellActivateOnMouseDown(isActive, onActivate)}
      title="Click to change due date"
      data-cell-id={cellId}
    >
      {!isActive && (
        <span className="committed-due-timing-line">
          {statusDot}
          <span>{display}</span>
        </span>
      )}
      {isActive && (
        <input
          className="sheet-cell-inline-input sheet-cell-inline-input--date"
          type="date"
          value={draft}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            if (shouldSkipSheetCellBlur()) return
            commit()
            onDeactivate()
          }}
          onKeyDown={(e) => {
            if (handleSheetInputTabKey(e, onTab, commit)) return
            if (e.key === 'Enter') {
              e.preventDefault()
              finishSheetCellEdit(commit, onDeactivate)
              return
            }
            if (e.key === 'Escape') onDeactivate()
          }}
          autoFocus
        />
      )}
    </td>
  )
}

export function InlineDueTimingCell({
  cellId,
  timing,
  dueDay,
  rolledHint,
  rolledTooltip,
  statusDot,
  isActive,
  onActivate,
  onDeactivate,
  onSaveDay,
  onTab,
}: {
  cellId: string
  timing: string | null
  dueDay: number
  rolledHint?: string | null
  rolledTooltip?: string | null
  statusDot: ReactNode
  isActive: boolean
  onActivate: () => void
  onDeactivate: () => void
  onSaveDay: (day: number) => void
  onTab?: SheetTabHandler
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [draft, setDraft] = useSheetInlineDraft(isActive, String(dueDay))

  useLayoutEffect(() => {
    if (!isActive) return
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [isActive])

  const commit = () => {
    const n = Math.min(31, Math.max(1, Number(draft) || dueDay))
    onSaveDay(n)
  }

  return (
    <td
      className={`committed-due-timing sheet-cell-editable${isActive ? ' sheet-cell-active' : ''}`}
      onMouseDown={sheetCellActivateOnMouseDown(isActive, onActivate)}
      title="Click to change due day of month"
      data-cell-id={cellId}
    >
      {!isActive && (
        <span className="committed-due-timing-line">
          {statusDot}
          <span>{timing ?? '—'}</span>
          {rolledHint && (
            <span className="committed-rolled-badge" title={rolledTooltip ?? undefined}>
              {rolledHint}
            </span>
          )}
        </span>
      )}
      {isActive && (
        <input
          ref={inputRef}
          className="sheet-cell-inline-input sheet-cell-inline-input--due-day"
          type="number"
          min={1}
          max={31}
          value={draft}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            if (shouldSkipSheetCellBlur()) return
            commit()
            onDeactivate()
          }}
          onKeyDown={(e) => {
            if (handleSheetInputTabKey(e, onTab, commit)) return
            if (e.key === 'Enter') {
              e.preventDefault()
              finishSheetCellEdit(commit, onDeactivate)
              return
            }
            if (e.key === 'Escape') onDeactivate()
          }}
        />
      )}
    </td>
  )
}
