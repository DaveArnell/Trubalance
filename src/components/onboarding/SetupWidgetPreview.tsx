import { useMemo, useState, type ReactNode } from 'react'
import type { AppActions } from '../../hooks/useAppState'
import type { GraphRange } from '../../types'
import {
  buildDemoScenarioState,
  DEFAULT_DEMO_SCENARIO_ID,
  type DemoScenarioMeta,
} from '../../data/demoScenarios'
import { DemoModeProvider } from '../../contexts/DemoModeContext'
import { calculateDashboard } from '../../utils/calculations'
import { filterAccruingRowsForView } from '../../utils/scope'
import { summarizeReservePlanner } from '../../utils/reserveCalculations'
import { MonthlyCostPeriodView } from '../committed/MonthlyCostPeriodView'
import { DuePanel } from '../committed/DuePanel'
import { ExpectedReceiptsPanel } from '../ExpectedReceiptsPanel'
import { ReservePlannerPanel } from '../ReservePlannerPanel'
import { TrendChart } from '../TrendChart'
import { CashOutlookPanel } from '../CashOutlookPanel'

export type SetupWidgetPreviewId =
  | 'month-view'
  | 'due'
  | 'receipts'
  | 'reserve'
  | 'trends'
  | 'forecast'

const noop = () => undefined
const noopId = (): string | null => null

const previewDueActions = {
  addCommitment: noopId,
  updateCommitment: noop,
  updateCommitmentDuePeriodAmount: noop,
  updateReserveBill: noop,
  markCommitmentPaid: noop,
  dismissCommitmentDue: noop,
  acknowledgeCommitmentDueAlert: noop,
  acknowledgeReserveBillDueAlert: noop,
  deleteCommitment: noop,
  duplicateCommitment: noop,
  markReserveBillPaid: noop,
  dismissReserveBillDue: noop,
  duplicateReserveBill: noop,
  reorderDueRows: noop,
} satisfies Pick<
  AppActions,
  | 'addCommitment'
  | 'updateCommitment'
  | 'updateCommitmentDuePeriodAmount'
  | 'updateReserveBill'
  | 'markCommitmentPaid'
  | 'dismissCommitmentDue'
  | 'acknowledgeCommitmentDueAlert'
  | 'acknowledgeReserveBillDueAlert'
  | 'deleteCommitment'
  | 'duplicateCommitment'
  | 'markReserveBillPaid'
  | 'dismissReserveBillDue'
  | 'duplicateReserveBill'
  | 'reorderDueRows'
>

const previewReceiptActions = {
  addReceipt: noopId,
  updateReceipt: noop,
  markReceiptReceived: noop,
  deleteReceipt: noop,
  duplicateReceipt: noop,
  reorderReceipts: noop,
} satisfies Pick<
  AppActions,
  'addReceipt' | 'updateReceipt' | 'markReceiptReceived' | 'deleteReceipt' | 'duplicateReceipt' | 'reorderReceipts'
>

const previewReserveActions = {
  addReservePlanner: () => '00000000-0000-4000-8000-000000000000' as const,
  updateReservePlanner: noop,
  deleteReservePlanner: noop,
  addReserveBill: noop,
  updateReserveBill: noop,
  deleteReserveBill: noop,
  duplicateReserveBill: noop,
  copyReservePlannerBillsFrom: noop,
  reorderReserveBills: noop,
  confirmReserveMonth: noop,
} satisfies Pick<
  AppActions,
  | 'addReservePlanner'
  | 'updateReservePlanner'
  | 'deleteReservePlanner'
  | 'addReserveBill'
  | 'updateReserveBill'
  | 'deleteReserveBill'
  | 'duplicateReserveBill'
  | 'copyReservePlannerBillsFrom'
  | 'reorderReserveBills'
  | 'confirmReserveMonth'
>

interface SetupWidgetPreviewProps {
  previewId: SetupWidgetPreviewId
}

