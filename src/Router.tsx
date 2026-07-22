import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { CookieNotice } from './components/CookieNotice'
import { WorkspaceProvider } from './contexts/WorkspaceContext'
import { LandingPage } from './pages/LandingPage'
import { PricingPage } from './pages/PricingPage'
import { ForgotPasswordPage, LoginPage, ResetPasswordPage, SignupPage } from './pages/AuthPages'
import { PrivacyPage } from './pages/legal/PrivacyPage'
import { TermsPage } from './pages/legal/TermsPage'
import { AppPage } from './pages/AppPage'
import { DemoPage } from './pages/DemoPage'
import { HowItWorksPage } from './pages/HowItWorksPage'
import { HabitsPage } from './pages/HabitsPage'
import { WhoItsForPage } from './pages/WhoItsForPage'
import { SeeHowItWorksPage } from './pages/SeeHowItWorksPage'
import { TrueBalanceMethodPage } from './pages/TrueBalanceMethodPage'
import { BlogIndexPage } from './pages/BlogIndexPage'
import { BlogPostPage } from './pages/BlogPostPage'
import { VocatioAdminShell, PlatformAdminShell } from './admin/PlatformAdminShell'
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
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            <Route path="/habits" element={<HabitsPage />} />
            <Route path="/who-its-for" element={<WhoItsForPage />} />
            <Route path="/see-how-it-works" element={<SeeHowItWorksPage />} />
            <Route path="/cash-prophet" element={<TrueBalanceMethodPage />} />
            <Route path="/true-balance-method" element={<Navigate to="/cash-prophet" replace />} />
            <Route path="/blog" element={<BlogIndexPage />} />
            <Route path="/blog/:slug" element={<BlogPostPage />} />
            <Route path="/demo" element={<DemoPage />} />
            <Route path="/demo/:scenarioId" element={<DemoPage />} />
            <Route path="/app/*" element={<AppPage />} />
            <Route path="/vocatio-admin/*" element={<VocatioAdminShell />} />
            <Route path="/platform-admin/*" element={<PlatformAdminShell />} />
            <Route
              path="*"
              element={<Navigate to={isSupabaseConfigured ? '/' : '/app'} replace />}
            />
          </Routes>
        </WorkspaceProvider>
        <CookieNotice />
      </AuthProvider>
    </BrowserRouter>
  )
}
