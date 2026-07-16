import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { MOBILE_LAYOUT_MQ } from '../hooks/useMobileNav'
import { useTour } from '../contexts/TourContext'

interface SpotlightRect {
  top: number
  left: number
  width: number
  height: number
}

const PAD = 10
const TARGET_CLASS = 'guided-tour-target'
const MASK_ID = 'guided-tour-spotlight-mask'

function TourOverlay({
  rect,
  maskId,
  onDismiss,
}: {
  rect: SpotlightRect | null
  maskId: string
  onDismiss: () => void
}) {
  const vw = typeof window !== 'undefined' ? window.innerWidth : 0
  const vh = typeof window !== 'undefined' ? window.innerHeight : 0

  return (
    <>
      <svg className="guided-tour-mask-svg" aria-hidden>
        <defs>
          <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width={vw} height={vh}>
            <rect x="0" y="0" width={vw} height={vh} fill="white" />
            {rect && (
              <rect
                x={rect.left}
                y={rect.top}
                width={rect.width}
                height={rect.height}
                rx="8"
                fill="black"
              />
            )}
          </mask>
        </defs>
      </svg>

      <button
        type="button"
        className="guided-tour-shade"
        style={{ mask: `url(#${maskId})`, WebkitMask: `url(#${maskId})` }}
        aria-label="Close tour"
        onClick={onDismiss}
      />

      {rect && (
        <div
          className="guided-tour-spotlight-ring"
          style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }}
          aria-hidden
        />
      )}
    </>
  )
}

export function GuidedTour() {
  const { activeTour, nextStep, prevStep, skipTour, completeTour } = useTour()
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(MOBILE_LAYOUT_MQ).matches,
  )
  const [rect, setRect] = useState<SpotlightRect | null>(null)
  const [missingTarget, setMissingTarget] = useState(false)
  const targetRef = useRef<Element | null>(null)
  const maskId = useId().replace(/:/g, '')

  const step = activeTour?.tour.steps[activeTour.stepIndex]
  const stepCount = activeTour?.tour.steps.length ?? 0
  const stepNumber = (activeTour?.stepIndex ?? 0) + 1
  const isLast = activeTour ? activeTour.stepIndex >= stepCount - 1 : false

  const clearTargetHighlight = () => {
    if (targetRef.current) {
      targetRef.current.classList.remove(TARGET_CLASS)
      targetRef.current = null
    }
  }

  const measureTarget = () => {
    clearTargetHighlight()
    if (!step) {
      setRect(null)
      setMissingTarget(false)
      return
    }
    const el = document.querySelector(step.target)
    if (!el) {
      setRect(null)
      setMissingTarget(true)
      return
    }
    setMissingTarget(false)
    el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    window.setTimeout(() => {
      const target = document.querySelector(step.target)
      if (!target) return
      targetRef.current = target
      target.classList.add(TARGET_CLASS)
      const r = target.getBoundingClientRect()
      setRect({
        top: Math.max(0, r.top - PAD),
        left: Math.max(0, r.left - PAD),
        width: r.width + PAD * 2,
        height: r.height + PAD * 2,
      })
    }, 150)
  }

  useLayoutEffect(() => {
    measureTarget()
    return () => clearTargetHighlight()
  }, [step?.id, step?.target])

  useEffect(() => {
    if (!activeTour) return
    const onResize = () => measureTarget()
    window.addEventListener('resize', onResize)
    window.addEventListener('scroll', onResize, true)
    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('scroll', onResize, true)
    }
  }, [activeTour, step?.id])

  useEffect(() => {
    if (!activeTour) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') skipTour()
      if (e.key === 'ArrowRight' || e.key === 'Enter') nextStep()
      if (e.key === 'ArrowLeft') prevStep()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [activeTour, nextStep, prevStep, skipTour])

  useEffect(() => {
    if (!activeTour) clearTargetHighlight()
  }, [activeTour])

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_LAYOUT_MQ)
    const onChange = () => setIsMobile(mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    if (isMobile && activeTour) skipTour()
  }, [isMobile, activeTour, skipTour])

  if (!activeTour || !step || isMobile) return null

  const tooltipStyle = (): CSSProperties => {
    const cardWidth = 320
    const cardHeight = 220
    const margin = 12
    const gap = 14

    if (!rect) {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        maxWidth: '22rem',
      }
    }

    const vw = window.innerWidth
    const vh = window.innerHeight
    const preferred = step.placement ?? 'bottom'

    const fits = {
      bottom:
        rect.top + rect.height + gap + cardHeight <= vh - margin &&
        rect.left + cardWidth <= vw - margin,
      top: rect.top - gap - cardHeight >= margin,
      right: rect.left + rect.width + gap + cardWidth <= vw - margin,
      left: rect.left - gap - cardWidth >= margin,
    }

    const order: Array<'bottom' | 'top' | 'right' | 'left'> =
      preferred === 'left'
        ? ['left', 'right', 'top', 'bottom']
        : preferred === 'right'
          ? ['right', 'left', 'top', 'bottom']
          : preferred === 'top'
            ? ['top', 'bottom', 'right', 'left']
            : ['bottom', 'top', 'right', 'left']

    const placement = order.find((side) => fits[side]) ?? 'bottom'

    if (placement === 'right') {
      return {
        top: Math.min(Math.max(margin, rect.top), vh - cardHeight - margin),
        left: rect.left + rect.width + gap,
        maxWidth: '18rem',
      }
    }
    if (placement === 'left') {
      return {
        top: Math.min(Math.max(margin, rect.top), vh - cardHeight - margin),
        right: vw - rect.left + gap,
        maxWidth: '18rem',
      }
    }
    if (placement === 'top') {
      return {
        bottom: vh - rect.top + gap,
        left: Math.min(Math.max(margin, rect.left), vw - cardWidth - margin),
        maxWidth: '20rem',
      }
    }
    return {
      top: rect.top + rect.height + gap,
      left: Math.min(Math.max(margin, rect.left), vw - cardWidth - margin),
      maxWidth: '20rem',
    }
  }

  return createPortal(
    <div className="guided-tour-root" role="presentation">
      <TourOverlay rect={rect} maskId={maskId || MASK_ID} onDismiss={skipTour} />
      <div className="guided-tour-card" style={tooltipStyle()} role="dialog" aria-labelledby="guided-tour-title">
        <p className="guided-tour-kicker">
          {activeTour.tour.title} · Step {stepNumber} of {stepCount}
        </p>
        <h3 id="guided-tour-title">{step.title}</h3>
        <p className="guided-tour-body">{step.body}</p>
        {missingTarget && (
          <p className="guided-tour-missing muted">
            This section is not visible right now — try expanding a panel or switching page, then use Back.
          </p>
        )}
        <div className="guided-tour-actions">
          <button type="button" className="btn-ghost btn-tiny" onClick={skipTour}>
            Skip tour
          </button>
          <div className="guided-tour-nav">
            <button
              type="button"
              className="btn-secondary btn-tiny"
              disabled={activeTour.stepIndex === 0}
              onClick={prevStep}
            >
              Back
            </button>
            <button
              type="button"
              className="btn-primary btn-tiny"
              onClick={isLast ? completeTour : nextStep}
            >
              {isLast ? 'Done' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