function useDemoPreviewBundle() {
  return useMemo(() => {
    const { meta, state } = buildDemoScenarioState(DEFAULT_DEMO_SCENARIO_ID)
    const viewScope = meta.defaultViewScope
    const metrics = calculateDashboard(state, viewScope)
    const monthlyRows = filterAccruingRowsForView(
      metrics.commitmentViews.buildingUp.filter((row) => row.source !== 'reserve'),
      viewScope,
    )
    const reserveRows = filterAccruingRowsForView(
      metrics.commitmentViews.buildingUp.filter((row) => row.source === 'reserve'),
      viewScope,
    )
    const simulatorRows = [...monthlyRows, ...reserveRows]
    const planner = state.reservePlanners[0] ?? null
    const reserveSummary = planner ? summarizeReservePlanner(state, planner) : null
    return { meta, state, viewScope, metrics, simulatorRows, planner, reserveSummary }
  }, [])
}

function PreviewFrame({
  meta,
  children,
  tall = false,
  wide = false,
}: {
  meta: DemoScenarioMeta
  children: ReactNode
  tall?: boolean
  wide?: boolean
}) {
  return (
    <div
      className={[
        'setup-widget-preview',
        tall ? 'setup-widget-preview--tall' : '',
        wide ? 'setup-widget-preview--wide' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="setup-widget-preview-chrome">
        <span className="setup-widget-preview-badge">Example</span>
        <span className="setup-widget-preview-source">{meta.title}</span>
      </div>
      <div className="setup-widget-preview-body">{children}</div>
    </div>
  )
}

export function SetupWidgetPreview({ previewId }: SetupWidgetPreviewProps) {
  const bundle = useDemoPreviewBundle()
  const [openHelp, setOpenHelp] = useState<string | null>(null)
  const [graphRange, setGraphRange] = useState<GraphRange>(
    previewId === 'forecast' ? '30d' : '90d',
  )

  const content = (() => {
    switch (previewId) {
      case 'month-view':
        return <MonthlyCostPeriodView rows={bundle.simulatorRows} compact />
      case 'due':
        return (
          <DuePanel
            state={bundle.state}
            viewScope={bundle.viewScope}
            commitmentViews={bundle.metrics.commitmentViews}
            actions={previewDueActions}
            openHelp={openHelp}
            setOpenHelp={setOpenHelp}
          />
        )
      case 'receipts':
        return (
          <ExpectedReceiptsPanel
            state={bundle.state}
            viewScope={bundle.viewScope}
            actions={previewReceiptActions}
            openHelp={openHelp}
            setOpenHelp={setOpenHelp}
          />
        )
      case 'reserve':
        return bundle.reserveSummary ? (
          <ReservePlannerPanel
            state={bundle.state}
            viewScope={bundle.viewScope}
            summary={bundle.reserveSummary}
            reserveRouteId={bundle.planner?.id ?? null}
            actions={previewReserveActions}
            openHelp={openHelp}
            setOpenHelp={setOpenHelp}
            onPlannerDeleted={noop}
            onPlannerCreated={noop}
          />
        ) : (
          <p className="muted setup-widget-preview-empty">No reserve planner in this demo.</p>
        )
      case 'trends':
        return (
          <TrendChart
            embedded
            state={bundle.state}
            viewScope={bundle.viewScope}
            graphRange={graphRange}
            onRangeChange={setGraphRange}
            openHelp={openHelp}
            setOpenHelp={setOpenHelp}
          />
        )
      case 'forecast':
        return (
          <CashOutlookPanel
            embedded
            state={bundle.state}
            viewScope={bundle.viewScope}
            graphRange={graphRange}
            onRangeChange={setGraphRange}
            openHelp={openHelp}
            setOpenHelp={setOpenHelp}
          />
        )
      default:
        return null
    }
  })()

  return (
    <DemoModeProvider scenario={bundle.meta} onScenarioChange={noop} canEditDemo={false}>
      <PreviewFrame
        meta={bundle.meta}
        tall={previewId === 'reserve' || previewId === 'trends'}
        wide={previewId === 'reserve'}
      >
        {content}
      </PreviewFrame>
    </DemoModeProvider>
  )
}
