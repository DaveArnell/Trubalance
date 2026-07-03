import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ReferenceDateProvider, useReferenceDate } from './contexts/ReferenceDateContext'
import { TablePreferencesProvider } from './contexts/TablePreferencesContext'
import { useAuth } from './contexts/AuthContext'
import { useWorkspace } from './contexts/WorkspaceContext'
import { buildPageWidgets } from './components/pageWidgets'
import { WidgetGrid } from './components/WidgetGrid'
import { useOverviewSize } from './hooks/useOverviewSize'
import { OverviewStrip } from './components/OverviewStrip'
import { AdminToolsDrawer } from './components/AdminToolsDrawer'
import { GuidedTour } from './components/GuidedTour'
import { SetupTourBanner, TourMenuButton } from './components/TourMenu'
import { GuidedSetupWizard } from './components/onboarding/GuidedSetupWizard'
import { TourProvider, useTour, wasTourDismissedLocally } from './contexts/TourContext'
import { wasSetupOnboardingDismissed } from './content/setupOnboarding'
import { markOnboardingComplete } from './services/adminRepository'
import { isStagingEnvironment } from './lib/appEnvironment'
import { useAppState, type UseAppStateOptions } from './hooks/useAppState'
import { Sidebar } from './components/Sidebar'
import {
  getPageMeta,
  navigateToRoute,
  parseRoute,
  type AppRoute,
  type PageId,
} from './navigation'
import type { GraphRange, ViewScope, AttentionItem } from './types'
import { calculateDashboard } from './utils/calculations'
import { buildBreakdownColumns } from './utils/breakdownTable'
import { summarizeReservePlanner } from './utils/reserveCalculations'
import { getScopeLabel } from './utils/scope'
import { ViewingScopeBar } from './components/ViewingScopeBar'
import { scopeThemeBusinessId, scopeThemeStyle } from './utils/businessTheme'
import { defaultViewScope } from './data/initialState'
import { formatSnapshotDateLong } from './utils/snapshots'
import { SubscriptionProvider } from './contexts/SubscriptionContext'
import { PostTrialNotice, TrialBanner, UpgradePrompt } from './components/UpgradePrompt'
import { MonthlyReserveCheckIn } from './components/MonthlyReserveCheckIn'
import { trackEvent } from './services/eventTracking'
import { showsDemoDataBanner } from './utils/localStateStorage'

export interface AppShellProps extends UseAppStateOptions {}

