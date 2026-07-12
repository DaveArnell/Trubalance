import { useCallback, useEffect, useState } from 'react'

export const MOBILE_LAYOUT_MQ = '(max-width: 900px)'

function matchesMobile(): boolean {
  return typeof window !== 'undefined' && window.matchMedia(MOBILE_LAYOUT_MQ).matches
}

/** Slide-out navigation for phone-sized viewports. */
export function useMobileNav() {
  const [isMobile, setIsMobile] = useState(matchesMobile)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_LAYOUT_MQ)
    const onChange = () => {
      setIsMobile(mq.matches)
      if (!mq.matches) setMobileNavOpen(false)
    }
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    if (!isMobile || !mobileNavOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [isMobile, mobileNavOpen])

  const openMobileNav = useCallback(() => setMobileNavOpen(true), [])
  const closeMobileNav = useCallback(() => setMobileNavOpen(false), [])
  const toggleMobileNav = useCallback(() => setMobileNavOpen((open) => !open), [])

  return { isMobile, mobileNavOpen, openMobileNav, closeMobileNav, toggleMobileNav }
}
