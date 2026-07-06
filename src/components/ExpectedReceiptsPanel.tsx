import { useMemo } from 'react'
import type { AppState, ViewScope } from '../types'
import { getCommitmentScopeOptionsForView, itemMatchesScope } from '../utils/scope'
import { sortByOrder } from '../utils/sortOrder'
import type { AppActions } from '../hooks/useAppState'
import { useDemoReadOnly } from '../contexts/DemoModeContext'
import { useSheetRowReorder } from '../hooks/useSheetRowReorder'
import { receiptEditableCellIds, useSheetCellNavigation } from '../utils/sheetCellNavigation'
import { HelpButton } from './HelpButton'
import { WIDGET_HELP } from '../content/livingDashboard'
import { DuplicateRowButton, SheetDragCell, SheetDragHeader } from './committed/shared'
import { PlatformSheetTable, PlatformSheetWrap, ResizableSheetHeader } from './PlatformSheetWrap'
import { RECEIPTS_COLUMNS } from '../utils/sheetColumnSpecs'
import { InlineNumberCell, InlineTextCell, ScopeSelectCell } from './SheetInlineCells'

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
  const demoReadOnly = useDemoReadOnly()
  const options = getCommitmentScopeOptionsForView(state, viewScope)
  const visibleReceipts = useMemo(
    () =>
      sortByOrder(
        state.expectedReceipts.filter((r) =>
          itemMatchesScope(state, viewScope, r.scopeLevel, r.scopeId),
        ),
        (r) => r.sortOrder,
      ),
    [state.expectedReceipts, state, viewScope],
  )
  const orderedCellIds = useMemo(() => receiptEditableCellIds(visibleReceipts), [visibleReceipts])
  const { activeCell, activate, deactivate, makeTabHandler } = useSheetCellNavigation(orderedCellIds)
  const tryActivate = (cellId: string) => {
    if (!demoReadOnly) activate(cellId)
  }

  const receiptRowIds = useMemo(() => visibleReceipts.map((item) => item.id), [visibleReceipts])
  const receiptReorder = useSheetRowReorder(receiptRowIds, actions.reorderReceipts)

  const addRow = () => {
    actions.addReceipt({
      name: 'New receipt',
      amount: 0,
      scopeLevel: viewScope.type,
      scopeId: viewScope.id,
    })
  }

  return (
    <section id="expected-receipts" className="card widget-compact card-scroll">
      <div className="card-head card-head-compact">
        <h2>Expected Receipts</h2>
        <div className="card-actions">
          {!demoReadOnly && (
            <button type="button" className="btn-secondary btn-tiny" onClick={addRow}>
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
      </div>

      <div className="card-scroll-body">
        <PlatformSheetWrap storageKey="expected-receipts" columns={RECEIPTS_COLUMNS}>
          {({ widths, startResize, prefClasses }) => (
            <PlatformSheetTable widths={widths} preferenceClasses={prefClasses}>
              <thead>
                <tr>
                  {!demoReadOnly && <SheetDragHeader />}
                  <ResizableSheetHeader columnIndex={1} onResizeStart={startResize}>Name</ResizableSheetHeader>
                  <ResizableSheetHeader columnIndex={2} onResizeStart={startResize} className="committed-scope-col">Scope</ResizableSheetHeader>
                  <ResizableSheetHeader columnIndex={3} onResizeStart={startResize}>Timing</ResizableSheetHeader>
                  <ResizableSheetHeader columnIndex={4} onResizeStart={startResize}>Start</ResizableSheetHeader>
                  <ResizableSheetHeader columnIndex={5} onResizeStart={startResize}>Expected</ResizableSheetHeader>
                  <ResizableSheetHeader columnIndex={6} onResizeStart={startResize} className="sheet-num">Amount</ResizableSheetHeader>
                  {!demoReadOnly && (
                    <ResizableSheetHeader columnIndex={7} onResizeStart={startResize} className="sheet-actions" />
                  )}
                </tr>
              </thead>
              <tbody>
                {visibleReceipts.length === 0 ? (
                  <tr className="sheet-empty-row">
                    <td colSpan={8} className="sheet-empty-cell">
                      No expected receipts in this view. Use + Add row.
                    </td>
                  </tr>
                ) : (
                  visibleReceipts.map((item, index) => {
                  const rowProps = receiptReorder.getRowProps(item.id, index)
                  return (
                  <tr key={item.id} className={item.received ? 'sheet-row--received' : undefined} {...(demoReadOnly ? {} : rowProps)}>
                    {!demoReadOnly && (
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
                      readOnly={demoReadOnly}
                      isActive={activeCell === `${item.id}-scope`}
                      onActivate={() => tryActivate(`${item.id}-scope`)}
                      onDeactivate={deactivate}
                      onChange={(scopeLevel, scopeId) =>
                        actions.updateReceipt(item.id, { scopeLevel, scopeId })
                      }
                      onTab={makeTabHandler(`${item.id}-scope`)}
                    />
                    <td className="sheet-select-cell">
                      {demoReadOnly ? (
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
                      value={item.accrualStartDate ?? ''}
                      isActive={activeCell === `${item.id}-start`}
                      placeholder="e.g. 1 Jul"
                      onActivate={() => tryActivate(`${item.id}-start`)}
                      onDeactivate={deactivate}
                      onSave={(accrualStartDate) =>
                        actions.updateReceipt(item.id, {
                          accrualStartDate: accrualStartDate || undefined,
                        })
                      }
                      onTab={makeTabHandler(`${item.id}-start`)}
                    />
                    <InlineTextCell
                      cellId={`${item.id}-expected`}
                      value={item.expectedDate ?? ''}
                      isActive={activeCell === `${item.id}-expected`}
                      placeholder="e.g. 31 Jul"
                      onActivate={() => tryActivate(`${item.id}-expected`)}
                      onDeactivate={deactivate}
                      onSave={(expectedDate) =>
                        actions.updateReceipt(item.id, { expectedDate: expectedDate || undefined })
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
                    {!demoReadOnly && (
                    <td className="sheet-actions">
                      <div className="sheet-action-group">
                        <button
                          type="button"
                          className="btn-primary btn-tiny"
                          disabled={item.received}
                          onClick={() => actions.markReceiptReceived(item.id)}
                        >
                          {item.received ? 'Received' : 'Mark received'}
                        </button>
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
      </div>
    </section>
  )
}
