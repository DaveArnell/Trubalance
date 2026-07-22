import { useMemo, useState } from 'react'
import type { AppState, ViewScope } from '../types'
import { getCommitmentScopeOptionsForView, itemMatchesScope, getScopeItemLabel, getDefaultCommitmentScope } from '../utils/scope'
import { sortByOrder } from '../utils/sortOrder'
import type { AppActions } from '../hooks/useAppState'
import { useEditReadOnly } from '../hooks/useEditReadOnly'
import { useDashboardViewPreferences } from '../contexts/DashboardViewPreferencesContext'
import { useSheetRowReorder } from '../hooks/useSheetRowReorder'
import { receiptEditableCellIds, useSheetCellNavigation } from '../utils/sheetCellNavigation'
import { HelpButton } from './HelpButton'
import { CompactKpiStrip } from './CompactKpiStrip'
import { WIDGET_HELP } from '../content/livingDashboard'
import { formatCurrency } from '../utils/format'
import { DuplicateRowButton, SheetDragCell, SheetDragHeader } from './committed/shared'
import { PlatformSheetTable, PlatformSheetWrap, ResizableSheetHeader } from './PlatformSheetWrap'
import { RECEIPTS_COLUMNS } from '../utils/sheetColumnSpecs'
import { normalizeReceiptDateInput, getEffectiveReceiptAmount, formatReceiptDateDisplay, formatRelativeDayLabel } from '../utils/receiptCalculations'
import { InlineNumberCell, InlineTextCell, ScopeSelectCell } from './SheetInlineCells'
import { MobileReceiptsList } from './mobile/MobileReceiptsList'
import { MarkReceivedConfirmButton } from './committed/MarkPaidConfirmModal'
import { AddReceiptModal } from './mobile/AddRecordModals'
import { useDemoMode } from '../contexts/DemoModeContext'
import { getReferenceDate } from '../utils/referenceDate'

interface ExpectedReceiptsPanelProps {
  state: AppState
  viewScope: ViewScope
  actions: Pick<AppActions, 'addReceipt' | 'updateReceipt' | 'markReceiptReceived' | 'deleteReceipt' | 'duplicateReceipt' | 'reorderReceipts'>
  openHelp: string | null
  setOpenHelp: (id: string | null) => void
}

