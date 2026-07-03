import type { AppState, CommitmentAccruingRow, ScopeLevel, ViewScope } from '../types'
import { getScopeItemLabel } from './scope'

export type MonthlyCostLeaf = {
  type: 'leaf'
  row: CommitmentAccruingRow
}

export type MonthlyCostScopeGroup = {
  type: 'scope-group'
  id: string
  label: string
  scopeLevel: ScopeLevel
  subtitle: string
  children: MonthlyCostLeaf[]
  monthlyTotal: number
  accruedTotal: number
}

export type MonthlyCostNameGroup = {
  type: 'name-group'
  id: string
  name: string
  subtitle: string
  children: Array<MonthlyCostScopeGroup | MonthlyCostLeaf>
  monthlyTotal: number
  accruedTotal: number
}

export type MonthlyCostDisplayNode = MonthlyCostLeaf | MonthlyCostNameGroup
export type MonthlyCostGroupNode = MonthlyCostNameGroup | MonthlyCostScopeGroup

export type FlatMonthlyCostRow =
  | { kind: 'group'; node: MonthlyCostGroupNode; depth: number }
  | {
      kind: 'leaf'
      row: CommitmentAccruingRow
      depth: number
    }

function normalizeName(name: string) {
  return name.trim().toLowerCase()
}

function sumTotals(rows: CommitmentAccruingRow[]) {
  return {
    monthlyTotal: rows.reduce((sum, row) => sum + row.commitment.amount, 0),
    accruedTotal: rows.reduce((sum, row) => sum + row.accruedAmount, 0),
  }
}

function getScopeBucket(
  state: AppState,
  row: CommitmentAccruingRow,
): { key: string; label: string; level: ScopeLevel } {
  const { scopeLevel, scopeId } = row.commitment

  if (scopeLevel === 'venue') {
    const businessId = state.venues.find((venue) => venue.id === scopeId)?.businessId
    if (businessId) {
      const business = state.businesses.find((entry) => entry.id === businessId)
      return {
        key: `business:${businessId}`,
        label: business?.name ?? 'Business',
        level: 'business',
      }
    }
  }

  return {
    key: `${scopeLevel}:${scopeId}`,
    label: getScopeItemLabel(state, scopeLevel, scopeId),
    level: scopeLevel,
  }
}

function accountSubtitle(count: number, level: ScopeLevel) {
  if (level === 'venue') return count === 1 ? '1 venue' : `${count} venues`
  if (level === 'business') return count === 1 ? '1 account' : `${count} accounts`
  return count === 1 ? '1 scope' : `${count} scopes`
}

function buildNameGroupChildren(
  state: AppState,
  nameKey: string,
  rows: CommitmentAccruingRow[],
  orderIndex: Map<string, number>,
  viewScope: ViewScope,
): Array<MonthlyCostScopeGroup | MonthlyCostLeaf> {
  const scopeBuckets = new Map<
    string,
    { label: string; level: ScopeLevel; rows: CommitmentAccruingRow[] }
  >()

  for (const row of rows) {
    const bucket = getScopeBucket(state, row)
    const existing = scopeBuckets.get(bucket.key) ?? {
      label: bucket.label,
      level: bucket.level,
      rows: [],
    }
    existing.rows.push(row)
    scopeBuckets.set(bucket.key, existing)
  }

  const entries = [...scopeBuckets.entries()].sort((a, b) => {
    const minOrder = (bucket: typeof a[1]) =>
      Math.min(...bucket.rows.map((row) => orderIndex.get(row.commitment.id) ?? 0))
    const aGrouped = a[1].rows.length > 1 ? 0 : 1
    const bGrouped = b[1].rows.length > 1 ? 0 : 1
    if (aGrouped !== bGrouped) return aGrouped - bGrouped
    return minOrder(a[1]) - minOrder(b[1])
  })
  const children: Array<MonthlyCostScopeGroup | MonthlyCostLeaf> = []
  const useBusinessGrouping = viewScope.type === 'group' && entries.length > 1

  for (const [scopeKey, bucket] of entries) {
    const sortedRows = [...bucket.rows].sort(
      (a, b) => (orderIndex.get(a.commitment.id) ?? 0) - (orderIndex.get(b.commitment.id) ?? 0),
    )

    if (!useBusinessGrouping) {
      for (const row of sortedRows) {
        children.push({ type: 'leaf', row })
      }
      continue
    }

    const needsScopeGroup = sortedRows.length > 1

    if (!needsScopeGroup) {
      children.push({ type: 'leaf', row: sortedRows[0]! })
      continue
    }

    const venueRows = sortedRows.every((row) => row.commitment.scopeLevel === 'venue')
    children.push({
      type: 'scope-group',
      id: `scope:${nameKey}:${scopeKey}`,
      label: bucket.label,
      scopeLevel: bucket.level,
      subtitle: accountSubtitle(sortedRows.length, venueRows ? 'venue' : bucket.level),
      children: sortedRows.map((row) => ({ type: 'leaf', row })),
      ...sumTotals(sortedRows),
    })
  }

  return children
}

