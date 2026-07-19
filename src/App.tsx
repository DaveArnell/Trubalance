import { useEffect, useLayoutEffect, useMemo, useState, useCallback, useRef, type ComponentProps, type MutableRefObject } from 'react'
import { Link } from 'react-router-dom'
import { ReferenceDateProvider, useReferenceDate } from './contexts/ReferenceDateContext'
import { TablePreferencesProvider } from './contexts/TablePreferencesContext'
import { DashboardViewPreferencesProvider } from './contexts/DashboardViewPreferencesContext'
import { useAuth } from './contexts/AuthContext'
import { useWorkspace } from './contexts/WorkspaceContext'
import { buildPageWidgets } from './components/pageWidgets'
import { WidgetGrid } from './components/WidgetGrid'
import { useOverviewSize } from './hooks/useOverviewSize'
import { OverviewStrip } from './components/OverviewStrip'
import { MobileOverview } from './components/mobile/MobileOverview'
import { MobileBottomNav } from './components/mobile/MobileBottomNav'
import {
  MobileHomeSectionTabs,
  type MobileHomeSection,
} from './components/mobile/MobileHomeSectionTabs'
import { GuidedTour } from './components/GuidedTour'
import { SetupTourBanner, TourMenuButton } from './components/TourMenu'
import { GuidedSetupWizard } from './components/onboarding/GuidedSetupWizard'
import { TourProvider, useTour, wasTourDismissedLocally } from './contexts/TourContext'
import { wasSetupOnboardingDismissed } from './content/setupOnboarding'
import { markOnboardingComplete } from './services/adminRepository'
import { isStagingEnvironment } from './lib/appEnvironment'
import { useAppState, type UseAppStateOptions } from './hooks/useAppState'
import { Sidebar } from './components/Sidebar'
import { useMobileNav } from './hooks/useMobileNav'
import {
  getPageMeta,
  navigateToRoute,
  parseRoute,
  type AppRoute,
  type PageId,
} from './navigation'
import type { GraphRange, ViewScope, AttentionItem } from './types'
import type { WorkspaceSubscription } from './types/subscription'
import { calculateDashboard } from './utils/calculations'
import { countDueRowsNeedingAttention } from './utils/commitmentCalculations'
import { buildBreakdownColumns } from './utils/breakdownTable'
import { getPlannerDisplayName, summarizeReservePlanner, getReservePlannerIdForScope } from './utils/reserveCalculations'
import { getScopeLabel, hasMultipleViewScopes } from './utils/scope'
import { usePageMeta } from './hooks/usePageMeta'
import { ViewingScopeBar } from './components/ViewingScopeBar'
import { ViewingScopePicker } from './components/ViewingScopePicker'
import { scopeThemeBusinessId, scopeThemeStyle } from './utils/businessTheme'
import { defaultViewScope as initialDefaultViewScope } from './data/initialState'
import { formatSnapshotDateLong } from './utils/snapshots'
import { SubscriptionProvider, useSubscription } from './contexts/SubscriptionContext'
import { PostTrialNotice, ReadOnlyLockBanner, TrialBanner, TrialWarningModal, UpgradePrompt } from './components/UpgradePrompt'
import { MonthlyReserveCheckIn } from './components/MonthlyReserveCheckIn'
import { trackEvent } from './services/eventTracking'
import { showsDemoDataBanner } from './utils/localStateStorage'
import { useDemoMode } from './contexts/DemoModeContext'
import { useEditReadOnly } from './hooks/useEditReadOnly'

const TREND_FROM_DATE_KEY = 'trubalance-trends-from-date'

