import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AdminAuthProvider, useAdminAuth } from '../contexts/AdminAuthContext'
import { isLocalDevMode } from '../lib/devMode'
import { AdminLayout } from './components/AdminLayout'
import { AdminAuditLogPage } from './pages/AdminAuditLogPage'
import { AdminAcquisitionFunnelPage } from './pages/AdminAcquisitionFunnelPage'
import { AdminCampaignsPage } from './pages/AdminCampaignsPage'
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
import { PlatformAdminGate } from './pages/VocatioAdminGate'

function AdminRoutes() {
  const { isAdminReady, loading } = useAdminAuth()
  const localDev = isLocalDevMode()

  if (!localDev && !loading && !isAdminReady) {
    return <PlatformAdminGate />
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
        <Route path="acquisition-funnel" element={<AdminAcquisitionFunnelPage />} />
        <Route path="product-analytics" element={<AdminProductAnalyticsPage />} />
        <Route path="analytics" element={<AdminProductAnalyticsPage />} />
        <Route path="campaigns" element={<AdminCampaignsPage />} />
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

export function PlatformAdminShell() {
  return (
    <AdminAuthProvider>
      <AdminRoutes />
    </AdminAuthProvider>
  )
}

/** @deprecated Alias — use PlatformAdminShell */
export function VocatioAdminShell() {
  return <PlatformAdminShell />
}

/** Old bookmarks: /vocatio-admin → /platform-admin */
export function LegacyVocatioAdminRedirect() {
  const location = useLocation()
  const rest = location.pathname.replace(/^\/vocatio-admin/, '') || ''
  return <Navigate to={`/platform-admin${rest}${location.search}`} replace />
}
