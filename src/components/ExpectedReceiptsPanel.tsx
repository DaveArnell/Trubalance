import { useMemo } from 'react'
import type { AppState, ViewScope } from '../types'
import { getScopeOptionsForView } from '../utils/scope'
import type { AppActions } from '../hooks/useAppState'
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
  receipts: AppState['expectedReceipts']
  actions: Pick<AppActions, 'addReceipt' | 'updateReceipt' | 'markReceiptReceived' | 'deleteReceipt' | 'duplicateReceipt' | 'reorderReceipts'>
  openHelp: string | null
  setOpenHelp: (id: string | null) => void
}

export function ExpectedReceiptsPanel({
  state,
  viewScope,
  receipts,
  actions,
  openHelp,
  setOpenHelp,
}: ExpectedReceiptsPanelProps) {
  const options = getScopeOptionsForView(state, viewScope)
  const orderedCellIds = useMemo(() => receiptEditableCellIds(receipts), [receipts])
  const { activeCell, activate, deactivate, makeTabHandler } = useSheetCellNavigation(orderedCellIds)

  const receiptRowIds = useMemo(() => receipts.map((item) => item.id), [receipts])
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
          <button type="button" className="btn-secondary btn-tiny" onClick={addRow}>
            + Add row
          </button>
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
                  <SheetDragHeader />
                  <ResizableSheetHeader columnIndex={1} onResizeStart={startResize}>Name</ResizableSheetHeader>
                  <ResizableSheetHeader columnIndex={2} onResizeStart={startResize} className="committed-scope-col">Scope</ResizableSheetHeader>
                  <ResizableSheetHeader columnIndex={3} onResizeStart={startResize}>Timing</ResizableSheetHeader>
                  <ResizableSheetHeader columnIndex={4} onResizeStart={startResize}>Expected</ResizableSheetHeader>
                  <ResizableSheetHeader columnIndex={5} onResizeStart={startResize}>Accrual from</ResizableSheetHeader>
                  <ResizableSheetHeader columnIndex={6} onResizeStart={startResize} className="sheet-num">Amount</ResizableSheetHeader>
                  <ResizableSheetHeader columnIndex={7} onResizeStart={startResize} className="sheet-actions" />
                </tr>
              </thead>
              <tbody>
                {receipts.length === 0 ? (
                  <tr className="sheet-empty-row">
                    <td colSpan={8} className="sheet-empty-cell">
                      No expected receipts in this view. Use + Add row.
                    </td>
                  </tr>
                ) : (
                  receipts.map((item, index) => {
                  const rowProps = receiptReorder.getRowProps(item.id, index)
                  return (
                  <tr key={item.id} {...rowProps}>
                    <SheetDragCell rowId={item.id} getHandleProps={receiptReorder.getHandleProps} />
                    <InlineTextCell
                      cellId={`${item.id}-name`}
                      value={item.name}
                      isActive={activeCell === `${item.id}-name`}
                      placeholder="Name"
                      onActivate={() => activate(`${item.id}-name`)}
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
                      isActive={activeCell === `${item.id}-scope`}
                      onActivate={() => activate(`${item.id}-scope`)}
                      onDeactivate={deactivate}
                      onChange={(scopeLevel, scopeId) =>
                        actions.updateReceipt(item.id, { scopeLevel, scopeId })
                      }
                      onTab={makeTabHandler(`${item.id}-scope`)}
                    />
                    <td className="sheet-select-cell">
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
                    </td>
                    <InlineTextCell
                      cellId={`${item.id}-expected`}
                      value={item.expectedDate ?? ''}
                      isActive={activeCell === `${item.id}-expected`}
                      placeholder="e.g. 31 Jul"
                      onActivate={() => activate(`${item.id}-expected`)}
                      onDeactivate={deactivate}
                      onSave={(expectedDate) =>
                        actions.updateReceipt(item.id, { expectedDate: expectedDate || undefined })
                      }
                      onTab={makeTabHandler(`${item.id}-expected`)}
                    />
                    <InlineTextCell
                      cellId={`${item.id}-accrual-start`}
                      value={item.accrualStartDate ?? ''}
                      isActive={activeCell === `${item.id}-accrual-start`}
                      placeholder={item.receiptTiming === 'accrual' ? 'e.g. 1 Jul' : '—'}
                      onActivate={() => activate(`${item.id}-accrual-start`)}
                      onDeactivate={deactivate}
                      onSave={(accrualStartDate) =>
                        actions.updateReceipt(item.id, {
                          accrualStartDate: accrualStartDate || undefined,
                        })
                      }
                      onTab={makeTabHandler(`${item.id}-accrual-start`)}
                    />
                    <InlineNumberCell
                      cellId={`${item.id}-amount`}
                      value={item.amount}
                      isActive={activeCell === `${item.id}-amount`}
                      onActivate={() => activate(`${item.id}-amount`)}
                      onDeactivate={deactivate}
                      onSave={(amount) => actions.updateReceipt(item.id, { amount })}
                      onTab={makeTabHandler(`${item.id}-amount`)}
                    />
                    <td className="sheet-actions">
                      <div className="sheet-action-group">
                        <button
                          type="button"
                          className="btn-primary btn-tiny"
                          onClick={() => actions.markReceiptReceived(item.id)}
                        >
                          Received
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