function useActiveRoute() {
  const [route, setRoute] = useState<AppRoute>(() => parseRoute(window.location.hash))

  useEffect(() => {
    const sync = () => setRoute(parseRoute(window.location.hash))
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [])

  return [route, setRoute] as const
}

function AppTourBridge({ activePage }: { activePage: PageId }) {
  const { setActivePageId } = useTour()

  useEffect(() => {
    setActivePageId(activePage)
  }, [activePage, setActivePageId])

  return null
}

function AppShellInner({
  workspaceId,
  externalState,
  externalStateVersion,
  externalLoading,
  onStateChange,
  remotePersist,
  readOnly,
}: AppShellProps) {
  const { user, profile, isAdmin, isImpersonating, impersonation, stopImpersonation, signOut, refreshProfile } = useAuth()
  const { workspaceId: ctxWorkspaceId, importedFromLocal } = useWorkspace()
  const app = useAppState({
    workspaceId: workspaceId ?? ctxWorkspaceId,
    externalState,
    externalStateVersion,
    externalLoading,
    onStateChange,
    remotePersist,
    readOnly,
  })
  const { isSimulated, simulatedDateKey, clearSimulatedDate, referenceDateKey } = useReferenceDate()
  const [activeRoute, setActiveRoute] = useActiveRoute()
  const [reserveMenuOpen, setReserveMenuOpen] = useState(false)
  const [openHelp, setOpenHelp] = useState<string | null>(null)
  const [graphRange, setGraphRange] = useState<GraphRange>('90d')
  const [trendsFocusScope, setTrendsFocusScope] = useState<ViewScope | null>(null)
  const [devToolsOpen, setDevToolsOpen] = useState(false)
  const { size: overviewSize, setOverviewSize } = useOverviewSize()

  const workspaceEmpty = app.state.groups.length === 0
  const onboardingCompleted = profile?.onboardingCompleted ?? false
  const shouldOfferSetup =
    workspaceEmpty && !onboardingCompleted && !wasSetupOnboardingDismissed()
  const [setupWizardOpen, setSetupWizardOpen] = useState(false)

  useEffect(() => {
    if (!shouldOfferSetup || wasTourDismissedLocally()) return
    const timer = window.setTimeout(() => setSetupWizardOpen(true), 700)
    return () => window.clearTimeout(timer)
  }, [shouldOfferSetup])

  const handleSetupComplete = async () => {
    setSetupWizardOpen(false)
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

  const metrics = useMemo(
    () => calculateDashboard(app.state, app.viewScope),
    [app.state, app.viewScope, referenceDateKey],
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

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
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
      if (isUndo && app.canUndo) app.undo()
      if (isRedo && app.canRedo) app.redo()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [app.canRedo, app.canUndo, app.redo, app.undo])

  const viewName = getScopeLabel(app.state, app.viewScope)

  const activeReserveSummary = useMemo(() => {
    if (!activeRoute.reservePlannerId || activeRoute.reservePlannerId === 'new') return null
    const planner = app.state.reservePlanners.find((p) => p.id === activeRoute.reservePlannerId)
    return planner ? summarizeReservePlanner(app.state, planner) : null
  }, [app.state, activeRoute.reservePlannerId])

  const pageMeta = useMemo(() => {
    const meta = getPageMeta(activePage)
    if (activePage === 'reserve-planner' && activeReserveSummary) {
      return { ...meta, kicker: activeReserveSummary.planner.name }
    }
    return meta
  }, [activePage, activeReserveSummary])

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
      if (planners.length === 1) {
        navigateToRoute('reserve-planner', planners[0].id)
        setActiveRoute({ page: 'reserve-planner', reservePlannerId: planners[0].id })
      } else if (activeRoute.reservePlannerId && !selectedExists) {
        navigateToRoute('reserve-planner')
        setActiveRoute({ page: 'reserve-planner', reservePlannerId: null })
      }
    }
  }, [activeRoute.page, activeRoute.reservePlannerId, app.state.reservePlanners])

  const handlePlannerCreated = (plannerId: string) => {
    goToRoute('reserve-planner', plannerId)
  }

  const goToRoute = (pageId: PageId, reservePlannerId?: string | null) => {
    setOpenHelp(null)
    if (pageId !== 'reserve-planner') {
      setReserveMenuOpen(false)
    }
    if (pageId === 'settings') {
      const firstGroup = app.state.groups[0]
      app.setViewScope(firstGroup ? { type: 'group', id: firstGroup.id } : defaultViewScope)
    }
    navigateToRoute(pageId, reservePlannerId)
    setActiveRoute({
      page: pageId,
      reservePlannerId: pageId === 'reserve-planner' ? (reservePlannerId ?? null) : null,
    })
  }

  useEffect(() => {
    const raw = window.location.hash.replace(/^#/, '').trim()
    if (raw === 'admin' || raw.startsWith('admin/')) {
      setDevToolsOpen(true)
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
    if (item.id === 'diary-due-soon') {
      app.dismissDiaryDueSoonAlerts(app.viewScope)
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
    if (item.targetSection === 'business-hub') {
      goToRoute('business-hub')
      scrollToWidget(item.widgetId ?? 'business-diary')
      return
    }
    const page = parseRoute(`#${item.targetSection}`).page
    if (page === 'reserve-planner') {
      const first = app.state.reservePlanners[0]
      goToRoute('reserve-planner', first?.id)
      scrollToWidget(item.widgetId ?? 'reserve-planner')
      return
    }
    goToRoute(page)
    scrollToWidget(item.widgetId ?? 'due')
  }

  const clearTrendsFocus = () => setTrendsFocusScope(null)

  const pageWidgets = useMemo(
    () =>
      buildPageWidgets(activePage, {
        state: app.state,
        viewScope: app.viewScope,
        metrics,
        breakdownColumns,
        graphRange,
        setGraphRange,
        viewName,
        onBalanceSave: (changes) =>
          app.saveBalanceUpdate(app.viewScope, viewName, changes, undefined, true),
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
      viewName,
      activeReserveSummary,
      activeRoute.reservePlannerId,
      openHelp,
      trendsFocusScope,
    ],
  )

  useEffect(() => {
    if (user?.id) {
      trackEvent('page_view', user.id, workspaceId ?? undefined, { page: activePage })
    }
  }, [activePage, user?.id, workspaceId])

  return (
    <SubscriptionProvider state={app.state}>
    <TourProvider
      userId={user?.id ?? null}
      onboardingCompleted={onboardingCompleted}
      onOnboardingComplete={refreshProfile}
    >
      <TablePreferencesProvider>
        <AppTourBridge activePage={activePage} />
        <GuidedTour />
        {setupWizardOpen && (
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
        <div
          className="app-shell"
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
        />

        <main className="main-content">
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
              <Link to="/platform-admin" className="btn-ghost btn-tiny">
                Back to admin
              </Link>
            </div>
          )}

          {importedFromLocal && !isImpersonating && (
            <div className="import-banner" role="status">
              <span>Your local data was imported to your account.</span>
            </div>
          )}

          {showsDemoDataBanner(app.state) && !isImpersonating && (
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

          <TrialBanner />
          <PostTrialNotice />
          <MonthlyReserveCheckIn
            state={app.state}
            viewScope={app.viewScope}
            onOpenReserve={(plannerId) => goToRoute('reserve-planner', plannerId)}
          />
          <SetupTourBanner
            visible={shouldOfferSetup && !setupWizardOpen}
            onStart={() => setSetupWizardOpen(true)}
          />
          {isSimulated && simulatedDateKey && (
            <div className="admin-date-banner" role="status">
              <span>
                Viewing as <strong>{formatSnapshotDateLong(simulatedDateKey)}</strong> (simulated)
              </span>
              <button type="button" className="btn-ghost btn-tiny" onClick={clearSimulatedDate}>
                Use real today
              </button>
              <button type="button" className="btn-ghost btn-tiny" onClick={() => setDevToolsOpen(true)}>
                Dev tools
              </button>
            </div>
          )}

          <div className="main-pinned">
            <header className="top-bar" data-tour="top-bar">
              <div className="top-bar-inner">
                <div className="top-bar-scope-block">
                  <p className="top-kicker">{pageMeta.label}</p>
                  <ViewingScopeBar state={app.state} viewScope={app.viewScope} variant="full" />
                </div>
                <div className="top-bar-actions">
                  <TourMenuButton onSetupGuide={() => setSetupWizardOpen(true)} />
                  <Link to="/" className="btn-ghost btn-tiny">
                    Home
                  </Link>
                  {user && (
                    <div className="top-bar-user">
                      {profile?.email && <span className="muted top-bar-email">{profile.email}</span>}
                      {isAdmin && !isImpersonating && (
                        <Link to="/platform-admin" className="btn-ghost btn-tiny">
                          Platform admin
                        </Link>
                      )}
                      <button type="button" className="btn-ghost btn-tiny" onClick={() => setDevToolsOpen(true)}>
                        Dev tools
                      </button>
                      <button type="button" className="btn-ghost btn-tiny" onClick={() => signOut()}>
                        Log out
                      </button>
                    </div>
                  )}
                  {!readOnly && (
                    <>
                      <button
                        type="button"
                        className="btn-secondary btn-tiny undo-btn"
                        onClick={app.undo}
                        title="Undo last change (Ctrl+Z)"
                        disabled={!app.canUndo}
                      >
                        ↩ Undo
                      </button>
                      <button
                        type="button"
                        className="btn-secondary btn-tiny undo-btn"
                        onClick={app.redo}
                        title="Redo last undone change (Ctrl+Shift+Z)"
                        disabled={!app.canRedo}
                      >
                        ↪ Redo
                      </button>
                    </>
                  )}
                </div>
              </div>
            </header>

            <OverviewStrip
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
              onBalanceSave={(changes) =>
                app.saveBalanceUpdate(app.viewScope, viewName, changes, undefined, true)
              }
            />
          </div>

          <div className="page-body">
            <WidgetGrid pageId={activePage} widgets={pageWidgets} />
          </div>
        </main>

        <AdminToolsDrawer open={devToolsOpen} onClose={() => setDevToolsOpen(false)} />
        </div>
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
