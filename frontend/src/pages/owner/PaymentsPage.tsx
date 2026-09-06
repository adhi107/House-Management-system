import React, { useState, useEffect } from 'react'
import { rentApi } from '../../api/client'
import { Payment, RentInvoice, PaymentMethod } from '../../types'
import { MobilePage } from '../../components/layout/AppShell'
import { MobileHeader } from '../../components/navigation'
import { formatCurrency, formatDate, EmptyState, SkeletonCard, Modal } from '../../components/ui'
import { DollarSign, Download, Search, Plus, CreditCard, CheckCircle2 } from 'lucide-react'
import { generateRentReceiptPDF } from '../../utils/pdfReceipt'
import { useToast } from '../../contexts/ToastContext'
import { AxiosError } from 'axios'

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showRecordModal, setShowRecordModal] = useState(false)

  const load = () => {
    setIsLoading(true)
    rentApi.listPayments({ per_page: 50 }).then((res) => {
      setPayments(res.data.data || [])
    }).catch(() => {}).finally(() => setIsLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = payments.filter((p) =>
    (p.tenant_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.receipt_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.unit_number || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalCollected = filtered.reduce((acc, curr) => acc + (curr.amount || 0), 0)

  return (
    <MobilePage
      role="owner"
      header={
        <MobileHeader
          title="Payments & Receipts"
          showBack
          rightAction={
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setShowRecordModal(true)}
              style={{ gap: '0.25rem' }}
            >
              <Plus size={16} /> Record
            </button>
          }
        />
      }
    >
      {/* Desktop Header Row */}
      <div className="hidden-mobile" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>
            Payments & Receipts
          </h1>
          <p style={{ fontSize: '0.8125rem', color: '#64748B', margin: '0.125rem 0 0' }}>
            View transaction records, record offline collections, and download GST rent receipts
          </p>
        </div>

        <button
          className="btn btn-primary btn-sm"
          onClick={() => setShowRecordModal(true)}
          style={{ gap: '0.375rem' }}
        >
          <Plus size={15} /> Record Payment
        </button>
      </div>

      {/* Search & Stats */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
          <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input
            type="search"
            className="input"
            style={{ paddingLeft: 42 }}
            placeholder="Search by tenant name, flat number, or receipt #..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {payments.length > 0 && (
          <div className="card" style={{ padding: '0.875rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ECFDF5', border: '1px solid #D1FAE5' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#065F46' }}>Total Collections Recorded</span>
            <span style={{ fontWeight: 800, fontSize: '1.125rem', color: '#047857', fontVariantNumeric: 'tabular-nums' }}>
              {formatCurrency(totalCollected)}
            </span>
          </div>
        )}
      </div>

      <div style={{ marginBottom: '0.5rem', fontSize: '0.8125rem', color: '#64748B', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Showing {filtered.length} receipt{filtered.length !== 1 ? 's' : ''}</span>
        <button
          className="btn btn-secondary btn-sm mobile-only"
          onClick={() => setShowRecordModal(true)}
          style={{ gap: '0.25rem', fontSize: '0.75rem' }}
        >
          <Plus size={13} /> Record Payment
        </button>
      </div>

      {isLoading ? (
        Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<DollarSign size={32} />}
          title="No payments found"
          description={searchTerm ? `No receipts matched "${searchTerm}"` : "Recorded rent payments and receipts will show here."}
          action={
            <button className="btn btn-primary" onClick={() => setShowRecordModal(true)}>
              <Plus size={18} /> Record First Payment
            </button>
          }
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filtered.map((p) => (
            <div key={p.id} className="card card-hover" style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.375rem' }}>
                <div>
                  <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#2563EB', background: '#EFF6FF', padding: '0.125rem 0.375rem', borderRadius: 4 }}>
                    {p.receipt_number}
                  </span>
                  <h3 style={{ fontWeight: 700, fontSize: '0.9375rem', margin: '0.25rem 0 0.125rem', color: '#0F172A' }}>
                    {p.tenant_name || 'Resident'}
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: '#64748B', margin: 0 }}>
                    Flat {p.unit_number} • {p.property_name} • Month: {p.billing_month}
                  </p>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontWeight: 800, fontSize: '1.0625rem', margin: '0 0 0.125rem', color: '#059669', fontVariantNumeric: 'tabular-nums' }}>
                    {formatCurrency(p.amount)}
                  </p>
                  <span style={{ fontSize: '0.6875rem', textTransform: 'uppercase', color: '#64748B', fontWeight: 600 }}>
                    {p.payment_method}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.625rem', paddingTop: '0.5rem', borderTop: '1px solid #F1F5F9', fontSize: '0.75rem', color: '#64748B' }}>
                <span>Paid on {formatDate(p.payment_date)} {p.transaction_reference ? `• Ref: ${p.transaction_reference}` : ''}</span>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => generateRentReceiptPDF(p)}
                  style={{ gap: '0.25rem', padding: '0.25rem 0.5rem', height: 26, fontSize: '0.75rem', color: '#2563EB' }}
                >
                  <Download size={13} /> Receipt PDF
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Record Payment Modal */}
      <RecordPaymentModal
        isOpen={showRecordModal}
        onClose={() => setShowRecordModal(false)}
        onSuccess={() => {
          setShowRecordModal(false)
          load()
        }}
      />
    </MobilePage>
  )
}

function RecordPaymentModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}) {
  const { success, error } = useToast()
  const [invoices, setInvoices] = useState<RentInvoice[]>([])
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('')
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState<PaymentMethod>('upi')
  const [reference, setReference] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (isOpen) {
      rentApi.listInvoices({ per_page: 50 }).then((res) => {
        const invList = (res.data.data || []).filter((i: RentInvoice) => i.status !== 'paid' && i.status !== 'waived')
        setInvoices(invList)
        if (invList.length > 0) {
          setSelectedInvoiceId(invList[0].id)
          setAmount(String(invList[0].pending_amount))
        } else {
          setSelectedInvoiceId('')
          setAmount('')
        }
      }).catch(() => {})

      setReference('')
      setNotes('')
      setDate(new Date().toISOString().split('T')[0])
      setErrors({})
    }
  }, [isOpen])

  const handleInvoiceSelect = (invId: string) => {
    setSelectedInvoiceId(invId)
    const inv = invoices.find((i) => i.id === invId)
    if (inv) {
      setAmount(String(inv.pending_amount))
    }
  }

  const selectedInvoice = invoices.find((i) => i.id === selectedInvoiceId)

  const validate = () => {
    const e: Record<string, string> = {}
    if (!selectedInvoiceId) e.invoice = 'Please select a pending invoice'
    const num = parseFloat(amount)
    if (!num || num <= 0) e.amount = 'Enter a valid payment amount'
    if (selectedInvoice && num > (selectedInvoice.pending_amount + 0.01)) {
      e.amount = `Amount cannot exceed pending balance of ${formatCurrency(selectedInvoice.pending_amount)}`
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setIsLoading(true)
    try {
      await rentApi.recordPayment({
        invoice_id: selectedInvoiceId,
        amount: parseFloat(amount),
        payment_method: method,
        transaction_reference: reference.trim() || undefined,
        payment_date: date,
        notes: notes.trim() || undefined,
      })
      success('Payment recorded successfully!')
      onSuccess()
    } catch (err) {
      const axiosErr = err as AxiosError<{ detail: string }>
      error(axiosErr.response?.data?.detail || 'Failed to record payment')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record Payment / Collection" maxWidth="520px">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="input-label">Select Pending Invoice / Tenant</label>
          <select
            className={`input ${errors.invoice ? 'input-error' : ''}`}
            value={selectedInvoiceId}
            onChange={(e) => handleInvoiceSelect(e.target.value)}
          >
            {invoices.length === 0 ? (
              <option value="">No pending invoices found</option>
            ) : (
              invoices.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.tenant_name} • Flat {inv.unit_number} • Due: {formatCurrency(inv.pending_amount)} ({inv.billing_month})
                </option>
              ))
            )}
          </select>
          {errors.invoice && <p className="input-hint input-hint-error">{errors.invoice}</p>}
        </div>

        {selectedInvoice && (
          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.75rem', borderRadius: 8, marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
            <span>Total: <strong>{formatCurrency(selectedInvoice.total_amount)}</strong></span>
            <span>Paid: <strong style={{ color: '#059669' }}>{formatCurrency(selectedInvoice.paid_amount)}</strong></span>
            <span>Due: <strong style={{ color: '#DC2626' }}>{formatCurrency(selectedInvoice.pending_amount)}</strong></span>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div className="form-group">
            <label className="input-label">Payment Amount (₹)</label>
            <input
              type="number"
              inputMode="decimal"
              className={`input ${errors.amount ? 'input-error' : ''}`}
              placeholder="e.g. 15000"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value)
                setErrors((p) => ({ ...p, amount: '' }))
              }}
            />
            {errors.amount && <p className="input-hint input-hint-error">{errors.amount}</p>}
          </div>

          <div className="form-group">
            <label className="input-label">Payment Mode</label>
            <select
              className="input"
              value={method}
              onChange={(e) => setMethod(e.target.value as PaymentMethod)}
            >
              <option value="upi">📱 UPI / QR</option>
              <option value="cash">💵 Cash</option>
              <option value="bank_transfer">🏦 Bank Transfer</option>
              <option value="card">💳 Card</option>
              <option value="cheque">📝 Cheque</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div className="form-group">
            <label className="input-label">Payment Date</label>
            <input
              type="date"
              className="input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="input-label">Ref / Transaction ID (opt)</label>
            <input
              type="text"
              className="input"
              placeholder="UPI/UTR ref..."
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="input-label">Notes (optional)</label>
          <input
            type="text"
            className="input"
            placeholder="e.g. Received via PhonePe"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.25rem', borderTop: '1px solid #F1F5F9', paddingTop: '1rem' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={isLoading} style={{ gap: '0.375rem' }}>
            <Plus size={15} />
            {isLoading ? 'Recording...' : 'Record Payment'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
