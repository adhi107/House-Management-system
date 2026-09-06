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
  Upload,
  Image as ImageIcon,
  X,
  Loader2,
} from 'lucide-react'
import { dashboardApi, rentApi, documentApi } from '../../api/client'
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
                      onClick={() => navigate('/tenant/payments')}
                      className="card-hover"
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.625rem 0.75rem',
                        backgroundColor: '#F8FAFC',
                        borderRadius: '0.5rem',
                        border: '1px solid #F1F5F9',
                        cursor: 'pointer',
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
                      onClick={() => navigate('/tenant/maintenance')}
                      className="card-hover"
                      style={{
                        padding: '0.625rem 0.75rem',
                        backgroundColor: '#F8FAFC',
                        borderRadius: '0.5rem',
                        border: '1px solid #F1F5F9',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
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
  const isUnderReview = invoice.status === 'under_review' || (invoice as any).payment_claimed

  return (
    <div
      className="card card-hover"
      onClick={isPaid ? onViewAll : onPayClick}
      style={{
        padding: '1.5rem',
        borderRadius: '1rem',
        cursor: 'pointer',
        background: isPaid
          ? 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)'
          : isUnderReview
          ? 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)'
          : isOverdue
          ? 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)'
          : 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
        border: `1px solid ${isPaid ? '#A7F3D0' : isUnderReview ? '#FDE68A' : isOverdue ? '#FECACA' : '#BFDBFE'}`,
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
              color: isPaid ? '#047857' : isUnderReview ? '#B45309' : isOverdue ? '#B91C1C' : '#1D4ED8',
            }}
          >
            {new Date(invoice.billing_month + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })} Rent Status
          </span>
          <div
            style={{
              fontSize: '2.25rem',
              fontWeight: 900,
              color: isPaid ? '#065F46' : isUnderReview ? '#92400E' : isOverdue ? '#991B1B' : '#1E40AF',
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '-0.02em',
              margin: '0.25rem 0',
            }}
          >
            {formatCurrency(invoice.total_amount)}
          </div>
          <p style={{ fontSize: '0.8125rem', color: '#475569', margin: 0 }}>
            {isPaid ? (
              <span style={{ color: '#059669', fontWeight: 600 }}>✓ Paid in full & Verified</span>
            ) : isUnderReview ? (
              <span style={{ color: '#B45309', fontWeight: 600 }}>⏳ Payment reported • Owner verification in progress</span>
            ) : (
              `Payment due on ${formatDate(invoice.due_date)}`
            )}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
          <StatusBadge status={invoice.status} />
          {!isPaid && !isUnderReview && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={onPayClick}
                className="btn btn-primary"
                style={{
                  backgroundColor: '#16A34A',
                  borderColor: '#16A34A',
                  fontWeight: 700,
                  boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)',
                  padding: '0.5rem 1.125rem',
                  gap: '0.375rem',
                }}
              >
                <CheckCircle2 size={16} /> I've Already Paid / Submit Proof
              </button>
            </div>
          )}
          {isUnderReview && (
            <div style={{ background: '#FFFFFF', padding: '0.35rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #FDE68A', fontSize: '0.75rem', color: '#92400E', fontWeight: 600 }}>
              Receipt will be ready once approved
            </div>
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
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [showQR, setShowQR] = useState(false)
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [proofPreview, setProofPreview] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setProofFile(file)
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = () => setProofPreview(reader.result as string)
        reader.readAsDataURL(file)
      } else {
        setProofPreview(null)
      }
    }
  }

  const handleClearFile = () => {
    setProofFile(null)
    setProofPreview(null)
  }

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      let uploadedProofUrl: string | undefined = undefined
      if (proofFile) {
        try {
          const formData = new FormData()
          formData.append('file', proofFile)
          formData.append('entity_type', 'payment')
          formData.append('entity_id', invoice.id)
          formData.append('name', `Proof_${invoice.invoice_number}`)
          const uploadRes = await documentApi.upload(formData)
          uploadedProofUrl = uploadRes.data?.data?.url || uploadRes.data?.data?.filename
        } catch (uploadErr) {
          console.warn('Document upload error, falling back to base64 preview', uploadErr)
          if (proofPreview && proofPreview.length < 500000) {
            uploadedProofUrl = proofPreview
          }
        }
      }

      await rentApi.reportPayment(invoice.id, {
        amount: invoice.total_amount,
        payment_method: method,
        transaction_reference: reference.trim() || undefined,
        payment_date: date,
        proof_url: uploadedProofUrl,
        notes: notes.trim() || undefined,
      })
      alert('Payment reported successfully! The owner has been notified to verify and release your official receipt.')
      onPaid()
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to report payment. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
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
          maxWidth: '480px',
          backgroundColor: '#ffffff',
          borderRadius: '1rem',
          padding: '1.5rem',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>
              Report Rent Payment / Submit Proof
            </h2>
            <p style={{ fontSize: '0.8125rem', color: '#64748B', margin: '0.2rem 0 0' }}>
              {new Date(invoice.billing_month + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })} Rent • Total: <strong>{formatCurrency(invoice.total_amount)}</strong>
            </p>
          </div>
        </div>

        {/* UPI Scan and Pay Option */}
        <div style={{ background: '#F8FAFC', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid #E2E8F0', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontWeight: 700, fontSize: '0.8125rem', margin: 0, color: '#0F172A' }}>
                ⚡ Pay via UPI QR Code
              </p>
              <p style={{ fontSize: '0.6875rem', color: '#64748B', margin: 0 }}>
                Scan with GPay, PhonePe, Paytm, or BHIM
              </p>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setShowQR(!showQR)}
              style={{ fontSize: '0.75rem', color: '#2563EB' }}
            >
              {showQR ? 'Hide QR' : 'Show QR Code'}
            </button>
          </div>

          {showQR && (
            <div style={{ textAlign: 'center', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px dashed #CBD5E1' }}>
              <div style={{ background: '#FFFFFF', padding: '0.75rem', borderRadius: '0.5rem', display: 'inline-block', border: '1px solid #E2E8F0' }}>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=upi://pay?pa=propertyhub@upi%26pn=HouseManagement%26am=${invoice.total_amount}%26cu=INR`}
                  alt="UPI QR Code"
                  style={{ width: 140, height: 140, display: 'block' }}
                />
              </div>
              <p style={{ fontSize: '0.75rem', color: '#475569', margin: '0.35rem 0 0' }}>
                Amount: <strong>{formatCurrency(invoice.total_amount)}</strong>
              </p>
            </div>
          )}
        </div>

        <form onSubmit={handleReport} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="label" style={{ fontWeight: 700, fontSize: '0.8125rem', marginBottom: '0.35rem', display: 'block' }}>
              Payment Method Used *
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              {[
                { value: 'upi', label: '📱 UPI / PhonePe / GPay' },
                { value: 'bank_transfer', label: '🏦 Bank Transfer / NEFT' },
                { value: 'cash', label: '💵 Cash to Owner' },
                { value: 'cheque', label: '📝 Cheque' },
              ].map((m) => (
                <button
                  type="button"
                  key={m.value}
                  onClick={() => setMethod(m.value)}
                  className={`btn btn-sm ${method === m.value ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.75rem', padding: '0.45rem' }}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label className="label" style={{ fontWeight: 700, fontSize: '0.8125rem', marginBottom: '0.25rem', display: 'block' }}>
                Transaction / UTR ID *
              </label>
              <input
                type="text"
                className="input"
                required
                placeholder="e.g. 42398712398"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </div>

            <div>
              <label className="label" style={{ fontWeight: 700, fontSize: '0.8125rem', marginBottom: '0.25rem', display: 'block' }}>
                Payment Date *
              </label>
              <input
                type="date"
                className="input"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="label" style={{ fontWeight: 700, fontSize: '0.8125rem', marginBottom: '0.25rem', display: 'block' }}>
              Notes / Remarks (optional)
            </label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Paid from HDFC account ending in 4102"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Upload Screenshot / Receipt */}
          <div>
            <label className="label" style={{ fontWeight: 700, fontSize: '0.8125rem', marginBottom: '0.35rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Upload Payment Proof / Screenshot</span>
              <span style={{ fontSize: '0.6875rem', fontWeight: 500, color: '#64748B' }}>Optional (JPG, PNG, PDF)</span>
            </label>

            {!proofFile ? (
              <label
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '1.25rem 1rem',
                  border: '2px dashed #CBD5E1',
                  borderRadius: '0.75rem',
                  backgroundColor: '#F8FAFC',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                className="card-hover"
              >
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    backgroundColor: '#EFF6FF',
                    color: '#2563EB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '0.5rem',
                  }}
                >
                  <Upload size={20} />
                </div>
                <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#1E293B', margin: '0 0 0.2rem' }}>
                  Click to upload payment screenshot
                </p>
                <p style={{ fontSize: '0.6875rem', color: '#64748B', margin: 0 }}>
                  PNG, JPG, WebP or PDF receipt up to 10MB
                </p>
              </label>
            ) : (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem',
                  borderRadius: '0.75rem',
                  border: '1px solid #E2E8F0',
                  backgroundColor: '#F1F5F9',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {proofPreview ? (
                    <img
                      src={proofPreview}
                      alt="Proof preview"
                      style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: '0.375rem', border: '1px solid #CBD5E1' }}
                    />
                  ) : (
                    <div style={{ width: 48, height: 48, borderRadius: '0.375rem', background: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}>
                      <FileText size={24} />
                    </div>
                  )}
                  <div>
                    <p style={{ fontSize: '0.8125rem', fontWeight: 700, margin: 0, color: '#0F172A', maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {proofFile.name}
                    </p>
                    <p style={{ fontSize: '0.6875rem', color: '#64748B', margin: 0 }}>
                      {(proofFile.size / 1024).toFixed(1)} KB • Ready to submit
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClearFile}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    borderRadius: '50%',
                    width: 28,
                    height: 28,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#DC2626',
                  }}
                  title="Remove file"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
              style={{ backgroundColor: '#16A34A', borderColor: '#16A34A', fontWeight: 700 }}
            >
              {isSubmitting ? 'Submitting...' : `Submit Payment Proof`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
