import type { SheetColumnSpec } from '../hooks/useResizableSheetColumns'

const drag: SheetColumnSpec = { id: 'drag', defaultWidth: 28, minWidth: 28, resizable: false, fixed: true }
const name: SheetColumnSpec = { id: 'name', defaultWidth: 148, minWidth: 72 }
const scope: SheetColumnSpec = { id: 'scope', defaultWidth: 120, minWidth: 72 }
const dueDay: SheetColumnSpec = { id: 'due-day', defaultWidth: 72, minWidth: 52 }
const dueTiming: SheetColumnSpec = { id: 'due', defaultWidth: 88, minWidth: 64 }
const amount: SheetColumnSpec = { id: 'amount', defaultWidth: 88, minWidth: 56 }
const accrued: SheetColumnSpec = { id: 'accrued', defaultWidth: 80, minWidth: 56 }
const daily: SheetColumnSpec = { id: 'daily', defaultWidth: 72, minWidth: 56 }
const funding: SheetColumnSpec = { id: 'funding', defaultWidth: 108, minWidth: 72 }
const reserved: SheetColumnSpec = { id: 'reserved', defaultWidth: 80, minWidth: 56 }
const expected: SheetColumnSpec = { id: 'expected', defaultWidth: 104, minWidth: 72 }
const timing: SheetColumnSpec = { id: 'timing', defaultWidth: 88, minWidth: 72 }
const startCol: SheetColumnSpec = { id: 'start', defaultWidth: 96, minWidth: 72 }
const actions: SheetColumnSpec = {
  id: 'actions',
  defaultWidth: 56,
  minWidth: 44,
  resizable: true,
  fitToContainer: false,
}

export const COMMITTED_MONTHLY_COLUMNS: SheetColumnSpec[] = [
  drag,
  name,
  scope,
  dueDay,
  amount,
  accrued,
  daily,
  actions,
]

/** Hide drag + actions columns in view-only demos so headers and rows stay aligned. */
export function committedMonthlyColumnsForMode(readOnlyLayout: boolean): SheetColumnSpec[] {
  if (!readOnlyLayout) return COMMITTED_MONTHLY_COLUMNS
  return COMMITTED_MONTHLY_COLUMNS.filter((column) => column.id !== 'drag' && column.id !== 'actions')
}

export const COMMITTED_PLANNED_COLUMNS: SheetColumnSpec[] = [
  drag,
  name,
  scope,
  expected,
  amount,
  funding,
  reserved,
  actions,
]

export const DUE_COLUMNS: SheetColumnSpec[] = [drag, name, scope, dueTiming, amount, funding, actions]

export const RECEIPTS_COLUMNS: SheetColumnSpec[] = [drag, name, scope, timing, startCol, expected, amount, actions]