export function ExpectedReceiptsPanel({
  state,
  viewScope,
  actions,
  openHelp,
  setOpenHelp,
}: ExpectedReceiptsPanelProps) {
  const editReadOnly = useEditReadOnly()
  const demoMode = useDemoMode()
  const { useCards } = useDashboardViewPreferences()
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [highlightRowId, setHighlightRowId] = useState<string | null>(null)
  const options = getCommitmentScopeOptionsForView(state, viewScope)
  const visibleReceipts = useMemo(
    () =>
      sortByOrder(
        state.expectedReceipts.filter(
          (r) =>
            !r.received && itemMatchesScope(state, viewScope, r.scopeLevel, r.scopeId),
        ),
        (r) => r.sortOrder,
      ),
    [state.expectedReceipts, state, viewScope],
  )
  const outOfScopeReceipts = useMemo(
    () =>
      state.expectedReceipts.filter(
        (receipt) =>
          !receipt.received &&
          !itemMatchesScope(state, viewScope, receipt.scopeLevel, receipt.scopeId),
      ),
    [state.expectedReceipts, state, viewScope],
  )
  const orderedCellIds = useMemo(() => receiptEditableCellIds(visibleReceipts), [visibleReceipts])
  const { activeCell, activate, deactivate, makeTabHandler } = useSheetCellNavigation(orderedCellIds)
  const tryActivate = (cellId: string) => {
    if (editReadOnly) return
    if (highlightRowId && cellId.startsWith(highlightRowId)) setHighlightRowId(null)
    activate(cellId)
  }

  const receiptRowIds = useMemo(() => visibleReceipts.map((item) => item.id), [visibleReceipts])
  const receiptReorder = useSheetRowReorder(receiptRowIds, actions.reorderReceipts)

  const totalAccrued = useMemo(
    () =>
      visibleReceipts.reduce(
        (sum, receipt) => sum + (receipt.received ? 0 : getEffectiveReceiptAmount(receipt)),
        0,
      ),
    [visibleReceipts],
  )

  const addRow = () => {
    if (useCards) {
      setAddModalOpen(true)
      return
    }
    const { scopeLevel, scopeId } = getDefaultCommitmentScope(state, viewScope)
    const id = actions.addReceipt({
      name: 'New receipt',
      amount: 0,
      scopeLevel: viewScope.type === 'group' ? scopeLevel : viewScope.type,
      scopeId: viewScope.type === 'group' ? scopeId : viewScope.id,
    })
    if (id) {
      setHighlightRowId(id)
      activate(`${id}-name`)
    }
  }

  return (
    <section id="expected-receipts" className="card widget-compact card-scroll">
      <div className={`card-head card-head-compact${useCards ? ' card-head--receipts-cards card-head--widget-bar' : ''}`}>
        {useCards ? (
          <>
            <div className="card-head-toolbar">
              {!editReadOnly ? (
                <button type="button" className="btn-primary btn-widget-add" onClick={addRow}>
                  + Add
                </button>
              ) : (
                <span className="card-head-toolbar-spacer" aria-hidden />
              )}
              <h2>Expected receipts</h2>
              <HelpButton
                id="receipts"
                openHelp={openHelp}
                setOpenHelp={setOpenHelp}
                text={WIDGET_HELP.expectedReceipts}
              />
            </div>
          </>
        ) : (
          <>
            <div>
              <h2>Expected receipts</h2>
              {totalAccrued > 0 ? (
                <p className="muted widget-subtitle">
                  Accrued in Available: +{formatCurrency(totalAccrued)}
                </p>
              ) : null}
            </div>
            <div className="card-actions">
              {!editReadOnly && (
                <button type="button" className="btn-primary btn-widget-add" onClick={addRow}>
                  + Add row
                </button>
              )}
              <HelpButton
                id="receipts"
                openHelp={openHelp}
                setOpenHelp={setOpenHelp}
                text={WIDGET_HELP.expectedReceipts}
              />
            </div>
          </>
        )}
      </div>

      {useCards && totalAccrued > 0 ? (
        <div className="card-kpi-bar">
          <CompactKpiStrip
            items={[
              {
                label: 'Accrued in Available',
                value: `+${formatCurrency(totalAccrued)}`,
                emphasis: true,
              },
            ]}
          />
        </div>
      ) : null}

      {outOfScopeReceipts.length > 0 ? (
        <p className="expected-receipts-scope-hint muted">
          {outOfScopeReceipts.length} receipt{outOfScopeReceipts.length === 1 ? '' : 's'} in other scopes
          {outOfScopeReceipts.length <= 3
            ? `: ${outOfScopeReceipts.map((receipt) => `${receipt.name} (${getScopeItemLabel(state, receipt.scopeLevel, receipt.scopeId)})`).join(', ')}`
            : ''}
          . Change the sidebar scope to view them.
        </p>
      ) : null}

      <div className="card-scroll-body">
        {useCards ? (
          <MobileReceiptsList state={state} viewScope={viewScope} actions={actions} />
        ) : (
        <PlatformSheetWrap storageKey="expected-receipts" columns={RECEIPTS_COLUMNS}>
          {({ widths, startResize, prefClasses }) => (
            <PlatformSheetTable widths={widths} preferenceClasses={prefClasses}>
              <thead>
                <tr>
                  {!editReadOnly && <SheetDragHeader />}
                  <ResizableSheetHeader columnIndex={1} onResizeStart={startResize}>Name</ResizableSheetHeader>
                  <ResizableSheetHeader columnIndex={2} onResizeStart={startResize} className="committed-scope-col">Scope</ResizableSheetHeader>
                  <ResizableSheetHeader columnIndex={3} onResizeStart={startResize}>Timing</ResizableSheetHeader>
                  <ResizableSheetHeader columnIndex={4} onResizeStart={startResize}>Start</ResizableSheetHeader>
                  <ResizableSheetHeader columnIndex={5} onResizeStart={startResize}>Expected</ResizableSheetHeader>
                  <ResizableSheetHeader columnIndex={6} onResizeStart={startResize} className="sheet-num">Amount</ResizableSheetHeader>
                  {!editReadOnly && (
                    <ResizableSheetHeader columnIndex={7} onResizeStart={startResize} className="sheet-actions" />
                  )}
                </tr>
              </thead>
              <tbody>
                {visibleReceipts.length === 0 ? (
                  <tr className="sheet-empty-row">
                    <td colSpan={8} className="sheet-empty-cell">
                      {state.expectedReceipts.length === 0
                        ? 'No expected receipts in this view. Use + Add row.'
                        : 'No expected receipts in this scope. Check the sidebar scope or the note above.'}
                    </td>
                  </tr>
                ) : (
                  visibleReceipts.map((item, index) => {
                  const rowProps = receiptReorder.getRowProps(item.id, index)
                  return (
                  <tr
                    key={item.id}
                    className={[
                      item.received ? 'sheet-row--received' : '',
                      highlightRowId === item.id ? 'sheet-row--new-highlight' : '',
                    ]
                      .filter(Boolean)
                      .join(' ') || undefined}
                    {...(editReadOnly ? {} : rowProps)}
                  >
                    {!editReadOnly && (
                      <SheetDragCell rowId={item.id} getHandleProps={receiptReorder.getHandleProps} />
                    )}
                    <InlineTextCell
                      cellId={`${item.id}-name`}
                      value={item.name}
                      isActive={activeCell === `${item.id}-name`}
                      placeholder="Name"
                      onActivate={() => tryActivate(`${item.id}-name`)}
                      onDeactivate={deactivate}
                      onSave={(name) => actions.updateReceipt(item.id, { name: name || 'Untitled' })}
                      onTab={makeTabHandler(`${item.id}-name`)}
                    />
                    <ScopeSelectCell
                      cellId={`${item.id}-scope`}
                      state={state}
                      scopeLevel={item.scopeLevel}
                      scopeId={item.scopeId}
                      options={options}
                      readOnly={editReadOnly}
                      isActive={activeCell === `${item.id}-scope`}
                      onActivate={() => tryActivate(`${item.id}-scope`)}
                      onDeactivate={deactivate}
                      onChange={(scopeLevel, scopeId) =>
                        actions.updateReceipt(item.id, { scopeLevel, scopeId })
                      }
                      onTab={makeTabHandler(`${item.id}-scope`)}
                    />
                    <td className="sheet-select-cell">
                      {editReadOnly ? (
                        <span className="sheet-cell-value">
                          {(item.receiptTiming ?? 'lump') === 'accrual' ? 'Build up' : 'Lump sum'}
                        </span>
                      ) : (
                      <select
                        className="sheet-inline-select"
                        value={item.receiptTiming ?? 'lump'}
                        aria-label={`Timing for ${item.name}`}
                        onChange={(e) =>
                          actions.updateReceipt(item.id, {
                            receiptTiming: e.target.value === 'accrual' ? 'accrual' : 'lump',
                          })
                        }
                      >
                        <option value="lump">Lump sum</option>
                        <option value="accrual">Build up</option>
                      </select>
                      )}
                    </td>
                    <InlineTextCell
                      cellId={`${item.id}-start`}
                      value={
                        demoMode
                          ? formatRelativeDayLabel(item.accrualStartDate, getReferenceDate())
                          : formatReceiptDateDisplay(item.accrualStartDate)
                      }
                      isActive={activeCell === `${item.id}-start`}
                      placeholder="e.g. 1 Jul 2026"
                      onActivate={() => tryActivate(`${item.id}-start`)}
                      onDeactivate={deactivate}
                      onSave={(accrualStartDate) =>
                        actions.updateReceipt(item.id, {
                          accrualStartDate: normalizeReceiptDateInput(accrualStartDate),
                        })
                      }
                      onTab={makeTabHandler(`${item.id}-start`)}
                    />
                    <InlineTextCell
                      cellId={`${item.id}-expected`}
                      value={
                        demoMode
                          ? formatRelativeDayLabel(item.expectedDate, getReferenceDate())
                          : formatReceiptDateDisplay(item.expectedDate)
                      }
                      isActive={activeCell === `${item.id}-expected`}
                      placeholder="e.g. 31 Jul 2026"
                      onActivate={() => tryActivate(`${item.id}-expected`)}
                      onDeactivate={deactivate}
                      onSave={(expectedDate) =>
                        actions.updateReceipt(item.id, {
                          expectedDate: normalizeReceiptDateInput(expectedDate),
                        })
                      }
                      onTab={makeTabHandler(`${item.id}-expected`)}
                    />
                    <InlineNumberCell
                      cellId={`${item.id}-amount`}
                      value={item.amount}
                      isActive={activeCell === `${item.id}-amount`}
                      onActivate={() => tryActivate(`${item.id}-amount`)}
                      onDeactivate={deactivate}
                      onSave={(amount) => actions.updateReceipt(item.id, { amount })}
                      onTab={makeTabHandler(`${item.id}-amount`)}
                    />
                    {!editReadOnly && (
                    <td className="sheet-actions">
                      <div className="sheet-action-group">
                        {item.received ? (
                          <button type="button" className="btn-primary btn-tiny" disabled>
                            Received
                          </button>
                        ) : (
                          <MarkReceivedConfirmButton
                            itemLabel={item.name}
                            expectedTotal={item.amount}
                            onConfirm={(amount) => actions.markReceiptReceived(item.id, amount)}
                          />
                        )}
                        <DuplicateRowButton onClick={() => actions.duplicateReceipt(item.id)} />
                        <button
                          type="button"
                          className="btn-danger btn-tiny"
                          onClick={() => actions.deleteReceipt(item.id)}
                          title="Remove receipt"
                        >
                          ×
                        </button>
                      </div>
                    </td>
                    )}
                  </tr>
                  )
                })
                )}
              </tbody>
            </PlatformSheetTable>
          )}
        </PlatformSheetWrap>
        )}
      </div>
      {addModalOpen ? (
        <AddReceiptModal
          state={state}
          viewScope={viewScope}
          onClose={() => setAddModalOpen(false)}
          onSave={(payload) => {
            actions.addReceipt({
              name: payload.name,
              amount: payload.amount,
              expectedDate: payload.expectedDate,
              receiptTiming: payload.receiptTiming,
              scopeLevel: payload.scopeLevel,
              scopeId: payload.scopeId,
            })
            setAddModalOpen(false)
          }}
        />
      ) : null}
    </section>
  )
}