/**
 * Same cost name → collapsible group (e.g. Wages).
 * Under that, group by business/account, then show venue rows underneath.
 */
export function buildMonthlyCostDisplayTree(
  state: AppState,
  rows: CommitmentAccruingRow[],
  viewScope: ViewScope,
): MonthlyCostDisplayNode[] {
  if (rows.length === 0) return []

  const orderIndex = new Map(rows.map((row, index) => [row.commitment.id, index]))
  const buckets = new Map<string, CommitmentAccruingRow[]>()

  for (const row of rows) {
    const key = normalizeName(row.commitment.name)
    const bucket = buckets.get(key) ?? []
    bucket.push(row)
    buckets.set(key, bucket)
  }

  const nodes: MonthlyCostDisplayNode[] = []

  for (const [, groupRows] of buckets) {
    if (groupRows.length === 1) {
      nodes.push({ type: 'leaf', row: groupRows[0]! })
      continue
    }

    const sortedRows = [...groupRows].sort(
      (a, b) => (orderIndex.get(a.commitment.id) ?? 0) - (orderIndex.get(b.commitment.id) ?? 0),
    )
    const name = sortedRows[0]!.commitment.name
    const nameKey = normalizeName(name)
    const children = buildNameGroupChildren(state, nameKey, sortedRows, orderIndex, viewScope)

    nodes.push({
      type: 'name-group',
      id: `name:${nameKey}`,
      name,
      subtitle: accountSubtitle(sortedRows.length, 'business'),
      children,
      ...sumTotals(sortedRows),
    })
  }

  return nodes.sort((a, b) => {
    const aGrouped = a.type === 'name-group' ? 0 : 1
    const bGrouped = b.type === 'name-group' ? 0 : 1
    if (aGrouped !== bGrouped) return aGrouped - bGrouped

    const indexA =
      a.type === 'leaf'
        ? orderIndex.get(a.row.commitment.id) ?? 0
        : orderIndex.get(
            a.children.find((child) => child.type === 'leaf')?.row.commitment.id ??
              (a.children[0]?.type === 'scope-group'
                ? a.children[0].children[0]?.row.commitment.id
                : undefined) ??
              '',
          ) ?? 0
    const indexB =
      b.type === 'leaf'
        ? orderIndex.get(b.row.commitment.id) ?? 0
        : orderIndex.get(
            b.children.find((child) => child.type === 'leaf')?.row.commitment.id ??
              (b.children[0]?.type === 'scope-group'
                ? b.children[0].children[0]?.row.commitment.id
                : undefined) ??
              '',
          ) ?? 0
    return indexA - indexB
  })
}

export function collectGroupIds(nodes: MonthlyCostDisplayNode[]): string[] {
  const ids: string[] = []

  function walkNameGroup(node: MonthlyCostNameGroup) {
    ids.push(node.id)
    for (const child of node.children) {
      if (child.type === 'scope-group') ids.push(child.id)
    }
  }

  for (const node of nodes) {
    if (node.type === 'name-group') walkNameGroup(node)
  }

  return ids
}

export function flattenMonthlyCostTree(
  nodes: MonthlyCostDisplayNode[],
  collapsed: Set<string>,
  depth = 0,
): FlatMonthlyCostRow[] {
  const collapsedIds = collapsed instanceof Set ? collapsed : new Set<string>()
  const flat: FlatMonthlyCostRow[] = []

  for (const node of nodes) {
    if (node.type === 'leaf') {
      flat.push({ kind: 'leaf', row: node.row, depth })
      continue
    }

    flat.push({ kind: 'group', node, depth })
    if (!collapsedIds.has(node.id)) {
      for (const child of node.children) {
        if (child.type === 'leaf') {
          flat.push({ kind: 'leaf', row: child.row, depth: depth + 1 })
          continue
        }

        if (collapsedIds.has(child.id)) {
          flat.push({ kind: 'group', node: child, depth: depth + 1 })
          continue
        }

        for (const leaf of child.children) {
          flat.push({
            kind: 'leaf',
            row: leaf.row,
            depth: depth + 1,
          })
        }
      }
    }
  }

  return flat
}

export function getScopeLabelForRow(state: AppState, row: CommitmentAccruingRow): string {
  const { scopeLevel, scopeId } = row.commitment
  return getScopeItemLabel(state, scopeLevel, scopeId)
}
