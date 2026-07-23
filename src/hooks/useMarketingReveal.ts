import { useEffect, type RefObject } from 'react'

const REVEAL_SELECTOR = [
  '.marketing-main--home > section',
  '.marketing-main--home .home-outcome-beat',
  '.marketing-main--home .home-compare-col',
  '.marketing-method-page > header.method-edu-hero',
  '.marketing-method-page > section',
  '.marketing-method-page > .marketing-accruing-demo',
  '.blog-index-header',
  '.blog-card',
  '.blog-article-header',
  '.blog-cta-box',
  '.demo-scenarios-section--landing',
  '.demo-scenarios-section .marketing-section-head',
  '.demo-scenarios-section .marketing-method-habits',
  '.marketing-pricing-section',
  '.marketing-billing-section',
  '.who-for-page section',
].join(', ')

/**
 * Soft scroll-in for marketing sections. Uses the marketing shell as the
 * scroll root (it owns overflow-y), and respects reduced-motion.
 */
export function useMarketingReveal(shellRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = shellRef.current
    if (!root) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const targets = Array.from(root.querySelectorAll<HTMLElement>(REVEAL_SELECTOR))

    for (const el of targets) {
      el.classList.add('marketing-reveal')
      if (reduceMotion) {
        el.classList.add('marketing-reveal--visible')
      }
    }

    if (reduceMotion || targets.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          entry.target.classList.add('marketing-reveal--visible')
          observer.unobserve(entry.target)
        }
      },
      {
        root,
        rootMargin: '0px 0px -10% 0px',
        threshold: 0.12,
      },
    )

    for (const el of targets) {
      // Hero / first section: show promptly so the page doesn't feel empty.
      if (el.matches('.marketing-hero, .method-edu-hero, .blog-index-header, .blog-article-header')) {
        requestAnimationFrame(() => el.classList.add('marketing-reveal--visible'))
        continue
      }
      observer.observe(el)
    }

    return () => observer.disconnect()
  }, [shellRef])
}
