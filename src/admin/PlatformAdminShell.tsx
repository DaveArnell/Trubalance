import { Navigate, Route, Routes } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { isLocalDevMode } from '../lib/devMode'
import { AdminLayout } from './components/AdminLayout'
import { AdminAuditLogPage } from './pages/AdminAuditLogPage'
import { AdminDeveloperToolsPage } from './pages/AdminDeveloperToolsPage'
import { AdminEmailTemplatesPage } from './pages/AdminEmailTemplatesPage'
import { AdminNotificationsPage } from './pages/AdminNotificationsPage'
import { AdminOverviewPage } from './pages/AdminOverviewPage'
import { AdminPaymentsPage } from './pages/AdminPaymentsPage'
import { AdminProductAnalyticsPage } from './pages/AdminProductAnalyticsPage'
import { AdminQrCodesPage } from './pages/AdminQrCodesPage'
import { AdminReportsPage } from './pages/AdminReportsPage'
import { AdminSettingsPage } from './pages/AdminSettingsPage'
import { AdminSubscriptionsPage } from './pages/AdminSubscriptionsPage'
import { AdminSupportPage } from './pages/AdminSupportPage'
import { AdminUserDetailPage } from './pages/AdminUserDetailPage'
import { AdminUserHealthPage } from './pages/AdminUserHealthPage'
import { AdminUsersPage } from './pages/AdminUsersPage'

function AdminAccessGate({ children }: { children: ReactNode }) {
  const { configured, loading, user, isAdmin } = useAuth()
  const localDev = isLocalDevMode()

  if (!configured && !localDev) {
    return (
      <div className="admin-gate">
        <div className="auth-card">
          <h1>Platform admin</h1>
          <p className="muted">Configure Supabase in <code>.env.local</code> to enable the admin panel.</p>
          <a href="/" className="btn-secondary">
            ← Home
          </a>
        </div>
      </div>
    )
  }

  if (!localDev && loading) {
    return (
      <div className="admin-gate">
        <p className="muted">Loading…</p>
      </div>
    )
  }

  if (!localDev && !user) {
    return <Navigate to="/login?redirect=/platform-admin" replace />
  }

  if (!localDev && !isAdmin) {
    return (
      <div className="admin-gate">
        <div className="auth-card">
          <h1>Access denied</h1>
          <p className="muted">Your account does not have platform admin access.</p>
          <a href="/app" className="btn-secondary">
            ← Back to app
          </a>
        </div>
      </div>
    )
  }

  return children
}

export function PlatformAdminShell() {
  return (
    <AdminAccessGate>
      <Routes>
        <Route element={<AdminLayout />}>
          <Route index element={<AdminOverviewPage />} />
          <Route path="user-health" element={<AdminUserHealthPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="users/:userId" element={<AdminUserDetailPage />} />
          <Route path="subscriptions" element={<AdminSubscriptionsPage />} />
          <Route path="payments" element={<AdminPaymentsPage />} />
          <Route path="product-analytics" element={<AdminProductAnalyticsPage />} />
          <Route path="analytics" element={<AdminProductAnalyticsPage />} />
          <Route path="support" element={<AdminSupportPage />} />
          <Route path="email-templates" element={<AdminEmailTemplatesPage />} />
          <Route path="notifications" element={<AdminNotificationsPage />} />
          <Route path="qr-codes" element={<AdminQrCodesPage />} />
          <Route path="reports" element={<AdminReportsPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
          <Route path="audit" element={<AdminAuditLogPage />} />
          <Route path="developer" element={<AdminDeveloperToolsPage />} />
        </Route>
      </Routes>
    </AdminAccessGate>
  )
}
