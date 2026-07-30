import { useEffect, useRef, useState } from 'react'
import { formatSnapshotDateLong } from '../utils/snapshots'

interface DayNoteEditorProps {
  date: string
  scopeLabel?: string
  initialText: string
  onSave: (text: string | null) => void
  onClose: () => void
}

export function DayNoteEditor({ date, scopeLabel, initialText, onSave, onClose }: DayNoteEditorProps) {
  const [text, setText] = useState(initialText)
  const backdropPointerDown = useRef(false)

  useEffect(() => {
    setText(initialText)
  }, [date, initialText])

  return (
    <div
      className="day-note-backdrop"
      onPointerDown={(e) => {
        backdropPointerDown.current = e.target === e.currentTarget
      }}
      onClick={(e) => {
        if (backdropPointerDown.current && e.target === e.currentTarget) onClose()
        backdropPointerDown.current = false
      }}
    >
      <div
        className="day-note-dialog"
        role="dialog"
        aria-labelledby="day-note-title"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <header className="day-note-dialog-head">
          <h3 id="day-note-title">
            Note for {formatSnapshotDateLong(date)}
            {scopeLabel ? ` · ${scopeLabel}` : ''}
          </h3>
          <button type="button" className="btn-ghost btn-tiny" onClick={onClose}>
            Close
          </button>
        </header>
        <p className="muted day-note-dialog-lead">
          Explain anything important for this day — cancellations, one-off payments, or why the balance moved.
          Shown when you hover the trend chart or balance log
          {scopeLabel ? ` for ${scopeLabel}` : ''}.
        </p>
        <textarea
          className="day-note-textarea"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          placeholder="e.g. Large supplier payment cancelled — Available jumped back up."
          autoFocus
        />
        <div className="day-note-dialog-actions">
          <button
            type="button"
            className="btn-ghost"
            onClick={() => {
              onSave(null)
              onClose()
            }}
          >
            Clear note
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              onSave(text.trim() ? text.trim() : null)
              onClose()
            }}
          >
            Save note
          </button>
        </div>
      </div>
    </div>
  )
}
