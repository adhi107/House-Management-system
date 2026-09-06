import React, { useState } from 'react'
import { rentApi } from '../../api/client'
import { RentInvoice, PaymentMethod } from '../../types'
import { useToast } from '../../contexts/ToastContext'
import { BottomSheet, formatCurrency } from '../../components/ui'
import { CheckCircle, CreditCard } from 'lucide-react'
import { AxiosError } from 'axios'

interface Props {
  invoice: RentInvoice
  onClose: () => void
  onSuccess: (receiptNumber: string) => void
}

const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: string }[] = [
  { value: 'upi', label: 'UPI', icon: '📱' },
  { value: 'cash', label: 'Cash', icon: '💵' },
  { value: 'bank_transfer', label: 'Bank Transfer', icon: '🏦' },
  { value: 'card', label: 'Card', icon: '💳' },
  { value: 'cheque', label: 'Cheque', icon: '📝' },
  { value: 'other', label: 'Other', icon: '💰' },
]

export default function PaymentSheet({ invoice, onClose, onSuccess }: Props) {
  const { success: showSuccess, error: showError } = useToast()
  const [amount, setAmount] = useState(String(invoice.pending_amount))
  const [method, setMethod] = useState<PaymentMethod>('upi')
  const [reference, setReference] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [successData, setSuccessData] = useState<{ receiptNumber: string; amount: number } | null>(null)

  const handleSubmit = async () => {
    const numAmount = parseFloat(amount)
    if (!numAmount || numAmount <= 0) { showError('Enter a valid amount'); return }
    if (numAmount > invoice.pending_amount + 0.01) { showError(`Amount cannot exceed pending balance of ${formatCurrency(invoice.pending_amount)}`); return }

    setIsLoading(true)
    try {
      const res = await rentApi.recordPayment({
        invoice_id: invoice.id,
        amount: numAmount,
        payment_method: method,
        transaction_reference: reference || undefined,
        payment_date: date,
        notes: notes || undefined,
      })
      const { receipt_number } = res.data.data
      setSuccessData({ receiptNumber: receipt_number, amount: numAmount })
    } catch (err) {
      const axiosErr = err as AxiosError<{ detail: string }>
      showError(axiosErr.response?.data?.detail || 'Failed to record payment')
    } finally {
      setIsLoading(false)
    }
  }

  if (successData) {
    return (
      <BottomSheet isOpen title="" onClose={onClose}>
        <div style={{ textAlign: 'center', padding: '1rem 0 0.5rem' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgb(var(--success-light))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', animation: 'scaleIn 0.3s ease' }}>
            <CheckCircle size={32} style={{ color: 'rgb(var(--success))' }} />
          </div>
          <h2 style={{ fontWeight: 800, fontSize: '1.25rem', margin: '0 0 0.25rem' }}>Payment Recorded!</h2>
          <p style={{ fontSize: '2rem', fontWeight: 800, color: 'rgb(var(--success))', margin: '0.5rem 0', fontVariantNumeric: 'tabular-nums' }}>
            {formatCurrency(successData.amount)}
          </p>
          <p style={{ fontSize: '0.875rem', color: 'rgb(var(--muted-foreground))', margin: '0 0 1.5rem' }}>
            Receipt #{successData.receiptNumber}
          </p>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>Done</button>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => { onSuccess(successData.receiptNumber); onClose() }}>
              View Receipt
            </button>
          </div>
        </div>
      </BottomSheet>
    )
  }

  return (
    <BottomSheet isOpen title="Record Payment" onClose={onClose}>
      {/* Invoice summary */}
      <div style={{ background: 'rgb(var(--muted))', borderRadius: 'var(--radius-md)', padding: '0.875rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
          <span style={{ fontSize: '0.875rem', color: 'rgb(var(--muted-foreground))' }}>{invoice.tenant_name}</span>
          <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Flat {invoice.unit_number}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.8125rem', color: 'rgb(var(--muted-foreground))' }}>Total Invoice</span>
          <span style={{ fontWeight: 700 }}>{formatCurrency(invoice.total_amount)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.8125rem', color: 'rgb(var(--muted-foreground))' }}>Already Paid</span>
          <span style={{ fontWeight: 600, color: 'rgb(var(--success))' }}>{formatCurrency(invoice.paid_amount)}</span>
        </div>
        <div className="divider" style={{ margin: '0.5rem 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 600 }}>Remaining</span>
          <span style={{ fontWeight: 800, fontSize: '1.125rem', color: 'rgb(var(--danger))' }}>{formatCurrency(invoice.pending_amount)}</span>
        </div>
      </div>

      {/* Amount */}
      <div className="form-group">
        <label className="input-label" htmlFor="pay-amount">Payment Amount (₹)</label>
        <input
          id="pay-amount"
          type="number"
          inputMode="decimal"
          className="input"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          style={{ fontSize: '1.25rem', fontWeight: 700 }}
        />
      </div>

      {/* Method */}
      <div className="form-group">
        <label className="input-label">Payment Method</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
          {PAYMENT_METHODS.map((m) => (
            <button
              key={m.value}
              onClick={() => setMethod(m.value)}
              style={{
                padding: '0.625rem 0.5rem', borderRadius: 'var(--radius-md)',
                border: `1.5px solid ${method === m.value ? 'rgb(var(--primary))' : 'rgb(var(--input-border))'}`,
                background: method === m.value ? 'rgb(var(--primary-light))' : 'rgb(var(--input))',
                cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s ease',
                color: method === m.value ? 'rgb(var(--primary))' : 'rgb(var(--foreground))',
                fontWeight: method === m.value ? 600 : 400,
                fontSize: '0.8125rem',
              }}
            >
              <div style={{ fontSize: '1.25rem', marginBottom: '0.125rem' }}>{m.icon}</div>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Reference */}
      <div className="form-group">
        <label className="input-label" htmlFor="pay-ref">Transaction Reference (optional)</label>
        <input
          id="pay-ref"
          type="text"
          className="input"
          placeholder="UPI ID, cheque no..."
          value={reference}
          onChange={(e) => setReference(e.target.value)}
        />
      </div>

      {/* Date */}
      <div className="form-group">
        <label className="input-label" htmlFor="pay-date">Payment Date</label>
        <input id="pay-date" type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      <button
        className="btn btn-primary btn-full btn-lg"
        onClick={handleSubmit}
        disabled={isLoading}
        style={{ marginTop: '0.5rem' }}
      >
        {isLoading ? 'Recording...' : (
          <><CreditCard size={20} /> Confirm Payment</>
        )}
      </button>
    </BottomSheet>
  )
}
