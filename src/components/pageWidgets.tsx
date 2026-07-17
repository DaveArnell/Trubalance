import type { ReactNode } from 'react'
import type { PageId } from '../navigation'
import type { AppState, DashboardMetrics, GraphRange, ViewScope } from '../types'
import type { BalanceSaveChange, BalanceSaveResult } from '../hooks/useAppState'
import type { AppActions } from '../hooks/useAppState'
import type { BreakdownColumn } from '../utils/breakdownTable'
import type { ReservePlannerSummary } from '../types'
import { CommittedFundsPanel } from './CommittedFundsPanel'
import { DuePanel } from './committed/DuePanel'
import { ExpectedReceiptsPanel } from './ExpectedReceiptsPanel'
import { ReservePlannerPanel } from './ReservePlannerPanel'
import { SettingsPage } from './SettingsPage'
import { HistoryPanel } from './HistoryPanel'
import { CashOutlookPanel } from './CashOutlookPanel'
import { TrendChart } from './TrendChart'
import { TrendProjectionPanel } from './TrendProjectionPanel'
import { TrueBalanceHistoryTable } from './TrueBalanceHistoryTable'
export interface PageWidgetContext {
  state: AppState
  viewScope: ViewScope
  metrics: DashboardMetrics
  breakdownColumns: BreakdownColumn[]
  graphRange: GraphRange
  setGraphRange: (range: GraphRange) => void
  trendFromDate: string | null
  setTrendFromDate: (date: string | null) => void
  viewName: string
  onBalanceSave: (changes: BalanceSaveChange[]) => BalanceSaveResult
  activeReserveSummary: ReservePlannerSummary | null
  reserveRouteId?: string | null
  actions: AppActions
  openHelp: string | null
  setOpenHelp: (id: string | null) => void
  onPlannerDeleted: (deletedId: string) => void
  onPlannerCreated: (plannerId: string) => void
  onOpenReservePlanner?: (plannerId: string) => void
  trendsFocusScope?: ViewScope | null
  onTrendsFocusApplied?: () => void
}

export function buildPageWidgets(pageId: PageId, ctx: PageWidgetContext): Record<string, ReactNode> {
  const {
    state,
    viewScope,
    metrics,
    graphRange,
    setGraphRange,
    trendFromDate,
    setTrendFromDate,
    activeReserveSummary,
    reserveRouteId,
    actions,
    openHelp,
    setOpenHelp,
    onPlannerDeleted,
    onPlannerCreated,
    onOpenReservePlanner,
    trendsFocusScope,
    onTrendsFocusApplied,
  } = ctx

  switch (pageId) {
    case 'trends':
      return {
        'trends-chart': (
          <div className="trends-widget-shell trends-widget-shell--chart">
            <TrendChart
              embedded
              state={state}
              viewScope={viewScope}
              graphRange={graphRange}
              onRangeChange={setGraphRange}
              fromDate={trendFromDate}
              onFromDateChange={setTrendFromDate}
              focusScope={trendsFocusScope}
              onFocusScopeApplied={onTrendsFocusApplied}
              openHelp={openHelp}
              setOpenHelp={setOpenHelp}
              onSetDayNote={actions.setDayNote}
            />
          </div>
        ),
        'trends-history': (
          <div className="trends-widget-shell trends-widget-shell--history">
            <TrueBalanceHistoryTable
              embedded
              state={state}
              viewScope={viewScope}
              graphRange={graphRange}
              fromDate={trendFromDate}
              openHelp={openHelp}
              setOpenHelp={setOpenHelp}
              correctSnapshotMetric={actions.correctSnapshotMetric}
              onDeleteSnapshots={actions.deleteSnapshots}
              onSetDayNote={actions.setDayNote}
            />
          </div>
        ),
      }
    case 'forecast':
      return {
        'forecast-cash-outlook': (
          <div className="forecast-widget-shell forecast-widget-shell--cash-outlook">
            <CashOutlookPanel
              embedded
              state={state}
              viewScope={viewScope}
              graphRange={graphRange}
              onRangeChange={setGraphRange}
              openHelp={openHelp}
              setOpenHelp={setOpenHelp}
            />
          </div>
        ),
        'forecast-projection': (
          <div className="forecast-widget-shell forecast-widget-shell--projection">
            <TrendProjectionPanel
              embedded
              state={state}
              viewScope={viewScope}
              graphRange={graphRange}
              actions={actions}
            />
          </div>
        ),
      }
    case 'committed-funds':
      return {
        'committed-funds': (
          <CommittedFundsPanel
            state={state}
            viewScope={viewScope}
            commitmentViews={metrics.commitmentViews}
            actions={actions}
            openHelp={openHelp}
            setOpenHelp={setOpenHelp}
          />
        ),
        due: (
          <DuePanel
            state={state}
            viewScope={viewScope}
            commitmentViews={metrics.commitmentViews}
            actions={actions}
            openHelp={openHelp}
            setOpenHelp={setOpenHelp}
            onOpenReservePlanner={onOpenReservePlanner}
          />
        ),
        'expected-receipts': (
          <ExpectedReceiptsPanel
            state={state}
            viewScope={viewScope}
            actions={actions}
            openHelp={openHelp}
            setOpenHelp={setOpenHelp}
          />
        ),
      }
    case 'reserve-planner':
      return {
        'reserve-planner': (
          <ReservePlannerPanel
            state={state}
            viewScope={viewScope}
            summary={activeReserveSummary}
            reserveRouteId={reserveRouteId}
            actions={actions}
            openHelp={openHelp}
            setOpenHelp={setOpenHelp}
            onPlannerDeleted={onPlannerDeleted}
            onPlannerCreated={onPlannerCreated}
          />
        ),
      }
    case 'history':
      return {
        history: (
          <HistoryPanel
            state={state}
            viewScope={viewScope}
            openHelp={openHelp}
            setOpenHelp={setOpenHelp}
            onDeleteHistoryRecord={actions.deleteHistoryRecord}
          />
        ),
      }
    case 'settings':
      return {
        settings: <SettingsPage state={state} actions={actions} />,
      }
    default:
      return {}
  }
}
