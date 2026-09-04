import React, { useState, useEffect } from 'react'
import { superAdminApi } from '../../api/client'
import { AuditLog } from '../../types'
import { MobilePage } from '../../components/layout/AppShell'
import { MobileHeader } from '../../components/navigation'
import { formatDate, EmptyState, ErrorState, SkeletonCard } from '../../components/ui'
import {
  ScrollText,
  RefreshCw,
  Search,
  Building2,
  User,
  Key,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Layers,
  Globe,
  Tag,
} from 'lucide-react'

const EVENT_FILTERS = [
  { key: '', label: 'All Events' },
  { key: 'organization', label: 'Organizations' },
  { key: 'owner', label: 'Owners & Users' },
  { key: 'password', label: 'Security & Auth' },
]

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)

  const loadData = async () => {
    setIsLoading(true)
    setHasError(false)
    try {
      const res = await superAdminApi.listAuditLogs()
      setLogs(res.data.data || [])
    } catch {
      setHasError(true)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleRefresh = () => {
    setIsRefreshing(true)
    loadData()
  }

  const getActionBadge = (action: string) => {
    const act = (action || '').toLowerCase()
    if (act.includes('org') || act.includes('building')) {
      return {
        icon: <Building2 size={14} />,
        bg: '#EFF6FF',
        color: '#1E40AF',
        border: '#BFDBFE',
        label: action.replace(/_/g, ' '),
      }
    }
    if (act.includes('password') || act.includes('auth') || act.includes('login')) {
      return {
        icon: <Key size={14} />,
        bg: '#FFFBEB',
        color: '#B45309',
        border: '#FDE68A',
        label: action.replace(/_/g, ' '),
      }
    }
    if (act.includes('owner') || act.includes('user') || act.includes('tenant')) {
      return {
        icon: <User size={14} />,
        bg: '#ECFDF5',
        color: '#047857',
        border: '#A7F3D0',
        label: action.replace(/_/g, ' '),
      }
    }
    return {
      icon: <ShieldCheck size={14} />,
      bg: '#F1F5F9',
      color: '#334155',
      border: '#CBD5E1',
      label: action.replace(/_/g, ' '),
    }
  }

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      !searchQuery ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.actor_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      JSON.stringify(log.details || {}).toLowerCase().includes(searchQuery.toLowerCase())

    const matchesFilter =
      !activeFilter ||
      log.action.toLowerCase().includes(activeFilter.toLowerCase())

    return matchesSearch && matchesFilter
  })

  return (
    <MobilePage
      role="super_admin"
      header={
        <MobileHeader
          title="Platform Audit Trail"
          rightAction={
            <button
              className="btn btn-ghost btn-sm"
              onClick={handleRefresh}
              style={{ padding: '0.35rem 0.6rem', gap: '0.25rem' }}
            >
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
            </button>
          }
        />
      }
    >
      {/* Desktop Header */}
      <div className="module-header hidden-mobile">
        <div className="module-header-info">
          <h1 className="module-header-title">
            Platform Audit Trail ({filteredLogs.length})
          </h1>
          <p className="module-header-subtitle">
            Tamper-evident logs of organization onboarding, account provisioning, and administrative events
          </p>
        </div>

        <div className="module-header-action">
          <button
            className="btn btn-secondary"
            onClick={handleRefresh}
            style={{ gap: '0.375rem' }}
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
            <span>Refresh Feed</span>
          </button>
        </div>
      </div>

      {/* Search & Event Filters */}
      <div style={{ position: 'relative', marginBottom: '0.875rem', width: '100%' }}>
        <Search
          size={16}
          style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}
        />
        <input
          type="search"
          className="input"
          style={{ paddingLeft: 42, background: '#FFFFFF', borderRadius: 'var(--radius-full)' }}
          placeholder="Search by action, actor email, or payload..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Filter Tabs */}
      <div className="tabs-scroll" style={{ marginBottom: '1rem' }}>
        {EVENT_FILTERS.map((f) => (
          <button
            key={f.key}
            className={`tab-item ${activeFilter === f.key ? 'active' : ''}`}
            onClick={() => setActiveFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Audit Log Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : hasError ? (
          <ErrorState onRetry={loadData} />
        ) : filteredLogs.length === 0 ? (
          <EmptyState
            icon={<ScrollText size={32} />}
            title="No audit logs found"
            description="System activity, user provisioning, and security events will appear here in chronological order."
          />
        ) : (
          filteredLogs.map((log) => {
            const badge = getActionBadge(log.action)
            const details = log.details || {}
            const detailKeys = Object.keys(details)

            return (
              <div
                key={log.id}
                className="card card-hover"
                style={{
                  padding: '1rem 1.25rem',
                  borderLeft: `4px solid ${badge.color}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.625rem',
                  background: '#FFFFFF',
                }}
              >
                {/* Header: Action Badge + Timestamp */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        padding: '0.2rem 0.6rem',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        background: badge.bg,
                        color: badge.color,
                        border: `1px solid ${badge.border}`,
                        textTransform: 'uppercase',
                        letterSpacing: '0.03em',
                      }}
                    >
                      {badge.icon}
                      <span>{badge.label}</span>
                    </span>

                    {log.ip_address && (
                      <span style={{ fontSize: '0.6875rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Globe size={12} />
                        {log.ip_address}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: '#64748B' }}>
                    <Clock size={13} color="#94A3B8" />
                    <span>{formatDate(log.created_at)}</span>
                  </div>
                </div>

                {/* Actor Info */}
                <div style={{ fontSize: '0.8125rem', color: '#334155' }}>
                  <span style={{ color: '#64748B', fontWeight: 600 }}>Actor: </span>
                  <strong style={{ color: '#0F172A' }}>{log.actor_email || 'System'}</strong>
                </div>

                {/* Structured Payload / Metadata Grid */}
                {detailKeys.length > 0 && (
                  <div
                    style={{
                      background: '#F8FAFC',
                      padding: '0.5rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid #E2E8F0',
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '0.5rem',
                      alignItems: 'center',
                    }}
                  >
                    {detailKeys.map((key) => {
                      const val = details[key]
                      const displayVal = typeof val === 'object' ? JSON.stringify(val) : String(val)

                      return (
                        <div
                          key={key}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            padding: '0.15rem 0.5rem',
                            borderRadius: 'var(--radius-full)',
                            background: '#FFFFFF',
                            border: '1px solid #E2E8F0',
                            fontSize: '0.75rem',
                          }}
                        >
                          <span style={{ color: '#64748B', fontWeight: 600 }}>{key}:</span>
                          <span style={{ color: '#0F172A', fontWeight: 700 }}>{displayVal}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </MobilePage>
  )
}