function loadTrendFromDate(): string | null {
  try {
    const raw = localStorage.getItem(TREND_FROM_DATE_KEY)
    if (raw && /^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw
  } catch {
    /* ignore */
  }
  return null
}

function saveTrendFromDate(date: string | null) {
  try {
    if (date) localStorage.setItem(TREND_FROM_DATE_KEY, date)
    else localStorage.removeItem(TREND_FROM_DATE_KEY)
  } catch {
    /* ignore */
  }
}

export interface AppShellProps extends UseAppStateOptions {
  isInteractiveDemo?: boolean
  remoteSubscription?: WorkspaceSubscription | null
}

function useActiveRoute() {
  const [route, setRoute] = useState<AppRoute>(() => parseRoute(window.location.hash))

  useEffect(() => {
    const sync = () => setRoute(parseRoute(window.location.hash))
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [])

  return [route, setRoute] as const
}

function AppTourBridge({
  activePage,
  onNavigate,
}: {
  activePage: PageId
  onNavigate: (pageId: PageId, reservePlannerId?: string | null) => void
}) {
  const { setActivePageId, activeTour } = useTour()
  const step = activeTour?.tour.steps[activeTour.stepIndex]

  useEffect(() => {
    setActivePageId(activePage)
  }, [activePage, setActivePageId])

  useEffect(() => {
    if (!step?.page || step.page === activePage) return
    onNavigate(step.page)
  }, [step?.id, step?.page, activePage, onNavigate])

  return null
}

function PendingSetupTourStarter({
  pending,
  onStarted,
}: {
  pending: boolean
  onStarted: () => void
}) {
  const { startSetupTour } = useTour()

  useEffect(() => {
    if (!pending) return
    const timer = window.setTimeout(() => {
      startSetupTour()
      onStarted()
    }, 400)
    return () => window.clearTimeout(timer)
  }, [pending, startSetupTour, onStarted])

  return null
}

function SubscriptionReadOnlyBridge({ readOnlyRef }: { readOnlyRef: MutableRefObject<boolean> }) {
  const { subscriptionReadOnly } = useSubscription()
  readOnlyRef.current = subscriptionReadOnly
  return null
}

function UndoKeyboardShortcuts({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}: {
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
}) {
  const editReadOnly = useEditReadOnly()

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (editReadOnly) return
      if (!(e.ctrlKey || e.metaKey)) return
      const target = e.target
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        (target instanceof HTMLElement && target.isContentEditable)
      ) {
        return
      }
      const key = e.key.toLowerCase()
      const isUndo = key === 'z' && !e.shiftKey
      const isRedo = (key === 'z' && e.shiftKey) || key === 'y'
      if (!isUndo && !isRedo) return

      e.preventDefault()
      if (isUndo && canUndo) onUndo()
      if (isRedo && canRedo) onRedo()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [canRedo, canUndo, editReadOnly, onRedo, onUndo])

  return null
}

function UndoRedoButtons({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}: {
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
}) {
  const editReadOnly = useEditReadOnly()
  if (editReadOnly) return null

  return (
    <>
      <button
        type="button"
        className="btn-secondary btn-tiny undo-btn"
        onClick={onUndo}
        title="Undo last change (Ctrl+Z)"
        disabled={!canUndo}
      >
        ↩ Undo
      </button>
      <button
        type="button"
        className="btn-secondary btn-tiny undo-btn"
        onClick={onRedo}
        title="Redo last undone change (Ctrl+Shift+Z)"
        disabled={!canRedo}
      >
        ↪ Redo
      </button>
    </>
  )
}

function OverviewStripEditable(props: ComponentProps<typeof OverviewStrip>) {
  const editReadOnly = useEditReadOnly()
  const { onBalanceSave, ...rest } = props
  return (
    <OverviewStrip
      {...rest}
      readOnly={editReadOnly}
      onBalanceSave={editReadOnly ? undefined : onBalanceSave}
    />
  )
}

