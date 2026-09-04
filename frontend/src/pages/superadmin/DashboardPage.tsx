import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { superAdminApi } from '../../api/client'
import { SuperAdminDashboard } from '../../types'
import { MobilePage } from '../../components/layout/AppShell'
import { MobileHeader } from '../../components/navigation'
import { formatCurrency, formatDate, ErrorState, SkeletonCard } from '../../components/ui'
import {
  Building,
  Users,
  ShieldCheck,
  TrendingUp,
  ArrowUpRight,
  Plus,
  ScrollText,
  Sparkles,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react'

export default function SuperAdminDashboardPage() {
  const navigate = useNavigate()
  const [data, setData] = useState<SuperAdminDashboard | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [activeChip, setActiveChip] = useState<'all' | 'active' | 'suspended'>('all')

  const loadData = async () => {
    setIsLoading(true)
    setHasError(false)
    try {
      const res = await superAdminApi.getDashboard()
      setData(res.data.data)
    } catch {
      setHasError(true)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const categoryChips = [
    { label: '🔥 For You', active: activeChip === 'all', onClick: () => setActiveChip('all') },
    { label: '🏢 Organizations', active: false, onClick: () => navigate('/super-admin/organizations') },
    { label: '👥 Owners', active: false, onClick: () => navigate('/super-admin/owners') },
    { label: '🛡️ Audit Logs', active: false, onClick: () => navigate('/super-admin/audit-logs') },
    { label: '⚙️ Settings', active: false, onClick: () => navigate('/super-admin/settings') },
  ]

  const filteredOrgs = data?.recent_organizations.filter((org) => {
    if (activeChip === 'active') return org.status === 'active'
    if (activeChip === 'suspended') return org.status === 'suspended'
    return true
  }) || []

  return (
    <MobilePage
      role="super_admin"
      header={
        <MobileHeader
          searchPlaceholder="Search organizations, owners, logs..."
          chips={categoryChips}
          rightAction={
            <button
              className="btn btn-primary btn-sm"
              onClick={() => navigate('/super-admin/organizations?new=true')}
              style={{ gap: '0.25rem', boxShadow: 'none' }}
            >
              <Plus size={16} /> New Org
            </button>
          }
        />
      }
    >
      {/* Top Header Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', width: '100%' }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>
            Platform Overview
          </h1>
          <p style={{ fontSize: '0.8125rem', color: '#64748B', margin: '0.125rem 0 0' }}>
            Multi-Tenant Management & Platform Telemetry
          </p>
        </div>

        <div className="hidden-mobile">
          <button
            className="btn btn-primary btn-sm"
            onClick={() => navigate('/super-admin/organizations?new=true')}
            style={{ gap: '0.375rem' }}
          >
            <Plus size={15} /> Create Organization
          </button>
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : hasError || !data ? (
        <ErrorState onRetry={loadData} />
      ) : (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
          
          {/* Executive Overview: Split Hero Banner (Left) + 4 Stat Tiles (Right) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem', alignItems: 'stretch' }}>
            
            {/* Left: Compact Hero Financial Card */}
            <div className="hero-banner" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 180, padding: '1.25rem 1.5rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', opacity: 0.9, display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <Sparkles size={14} /> Platform Collected Revenue
                  </span>
                  <span style={{ background: 'rgba(255, 255, 255, 0.2)', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-full)', fontSize: '0.6875rem', fontWeight: 800 }}>
                    LIVE
                  </span>
                </div>

                <h1 style={{ fontWeight: 900, fontSize: '2rem', margin: '0 0 0.5rem', letterSpacing: '-0.025em', fontVariantNumeric: 'tabular-nums' }}>
                  {formatCurrency(data.stats.platform_collected_revenue)}
                </h1>
              </div>

              <div style={{ fontSize: '0.8125rem', opacity: 0.95, paddingTop: '0.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.15)' }}>
                <span>{data.stats.total_organizations} Orgs • {data.stats.total_properties} Buildings • {data.stats.total_units} Units</span>
              </div>
            </div>

            {/* Right: 4 Sleek KPI Tiles */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
              
              {/* Organizations */}
              <div
                className="card card-hover"
                onClick={() => navigate('/super-admin/organizations')}
                style={{ padding: '0.875rem 1rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>Organizations</span>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1E3A8A' }}>
                    <Building size={15} />
                  </div>
                </div>
                <p style={{ fontWeight: 800, fontSize: '1.375rem', margin: '0 0 0.125rem', fontVariantNumeric: 'tabular-nums', color: '#0F172A' }}>
                  {data.stats.total_organizations}
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.6875rem', fontWeight: 700 }}>
                  <span style={{ color: '#059669' }}>{data.stats.active_organizations} Active</span>
                  {data.stats.suspended_organizations > 0 && (
                    <span style={{ color: '#E11D48' }}>{data.stats.suspended_organizations} Suspended</span>
                  )}
                </div>
              </div>

              {/* Owners */}
              <div
                className="card card-hover"
                onClick={() => navigate('/super-admin/owners')}
                style={{ padding: '0.875rem 1rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>Owners</span>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
                    <Users size={15} />
                  </div>
                </div>
                <p style={{ fontWeight: 800, fontSize: '1.375rem', margin: '0 0 0.125rem', fontVariantNumeric: 'tabular-nums', color: '#0F172A' }}>
                  {data.stats.total_owners}
                </p>
                <p style={{ fontSize: '0.6875rem', color: '#64748B', margin: 0 }}>
                  Independent Accounts
                </p>
              </div>

              {/* Units */}
              <div className="card" style={{ padding: '0.875rem 1rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>Total Units</span>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16A34A' }}>
                    <TrendingUp size={15} />
                  </div>
                </div>
                <p style={{ fontWeight: 800, fontSize: '1.375rem', margin: '0 0 0.125rem', fontVariantNumeric: 'tabular-nums', color: '#0F172A' }}>
                  {data.stats.total_units}
                </p>
                <p style={{ fontSize: '0.6875rem', color: '#64748B', margin: 0 }}>
                  {data.stats.occupied_units} Occupied
                </p>
              </div>

              {/* Tenants */}
              <div className="card" style={{ padding: '0.875rem 1rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>Total Tenants</span>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D97706' }}>
                    <Users size={15} />
                  </div>
                </div>
                <p style={{ fontWeight: 800, fontSize: '1.375rem', margin: '0 0 0.125rem', fontVariantNumeric: 'tabular-nums', color: '#0F172A' }}>
                  {data.stats.total_tenants}
                </p>
                <p style={{ fontSize: '0.6875rem', color: '#64748B', margin: 0 }}>
                  Active Residents
                </p>
              </div>

            </div>

          </div>

          {/* Side-by-Side: Organizations (Left) & Platform Audit Trail (Right) */}
          <div className="responsive-two-col">
            
            {/* Organizations App List */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.625rem', padding: '0 0.25rem' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, letterSpacing: '-0.01em', color: '#0F172A' }}>
                  Organizations ({filteredOrgs.length})
                </h2>
                <button
                  onClick={() => navigate('/super-admin/organizations')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0F172A', fontSize: '0.8125rem', fontWeight: 700 }}
                >
                  See all
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {filteredOrgs.map((org) => {
                  const isActive = org.status === 'active'
                  return (
                    <div
                      key={org.id}
                      className="card card-hover"
                      onClick={() => navigate(`/super-admin/organizations/${org.id}`)}
                      style={{
                        padding: '0.875rem 1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.875rem',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        background: isActive ? '#0F172A' : '#F1F5F9',
                        color: isActive ? 'white' : '#64748B',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <Building size={20} />
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <h3 style={{ fontWeight: 800, fontSize: '0.9375rem', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#0F172A' }}>
                            {org.name}
                          </h3>
                          <span className={`badge badge-${isActive ? 'active' : 'suspended'}`}>
                            {org.status}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '0.125rem 0 0' }}>
                          {org.organization_code} • Owner: {org.owner_name || 'Assigned'}
                        </p>
                      </div>

                      <ChevronRight size={18} color="#94A3B8" />
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Audit Logs */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.625rem', padding: '0 0.25rem' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, letterSpacing: '-0.01em', color: '#0F172A' }}>
                  Platform Audit Trail
                </h2>
                <button
                  onClick={() => navigate('/super-admin/audit-logs')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0F172A', fontSize: '0.8125rem', fontWeight: 700 }}
                >
                  See all
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {data.recent_audit_logs.map((log) => (
                  <div key={log.id} className="card" style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.125rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0F172A' }}>
                        {log.action.replace(/_/g, ' ').toUpperCase()}
                      </span>
                      <span style={{ fontSize: '0.6875rem', color: '#64748B' }}>
                        {formatDate(log.created_at)}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.6875rem', color: '#64748B', margin: 0 }}>
                      By {log.actor_email}
                    </p>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}
    </MobilePage>
  )
}
