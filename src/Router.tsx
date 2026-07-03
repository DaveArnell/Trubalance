import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { WorkspaceProvider } from './contexts/WorkspaceContext'
import { LandingPage } from './pages/LandingPage'
import { PricingPage } from './pages/PricingPage'
import { LoginPage, SignupPage } from './pages/AuthPages'
import { PrivacyPage } from './pages/legal/PrivacyPage'
import { TermsPage } from './pages/legal/TermsPage'
import { AppPage } from './pages/AppPage'
import { PlatformAdminShell } from './admin/PlatformAdminShell'
import { isSupabaseConfigured } from './lib/supabase'

export function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <WorkspaceProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/app/*" element={<AppPage />} />
            <Route path="/platform-admin/*" element={<PlatformAdminShell />} />
            <Route
              path="*"
              element={<Navigate to={isSupabaseConfigured ? '/' : '/app'} replace />}
            />
          </Routes>
        </WorkspaceProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
