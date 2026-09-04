import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell, Plus, TrendingUp, TrendingDown, Building2, Users, Home, AlertTriangle,
  ChevronRight, RefreshCw, Sparkles, CreditCard, Wrench, FilePlus, DollarSign,
  BarChart3, CheckCircle2, ArrowUpRight
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { dashboardApi, propertyApi } from '../../api/client'
import { DashboardSummary, Property } from '../../types'
import { MobilePage } from '../../components/layout/AppShell'
import { MobileHeader } from '../../components/navigation'
import { formatCurrency, SkeletonKpi, EmptyState, ErrorState, StatusBadge, ProgressBar, SectionHeader } from '../../components/ui'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

export default function OwnerDashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [properties, setProperties] = useState<Property[]>([])
  const [selectedProp, setSelectedProp] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)
  const [showPropSelect, setShowPropSelect] = useState(false)
  const [activeChip, setActiveChip] = useState<'all' | 'rent' | 'units'>('all')

  const now = new Date()

  const load = async () => {
    setIsLoading(true)
    setError(false)
    try {
      const [sumRes, propRes] = await Promise.all([
        dashboardApi.getSummary(selectedProp || undefined),
        propertyApi.list(),
      ])
      setSummary(sumRes.data.data)
      setProperties(propRes.data.data || [])
    } catch {
      setError(true)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { load() }, [selectedProp])

  const selectedName = selectedProp ? properties.find((p) => p.id === selectedProp)?.name : 'All Buildings'

  const categoryChips = [
    { label: '🔥 Overview', active: activeChip === 'all', onClick: () => setActiveChip('all') },
    { label: '🏢 Buildings', active: false, onClick: () => navigate('/owner/properties') },
    { label: '🚪 Units', active: false, onClick: () => navigate('/owner/units') },
    { label: '💳 Rent Manager', active: false, onClick: () => navigate('/owner/rent') },
    { label: '🔧 Fixes', active: false, onClick: () => navigate('/owner/maintenance') },
  ]

  return (
    <MobilePage
      role="owner"
      header={
        <MobileHeader
          searchPlaceholder="Search flats, tenants, rent..."
          chips={categoryChips}
          rightAction={
            <button
              onClick={() => navigate('/owner/notifications')}
              className="btn btn-ghost btn-icon"
              style={{ position: 'relative' }}
              aria-label="Notifications"
            >
              <Bell size={20} />
            </button>
          }
        />
      }
    >
      {/* Top Header Controls: Building Selector & Organization Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => setShowPropSelect(!showPropSelect)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.45rem 1rem', borderRadius: 'var(--radius-full)',
              background: '#0F172A', border: 'none',
              color: 'white', fontWeight: 700, fontSize: '0.8125rem',
              cursor: 'pointer', boxShadow: 'var(--shadow-xs)',
            }}
            aria-expanded={showPropSelect}
          >
            <Building2 size={15} />
            {selectedName}
            <ChevronRight size={14} style={{ transform: showPropSelect ? 'rotate(90deg)' : 'none', transition: '0.15s' }} />
          </button>

          <span style={{ fontSize: '0.8125rem', color: '#64748B', fontWeight: 600 }}>
            {summary?.organization_name || user?.organization_name || 'Organization'}
          </span>
        </div>

        {/* Desktop Quick New Buttons */}
        <div className="hidden-mobile" style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => navigate('/owner/units?new=true')}
            style={{ gap: '0.25rem' }}
          >
            <Plus size={14} /> Add Flat
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => navigate('/owner/properties/new')}
            style={{ gap: '0.25rem' }}
          >
            <Plus size={14} /> New Building
          </button>
        </div>
      </div>

      {/* Property selector dropdown */}
      {showPropSelect && (
        <div className="card animate-fade-in" style={{ marginBottom: '1rem', padding: '0.5rem', overflow: 'hidden' }}>
          {[{ id: '', name: 'All Buildings' }, ...properties].map((p) => (
            <button
              key={p.id}
              onClick={() => { setSelectedProp(p.id); setShowPropSelect(false) }}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '0.625rem 0.75rem', borderRadius: 'var(--radius-md)',
                background: selectedProp === p.id ? '#0F172A' : 'transparent',
                color: selectedProp === p.id ? 'white' : '#0F172A',
                fontWeight: selectedProp === p.id ? 700 : 500,
                fontSize: '0.875rem', border: 'none', cursor: 'pointer',
              }}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <SkeletonKpi />
          <SkeletonKpi />
        </div>
      ) : error || !summary ? (
        <ErrorState onRetry={load} />
      ) : (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
          
          {/* Executive Overview: Split Hero Card (Left) + 4 Quick Stat Tiles (Right) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem', alignItems: 'stretch' }}>
            
            {/* Left: Compact Hero Financial Card */}
            <div
              className="hero-banner"
              onClick={() => navigate('/owner/rent')}
              style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 180, padding: '1.25rem 1.5rem', cursor: 'pointer' }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', opacity: 0.9, display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <Sparkles size={14} /> Collected Rent ({now.toLocaleString('default', { month: 'short' })})
                  </span>
                  <span style={{ background: 'rgba(255, 255, 255, 0.2)', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-full)', fontSize: '0.6875rem', fontWeight: 800 }}>
                    {summary.collection_rate}%
                  </span>
                </div>

                <h1 style={{ fontWeight: 900, fontSize: '2rem', margin: '0 0 0.5rem', letterSpacing: '-0.025em', fontVariantNumeric: 'tabular-nums' }}>
                  {formatCurrency(summary.collected_rent)}
                </h1>
              </div>

              <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8125rem', opacity: 0.95, paddingTop: '0.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.15)' }}>
                <span>Expected: <strong>{formatCurrency(summary.expected_rent)}</strong></span>
                <span>Pending: <strong>{formatCurrency(summary.pending_rent)}</strong></span>
              </div>
            </div>

            {/* Right: 4 Sleek KPI Tiles */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
              
              {/* Occupancy */}
              <div
                className="card card-hover"
                onClick={() => navigate('/owner/units')}
                style={{ padding: '0.875rem 1rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>Occupancy Rate</span>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
                    <Users size={15} />
                  </div>
                </div>
                <p style={{ fontWeight: 800, fontSize: '1.375rem', margin: '0 0 0.125rem', fontVariantNumeric: 'tabular-nums', color: '#0F172A' }}>
                  {summary.occupancy_rate}%
                </p>
                <p style={{ fontSize: '0.6875rem', color: '#64748B', margin: 0 }}>
                  {summary.occupied_units} of {summary.total_units} filled
                </p>
              </div>

              {/* Expenses */}
              <div
                className="card card-hover"
                onClick={() => navigate('/owner/expenses')}
                style={{ padding: '0.875rem 1rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>Expenses</span>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: '#FFF1F2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E11D48' }}>
                    <TrendingDown size={15} />
                  </div>
                </div>
                <p style={{ fontWeight: 800, fontSize: '1.375rem', margin: '0 0 0.125rem', fontVariantNumeric: 'tabular-nums', color: '#0F172A' }}>
                  {formatCurrency(summary.total_expenses)}
                </p>
                <p style={{ fontSize: '0.6875rem', color: '#64748B', margin: 0 }}>
                  Net: {formatCurrency(summary.net_income)}
                </p>
              </div>

              {/* Expected Rent */}
              <div
                className="card card-hover"
                onClick={() => navigate('/owner/rent')}
                style={{ padding: '0.875rem 1rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>Expected Rent</span>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1E3A8A' }}>
                    <CreditCard size={15} />
                  </div>
                </div>
                <p style={{ fontWeight: 800, fontSize: '1.375rem', margin: '0 0 0.125rem', fontVariantNumeric: 'tabular-nums', color: '#0F172A' }}>
                  {formatCurrency(summary.expected_rent)}
                </p>
                <p style={{ fontSize: '0.6875rem', color: '#64748B', margin: 0 }}>
                  Monthly Target
                </p>
              </div>

              {/* Maintenance */}
              <div
                className="card card-hover"
                onClick={() => navigate('/owner/maintenance')}
                style={{ padding: '0.875rem 1rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>Maintenance</span>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D97706' }}>
                    <Wrench size={15} />
                  </div>
                </div>
                <p style={{ fontWeight: 800, fontSize: '1.375rem', margin: '0 0 0.125rem', fontVariantNumeric: 'tabular-nums', color: '#0F172A' }}>
                  {summary.alerts.open_maintenance}
                </p>
                <p style={{ fontSize: '0.6875rem', color: '#64748B', margin: 0 }}>
                  Open tickets pending
                </p>
              </div>

            </div>

          </div>

          {/* Quick Action Chips (Mobile / Tablet Carousel) */}
          <div>
            <p style={{ fontSize: '0.6875rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748B', letterSpacing: '0.06em', margin: '0 0 0.375rem' }}>
              Quick Actions
            </p>
            <div className="playstore-chips-scroll" style={{ padding: '0 0 0.25rem' }}>
              <button
                className="playstore-chip"
                onClick={() => navigate('/owner/properties/new')}
                style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}
              >
                <Plus size={14} color="#0F172A" /> Add Building
              </button>
              <button
                className="playstore-chip"
                onClick={() => navigate('/owner/units?new=true')}
                style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}
              >
                <Plus size={14} color="#0F172A" /> Add Unit
              </button>
              <button
                className="playstore-chip"
                onClick={() => navigate('/owner/tenants/new')}
                style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}
              >
                <Users size={14} color="#059669" /> Add Tenant
              </button>
              <button
                className="playstore-chip"
                onClick={() => navigate('/owner/rent/generate')}
                style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}
              >
                <DollarSign size={14} color="#D97706" /> Generate Monthly Rent
              </button>
            </div>
          </div>

          {/* Monthly Financial Cash Flow Analytics Chart */}
          {summary.monthly_trend && summary.monthly_trend.length > 0 && (
            <div
              className="card card-hover"
              onClick={() => navigate('/owner/reports')}
              style={{ padding: '1.25rem', width: '100%', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <h2 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0F172A' }}>
                    <BarChart3 size={18} color="#0F172A" /> Cash Flow Analytics
                  </h2>
                  <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '0.125rem 0 0' }}>
                    Historical collections vs expenses • Tap to view detailed reports
                  </p>
                </div>
                <ChevronRight size={18} color="#94A3B8" />
              </div>

              <div style={{ width: '100%', height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={summary.monthly_trend} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#E11D48" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#E11D48" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="month" stroke="#64748B" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748B" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{ background: '#0F172A', border: '1px solid #334155', borderRadius: '10px', color: '#fff', fontSize: '12px' }}
                      formatter={(value: any) => [formatCurrency(Number(value)), '']}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Area type="monotone" dataKey="collected" name="Collected" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorCollected)" />
                    <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#E11D48" strokeWidth={2} fillOpacity={1} fill="url(#colorExpenses)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* 2-Column Grid: Buildings List (Left) & Attention Alerts (Right) */}
          <div className="responsive-two-col">
            
            {/* Buildings List */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.625rem', padding: '0 0.25rem' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, letterSpacing: '-0.01em', color: '#0F172A' }}>
                  Buildings ({properties.length})
                </h2>
                <button
                  onClick={() => navigate('/owner/properties')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0F172A', fontSize: '0.8125rem', fontWeight: 700 }}
                >
                  See all
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {properties.map((p) => (
                  <div
                    key={p.id}
                    className="card card-hover"
                    onClick={() => navigate(`/owner/properties/${p.id}`)}
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
                      background: '#0F172A',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <Building2 size={20} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ fontWeight: 800, fontSize: '0.9375rem', margin: '0 0 0.125rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#0F172A' }}>
                        {p.name}
                      </h3>
                      <p style={{ fontSize: '0.75rem', color: '#64748B', margin: 0 }}>
                        {p.total_units} Units • {p.occupied_units} Occupied • {p.occupancy_rate}% Filled
                      </p>
                    </div>

                    <ChevronRight size={18} color="#94A3B8" />
                  </div>
                ))}
              </div>
            </div>

            {/* Alerts & Action Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              <div style={{ padding: '0 0.25rem' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 800, margin: '0 0 0.625rem', letterSpacing: '-0.01em', color: '#0F172A' }}>
                  Attention & Alerts
                </h2>
              </div>

              {summary.alerts.overdue_invoices > 0 ? (
                <div
                  className="card card-hover"
                  onClick={() => navigate('/owner/rent?status=overdue')}
                  style={{
                    padding: '0.875rem 1rem',
                    borderLeft: '4px solid #E11D48',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <AlertTriangle size={18} color="#E11D48" />
                    <div>
                      <p style={{ fontWeight: 800, fontSize: '0.875rem', margin: 0, color: '#0F172A' }}>
                        {summary.alerts.overdue_invoices} Overdue Rent Invoice(s)
                      </p>
                      <p style={{ fontSize: '0.6875rem', color: '#64748B', margin: '0.125rem 0 0' }}>
                        Tap to view and send payment reminders
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={16} color="#94A3B8" />
                </div>
              ) : (
                <div
                  className="card card-hover"
                  onClick={() => navigate('/owner/rent')}
                  style={{ padding: '0.875rem 1rem', borderLeft: '4px solid #10B981', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                >
                  <div>
                    <p style={{ fontWeight: 700, fontSize: '0.8125rem', margin: 0, color: '#059669', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <CheckCircle2 size={15} /> No Overdue Invoices
                    </p>
                    <p style={{ fontSize: '0.6875rem', color: '#64748B', margin: '0.125rem 0 0' }}>
                      All active tenant billing is on track • Tap to manage rent
                    </p>
                  </div>
                  <ChevronRight size={16} color="#94A3B8" />
                </div>
              )}

              {summary.alerts.open_maintenance > 0 && (
                <div
                  className="card card-hover"
                  onClick={() => navigate('/owner/maintenance?status=open')}
                  style={{
                    padding: '0.875rem 1rem',
                    borderLeft: '4px solid #D97706',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Wrench size={18} color="#D97706" />
                    <div>
                      <p style={{ fontWeight: 800, fontSize: '0.875rem', margin: 0, color: '#0F172A' }}>
                        {summary.alerts.open_maintenance} Open Maintenance Request(s)
                      </p>
                      <p style={{ fontSize: '0.6875rem', color: '#64748B', margin: '0.125rem 0 0' }}>
                        Requires technician review
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={16} color="#94A3B8" />
                </div>
              )}
            </div>

          </div>

        </div>
      )}
    </MobilePage>
  )
}
