import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { WorkspaceProvider } from './contexts/WorkspaceContext'
import { TrailingSlashGuard } from './components/TrailingSlashGuard'
import { ForgotPasswordPage, LoginPage, ResetPasswordPage } from './pages/AuthPages'
import { AppPage } from './pages/AppPage'
import { PlatformAdminShell, LegacyVocatioAdminRedirect } from './admin/PlatformAdminShell'
import { isSupabaseConfigured } from './lib/supabase'

/** Private personal app: marketing and signup are closed; entry is login only. */
function RedirectToLogin() {
  return <Navigate to="/login" replace />
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <TrailingSlashGuard />
      <AuthProvider>
        <WorkspaceProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/app/*" element={<AppPage />} />
            <Route path="/platform-admin/*" element={<PlatformAdminShell />} />
            <Route path="/vocatio-admin/*" element={<LegacyVocatioAdminRedirect />} />
            <Route path="/" element={<RedirectToLogin />} />
            <Route path="/signup" element={<RedirectToLogin />} />
            <Route path="/early-access" element={<RedirectToLogin />} />
            <Route path="/pricing" element={<RedirectToLogin />} />
            <Route path="/privacy" element={<RedirectToLogin />} />
            <Route path="/terms" element={<RedirectToLogin />} />
            <Route path="/how-it-works" element={<RedirectToLogin />} />
            <Route path="/habits" element={<RedirectToLogin />} />
            <Route path="/who-its-for" element={<RedirectToLogin />} />
            <Route path="/cafe-financial-management-software" element={<RedirectToLogin />} />
            <Route path="/pub-financial-management-software" element={<RedirectToLogin />} />
            <Route path="/restaurant-financial-management-software" element={<RedirectToLogin />} />
            <Route path="/soft-play-financial-management-software" element={<RedirectToLogin />} />
            <Route path="/cafes" element={<RedirectToLogin />} />
            <Route path="/cafe" element={<RedirectToLogin />} />
            <Route path="/cafes-coffee-shops" element={<RedirectToLogin />} />
            <Route path="/see-how-it-works" element={<RedirectToLogin />} />
            <Route path="/contact" element={<RedirectToLogin />} />
            <Route path="/try-it" element={<RedirectToLogin />} />
            <Route path="/partners" element={<RedirectToLogin />} />
            <Route path="/cash-prophet" element={<RedirectToLogin />} />
            <Route path="/true-balance-method" element={<RedirectToLogin />} />
            <Route path="/blog" element={<RedirectToLogin />} />
            <Route path="/blog/:slug" element={<RedirectToLogin />} />
            <Route path="/demo" element={<RedirectToLogin />} />
            <Route path="/demo/:scenarioId" element={<RedirectToLogin />} />
            <Route
              path="*"
              element={<Navigate to={isSupabaseConfigured ? '/login' : '/app'} replace />}
            />
          </Routes>
        </WorkspaceProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