function AppShellInner({
  workspaceId,
  externalState,
  externalStateVersion,
  externalLoading,
  onStateChange,
  remotePersist,
  skipLocalPersist,
  defaultViewScope,
  readOnly,
  isInteractiveDemo,
  remoteSubscription,
}: AppShellProps) {
  const demoMode = useDemoMode()
  const demoReadOnly = demoMode != null && !demoMode.canEditDemo
  const subscriptionReadOnlyRef = useRef(false)
  const isDemoSession = isInteractiveDemo || demoMode != null
  const { user, profile, isImpersonating, impersonation, stopImpersonation, refreshProfile } = useAuth()
  const { workspaceId: ctxWorkspaceId, importedFromLocal } = useWorkspace()
  const app = useAppState({
    workspaceId: isDemoSession ? null : (workspaceId ?? ctxWorkspaceId),
    externalState,
    externalStateVersion,
    externalLoading,
    onStateChange,
    remotePersist,
    skipLocalPersist,
    defaultViewScope,
    readOnly: (readOnly ?? false) || demoReadOnly,
    readOnlyRef: subscriptionReadOnlyRef,
  })
  const { isSimulated, simulatedDateKey, clearSimulatedDate, referenceDateKey } = useReferenceDate()
  const [activeRoute, setActiveRoute] = useActiveRoute()
  const [reserveMenuOpen, setReserveMenuOpen] = useState(false)
  const { isMobile, mobileNavOpen, closeMobileNav, toggleMobileNav } = useMobileNav()
  const mobileChromeRef = useRef<HTMLDivElement>(null)
  const [homeSection, setHomeSection] = useState<MobileHomeSection>('committed-funds')

  useLayoutEffect(() => {
    if (!isMobile) return
    const chrome = mobileChromeRef.current
    const main = chrome?.closest('.main-content--mobile') as HTMLElement | null
    if (!chrome || !main) return

    const syncChromeHeight = () => {
      main.style.setProperty('--mobile-chrome-height', `${Math.ceil(chrome.getBoundingClientRect().height)}px`)
    }
    syncChromeHeight()
    const observer = new ResizeObserver(syncChromeHeight)
    observer.observe(chrome)
    return () => {
      observer.disconnect()
      main.style.removeProperty('--mobile-chrome-height')
    }
  }, [isMobile, homeSection, activeRoute.page])

  useEffect(() => {
    if (!isMobile) return
    document.querySelector('.mobile-page-scroll')?.scrollTo({ top: 0 })
  }, [isMobile, homeSection, activeRoute.page])

  const [openHelp, setOpenHelp] = useState<string | null>(null)
  const [graphRange, setGraphRangeState] = useState<GraphRange>('90d')
  const [trendFromDate, setTrendFromDateState] = useState<string | null>(loadTrendFromDate)
  const trendsUndoRef = useRef<Array<{ graphRange: GraphRange; trendFromDate: string | null }>>([])
  const trendsRedoRef = useRef<Array<{ graphRange: GraphRange; trendFromDate: string | null }>>([])
  const [trendsHistoryTick, setTrendsHistoryTick] = useState(0)

  const pushTrendsHistory = useCallback(() => {
    trendsUndoRef.current = [
      ...trendsUndoRef.current.slice(-29),
      { graphRange, trendFromDate },
    ]
    trendsRedoRef.current = []
    setTrendsHistoryTick((n) => n + 1)
  }, [graphRange, trendFromDate])

  const setGraphRange = useCallback(
    (range: GraphRange) => {
      if (range === graphRange) return
      pushTrendsHistory()
      setGraphRangeState(range)
    },
    [graphRange, pushTrendsHistory],
  )

  const setTrendFromDate = useCallback(
    (date: string | null) => {
      if (date === trendFromDate) return
      pushTrendsHistory()
      setTrendFromDateState(date)
      saveTrendFromDate(date)
    },
    [trendFromDate, pushTrendsHistory],
  )

  const undoTrendsView = useCallback(() => {
    const stack = trendsUndoRef.current
    if (stack.length === 0) return false
    const previous = stack[stack.length - 1]!
    trendsUndoRef.current = stack.slice(0, -1)
    trendsRedoRef.current = [
      ...trendsRedoRef.current.slice(-29),
      { graphRange, trendFromDate },
    ]
    setGraphRangeState(previous.graphRange)
    setTrendFromDateState(previous.trendFromDate)
    saveTrendFromDate(previous.trendFromDate)
    setTrendsHistoryTick((n) => n + 1)
    return true
  }, [graphRange, trendFromDate])

  const redoTrendsView = useCallback(() => {
    const stack = trendsRedoRef.current
    if (stack.length === 0) return false
    const next = stack[stack.length - 1]!
    trendsRedoRef.current = stack.slice(0, -1)
    trendsUndoRef.current = [
      ...trendsUndoRef.current.slice(-29),
      { graphRange, trendFromDate },
    ]
    setGraphRangeState(next.graphRange)
    setTrendFromDateState(next.trendFromDate)
    saveTrendFromDate(next.trendFromDate)
    setTrendsHistoryTick((n) => n + 1)
    return true
  }, [graphRange, trendFromDate])

  const handleUndo = useCallback(() => {
    if (activeRoute.page === 'trends' && undoTrendsView()) return
    app.undo()
  }, [activeRoute.page, undoTrendsView, app])

  const handleRedo = useCallback(() => {
    if (activeRoute.page === 'trends' && redoTrendsView()) return
    app.redo()
  }, [activeRoute.page, redoTrendsView, app])

  const canUndo = (activeRoute.page === 'trends' && trendsUndoRef.current.length > 0) || app.canUndo
  const canRedo = (activeRoute.page === 'trends' && trendsRedoRef.current.length > 0) || app.canRedo
  void trendsHistoryTick
  const [trendsFocusScope, setTrendsFocusScope] = useState<ViewScope | null>(null)
  const { size: overviewSize, setOverviewSize } = useOverviewSize()

  const workspaceEmpty = app.state.groups.length === 0 && app.state.businesses.length === 0
  const onboardingCompleted = profile?.onboardingCompleted ?? false
  const shouldOfferSetup =
    !isDemoSession && workspaceEmpty && !onboardingCompleted && !wasSetupOnboardingDismissed()
  const [setupWizardOpen, setSetupWizardOpen] = useState(false)

  useEffect(() => {
    if (!shouldOfferSetup || wasTourDismissedLocally()) return
    const timer = window.setTimeout(() => setSetupWizardOpen(true), 700)
    return () => window.clearTimeout(timer)
  }, [shouldOfferSetup])

  useEffect(() => {
    if (!setupWizardOpen || !user?.id) return
    void trackEvent('setup_started', user.id)
  }, [setupWizardOpen, user?.id])

  const [pendingSetupTour, setPendingSetupTour] = useState(false)

  const handleSetupComplete = async () => {
    setSetupWizardOpen(false)
    goToRoute('committed-funds')
    setPendingSetupTour(true)
    if (user?.id && !onboardingCompleted) {
      await markOnboardingComplete(user.id)
      await refreshProfile()
      await trackEvent('onboarding_complete', user.id)
    }
  }

  const handleSetupDismiss = () => {
    setSetupWizardOpen(false)
  }

  const activePage = activeRoute.page

  const metrics = useMemo(() => {
    const base = calculateDashboard(app.state, app.viewScope)
    if (!isDemoSession) return base
    return {
      ...base,
      attentionItems: [],
    }
  }, [app.state, app.viewScope, referenceDateKey, isDemoSession])

  const dueAttentionCount = useMemo(
    () => countDueRowsNeedingAttention(metrics.commitmentViews).length,
    [metrics.commitmentViews],
  )

  const breakdownColumns = useMemo(
    () => buildBreakdownColumns(app.state, app.viewScope),
    [app.state, app.viewScope, referenceDateKey],
  )

  const scopeTheme = useMemo(
    () => scopeThemeStyle(app.state, app.viewScope),
    [app.state, app.viewScope],
  )
  const scopeBusinessId = useMemo(
    () => scopeThemeBusinessId(app.state, app.viewScope),
    [app.state, app.viewScope],
  )
  const showScopePicker = useMemo(
    () => hasMultipleViewScopes(app.state),
    [app.state],
  )

  const viewName = getScopeLabel(app.state, app.viewScope)

  const activeReserveSummary = useMemo(() => {
    if (!activeRoute.reservePlannerId || activeRoute.reservePlannerId === 'new') return null
    const planner = app.state.reservePlanners.find((p) => p.id === activeRoute.reservePlannerId)
    return planner ? summarizeReservePlanner(app.state, planner) : null
  }, [app.state, activeRoute.reservePlannerId])

  const pageMeta = useMemo(() => {
    const meta = getPageMeta(activePage)
    if (activePage === 'reserve-planner' && activeReserveSummary) {
      return { ...meta, kicker: getPlannerDisplayName(app.state, activeReserveSummary.planner) }
    }
    return meta
  }, [activePage, activeReserveSummary, app.state])

  const documentTitle = useMemo(() => {
    if (activePage === 'reserve-planner' && activeReserveSummary) {
      return `${pageMeta.label} — ${getPlannerDisplayName(app.state, activeReserveSummary.planner)}`
    }
    if (isDemoSession && demoMode?.scenario) {
      return `${pageMeta.label} — ${demoMode.scenario.title} (Demo)`
    }
    return pageMeta.label
  }, [
    activePage,
    activeReserveSummary,
    demoMode?.scenario,
    isDemoSession,
    pageMeta.label,
    app.state,
  ])

  usePageMeta({
    title: documentTitle,
    description: `${pageMeta.label} in True Balance — cash clarity for UK business owners.`,
    path: '/app',
    noindex: true,
  })

  useEffect(() => {
    if (activeRoute.page !== 'reserve-planner') return
    const planners = app.state.reservePlanners
    if (planners.length === 0) {
      if (activeRoute.reservePlannerId) {
        navigateToRoute('reserve-planner')
        setActiveRoute({ page: 'reserve-planner', reservePlannerId: null })
      }
      return
    }

    const selectedExists = activeRoute.reservePlannerId
      ? planners.some((p) => p.id === activeRoute.reservePlannerId)
      : false

    if (activeRoute.reservePlannerId === 'new') return

    if (!activeRoute.reservePlannerId || !selectedExists) {
      const scopedId = getReservePlannerIdForScope(app.state, app.viewScope)
      if (scopedId) {
        navigateToRoute('reserve-planner', scopedId)
        setActiveRoute({ page: 'reserve-planner', reservePlannerId: scopedId })
      } else if (planners.length === 1) {
        navigateToRoute('reserve-planner', planners[0].id)
        setActiveRoute({ page: 'reserve-planner', reservePlannerId: planners[0].id })
      } else if (activeRoute.reservePlannerId && !selectedExists) {
        navigateToRoute('reserve-planner')
        setActiveRoute({ page: 'reserve-planner', reservePlannerId: null })
      }
    }
  }, [activeRoute.page, activeRoute.reservePlannerId, app.state.reservePlanners, app.viewScope])

  useEffect(() => {
    if (activeRoute.page !== 'reserve-planner') return
    const scopedId = getReservePlannerIdForScope(app.state, app.viewScope)
    if (!scopedId || scopedId === activeRoute.reservePlannerId) return
    navigateToRoute('reserve-planner', scopedId)
    setActiveRoute({ page: 'reserve-planner', reservePlannerId: scopedId })
  }, [app.viewScope, activeRoute.page, app.state.reservePlanners, activeRoute.reservePlannerId])

  const handlePlannerCreated = (plannerId: string) => {
    goToRoute('reserve-planner', plannerId)
  }

  const goToRoute = (pageId: PageId, reservePlannerId?: string | null) => {
    setOpenHelp(null)
    if (pageId !== 'reserve-planner') {
      setReserveMenuOpen(false)
    }

    // On mobile, Due and Receipts live as Home section tabs.
    if (isMobile && (pageId === 'due' || pageId === 'receipts')) {
      setHomeSection(pageId === 'due' ? 'due' : 'expected-receipts')
      pageId = 'committed-funds'
    }

    if (pageId === 'settings') {
      const firstGroup = app.state.groups[0]
      if (firstGroup) {
        app.setViewScope({ type: 'group', id: firstGroup.id })
      } else {
        app.setViewScope(initialDefaultViewScope)
      }
    }
    let resolvedReserveId = reservePlannerId
    if (
      pageId === 'reserve-planner' &&
      (resolvedReserveId === undefined || resolvedReserveId === null)
    ) {
      const scopedId = getReservePlannerIdForScope(app.state, app.viewScope)
      if (scopedId) resolvedReserveId = scopedId
    }
    if (
      pageId === 'reserve-planner' &&
      resolvedReserveId &&
      resolvedReserveId !== 'new'
    ) {
      const planner = app.state.reservePlanners.find((p) => p.id === resolvedReserveId)
      if (planner) {
        app.setViewScope({ type: 'business', id: planner.businessId })
      }
    }
    navigateToRoute(pageId, resolvedReserveId)
    setActiveRoute({
      page: pageId,
      reservePlannerId: pageId === 'reserve-planner' ? (resolvedReserveId ?? null) : null,
    })
  }

  // Deep links / hash to Due or Receipts → Home tab on mobile
  useEffect(() => {
    if (!isMobile) return
    if (activeRoute.page === 'due') {
      setHomeSection('due')
      navigateToRoute('committed-funds')
      setActiveRoute({ page: 'committed-funds', reservePlannerId: null })
    } else if (activeRoute.page === 'receipts') {
      setHomeSection('expected-receipts')
      navigateToRoute('committed-funds')
      setActiveRoute({ page: 'committed-funds', reservePlannerId: null })
    }
  }, [isMobile, activeRoute.page])

  useEffect(() => {
    const raw = window.location.hash.replace(/^#/, '').trim()
    if (raw === 'admin' || raw.startsWith('admin/')) {
      navigateToRoute('committed-funds')
      setActiveRoute({ page: 'committed-funds', reservePlannerId: null })
    }
  }, [])

  const handleReservePlannerDeleted = (deletedId: string) => {
    const remaining = app.state.reservePlanners.filter((p) => p.id !== deletedId)
    if (remaining.length > 0) {
      goToRoute('reserve-planner', remaining[0].id)
    } else {
      goToRoute('reserve-planner')
    }
  }

  const scrollToWidget = (widgetId: string) => {
    window.setTimeout(() => {
      const el = document.querySelector(`[data-widget-id="${widgetId}"]`)
      el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }, 80)
  }

  const handleDismissNotification = (item: AttentionItem) => {
    if (item.id === 'due-overdue') {
      app.acknowledgeDueAlertBucket('overdue', app.viewScope)
      return
    }
    if (item.id === 'due-soon') {
      app.acknowledgeDueAlertBucket('due-soon', app.viewScope)
      return
    }
    handleNotificationClick(item)
  }

  const handleNotificationClick = (item: AttentionItem) => {
    if (item.id === 'balances-stale') {
      goToRoute('committed-funds')
      window.setTimeout(() => {
        document.querySelector('[data-tour="overview-balances"]')?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        })
      }, 80)
      return
    }
    if (item.id === 'reserve-monthly-checkin') {
      const first = app.state.reservePlanners[0]
      goToRoute('reserve-planner', first?.id)
      scrollToWidget('reserve-planner')
      return
    }
    if (item.targetSection === 'reserve-planner') {
      const first = app.state.reservePlanners[0]
      goToRoute('reserve-planner', first?.id)
      scrollToWidget(item.widgetId ?? 'reserve-planner')
      return
    }
    const page = parseRoute(`#${item.targetSection}`).page
    goToRoute(page)
    scrollToWidget(item.widgetId ?? 'due')
  }

  const clearTrendsFocus = () => setTrendsFocusScope(null)

  const handleBalanceSave = useCallback(
    (changes: Parameters<typeof app.saveBalanceUpdate>[2]) => {
      const result = app.saveBalanceUpdate(app.viewScope, viewName, changes, undefined, true)
      if (!isDemoSession && user?.id && result.snapshotted) {
        void trackEvent('balance_update', user.id, workspaceId ?? ctxWorkspaceId ?? undefined, {
          accounts: result.updated,
        })
      }
      return result
    },
    [app, viewName, isDemoSession, user?.id, workspaceId, ctxWorkspaceId],
  )

  const pageWidgets = useMemo(
    () =>
      buildPageWidgets(activePage, {
        state: app.state,
        viewScope: app.viewScope,
        metrics,
        breakdownColumns,
        graphRange,
        setGraphRange,
        trendFromDate,
        setTrendFromDate,
        viewName,
        onBalanceSave: handleBalanceSave,
        activeReserveSummary,
        reserveRouteId: activeRoute.reservePlannerId,
        actions: app,
        openHelp,
        setOpenHelp,
        onPlannerDeleted: handleReservePlannerDeleted,
        onPlannerCreated: handlePlannerCreated,
        onOpenReservePlanner: (plannerId) => goToRoute('reserve-planner', plannerId),
        trendsFocusScope,
        onTrendsFocusApplied: clearTrendsFocus,
      }),
    [
      activePage,
      app,
      metrics,
      breakdownColumns,
      graphRange,
      trendFromDate,
      setTrendFromDate,
      viewName,
      handleBalanceSave,
      activeReserveSummary,
      activeRoute.reservePlannerId,
      openHelp,
      trendsFocusScope,
    ],
  )

  useEffect(() => {
    if (isDemoSession || !user?.id) return
    trackEvent('page_view', user.id, workspaceId ?? undefined, { page: activePage })
  }, [activePage, user?.id, workspaceId, isDemoSession])

  return (
    <SubscriptionProvider state={app.state} remoteSubscription={remoteSubscription}>
    <TourProvider
      userId={user?.id ?? null}
      onboardingCompleted={onboardingCompleted}
      onOnboardingComplete={refreshProfile}
    >
      <TablePreferencesProvider>
      <DashboardViewPreferencesProvider>
        <SubscriptionReadOnlyBridge readOnlyRef={subscriptionReadOnlyRef} />
        <UndoKeyboardShortcuts
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={handleUndo}
          onRedo={handleRedo}
        />
        <AppTourBridge activePage={activePage} onNavigate={goToRoute} />
        <PendingSetupTourStarter
          pending={pendingSetupTour}
          onStarted={() => setPendingSetupTour(false)}
        />
        <GuidedTour />
        {setupWizardOpen && !isDemoSession && (
          <GuidedSetupWizard
            state={app.state}
            viewScope={app.viewScope}
            metrics={metrics}
            actions={app}
            onNavigate={goToRoute}
            onComplete={handleSetupComplete}
            onDismiss={handleSetupDismiss}
          />
        )}
        <UpgradePrompt />
        <TrialWarningModal />
        <div
          className={`app-shell${isMobile ? ' app-shell--mobile' : ''}`}
          style={scopeTheme}
          data-scope-level={app.viewScope.type}
          data-scope-business={scopeBusinessId ?? undefined}
        >
        <Sidebar
          state={app.state}
          viewScope={app.viewScope}
          onSelectScope={app.setViewScope}
          activeRoute={activeRoute}
          activePage={activePage}
          reserveMenuOpen={reserveMenuOpen}
          setReserveMenuOpen={setReserveMenuOpen}
          onNavigate={goToRoute}
          isMobile={isMobile}
          mobileOpen={mobileNavOpen}
          onMobileClose={closeMobileNav}
          onSetupGuide={() => setSetupWizardOpen(true)}
        />

        {isMobile && mobileNavOpen && (
          <button
            type="button"
            className="mobile-nav-backdrop"
            onClick={closeMobileNav}
            aria-label="Close menu"
          />
        )}

        <main className={`main-content${isMobile ? ' main-content--mobile' : ''}`}>
          {isStagingEnvironment() && (
            <div className="staging-env-banner" role="status">
              <strong>Staging</strong>
              <span>
                Test environment — use a separate account from production. Data is not your live
                workspace.
              </span>
            </div>
          )}
          {isImpersonating && impersonation && (
            <div className="impersonation-banner" role="status">
              <span>
                Viewing as <strong>{impersonation.fullName || impersonation.email}</strong> (read-only)
              </span>
              <button type="button" className="btn-ghost btn-tiny" onClick={stopImpersonation}>
                Exit view
              </button>
              <Link to="/vocatio-admin" className="btn-ghost btn-tiny">
                Back to admin
              </Link>
            </div>
          )}

          {importedFromLocal && !isImpersonating && (
            <div className="import-banner" role="status">
              <span>Your local data was imported to your account.</span>
            </div>
          )}

          {showsDemoDataBanner(app.state) && !isImpersonating && !isDemoSession && (
            <div className="demo-data-banner" role="status">
              <span>
                You are viewing <strong>demo data</strong>, not your real figures. You can still explore
                the app, or restore your own workspace from a backup file.
              </span>
              <button
                type="button"
                className="btn-primary btn-tiny"
                onClick={() => {
                  try {
                    sessionStorage.setItem('trubalance-settings-section', 'data')
                  } catch {
                    /* ignore */
                  }
                  goToRoute('settings')
                }}
              >
                Restore my data
              </button>
            </div>
          )}

          {!isDemoSession && <TrialBanner />}
          {!isDemoSession && <ReadOnlyLockBanner />}
          {!isDemoSession && <PostTrialNotice />}
          {!isDemoSession && activePage !== 'reserve-planner' && !isMobile && (
            <MonthlyReserveCheckIn
              state={app.state}
              viewScope={app.viewScope}
              onOpenReserve={(plannerId) => goToRoute('reserve-planner', plannerId)}
            />
          )}
          {!isDemoSession && (
            <SetupTourBanner
              visible={shouldOfferSetup && !setupWizardOpen}
              onStart={() => setSetupWizardOpen(true)}
            />
          )}
          {!isDemoSession && isSimulated && simulatedDateKey && (
            <div className="admin-date-banner" role="status">
              <span>
                Viewing as <strong>{formatSnapshotDateLong(simulatedDateKey)}</strong> (simulated)
              </span>
              <button type="button" className="btn-ghost btn-tiny" onClick={clearSimulatedDate}>
                Use real today
              </button>
            </div>
          )}

          {isMobile ? (
            <>
              <div className="mobile-sticky-chrome" ref={mobileChromeRef}>
                <header className="top-bar top-bar--mobile" data-tour="top-bar">
                  <div className="top-bar-inner">
                    <button
                      type="button"
                      className="mobile-menu-btn"
                      onClick={toggleMobileNav}
                      aria-label={mobileNavOpen ? 'Close menu' : 'Open menu'}
                      aria-expanded={mobileNavOpen}
                    >
                      <span className="mobile-menu-btn-icon" aria-hidden="true" />
                    </button>
                    <div className="top-bar-scope-block">
                      {showScopePicker ? (
                        <ViewingScopePicker
                          state={app.state}
                          viewScope={app.viewScope}
                          onSelect={app.setViewScope}
                        />
                      ) : (
                        <ViewingScopeBar state={app.state} viewScope={app.viewScope} variant="full" />
                      )}
                    </div>
                    <div className="mobile-top-undo">
                      <UndoRedoButtons
                        canUndo={canUndo}
                        canRedo={canRedo}
                        onUndo={handleUndo}
                        onRedo={handleRedo}
                      />
                    </div>
                  </div>
                </header>

                <MobileOverview
                  metrics={metrics}
                  state={app.state}
                  viewScope={app.viewScope}
                  breakdownColumns={breakdownColumns}
                  onBalanceSave={handleBalanceSave}
                />

                {activePage === 'committed-funds' ? (
                  <MobileHomeSectionTabs
                    active={homeSection}
                    onChange={setHomeSection}
                    dueBadgeCount={dueAttentionCount}
                  />
                ) : null}
              </div>

              <div className="mobile-page-scroll">
                <WidgetGrid
                  pageId={activePage}
                  widgets={pageWidgets}
                  homeSection={homeSection}
                />
              </div>

              <MobileBottomNav
                activePage={activePage}
                onNavigate={(pageId) => goToRoute(pageId)}
                dueBadgeCount={dueAttentionCount}
              />
            </>
          ) : (
            <>
              <div className="main-pinned">
                <header className="top-bar" data-tour="top-bar">
                  <div className="top-bar-inner">
                    <div className="top-bar-scope-block">
                      <p className="top-kicker">{pageMeta.label}</p>
                      {showScopePicker ? (
                        <ViewingScopePicker
                          state={app.state}
                          viewScope={app.viewScope}
                          onSelect={app.setViewScope}
                        />
                      ) : (
                        <ViewingScopeBar state={app.state} viewScope={app.viewScope} variant="full" />
                      )}
                    </div>
                    <div className="top-bar-actions">
                      <TourMenuButton onSetupGuide={() => setSetupWizardOpen(true)} />
                      {isDemoSession ? (
                        <>
                          <Link to="/" className="btn-ghost btn-tiny top-bar-home-link">
                            Home
                          </Link>
                          <Link to="/see-how-it-works" className="btn-ghost btn-tiny top-bar-home-link">
                            All demos
                          </Link>
                        </>
                      ) : (
                        <Link to="/" className="btn-ghost btn-tiny top-bar-home-link">
                          Home
                        </Link>
                      )}
                      {isDemoSession && !user && (
                        <Link to="/signup" className="btn-primary btn-tiny">
                          Start free trial
                        </Link>
                      )}
                      <UndoRedoButtons
                        canUndo={canUndo}
                        canRedo={canRedo}
                        onUndo={handleUndo}
                        onRedo={handleRedo}
                      />
                    </div>
                  </div>
                </header>

                <OverviewStripEditable
                  metrics={metrics}
                  attentionItems={metrics.attentionItems}
                  onNotificationClick={handleNotificationClick}
                  onDismissNotification={handleDismissNotification}
                  openHelp={openHelp}
                  setOpenHelp={setOpenHelp}
                  state={app.state}
                  viewScope={app.viewScope}
                  breakdownColumns={breakdownColumns}
                  size={overviewSize}
                  onSizeChange={setOverviewSize}
                  onBalanceSave={handleBalanceSave}
                />
              </div>

              <div className="page-body">
                <WidgetGrid pageId={activePage} widgets={pageWidgets} />
              </div>
            </>
          )}
        </main>
        </div>
      </DashboardViewPreferencesProvider>
      </TablePreferencesProvider>
    </TourProvider>
    </SubscriptionProvider>
  )
}

export function AppShell(props: AppShellProps) {
  return <AppShellInner {...props} />
}

/** Local-only shell without auth (dev / no Supabase). */
function LocalApp() {
  return (
    <ReferenceDateProvider>
      <AppShell />
    </ReferenceDateProvider>
  )
}

export default LocalApp
