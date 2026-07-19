import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useEditReadOnly } from '../hooks/useEditReadOnly'
import { useMobileNav } from '../hooks/useMobileNav'

export type DashboardViewStyle = 'spreadsheet' | 'cards'
export type AccruingOrderMode = 'grouped' | 'timeline'

const VIEW_STYLE_KEY = 'trubalance-dashboard-view-style'
const ORDER_MODE_KEY = 'trubalance-accruing-order-mode'

function readViewStyle(): DashboardViewStyle {
  try {
    const raw = localStorage.getItem(VIEW_STYLE_KEY)
    if (raw === 'spreadsheet' || raw === 'cards') return raw
  } catch {
    /* ignore */
  }
  return 'spreadsheet'
}

function readOrderMode(): AccruingOrderMode {
  try {
    const raw = localStorage.getItem(ORDER_MODE_KEY)
    if (raw === 'grouped' || raw === 'timeline') return raw
  } catch {
    /* ignore */
  }
  return 'grouped'
}

interface DashboardViewPreferencesValue {
  viewStyle: DashboardViewStyle
  setViewStyle: (style: DashboardViewStyle) => void
  /** True when the dashboard should use mobile-style cards (viewport mobile or Cards preference). */
  useCards: boolean
  accruingOrderMode: AccruingOrderMode
  setAccruingOrderMode: (mode: AccruingOrderMode) => void
}

const DashboardViewPreferencesContext = createContext<DashboardViewPreferencesValue | null>(null)

export function DashboardViewPreferencesProvider({ children }: { children: ReactNode }) {
  const editReadOnly = useEditReadOnly()
  const { isMobile } = useMobileNav()
  const [viewStyle, setViewStyleState] = useState<DashboardViewStyle>(() =>
    editReadOnly ? 'spreadsheet' : readViewStyle(),
  )
  const [accruingOrderMode, setOrderModeState] = useState<AccruingOrderMode>(() =>
    editReadOnly ? 'grouped' : readOrderMode(),
  )

  const setViewStyle = useCallback(
    (style: DashboardViewStyle) => {
      if (editReadOnly) return
      setViewStyleState(style)
      try {
        localStorage.setItem(VIEW_STYLE_KEY, style)
      } catch {
        /* ignore */
      }
    },
    [editReadOnly],
  )

  const setAccruingOrderMode = useCallback(
    (mode: AccruingOrderMode) => {
      if (editReadOnly) return
      setOrderModeState(mode)
      try {
        localStorage.setItem(ORDER_MODE_KEY, mode)
      } catch {
        /* ignore */
      }
    },
    [editReadOnly],
  )

  const value = useMemo<DashboardViewPreferencesValue>(
    () => ({
      viewStyle,
      setViewStyle,
      useCards: isMobile || viewStyle === 'cards',
      accruingOrderMode,
      setAccruingOrderMode,
    }),
    [viewStyle, setViewStyle, isMobile, accruingOrderMode, setAccruingOrderMode],
  )

  return (
    <DashboardViewPreferencesContext.Provider value={value}>
      {children}
    </DashboardViewPreferencesContext.Provider>
  )
}

export function useDashboardViewPreferences() {
  const ctx = useContext(DashboardViewPreferencesContext)
  const { isMobile } = useMobileNav()
  if (!ctx) {
    return {
      viewStyle: 'spreadsheet' as const,
      setViewStyle: (_style: DashboardViewStyle) => {},
      useCards: isMobile,
      accruingOrderMode: 'grouped' as const,
      setAccruingOrderMode: (_mode: AccruingOrderMode) => {},
    }
  }
  return ctx
}
