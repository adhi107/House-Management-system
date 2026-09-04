import React, { useState, useEffect } from 'react'
import { BarChart3, Download, DollarSign, TrendingUp, TrendingDown, Home, Calendar, RefreshCw, FileSpreadsheet } from 'lucide-react'
import { rentApi, expenseApi, propertyApi, unitApi } from '../../api/client'
import { MobilePage } from '../../components/layout/AppShell'
import { MobileHeader } from '../../components/navigation'
import { formatCurrency, ErrorState, SkeletonCard } from '../../components/ui'

export default function ReportsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)
  const [invoices, setInvoices] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [expenses, setExpenses] = useState<any[]>([])
  const [units, setUnits] = useState<any[]>([])

  const load = async () => {
    setIsLoading(true)
    setError(false)
    try {
      const [invRes, payRes, expRes, unitRes] = await Promise.all([
        rentApi.listInvoices({ per_page: 200 }),
        rentApi.listPayments({ per_page: 200 }),
        expenseApi.list({ per_page: 200 }),
        unitApi.list({ per_page: 200 }),
      ])
      setInvoices(invRes.data.data || [])
      setPayments(payRes.data.data || [])
      setExpenses(expRes.data.data || [])
      setUnits(unitRes.data.data || [])
    } catch {
      setError(true)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  // Calculations
  const totalInvoiced = invoices.reduce((acc, i) => acc + (i.total_amount || 0), 0)
  const totalCollected = payments.reduce((acc, p) => acc + (p.amount || 0), 0)
  const totalPending = invoices.reduce((acc, i) => acc + (i.pending_amount || (i.status !== 'paid' ? i.total_amount : 0)), 0)
  const totalExpenses = expenses.reduce((acc, e) => acc + (e.amount || 0), 0)
  const netIncome = totalCollected - totalExpenses

  const totalUnitsCount = units.length
  const occupiedUnitsCount = units.filter((u) => u.status === 'occupied').length
  const occupancyRate = totalUnitsCount > 0 ? Math.round((occupiedUnitsCount / totalUnitsCount) * 100) : 0

  // Export CSV
  const handleExportCSV = () => {
    const rows = [
      ['Report', 'Financial & Operational Summary'],
      ['Generated At', new Date().toLocaleString()],
      [],
      ['Metric', 'Amount / Value'],
      ['Total Invoiced', totalInvoiced],
      ['Total Collected', totalCollected],
      ['Pending Dues', totalPending],
      ['Total Expenses', totalExpenses],
      ['Net Income', netIncome],
      ['Occupancy Rate', `${occupancyRate}% (${occupiedUnitsCount}/${totalUnitsCount})`],
      [],
      ['Recent Payments'],
      ['Receipt #', 'Tenant', 'Month', 'Amount', 'Date', 'Method'],
      ...payments.map((p) => [
        p.receipt_number || '',
        p.tenant_name || '',
        p.billing_month || '',
        p.amount || 0,
        p.payment_date || '',
        p.payment_method || '',
      ]),
      [],
      ['Expenses'],
      ['Category', 'Description', 'Amount', 'Date'],
      ...expenses.map((e) => [
        e.category || '',
        `"${e.description || ''}"`,
        e.amount || 0,
        e.date || '',
      ]),
    ]

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `PropertyHub_Report_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <MobilePage
      role="owner"
      header={
        <MobileHeader
          title="Reports & Analytics"
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
      {/* Desktop Header */}
      <div className="module-header hidden-mobile">
        <div className="module-header-info">
          <h1 className="module-header-title">Reports & Financial Analytics</h1>
          <p className="module-header-subtitle">
            Track revenue collections, operating expenses, cash flows, and occupancy performance
          </p>
        </div>
        <div className="module-header-action" style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={load} style={{ gap: '0.375rem' }}>
            <RefreshCw size={15} /> Refresh
          </button>
          <button className="btn btn-primary" onClick={handleExportCSV} style={{ gap: '0.375rem' }}>
            <FileSpreadsheet size={16} /> Export to CSV
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="cards-grid">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : error ? (
        <ErrorState onRetry={load} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Key KPI Cards Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1rem',
            }}
          >
            {/* Card 1: Collected */}
            <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #10B981' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8125rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Total Collected
                </span>
                <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: '#D1FAE5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TrendingUp size={16} />
                </div>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', fontVariantNumeric: 'tabular-nums' }}>
                {formatCurrency(totalCollected)}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 500, marginTop: '0.25rem', display: 'block' }}>
                From {payments.length} verified transactions
              </span>
            </div>

            {/* Card 2: Pending Dues */}
            <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #F59E0B' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8125rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Pending Dues
                </span>
                <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <DollarSign size={16} />
                </div>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#D97706', fontVariantNumeric: 'tabular-nums' }}>
                {formatCurrency(totalPending)}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 500, marginTop: '0.25rem', display: 'block' }}>
                Across unpaid / overdue invoices
              </span>
            </div>

            {/* Card 3: Total Expenses */}
            <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #EF4444' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8125rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Total Expenses
                </span>
                <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: '#FEE2E2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TrendingDown size={16} />
                </div>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#DC2626', fontVariantNumeric: 'tabular-nums' }}>
                {formatCurrency(totalExpenses)}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 500, marginTop: '0.25rem', display: 'block' }}>
                {expenses.length} expense entries recorded
              </span>
            </div>

            {/* Card 4: Net Cash Flow */}
            <div className="card" style={{ padding: '1.25rem', borderLeft: `4px solid ${netIncome >= 0 ? '#3B82F6' : '#EF4444'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8125rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Net Cash Flow
                </span>
                <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BarChart3 size={16} />
                </div>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: netIncome >= 0 ? '#2563EB' : '#DC2626', fontVariantNumeric: 'tabular-nums' }}>
                {formatCurrency(netIncome)}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 500, marginTop: '0.25rem', display: 'block' }}>
                Collected minus Operating Expenses
              </span>
            </div>
          </div>

          {/* Operational Metrics & Occupancy */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
            {/* Occupancy Card */}
            <div className="card" style={{ padding: '1.25rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 1rem 0', color: '#0F172A' }}>
                Occupancy Performance
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div>
                  <span style={{ fontSize: '2rem', fontWeight: 800, color: '#0F172A' }}>{occupancyRate}%</span>
                  <p style={{ fontSize: '0.8125rem', color: '#64748B', margin: '0.125rem 0 0 0' }}>
                    {occupiedUnitsCount} of {totalUnitsCount} Units Occupied
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#10B981' }}>
                    {totalUnitsCount - occupiedUnitsCount} Vacant
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div style={{ width: '100%', height: 10, backgroundColor: '#E2E8F0', borderRadius: 5, overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${occupancyRate}%`,
                    height: '100%',
                    backgroundColor: occupancyRate > 75 ? '#10B981' : occupancyRate > 40 ? '#F59E0B' : '#EF4444',
                    borderRadius: 5,
                    transition: 'width 0.5s ease',
                  }}
                />
              </div>
            </div>

            {/* Expense Breakdown Card */}
            <div className="card" style={{ padding: '1.25rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 1rem 0', color: '#0F172A' }}>
                Recent Expense Activity
              </h3>
              {expenses.length === 0 ? (
                <p style={{ fontSize: '0.875rem', color: '#94A3B8', margin: 0 }}>No expenses recorded yet</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  {expenses.slice(0, 4).map((e) => (
                    <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem' }}>
                      <span style={{ color: '#334155', fontWeight: 600 }}>{e.description || e.category}</span>
                      <span style={{ fontWeight: 700, color: '#DC2626', fontVariantNumeric: 'tabular-nums' }}>
                        {formatCurrency(e.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </MobilePage>
  )
}
