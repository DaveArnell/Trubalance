import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { AppState, CommitmentAccruingRow, ViewScope } from '../types'
import { useWorkspace } from '../contexts/WorkspaceContext'
import {
  buildMonthlyCostDisplayTree,
  collectGroupIds,
} from '../utils/monthlyCostGrouping'

export function useMonthlyCostGroupCollapse(
  state: AppState,
  rows: CommitmentAccruingRow[],
  viewScope: ViewScope,
) {
  const { workspaceId, remoteStateVersion, loading } = useWorkspace()
  const sessionKey = `${workspaceId ?? 'local'}:${remoteStateVersion}`

  const displayTree = useMemo(
    () => buildMonthlyCostDisplayTree(state, rows, viewScope),
    [rows, state, viewScope],
  )
  const groupIds = useMemo(() => collectGroupIds(displayTree), [displayTree])
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(() => new Set())
  const knownGroupIdsRef = useRef<Set<string>>(new Set())
  const sessionKeyRef = useRef<string | null>(null)

  useLayoutEffect(() => {
    if (loading) return

    setCollapsedGroups((prev) => {
      const activeIds = new Set(groupIds)
      const sessionChanged = sessionKey !== sessionKeyRef.current

      if (sessionChanged) {
        sessionKeyRef.current = sessionKey
        knownGroupIdsRef.current = new Set(groupIds)
        return new Set(groupIds)
      }

      const next = new Set(prev)
      let changed = false

      for (const id of groupIds) {
        if (!knownGroupIdsRef.current.has(id)) {
          knownGroupIdsRef.current.add(id)
          next.add(id)
          changed = true
        }
      }

      for (const id of prev) {
        if (!activeIds.has(id)) {
          next.delete(id)
          changed = true
        }
      }

      for (const id of knownGroupIdsRef.current) {
        if (!activeIds.has(id)) knownGroupIdsRef.current.delete(id)
      }

      if (!changed && next.size === prev.size && groupIds.every((id) => prev.has(id) === next.has(id))) {
        return prev
      }
      return next
    })
  }, [sessionKey, loading, groupIds])

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
