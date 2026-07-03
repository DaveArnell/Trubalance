export function sortByOrder<T>(items: T[], getOrder: (item: T) => number | undefined): T[] {
  return [...items].sort((a, b) => {
    const ao = getOrder(a) ?? Number.MAX_SAFE_INTEGER
    const bo = getOrder(b) ?? Number.MAX_SAFE_INTEGER
    if (ao !== bo) return ao - bo
    return 0
  })
}

export function reorderIds(ids: string[], fromId: string, toIndex: number): string[] {
  const fromIndex = ids.indexOf(fromId)
  if (fromIndex < 0 || fromIndex === toIndex) return ids
  const next = [...ids]
  const [moved] = next.splice(fromIndex, 1)
  next.splice(toIndex, 0, moved)
  return next
}

export function nextSortOrder(existing: Array<{ sortOrder?: number }>): number {
  const max = existing.reduce((highest, item) => Math.max(highest, item.sortOrder ?? -1), -1)
  return max + 1
}
