import { useCallback, useState } from 'react'
import { loadSidebarCollapsed, saveSidebarCollapsed } from '../utils/sidebarLayout'

export function useSidebarCollapsed() {
  const [collapsed, setCollapsed] = useState(loadSidebarCollapsed)

  const toggleCollapsed = useCallback(() => {
    setCollapsed((current) => {
      const next = !current
      saveSidebarCollapsed(next)
      return next
    })
  }, [])

  return { collapsed, toggleCollapsed, setCollapsed }
}
