import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  getReferenceDate,
  getReferenceDateKey,
  readStoredSimulatedDateKey,
  setReferenceDateOverride,
  writeStoredSimulatedDateKey,
} from '../utils/referenceDate'

interface ReferenceDateContextValue {
  referenceDate: Date
  referenceDateKey: string
  simulatedDateKey: string | null
  isSimulated: boolean
  setSimulatedDateKey: (key: string | null) => void
  clearSimulatedDate: () => void
}

const ReferenceDateContext = createContext<ReferenceDateContextValue | null>(null)

export function ReferenceDateProvider({
  children,
  /** When set (e.g. interactive demo), locks “today” for the whole tree. */
  forcedDateKey = null,
}: {
  children: ReactNode
  forcedDateKey?: string | null
}) {
  const [simulatedDateKey, setSimulatedDateKeyState] = useState<string | null>(() => {
    const initial = forcedDateKey ?? readStoredSimulatedDateKey()
    setReferenceDateOverride(initial)
    return initial
  })

  useEffect(() => {
    if (forcedDateKey) {
      setSimulatedDateKeyState(forcedDateKey)
      setReferenceDateOverride(forcedDateKey)
      return () => {
        const stored = readStoredSimulatedDateKey()
        setReferenceDateOverride(stored)
      }
    }
    setReferenceDateOverride(simulatedDateKey)
  }, [forcedDateKey, simulatedDateKey])

  const setSimulatedDateKey = useCallback(
    (key: string | null) => {
      if (forcedDateKey) return
      setSimulatedDateKeyState(key)
      writeStoredSimulatedDateKey(key)
      setReferenceDateOverride(key)
    },
    [forcedDateKey],
  )

  const clearSimulatedDate = useCallback(() => {
    if (forcedDateKey) return
    setSimulatedDateKey(null)
  }, [forcedDateKey, setSimulatedDateKey])

  const activeKey = forcedDateKey ?? simulatedDateKey

  const value = useMemo(
    () => ({
      referenceDate: getReferenceDate(),
      referenceDateKey: getReferenceDateKey(),
      simulatedDateKey: activeKey,
      isSimulated: activeKey !== null,
      setSimulatedDateKey,
      clearSimulatedDate,
    }),
    [activeKey, setSimulatedDateKey, clearSimulatedDate],
  )

  return <ReferenceDateContext.Provider value={value}>{children}</ReferenceDateContext.Provider>
}

export function useReferenceDate() {
  const ctx = useContext(ReferenceDateContext)
  if (!ctx) {
    throw new Error('useReferenceDate must be used within ReferenceDateProvider')
  }
  return ctx
}
