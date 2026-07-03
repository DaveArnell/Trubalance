import type { ReactNode, RefObject } from 'react'
import { useRef } from 'react'
import { useTablePreferences } from '../contexts/TablePreferencesContext'
import type { SheetColumnSpec } from '../hooks/useResizableSheetColumns'
import { useResizableSheetColumns } from '../hooks/useResizableSheetColumns'
import { tablePreferenceClasses } from '../utils/tablePreferences'
import { SheetColGroup, ResizableSheetHeader, sheetTableWidthStyle } from './SheetResizableTable'

export type PlatformSheetContext = {
  wrapRef: RefObject<HTMLDivElement | null>
  widths: number[]
  startResize: (columnIndex: number, startX: number) => void
  prefClasses: string
}

/** Maps sheet column-storage keys to widget ids used for per-widget table prefs. */
const PREFERENCE_SCOPE_BY_STORAGE: Record<string, string> = {
  'committed-monthly': 'committed-funds',
  due: 'due',
  'expected-receipts': 'expected-receipts',
}

export function PlatformSheetWrap({
  storageKey,
  columns,
  preferenceScope,
  children,
}: {
  storageKey: string
  columns: SheetColumnSpec[]
  preferenceScope?: string
  children: (ctx: PlatformSheetContext) => ReactNode
}) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const { widths, startResize } = useResizableSheetColumns(wrapRef, columns, storageKey)
  const scope = preferenceScope ?? PREFERENCE_SCOPE_BY_STORAGE[storageKey] ?? storageKey
  const { preferences } = useTablePreferences(scope)
  const prefClasses = tablePreferenceClasses(preferences, scope)

  return (
    <div ref={wrapRef} className={`sheet-wrap sheet-wrap--platform table-pref-surface ${prefClasses}`}>
      {children({ wrapRef, widths, startResize, prefClasses })}
    </div>
  )
}

export function PlatformSheetTable({
  widths,
  preferenceClasses,
  children,
}: {
  widths: number[]
  preferenceClasses?: string
  children: ReactNode
}) {
  return (
    <table
      className={`sheet-table sheet-table-list sheet-table-dense sheet-table-platform table-pref-table${preferenceClasses ? ` ${preferenceClasses}` : ''}`}
      style={sheetTableWidthStyle(widths)}
    >
      <SheetColGroup widths={widths} />
      {children}
    </table>
  )
}

export { ResizableSheetHeader }
