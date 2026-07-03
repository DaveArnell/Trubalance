import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'

interface CommitmentNameEditorProps {
  value: string
  placeholder?: string
  className?: string
  style?: CSSProperties
  onSave: (value: string) => void
}

export function CommitmentNameEditor({
  value,
  placeholder = 'Name',
  className,
  style,
  onSave,
}: CommitmentNameEditorProps) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setDraft(value)
    const id = window.requestAnimationFrame(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    })
    return () => window.cancelAnimationFrame(id)
  }, [open, value])

  const close = () => setOpen(false)

  const save = () => {
    onSave(draft.trim() || placeholder)
    close()
  }

  return (
    <>
      <button
        type="button"
        className={`commitment-name-trigger${className ? ` ${className}` : ''}`}
        style={style}
        onClick={(event) => {
          event.stopPropagation()
          setOpen(true)
        }}
      >
        {value.trim() || placeholder}
      </button>
      {open &&
        createPortal(
          <div className="commitment-name-modal-backdrop" role="presentation" onClick={close}>
            <div
              className="commitment-name-modal"
              role="dialog"
              aria-labelledby="commitment-name-modal-title"
              onClick={(event) => event.stopPropagation()}
            >
              <h3 id="commitment-name-modal-title">Monthly cost name</h3>
              <p className="muted">Renaming splits this row out of a grouped name.</p>
              <input
                ref={inputRef}
                className="commitment-name-modal-input"
                type="text"
                value={draft}
                placeholder={placeholder}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') save()
                  if (event.key === 'Escape') close()
                }}
              />
              <div className="commitment-name-modal-actions">
                <button type="button" className="btn-primary btn-tiny" onClick={save}>
                  Save
                </button>
                <button type="button" className="btn-ghost btn-tiny" onClick={close}>
                  Cancel
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
