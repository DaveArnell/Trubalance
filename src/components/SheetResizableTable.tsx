import type { ReactNode, RefObject } from 'react'
import type { SheetColumnSpec } from '../hooks/useResizableSheetColumns'
import { useResizableSheetColumns } from '../hooks/useResizableSheetColumns'
import { MONTHS } from '../utils/format'

export const RESERVE_SHEET_COLUMNS: SheetColumnSpec[] = [
  { id: 'drag', defaultWidth: 28, minWidth: 28, resizable: false, fixed: true },
  { id: 'actions', defaultWidth: 52, minWidth: 44, resizable: false, fixed: true },
  { id: 'bill', defaultWidth: 152, minWidth: 72 },
  { id: 'scope', defaultWidth: 128, minWidth: 72 },
  ...MONTHS.map((month) => ({
    id: month.toLowerCase(),
    defaultWidth: 56,
    minWidth: 36,
  })),
  { id: 'annual', defaultWidth: 72, minWidth: 52 },
  { id: 'monthly', defaultWidth: 68, minWidth: 48 },
]

export function ReserveSheetColumnSpecs(): SheetColumnSpec[] {
  return RESERVE_SHEET_COLUMNS
}

export function SheetColGroup({ widths }: { widths: number[] }) {
  return (
    <colgroup>
      {widths.map((width, index) => (
        <col key={index} style={{ width: `${width}px` }} />
      ))}
    </colgroup>
  )
}

export function sheetTableWidthStyle(widths: number[]): { width: number } {
  return { width: widths.reduce((sum, width) => sum + width, 0) }
}

export function ResizableSheetHeader({
  children,
  columnIndex,
  resizable = true,
  onResizeStart,
  className,
}: {
  children?: ReactNode
  columnIndex: number
  resizable?: boolean
  onResizeStart: (columnIndex: number, startX: number) => void
  className?: string
}) {
  return (
    <th className={className}>
      {children}
      {resizable && (
        <span
          className="sheet-col-resize-handle"
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize column"
          onMouseDown={(event) => {
            event.preventDefault()
            event.stopPropagation()
            onResizeStart(columnIndex, event.clientX)
          }}
        />
      )}
    </th>
  )
}

export function useReserveSheetColumns(containerRef: RefObject<HTMLElement | null>) {
  return useResizableSheetColumns(containerRef, RESERVE_SHEET_COLUMNS, 'reserve-planner')
}
