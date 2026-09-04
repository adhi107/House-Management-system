import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { MobilePage } from '../../components/layout/AppShell'
import { MobileHeader } from '../../components/navigation'
import { ScrollText, Settings, ShieldCheck, LogOut, ChevronRight, User } from 'lucide-react'

export default function SuperAdminMorePage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const menuItems = [
    {
      title: 'Platform Audit Trail',
      subtitle: 'Review administrative activity and system events',
      icon: ScrollText,
      to: '/super-admin/audit-logs',
      color: 'rgb(var(--primary))',
    },
    {
      title: 'Platform Settings',
      subtitle: 'Registration rules, policies, and banner alerts',
      icon: Settings,
      to: '/super-admin/settings',
      color: 'rgb(var(--info))',
    },
  ]

  return (
    <MobilePage
      role="super_admin"
      header={<MobileHeader title="More Options" />}
    >
      {/* Admin Profile Card */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgb(37 99 235), rgb(99 102 241))',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '1.125rem',
          }}>
            SA
          </div>
          <div>
            <h3 style={{ fontWeight: 800, fontSize: '1.0625rem', margin: '0 0 0.125rem' }}>{user?.full_name}</h3>
            <p style={{ fontSize: '0.8125rem', color: 'rgb(var(--muted-foreground))', margin: 0 }}>{user?.email}</p>
            <span className="badge badge-active" style={{ marginTop: '0.375rem' }}>SUPER ADMIN</span>
          </div>
        </div>
      </div>

      {/* Menu List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginBottom: '1.5rem' }}>
        {menuItems.map((item) => {
          const Icon = item.icon
          return (
            <div
              key={item.to}
              className="card card-hover"
              onClick={() => navigate(item.to)}
              style={{
                padding: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.875rem',
                cursor: 'pointer',
              }}
            >
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 'var(--radius-md)',
                background: 'rgb(var(--muted) / 0.6)',
                color: item.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Icon size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontWeight: 700, fontSize: '0.9375rem', margin: '0 0 0.125rem' }}>{item.title}</h4>
                <p style={{ fontSize: '0.75rem', color: 'rgb(var(--muted-foreground))', margin: 0 }}>{item.subtitle}</p>
              </div>
              <ChevronRight size={18} color="rgb(var(--muted-foreground))" />
            </div>
          )
        })}
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="btn btn-ghost btn-lg btn-full"
        style={{ color: 'rgb(var(--danger))', border: '1px solid rgb(var(--danger) / 0.2)' }}
      >
        <LogOut size={18} /> Sign Out of Platform
      </button>
    </MobilePage>
  )
}
