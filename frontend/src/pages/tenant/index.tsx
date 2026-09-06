import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Wrench, CreditCard, ChevronRight, Upload, Image as ImageIcon, FileText, X, CheckCircle2, Loader2 } from 'lucide-react'
import { rentApi, maintenanceApi, documentApi } from '../../api/client'
import { RentInvoice, MaintenanceRequest } from '../../types'
import { MobilePage } from '../../components/layout/AppShell'
import { MobileHeader } from '../../components/navigation'
import { useAuth } from '../../contexts/AuthContext'
import { formatCurrency, formatDate, EmptyState, SkeletonCard, StatusBadge } from '../../components/ui'

// ================================================
// TENANT RENT PAGE
// ================================================

export function TenantRentPage() {
  const navigate = useNavigate()
  const [invoices, setInvoices] = useState<RentInvoice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [reportingInvoice, setReportingInvoice] = useState<RentInvoice | null>(null)
  const [viewingInvoice, setViewingInvoice] = useState<RentInvoice | null>(null)
  const [method, setMethod] = useState('upi')
  const [reference, setReference] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [proofPreview, setProofPreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showQR, setShowQR] = useState(false)

  const load = () => {
    setIsLoading(true)
    rentApi.listInvoices({}).then((res) => {
      setInvoices(res.data.data || [])
    }).catch(() => {}).finally(() => setIsLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

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
    if (!reportingInvoice) return
    setIsSubmitting(true)
    try {
      let uploadedProofUrl: string | undefined = undefined
      if (proofFile) {
        try {
          const formData = new FormData()
          formData.append('file', proofFile)
          formData.append('entity_type', 'payment')
          formData.append('entity_id', reportingInvoice.id)
          formData.append('name', `Proof_${reportingInvoice.invoice_number}`)
          const uploadRes = await documentApi.upload(formData)
          uploadedProofUrl = uploadRes.data?.data?.url || uploadRes.data?.data?.filename
        } catch (uploadErr) {
          console.warn('Document upload error, falling back to base64 preview if possible', uploadErr)
          if (proofPreview && proofPreview.length < 500000) {
            uploadedProofUrl = proofPreview
          }
        }
      }

      await rentApi.reportPayment(reportingInvoice.id, {
        amount: reportingInvoice.total_amount,
        payment_method: method,
        transaction_reference: reference.trim() || undefined,
        payment_date: date,
        proof_url: uploadedProofUrl,
        notes: notes.trim() || undefined,
      })
      alert('Payment reported successfully! Owner will verify and issue your digital receipt.')
      setReportingInvoice(null)
      setViewingInvoice(null)
      handleClearFile()
      load()
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to submit payment report')
    } finally {
      setIsSubmitting(false)
    }
  }

  const shareViaWhatsApp = (inv: RentInvoice) => {
    const month = new Date(inv.billing_month + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    const text = `🏠 Official Rent Statement\nInvoice: ${inv.invoice_number}\nBilling Period: ${month}\nTotal Amount: ${formatCurrency(inv.total_amount)}\nStatus: ${inv.status.toUpperCase()}\nDue Date: ${formatDate(inv.due_date)}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  return (
    <MobilePage role="tenant" header={<MobileHeader title="Rent Invoices & Dues" showBack />}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '1rem',
        }}
      >
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : invoices.length === 0 ? (
          <div style={{ gridColumn: '1 / -1' }}>
            <EmptyState
              icon={<CreditCard size={36} />}
              title="No rent invoices found"
              description="Your monthly rent statements and invoices will appear here."
            />
          </div>
        ) : (
          invoices.map((inv) => {
            const isPaid = inv.status === 'paid'
            const isOverdue = inv.status === 'overdue'
            const isUnderReview = inv.status === 'under_review' || inv.payment_claimed

            const borderCol = isPaid ? '#10B981' : isUnderReview ? '#F59E0B' : isOverdue ? '#EF4444' : '#3B82F6'

            return (
              <div
                key={inv.id}
                className="card card-hover"
                onClick={() => setViewingInvoice(inv)}
                style={{
                  padding: '1rem 1.125rem',
                  borderRadius: '0.875rem',
                  borderLeft: `4px solid ${borderCol}`,
                  background: '#FFFFFF',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 2px 8px -2px rgba(0,0,0,0.06)',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                <div>
                  {/* Top Bar: Invoice # + Title + Status */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.625rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#2563EB', background: '#EFF6FF', padding: '0.15rem 0.4rem', borderRadius: 4, border: '1px solid #DBEAFE' }}>
                        {inv.invoice_number}
                      </span>
                      <span style={{ fontWeight: 800, fontSize: '0.925rem', color: '#0F172A' }}>
                        {new Date(inv.billing_month + '-01').toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })} Rent
                      </span>
                    </div>
                    <StatusBadge status={inv.status} />
                  </div>

                  {/* Middle Row: Amount & Due Summary */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', background: '#F8FAFC', padding: '0.625rem 0.75rem', borderRadius: '0.625rem', border: '1px solid #F1F5F9', marginBottom: '0.625rem' }}>
                    <div>
                      <span style={{ fontSize: '0.625rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Amount</span>
                      <div style={{ fontWeight: 900, fontSize: '1.25rem', margin: 0, fontVariantNumeric: 'tabular-nums', color: isPaid ? '#059669' : '#0F172A', lineHeight: 1.1 }}>
                        {formatCurrency(inv.total_amount)}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.6875rem', color: '#64748B', display: 'block' }}>
                        Due: <strong style={{ color: isOverdue ? '#DC2626' : '#334155' }}>{formatDate(inv.due_date)}</strong>
                      </span>
                      {isPaid ? (
                        <span style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.2rem' }}>
                          ✓ Cleared in Full
                        </span>
                      ) : isUnderReview ? (
                        <span style={{ fontSize: '0.72rem', color: '#D97706', fontWeight: 700 }}>⏳ Under Review</span>
                      ) : (
                        <span style={{ fontSize: '0.72rem', color: '#DC2626', fontWeight: 700 }}>Pending: {formatCurrency(inv.pending_amount)}</span>
                      )}
                    </div>
                  </div>

                  {/* Micro Breakdown Badges */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.75rem', fontSize: '0.7rem' }}>
                    <span style={{ background: '#F1F5F9', padding: '0.15rem 0.45rem', borderRadius: '0.35rem', color: '#475569' }}>
                      Rent: <strong>{formatCurrency(inv.rent_amount)}</strong>
                    </span>
                    {inv.maintenance_amount > 0 && (
                      <span style={{ background: '#F1F5F9', padding: '0.15rem 0.45rem', borderRadius: '0.35rem', color: '#475569' }}>
                        Maint: <strong>{formatCurrency(inv.maintenance_amount)}</strong>
                      </span>
                    )}
                    {inv.utility_amount > 0 && (
                      <span style={{ background: '#F1F5F9', padding: '0.15rem 0.45rem', borderRadius: '0.35rem', color: '#475569' }}>
                        Util: <strong>{formatCurrency(inv.utility_amount)}</strong>
                      </span>
                    )}
                    {inv.discount > 0 && (
                      <span style={{ background: '#ECFDF5', padding: '0.15rem 0.45rem', borderRadius: '0.35rem', color: '#059669', fontWeight: 700 }}>
                        Disc: -{formatCurrency(inv.discount)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer / Action */}
                <div>
                  {!isPaid && !isUnderReview && (
                    <button
                      type="button"
                      className="btn btn-sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setReportingInvoice(inv)
                      }}
                      style={{
                        width: '100%',
                        background: 'linear-gradient(135deg, #16A34A 0%, #15803D 100%)',
                        color: '#FFFFFF',
                        fontWeight: 700,
                        fontSize: '0.78rem',
                        padding: '0.55rem 0.85rem',
                        borderRadius: '0.5rem',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.4rem',
                        boxShadow: '0 2px 8px rgba(22, 163, 74, 0.25)',
                        cursor: 'pointer',
                      }}
                    >
                      <CreditCard size={15} /> I've Already Paid / Submit Proof
                    </button>
                  )}

                  {isUnderReview && (
                    <div
                      style={{
                        padding: '0.45rem 0.75rem',
                        background: '#FFFBEB',
                        border: '1px solid #FDE68A',
                        borderRadius: '0.5rem',
                        fontSize: '0.72rem',
                        color: '#92400E',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                      }}
                    >
                      <span>⏳</span>
                      <span>Proof submitted • Tap to view status</span>
                    </div>
                  )}

                  {inv.payments && inv.payments.length > 0 && (
                    <div style={{ borderTop: '1px dashed #E2E8F0', paddingTop: '0.45rem', marginTop: '0.45rem' }}>
                      {inv.payments.map((p: any) => (
                        <div
                          key={p.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '0.72rem',
                            color: '#64748B',
                          }}
                        >
                          <span style={{ fontWeight: 600 }}>#{p.receipt_number} • {formatDate(p.payment_date)}</span>
                          <span style={{ fontWeight: 800, color: '#059669' }}>{formatCurrency(p.amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* DETAILED INVOICE & RECEIPT MODAL (OPENED BY CLICKING ANY CARD) */}
      {viewingInvoice && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 9998,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={() => setViewingInvoice(null)}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '520px',
              backgroundColor: '#ffffff',
              borderRadius: '1.25rem',
              padding: '1.5rem',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 35px -5px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.85rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#2563EB', background: '#EFF6FF', padding: '0.15rem 0.5rem', borderRadius: 4, border: '1px solid #DBEAFE' }}>
                    {viewingInvoice.invoice_number}
                  </span>
                  <StatusBadge status={viewingInvoice.status} />
                </div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0, color: '#0F172A' }}>
                  {new Date(viewingInvoice.billing_month + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })} Rent Statement
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setViewingInvoice(null)}
                style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748B' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Total Highlight */}
            <div style={{
              background: viewingInvoice.status === 'paid' ? 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)' : 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
              border: `1px solid ${viewingInvoice.status === 'paid' ? '#A7F3D0' : '#E2E8F0'}`,
              borderRadius: '0.75rem',
              padding: '1rem 1.25rem',
              marginBottom: '1.25rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: viewingInvoice.status === 'paid' ? '#047857' : '#64748B' }}>
                  Total Invoice Amount
                </span>
                <div style={{ fontSize: '1.75rem', fontWeight: 900, color: viewingInvoice.status === 'paid' ? '#065F46' : '#0F172A', fontVariantNumeric: 'tabular-nums' }}>
                  {formatCurrency(viewingInvoice.total_amount)}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.7rem', color: '#64748B' }}>Due Date</span>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0F172A' }}>
                  {formatDate(viewingInvoice.due_date)}
                </div>
              </div>
            </div>

            {/* Detailed Line Items Breakdown */}
            <h4 style={{ fontSize: '0.85rem', fontWeight: 800, margin: '0 0 0.5rem', color: '#334155' }}>Line Items & Charges</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '0.75rem', padding: '0.75rem 1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                <span style={{ color: '#64748B' }}>Base Monthly Rent:</span>
                <strong style={{ color: '#0F172A' }}>{formatCurrency(viewingInvoice.rent_amount)}</strong>
              </div>
              {viewingInvoice.maintenance_amount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                  <span style={{ color: '#64748B' }}>Maintenance & Society Dues:</span>
                  <strong style={{ color: '#0F172A' }}>{formatCurrency(viewingInvoice.maintenance_amount)}</strong>
                </div>
              )}
              {viewingInvoice.utility_amount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                  <span style={{ color: '#64748B' }}>Utilities (Electricity / Water):</span>
                  <strong style={{ color: '#0F172A' }}>{formatCurrency(viewingInvoice.utility_amount)}</strong>
                </div>
              )}
              {viewingInvoice.discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: '#059669' }}>
                  <span>Promotional Discount / Credit:</span>
                  <strong>-{formatCurrency(viewingInvoice.discount)}</strong>
                </div>
              )}
              <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '0.5rem', marginTop: '0.25rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 900 }}>
                <span style={{ color: '#0F172A' }}>Net Payable:</span>
                <span style={{ color: viewingInvoice.status === 'paid' ? '#059669' : '#0F172A' }}>{formatCurrency(viewingInvoice.total_amount)}</span>
              </div>
            </div>

            {/* Payments & Receipts History if available */}
            {viewingInvoice.payments && viewingInvoice.payments.length > 0 && (
              <div style={{ marginBottom: '1.25rem' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 800, margin: '0 0 0.5rem', color: '#334155' }}>Confirmed Digital Receipts</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {viewingInvoice.payments.map((p: any) => (
                    <div key={p.id} style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '0.625rem', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#065F46' }}>Receipt #{p.receipt_number}</div>
                        <div style={{ fontSize: '0.72rem', color: '#047857' }}>
                          Mode: {p.payment_method?.toUpperCase()} • {formatDate(p.payment_date)}
                        </div>
                        {p.transaction_reference && (
                          <div style={{ fontSize: '0.68rem', fontFamily: 'monospace', color: '#065F46', marginTop: 2 }}>
                            UTR: {p.transaction_reference}
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#059669' }}>
                        {formatCurrency(p.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ flex: 1, gap: '0.35rem', fontSize: '0.8rem' }}
                onClick={() => shareViaWhatsApp(viewingInvoice)}
              >
                Share Statement
              </button>
              
              {viewingInvoice.status !== 'paid' && viewingInvoice.status !== 'under_review' ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ flex: 1.4, gap: '0.4rem', fontSize: '0.825rem', backgroundColor: '#16A34A', borderColor: '#16A34A', fontWeight: 800 }}
                  onClick={() => {
                    const inv = viewingInvoice
                    setViewingInvoice(null)
                    setReportingInvoice(inv)
                  }}
                >
                  <CreditCard size={15} /> Pay / Submit Proof
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ flex: 1.4, gap: '0.4rem', fontSize: '0.825rem', fontWeight: 800 }}
                  onClick={() => {
                    window.print()
                  }}
                >
                  Print PDF
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* REPORT PAYMENT MODAL */}
      {reportingInvoice && (
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
          onClick={() => setReportingInvoice(null)}
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
            <h2 style={{ fontSize: '1.125rem', fontWeight: 800, margin: '0 0 0.25rem', color: '#0F172A' }}>
              Submit Payment Proof / Already Paid
            </h2>
            <p style={{ fontSize: '0.8125rem', color: '#64748B', margin: '0 0 1rem' }}>
              Invoice #{reportingInvoice.invoice_number} • Total: <strong>{formatCurrency(reportingInvoice.total_amount)}</strong>
            </p>

            <form onSubmit={handleReport} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="label" style={{ fontWeight: 700, fontSize: '0.8125rem', marginBottom: '0.25rem', display: 'block' }}>
                  Payment Mode *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  {[
                    { value: 'upi', label: '📱 UPI / PhonePe' },
                    { value: 'bank_transfer', label: '🏦 Bank Transfer' },
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
                    Transaction / UTR Ref *
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
                  Notes (optional)
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Sent via Google Pay"
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
                      title="Remove image"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setReportingInvoice(null)} disabled={isSubmitting}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                  style={{ backgroundColor: '#16A34A', borderColor: '#16A34A', fontWeight: 700 }}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Payment Proof'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MobilePage>
  )
}

// ================================================
// TENANT MAINTENANCE PAGE
// ================================================

const CATEGORIES = [
  { value: 'plumbing', label: 'Plumbing', icon: '🔧' },
  { value: 'electrical', label: 'Electrical', icon: '⚡' },
  { value: 'water', label: 'Water', icon: '💧' },
  { value: 'ac', label: 'AC', icon: '❄️' },
  { value: 'cleaning', label: 'Cleaning', icon: '🧹' },
  { value: 'internet', label: 'Internet', icon: '🌐' },
  { value: 'appliance', label: 'Appliance', icon: '📺' },
  { value: 'other', label: 'Other', icon: '🔨' },
]

export function TenantMaintenancePage() {
  const navigate = useNavigate()
  const [requests, setRequests] = useState<MaintenanceRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showNewForm, setShowNewForm] = useState(false)

  const load = () => {
    maintenanceApi.list({}).then((res) => {
      setRequests(res.data.data || [])
    }).catch(() => {}).finally(() => setIsLoading(false))
  }

  useEffect(() => { load() }, [])

  if (showNewForm) {
    return <NewMaintenanceForm onClose={() => { setShowNewForm(false); load() }} />
  }

  return (
    <MobilePage
      role="tenant"
      header={<MobileHeader title="Maintenance" showBack />}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
        ) : requests.length === 0 ? (
          <EmptyState
            icon={<Wrench size={32} />}
            title="Everything looks good 🎉"
            description="No active maintenance requests. Tap below to report an issue."
            action={
              <button className="btn btn-primary" onClick={() => setShowNewForm(true)}>
                <Plus size={18} /> New Request
              </button>
            }
          />
        ) : (
          requests.map((r) => (
            <div key={r.id} className="card" style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <h3 style={{ fontWeight: 700, fontSize: '0.9375rem', margin: 0 }}>{r.title}</h3>
                <StatusBadge status={r.status} />
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'rgb(var(--muted-foreground))', margin: '0 0 0.375rem', textTransform: 'capitalize' }}>
                {r.category} • #{r.request_number}
              </p>
              <p style={{ fontSize: '0.75rem', color: 'rgb(var(--muted-foreground))', margin: 0 }}>{formatDate(r.created_at)}</p>
            </div>
          ))
        )}
      </div>
      <div style={{ position: 'fixed', bottom: 'calc(var(--bottom-nav-height) + 1rem + var(--safe-bottom))', right: '1rem' }}>
        <button className="btn btn-primary" onClick={() => setShowNewForm(true)} style={{ borderRadius: 'var(--radius-full)', boxShadow: '0 4px 16px rgb(37 99 235 / 0.35)' }}>
          <Plus size={20} /> New Request
        </button>
      </div>
    </MobilePage>
  )
}

// ================================================
// NEW MAINTENANCE FORM (Tenant, 3-step)
// ================================================

function NewMaintenanceForm({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(1)
  const [category, setCategory] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('medium')
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [requestNumber, setRequestNumber] = useState('')
  const [propertyId, setPropertyId] = useState('')
  const [unitId, setUnitId] = useState('')

  useEffect(() => {
    import('../../api/client').then(({ dashboardApi }) => {
      dashboardApi.getTenantDashboard().then((res) => {
        setPropertyId(res.data.data.property?.id || '')
        setUnitId(res.data.data.unit?.id || '')
      }).catch(() => {})
    })
  }, [])

  const handleSubmit = async () => {
    setIsLoading(true)
    try {
      const { maintenanceApi } = await import('../../api/client')
      const res = await maintenanceApi.create({
        property_id: propertyId,
        unit_id: unitId,
        category, title, description, priority,
      })
      setRequestNumber(res.data.data.request_number)
      setSuccess(true)
    } catch {
      alert('Failed to submit. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <MobilePage role="tenant" header={<MobileHeader title="Request Submitted" />} showBottomNav={false}>
        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
          <h2 style={{ fontWeight: 800, fontSize: '1.5rem', margin: '0 0 0.5rem' }}>Request Submitted!</h2>
          <p style={{ color: 'rgb(var(--muted-foreground))', marginBottom: '0.5rem' }}>Your maintenance request has been submitted.</p>
          <p style={{ fontWeight: 700, fontSize: '1.125rem', color: 'rgb(var(--primary))', marginBottom: '2rem' }}>Request ID: #{requestNumber}</p>
          <button className="btn btn-primary btn-full" onClick={onClose}>Back to Maintenance</button>
        </div>
      </MobilePage>
    )
  }

  return (
    <MobilePage role="tenant" header={<MobileHeader title={`Step ${step} of 3`} showBack onBack={step === 1 ? onClose : () => setStep(step - 1)} />} showBottomNav={false}>
      {/* Progress */}
      <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '1.5rem' }}>
        {[1, 2, 3].map((s) => (
          <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: s <= step ? 'rgb(var(--primary))' : 'rgb(var(--border))', transition: 'background 0.3s ease' }} />
        ))}
      </div>

      {step === 1 && (
        <>
          <h2 style={{ fontWeight: 700, fontSize: '1.25rem', margin: '0 0 0.5rem' }}>What's the problem?</h2>
          <p className="text-muted" style={{ marginBottom: '1.25rem' }}>Select the category that best fits your issue.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                onClick={() => setCategory(c.value)}
                style={{
                  padding: '1rem', borderRadius: 'var(--radius-lg)', textAlign: 'center',
                  border: `2px solid ${category === c.value ? 'rgb(var(--primary))' : 'rgb(var(--card-border))'}`,
                  background: category === c.value ? 'rgb(var(--primary-light))' : 'rgb(var(--card))',
                  cursor: 'pointer', transition: 'all 0.15s ease',
                }}
              >
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{c.icon}</div>
                <p style={{ fontWeight: 600, fontSize: '0.875rem', margin: 0, color: category === c.value ? 'rgb(var(--primary))' : 'rgb(var(--foreground))' }}>{c.label}</p>
              </button>
            ))}
          </div>
          <button className="btn btn-primary btn-full btn-lg" style={{ marginTop: '1.5rem' }} disabled={!category} onClick={() => setStep(2)}>Continue</button>
        </>
      )}

      {step === 2 && (
        <>
          <h2 style={{ fontWeight: 700, fontSize: '1.25rem', margin: '0 0 0.5rem' }}>Describe the problem</h2>
          <p className="text-muted" style={{ marginBottom: '1.25rem' }}>Give us details so we can help faster.</p>
          <div className="form-group">
            <label className="input-label" htmlFor="maint-title">Title</label>
            <input id="maint-title" type="text" className="input" placeholder="e.g. Water leakage in bathroom" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="input-label" htmlFor="maint-desc">Description</label>
            <textarea
              id="maint-desc" className="input" rows={4}
              placeholder="Describe the issue in detail..."
              value={description} onChange={(e) => setDescription(e.target.value)}
              style={{ resize: 'none' }}
            />
          </div>
          <button className="btn btn-primary btn-full btn-lg" disabled={!title || !description} onClick={() => setStep(3)}>Continue</button>
        </>
      )}

      {step === 3 && (
        <>
          <h2 style={{ fontWeight: 700, fontSize: '1.25rem', margin: '0 0 0.5rem' }}>Priority</h2>
          <p className="text-muted" style={{ marginBottom: '1.25rem' }}>How urgent is this issue?</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {[
              { value: 'low', label: 'Low', desc: 'Not urgent, can wait', color: 'var(--muted-foreground)' },
              { value: 'medium', label: 'Medium', desc: 'Should be fixed soon', color: 'var(--info)' },
              { value: 'high', label: 'High', desc: 'Needs prompt attention', color: 'var(--warning)' },
              { value: 'urgent', label: 'Urgent', desc: 'Critical issue, immediate fix needed', color: 'var(--danger)' },
            ].map((p) => (
              <button
                key={p.value}
                onClick={() => setPriority(p.value)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.875rem',
                  padding: '1rem', borderRadius: 'var(--radius-lg)', textAlign: 'left',
                  border: `2px solid ${priority === p.value ? `rgb(${p.color})` : 'rgb(var(--card-border))'}`,
                  background: priority === p.value ? `rgb(${p.color} / 0.08)` : 'rgb(var(--card))',
                  cursor: 'pointer', transition: 'all 0.15s ease',
                }}
              >
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: `rgb(${p.color})`, flexShrink: 0 }} />
                <div>
                  <p style={{ fontWeight: 700, margin: '0 0 0.125rem', fontSize: '0.9375rem' }}>{p.label}</p>
                  <p style={{ fontSize: '0.8125rem', color: 'rgb(var(--muted-foreground))', margin: 0 }}>{p.desc}</p>
                </div>
              </button>
            ))}
          </div>
          <button className="btn btn-primary btn-full btn-lg" disabled={isLoading} onClick={handleSubmit}>
            {isLoading ? 'Submitting...' : 'Submit Request'}
          </button>
        </>
      )}
    </MobilePage>
  )
}

// ================================================
// STUB PAGES
// ================================================

export function TenantDocumentsPage() {
  return <MobilePage role="tenant" header={<MobileHeader title="Documents" showBack />}><p className="text-muted" style={{ textAlign: 'center', paddingTop: '3rem' }}>Documents coming soon.</p></MobilePage>
}

export function TenantMorePage() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const items = [
    { label: 'Payments', icon: '💳', to: '/tenant/payments' },
    { label: 'Receipts', icon: '🧾', to: '/tenant/payments' },
    { label: 'Agreement', icon: '📄', to: '/tenant/agreements' },
    { label: 'Notifications', icon: '🔔', to: '/tenant/notifications' },
    { label: 'Profile', icon: '👤', to: '/tenant/profile' },
    { label: 'Settings', icon: '⚙️', to: '/tenant/settings' },
  ]
  return (
    <MobilePage role="tenant" header={<MobileHeader title="More" />}>
      <div className="card" style={{ overflow: 'hidden' }}>
        {items.map((item, i) => (
          <button key={item.label} onClick={() => navigate(item.to)} style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '1rem 1.125rem', width: '100%', background: 'none', border: 'none', borderBottom: i < items.length - 1 ? '1px solid rgb(var(--border))' : 'none', cursor: 'pointer', textAlign: 'left' }}>
            <span style={{ fontSize: '1.25rem' }}>{item.icon}</span>
            <span style={{ fontWeight: 500 }}>{item.label}</span>
            <ChevronRight size={18} style={{ marginLeft: 'auto', color: 'rgb(var(--muted-foreground))' }} />
          </button>
        ))}
      </div>
      <button className="btn btn-danger btn-full" style={{ marginTop: '1rem' }} onClick={async () => { await logout(); navigate('/login') }}>
        Logout
      </button>
    </MobilePage>
  )
}
