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

export function ReferenceDateProvider({ children }: { children: ReactNode }) {
  const [simulatedDateKey, setSimulatedDateKeyState] = useState<string | null>(() => readStoredSimulatedDateKey())

  useEffect(() => {
    setReferenceDateOverride(simulatedDateKey)
  }, [simulatedDateKey])

  const setSimulatedDateKey = useCallback((key: string | null) => {
    setSimulatedDateKeyState(key)
    writeStoredSimulatedDateKey(key)
    setReferenceDateOverride(key)
  }, [])

  const clearSimulatedDate = useCallback(() => {
    setSimulatedDateKey(null)
  }, [setSimulatedDateKey])

  const value = useMemo(
    () => ({
      referenceDate: getReferenceDate(),
      referenceDateKey: getReferenceDateKey(),
      simulatedDateKey,
      isSimulated: simulatedDateKey !== null,
      setSimulatedDateKey,
      clearSimulatedDate,
    }),
    [simulatedDateKey, setSimulatedDateKey, clearSimulatedDate],
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
