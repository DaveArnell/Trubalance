import { useCallback, useEffect, useMemo, useState } from 'react'
import type { PageId } from '../navigation'
import {
  loadNavOrder,
  loadPlannerNavOrder,
  resetNavOrder,
  resetPlannerNavOrder,
  saveNavOrder,
  savePlannerNavOrder,
} from '../utils/navLayout'

export function useNavLayout(plannerIds: string[]) {
  const [order, setOrder] = useState<PageId[]>(() => loadNavOrder())
  const [plannerOrder, setPlannerOrder] = useState<string[]>(() => loadPlannerNavOrder(plannerIds))

  useEffect(() => {
    setPlannerOrder((prev) => {
      const merged = loadPlannerNavOrder(plannerIds)
      if (prev.length === merged.length && prev.every((id, i) => id === merged[i])) return prev
      return merged
    })
  }, [plannerIds])

  const persist = useCallback((next: PageId[]) => {
    setOrder(next)
    saveNavOrder(next)
  }, [])

  const persistPlanners = useCallback((next: string[]) => {
    setPlannerOrder(next)
    savePlannerNavOrder(next)
  }, [])

  const moveItem = useCallback(
    (pageId: PageId, targetIndex: number) => {
      const fromIndex = order.indexOf(pageId)
      if (fromIndex < 0 || fromIndex === targetIndex) return

      const next = [...order]
      const [moved] = next.splice(fromIndex, 1)
      next.splice(targetIndex, 0, moved)
      persist(next)
    },
    [order, persist],
  )

  const movePlannerItem = useCallback(
    (plannerId: string, targetIndex: number) => {
      const fromIndex = plannerOrder.indexOf(plannerId)
      if (fromIndex < 0 || fromIndex === targetIndex) return

      const next = [...plannerOrder]
      const [moved] = next.splice(fromIndex, 1)
      next.splice(targetIndex, 0, moved)
      persistPlanners(next)
    },
    [plannerOrder, persistPlanners],
  )

  const resetLayout = useCallback(() => {
    const defaults = resetNavOrder()
    setOrder(defaults)
    const plannerDefaults = resetPlannerNavOrder(plannerIds)
    setPlannerOrder(plannerDefaults)
  }, [plannerIds])

  const orderedPlannerIds = useMemo(() => {
    const ordered = plannerOrder.filter((id) => plannerIds.includes(id))
    for (const id of plannerIds) {
      if (!ordered.includes(id)) ordered.push(id)
    }
    return ordered
  }, [plannerOrder, plannerIds])

  return {
    order,
    orderedPlannerIds,
    moveItem,
    movePlannerItem,
    resetLayout,
  }
}
