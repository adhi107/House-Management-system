import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, Filter, CreditCard, ChevronRight } from 'lucide-react'
import { rentApi } from '../../api/client'
import { RentInvoice, RentSummary } from '../../types'
import { MobilePage } from '../../components/layout/AppShell'
import { MobileHeader } from '../../components/navigation'
import { formatCurrency, formatDate, EmptyState, ErrorState, SkeletonCard, StatusBadge, ProgressBar, BottomSheet } from '../../components/ui'
import PaymentSheet from './PaymentSheet'

const TABS = [
  { key: '', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'paid', label: 'Paid' },
  { key: 'partially_paid', label: 'Partial' },
]

export default function RentPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [invoices, setInvoices] = useState<RentInvoice[]>([])
  const [summary, setSummary] = useState<RentSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)
  const [activeTab, setActiveTab] = useState(searchParams.get('status') || '')
  const [payInvoice, setPayInvoice] = useState<RentInvoice | null>(null)

  const load = async (status = activeTab) => {
    setIsLoading(true)
    setError(false)
    try {
      const now = new Date()
      const billing_month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      const res = await rentApi.listInvoices({ status: status || undefined, billing_month })
      setInvoices(res.data.data || [])
      setSummary(res.data.summary || null)
    } catch {
      setError(true)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { load() }, [activeTab])

  const handlePaymentSuccess = () => {
    setPayInvoice(null)
    load()
  }

  return (
    <MobilePage
      role="owner"
      header={<MobileHeader title="Rent Management" showBack rightAction={
        <button className="btn btn-primary btn-sm" onClick={() => navigate('/owner/rent/generate')} style={{ gap: '0.25rem' }}>
          <Plus size={16} /> Generate
        </button>
      } />}
    >
      {/* Desktop Header Row */}
      <div className="hidden-mobile" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>
            Rent & Invoices Manager
          </h1>
          <p style={{ fontSize: '0.8125rem', color: '#64748B', margin: '0.125rem 0 0' }}>
            Track rent generation, dues, partial collections, and payment statuses
          </p>
        </div>

        <button
          className="btn btn-primary btn-sm"
          onClick={() => navigate('/owner/rent/generate')}
          style={{ gap: '0.375rem' }}
        >
          <Plus size={15} /> Generate Monthly Rent
        </button>
      </div>
      {/* Summary */}
      {summary && (
        <div className="card" style={{ padding: '1.125rem', marginBottom: '1.125rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <h2 style={{ fontWeight: 700, fontSize: '1rem', margin: 0 }}>This Month</h2>
            <span style={{ fontSize: '0.8125rem', color: 'rgb(var(--muted-foreground))' }}>
              {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '0.875rem' }}>
            <SummaryItem label="Expected" value={formatCurrency(summary.expected)} />
            <SummaryItem label="Collected" value={formatCurrency(summary.collected)} color="success" />
            <SummaryItem label="Pending" value={formatCurrency(summary.pending)} color="warning" />
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'rgb(var(--muted-foreground))', fontWeight: 500 }}>Collection rate</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgb(var(--primary))' }}>{summary.collection_rate.toFixed(1)}%</span>
            </div>
            <ProgressBar value={summary.collection_rate} color={summary.collection_rate >= 80 ? 'success' : summary.collection_rate >= 50 ? 'warning' : 'danger'} />
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs-scroll" style={{ marginBottom: '1rem' }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`tab-item ${activeTab === t.key ? 'active' : ''}`}
            onClick={() => { setActiveTab(t.key); load(t.key) }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Invoice List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : error ? (
          <ErrorState onRetry={load} />
        ) : invoices.length === 0 ? (
          <EmptyState
            icon={<CreditCard size={32} />}
            title="No invoices"
            description={activeTab ? `No ${activeTab} invoices for this month.` : 'Generate monthly rent invoices to get started.'}
            action={
              activeTab === '' ? (
                <button className="btn btn-primary btn-sm" onClick={() => navigate('/owner/rent/generate')}>
                  Generate Rent
                </button>
              ) : undefined
            }
          />
        ) : (
          invoices.map((inv) => (
            <InvoiceCard
              key={inv.id}
              invoice={inv}
              onPay={() => setPayInvoice(inv)}
              onClick={() => navigate(`/owner/rent/invoices/${inv.id}`)}
            />
          ))
        )}
      </div>

      {/* Generate button */}
      <div style={{ position: 'fixed', bottom: 'calc(var(--bottom-nav-height) + 1rem + var(--safe-bottom))', right: '1rem' }}>
        <button
          className="btn btn-primary"
          onClick={() => navigate('/owner/rent/generate')}
          style={{ borderRadius: 'var(--radius-full)', boxShadow: '0 4px 16px rgb(37 99 235 / 0.35)' }}
          aria-label="Generate monthly rent"
        >
          <Plus size={20} />
          Generate Rent
        </button>
      </div>

      {/* Payment Sheet */}
      {payInvoice && (
        <PaymentSheet invoice={payInvoice} onClose={() => setPayInvoice(null)} onSuccess={handlePaymentSuccess} />
      )}
    </MobilePage>
  )
}

function SummaryItem({ label, value, color }: { label: string; value: string; color?: string }) {
  const colorMap: Record<string, string> = {
    success: 'rgb(var(--success))',
    warning: 'rgb(var(--warning))',
    danger: 'rgb(var(--danger))',
  }
  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ fontSize: '0.75rem', color: 'rgb(var(--muted-foreground))', margin: '0 0 0.25rem', fontWeight: 500 }}>{label}</p>
      <p style={{ fontSize: '0.875rem', fontWeight: 800, margin: 0, color: color ? colorMap[color] : 'rgb(var(--foreground))', fontVariantNumeric: 'tabular-nums' }}>{value}</p>
    </div>
  )
}

