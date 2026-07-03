import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { PageId } from '../navigation'
import { SETUP_TOUR, getTourForPage, type PageTour } from '../content/pageTours'
import { markOnboardingComplete } from '../services/adminRepository'
import { trackEvent } from '../services/eventTracking'

interface ActiveTour {
  tour: PageTour
  stepIndex: number
}

interface TourContextValue {
  activePageId: PageId | null
  setActivePageId: (pageId: PageId) => void
  activeTour: ActiveTour | null
  startTour: (tour: PageTour, stepIndex?: number) => void
  startPageTour: (pageId?: PageId) => void
  startSetupTour: () => void
  nextStep: () => void
  prevStep: () => void
  skipTour: () => void
  completeTour: () => void
  isTourActive: boolean
}

const TourContext = createContext<TourContextValue | null>(null)

const TOUR_DISMISSED_KEY = 'trubalance-tour-dismissed-v1'

export function TourProvider({
  children,
  userId,
  onboardingCompleted,
  onOnboardingComplete,
}: {
  children: ReactNode
  userId: string | null
  onboardingCompleted: boolean
  onOnboardingComplete: () => void
}) {
  const [activePageId, setActivePageId] = useState<PageId | null>(null)
  const [activeTour, setActiveTour] = useState<ActiveTour | null>(null)

  const finishTour = useCallback(
    async (completed: boolean) => {
      if (activeTour?.tour.id === 'setup' && userId && !onboardingCompleted) {
        await markOnboardingComplete(userId)
        onOnboardingComplete()
        if (completed) {
          await trackEvent('onboarding_complete', userId)
        }
      }
      if (completed && activeTour) {
        await trackEvent('tour_complete', userId ?? undefined, undefined, {
          tourId: activeTour.tour.id,
        })
      }
      setActiveTour(null)
    },
    [activeTour, userId, onboardingCompleted, onOnboardingComplete],
  )

  const startTour = useCallback((tour: PageTour, stepIndex = 0) => {
    setActiveTour({ tour, stepIndex })
    trackEvent('tour_start', userId ?? undefined, undefined, { tourId: tour.id })
  }, [userId])

  const startPageTour = useCallback(
    (pageId?: PageId) => {
      const id = pageId ?? activePageId
      if (!id) return
      const tour = getTourForPage(id)
      if (tour) startTour(tour)
    },
    [activePageId, startTour],
  )

  const startSetupTour = useCallback(() => {
    startTour(SETUP_TOUR)
  }, [startTour])

  const nextStep = useCallback(() => {
    setActiveTour((current) => {
      if (!current) return null
      if (current.stepIndex >= current.tour.steps.length - 1) {
        finishTour(true)
        return null
      }
      return { ...current, stepIndex: current.stepIndex + 1 }
    })
  }, [finishTour])

  const prevStep = useCallback(() => {
    setActiveTour((current) => {
      if (!current || current.stepIndex <= 0) return current
      return { ...current, stepIndex: current.stepIndex - 1 }
    })
  }, [])

  const skipTour = useCallback(() => {
    try {
      localStorage.setItem(TOUR_DISMISSED_KEY, '1')
    } catch {
      /* ignore */
    }
    finishTour(false)
  }, [finishTour])

  const completeTour = useCallback(() => {
    finishTour(true)
  }, [finishTour])

  const value = useMemo(
    () => ({
      activePageId,
      setActivePageId,
      activeTour,
      startTour,
      startPageTour,
      startSetupTour,
      nextStep,
      prevStep,
      skipTour,
      completeTour,
      isTourActive: activeTour !== null,
    }),
    [
      activePageId,
      activeTour,
      startTour,
      startPageTour,
      startSetupTour,
      nextStep,
      prevStep,
      skipTour,
      completeTour,
    ],
  )

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>
}

export function useTour() {
  const ctx = useContext(TourContext)
  if (!ctx) throw new Error('useTour must be used within TourProvider')
  return ctx
}

export function useTourOptional() {
  return useContext(TourContext)
}

export function wasTourDismissedLocally(): boolean {
  try {
    return localStorage.getItem(TOUR_DISMISSED_KEY) === '1'
  } catch {
    return false
  }
}
