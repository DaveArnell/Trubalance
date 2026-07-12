import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useEditReadOnly } from '../hooks/useEditReadOnly'
import { setDisplayCurrency } from '../utils/format'
import {
  applyGlobalTablePreferenceClasses,
  getEffectiveTablePreferences,
  loadTablePreferences,
  saveTablePreferences,
  type TablePreferences,
  type TablePreferencesStore,
} from '../utils/tablePreferences'

interface TablePreferencesContextValue {
  getPreferences: (widgetId?: string) => TablePreferences
  setGlobalPreferences: (patch: Partial<TablePreferences>) => void
  setWidgetPreferences: (widgetId: string, patch: Partial<TablePreferences>) => void
  clearWidgetPreferences: (widgetId: string) => void
  globalPreferences: TablePreferences
}

const TablePreferencesContext = createContext<TablePreferencesContextValue | null>(null)

export function TablePreferencesProvider({ children }: { children: ReactNode }) {
  const editReadOnly = useEditReadOnly()
  const [store, setStore] = useState<TablePreferencesStore>(() => {
    const loaded = loadTablePreferences()
    setDisplayCurrency(loaded.global.currency)
    return loaded
  })

  useEffect(() => {
    applyGlobalTablePreferenceClasses(store.global)
    setDisplayCurrency(store.global.currency)
  }, [store.global])

  const value = useMemo<TablePreferencesContextValue>(
    () => ({
      globalPreferences: store.global,
      getPreferences: (widgetId) => getEffectiveTablePreferences(store, widgetId),
      setGlobalPreferences: (patch) => {
        setStore((current) => {
          const next = { ...current, global: { ...current.global, ...patch } }
          if (!editReadOnly) saveTablePreferences(next)
          return next
        })
      },
      setWidgetPreferences: (widgetId, patch) => {
        setStore((current) => {
          const next = {
            ...current,
            widgets: {
              ...current.widgets,
              [widgetId]: { ...current.widgets[widgetId], ...patch },
            },
          }
          if (!editReadOnly) saveTablePreferences(next)
          return next
        })
      },
      clearWidgetPreferences: (widgetId) => {
        setStore((current) => {
          const widgets = { ...current.widgets }
          delete widgets[widgetId]
          const next = { ...current, widgets }
          if (!editReadOnly) saveTablePreferences(next)
          return next
        })
      },
    }),
    [editReadOnly, store],
  )

  return <TablePreferencesContext.Provider value={value}>{children}</TablePreferencesContext.Provider>
}

export function useTablePreferences(widgetId?: string) {
  const ctx = useContext(TablePreferencesContext)
  if (!ctx) {
    throw new Error('useTablePreferences must be used within TablePreferencesProvider')
  }
  return {
    ...ctx,
    preferences: ctx.getPreferences(widgetId),
  }
}

