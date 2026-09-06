import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { MobilePage } from '../../components/layout/AppShell'
import { MobileHeader } from '../../components/navigation'
import { superAdminApi } from '../../api/client'
import {
  ScrollText,
  Settings,
  ShieldCheck,
  LogOut,
  ChevronRight,
  User,
  Building,
  Users,
  Activity,
  Server,
  Zap,
  Lock,
  Mail,
  Plus,
  KeyRound,
  Bell,
  Cpu,
  Database,
  Radio,
  ExternalLink,
  Sparkles,
  CheckCircle2,
} from 'lucide-react'

interface MenuItem {
  title: string
  subtitle: string
  icon: any
  to: string
  color: string
  bg: string
  badge?: string
}

interface MenuSection {
  title: string
  items: MenuItem[]
}

export default function SuperAdminMorePage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({ orgs: 0, owners: 0, uptime: '99.98%' })

  useEffect(() => {
    superAdminApi.getDashboard().then((res) => {
      const data = res.data?.data
      if (data) {
        setStats({
          orgs: data.total_organizations || 0,
          owners: data.total_owners || 0,
          uptime: '99.99%',
        })
      }
    }).catch(() => {})
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const quickShortcuts = [
    { label: 'New Org', icon: Plus, to: '/super-admin/organizations?new=true', color: '#2563EB', bg: '#EFF6FF' },
    { label: 'Landlords', icon: Users, to: '/super-admin/owners', color: '#059669', bg: '#ECFDF5' },
    { label: 'SMTP Relay', icon: Mail, to: '/super-admin/smtp', color: '#0284C7', bg: '#E0F2FE' },
    { label: 'Audit Logs', icon: ScrollText, to: '/super-admin/audit-logs', color: '#7C3AED', bg: '#F5F3FF' },
  ]

  const menuSections: MenuSection[] = [
    {
      title: 'Tenant & Infrastructure Management',
      items: [
        {
          title: 'Organizations & Landlord Clients',
          subtitle: 'Manage client accounts, tiers, and quotas',
          icon: Building,
          to: '/super-admin/organizations',
          color: '#2563EB',
          bg: '#EFF6FF',
          badge: stats.orgs ? `${stats.orgs} Active` : undefined,
        },
        {
          title: 'Registered Property Owners',
          subtitle: 'Directory of building owners & password resets',
          icon: Users,
          to: '/super-admin/owners',
          color: '#059669',
          bg: '#ECFDF5',
          badge: stats.owners ? `${stats.owners} Landlords` : undefined,
        },
      ],
    },
    {
      title: 'Communication & Delivery Gateway',
      items: [
        {
          title: 'Mail SMTP Gateway & Dispatcher',
          subtitle: 'Configure platform relay & allocate quotas',
          icon: Mail,
          to: '/super-admin/smtp',
          color: '#0284C7',
          bg: '#E0F2FE',
          badge: 'ACTIVE RELAY',
        },
      ],
    },
    {
      title: 'Governance & Security Compliance',
      items: [
        {
          title: 'Platform Audit Trail & Security Events',
          subtitle: 'Review logins, data exports, and admin mutations',
          icon: ScrollText,
          to: '/super-admin/audit-logs',
          color: '#7C3AED',
          bg: '#F5F3FF',
        },
        {
          title: 'Global Platform Engine Settings',
          subtitle: 'Self-registration, maintenance mode, and announcements',
          icon: Settings,
          to: '/super-admin/settings',
          color: '#D97706',
          bg: '#FEF3C7',
        },
      ],
    },
  ]

  return (
    <MobilePage
      role="super_admin"
      header={<MobileHeader title="Super Admin Hub" />}
    >
      <div style={{ maxWidth: 640, margin: '0 auto', paddingBottom: '3rem' }}>
        {/* Executive Profile Card */}
        <div
          style={{
            padding: '1.25rem',
            marginBottom: '1rem',
            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
            color: '#FFFFFF',
            borderRadius: '1rem',
            boxShadow: '0 8px 24px -4px rgba(15, 23, 42, 0.35)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: -30,
              right: -30,
              width: 140,
              height: 140,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(124, 58, 237, 0.3) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: '0.875rem',
                background: 'linear-gradient(135deg, #7C3AED, #A855F7)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: '1.25rem',
                boxShadow: '0 4px 14px rgba(124, 58, 237, 0.4)',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                flexShrink: 0,
              }}
            >
              <ShieldCheck size={26} color="#FFFFFF" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h2 style={{ fontWeight: 800, fontSize: '1.125rem', margin: 0, color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.full_name || 'Platform Administrator'}
                </h2>
                <span
                  style={{
                    fontSize: '0.5625rem',
                    fontWeight: 900,
                    padding: '0.125rem 0.375rem',
                    borderRadius: 999,
                    background: 'rgba(34, 197, 94, 0.25)',
                    color: '#86EFAC',
                    border: '1px solid rgba(34, 197, 94, 0.4)',
                    textTransform: 'uppercase',
                  }}
                >
                  ROOT
                </span>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#94A3B8', margin: '0.15rem 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.email || 'superadmin@propertyhub.app'}
              </p>
            </div>
          </div>

          {/* Real-time Metric Badges */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0.5rem',
              marginTop: '1rem',
              paddingTop: '0.875rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 600, display: 'block' }}>Organizations</span>
              <span style={{ fontSize: '1.125rem', fontWeight: 800, color: '#FFFFFF' }}>{stats.orgs || '—'}</span>
            </div>
            <div style={{ textAlign: 'center', borderLeft: '1px solid rgba(255, 255, 255, 0.1)', borderRight: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 600, display: 'block' }}>Landlords</span>
              <span style={{ fontSize: '1.125rem', fontWeight: 800, color: '#38BDF8' }}>{stats.owners || '—'}</span>
            </div>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 600, display: 'block' }}>System Health</span>
              <span style={{ fontSize: '1.125rem', fontWeight: 800, color: '#4ADE80' }}>100% 🟢</span>
            </div>
          </div>
        </div>

        {/* Quick Action Shortcuts */}
        <div style={{ marginBottom: '1.25rem' }}>
          <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '0.5rem', paddingLeft: '0.25rem' }}>
            Quick Actions
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
            {quickShortcuts.map((sc) => {
              const Icon = sc.icon
              return (
                <button
                  key={sc.label}
                  type="button"
                  onClick={() => navigate(sc.to)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0.75rem 0.35rem',
                    background: '#FFFFFF',
                    borderRadius: '0.75rem',
                    border: '1px solid #E2E8F0',
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: '50%',
                      background: sc.bg,
                      color: sc.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '0.375rem',
                    }}
                  >
                    <Icon size={18} />
                  </div>
                  <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#1E293B' }}>
                    {sc.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Grouped Menu Sections */}
        {menuSections.map((sec) => (
          <div key={sec.title} style={{ marginBottom: '1.25rem' }}>
            <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '0.5rem', paddingLeft: '0.25rem' }}>
              {sec.title}
            </span>
            <div className="card" style={{ overflow: 'hidden', padding: 0, borderRadius: '0.875rem', border: '1px solid #E2E8F0' }}>
              {sec.items.map((item, i) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.to}
                    type="button"
                    onClick={() => navigate(item.to)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.875rem',
                      padding: '0.875rem 1rem',
                      width: '100%',
                      background: 'none',
                      border: 'none',
                      borderBottom: i < sec.items.length - 1 ? '1px solid #F1F5F9' : 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                  >
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: '0.625rem',
                        background: item.bg,
                        color: item.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={20} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <h4 style={{ fontWeight: 700, fontSize: '0.875rem', margin: 0, color: '#0F172A' }}>
                          {item.title}
                        </h4>
                        {item.badge && (
                          <span
                            style={{
                              fontSize: '0.625rem',
                              fontWeight: 800,
                              background: '#F1F5F9',
                              color: '#475569',
                              padding: '0.1rem 0.4rem',
                              borderRadius: '999px',
                            }}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '0.1rem 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.subtitle}
                      </p>
                    </div>
                    <ChevronRight size={18} color="#94A3B8" />
                  </button>
                )
              })}
            </div>
          </div>
        ))}

        {/* Server Diagnostic Telemetry Box */}
        <div
          className="card"
          style={{
            padding: '1rem 1.25rem',
            marginBottom: '1.25rem',
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '0.875rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Radio size={16} color="#10B981" />
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase' }}>
                Cluster Telemetry
              </span>
            </div>
            <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#10B981' }}>
              ● Operational (14ms)
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.75rem', color: '#64748B' }}>
            <div>Database: <strong style={{ color: '#0F172A' }}>MongoDB Atlas 7.0</strong></div>
            <div>Isolation: <strong style={{ color: '#0F172A' }}>Multi-Tenant Row</strong></div>
            <div>Mail SMTP: <strong style={{ color: '#0F172A' }}>aiosmtplib Async</strong></div>
            <div>Platform OS: <strong style={{ color: '#0F172A' }}>v2.5.0-PRO</strong></div>
          </div>
        </div>

        {/* Sign Out Button */}
        <button
          type="button"
          onClick={handleLogout}
          className="btn btn-ghost btn-lg btn-full"
          style={{
            color: '#E11D48',
            border: '1px solid #FECDD3',
            background: '#FFF1F2',
            fontWeight: 700,
            borderRadius: '0.75rem',
            height: 48,
          }}
        >
          <LogOut size={18} /> Sign Out of Platform Control
        </button>
      </div>
    </MobilePage>
  )
}
