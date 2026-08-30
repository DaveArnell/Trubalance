import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
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
const CARD_WIDTH = 380
const CARD_HEIGHT = 280
const CARD_MAX_WIDTH = 'min(24rem, calc(100vw - 2rem))'

function TourOverlay({ rect }: { rect: SpotlightRect | null }) {
  const vw = typeof window !== 'undefined' ? window.innerWidth : 0
  const vh = typeof window !== 'undefined' ? window.innerHeight : 0

  if (!rect) {
    return <div className="guided-tour-shade guided-tour-shade--full" aria-hidden />
  }

  const { top, left, width, height } = rect
  const right = Math.max(0, vw - left - width)
  const bottom = Math.max(0, vh - top - height)

  return (
    <>
      {/* Four panels around the hole so clicks inside the spotlight reach the app.
          Outside clicks do not dismiss - only Skip tour / Done. */}
      {top > 0 ? (
        <div className="guided-tour-shade" style={{ top: 0, left: 0, width: '100%', height: top }} aria-hidden />
      ) : null}
      {bottom > 0 ? (
        <div
          className="guided-tour-shade"
          style={{ top: top + height, left: 0, width: '100%', height: bottom }}
          aria-hidden
        />
      ) : null}
      {left > 0 ? (
        <div className="guided-tour-shade" style={{ top, left: 0, width: left, height }} aria-hidden />
      ) : null}
      {right > 0 ? (
        <div
          className="guided-tour-shade"
          style={{ top, left: left + width, width: right, height }}
          aria-hidden
        />
      ) : null}

      <div
        className="guided-tour-spotlight-ring"
        style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }}
        aria-hidden
      />
    </>
  )
}

export function GuidedTour() {
  const { activeTour, activePageId, nextStep, prevStep, skipTour, completeTour } = useTour()
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(MOBILE_LAYOUT_MQ).matches,
  )
  const [rect, setRect] = useState<SpotlightRect | null>(null)
  const [missingTarget, setMissingTarget] = useState(false)
  const targetRef = useRef<Element | null>(null)

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
    if (step.target === 'none') {
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
  }, [step?.id, step?.target, activePageId])

  useEffect(() => {
    if (!activeTour || !step?.page) return
    // Remeasure after page widgets mount
    const timer = window.setTimeout(measureTarget, 350)
    return () => window.clearTimeout(timer)
  }, [activePageId, step?.id, step?.page, activeTour])

  useEffect(() => {
    if (!activeTour) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') nextStep()
      if (e.key === 'ArrowLeft') prevStep()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [activeTour, nextStep, prevStep])

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
    const cardWidth = CARD_WIDTH
    const cardHeight = CARD_HEIGHT
    const margin = 12
    const gap = 14

    if (!rect) {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        maxWidth: CARD_MAX_WIDTH,
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
        ? ['left', 'right', 'bottom', 'top']
        : preferred === 'right'
          ? ['right', 'left', 'bottom', 'top']
          : preferred === 'top'
            ? ['top', 'bottom', 'right', 'left']
            : ['bottom', 'right', 'left', 'top']

    const placement = order.find((side) => fits[side]) ?? 'bottom'

    if (placement === 'right') {
      return {
        top: Math.min(Math.max(margin, rect.top), vh - cardHeight - margin),
        left: rect.left + rect.width + gap,
        maxWidth: CARD_MAX_WIDTH,
      }
    }
    if (placement === 'left') {
      return {
        top: Math.min(Math.max(margin, rect.top), vh - cardHeight - margin),
        right: vw - rect.left + gap,
        maxWidth: CARD_MAX_WIDTH,
      }
    }
    if (placement === 'top') {
      return {
        bottom: vh - rect.top + gap,
        left: Math.min(Math.max(margin, rect.left), vw - cardWidth - margin),
        maxWidth: CARD_MAX_WIDTH,
      }
    }
    // Prefer sitting under the spotlight, nudged toward the right so the card
    // does not cover Cash Prophet Balance on the left of wide overview strips.
    const preferRight = Math.max(margin, rect.left + rect.width - cardWidth)
    return {
      top: rect.top + rect.height + gap,
      left: Math.min(Math.max(margin, preferRight), vw - cardWidth - margin),
      maxWidth: CARD_MAX_WIDTH,
    }
  }

  const bodyParagraphs = step.body
    .split(/\n\n+/)
    .map((part) => part.trim())
    .filter(Boolean)

  return createPortal(
    <div className="guided-tour-root" role="presentation">
      <TourOverlay rect={rect} />
      <div
        className="guided-tour-card"
        style={tooltipStyle()}
        role="dialog"
        aria-labelledby="guided-tour-title"
      >
        <h3 id="guided-tour-title">{step.title}</h3>
        <div className="guided-tour-body">
          {bodyParagraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
        {missingTarget && (
          <p className="guided-tour-missing muted">
            This section is not visible right now. Try expanding a panel or switching page, then use
            Back.
          </p>
        )}
        <div className="guided-tour-actions">
          {step.ctaSecondary ? (
            step.ctaSecondaryAction === 'link' && step.ctaSecondaryTo ? (
              <Link to={step.ctaSecondaryTo} className="btn-ghost btn-tiny" onClick={completeTour}>
                {step.ctaSecondary}
              </Link>
            ) : (
              <button type="button" className="btn-ghost btn-tiny" onClick={skipTour}>
                {step.ctaSecondary}
              </button>
            )
          ) : (
            <button type="button" className="btn-ghost btn-tiny" onClick={skipTour}>
              {activeTour.tour.kind === 'demo' ? 'Skip and explore' : 'Skip tour'}
            </button>
          )}
          <div className="guided-tour-nav">
            <span className="guided-tour-step-count muted" aria-live="polite">
              {stepNumber} / {stepCount}
            </span>
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
              {step.ctaPrimary ?? (isLast ? 'Done' : 'Next')}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
