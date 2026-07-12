import { useCallback, useState } from 'react'
import { useEditReadOnly } from '../hooks/useEditReadOnly'

export type OverviewSize = 'default' | 'detailed'

const STORAGE_KEY = 'trubalance-overview-size'
const LEGACY_COMPACT_KEY = 'trubalance-overview-compact'

function readStoredSize(): OverviewSize {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'default' || stored === 'detailed') {
      return stored
    }
    if (stored === 'expanded') return 'detailed'
    if (stored === 'compact' || stored === 'standard') return 'default'
    if (localStorage.getItem(LEGACY_COMPACT_KEY) === '1') {
      return 'default'
    }
  } catch {
    /* ignore */
  }
  return 'default'
}

export function useOverviewSize() {
  const editReadOnly = useEditReadOnly()
  const [size, setSize] = useState<OverviewSize>(() => (editReadOnly ? 'default' : readStoredSize()))

  const setOverviewSize = useCallback(
    (next: OverviewSize) => {
      if (editReadOnly) return
      setSize(next)
      try {
        localStorage.setItem(STORAGE_KEY, next)
        localStorage.setItem(LEGACY_COMPACT_KEY, '0')
      } catch {
        /* ignore */
      }
    },
    [editReadOnly],
  )

  return { size, setOverviewSize, editReadOnly }
}

