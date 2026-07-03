import { useEffect, useState } from 'react'
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

  useEffect(() => {
    setText(initialText)
  }, [date, initialText])

  return (
    <div className="day-note-backdrop" onClick={onClose}>
      <div
        className="day-note-dialog"
        role="dialog"
        aria-labelledby="day-note-title"
        onClick={(e) => e.stopPropagation()}
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
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="e.g. Large supplier payment cancelled — True Balance jumped back up."
          autoFocus
        />
        <div className="day-note-dialog-actions">
          <button
            type="button"
            className="btn-ghost btn-tiny"
            onClick={() => {
              onSave(null)
              onClose()
            }}
          >
            Remove note
          </button>
          <button
            type="button"
            className="btn-primary btn-tiny"
            onClick={() => {
              onSave(text.trim() || null)
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
