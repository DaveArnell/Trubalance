import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { AppState, CommitmentAccruingRow, ViewScope } from '../types'
import {
  buildMonthlyCostDisplayTree,
  collectGroupIds,
} from '../utils/monthlyCostGrouping'

export function useMonthlyCostGroupCollapse(
  state: AppState,
  rows: CommitmentAccruingRow[],
  viewScope: ViewScope,
) {
  const displayTree = useMemo(
    () => buildMonthlyCostDisplayTree(state, rows, viewScope),
    [rows, state, viewScope],
  )
  const groupIds = useMemo(() => collectGroupIds(displayTree), [displayTree])
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(() => new Set())
  const knownGroupIdsRef = useRef<Set<string>>(new Set())

  useLayoutEffect(() => {
    setCollapsedGroups((prev) => {
      const activeIds = new Set(groupIds)
      const next = new Set<string>()
      let changed = false

      for (const id of groupIds) {
        if (!knownGroupIdsRef.current.has(id)) {
          knownGroupIdsRef.current.add(id)
          next.add(id)
          changed = true
        } else if (prev.has(id)) {
          next.add(id)
        }
      }

      for (const id of prev) {
        if (!activeIds.has(id)) changed = true
      }

      for (const id of knownGroupIdsRef.current) {
        if (!activeIds.has(id)) knownGroupIdsRef.current.delete(id)
      }

      if (!changed && next.size === prev.size && groupIds.every((id) => prev.has(id) === next.has(id))) {
        return prev
      }
      return next
    })
  }, [groupIds])

  const toggleGroup = useCallback((id: string) => {
    setCollapsedGroups((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const expandAllGroups = useCallback(() => {
    setCollapsedGroups(new Set())
  }, [])

  const collapseAllGroups = useCallback(() => {
    setCollapsedGroups(new Set(groupIds))
  }, [groupIds])

  const hasGroups = groupIds.length > 0
  const allExpanded = hasGroups && groupIds.every((id) => !collapsedGroups.has(id))

  return {
    displayTree,
    collapsedGroups,
    toggleGroup,
    expandAllGroups,
    collapseAllGroups,
    hasGroups,
    allExpanded,
  }
}
