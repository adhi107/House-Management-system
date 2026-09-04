import React, { useState } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  Home, Building2, Users, CreditCard, Wrench, MoreHorizontal,
  FileText, BarChart2, Bell, Settings, LogOut, ChevronLeft, ChevronRight,
  DollarSign, Zap, FileCheck, Megaphone, TrendingUp, PanelLeft,
  ShieldCheck, Search, Sparkles, Building, ScrollText, ArrowLeft
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { Avatar } from '../ui'

// ================================================
// MULTI-PERSONA DESKTOP SIDEBAR
// ================================================

interface NavGroup {
  title?: string
  items: { to: string; icon: any; label: string }[]
}

const OWNER_SECTIONS: NavGroup[] = [
  {
    title: 'CORE MANAGEMENT',
    items: [
      { to: '/owner/dashboard', icon: Home, label: 'Dashboard' },
      { to: '/owner/properties', icon: Building2, label: 'Properties' },
      { to: '/owner/units', icon: PanelLeft, label: 'Units' },
      { to: '/owner/tenants', icon: Users, label: 'Tenants & Residents' },
    ],
  },
  {
    title: 'FINANCE & LEASING',
    items: [
      { to: '/owner/rent', icon: CreditCard, label: 'Rent Manager' },
      { to: '/owner/payments', icon: DollarSign, label: 'Payment Records' },
      { to: '/owner/agreements', icon: FileCheck, label: 'Rental Agreements' },
      { to: '/owner/expenses', icon: TrendingUp, label: 'Expenses' },
    ],
  },
  {
    title: 'OPERATIONS',
    items: [
      { to: '/owner/maintenance', icon: Wrench, label: 'Maintenance' },
      { to: '/owner/documents', icon: FileText, label: 'Documents' },
      { to: '/owner/announcements', icon: Megaphone, label: 'Announcements' },
      { to: '/owner/reports', icon: BarChart2, label: 'Reports & Analytics' },
    ],
  },
]

const TENANT_SECTIONS: NavGroup[] = [
  {
    title: 'OVERVIEW',
    items: [
      { to: '/tenant/dashboard', icon: Home, label: 'Dashboard' },
    ],
  },
  {
    title: 'BILLS & RECEIPTS',
    items: [
      { to: '/tenant/rent', icon: CreditCard, label: 'Rent Invoices' },
      { to: '/tenant/payments', icon: DollarSign, label: 'Payment Receipts' },
    ],
  },
  {
    title: 'SERVICES & LEASE',
    items: [
      { to: '/tenant/maintenance', icon: Wrench, label: 'Maintenance' },
      { to: '/tenant/agreements', icon: FileCheck, label: 'Lease Agreement' },
      { to: '/tenant/documents', icon: FileText, label: 'My Documents' },
      { to: '/tenant/notifications', icon: Bell, label: 'Announcements' },
    ],
  },
]

const SUPERADMIN_SECTIONS: NavGroup[] = [
  {
    title: 'OVERVIEW',
    items: [
      { to: '/super-admin/dashboard', icon: Home, label: 'Platform Overview' },
    ],
  },
  {
    title: 'ORGANIZATIONS & OWNERS',
    items: [
      { to: '/super-admin/organizations', icon: Building, label: 'Organizations' },
      { to: '/super-admin/owners', icon: Users, label: 'Property Owners' },
    ],
  },
  {
    title: 'GOVERNANCE',
    items: [
      { to: '/super-admin/audit-logs', icon: ScrollText, label: 'Audit Logs' },
      { to: '/super-admin/settings', icon: Settings, label: 'Platform Settings' },
    ],
  },
]

