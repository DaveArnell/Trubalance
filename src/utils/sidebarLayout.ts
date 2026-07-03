const STORAGE_KEY = 'trubalance-sidebar-collapsed-v1'

export function loadSidebarCollapsed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function saveSidebarCollapsed(collapsed: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, collapsed ? '1' : '0')
  } catch {
    /* ignore */
  }
}

/** Short label for compact sidebar scope buttons. */
export function abbreviateScopeName(name: string, maxChars = 3): string {
  const trimmed = name.trim()
  if (!trimmed) return '?'

  const words = trimmed.split(/\s+/).filter(Boolean)
  if (words.length >= 2) {
    return words
      .map((word) => word[0])
      .join('')
      .slice(0, maxChars)
      .toUpperCase()
  }

  if (trimmed.length <= maxChars) return trimmed.toUpperCase()
  return trimmed.slice(0, maxChars).toUpperCase()
}
