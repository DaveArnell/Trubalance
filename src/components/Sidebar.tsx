import { useEffect, useRef, useState, type DragEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useDemoMode } from '../contexts/DemoModeContext'
import { useEditReadOnly } from '../hooks/useEditReadOnly'
import type { AppState, ViewScope } from '../types'
import type { AppRoute, PageId } from '../navigation'
import {
  buildHash,
  DESKTOP_SIDEBAR_HIDDEN_PAGES,
  RESERVE_PLANNER_CREATE_ROUTE,
} from '../navigation'
import { useNavLayout } from '../hooks/useNavLayout'
import { getOrderedPages } from '../utils/navLayout'
import { getPlannerDisplayName, getReservePlannerIdForScope } from '../utils/reserveCalculations'
import { ScopeFreshnessLegend, SidebarScopeTree } from './SidebarScopeTree'
import { MobileTourLinks } from './TourMenu'
import { useSubscription } from '../contexts/SubscriptionContext'
import { useAuth } from '../contexts/AuthContext'
import { useSidebarCollapsed } from '../hooks/useSidebarCollapsed'
import { DashboardViewStyleToggle } from './DashboardViewStyleToggle'

interface SidebarProps {
  state: AppState
  viewScope: ViewScope
  onSelectScope: (scope: ViewScope) => void
  activeRoute: AppRoute
  activePage: PageId
  reserveMenuOpen: boolean
  setReserveMenuOpen: (open: boolean | ((value: boolean) => boolean)) => void
  onNavigate: (pageId: PageId, reservePlannerId?: string | null) => void
  isMobile?: boolean
  mobileOpen?: boolean
  onMobileClose?: () => void
  onSetupGuide?: () => void
}

function startDrag(e: DragEvent, key: string, onDragStart: () => void) {
  e.stopPropagation()
  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.setData('text/plain', key)
  onDragStart()
}

function NavDragShell({
  itemId,
  isDragging,
  dragOver,
  onDragStart,
  onDragEnter,
  onDragEnd,
  onDrop,
  className = '',
  compact = false,
  reorderable = true,
  children,
}: {
  itemId: string
  isDragging: boolean
  dragOver: boolean
  onDragStart: () => void
  onDragEnter: () => void
  onDragEnd: () => void
  onDrop: () => void
  className?: string
  compact?: boolean
  reorderable?: boolean
  children: ReactNode
}) {
  if (compact) {
    return (
      <div
        className={`sidebar-nav-item sidebar-nav-item--compact${className ? ` ${className}` : ''}`}
        data-nav-id={itemId}
      >
        <div className="sidebar-nav-item-body">{children}</div>
      </div>
    )
  }

  if (reorderable === false) {
    return (
      <div
        className={`sidebar-nav-item${className ? ` ${className}` : ''}`}
        data-nav-id={itemId}
      >
        <div className="sidebar-nav-item-body">{children}</div>
      </div>
    )
  }

  return (
    <div
      className={`sidebar-nav-item${className ? ` ${className}` : ''}${
        isDragging ? ' sidebar-nav-item--dragging' : ''
      }${dragOver ? ' sidebar-nav-item--drag-over' : ''}`}
      data-nav-id={itemId}
      onDragEnter={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onDragEnter()
      }}
      onDragOver={(e) => {
        e.preventDefault()
        e.stopPropagation()
      }}
      onDrop={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onDrop()
      }}
    >
      <button
        type="button"
        className="sidebar-drag-handle"
        draggable
        title="Drag to reorder"
        aria-label="Drag to reorder"
        onDragStart={(e) => startDrag(e, itemId, onDragStart)}
        onDragEnd={onDragEnd}
      >
        ⋮⋮
      </button>
      <div className="sidebar-nav-item-body">{children}</div>
    </div>
  )
}

