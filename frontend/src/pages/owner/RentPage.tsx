import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Plus,
  Filter,
  CreditCard,
  ChevronRight,
  Search,
  Download,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Building2,
  Calendar,
  Sparkles,
  Zap,
  ArrowRight,
  ShieldAlert,
  ChevronLeft,
  DollarSign
} from 'lucide-react'
import { rentApi, propertyApi } from '../../api/client'
import { RentInvoice, RentSummary, Property } from '../../types'
import { MobilePage } from '../../components/layout/AppShell'
import { MobileHeader } from '../../components/navigation'
import {
  formatCurrency,
  formatDate,
  EmptyState,
  ErrorState,
  SkeletonCard,
  StatusBadge,
  ProgressBar
} from '../../components/ui'
import PaymentSheet from './PaymentSheet'
import InvoiceDetailModal from './InvoiceDetailModal'
import { useToast } from '../../contexts/ToastContext'

const TABS = [
  { key: '', label: 'All Invoices' },
  { key: 'under_review', label: '⏳ Verification Queue' },
  { key: 'pending', label: 'Pending' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'paid', label: 'Paid' },
  { key: 'partially_paid', label: 'Partial' },
]

export default function RentPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { success, error, info } = useToast()

  const now = new Date()
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const [billingMonth, setBillingMonth] = useState(searchParams.get('month') || currentMonthStr)
  const [invoices, setInvoices] = useState<RentInvoice[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [selectedPropertyId, setSelectedPropertyId] = useState(searchParams.get('property_id') || '')
  const [summary, setSummary] = useState<RentSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [activeTab, setActiveTab] = useState(searchParams.get('status') || '')
  const [searchTerm, setSearchTerm] = useState('')
  const [payInvoice, setPayInvoice] = useState<RentInvoice | null>(null)
  const [detailInvoice, setDetailInvoice] = useState<RentInvoice | null>(null)
  const [isSendingReminders, setIsSendingReminders] = useState(false)

  const loadProperties = async () => {
    try {
      const res = await propertyApi.list()
      setProperties(res.data.data || [])
    } catch {}
  }

  const load = async (status = activeTab, month = billingMonth, propId = selectedPropertyId) => {
    setIsLoading(true)
    setHasError(false)
    try {
      const res = await rentApi.listInvoices({
        status: status || undefined,
        billing_month: month || undefined,
        property_id: propId || undefined,
        search: searchTerm || undefined,
        per_page: 100,
      })
      setInvoices(res.data.data || [])
      setSummary(res.data.summary || null)
    } catch {
      setHasError(true)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadProperties()
  }, [])

  useEffect(() => {
    load(activeTab, billingMonth, selectedPropertyId)
  }, [activeTab, billingMonth, selectedPropertyId, searchTerm])

  const handlePaymentSuccess = () => {
    setPayInvoice(null)
    load(activeTab, billingMonth, selectedPropertyId)
  }

  const handleSendBulkReminders = async () => {
    setIsSendingReminders(true)
    try {
      const res = await rentApi.sendReminders({ all_overdue: true, property_id: selectedPropertyId || undefined })
      success(`Sent payment reminders to ${res.data.data?.reminders_sent || 0} overdue tenant(s)!`)
      load(activeTab, billingMonth, selectedPropertyId)
    } catch {
      error('Failed to send reminders')
    } finally {
      setIsSendingReminders(false)
    }
  }

  const handleExportCSV = () => {
    if (invoices.length === 0) {
      info('No invoices to export')
      return
    }

    const headers = ['Invoice Number', 'Tenant Name', 'Flat', 'Building', 'Month', 'Base Rent', 'Maintenance', 'Utilities', 'Discount', 'Total Due', 'Paid', 'Pending', 'Status', 'Due Date']
    const rows = invoices.map((inv) => [
      inv.invoice_number,
      `"${inv.tenant_name || ''}"`,
      `"${inv.unit_number || ''}"`,
      `"${inv.property_name || ''}"`,
      inv.billing_month,
      inv.rent_amount,
      inv.maintenance_amount,
      inv.utility_amount,
      inv.discount,
      inv.total_amount,
      inv.paid_amount,
      inv.pending_amount,
      inv.status,
      inv.due_date,
    ])

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `Rent_Invoices_${billingMonth || 'all'}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    success('Invoices exported to CSV successfully!')
  }

  const changeMonthOffset = (offset: number) => {
    const [y, m] = (billingMonth || currentMonthStr).split('-').map(Number)
    const d = new Date(y, m - 1 + offset, 1)
    const newMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    setBillingMonth(newMonth)
  }

  const filteredInvoices = invoices.filter((inv) => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      (inv.tenant_name || '').toLowerCase().includes(term) ||
      (inv.unit_number || '').toLowerCase().includes(term) ||
      (inv.invoice_number || '').toLowerCase().includes(term) ||
      (inv.property_name || '').toLowerCase().includes(term)
    )
  })

  return (
    <MobilePage
      role="owner"
      header={
        <MobileHeader
          title="Rent Management"
          showBack
          rightAction={
            <button
              className="btn btn-primary btn-sm"
              onClick={() => navigate('/owner/rent/generate')}
              style={{ gap: '0.25rem' }}
            >
              <Plus size={16} /> Generate
            </button>
          }
        />
      }
    >
      {/* Desktop Header Row */}
      <div className="hidden-mobile" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 900, margin: 0, color: '#0F172A', letterSpacing: '-0.02em' }}>
            Rent Manager & Invoices
          </h1>
          <p style={{ fontSize: '0.8125rem', color: '#64748B', margin: '0.15rem 0 0' }}>
            Generate monthly billings, review tenant payment claims, track dues, and manage collections
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleExportCSV}
            style={{ gap: '0.375rem' }}
          >
            <Download size={14} /> Export CSV
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleSendBulkReminders}
            disabled={isSendingReminders}
            style={{ gap: '0.375rem', color: '#D97706' }}
          >
            <Bell size={14} /> {isSendingReminders ? 'Sending...' : 'Remind Overdue'}
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => navigate('/owner/rent/generate')}
            style={{ gap: '0.375rem', backgroundColor: '#2563EB', borderColor: '#2563EB', fontWeight: 700 }}
          >
            <Plus size={15} /> Generate Monthly Rent
          </button>
        </div>
      </div>

      {/* FILTER & DATE CONTROLS BAR */}
      <div
        className="card"
        style={{
          padding: '1rem 1.25rem',
          marginBottom: '1.25rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.75rem',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#FFFFFF',
        }}
      >
        {/* Month Selector with Prev/Next */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ padding: '0.35rem 0.5rem', height: 36 }}
            onClick={() => changeMonthOffset(-1)}
            title="Previous Month"
          >
            <ChevronLeft size={16} />
          </button>
          <input
            type="month"
            className="input"
            style={{ height: 36, width: 170, fontSize: '0.875rem', fontWeight: 700 }}
            value={billingMonth}
            onChange={(e) => setBillingMonth(e.target.value)}
          />
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ padding: '0.35rem 0.5rem', height: 36 }}
            onClick={() => changeMonthOffset(1)}
            title="Next Month"
          >
            <ChevronRight size={16} />
          </button>
          {billingMonth !== currentMonthStr && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ fontSize: '0.75rem', color: '#2563EB' }}
              onClick={() => setBillingMonth(currentMonthStr)}
            >
              Current
            </button>
          )}
        </div>

        {/* Building Filter & Search Input */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', flex: 1, minWidth: 260, justifyContent: 'flex-end' }}>
          <select
            className="input"
            style={{ height: 36, width: 'auto', minWidth: 160, fontSize: '0.8125rem' }}
            value={selectedPropertyId}
            onChange={(e) => setSelectedPropertyId(e.target.value)}
          >
            <option value="">🏢 All Buildings</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          <div style={{ position: 'relative', minWidth: 200, flex: 1, maxWidth: 320 }}>
            <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="search"
              className="input"
              style={{ height: 36, paddingLeft: 32, fontSize: '0.8125rem' }}
              placeholder="Search tenant, flat #, invoice..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* CLICKABLE FINANCIAL KPI SUMMARY */}
      {summary && (
        <div
          className="card"
          style={{
            padding: '1.25rem',
            marginBottom: '1.25rem',
            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
            color: '#FFFFFF',
            borderRadius: '1rem',
            boxShadow: '0 8px 24px -4px rgba(15, 23, 42, 0.2)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <span style={{ fontSize: '0.6875rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#93C5FD' }}>
                Financial Health ({new Date(billingMonth + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })})
              </span>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 900, margin: '0.2rem 0 0', color: '#FFFFFF', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
                {formatCurrency(summary.collected)} <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#94A3B8' }}>/ {formatCurrency(summary.expected)} expected</span>
              </h2>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block' }}>Collection Rate</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 900, color: summary.collection_rate >= 80 ? '#34D399' : summary.collection_rate >= 50 ? '#FBBF24' : '#F87171' }}>
                {summary.collection_rate.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div style={{ marginBottom: '1rem' }}>
            <ProgressBar
              value={summary.collection_rate}
              color={summary.collection_rate >= 80 ? 'success' : summary.collection_rate >= 50 ? 'warning' : 'danger'}
            />
          </div>

          {/* KPI Grid (Clickable Tiles) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.625rem' }}>
            
            <div
              onClick={() => setActiveTab('')}
              className="card-hover"
              style={{
                padding: '0.75rem',
                borderRadius: '0.5rem',
                background: activeTab === '' ? 'rgba(255, 255, 255, 0.18)' : 'rgba(255, 255, 255, 0.08)',
                cursor: 'pointer',
                border: activeTab === '' ? '1px solid #93C5FD' : '1px solid transparent',
              }}
            >
              <p style={{ fontSize: '0.6875rem', color: '#94A3B8', margin: '0 0 0.2rem', fontWeight: 600 }}>Total Expected</p>
              <p style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>{formatCurrency(summary.expected)}</p>
            </div>

            <div
              onClick={() => setActiveTab('paid')}
              className="card-hover"
              style={{
                padding: '0.75rem',
                borderRadius: '0.5rem',
                background: activeTab === 'paid' ? 'rgba(52, 211, 153, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                cursor: 'pointer',
                border: activeTab === 'paid' ? '1px solid #34D399' : '1px solid transparent',
              }}
            >
              <p style={{ fontSize: '0.6875rem', color: '#A7F3D0', margin: '0 0 0.2rem', fontWeight: 600 }}>Collected ✓</p>
              <p style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#34D399' }}>{formatCurrency(summary.collected)}</p>
            </div>

            <div
              onClick={() => setActiveTab('pending')}
              className="card-hover"
              style={{
                padding: '0.75rem',
                borderRadius: '0.5rem',
                background: activeTab === 'pending' ? 'rgba(251, 191, 36, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                cursor: 'pointer',
                border: activeTab === 'pending' ? '1px solid #FBBF24' : '1px solid transparent',
              }}
            >
              <p style={{ fontSize: '0.6875rem', color: '#FDE68A', margin: '0 0 0.2rem', fontWeight: 600 }}>Pending Due</p>
              <p style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#FBBF24' }}>{formatCurrency(summary.pending)}</p>
            </div>

            <div
              onClick={() => setActiveTab('overdue')}
              className="card-hover"
              style={{
                padding: '0.75rem',
                borderRadius: '0.5rem',
                background: activeTab === 'overdue' ? 'rgba(248, 113, 113, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                cursor: 'pointer',
                border: activeTab === 'overdue' ? '1px solid #F87171' : '1px solid transparent',
              }}
            >
              <p style={{ fontSize: '0.6875rem', color: '#FECACA', margin: '0 0 0.2rem', fontWeight: 600 }}>Overdue ⚠️</p>
              <p style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#F87171' }}>{formatCurrency(summary.overdue)}</p>
            </div>

            {/* Under Review Claims Highlight */}
            {(summary.under_review_count || 0) > 0 && (
              <div
                onClick={() => setActiveTab('under_review')}
                className="card-hover"
                style={{
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  background: 'rgba(245, 158, 11, 0.35)',
                  cursor: 'pointer',
                  border: '1.5px solid #F59E0B',
                  animation: 'pulse 2s infinite',
                }}
              >
                <p style={{ fontSize: '0.6875rem', color: '#FEF08A', margin: '0 0 0.2rem', fontWeight: 700 }}>
                  ⏳ {summary.under_review_count} Claims To Verify
                </p>
                <p style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#FEF08A' }}>
                  {formatCurrency(summary.under_review || 0)}
                </p>
              </div>
            )}

          </div>
        </div>
      )}

      {/* STATUS TABS BAR */}
      <div className="tabs-scroll" style={{ marginBottom: '1.25rem' }}>
        {TABS.map((t) => {
          const isQueue = t.key === 'under_review'
          const count = isQueue ? summary?.under_review_count : null
          return (
            <button
              key={t.key}
              className={`tab-item ${activeTab === t.key ? 'active' : ''}`}
              onClick={() => setActiveTab(t.key)}
              style={isQueue && count ? { fontWeight: 800, color: '#D97706' } : {}}
            >
              {t.label}
              {count ? (
                <span
                  style={{
                    marginLeft: '0.375rem',
                    background: '#D97706',
                    color: 'white',
                    padding: '0.1rem 0.4rem',
                    borderRadius: '9999px',
                    fontSize: '0.6875rem',
                    fontWeight: 800,
                  }}
                >
                  {count}
                </span>
              ) : null}
            </button>
          )
        })}
      </div>

      {/* INVOICE LIST */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : hasError ? (
          <ErrorState onRetry={() => load(activeTab, billingMonth, selectedPropertyId)} />
        ) : filteredInvoices.length === 0 ? (
          <EmptyState
            icon={<CreditCard size={36} />}
            title="No invoices found"
            description={
              searchTerm
                ? `No invoices matched "${searchTerm}"`
                : activeTab === 'under_review'
                ? 'All tenant payment claims have been reviewed! 🎉'
                : activeTab
                ? `No ${activeTab} invoices for this billing cycle.`
                : 'Generate monthly rent invoices to get started.'
            }
            action={
              activeTab === '' ? (
                <button
                  className="btn btn-primary"
                  onClick={() => navigate('/owner/rent/generate')}
                  style={{ gap: '0.375rem' }}
                >
                  <Plus size={16} /> Generate Monthly Rent
                </button>
              ) : undefined
            }
          />
        ) : (
          filteredInvoices.map((inv) => (
            <EnhancedInvoiceCard
              key={inv.id}
              invoice={inv}
              onPay={() => setPayInvoice(inv)}
              onClick={() => setDetailInvoice(inv)}
              onReviewClaim={() => setDetailInvoice(inv)}
            />
          ))
        )}
      </div>

      {/* Bottom Floating Generate CTA for Mobile */}
      <div className="mobile-only" style={{ position: 'fixed', bottom: 'calc(var(--bottom-nav-height) + 1rem + var(--safe-bottom))', right: '1rem', zIndex: 50 }}>
        <button
          className="btn btn-primary"
          onClick={() => navigate('/owner/rent/generate')}
          style={{
            borderRadius: 'var(--radius-full)',
            boxShadow: '0 8px 24px rgba(37, 99, 235, 0.4)',
            gap: '0.375rem',
            padding: '0.75rem 1.25rem',
            fontWeight: 800,
          }}
          aria-label="Generate monthly rent"
        >
          <Plus size={18} /> Generate Rent
        </button>
      </div>

      {/* INVOICE DETAIL MODAL */}
      {detailInvoice && (
        <InvoiceDetailModal
          invoice={detailInvoice}
          isOpen={!!detailInvoice}
          onClose={() => setDetailInvoice(null)}
          onRefresh={() => load(activeTab, billingMonth, selectedPropertyId)}
          onRecordPayment={(inv) => setPayInvoice(inv)}
        />
      )}

      {/* RECORD PAYMENT SHEET */}
      {payInvoice && (
        <PaymentSheet
          invoice={payInvoice}
          onClose={() => setPayInvoice(null)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </MobilePage>
  )
}

function EnhancedInvoiceCard({
  invoice,
  onPay,
  onClick,
  onReviewClaim,
}: {
  invoice: RentInvoice
  onPay: () => void
  onClick: () => void
  onReviewClaim: () => void
}) {
  const isPaid = invoice.status === 'paid'
  const isOverdue = invoice.status === 'overdue'
  const isUnderReview = invoice.status === 'under_review' || invoice.payment_claimed

  const borderColor = isUnderReview
    ? '#F59E0B'
    : isOverdue
    ? '#EF4444'
    : isPaid
    ? '#10B981'
    : '#3B82F6'

  return (
    <div
      className="card card-hover"
      onClick={onClick}
      style={{
        padding: '1.125rem',
        overflow: 'hidden',
        borderLeft: `4px solid ${borderColor}`,
        cursor: 'pointer',
        background: '#FFFFFF',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.625rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.15rem' }}>
            <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#2563EB', background: '#EFF6FF', padding: '0.1rem 0.35rem', borderRadius: 4 }}>
              {invoice.invoice_number}
            </span>
            <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
              • {new Date(invoice.billing_month + '-01').toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
            </span>
          </div>

          <h3 style={{ fontWeight: 800, fontSize: '1rem', margin: '0 0 0.125rem', color: '#0F172A' }}>
            {invoice.tenant_name || 'Resident'}
          </h3>
          <p style={{ fontSize: '0.8125rem', color: '#64748B', margin: 0 }}>
            Flat {invoice.unit_number} • {invoice.property_name}
          </p>
        </div>

        <div style={{ textAlign: 'right' }}>
          <StatusBadge status={invoice.status} />
          <p style={{ fontSize: '0.6875rem', color: isOverdue ? '#DC2626' : '#64748B', margin: '0.35rem 0 0', fontWeight: 600 }}>
            Due: {formatDate(invoice.due_date)}
          </p>
        </div>
      </div>

      {/* Financial Breakdown Row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.625rem 0.75rem',
          background: '#F8FAFC',
          borderRadius: '0.5rem',
          border: '1px solid #F1F5F9',
          marginTop: '0.5rem',
        }}
      >
        <div>
          <span style={{ fontSize: '0.6875rem', color: '#64748B', fontWeight: 600 }}>Total Invoiced</span>
          <p style={{ fontWeight: 900, fontSize: '1.125rem', margin: 0, color: '#0F172A', fontVariantNumeric: 'tabular-nums' }}>
            {formatCurrency(invoice.total_amount)}
          </p>
        </div>

        <div style={{ textAlign: 'right' }}>
          {isPaid ? (
            <span style={{ fontSize: '0.8125rem', color: '#059669', fontWeight: 700 }}>
              ✓ Fully Cleared
            </span>
          ) : (
            <div>
              <span style={{ fontSize: '0.6875rem', color: '#DC2626', fontWeight: 600 }}>Balance Pending</span>
              <p style={{ fontWeight: 800, fontSize: '1.0625rem', margin: 0, color: '#DC2626', fontVariantNumeric: 'tabular-nums' }}>
                {formatCurrency(invoice.pending_amount)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* CLAIM ALERT BANNER IF UNDER REVIEW */}
      {isUnderReview && (
        <div
          style={{
            marginTop: '0.75rem',
            padding: '0.625rem 0.75rem',
            borderRadius: '0.5rem',
            background: '#FEF3C7',
            border: '1px solid #FDE68A',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
          onClick={(e) => {
            e.stopPropagation()
            onReviewClaim()
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={16} color="#D97706" />
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#92400E' }}>
              Tenant Claimed ₹{invoice.claimed_payment?.amount || invoice.pending_amount} Paid
            </span>
          </div>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#D97706', textDecoration: 'underline' }}>
            Review & Verify →
          </span>
        </div>
      )}

      {/* ACTION FOOTER */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '0.75rem',
          paddingTop: '0.625rem',
          borderTop: '1px solid #F1F5F9',
        }}
      >
        <span style={{ fontSize: '0.75rem', color: '#2563EB', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          View Invoice Breakdown <ChevronRight size={14} />
        </span>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {!isPaid && !isUnderReview && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              style={{ height: 32, fontSize: '0.75rem', gap: '0.25rem' }}
              onClick={(e) => {
                e.stopPropagation()
                onPay()
              }}
            >
              <CreditCard size={13} /> Record Payment
            </button>
          )}

          {isUnderReview && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              style={{ height: 32, fontSize: '0.75rem', gap: '0.25rem', backgroundColor: '#D97706', borderColor: '#D97706' }}
              onClick={(e) => {
                e.stopPropagation()
                onReviewClaim()
              }}
            >
              <Clock size={13} /> Verify Claim
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