export function DesktopSidebar({ role = 'owner' }: { role?: 'owner' | 'tenant' | 'super_admin' }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const sections =
    role === 'super_admin'
      ? SUPERADMIN_SECTIONS
      : role === 'tenant'
      ? TENANT_SECTIONS
      : OWNER_SECTIONS

  const portalConfig = {
    super_admin: {
      name: 'Super Admin',
      badge: 'PLATFORM OS',
      gradient: 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)',
      activeClass: 'active-superadmin',
      icon: ShieldCheck,
      notifLink: '/super-admin/notifications',
      settingsLink: '/super-admin/settings',
    },
    tenant: {
      name: 'PropertyHub',
      badge: 'RESIDENT PORTAL',
      gradient: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
      activeClass: 'active-tenant',
      icon: Home,
      notifLink: '/tenant/notifications',
      settingsLink: '/tenant/settings',
    },
    owner: {
      name: 'PropertyHub',
      badge: 'OWNER PORTAL',
      gradient: 'linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)',
      activeClass: '',
      icon: Building2,
      notifLink: '/owner/notifications',
      settingsLink: '/owner/settings',
    },
  }[role]

  const BrandIcon = portalConfig.icon

  return (
    <aside className="sidebar hidden-mobile" style={{ width: collapsed ? 76 : 264 }}>
      {/* Brand Header */}
      <div
        style={{
          padding: '1.125rem 1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          backgroundColor: 'rgba(15, 23, 42, 0.4)',
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            background: portalConfig.gradient,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.25)',
          }}
        >
          <BrandIcon size={20} color="#FFFFFF" />
        </div>
        {!collapsed && (
          <div style={{ minWidth: 0, flex: 1 }}>
            <span
              style={{
                fontWeight: 800,
                fontSize: '1.0625rem',
                color: '#FFFFFF',
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
                display: 'block',
              }}
            >
              {portalConfig.name}
            </span>
            <span
              style={{
                fontSize: '0.625rem',
                color: '#94A3B8',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                fontWeight: 800,
              }}
            >
              {portalConfig.badge}
            </span>
          </div>
        )}
      </div>

      {/* Nav Section Groups */}
      <nav className="sidebar-nav-container">
        {sections.map((sec, secIdx) => (
          <div key={secIdx} style={{ marginBottom: '0.5rem' }}>
            {!collapsed && sec.title && (
              <span className="sidebar-section-title">{sec.title}</span>
            )}
            {sec.items.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `sidebar-nav-item ${isActive ? `active ${portalConfig.activeClass}` : ''}`
                }
                title={collapsed ? label : undefined}
              >
                <Icon size={18} style={{ flexShrink: 0 }} />
                {!collapsed && (
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {label}
                  </span>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer / User Profile & Logout */}
      <div className="sidebar-footer">
        <NavLink
          to={portalConfig.notifLink}
          className={({ isActive }) =>
            `sidebar-nav-item ${isActive ? `active ${portalConfig.activeClass}` : ''}`
          }
          title={collapsed ? 'Notifications' : undefined}
          style={{ margin: '0.125rem 0.375rem' }}
        >
          <Bell size={18} style={{ flexShrink: 0 }} />
          {!collapsed && <span>Notifications</span>}
        </NavLink>
        <NavLink
          to={portalConfig.settingsLink}
          className={({ isActive }) =>
            `sidebar-nav-item ${isActive ? `active ${portalConfig.activeClass}` : ''}`
          }
          title={collapsed ? 'Settings' : undefined}
          style={{ margin: '0.125rem 0.375rem' }}
        >
          <Settings size={18} style={{ flexShrink: 0 }} />
          {!collapsed && <span>Settings</span>}
        </NavLink>

        {/* User Capsule Card */}
        {!collapsed && user && (
          <div
            style={{
              margin: '0.5rem 0.25rem 0.25rem',
              padding: '0.625rem 0.75rem',
              borderRadius: '0.625rem',
              background: 'rgba(255, 255, 255, 0.05)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.625rem',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <div style={{ position: 'relative' }}>
              <Avatar name={user.full_name} src={user.profile_photo} size="sm" />
              <div
                style={{
                  position: 'absolute',
                  bottom: -1,
                  right: -1,
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: '#10B981',
                  border: '1.5px solid #0F172A',
                }}
              />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  margin: 0,
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {user.full_name}
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: '0.6875rem',
                  color: '#94A3B8',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {user.organization_name || (role === 'tenant' ? 'Resident' : role === 'super_admin' ? 'Platform Admin' : 'Property Owner')}
              </p>
            </div>
            <button
              onClick={handleLogout}
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                cursor: 'pointer',
                color: '#FCA5A5',
                padding: '0.3rem 0.5rem',
                borderRadius: '0.375rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.6875rem',
                fontWeight: 700,
                transition: 'all 0.15s ease',
              }}
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut size={12} />
              <span>Exit</span>
            </button>
          </div>
        )}

        {/* Collapse button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="sidebar-nav-item"
          style={{
            width: '100%',
            margin: '0.375rem 0 0',
            justifyContent: collapsed ? 'center' : 'flex-start',
            color: '#64748B',
            fontSize: '0.75rem',
          }}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          {!collapsed && <span>Collapse Sidebar</span>}
        </button>
      </div>
    </aside>
  )
}

// ================================================
// DESKTOP TOP BAR (SLIM SAAS HEADER WITH BACK BUTTON)
// ================================================

export function DesktopTopBar() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const isRootDashboard =
    location.pathname === '/owner/dashboard' ||
    location.pathname === '/super-admin/dashboard' ||
    location.pathname === '/tenant/dashboard'

  return (
    <header
      className="desktop-top-bar hidden-mobile"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'nowrap',
        gap: '1rem',
        height: 56,
        padding: '0 1.5rem',
        background: '#FFFFFF',
        borderBottom: '1px solid #E2E8F0',
        position: 'sticky',
        top: 0,
        zIndex: 20,
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* Left section: Back button + Search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: '1 1 auto', minWidth: 0, overflow: 'hidden' }}>
        {!isRootDashboard && (
          <button
            onClick={() => navigate(-1)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              height: 34,
              padding: '0 0.875rem',
              borderRadius: 'var(--radius-full)',
              background: '#F1F5F9',
              border: '1px solid #E2E8F0',
              color: '#0F172A',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'all 0.15s ease',
            }}
            title="Go back to previous page"
            aria-label="Go back"
          >
            <ArrowLeft size={14} /> Back
          </button>
        )}

        <div style={{ position: 'relative', width: '100%', maxWidth: 360, minWidth: 160 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input
            type="text"
            placeholder="Search flats, tenants, invoices..."
            className="input"
            style={{
              paddingLeft: '2.25rem',
              height: 36,
              fontSize: '0.8125rem',
              borderRadius: 'var(--radius-full)',
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              width: '100%',
            }}
          />
        </div>
      </div>

      {/* Right section: Notifications + User Avatar Capsule */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexShrink: 0 }}>
        <button
          onClick={() => navigate(user?.role === 'super_admin' ? '/super-admin/notifications' : '/owner/notifications')}
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            border: '1px solid #E2E8F0',
            background: '#F8FAFC',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#0F172A',
            cursor: 'pointer',
            flexShrink: 0,
            transition: 'all 0.15s ease',
          }}
          title="Notifications"
          aria-label="Notifications"
        >
          <Bell size={16} />
        </button>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.25rem 0.75rem 0.25rem 0.35rem',
            borderRadius: 'var(--radius-full)',
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: '#0F172A',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.6875rem',
              fontWeight: 800,
              flexShrink: 0,
            }}
          >
            {user?.full_name?.substring(0, 2).toUpperCase() || 'U'}
          </div>
          <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap' }}>
            {user?.full_name}
          </span>
        </div>
      </div>
    </header>
  )
}

