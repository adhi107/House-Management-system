import React, { useState, useEffect } from 'react'
import {
  BarChart3,
  Download,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Home,
  Calendar,
  RefreshCw,
  FileSpreadsheet,
  PieChart,
  Building2,
  Users,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Percent,
  Layers,
  Printer
} from 'lucide-react'
import { rentApi, expenseApi, propertyApi, unitApi, tenantApi } from '../../api/client'
import { MobilePage } from '../../components/layout/AppShell'
import { MobileHeader } from '../../components/navigation'
import { formatCurrency, formatDate, ErrorState, SkeletonCard, ProgressBar } from '../../components/ui'
import { useToast } from '../../contexts/ToastContext'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart as RechartsPie,
  Pie,
  Cell
} from 'recharts'

const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16']

export default function ReportsPage() {
  const { success, error, info } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [invoices, setInvoices] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [expenses, setExpenses] = useState<any[]>([])
  const [units, setUnits] = useState<any[]>([])
  const [properties, setProperties] = useState<any[]>([])
  const [timeRange, setTimeRange] = useState<'all' | '6m' | '3m' | 'month'>('all')
  const [selectedPropertyFilter, setSelectedPropertyFilter] = useState('')

  const loadData = async () => {
    setIsLoading(true)
    setHasError(false)
    try {
      const [invRes, payRes, expRes, unitRes, propRes] = await Promise.all([
        rentApi.listInvoices({ per_page: 500 }),
        rentApi.listPayments({ per_page: 500 }),
        expenseApi.list({ per_page: 500 }),
        unitApi.list({ per_page: 500 }),
        propertyApi.list(),
      ])
      setInvoices(invRes.data.data || [])
      setPayments(payRes.data.data || [])
      setExpenses(expRes.data.data || [])
      setUnits(unitRes.data.data || [])
      setProperties(propRes.data.data || [])
    } catch {
      setHasError(true)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Property filtering
  const filteredInvoices = invoices.filter((i) => !selectedPropertyFilter || i.property_id === selectedPropertyFilter)
  const filteredPayments = payments.filter((p) => !selectedPropertyFilter || p.property_id === selectedPropertyFilter)
  const filteredExpenses = expenses.filter((e) => !selectedPropertyFilter || e.property_id === selectedPropertyFilter)
  const filteredUnits = units.filter((u) => !selectedPropertyFilter || u.property_id === selectedPropertyFilter)

  // Core Financial BI Metrics
  const totalInvoiced = filteredInvoices.reduce((acc, i) => acc + (i.total_amount || 0), 0)
  const totalCollected = filteredPayments.reduce((acc, p) => acc + (p.amount || 0), 0)
  const totalPending = filteredInvoices.reduce((acc, i) => acc + (i.pending_amount || 0), 0)
  const totalExpenses = filteredExpenses.reduce((acc, e) => acc + (e.amount || 0), 0)
  const netOperatingIncome = totalCollected - totalExpenses

  // Operational BI Metrics
  const totalUnitsCount = filteredUnits.length
  const occupiedUnitsCount = filteredUnits.filter((u) => u.status === 'occupied').length
  const vacantUnitsCount = filteredUnits.filter((u) => u.status === 'vacant').length
  const occupancyRate = totalUnitsCount > 0 ? ((occupiedUnitsCount / totalUnitsCount) * 100) : 0
  const collectionEfficiency = totalInvoiced > 0 ? ((totalCollected / totalInvoiced) * 100) : 0
  const operatingExpenseRatio = totalCollected > 0 ? ((totalExpenses / totalCollected) * 100) : 0
  const arpu = occupiedUnitsCount > 0 ? Math.round(totalCollected / occupiedUnitsCount) : 0

  // Category Distribution for Expenses (Pie Chart Data)
  const expenseByCategoryMap: Record<string, number> = {}
  filteredExpenses.forEach((e) => {
    const cat = e.category || 'general'
    expenseByCategoryMap[cat] = (expenseByCategoryMap[cat] || 0) + (e.amount || 0)
  })
  const expensePieData = Object.keys(expenseByCategoryMap).map((cat) => ({
    name: cat.replace('_', ' ').toUpperCase(),
    value: expenseByCategoryMap[cat],
  }))

  // Monthly Cash Flow Chart Aggregation
  const monthlyDataMap: Record<string, { month: string; collected: number; expenses: number; net: number }> = {}
  
  filteredPayments.forEach((p) => {
    const m = p.billing_month || (p.payment_date ? p.payment_date.slice(0, 7) : '2026-09')
    if (!monthlyDataMap[m]) {
      monthlyDataMap[m] = { month: m, collected: 0, expenses: 0, net: 0 }
    }
    monthlyDataMap[m].collected += p.amount || 0
  })

  filteredExpenses.forEach((e) => {
    const m = e.date ? e.date.slice(0, 7) : '2026-09'
    if (!monthlyDataMap[m]) {
      monthlyDataMap[m] = { month: m, collected: 0, expenses: 0, net: 0 }
    }
    monthlyDataMap[m].expenses += e.amount || 0
  })

  const cashFlowTimeline = Object.keys(monthlyDataMap)
    .sort()
    .map((k) => {
      const item = monthlyDataMap[k]
      return {
        ...item,
        monthLabel: new Date(k + '-01').toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
        net: item.collected - item.expenses,
      }
    })

  // Export Comprehensive Business Intelligence Report CSV
  const handleExportCSV = () => {
    const summaryRows = [
      ['BUSINESS INTELLIGENCE & PROPERTY AUDIT REPORT'],
      ['Generated At', new Date().toLocaleString()],
      ['Filter Applied', selectedPropertyFilter ? (properties.find(p => p.id === selectedPropertyFilter)?.name || selectedPropertyFilter) : 'All Properties'],
      [],
      ['EXECUTIVE FINANCIAL SUMMARY', 'VALUE'],
      ['Total Invoiced Revenue', totalInvoiced],
      ['Total Verified Collections', totalCollected],
      ['Total Outstanding Dues', totalPending],
      ['Total Operating Expenses', totalExpenses],
      ['Net Operating Income (NOI)', netOperatingIncome],
      ['Collection Efficiency Rate', `${collectionEfficiency.toFixed(1)}%`],
      ['Operating Expense Ratio (OER)', `${operatingExpenseRatio.toFixed(1)}%`],
      ['Occupancy Rate', `${occupancyRate.toFixed(1)}% (${occupiedUnitsCount}/${totalUnitsCount} Units)`],
      ['Avg Revenue Per Unit (ARPU)', arpu],
      [],
      ['EXPENSE BREAKDOWN BY CATEGORY'],
      ['Category', 'Total Amount (INR)'],
      ...expensePieData.map((d) => [d.name, d.value]),
      [],
      ['BUILDING PERFORMANCE MATRIX'],
      ['Building Name', 'Total Units', 'Occupied', 'Occupancy Rate', 'Total Revenue'],
      ...properties.map((p) => {
        const pUnits = units.filter((u) => u.property_id === p.id)
        const pOcc = pUnits.filter((u) => u.status === 'occupied').length
        const pRate = pUnits.length > 0 ? ((pOcc / pUnits.length) * 100).toFixed(1) : '0'
        const pRev = payments.filter((pay) => pay.property_id === p.id).reduce((s, pay) => s + (pay.amount || 0), 0)
        return [p.name, pUnits.length, pOcc, `${pRate}%`, pRev]
      }),
      [],
      ['TRANSACTION AUDIT LOG'],
      ['Receipt #', 'Tenant', 'Unit', 'Month', 'Amount', 'Date', 'Method', 'Transaction Ref'],
      ...filteredPayments.map((p) => [
        p.receipt_number || '',
        `"${p.tenant_name || ''}"`,
        `"${p.unit_number || ''}"`,
        p.billing_month || '',
        p.amount || 0,
        p.payment_date || '',
        p.payment_method || '',
        `"${p.transaction_reference || ''}"`,
      ]),
    ]

    const csvContent = summaryRows.map((e) => e.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `PropertyHub_BI_Executive_Report_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    success('Executive BI report exported to CSV successfully!')
  }

  return (
    <MobilePage
      role="owner"
      header={
        <MobileHeader
          title="BI Analytics & Reports"
          showBack
          rightAction={
            <button
              className="btn btn-primary btn-sm"
              onClick={handleExportCSV}
              style={{ gap: '0.25rem' }}
            >
              <Download size={15} /> Export
            </button>
          }
        />
      }
    >
      {/* Desktop Header Row */}
      <div className="hidden-mobile" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 900, margin: 0, color: '#0F172A', letterSpacing: '-0.02em' }}>
            Executive Business Intelligence & Financial Analytics
          </h1>
          <p style={{ fontSize: '0.8125rem', color: '#64748B', margin: '0.15rem 0 0' }}>
            Multi-building performance metrics, NOI cash flows, expense ratios, yield analysis, and tax audit reports
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={loadData} style={{ gap: '0.375rem' }}>
            <RefreshCw size={14} /> Refresh Data
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleExportCSV}
            style={{ gap: '0.375rem', backgroundColor: '#2563EB', borderColor: '#2563EB', fontWeight: 700 }}
          >
            <FileSpreadsheet size={15} /> Export Executive BI Report
          </button>
        </div>
      </div>

      {/* FILTER CONTROLS BAR */}
      <div
        className="card"
        style={{
          padding: '0.875rem 1.125rem',
          marginBottom: '1.25rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.75rem',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#FFFFFF',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Building2 size={16} color="#2563EB" />
          <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0F172A' }}>Filter Scope:</span>
          <select
            className="input"
            style={{ height: 36, width: 'auto', minWidth: 180, fontSize: '0.8125rem' }}
            value={selectedPropertyFilter}
            onChange={(e) => setSelectedPropertyFilter(e.target.value)}
          >
            <option value="">🏢 Portfolio Wide (All Buildings)</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '0.375rem' }}>
          {[
            { key: 'all', label: 'All Time' },
            { key: '6m', label: 'Past 6 Months' },
            { key: '3m', label: 'Past Quarter' },
            { key: 'month', label: 'This Month' },
          ].map((t) => (
            <button
              key={t.key}
              type="button"
              className={`btn btn-sm ${timeRange === t.key ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.75rem', height: 32 }}
              onClick={() => setTimeRange(t.key as any)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : hasError ? (
        <ErrorState onRetry={loadData} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* TOP EXECUTIVE KPI TILES (4 CARDS) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            
            {/* Net Operating Income (NOI) */}
            <div
              className="card"
              style={{
                padding: '1.25rem',
                borderLeft: `4px solid ${netOperatingIncome >= 0 ? '#10B981' : '#EF4444'}`,
                background: '#FFFFFF',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748B' }}>
                  Net Operating Income (NOI)
                </span>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: netOperatingIncome >= 0 ? '#ECFDF5' : '#FEF2F2', color: netOperatingIncome >= 0 ? '#059669' : '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TrendingUp size={16} />
                </div>
              </div>
              <p style={{ fontSize: '1.75rem', fontWeight: 900, margin: '0 0 0.15rem', color: netOperatingIncome >= 0 ? '#047857' : '#DC2626', fontVariantNumeric: 'tabular-nums' }}>
                {formatCurrency(netOperatingIncome)}
              </p>
              <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 500 }}>
                Revenue ({formatCurrency(totalCollected)}) - Expenses ({formatCurrency(totalExpenses)})
              </span>
            </div>

            {/* Collection Efficiency Rate */}
            <div
              className="card"
              style={{
                padding: '1.25rem',
                borderLeft: '4px solid #2563EB',
                background: '#FFFFFF',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748B' }}>
                  Collection Efficiency
                </span>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Percent size={16} />
                </div>
              </div>
              <p style={{ fontSize: '1.75rem', fontWeight: 900, margin: '0 0 0.15rem', color: '#1D4ED8', fontVariantNumeric: 'tabular-nums' }}>
                {collectionEfficiency.toFixed(1)}%
              </p>
              <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 500 }}>
                {formatCurrency(totalCollected)} of {formatCurrency(totalInvoiced)} billed
              </span>
            </div>

            {/* Occupancy Rate */}
            <div
              className="card"
              style={{
                padding: '1.25rem',
                borderLeft: '4px solid #8B5CF6',
                background: '#FFFFFF',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748B' }}>
                  Portfolio Occupancy
                </span>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#F5F3FF', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={16} />
                </div>
              </div>
              <p style={{ fontSize: '1.75rem', fontWeight: 900, margin: '0 0 0.15rem', color: '#6D28D9', fontVariantNumeric: 'tabular-nums' }}>
                {occupancyRate.toFixed(1)}%
              </p>
              <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 500 }}>
                {occupiedUnitsCount} filled • {vacantUnitsCount} vacant units
              </span>
            </div>

            {/* ARPU (Avg Revenue Per Unit) */}
            <div
              className="card"
              style={{
                padding: '1.25rem',
                borderLeft: '4px solid #D97706',
                background: '#FFFFFF',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748B' }}>
                  Avg Revenue / Unit
                </span>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <DollarSign size={16} />
                </div>
              </div>
              <p style={{ fontSize: '1.75rem', fontWeight: 900, margin: '0 0 0.15rem', color: '#B45309', fontVariantNumeric: 'tabular-nums' }}>
                {formatCurrency(arpu)}
              </p>
              <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 500 }}>
                Monthly average per occupied unit
              </span>
            </div>

          </div>

          {/* TWO-COLUMN CHARTS: CASH FLOW TREND + EXPENSE CATEGORIES */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            
            {/* Chart 1: Revenue vs Expense Timeline */}
            <div className="card" style={{ padding: '1.25rem', background: '#FFFFFF' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>
                    Cash Flow & Net Profit Trajectory
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '0.15rem 0 0' }}>
                    Monthly collections vs operating outflows
                  </p>
                </div>
              </div>

              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={cashFlowTimeline} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.35}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.35}/>
                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="monthLabel" stroke="#64748B" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748B" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{ background: '#0F172A', border: '1px solid #334155', borderRadius: '10px', color: '#fff', fontSize: '12px' }}
                      formatter={(value: any) => [formatCurrency(Number(value)), '']}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Area type="monotone" dataKey="collected" name="Collections" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
                    <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#EF4444" strokeWidth={2.5} fillOpacity={1} fill="url(#colorExp)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Expense Allocation by Category */}
            <div className="card" style={{ padding: '1.25rem', background: '#FFFFFF' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>
                    Operating Expense Allocation
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '0.15rem 0 0' }}>
                    Cost breakdown across maintenance, utilities & operations
                  </p>
                </div>
              </div>

              {expensePieData.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 0', color: '#94A3B8' }}>
                  No operating expenses logged yet
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ width: '100%', height: 160 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPie>
                        <Pie
                          data={expensePieData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={65}
                          innerRadius={35}
                          paddingAngle={3}
                        >
                          {expensePieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ background: '#0F172A', border: '1px solid #334155', borderRadius: '10px', color: '#fff', fontSize: '12px' }}
                          formatter={(value: any) => [formatCurrency(Number(value)), 'Amount']}
                        />
                      </RechartsPie>
                    </ResponsiveContainer>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.75rem' }}>
                    {expensePieData.map((d, i) => (
                      <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                        <span style={{ color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}:</span>
                        <strong style={{ color: '#0F172A', marginLeft: 'auto' }}>{formatCurrency(d.value)}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* BUILDING PERFORMANCE AUDIT MATRIX */}
          <div className="card" style={{ padding: '1.25rem', background: '#FFFFFF' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.0625rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>
                  Building Performance & Portfolio Matrix
                </h3>
                <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '0.15rem 0 0' }}>
                  Unit occupancy, collection efficiency, and revenue yield per building
                </p>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #E2E8F0', textAlign: 'left', color: '#64748B' }}>
                    <th style={{ padding: '0.625rem 0.75rem', fontWeight: 700 }}>Building Name</th>
                    <th style={{ padding: '0.625rem 0.75rem', fontWeight: 700 }}>Total Units</th>
                    <th style={{ padding: '0.625rem 0.75rem', fontWeight: 700 }}>Occupancy</th>
                    <th style={{ padding: '0.625rem 0.75rem', fontWeight: 700 }}>Revenue Collected</th>
                    <th style={{ padding: '0.625rem 0.75rem', fontWeight: 700 }}>Expenses</th>
                    <th style={{ padding: '0.625rem 0.75rem', fontWeight: 700 }}>Net Yield</th>
                  </tr>
                </thead>
                <tbody>
                  {properties.map((p) => {
                    const pUnits = units.filter((u) => u.property_id === p.id)
                    const pOcc = pUnits.filter((u) => u.status === 'occupied').length
                    const pRate = pUnits.length > 0 ? Math.round((pOcc / pUnits.length) * 100) : 0
                    const pRev = payments.filter((pay) => pay.property_id === p.id).reduce((s, pay) => s + (pay.amount || 0), 0)
                    const pExp = expenses.filter((e) => e.property_id === p.id).reduce((s, e) => s + (e.amount || 0), 0)
                    const pNet = pRev - pExp

                    return (
                      <tr key={p.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '0.75rem', fontWeight: 800, color: '#0F172A' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Building2 size={16} color="#2563EB" />
                            {p.name}
                          </div>
                        </td>
                        <td style={{ padding: '0.75rem', color: '#64748B' }}>
                          {pUnits.length} Units
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <span style={{ fontWeight: 700, color: pRate >= 80 ? '#059669' : pRate >= 50 ? '#D97706' : '#DC2626' }}>
                            {pRate}%
                          </span>
                          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', marginLeft: 4 }}>({pOcc}/{pUnits.length})</span>
                        </td>
                        <td style={{ padding: '0.75rem', fontWeight: 800, color: '#059669', fontVariantNumeric: 'tabular-nums' }}>
                          {formatCurrency(pRev)}
                        </td>
                        <td style={{ padding: '0.75rem', fontWeight: 700, color: '#DC2626', fontVariantNumeric: 'tabular-nums' }}>
                          {formatCurrency(pExp)}
                        </td>
                        <td style={{ padding: '0.75rem', fontWeight: 800, color: pNet >= 0 ? '#2563EB' : '#DC2626', fontVariantNumeric: 'tabular-nums' }}>
                          {formatCurrency(pNet)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}
    </MobilePage>
  )
}
