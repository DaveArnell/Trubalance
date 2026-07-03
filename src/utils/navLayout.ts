import { APP_PAGES, type PageId } from '../navigation'

const STORAGE_KEY = 'trubalance-nav-order-v1'

const DEFAULT_ORDER: PageId[] = APP_PAGES.map((page) => page.id)

export function loadNavOrder(): PageId[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return [...DEFAULT_ORDER]

    const saved = JSON.parse(raw) as string[]
    const merged: PageId[] = []

    for (const id of saved) {
      const normalized = (id === 'dashboard' ? 'committed-funds' : id) as PageId
      if (DEFAULT_ORDER.includes(normalized) && !merged.includes(normalized)) merged.push(normalized)
    }
    for (const id of DEFAULT_ORDER) {
      if (!merged.includes(id)) merged.push(id)
    }

    return merged
  } catch {
    return [...DEFAULT_ORDER]
  }
}

export function saveNavOrder(order: PageId[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(order))
  } catch {
    /* ignore quota errors */
  }
}

export function resetNavOrder(): PageId[] {
  const order = [...DEFAULT_ORDER]
  saveNavOrder(order)
  return order
}

export function getOrderedPages(order: PageId[]) {
  const byId = new Map(APP_PAGES.map((page) => [page.id, page]))
  return order.map((id) => byId.get(id)).filter((page) => page !== undefined)
}

const PLANNER_STORAGE_KEY = 'trubalance-planner-nav-order-v1'

export function mergePlannerNavOrder(saved: string[] | undefined, currentIds: string[]): string[] {
  if (!saved?.length) return [...currentIds]

  const merged: string[] = []
  for (const id of saved) {
    if (currentIds.includes(id) && !merged.includes(id)) merged.push(id)
  }
  for (const id of currentIds) {
    if (!merged.includes(id)) merged.push(id)
  }
  return merged
}

export function loadPlannerNavOrder(currentIds: string[]): string[] {
  try {
    const raw = localStorage.getItem(PLANNER_STORAGE_KEY)
    if (!raw) return [...currentIds]
    return mergePlannerNavOrder(JSON.parse(raw) as string[], currentIds)
  } catch {
    return [...currentIds]
  }
}

export function savePlannerNavOrder(order: string[]) {
  try {
    localStorage.setItem(PLANNER_STORAGE_KEY, JSON.stringify(order))
  } catch {
    /* ignore quota errors */
  }
}

export function resetPlannerNavOrder(currentIds: string[]): string[] {
  const order = [...currentIds]
  savePlannerNavOrder(order)
  return order
}
