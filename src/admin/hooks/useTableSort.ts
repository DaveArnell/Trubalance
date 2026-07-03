import { useCallback, useMemo, useState } from 'react'

export type SortDirection = 'asc' | 'desc'

export interface SortState<K extends string> {
  key: K
  direction: SortDirection
}

function compareValues(a: unknown, b: unknown, direction: SortDirection): number {
  const mul = direction === 'asc' ? 1 : -1

  if (a == null && b == null) return 0
  if (a == null) return 1 * mul
  if (b == null) return -1 * mul

  if (typeof a === 'number' && typeof b === 'number') {
    return (a - b) * mul
  }

  if (typeof a === 'string' && typeof b === 'string') {
    const aDate = /^\d{4}-\d{2}-\d{2}/.test(a) ? Date.parse(a) : NaN
    const bDate = /^\d{4}-\d{2}-\d{2}/.test(b) ? Date.parse(b) : NaN
    if (!Number.isNaN(aDate) && !Number.isNaN(bDate)) {
      return (aDate - bDate) * mul
    }
    return a.localeCompare(b, undefined, { sensitivity: 'base' }) * mul
  }

  return String(a).localeCompare(String(b), undefined, { sensitivity: 'base' }) * mul
}

export function useTableSort<K extends string>(defaultKey: K, defaultDirection: SortDirection = 'asc') {
  const [sort, setSort] = useState<SortState<K>>({ key: defaultKey, direction: defaultDirection })

  const toggleSort = useCallback((key: K) => {
    setSort((current) =>
      current.key === key
        ? { key, direction: current.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'asc' },
    )
  }, [])

  const sortRows = useCallback(
    <T>(rows: T[], accessor: (row: T, key: K) => unknown): T[] => {
      const { key, direction } = sort
      return [...rows].sort((a, b) => compareValues(accessor(a, key), accessor(b, key), direction))
    },
    [sort],
  )

  return useMemo(
    () => ({
      sortKey: sort.key,
      sortDirection: sort.direction,
      toggleSort,
      sortRows,
    }),
    [sort, toggleSort, sortRows],
  )
}
