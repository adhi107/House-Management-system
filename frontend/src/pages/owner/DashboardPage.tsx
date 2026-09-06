import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  Plus,
  TrendingUp,
  TrendingDown,
  Building2,
  Users,
  Home,
  AlertTriangle,
  ChevronRight,
  RefreshCw,
  Sparkles,
  CreditCard,
  Wrench,
  FilePlus,
  DollarSign,
  BarChart3,
  CheckCircle2,
  ArrowUpRight,
  Clock,
  Send,
  Megaphone,
  FileText,
  ShieldCheck,
  Receipt,
  Layers,
  ArrowRight,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { dashboardApi, propertyApi } from '../../api/client'
import { DashboardSummary, Property } from '../../types'
import { MobilePage } from '../../components/layout/AppShell'
import { MobileHeader } from '../../components/navigation'
import { formatCurrency, SkeletonKpi, EmptyState, ErrorState, StatusBadge, ProgressBar } from '../../components/ui'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

export default function OwnerDashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [properties, setProperties] = useState<Property[]>([])
  const [selectedProp, setSelectedProp] = useState<string>('')
  const [unreadNotifs, setUnreadNotifs] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)
  const [showPropSelect, setShowPropSelect] = useState(false)
  const [activeChip, setActiveChip] = useState<'all' | 'rent' | 'units'>('all')

  const now = new Date()

  const load = async () => {
    setIsLoading(true)
    setError(false)
    try {
      const [sumRes, propRes, notifRes] = await Promise.all([
        dashboardApi.getSummary(selectedProp || undefined),
        propertyApi.list(),
        import('../../api/client').then(m => m.notificationApi.list().catch(() => ({ data: { unread_count: 0 } }))),
      ])
      setSummary(sumRes.data.data)
      setProperties(propRes.data.data || [])
      setUnreadNotifs(notifRes.data?.unread_count || 0)
    } catch {
      setError(true)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [selectedProp])

  const selectedName = selectedProp
    ? properties.find((p) => p.id === selectedProp)?.name
    : 'All Buildings'

  const categoryChips = [
    { label: '🔥 Overview', active: activeChip === 'all', onClick: () => setActiveChip('all') },
    { label: '🏢 Buildings', active: false, onClick: () => navigate('/owner/properties') },
    { label: '🚪 Units', active: false, onClick: () => navigate('/owner/units') },
    { label: '💳 Rent Manager', active: false, onClick: () => navigate('/owner/rent') },
    { label: '🔧 Maintenance', active: false, onClick: () => navigate('/owner/maintenance') },
    { label: '📊 BI Reports', active: false, onClick: () => navigate('/owner/reports') },
  ]

  return (
    <MobilePage
      role="owner"
      header={
        <MobileHeader
          searchPlaceholder="Search flats, tenants, rent invoices..."
          chips={categoryChips}
          rightAction={
            <button
              onClick={() => navigate('/owner/notifications')}
              className="btn btn-ghost btn-icon"
              style={{ position: 'relative' }}
              aria-label="Notifications"
            >
              <Bell size={20} />
              {unreadNotifs > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: 2,
                    right: 2,
                    minWidth: 16,
                    height: 16,
                    borderRadius: '50%',
                    background: '#EF4444',
                    color: 'white',
                    fontSize: '0.6rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 3px',
                    boxShadow: '0 0 0 2px #FFFFFF',
                  }}
                >
                  {unreadNotifs > 9 ? '9+' : unreadNotifs}
                </span>
              )}
            </button>
          }
        />
      }
    >
      {/* Top Header Controls: Building Selector & Organization Breadcrumb */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.25rem',
          width: '100%',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowPropSelect(!showPropSelect)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.45rem 1rem',
                borderRadius: '2rem',
                background: '#0F172A',
                border: 'none',
                color: 'white',
                fontWeight: 700,
                fontSize: '0.8125rem',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(15, 23, 42, 0.15)',
              }}
              aria-expanded={showPropSelect}
            >
              <Building2 size={15} />
              <span>{selectedName}</span>
              <ChevronRight
                size={14}
                style={{
                  transform: showPropSelect ? 'rotate(90deg)' : 'none',
                  transition: '0.15s',
                }}
              />
            </button>

            {/* Dropdown Menu */}
            {showPropSelect && (
              <div
                className="card animate-fade-in"
                style={{
                  position: 'absolute',
                  top: '120%',
                  left: 0,
                  zIndex: 100,
                  minWidth: 220,
                  padding: '0.375rem',
                  borderRadius: '0.75rem',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                }}
              >
                {[{ id: '', name: 'All Buildings' }, ...properties].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSelectedProp(p.id)
                      setShowPropSelect(false)
                    }}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '0.5rem',
                      background: selectedProp === p.id ? '#EFF6FF' : 'transparent',
                      color: selectedProp === p.id ? '#1D4ED8' : '#0F172A',
                      fontWeight: selectedProp === p.id ? 700 : 500,
                      fontSize: '0.8125rem',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <span style={{ fontSize: '0.8125rem', color: '#64748B', fontWeight: 600 }}>
            {summary?.organization_name || user?.organization_name || 'Organization'}
          </span>
        </div>

        {/* Desktop Quick Shortcuts */}
        <div className="hidden-mobile" style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => navigate('/owner/rent/generate')}
            style={{ gap: '0.25rem', color: '#2563EB', background: '#EFF6FF', borderColor: '#BFDBFE', fontWeight: 600 }}
          >
            ⚡ Generate Invoices
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => navigate('/owner/units')}
            style={{ gap: '0.25rem' }}
          >
            <Plus size={14} /> Add Flat
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => navigate('/owner/properties/new')}
            style={{ gap: '0.25rem', fontWeight: 700 }}
          >
            <Plus size={14} /> New Building
          </button>
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <SkeletonKpi />
          <SkeletonKpi />
        </div>
      ) : error || !summary ? (
        <ErrorState onRetry={load} />
      ) : (
        <div
          className="animate-fade-in"
          style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}
        >
          {/* EXECUTIVE OVERVIEW: HERO FINANCIAL CARD (LEFT) + 4 METRIC TILES (RIGHT) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '1rem',
              alignItems: 'stretch',
            }}
          >
            {/* Left: Compact Hero Financial Card with Net Operating Income */}
            <div
              className="hero-banner"
              onClick={() => navigate('/owner/rent')}
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: 180,
                padding: '1.25rem 1.5rem',
                cursor: 'pointer',
                borderRadius: '1rem',
                boxShadow: '0 8px 24px rgba(15, 23, 42, 0.2)',
              }}
            >
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '0.375rem',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      opacity: 0.9,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                    }}
                  >
                    <Sparkles size={14} /> Collected Rent ({now.toLocaleString('default', { month: 'short' })})
                  </span>
                  <span
                    style={{
                      background: 'rgba(255, 255, 255, 0.2)',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '1rem',
                      fontSize: '0.6875rem',
                      fontWeight: 800,
                    }}
                  >
                    {summary.collection_rate}% Collection Rate
                  </span>
                </div>

                <h1
                  style={{
                    fontWeight: 900,
                    fontSize: '2.125rem',
                    margin: '0 0 0.5rem',
                    letterSpacing: '-0.025em',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {formatCurrency(summary.collected_rent)}
                </h1>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.8125rem',
                  opacity: 0.95,
                  paddingTop: '0.5rem',
                  borderTop: '1px solid rgba(255, 255, 255, 0.15)',
                }}
              >
                <span>Target: <strong>{formatCurrency(summary.expected_rent)}</strong></span>
                <span>Pending: <strong>{formatCurrency(summary.pending_rent)}</strong></span>
                <span>Net NOI: <strong>{formatCurrency(summary.net_income)}</strong></span>
              </div>
            </div>

            {/* Right: 4 Sleek KPI Tiles */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
              {/* Occupancy */}
              <div
                className="card card-hover"
                onClick={() => navigate('/owner/units')}
                style={{
                  padding: '0.875rem 1rem',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderRadius: '0.75rem',
                  border: '1px solid #E2E8F0',
                }}
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
                style={{
                  padding: '0.875rem 1rem',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderRadius: '0.75rem',
                  border: '1px solid #E2E8F0',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>OPEX Expenses</span>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: '#FFF1F2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E11D48' }}>
                    <TrendingDown size={15} />
                  </div>
                </div>
                <p style={{ fontWeight: 800, fontSize: '1.375rem', margin: '0 0 0.125rem', fontVariantNumeric: 'tabular-nums', color: '#0F172A' }}>
                  {formatCurrency(summary.total_expenses)}
                </p>
                <p style={{ fontSize: '0.6875rem', color: '#059669', margin: 0, fontWeight: 600 }}>
                  Net: {formatCurrency(summary.net_income)}
                </p>
              </div>

              {/* Expected Target */}
              <div
                className="card card-hover"
                onClick={() => navigate('/owner/rent')}
                style={{
                  padding: '0.875rem 1rem',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderRadius: '0.75rem',
                  border: '1px solid #E2E8F0',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>Expected Target</span>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1E3A8A' }}>
                    <CreditCard size={15} />
                  </div>
                </div>
                <p style={{ fontWeight: 800, fontSize: '1.375rem', margin: '0 0 0.125rem', fontVariantNumeric: 'tabular-nums', color: '#0F172A' }}>
                  {formatCurrency(summary.expected_rent)}
                </p>
                <p style={{ fontSize: '0.6875rem', color: '#64748B', margin: 0 }}>
                  Monthly Projected Target
                </p>
              </div>

              {/* Maintenance */}
              <div
                className="card card-hover"
                onClick={() => navigate('/owner/maintenance')}
                style={{
                  padding: '0.875rem 1rem',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderRadius: '0.75rem',
                  border: '1px solid #E2E8F0',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>Repairs Queue</span>
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

          {/* COMMAND CENTER QUICK ACTION HUB */}
          <div>
            <p
              style={{
                fontSize: '0.6875rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                color: '#64748B',
                letterSpacing: '0.06em',
                margin: '0 0 0.5rem',
              }}
            >
              Operations & Quick Actions
            </p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '0.625rem',
              }}
            >
              {[
                { label: 'Generate Rent', icon: <DollarSign size={16} color="#059669" />, desc: 'Batch invoice cycle', to: '/owner/rent/generate', bg: '#ECFDF5' },
                { label: 'Verify Claims', icon: <Clock size={16} color="#D97706" />, desc: 'Tenant payment proofs', to: '/owner/rent?status=under_review', bg: '#FFFBEB' },
                { label: 'Record Expense', icon: <Receipt size={16} color="#DC2626" />, desc: 'Disburse OPEX bill', to: '/owner/expenses', bg: '#FEF2F2' },
                { label: 'Add Resident', icon: <Users size={16} color="#2563EB" />, desc: 'New tenant profile', to: '/owner/tenants/new', bg: '#EFF6FF' },
                { label: 'New Lease', icon: <FileText size={16} color="#7C3AED" />, desc: 'Rental agreement', to: '/owner/agreements', bg: '#F5F3FF' },
                { label: 'Announcements', icon: <Megaphone size={16} color="#0891B2" />, desc: 'Broadcast to tenants', to: '/owner/announcements', bg: '#ECFEFF' },
              ].map((act) => (
                <button
                  key={act.label}
                  type="button"
                  onClick={() => navigate(act.to)}
                  className="card card-hover"
                  style={{
                    padding: '0.75rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: 88,
                    textAlign: 'left',
                    cursor: 'pointer',
                    borderRadius: '0.625rem',
                    border: '1px solid #E2E8F0',
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '0.5rem',
                      background: act.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '0.35rem',
                    }}
                  >
                    {act.icon}
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.8125rem', fontWeight: 800, margin: '0 0 0.1rem', color: '#0F172A' }}>
                      {act.label}
                    </h4>
                    <p style={{ fontSize: '0.6875rem', color: '#64748B', margin: 0 }}>
                      {act.desc}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* MONTHLY FINANCIAL CASH FLOW ANALYTICS CHART */}
          {summary.monthly_trend && summary.monthly_trend.length > 0 && (
            <div
              className="card card-hover"
              onClick={() => navigate('/owner/reports')}
              style={{ padding: '1.25rem', width: '100%', cursor: 'pointer', borderRadius: '0.875rem', border: '1px solid #E2E8F0' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <h2
                    style={{
                      fontSize: '1rem',
                      fontWeight: 800,
                      margin: 0,
                      letterSpacing: '-0.01em',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      color: '#0F172A',
                    }}
                  >
                    <BarChart3 size={18} color="#0F172A" /> Cash Flow Analytics & NOI Curve
                  </h2>
                  <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '0.125rem 0 0' }}>
                    Historical collections vs expenses • Tap to view deep BI intelligence reports
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#2563EB', fontSize: '0.8125rem', fontWeight: 700 }}>
                  <span>Full BI Hub</span>
                  <ChevronRight size={16} />
                </div>
              </div>

              <div style={{ width: '100%', height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={summary.monthly_trend} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#E11D48" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#E11D48" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="month" stroke="#64748B" fontSize={11} tickLine={false} />
                    <YAxis
                      stroke="#64748B"
                      fontSize={11}
                      tickLine={false}
                      tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        background: '#0F172A',
                        border: '1px solid #334155',
                        borderRadius: '10px',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                      formatter={(value: any) => [formatCurrency(Number(value)), '']}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Area
                      type="monotone"
                      dataKey="collected"
                      name="Collected Rent"
                      stroke="#10B981"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorCollected)"
                    />
                    <Area
                      type="monotone"
                      dataKey="expenses"
                      name="Expenses"
                      stroke="#E11D48"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorExpenses)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* 2-COLUMN SECTION: BUILDINGS PORTFOLIO & ATTENTION RADAR */}
          <div className="responsive-two-col">
            {/* Buildings List & Floor Matrix Shortcut */}
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.625rem',
                  padding: '0 0.25rem',
                }}
              >
                <h2 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, letterSpacing: '-0.01em', color: '#0F172A' }}>
                  Buildings Portfolio ({properties.length})
                </h2>
                <button
                  onClick={() => navigate('/owner/properties')}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#2563EB',
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                  }}
                >
                  Manage all →
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
                      borderRadius: '0.75rem',
                      border: '1px solid #E2E8F0',
                    }}
                  >
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 12,
                        background: '#0F172A',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Building2 size={20} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3
                        style={{
                          fontWeight: 800,
                          fontSize: '0.9375rem',
                          margin: '0 0 0.125rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          color: '#0F172A',
                        }}
                      >
                        {p.name}
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: '#64748B' }}>
                        <span>{p.total_units} Flats</span>
                        <span>•</span>
                        <span style={{ color: p.occupancy_rate >= 80 ? '#059669' : '#D97706', fontWeight: 600 }}>
                          {p.occupied_units} Occupied ({p.occupancy_rate}%)
                        </span>
                      </div>
                    </div>

                    <ChevronRight size={18} color="#94A3B8" />
                  </div>
                ))}
              </div>
            </div>

            {/* Attention & Action Items Radar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              <div style={{ padding: '0 0.25rem' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 800, margin: '0 0 0.625rem', letterSpacing: '-0.01em', color: '#0F172A' }}>
                  Attention Radar & Alerts
                </h2>
              </div>

              {/* Pending Payment Verification Alert */}
              {summary.alerts.under_review_invoices && summary.alerts.under_review_invoices > 0 ? (
                <div
                  className="card card-hover"
                  onClick={() => navigate('/owner/rent?status=under_review')}
                  style={{
                    padding: '0.875rem 1rem',
                    borderLeft: '4px solid #F59E0B',
                    background: '#FFFBEB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    borderRadius: '0.75rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Clock size={18} color="#D97706" />
                    <div>
                      <p style={{ fontWeight: 800, fontSize: '0.875rem', margin: 0, color: '#92400E' }}>
                        ⏳ {summary.alerts.under_review_invoices} Tenant Payment Proof(s) Awaiting Approval
                      </p>
                      <p style={{ fontSize: '0.6875rem', color: '#B45309', margin: '0.125rem 0 0' }}>
                        Inspect uploaded screenshot and 1-click issue receipts
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={16} color="#D97706" />
                </div>
              ) : null}

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
                    borderRadius: '0.75rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <AlertTriangle size={18} color="#E11D48" />
                    <div>
                      <p style={{ fontWeight: 800, fontSize: '0.875rem', margin: 0, color: '#0F172A' }}>
                        {summary.alerts.overdue_invoices} Overdue Rent Invoice(s)
                      </p>
                      <p style={{ fontSize: '0.6875rem', color: '#64748B', margin: '0.125rem 0 0' }}>
                        Tap to send automated WhatsApp / SMS reminders
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={16} color="#94A3B8" />
                </div>
              ) : (
                <div
                  className="card card-hover"
                  onClick={() => navigate('/owner/rent')}
                  style={{
                    padding: '0.875rem 1rem',
                    borderLeft: '4px solid #10B981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    borderRadius: '0.75rem',
                  }}
                >
                  <div>
                    <p style={{ fontWeight: 700, fontSize: '0.8125rem', margin: 0, color: '#059669', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <CheckCircle2 size={15} /> All Active Invoices Up to Date
                    </p>
                    <p style={{ fontSize: '0.6875rem', color: '#64748B', margin: '0.125rem 0 0' }}>
                      Zero overdue invoices • 100% financial health
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
                    borderRadius: '0.75rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Wrench size={18} color="#D97706" />
                    <div>
                      <p style={{ fontWeight: 800, fontSize: '0.875rem', margin: 0, color: '#0F172A' }}>
                        {summary.alerts.open_maintenance} Open Maintenance Ticket(s)
                      </p>
                      <p style={{ fontSize: '0.6875rem', color: '#64748B', margin: '0.125rem 0 0' }}>
                        Requires technician assignment and repair conversion
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