// ================================================
// MOBILE APP HEADER (STRICTLY MOBILE ONLY)
// ================================================

interface MobileHeaderProps {
  title?: string
  showBack?: boolean
  onBack?: () => void
  rightAction?: React.ReactNode
  searchPlaceholder?: string
  chips?: { label: string; active?: boolean; onClick?: () => void }[]
}

export function MobileHeader({
  title,
  showBack,
  onBack,
  rightAction,
  searchPlaceholder,
  chips,
}: MobileHeaderProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

  const isRootDashboard =
    location.pathname === '/owner/dashboard' ||
    location.pathname === '/super-admin/dashboard' ||
    location.pathname === '/tenant/dashboard'

  // Automatically show back button on every subpage unless explicitly disabled
  const shouldShowBack = showBack !== undefined ? showBack : !isRootDashboard

  return (
    <header className="mobile-app-header mobile-only">
      {shouldShowBack ? (
        <div className="mobile-header-bar">
          <button
            onClick={onBack || (() => navigate(-1))}
            className="header-icon-btn"
            style={{
              width: 36, height: 36, borderRadius: '50%',
              background: '#F1F5F9', border: '1px solid #E2E8F0',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#0F172A', cursor: 'pointer', flexShrink: 0,
            }}
            aria-label="Go back"
          >
            <ChevronLeft size={20} />
          </button>
          <h1 className="mobile-header-title">{title || 'PropertyHub'}</h1>
          <div className="mobile-header-actions">{rightAction}</div>
        </div>
      ) : (
        <div className="playstore-search-bar">
          <div className="playstore-brand-icon">
            <Building2 size={18} color="white" />
          </div>
          <div className="playstore-search-text" onClick={() => title ? null : navigate(user?.role === 'super_admin' ? '/super-admin/organizations' : '/owner/properties')}>
            <Search size={16} className="playstore-search-icon" />
            <span>{searchPlaceholder || title || 'Search in PropertyHub...'}</span>
          </div>
          <div className="playstore-actions">
            {rightAction || (
              <div
                className="playstore-avatar-chip"
                onClick={() => navigate(user?.role === 'super_admin' ? '/super-admin/more' : user?.role === 'tenant' ? '/tenant/more' : '/owner/more')}
                title={user?.full_name}
              >
                {user?.full_name?.substring(0, 2).toUpperCase() || 'PH'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Category Chips (Mobile Viewport Only) */}
      {chips && chips.length > 0 && !shouldShowBack && (
        <div className="playstore-chips-scroll">
          {chips.map((chip, idx) => (
            <button
              key={idx}
              className={`playstore-chip ${chip.active ? 'active' : ''}`}
              onClick={chip.onClick}
            >
              {chip.label}
            </button>
          ))}
        </div>
      )}
    </header>
  )
}

// ================================================
// MOBILE BOTTOM NAVIGATION (PLAY STORE / M3 STYLE)
// ================================================

const SUPERADMIN_BOTTOM_NAV = [
  { to: '/super-admin/dashboard', icon: Home, label: 'Home' },
  { to: '/super-admin/organizations', icon: Building, label: 'Organizations' },
  { to: '/super-admin/owners', icon: Users, label: 'Owners' },
  { to: '/super-admin/more', icon: MoreHorizontal, label: 'More' },
]

const OWNER_BOTTOM_NAV = [
  { to: '/owner/dashboard', icon: Home, label: 'Home' },
  { to: '/owner/properties', icon: Building2, label: 'Buildings' },
  { to: '/owner/rent', icon: CreditCard, label: 'Rent' },
  { to: '/owner/maintenance', icon: Wrench, label: 'Fixes' },
  { to: '/owner/more', icon: MoreHorizontal, label: 'More' },
]

const TENANT_BOTTOM_NAV = [
  { to: '/tenant/dashboard', icon: Home, label: 'Home' },
  { to: '/tenant/rent', icon: CreditCard, label: 'Rent' },
  { to: '/tenant/maintenance', icon: Wrench, label: 'Service' },
  { to: '/tenant/documents', icon: FileText, label: 'Docs' },
  { to: '/tenant/more', icon: MoreHorizontal, label: 'More' },
]

interface MobileBottomNavProps {
  role?: 'owner' | 'tenant' | 'super_admin'
}

export function MobileBottomNav({ role = 'owner' }: MobileBottomNavProps) {
  const items =
    role === 'super_admin'
      ? SUPERADMIN_BOTTOM_NAV
      : role === 'tenant'
      ? TENANT_BOTTOM_NAV
      : OWNER_BOTTOM_NAV

  return (
    <nav className="mobile-bottom-nav" aria-label="Main navigation">
      {items.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
          aria-label={label}
        >
          <div className="nav-icon-wrapper">
            <Icon size={20} className="bottom-nav-icon" />
          </div>
          <span className="bottom-nav-label">{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
