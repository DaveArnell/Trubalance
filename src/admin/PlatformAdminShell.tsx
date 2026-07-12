import { Navigate, Route, Routes } from 'react-router-dom'
import { AdminAuthProvider, useAdminAuth } from '../contexts/AdminAuthContext'
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
import { VocatioAdminGate } from './pages/VocatioAdminGate'

function VocatioAdminRoutes() {
  const { isAdminReady, loading } = useAdminAuth()
  const localDev = isLocalDevMode()

  if (!localDev && !loading && !isAdminReady) {
    return <VocatioAdminGate />
  }

  if (!localDev && loading) {
    return (
      <div className="admin-gate">
        <p className="muted">Loading admin session…</p>
      </div>
    )
  }

  return (
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
  )
}

export function VocatioAdminShell() {
  return (
    <AdminAuthProvider>
      <VocatioAdminRoutes />
    </AdminAuthProvider>
  )
}

/** @deprecated Use VocatioAdminShell at /vocatio-admin */
export function PlatformAdminShell() {
  return <Navigate to="/vocatio-admin" replace />
}
