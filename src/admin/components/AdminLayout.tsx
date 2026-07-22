import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useAdminAuth } from '../../contexts/AdminAuthContext'
import { isSupabaseConfigured } from '../../lib/supabase'
import { usePageMeta } from '../../hooks/usePageMeta'
import { ADMIN_NAV } from '../navigation'
import { AdminDataModeBanner } from './AdminUi'
import { getAdminDataMode, setAdminDataMode, type AdminDataMode } from '../services/adminDemoMode'
import '../admin.css'

export function AdminLayout() {
  usePageMeta({
    title: 'Platform admin',
    description: 'Cash Prophet platform administration.',
    path: '/vocatio-admin',
    noindex: true,
  })
  const { signOut } = useAuth()
  const { logoutAdmin, email, expiresAt } = useAdminAuth()
  const supabaseConnected = isSupabaseConfigured
  const [dataMode, setDataMode] = useState<AdminDataMode>(getAdminDataMode)

  useEffect(() => {
    const onModeChange = () => setDataMode(getAdminDataMode())
    window.addEventListener('admin-data-mode-change', onModeChange)
    return () => window.removeEventListener('admin-data-mode-change', onModeChange)
  }, [])

  const handleModeChange = (mode: AdminDataMode) => {
    setAdminDataMode(mode)
    setDataMode(mode)
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <Link to="/vocatio-admin" className="admin-sidebar-logo">
            <span className="admin-sidebar-mark" aria-hidden />
            <span>
              <strong>Cash Prophet</strong>
              <small>Platform Admin</small>
            </span>
          </Link>
        </div>

        <nav className="admin-sidebar-nav" aria-label="Platform admin">
          <p className="admin-sidebar-section">Main</p>
          {ADMIN_NAV.filter((item) => item.section !== 'system').map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              end={item.path === '/vocatio-admin'}
              className={({ isActive }) => `admin-sidebar-link${isActive ? ' admin-sidebar-link--active' : ''}`}
            >
              <span className="admin-sidebar-icon" aria-hidden>
                {item.icon}
              </span>
              {item.label}
            </NavLink>
          ))}

          <p className="admin-sidebar-section">System</p>
          {ADMIN_NAV.filter((item) => item.section === 'system').map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              className={({ isActive }) => `admin-sidebar-link${isActive ? ' admin-sidebar-link--active' : ''}`}
            >
              <span className="admin-sidebar-icon" aria-hidden>
                {item.icon}
              </span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar-foot">
          {email && (
            <p className="admin-sidebar-session muted">
              {email}
              {expiresAt ? ` · session until ${new Date(expiresAt).toLocaleTimeString()}` : ''}
            </p>
          )}
          <Link to="/app" className="admin-sidebar-link admin-sidebar-link--muted">
            ← Open app
          </Link>
          {supabaseConnected && (
            <>
              <button
                type="button"
                className="admin-sidebar-link admin-sidebar-link--button"
                onClick={() => void logoutAdmin()}
              >
                End admin session
              </button>
              <button type="button" className="admin-sidebar-link admin-sidebar-link--button" onClick={() => signOut()}>
                Log out completely
              </button>
            </>
          )}
        </div>
      </aside>

      <div className="admin-main">
        <AdminDataModeBanner
          mode={dataMode}
          onModeChange={handleModeChange}
          supabaseConnected={supabaseConnected}
        />
        <Outlet />
      </div>
    </div>
  )
}
