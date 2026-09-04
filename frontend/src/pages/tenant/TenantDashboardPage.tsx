import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CreditCard,
  Wrench,
  FileText,
  Bell,
  ChevronRight,
  ShieldCheck,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Phone,
  Home,
  ArrowUpRight,
  Sparkles,
  DollarSign,
  Download,
} from 'lucide-react'
import { dashboardApi, rentApi } from '../../api/client'
import { TenantDashboard } from '../../types'
import { useAuth } from '../../contexts/AuthContext'
import { MobilePage } from '../../components/layout/AppShell'
import { MobileHeader } from '../../components/navigation'
import { formatCurrency, formatDate, StatusBadge, ErrorState, SkeletonCard, Avatar } from '../../components/ui'

export default function TenantDashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState<TenantDashboard | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)
  const [showPayModal, setShowPayModal] = useState(false)

  const load = async () => {
    setIsLoading(true)
    setError(false)
    try {
      const res = await dashboardApi.getTenantDashboard()
      setData(res.data.data)
    } catch {
      setError(true)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const now = new Date()
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <MobilePage
      role="tenant"
      header={
        <MobileHeader
          rightAction={
            <button
              onClick={() => navigate('/tenant/notifications')}
              style={{
                position: 'relative',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 8,
                borderRadius: '50%',
                color: 'rgb(var(--foreground))',
              }}
              aria-label="Notifications"
            >
              <Bell size={22} />
              {data?.unread_notifications ? (
                <span
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    background: 'rgb(var(--danger))',
                    color: 'white',
                    fontSize: '0.6rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {data.unread_notifications > 9 ? '9+' : data.unread_notifications}
                </span>
              ) : null}
            </button>
          }
        />
      }
    >
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : error ? (
        <ErrorState onRetry={load} />
      ) : data ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Welcome Banner Card */}
          <div
            style={{
              padding: '1.5rem',
              borderRadius: '1rem',
              background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.2)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
                <span
                  style={{
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                    color: '#60A5FA',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '9999px',
                    border: '1px solid rgba(96, 165, 250, 0.3)',
                  }}
                >
                  Resident Portal
                </span>
              </div>
              <h1 style={{ fontWeight: 800, fontSize: '1.5rem', margin: '0 0 0.25rem', color: '#FFFFFF', letterSpacing: '-0.02em' }}>
                {greeting}, {data.tenant.full_name} 👋
              </h1>
              {data.unit && data.property ? (
                <p style={{ fontSize: '0.875rem', color: '#94A3B8', margin: 0, display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <Home size={14} style={{ color: '#38BDF8' }} />
                  Flat {data.unit.unit_number} • {data.property.name} ({data.unit.unit_type || 'Residential'})
                </p>
              ) : (
                <p style={{ fontSize: '0.875rem', color: '#94A3B8', margin: 0 }}>
                  Welcome to your tenant dashboard
                </p>
              )}
            </div>

            <div className="hidden-mobile" style={{ zIndex: 1 }}>
              <button
                className="btn btn-primary"
                onClick={() => navigate('/tenant/maintenance')}
                style={{ gap: '0.375rem', backgroundColor: '#2563EB', borderColor: '#2563EB' }}
              >
                <Wrench size={16} /> Report an Issue
              </button>
            </div>
          </div>

          {/* Key Metrics / Rent Highlight Banner */}
          {data.current_invoice ? (
            <RentHighlightCard
              invoice={data.current_invoice}
              onPayClick={() => setShowPayModal(true)}
              onViewAll={() => navigate('/tenant/rent')}
            />
          ) : (
            <div className="card" style={{ padding: '1.25rem', textAlign: 'center', backgroundColor: '#F8FAFC' }}>
              <CheckCircle2 size={32} style={{ color: '#10B981', margin: '0 auto 0.5rem' }} />
              <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 0.25rem', color: '#0F172A' }}>
                All Caught Up!
              </h3>
              <p style={{ color: '#64748B', fontSize: '0.8125rem', margin: 0 }}>
                You have no pending rent invoices due for this billing cycle.
              </p>
            </div>
          )}

          {/* Quick Actions Grid */}
          <div>
            <div className="section-header" style={{ marginBottom: '0.75rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#0F172A' }}>
                Quick Shortcuts
              </h2>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '0.75rem',
              }}
            >
              {[
                { label: 'Pay Rent', icon: '💳', desc: 'UPI & Cards', to: '/tenant/rent', color: '#EFF6FF', textColor: '#1D4ED8' },
                { label: 'Payment Receipts', icon: '🧾', desc: 'Download PDFs', to: '/tenant/payments', color: '#ECFDF5', textColor: '#047857' },
                { label: 'Maintenance', icon: '🔧', desc: 'Report issue', to: '/tenant/maintenance', color: '#FFFBEB', textColor: '#B45309' },
                { label: 'Rental Lease', icon: '📄', desc: 'Agreement terms', to: '/tenant/agreements', color: '#F5F3FF', textColor: '#6D28D9' },
                { label: 'My Documents', icon: '📁', desc: 'KYC & uploads', to: '/tenant/documents', color: '#FDF2F8', textColor: '#BE185D' },
                { label: 'Settings', icon: '⚙️', desc: 'Preferences', to: '/tenant/settings', color: '#F1F5F9', textColor: '#334155' },
              ].map((a) => (
                <button
                  key={a.label}
                  onClick={() => navigate(a.to)}
                  className="card card-hover"
                  style={{
                    padding: '0.875rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: 96,
                    border: '1px solid #E2E8F0',
                  }}
                >
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: '0.5rem',
                      backgroundColor: a.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.125rem',
                      marginBottom: '0.5rem',
                    }}
                  >
                    {a.icon}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '0.8125rem', fontWeight: 700, margin: '0 0 0.125rem', color: '#0F172A' }}>
                      {a.label}
                    </h3>
                    <p style={{ fontSize: '0.6875rem', color: '#64748B', margin: 0 }}>
                      {a.desc}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Two-Column Section: Recent Payments + Active Maintenance */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {/* Recent Payments Card */}
            <div className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#0F172A' }}>
                  Recent Payments & Receipts
                </h3>
                <button
                  onClick={() => navigate('/tenant/payments')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563EB', fontSize: '0.8125rem', fontWeight: 600 }}
                >
                  View All →
                </button>
              </div>

              {data.recent_payments.length === 0 ? (
                <p style={{ color: '#94A3B8', fontSize: '0.8125rem', margin: 0 }}>No past payments recorded yet</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  {data.recent_payments.slice(0, 4).map((p) => (
                    <div
                      key={p.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.625rem 0.75rem',
                        backgroundColor: '#F8FAFC',
                        borderRadius: '0.5rem',
                        border: '1px solid #F1F5F9',
                      }}
                    >
                      <div>
                        <p style={{ fontWeight: 600, fontSize: '0.8125rem', margin: 0, color: '#0F172A' }}>
                          {new Date(p.billing_month + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                        </p>
                        <p style={{ fontSize: '0.6875rem', color: '#64748B', margin: 0 }}>
                          #{p.receipt_number} • {formatDate(p.payment_date)}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#10B981', fontVariantNumeric: 'tabular-nums', display: 'block' }}>
                          {formatCurrency(p.amount)}
                        </span>
                        <span style={{ fontSize: '0.6875rem', color: '#059669', fontWeight: 600 }}>
                          ✓ Paid
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Maintenance Requests Card */}
            <div className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#0F172A' }}>
                  Maintenance Requests
                </h3>
                <button
                  onClick={() => navigate('/tenant/maintenance')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563EB', fontSize: '0.8125rem', fontWeight: 600 }}
                >
                  Report / View →
                </button>
              </div>

              {data.maintenance_requests.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                  <p style={{ color: '#64748B', fontSize: '0.8125rem', margin: '0 0 0.75rem 0' }}>
                    Everything in your flat is working smoothly! 🎉
                  </p>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => navigate('/tenant/maintenance')}
                    style={{ gap: '0.25rem', fontSize: '0.75rem' }}
                  >
                    <Wrench size={13} /> Report an issue
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  {data.maintenance_requests.slice(0, 3).map((r) => (
                    <div
                      key={r.id}
                      style={{
                        padding: '0.625rem 0.75rem',
                        backgroundColor: '#F8FAFC',
                        borderRadius: '0.5rem',
                        border: '1px solid #F1F5F9',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <p style={{ fontWeight: 600, fontSize: '0.8125rem', margin: 0, color: '#0F172A' }}>{r.title}</p>
                        <p style={{ fontSize: '0.6875rem', color: '#64748B', margin: 0, textTransform: 'capitalize' }}>
                          #{r.request_number} • {r.category}
                        </p>
                      </div>
                      <StatusBadge status={r.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {showPayModal && data?.current_invoice && (
        <RentPayModal
          invoice={data.current_invoice}
          onClose={() => setShowPayModal(false)}
          onPaid={() => {
            setShowPayModal(false)
            load()
          }}
        />
      )}
    </MobilePage>
  )
}

function RentHighlightCard({
  invoice,
  onPayClick,
  onViewAll,
}: {
  invoice: NonNullable<TenantDashboard['current_invoice']>
  onPayClick: () => void
  onViewAll: () => void
}) {
  const isPaid = invoice.status === 'paid'
  const isOverdue = invoice.status === 'overdue'

  return (
    <div
      className="card"
      style={{
        padding: '1.5rem',
        borderRadius: '1rem',
        background: isPaid
          ? 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)'
          : isOverdue
          ? 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)'
          : 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
        border: `1px solid ${isPaid ? '#A7F3D0' : isOverdue ? '#FECACA' : '#BFDBFE'}`,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color: isPaid ? '#047857' : isOverdue ? '#B91C1C' : '#1D4ED8',
            }}
          >
            {new Date(invoice.billing_month + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })} Rent Status
          </span>
          <div
            style={{
              fontSize: '2.25rem',
              fontWeight: 900,
              color: isPaid ? '#065F46' : isOverdue ? '#991B1B' : '#1E40AF',
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '-0.02em',
              margin: '0.25rem 0',
            }}
          >
            {formatCurrency(invoice.total_amount)}
          </div>
          <p style={{ fontSize: '0.8125rem', color: '#475569', margin: 0 }}>
            {isPaid ? (
              <span style={{ color: '#059669', fontWeight: 600 }}>✓ Paid in full</span>
            ) : (
              `Payment due on ${formatDate(invoice.due_date)}`
            )}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
          <StatusBadge status={invoice.status} />
          {!isPaid && (
            <button
              onClick={onPayClick}
              className="btn btn-primary"
              style={{
                backgroundColor: '#16A34A',
                borderColor: '#16A34A',
                fontWeight: 700,
                boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)',
                padding: '0.5rem 1.25rem',
                gap: '0.375rem',
              }}
            >
              <CreditCard size={16} /> Pay ₹{invoice.total_amount.toLocaleString('en-IN')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function RentPayModal({
  invoice,
  onClose,
  onPaid,
}: {
  invoice: NonNullable<TenantDashboard['current_invoice']>
  onClose: () => void
  onPaid: () => void
}) {
  const [method, setMethod] = useState('upi')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [reference, setReference] = useState('')

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await rentApi.recordPayment({
        invoice_id: invoice.id,
        amount: invoice.total_amount,
        payment_method: method,
        reference_number: reference || `UPI-${Date.now()}`,
        payment_date: new Date().toISOString().slice(0, 10),
      })
      alert('Payment recorded successfully! A digital receipt has been generated.')
      onPaid()
    } catch {
      alert('Failed to record payment. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '460px',
          backgroundColor: '#ffffff',
          borderRadius: '1rem',
          padding: '1.5rem',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: '0 0 0.25rem', color: '#0F172A' }}>
          Pay Monthly Rent
        </h2>
        <p style={{ fontSize: '0.8125rem', color: '#64748B', margin: '0 0 1.25rem' }}>
          {new Date(invoice.billing_month + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })} • Amount: <strong>{formatCurrency(invoice.total_amount)}</strong>
        </p>

        <form onSubmit={handlePay} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="label" style={{ fontWeight: 600, fontSize: '0.8125rem', marginBottom: '0.25rem', display: 'block' }}>
              Select Payment Method
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              {[
                { value: 'upi', label: '⚡ UPI / QR' },
                { value: 'netbanking', label: '🏦 Net Banking' },
                { value: 'card', label: '💳 Debit/Credit' },
                { value: 'cash', label: '💵 Cash to Owner' },
              ].map((m) => (
                <button
                  type="button"
                  key={m.value}
                  onClick={() => setMethod(m.value)}
                  className={`btn btn-sm ${method === m.value ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.8125rem' }}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label" style={{ fontWeight: 600, fontSize: '0.8125rem', marginBottom: '0.25rem', display: 'block' }}>
              UPI Reference / Transaction ID
            </label>
            <input
              type="text"
              className="input"
              placeholder="e.g. 42398712398"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
              style={{ backgroundColor: '#16A34A', borderColor: '#16A34A' }}
            >
              {isSubmitting ? 'Processing...' : `Confirm Payment of ${formatCurrency(invoice.total_amount)}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
