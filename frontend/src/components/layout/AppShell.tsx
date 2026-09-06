import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { DesktopSidebar, DesktopTopBar, MobileBottomNav } from '../navigation'

// ================================================
// OWNER APP SHELL
// ================================================

export function OwnerShell() {
  const { isAuthenticated, isOwner, isLoading } = useAuth()

  if (isLoading) return <PageLoader />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!isOwner) return <Navigate to="/tenant/dashboard" replace />

  return (
    <div className="app-shell-root">
      {/* Desktop: sidebar */}
      <DesktopSidebar />

      {/* Main Viewport */}
      <div className="app-main-viewport">
        <DesktopTopBar />
        <main className="app-content-area">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="mobile-only">
        <MobileBottomNav role="owner" />
      </div>
    </div>
  )
}

// ================================================
// TENANT APP SHELL
// ================================================

export function TenantShell() {
  const { isAuthenticated, isTenant, isLoading } = useAuth()

  if (isLoading) return <PageLoader />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!isTenant) return <Navigate to="/owner/dashboard" replace />

  return (
    <div className="app-shell-root">
      {/* Desktop sidebar */}
      <DesktopSidebar role="tenant" />

      {/* Main Viewport */}
      <div className="app-main-viewport">
        <DesktopTopBar />
        <main className="app-content-area">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="mobile-only">
        <MobileBottomNav role="tenant" />
      </div>
    </div>
  )
}

// ================================================
// PAGE LOADER (Native Splash Style)
// ================================================

export function PageLoader() {
  return (
    <div style={{ minHeight: '100vh', background: 'rgb(var(--background))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: 'linear-gradient(135deg, rgb(37 99 235), rgb(99 102 241))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 24px rgb(37 99 235 / 0.3)',
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: 8, height: 8, borderRadius: '50%',
                background: 'rgb(37 99 235)',
                animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
      </div>
      <style>{`
        @keyframes pulse {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

// ================================================
// MOBILE PAGE WRAPPER — used inside mobile views
// ================================================

interface MobilePageProps {
  children: React.ReactNode
  role?: 'owner' | 'tenant' | 'super_admin'
  header?: React.ReactNode
  showBottomNav?: boolean
  noPadding?: boolean
}

export function MobilePage({ children, header, noPadding = false }: MobilePageProps) {
  return (
    <div className="mobile-page-container">
      {header}
      <div className={`mobile-page-body ${noPadding ? 'no-pad' : ''}`}>
        {children}
      </div>
    </div>
  )
}

// ================================================
// DESKTOP PAGE WRAPPER
// ================================================

interface DesktopPageProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  action?: React.ReactNode
}

export function DesktopPage({ children, title, subtitle, action }: DesktopPageProps) {
  return (
    <div className="animate-fade-in-up">
      {(title || action) && (
        <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
          <div>
            {title && <h1 className="text-h1" style={{ margin: 0, marginBottom: subtitle ? '0.25rem' : 0 }}>{title}</h1>}
            {subtitle && <p className="text-muted" style={{ margin: 0, fontSize: '0.9375rem' }}>{subtitle}</p>}
          </div>
          {action && <div style={{ flexShrink: 0 }}>{action}</div>}
        </div>
      )}
      {children}
    </div>
  )
}
