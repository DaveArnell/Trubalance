export type AdminNavId =
  | 'overview'
  | 'user-health'
  | 'users'
  | 'subscriptions'
  | 'payments'
  | 'product-analytics'
  | 'support'
  | 'email-templates'
  | 'notifications'
  | 'qr-codes'
  | 'reports'
  | 'settings'
  | 'audit'
  | 'developer'

export interface AdminNavItem {
  id: AdminNavId
  label: string
  path: string
  icon: string
  section?: 'main' | 'system'
}

export const ADMIN_NAV: AdminNavItem[] = [
  { id: 'overview', label: 'Platform Overview', path: '/vocatio-admin', icon: '◉', section: 'main' },
  { id: 'user-health', label: 'User Health', path: '/vocatio-admin/user-health', icon: '♥', section: 'main' },
  { id: 'users', label: 'Users', path: '/vocatio-admin/users', icon: '◎', section: 'main' },
  { id: 'subscriptions', label: 'Subscriptions', path: '/vocatio-admin/subscriptions', icon: '▣', section: 'main' },
  { id: 'payments', label: 'Payments', path: '/vocatio-admin/payments', icon: '£', section: 'main' },
  { id: 'product-analytics', label: 'Product Analytics', path: '/vocatio-admin/product-analytics', icon: '↗', section: 'main' },
  { id: 'support', label: 'Support', path: '/vocatio-admin/support', icon: '?', section: 'main' },
  { id: 'email-templates', label: 'Email Templates', path: '/vocatio-admin/email-templates', icon: '✉', section: 'main' },
  { id: 'notifications', label: 'Notifications', path: '/vocatio-admin/notifications', icon: '◈', section: 'main' },
  { id: 'qr-codes', label: 'QR Codes', path: '/vocatio-admin/qr-codes', icon: '▦', section: 'main' },
  { id: 'reports', label: 'Reports', path: '/vocatio-admin/reports', icon: '▤', section: 'main' },
  { id: 'settings', label: 'Platform Settings', path: '/vocatio-admin/settings', icon: '⚙', section: 'system' },
  { id: 'audit', label: 'Audit Log', path: '/vocatio-admin/audit', icon: '◷', section: 'system' },
  { id: 'developer', label: 'Developer Tools', path: '/vocatio-admin/developer', icon: '⌘', section: 'system' },
]

export function adminNavItemForPath(pathname: string): AdminNavItem {
  const exact = ADMIN_NAV.find((item) => item.path === pathname)
  if (exact) return exact
  if (pathname.startsWith('/vocatio-admin/users')) {
    return ADMIN_NAV.find((item) => item.id === 'users')!
  }
  if (pathname.startsWith('/vocatio-admin/user-health')) {
    return ADMIN_NAV.find((item) => item.id === 'user-health')!
  }
  const prefix = [...ADMIN_NAV]
    .filter((item) => item.path !== '/vocatio-admin')
    .sort((a, b) => b.path.length - a.path.length)
    .find((item) => pathname.startsWith(item.path))
  return prefix ?? ADMIN_NAV[0]!
}