export function Sidebar({
  state,
  viewScope,
  onSelectScope,
  activeRoute,
  activePage,
  reserveMenuOpen,
  setReserveMenuOpen,
  onNavigate,
  isMobile = false,
  mobileOpen = false,
  onMobileClose,
  onSetupGuide,
}: SidebarProps) {
  const demoMode = useDemoMode()
  const editReadOnly = useEditReadOnly()
  const { user, profile, signOut, configured } = useAuth()
  const { requestFeature } = useSubscription()
  const { collapsed, toggleCollapsed } = useSidebarCollapsed()
  const showCollapsed = collapsed && !isMobile
  const plannerIds = state.reservePlanners.map((p) => p.id)
  const { order, orderedPlannerIds, moveItem, movePlannerItem } = useNavLayout(plannerIds)
  const [draggingKey, setDraggingKey] = useState<string | null>(null)
  const [dragOverKey, setDragOverKey] = useState<string | null>(null)

  const pages = getOrderedPages(order).filter(
    (page) => isMobile || !DESKTOP_SIDEBAR_HIDDEN_PAGES.has(page.id),
  )
  const plannersById = new Map(state.reservePlanners.map((p) => [p.id, p]))
  const orderedPlanners = orderedPlannerIds
    .map((id) => plannersById.get(id))
    .filter((planner) => planner !== undefined)
  const scopePlannerId = getReservePlannerIdForScope(state, viewScope)
  const reserveNeedsSetup =
    !demoMode && state.businesses.length > 0 && state.reservePlanners.length === 0

  const finishDrag = () => {
    setDraggingKey(null)
    setDragOverKey(null)
  }

  const pageKey = (id: PageId) => `page:${id}`
  const plannerKey = (id: string) => `planner:${id}`

  const reserveFlyout =
    showCollapsed && reserveMenuOpen ? (
      <div className="sidebar-flyout" role="menu" aria-label="Reserve plans">
        <p className="sidebar-flyout-title">Reserve Planner</p>
        {orderedPlanners.map((planner) => (
          <a
            key={planner.id}
            href={buildHash('reserve-planner', planner.id)}
            className={`sidebar-flyout-link${
              activeRoute.reservePlannerId === planner.id ? ' active' : ''
            }`}
            role="menuitem"
            onClick={(e) => {
              e.preventDefault()
              handleNavigate('reserve-planner', planner.id)
              setReserveMenuOpen(false)
            }}
          >
            {getPlannerDisplayName(state, planner)}
          </a>
        ))}
        <a
          href={buildHash('reserve-planner', RESERVE_PLANNER_CREATE_ROUTE)}
          className={`sidebar-flyout-link sidebar-flyout-link--action${
            activeRoute.reservePlannerId === RESERVE_PLANNER_CREATE_ROUTE ? ' active' : ''
          }`}
          role="menuitem"
          onClick={(e) => {
            e.preventDefault()
            handleNavigate('reserve-planner', RESERVE_PLANNER_CREATE_ROUTE)
            setReserveMenuOpen(false)
          }}
        >
          + New plan
        </a>
      </div>
    ) : null

  const sidebarRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!showCollapsed || !reserveMenuOpen) return

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (sidebarRef.current?.contains(target)) return
      setReserveMenuOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [showCollapsed, reserveMenuOpen, setReserveMenuOpen])

  const handleSelectScope = (scope: ViewScope) => {
    if (scope.type === 'group' && !requestFeature('groupReporting')) return
    onSelectScope(scope)
    if (isMobile) onMobileClose?.()
  }

  const handleNavigate = (pageId: PageId, reservePlannerId?: string | null) => {
    onNavigate(pageId, reservePlannerId)
    if (isMobile) onMobileClose?.()
  }

  return (
    <aside
      ref={sidebarRef}
      className={`sidebar${showCollapsed ? ' sidebar--collapsed' : ''}${
        isMobile && mobileOpen ? ' sidebar--mobile-open' : ''
      }`}
      aria-hidden={isMobile && !mobileOpen ? true : undefined}
    >
      <div className="sidebar-brand">
        <span className="brand-mark" aria-hidden="true">
          TB
        </span>
        {!showCollapsed && (
          <div>
            <h1>Cash Prophet</h1>
            <p className="brand-tagline">One number you can trust</p>
          </div>
        )}
        {isMobile ? (
          <button
            type="button"
            className="sidebar-mobile-close-btn"
            onClick={onMobileClose}
            aria-label="Close menu"
          >
            ×
          </button>
        ) : (
          <button
            type="button"
            className="sidebar-collapse-btn"
            onClick={toggleCollapsed}
            aria-expanded={!showCollapsed}
            aria-label={showCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={showCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {showCollapsed ? '›' : '‹'}
          </button>
        )}
      </div>

      <div className="sidebar-body">
        <SidebarScopeTree
          state={state}
          viewScope={viewScope}
          onSelect={handleSelectScope}
          compact={showCollapsed}
          showFreshnessLegend={false}
        />

        <div className="sidebar-bottom">
          {!showCollapsed ? <ScopeFreshnessLegend /> : null}

          <div className="sidebar-divider" aria-hidden="true" />

          <nav className="sidebar-nav" aria-label="Main">
          {pages.map((page, index) => {
            if (page.id === 'reserve-planner') {
              const onReservePage = activeRoute.page === 'reserve-planner'

              return (
                <NavDragShell
                  key={page.id}
                  itemId={pageKey(page.id)}
                  className="sidebar-nav-item--top"
                  compact={showCollapsed}
                  reorderable={!editReadOnly}
                  isDragging={draggingKey === pageKey(page.id)}
                  dragOver={dragOverKey === pageKey(page.id) && draggingKey !== pageKey(page.id)}
                  onDragStart={() => setDraggingKey(pageKey(page.id))}
                  onDragEnter={() => setDragOverKey(pageKey(page.id))}
                  onDragEnd={finishDrag}
                  onDrop={() => {
                    if (draggingKey?.startsWith('page:')) {
                      moveItem(draggingKey.slice(5) as PageId, index)
                    }
                    finishDrag()
                  }}
                >
                  <div className={`sidebar-group${showCollapsed ? ' sidebar-group--compact' : ''}`}>
                    <a
                      href={buildHash('reserve-planner')}
                      className={`sidebar-link${onReservePage ? ' active' : ''}${
                        reserveNeedsSetup ? ' sidebar-link--alert' : ''
                      }`}
                      data-tour="nav-reserve-planner"
                      aria-current={onReservePage ? 'page' : undefined}
                      aria-expanded={reserveMenuOpen}
                      title={
                        showCollapsed
                          ? reserveNeedsSetup
                            ? `${page.label} — not set up yet`
                            : page.label
                          : undefined
                      }
                      onClick={(e) => {
                        e.preventDefault()
                        setReserveMenuOpen((open) => !open)
                        if (orderedPlanners.length > 0) {
                          const targetId =
                            scopePlannerId ??
                            activeRoute.reservePlannerId ??
                            orderedPlanners[0].id
                          handleNavigate('reserve-planner', targetId)
                        } else {
                          handleNavigate('reserve-planner')
                        }
                      }}
                    >
                      <span className="sidebar-nav-icon" aria-hidden>
                        {page.icon}
                      </span>
                      {!showCollapsed && <span className="sidebar-link-label">{page.label}</span>}
                      {reserveNeedsSetup ? (
                        <span
                          className="sidebar-nav-alert"
                          title="Reserve not set up yet"
                          aria-label="Reserve not set up yet"
                        >
                          !
                        </span>
                      ) : null}
                    </a>
                    {!showCollapsed && (reserveMenuOpen || onReservePage) && (
                      <div className="sidebar-submenu">
                        {orderedPlanners.map((planner, subIndex) => (
                          <NavDragShell
                            key={planner.id}
                            itemId={plannerKey(planner.id)}
                            className="sidebar-submenu-item"
                            reorderable={!editReadOnly}
                            isDragging={draggingKey === plannerKey(planner.id)}
                            dragOver={
                              dragOverKey === plannerKey(planner.id) &&
                              draggingKey !== plannerKey(planner.id)
                            }
                            onDragStart={() => setDraggingKey(plannerKey(planner.id))}
                            onDragEnter={() => setDragOverKey(plannerKey(planner.id))}
                            onDragEnd={finishDrag}
                            onDrop={() => {
                              if (draggingKey?.startsWith('planner:')) {
                                movePlannerItem(draggingKey.slice(8), subIndex)
                              }
                              finishDrag()
                            }}
                          >
                            <a
                              href={buildHash('reserve-planner', planner.id)}
                              className={`sidebar-sublink${
                                activeRoute.reservePlannerId === planner.id ? ' active' : ''
                              }`}
                              aria-current={
                                activeRoute.reservePlannerId === planner.id ? 'page' : undefined
                              }
                              onClick={(e) => {
                                e.preventDefault()
                                handleNavigate('reserve-planner', planner.id)
                              }}
                            >
                              {getPlannerDisplayName(state, planner)}
                            </a>
                          </NavDragShell>
                        ))}
                        <a
                          href={buildHash('reserve-planner', RESERVE_PLANNER_CREATE_ROUTE)}
                          className={`sidebar-sublink sidebar-sublink--action${
                            activeRoute.reservePlannerId === RESERVE_PLANNER_CREATE_ROUTE
                              ? ' active'
                              : ''
                          }`}
                          onClick={(e) => {
                            e.preventDefault()
                            handleNavigate('reserve-planner', RESERVE_PLANNER_CREATE_ROUTE)
                          }}
                        >
                          + New plan
                        </a>
                      </div>
                    )}
                  </div>
                </NavDragShell>
              )
            }

            return (
              <NavDragShell
                key={page.id}
                itemId={pageKey(page.id)}
                compact={showCollapsed}
                reorderable={!editReadOnly}
                isDragging={draggingKey === pageKey(page.id)}
                dragOver={dragOverKey === pageKey(page.id) && draggingKey !== pageKey(page.id)}
                onDragStart={() => setDraggingKey(pageKey(page.id))}
                onDragEnter={() => setDragOverKey(pageKey(page.id))}
                onDragEnd={finishDrag}
                onDrop={() => {
                  if (draggingKey?.startsWith('page:')) {
                    moveItem(draggingKey.slice(5) as PageId, index)
                  }
                  finishDrag()
                }}
              >
                <a
                  href={buildHash(page.id)}
                  className={`sidebar-link${activePage === page.id ? ' active' : ''}`}
                  aria-current={activePage === page.id ? 'page' : undefined}
                  data-tour={page.id === 'settings' ? 'nav-settings' : undefined}
                  title={showCollapsed ? page.label : undefined}
                  onClick={(e) => {
                    e.preventDefault()
                    handleNavigate(page.id)
                  }}
                >
                  <span className="sidebar-nav-icon" aria-hidden>
                    {page.icon}
                  </span>
                  {!showCollapsed && page.label}
                </a>
              </NavDragShell>
            )
          })}
          </nav>

          {!isMobile && (
            <div className={`sidebar-view-style${showCollapsed ? ' sidebar-view-style--compact' : ''}`}>
              {!showCollapsed && <p className="sidebar-view-style-label">Layout</p>}
              <DashboardViewStyleToggle compact />
            </div>
          )}
        </div>
      </div>

      {isMobile && onSetupGuide && !editReadOnly && (
        <MobileTourLinks onSetupGuide={onSetupGuide} />
      )}

      <div className={`sidebar-account${showCollapsed ? ' sidebar-account--compact' : ''}`}>
        {!showCollapsed && profile?.email && (
          <p className="sidebar-account-email" title={profile.email}>
            {profile.email}
          </p>
        )}
        <div className="sidebar-account-actions">
          {demoMode ? (
            <>
              <Link
                to="/"
                className="sidebar-account-link"
                title={showCollapsed ? 'Home' : undefined}
              >
                {showCollapsed ? '⌂' : 'Home'}
              </Link>
              <Link
                to="/see-how-it-works"
                className="sidebar-account-link"
                title={showCollapsed ? 'All demos' : undefined}
              >
                {showCollapsed ? '▦' : 'All demos'}
              </Link>
            </>
          ) : (
            <Link
              to="/"
              className="sidebar-account-link"
              title={showCollapsed ? 'Home' : undefined}
            >
              {showCollapsed ? '⌂' : 'Home'}
            </Link>
          )}
          {configured && user && !demoMode ? (
            <button
              type="button"
              className="sidebar-account-link sidebar-account-logout"
              title={showCollapsed ? 'Log out' : undefined}
              onClick={() => signOut()}
            >
              {showCollapsed ? '⎋' : 'Log out'}
            </button>
          ) : (
            !user && (
              demoMode ? (
                <Link to="/signup" className="sidebar-account-link" title={showCollapsed ? 'Start trial' : undefined}>
                  {showCollapsed ? '★' : 'Start free trial'}
                </Link>
              ) : (
                configured && (
                  <Link to="/login" className="sidebar-account-link" title={showCollapsed ? 'Log in' : undefined}>
                    {showCollapsed ? '→' : 'Log in'}
                  </Link>
                )
              )
            )
          )}
        </div>
      </div>

      {reserveFlyout}
    </aside>
  )
}