function InvoiceCard({ invoice, onPay, onClick }: { invoice: RentInvoice; onPay: () => void; onClick: () => void }) {
  const isPaid = invoice.status === 'paid'
  const isOverdue = invoice.status === 'overdue'

  return (
    <div
      className="card"
      style={{
        padding: '1rem', overflow: 'hidden',
        borderLeft: isOverdue ? '3px solid rgb(var(--danger))' : isPaid ? '3px solid rgb(var(--success))' : '3px solid rgb(var(--warning))',
      }}
    >
      <button onClick={onClick} style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.625rem' }}>
          <div>
            <h3 style={{ fontWeight: 700, fontSize: '0.9375rem', margin: '0 0 0.125rem' }}>
              {invoice.tenant_name}
            </h3>
            <p style={{ fontSize: '0.8125rem', color: 'rgb(var(--muted-foreground))', margin: 0 }}>
              Flat {invoice.unit_number} • {invoice.property_name}
            </p>
          </div>
          <StatusBadge status={invoice.status} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: '0.75rem', color: 'rgb(var(--muted-foreground))', margin: '0 0 0.125rem' }}>
              {new Date(invoice.billing_month + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })} Rent
            </p>
            <p style={{ fontWeight: 800, fontSize: '1.125rem', margin: 0, fontVariantNumeric: 'tabular-nums' }}>
              {formatCurrency(invoice.total_amount)}
            </p>
            {invoice.paid_amount > 0 && (
              <p style={{ fontSize: '0.75rem', color: 'rgb(var(--success))', margin: 0 }}>
                Paid: {formatCurrency(invoice.paid_amount)} · Remaining: {formatCurrency(invoice.pending_amount)}
              </p>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '0.6875rem', color: 'rgb(var(--muted-foreground))', margin: '0 0 0.25rem' }}>Due date</p>
            <p style={{ fontSize: '0.8125rem', fontWeight: 600, margin: 0, color: isOverdue ? 'rgb(var(--danger))' : 'rgb(var(--foreground))' }}>
              {formatDate(invoice.due_date)}
            </p>
          </div>
        </div>
      </button>

      {!isPaid && (
        <div style={{ marginTop: '0.875rem', paddingTop: '0.875rem', borderTop: '1px solid rgb(var(--border))' }}>
          <button
            className="btn btn-primary btn-full"
            style={{ minHeight: 44 }}
            onClick={(e) => { e.stopPropagation(); onPay() }}
          >
            <CreditCard size={16} /> Record Payment
          </button>
        </div>
      )}
    </div>
  )
}
