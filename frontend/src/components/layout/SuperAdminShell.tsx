import React from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import {
  LayoutDashboard,
  Building,
  Users,
  ScrollText,
  Settings,
  LogOut,
  ShieldCheck,
  MoreHorizontal,
} from 'lucide-react'
import { DesktopSidebar, DesktopTopBar, MobileBottomNav } from '../navigation'

export function SuperAdminShell() {
  const { isSuperAdmin } = useAuth()
  const navigate = useNavigate()

  if (!isSuperAdmin) {
    navigate('/login')
    return null
  }

  return (
    <div className="app-shell-root">
      {/* Desktop Sidebar */}
      <DesktopSidebar role="super_admin" />

      {/* Main App Container */}
      <div className="app-main-viewport">
        <DesktopTopBar />
        <main className="app-content-area">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation (Visible on mobile only) */}
      <div className="mobile-only">
        <MobileBottomNav role="super_admin" />
      </div>
    </div>
  )
}
