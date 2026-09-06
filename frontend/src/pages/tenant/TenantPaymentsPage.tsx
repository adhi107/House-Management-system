import React, { useState, useEffect } from 'react'
import { rentApi } from '../../api/client'
import { Payment } from '../../types'
import { MobilePage } from '../../components/layout/AppShell'
import { MobileHeader } from '../../components/navigation'
import { formatCurrency, formatDate, EmptyState, ErrorState, SkeletonCard, StatusBadge, Modal } from '../../components/ui'
import { DollarSign, Download, Receipt, CheckCircle, CreditCard, Calendar, FileText, ArrowUpRight } from 'lucide-react'

export default function TenantPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [selectedReceipt, setSelectedReceipt] = useState<Payment | null>(null)

  const loadData = async () => {
    setIsLoading(true)
    setHasError(false)
    try {
      const res = await rentApi.listPayments()
      setPayments(res.data.data || [])
    } catch {
      setHasError(true)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0)

  return (
    <MobilePage role="tenant" header={<MobileHeader title="Payment History & Receipts" showBack />}>
      {/* Desktop Header */}
      <div className="module-header hidden-mobile">
        <div className="module-header-info">
          <h1 className="module-header-title">Payment History & Receipts</h1>
          <p className="module-header-subtitle">
            View all confirmed rent payments, payment transaction records, and official digital receipts
          </p>
        </div>
      </div>

      {/* Summary Banner */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #065F46 100%)',
          color: 'white',
          padding: '1.25rem 1.5rem',
          borderRadius: 'var(--radius-xl)',
          marginBottom: '1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: '0 8px 24px -4px rgba(15, 23, 42, 0.25)',
        }}
      >
        <div>
          <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#A7F3D0', fontWeight: 700, margin: 0 }}>
            Total Paid To Date
          </p>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0.25rem 0 0', color: 'white', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
            {formatCurrency(totalPaid)}
          </h2>
        </div>

        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '0.6875rem', color: '#94A3B8', margin: 0 }}>Total Receipts</p>
            <p style={{ fontSize: '1.125rem', fontWeight: 800, color: 'white', margin: 0 }}>{payments.length}</p>
          </div>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(255, 255, 255, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Receipt size={22} color="white" />
          </div>
        </div>
      </div>

      {/* Payments List */}
      <div className="cards-grid">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
        ) : hasError ? (
          <ErrorState onRetry={loadData} />
        ) : payments.length === 0 ? (
          <div style={{ gridColumn: '1 / -1' }}>
            <EmptyState
              icon={<Receipt size={32} />}
              title="No payment records found"
              description="Your confirmed payments and digital receipts will appear here automatically."
            />
          </div>
        ) : (
          payments.map((payment) => (
            <div
              key={payment.id}
              className="card card-hover"
              style={{
                padding: '1rem 1.125rem',
                borderLeft: '3.5px solid #10B981',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '0.75rem',
                background: '#FFFFFF',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <div>
                    <h4 style={{ fontWeight: 800, fontSize: '0.9375rem', margin: 0, color: '#0F172A' }}>
                      {new Date(payment.billing_month + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })} Rent
                    </h4>
                    <p style={{ fontSize: '0.6875rem', color: '#64748B', margin: '0.15rem 0 0' }}>
                      Receipt: <strong style={{ color: '#0F172A' }}>#{payment.receipt_number}</strong>
                    </p>
                  </div>
                  <span
                    style={{
                      fontSize: '0.625rem',
                      fontWeight: 800,
                      padding: '0.15rem 0.5rem',
                      borderRadius: 'var(--radius-full)',
                      background: '#ECFDF5',
                      color: '#059669',
                      border: '1px solid #A7F3D0',
                      textTransform: 'uppercase',
                    }}
                  >
                    ✓ Paid
                  </span>
                </div>

                <div style={{ marginTop: '0.75rem', background: '#F8FAFC', padding: '0.625rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid #F1F5F9' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.6875rem', color: '#64748B', fontWeight: 600 }}>Amount Paid</span>
                    <span style={{ fontSize: '1.0625rem', fontWeight: 800, color: '#0F172A', fontVariantNumeric: 'tabular-nums' }}>
                      {formatCurrency(payment.amount)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.6875rem', color: '#64748B' }}>
                    <span>Payment Mode</span>
                    <span style={{ fontWeight: 700, color: '#334155', textTransform: 'uppercase' }}>{payment.payment_method}</span>
                  </div>
                  {payment.transaction_reference && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.6875rem', color: '#64748B', marginTop: '0.15rem' }}>
                      <span>Ref / UTR</span>
                      <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#0F172A' }}>{payment.transaction_reference}</span>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F1F5F9', paddingTop: '0.625rem' }}>
                <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>{formatDate(payment.payment_date)}</span>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ gap: '0.25rem', fontSize: '0.75rem', height: 28 }}
                  onClick={() => setSelectedReceipt(payment)}
                >
                  <Receipt size={13} /> View Receipt
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Digital Receipt Modal */}
      {selectedReceipt && (
        <Modal
          isOpen={!!selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
          title="Rent Payment Receipt"
          maxWidth="460px"
        >
          <div style={{ border: '1.5px dashed #CBD5E1', borderRadius: 'var(--radius-lg)', padding: '1.25rem', background: '#F8FAFC' }}>
            <div style={{ textAlign: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.875rem', marginBottom: '0.875rem' }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#ECFDF5', color: '#059669', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem' }}>
                <CheckCircle size={24} />
              </div>
              <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.125rem', color: '#0F172A' }}>
                Payment Confirmed
              </h3>
              <p style={{ margin: '0.15rem 0 0', fontSize: '0.75rem', color: '#64748B' }}>
                Official Digital Rent Receipt #{selectedReceipt.receipt_number}
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8125rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Billing Month:</span>
                <strong style={{ color: '#0F172A' }}>{new Date(selectedReceipt.billing_month + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Amount Paid:</span>
                <strong style={{ color: '#059669', fontSize: '1.125rem', fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(selectedReceipt.amount)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Payment Method:</span>
                <strong style={{ textTransform: 'uppercase', color: '#0F172A' }}>{selectedReceipt.payment_method}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Payment Date:</span>
                <span style={{ color: '#0F172A', fontWeight: 600 }}>{formatDate(selectedReceipt.payment_date)}</span>
              </div>
              {selectedReceipt.transaction_reference && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748B' }}>Transaction Ref:</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#0F172A' }}>{selectedReceipt.transaction_reference}</span>
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
              onClick={() => window.print()}
            >
              <Download size={15} /> Print / Download
            </button>
          </div>
        </Modal>
      )}
    </MobilePage>
  )
}
