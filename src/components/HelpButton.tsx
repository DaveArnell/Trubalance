import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTourOptional } from '../contexts/TourContext'

interface HelpButtonProps {
  id: string
  text: string
  openHelp: string | null
  setOpenHelp: (id: string | null) => void
  className?: string
  /** When true, shows a link to start the guided tour for the current page */
  showTourLink?: boolean
}

export function HelpButton({
  id,
  text,
  openHelp,
  setOpenHelp,
  className,
  showTourLink = true,
}: HelpButtonProps) {
  const btnRef = useRef<HTMLButtonElement>(null)
  const tour = useTourOptional()
  const open = openHelp === id
  const [pos, setPos] = useState({ top: 0, right: 0 })
  const canStartTour = showTourLink && tour && tour.activePageId && !tour.isTourActive

  useEffect(() => {
    if (!open || !btnRef.current) return
    const update = () => {
      const rect = btnRef.current!.getBoundingClientRect()
      setPos({
        top: rect.bottom + 6,
        right: Math.max(12, window.innerWidth - rect.right),
      })
    }
    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenHelp(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, setOpenHelp])

  const startPageTour = () => {
    setOpenHelp(null)
    tour?.startPageTour()
  }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className={className ? `help-btn ${className}` : 'help-btn'}
        onClick={() => setOpenHelp(open ? null : id)}
        aria-label="Help"
        aria-expanded={open}
      >
        ?
      </button>
      {open &&
        createPortal(
          <>
            <button
              type="button"
              className="help-backdrop"
              aria-label="Close help"
              onClick={() => setOpenHelp(null)}
            />
            <div
              className="help-popover"
              style={{ top: pos.top, right: pos.right }}
              role="dialog"
              aria-label="Help"
            >
              <p>{text}</p>
              {canStartTour && (
                <button type="button" className="help-tour-link" onClick={startPageTour}>
                  Take a guided tour of this page →
                </button>
              )}
            </div>
          </>,
          document.body,
        )}
    </>
  )
}
