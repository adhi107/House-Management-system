import React, { useState, useEffect } from 'react'
import { rentApi } from '../../api/client'
import { Payment, RentInvoice, PaymentMethod } from '../../types'
import { MobilePage } from '../../components/layout/AppShell'
import { MobileHeader } from '../../components/navigation'
import { formatCurrency, formatDate, EmptyState, SkeletonCard, Modal, StatusBadge } from '../../components/ui'
import {
  DollarSign,
  Download,
  Search,
  Plus,
  CreditCard,
  CheckCircle2,
  Receipt,
  FileSpreadsheet,
  Filter,
  Calendar,
  Building2,
  Printer,
  Sparkles,
  Smartphone,
  Banknote,
  Building,
  Check
} from 'lucide-react'
import { generateRentReceiptPDF } from '../../utils/pdfReceipt'
import { useToast } from '../../contexts/ToastContext'
import { AxiosError } from 'axios'

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMethod, setSelectedMethod] = useState<string>('')
  const [selectedMonth, setSelectedMonth] = useState<string>('')
  const [showRecordModal, setShowRecordModal] = useState(false)
  const [selectedReceipt, setSelectedReceipt] = useState<Payment | null>(null)
  const { success, error, info } = useToast()

  const load = async () => {
    setIsLoading(true)
    try {
      const res = await rentApi.listPayments({
        billing_month: selectedMonth || undefined,
        payment_method: selectedMethod || undefined,
        per_page: 100,
      })
      setPayments(res.data.data || [])
    } catch {
      error('Failed to load payment records')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [selectedMethod, selectedMonth])

  const filtered = payments.filter((p) => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      (p.tenant_name || '').toLowerCase().includes(term) ||
      (p.receipt_number || '').toLowerCase().includes(term) ||
      (p.unit_number || '').toLowerCase().includes(term) ||
      (p.property_name || '').toLowerCase().includes(term) ||
      (p.transaction_reference || '').toLowerCase().includes(term)
    )
  })

  // Aggregations
  const totalCollected = filtered.reduce((acc, curr) => acc + (curr.amount || 0), 0)
  const upiTotal = filtered.filter((p) => p.payment_method === 'upi').reduce((acc, curr) => acc + (curr.amount || 0), 0)
  const cashTotal = filtered.filter((p) => p.payment_method === 'cash').reduce((acc, curr) => acc + (curr.amount || 0), 0)
  const bankTotal = filtered.filter((p) => p.payment_method === 'bank_transfer').reduce((acc, curr) => acc + (curr.amount || 0), 0)

  const handleExportCSV = () => {
    if (filtered.length === 0) {
      info('No payment records to export')
      return
    }

    const headers = ['Receipt Number', 'Tenant Name', 'Flat', 'Building', 'Month', 'Amount', 'Payment Mode', 'Date', 'Transaction Ref', 'Notes']
    const rows = filtered.map((p) => [
      p.receipt_number,
      `"${p.tenant_name || ''}"`,
      `"${p.unit_number || ''}"`,
      `"${p.property_name || ''}"`,
      p.billing_month,
      p.amount,
      p.payment_method,
      p.payment_date,
      `"${p.transaction_reference || ''}"`,
      `"${p.notes || ''}"`,
    ])

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `Payment_Receipts_${selectedMonth || 'all'}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    success('Payment records exported to CSV successfully!')
  }

  return (
    <MobilePage
      role="owner"
      header={
        <MobileHeader
          title="Payment Records"
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
          <h1 style={{ fontSize: '1.5rem', fontWeight: 900, margin: 0, color: '#0F172A', letterSpacing: '-0.02em' }}>
            Payment Records & Digital Receipts
          </h1>
          <p style={{ fontSize: '0.8125rem', color: '#64748B', margin: '0.15rem 0 0' }}>
            Audit transaction logs, print GST-ready rent receipts, record offline collections, and export statements
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleExportCSV}
            style={{ gap: '0.375rem' }}
          >
            <FileSpreadsheet size={14} /> Export CSV
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setShowRecordModal(true)}
            style={{ gap: '0.375rem', backgroundColor: '#2563EB', borderColor: '#2563EB', fontWeight: 700 }}
          >
            <Plus size={15} /> Record Payment
          </button>
        </div>
      </div>

      {/* FINANCIAL OVERVIEW KPI BANNER */}
      <div
        className="card"
        style={{
          padding: '1.25rem',
          marginBottom: '1.25rem',
          background: 'linear-gradient(135deg, #064E3B 0%, #0F172A 100%)',
          color: '#FFFFFF',
          borderRadius: '1rem',
          boxShadow: '0 8px 24px -4px rgba(6, 78, 59, 0.25)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <span style={{ fontSize: '0.6875rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6EE7B7' }}>
              Total Verified Collections
            </span>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 900, margin: '0.2rem 0 0', color: '#FFFFFF', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
              {formatCurrency(totalCollected)}
            </h2>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block' }}>Total Receipts</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#FFFFFF' }}>{filtered.length}</span>
          </div>
        </div>

        {/* Breakdown by Payment Method */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.625rem' }}>
          
          <div
            onClick={() => setSelectedMethod(selectedMethod === 'upi' ? '' : 'upi')}
            className="card-hover"
            style={{
              padding: '0.625rem 0.75rem',
              borderRadius: '0.5rem',
              background: selectedMethod === 'upi' ? 'rgba(59, 130, 246, 0.35)' : 'rgba(255, 255, 255, 0.08)',
              cursor: 'pointer',
              border: selectedMethod === 'upi' ? '1px solid #60A5FA' : '1px solid transparent',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.15rem' }}>
              <Smartphone size={13} color="#93C5FD" />
              <span style={{ fontSize: '0.6875rem', color: '#93C5FD', fontWeight: 700 }}>UPI / QR</span>
            </div>
            <p style={{ fontSize: '0.9375rem', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>{formatCurrency(upiTotal)}</p>
          </div>

          <div
            onClick={() => setSelectedMethod(selectedMethod === 'cash' ? '' : 'cash')}
            className="card-hover"
            style={{
              padding: '0.625rem 0.75rem',
              borderRadius: '0.5rem',
              background: selectedMethod === 'cash' ? 'rgba(52, 211, 153, 0.35)' : 'rgba(255, 255, 255, 0.08)',
              cursor: 'pointer',
              border: selectedMethod === 'cash' ? '1px solid #34D399' : '1px solid transparent',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.15rem' }}>
              <Banknote size={13} color="#6EE7B7" />
              <span style={{ fontSize: '0.6875rem', color: '#6EE7B7', fontWeight: 700 }}>Cash</span>
            </div>
            <p style={{ fontSize: '0.9375rem', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>{formatCurrency(cashTotal)}</p>
          </div>

          <div
            onClick={() => setSelectedMethod(selectedMethod === 'bank_transfer' ? '' : 'bank_transfer')}
            className="card-hover"
            style={{
              padding: '0.625rem 0.75rem',
              borderRadius: '0.5rem',
              background: selectedMethod === 'bank_transfer' ? 'rgba(251, 191, 36, 0.35)' : 'rgba(255, 255, 255, 0.08)',
              cursor: 'pointer',
              border: selectedMethod === 'bank_transfer' ? '1px solid #FBBF24' : '1px solid transparent',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.15rem' }}>
              <Building size={13} color="#FDE68A" />
              <span style={{ fontSize: '0.6875rem', color: '#FDE68A', fontWeight: 700 }}>Bank / Net</span>
            </div>
            <p style={{ fontSize: '0.9375rem', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>{formatCurrency(bankTotal)}</p>
          </div>

        </div>
      </div>

      {/* FILTER CONTROLS */}
      <div
        className="card"
        style={{
          padding: '0.875rem 1rem',
          marginBottom: '1rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.625rem',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#FFFFFF',
        }}
      >
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input
            type="search"
            className="input"
            style={{ paddingLeft: 36, height: 38, fontSize: '0.8125rem' }}
            placeholder="Search tenant name, receipt #, flat, UTR ref..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <select
            className="input"
            style={{ height: 38, width: 'auto', fontSize: '0.8125rem' }}
            value={selectedMethod}
            onChange={(e) => setSelectedMethod(e.target.value)}
          >
            <option value="">All Payment Modes</option>
            <option value="upi">📱 UPI / QR</option>
            <option value="cash">💵 Cash</option>
            <option value="bank_transfer">🏦 Bank Transfer</option>
            <option value="card">💳 Card</option>
            <option value="cheque">📝 Cheque</option>
          </select>

          <input
            type="month"
            className="input"
            style={{ height: 38, width: 'auto', fontSize: '0.8125rem' }}
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          />
          {selectedMonth && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ fontSize: '0.75rem' }}
              onClick={() => setSelectedMonth('')}
            >
              Clear Month
            </button>
          )}
        </div>
      </div>

      {/* STATS STRIP */}
      <div style={{ marginBottom: '0.625rem', fontSize: '0.8125rem', color: '#64748B', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Showing {filtered.length} receipt{filtered.length !== 1 ? 's' : ''}</span>
        <button
          className="btn btn-secondary btn-sm mobile-only"
          onClick={() => setShowRecordModal(true)}
          style={{ gap: '0.25rem', fontSize: '0.75rem' }}
        >
          <Plus size={13} /> Record Payment
        </button>
      </div>

      {/* RECEIPTS LIST */}
      {isLoading ? (
        Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<DollarSign size={36} />}
          title="No payment records found"
          description={searchTerm ? `No receipts matched "${searchTerm}"` : "Recorded rent payments and receipts will appear here."}
          action={
            <button className="btn btn-primary" onClick={() => setShowRecordModal(true)}>
              <Plus size={18} /> Record First Payment
            </button>
          }
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filtered.map((p) => (
            <div
              key={p.id}
              className="card card-hover"
              onClick={() => setSelectedReceipt(p)}
              style={{
                padding: '1rem 1.125rem',
                cursor: 'pointer',
                background: '#FFFFFF',
                borderLeft: '4px solid #10B981',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.375rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#059669', background: '#ECFDF5', padding: '0.125rem 0.4rem', borderRadius: 4, border: '1px solid #A7F3D0' }}>
                      {p.receipt_number}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                      {new Date(p.billing_month + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })} Rent
                    </span>
                  </div>

                  <h3 style={{ fontWeight: 800, fontSize: '1rem', margin: '0 0 0.125rem', color: '#0F172A' }}>
                    {p.tenant_name || 'Resident'}
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: '#64748B', margin: 0 }}>
                    Flat {p.unit_number} • {p.property_name}
                  </p>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontWeight: 900, fontSize: '1.125rem', margin: '0 0 0.125rem', color: '#059669', fontVariantNumeric: 'tabular-nums' }}>
                    {formatCurrency(p.amount)}
                  </p>
                  <span style={{ fontSize: '0.6875rem', textTransform: 'uppercase', color: '#334155', fontWeight: 700, background: '#F1F5F9', padding: '0.1rem 0.35rem', borderRadius: 4 }}>
                    {p.payment_method}
                  </span>
                </div>
              </div>

              {/* Transaction details & Download button */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.625rem', paddingTop: '0.5rem', borderTop: '1px solid #F1F5F9', fontSize: '0.75rem', color: '#64748B' }}>
                <span>
                  Paid on {formatDate(p.payment_date)} {p.transaction_reference ? `• Ref: ${p.transaction_reference}` : ''}
                </span>

                <div style={{ display: 'flex', gap: '0.375rem' }} onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => generateRentReceiptPDF(p)}
                    style={{ gap: '0.25rem', padding: '0.25rem 0.5rem', height: 28, fontSize: '0.75rem', color: '#2563EB' }}
                  >
                    <Download size={13} /> PDF Receipt
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* RECORD PAYMENT MODAL */}
      <RecordPaymentModal
        isOpen={showRecordModal}
        onClose={() => setShowRecordModal(false)}
        onSuccess={() => {
          setShowRecordModal(false)
          load()
        }}
      />

      {/* RECEIPT VIEW MODAL */}
      {selectedReceipt && (
        <Modal
          isOpen={!!selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
          title={`Official Rent Receipt #${selectedReceipt.receipt_number}`}
          maxWidth="480px"
        >
          <div style={{ border: '1.5px dashed #CBD5E1', borderRadius: '0.75rem', padding: '1.25rem', background: '#F8FAFC' }}>
            <div style={{ textAlign: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.875rem', marginBottom: '0.875rem' }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#ECFDF5', color: '#059669', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem' }}>
                <CheckCircle2 size={24} />
              </div>
              <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.125rem', color: '#0F172A' }}>
                Payment Confirmed & Verified
              </h3>
              <p style={{ margin: '0.15rem 0 0', fontSize: '0.75rem', color: '#64748B' }}>
                Receipt #{selectedReceipt.receipt_number} • {selectedReceipt.property_name}
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8125rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Tenant Name:</span>
                <strong style={{ color: '#0F172A' }}>{selectedReceipt.tenant_name} (Flat {selectedReceipt.unit_number})</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Billing Month:</span>
                <strong style={{ color: '#0F172A' }}>{new Date(selectedReceipt.billing_month + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Amount Cleared:</span>
                <strong style={{ color: '#059669', fontSize: '1.125rem', fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(selectedReceipt.amount)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Payment Mode:</span>
                <strong style={{ textTransform: 'uppercase', color: '#0F172A' }}>{selectedReceipt.payment_method}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Payment Date:</span>
                <span style={{ color: '#0F172A', fontWeight: 600 }}>{formatDate(selectedReceipt.payment_date)}</span>
              </div>
              {selectedReceipt.transaction_reference && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748B' }}>Transaction Ref / UTR:</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#1E40AF' }}>{selectedReceipt.transaction_reference}</span>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setSelectedReceipt(null)}>
              Close
            </button>
            <button
              className="btn btn-primary"
              style={{ flex: 1, gap: '0.375rem' }}
              onClick={() => generateRentReceiptPDF(selectedReceipt)}
            >
              <Download size={15} /> Download PDF
            </button>
          </div>
        </Modal>
      )}
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
      success('Payment recorded & digital receipt issued successfully!')
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
