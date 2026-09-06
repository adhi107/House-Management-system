import React, { useState } from 'react'
import {
  FileText,
  CreditCard,
  User,
  Building2,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Download,
  Trash2,
  Edit3,
  Bell,
  Phone,
  MessageSquare,
  ShieldCheck,
  XCircle,
  Plus,
  Receipt,
  ArrowUpRight,
  Eye,
} from 'lucide-react'
import { RentInvoice, Payment } from '../../types'
import { rentApi } from '../../api/client'
import { formatCurrency, formatDate, StatusBadge, Modal } from '../../components/ui'
import { useToast } from '../../contexts/ToastContext'
import { generateRentReceiptPDF } from '../../utils/pdfReceipt'

interface InvoiceDetailModalProps {
  invoice: RentInvoice | null
  isOpen: boolean
  onClose: () => void
  onRefresh: () => void
  onRecordPayment: (invoice: RentInvoice) => void
}

export default function InvoiceDetailModal({
  invoice,
  isOpen,
  onClose,
  onRefresh,
  onRecordPayment,
}: InvoiceDetailModalProps) {
  const { success, error, info } = useToast()
  const [isVerifying, setIsVerifying] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)
  const [showRejectPrompt, setShowRejectPrompt] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [showEditCharges, setShowEditCharges] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  // Edit fields
  const [editRent, setEditRent] = useState('')
  const [editMaint, setEditMaint] = useState('')
  const [editUtil, setEditUtil] = useState('')
  const [editDisc, setEditDisc] = useState('')
  const [editDueDate, setEditDueDate] = useState('')
  const [editNotes, setEditNotes] = useState('')

  if (!isOpen || !invoice) return null

  const isUnderReview = invoice.status === 'under_review' || invoice.payment_claimed
  const isPaid = invoice.status === 'paid'
  const isOverdue = invoice.status === 'overdue'

  const handleApproveClaim = async () => {
    setIsVerifying(true)
    try {
      await rentApi.verifyPayment(invoice.id, {
        approved: true,
        verified_amount: invoice.claimed_payment?.amount || invoice.pending_amount,
      })
      success(`Payment approved & official receipt generated for ${invoice.tenant_name || 'Tenant'}!`)
      onRefresh()
      onClose()
    } catch (err: any) {
      error(err?.response?.data?.detail || 'Failed to verify payment claim')
    } finally {
      setIsVerifying(false)
    }
  }

  const handleRejectClaim = async () => {
    setIsRejecting(true)
    try {
      await rentApi.verifyPayment(invoice.id, {
        approved: false,
        rejection_reason: rejectionReason.trim() || 'Payment not matched in bank statement',
      })
      info('Payment claim rejected. Tenant has been notified.')
      setShowRejectPrompt(false)
      onRefresh()
      onClose()
    } catch (err: any) {
      error(err?.response?.data?.detail || 'Failed to reject payment claim')
    } finally {
      setIsRejecting(false)
    }
  }

  const handleSendReminder = async () => {
    try {
      await rentApi.sendReminders({ invoice_ids: [invoice.id] })
      success(`Rent payment reminder sent to ${invoice.tenant_name || 'Resident'}!`)
    } catch {
      error('Failed to send reminder notification')
    }
  }

  const openEditModal = () => {
    setEditRent(String(invoice.rent_amount || 0))
    setEditMaint(String(invoice.maintenance_amount || 0))
    setEditUtil(String(invoice.utility_amount || 0))
    setEditDisc(String(invoice.discount || 0))
    setEditDueDate(invoice.due_date || '')
    setEditNotes(invoice.notes || '')
    setShowEditCharges(true)
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUpdating(true)
    try {
      await rentApi.updateInvoice(invoice.id, {
        rent_amount: parseFloat(editRent) || 0,
        maintenance_amount: parseFloat(editMaint) || 0,
        utility_amount: parseFloat(editUtil) || 0,
        discount: parseFloat(editDisc) || 0,
        due_date: editDueDate || undefined,
        notes: editNotes.trim() || undefined,
      })
      success('Invoice charges updated successfully!')
      setShowEditCharges(false)
      onRefresh()
    } catch (err: any) {
      error(err?.response?.data?.detail || 'Failed to update invoice charges')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteInvoice = async () => {
    if (!confirm(`Are you sure you want to delete invoice ${invoice.invoice_number}?`)) return
    try {
      await rentApi.deleteInvoice(invoice.id)
      success('Invoice deleted successfully')
      onRefresh()
      onClose()
    } catch (err: any) {
      error(err?.response?.data?.detail || 'Cannot delete invoice')
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Rent Invoice #${invoice.invoice_number}`}
      maxWidth="620px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        
        {/* Top Header Card with Status Badge */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            padding: '1.125rem',
            borderRadius: '0.75rem',
            background: isPaid ? '#ECFDF5' : isUnderReview ? '#FFFBEB' : isOverdue ? '#FEF2F2' : '#F8FAFC',
            border: `1px solid ${isPaid ? '#A7F3D0' : isUnderReview ? '#FDE68A' : isOverdue ? '#FECACA' : '#E2E8F0'}`,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '0.6875rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748B' }}>
                {new Date(invoice.billing_month + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })} Cycle
              </span>
              <StatusBadge status={invoice.status} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0, color: '#0F172A' }}>
              {invoice.tenant_name || 'Resident'}
            </h3>
            <p style={{ fontSize: '0.8125rem', color: '#64748B', margin: '0.15rem 0 0' }}>
              Flat {invoice.unit_number} • {invoice.property_name || 'Property'}
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '0.6875rem', color: '#64748B', margin: 0, fontWeight: 600 }}>Total Due</p>
            <p style={{ fontSize: '1.375rem', fontWeight: 900, margin: 0, color: isPaid ? '#059669' : '#0F172A', fontVariantNumeric: 'tabular-nums' }}>
              {formatCurrency(invoice.total_amount)}
            </p>
            <p style={{ fontSize: '0.6875rem', color: isOverdue ? '#DC2626' : '#64748B', margin: '0.15rem 0 0', fontWeight: 600 }}>
              Due on {formatDate(invoice.due_date)}
            </p>
          </div>
        </div>

        {/* TENANT PAYMENT CLAIM REVIEW BOX (If under review) */}
        {isUnderReview && invoice.claimed_payment && (
          <div
            style={{
              padding: '1.125rem',
              borderRadius: '0.75rem',
              background: '#FEF3C7',
              border: '1.5px solid #F59E0B',
              boxShadow: '0 4px 12px rgba(245, 158, 11, 0.15)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.625rem' }}>
              <Clock size={18} color="#B45309" />
              <h4 style={{ fontWeight: 800, fontSize: '0.9375rem', margin: 0, color: '#92400E' }}>
                Tenant Reported Payment — Verification Required
              </h4>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem', fontSize: '0.8125rem', marginBottom: '0.875rem', background: '#FFFFFF', padding: '0.75rem', borderRadius: '0.5rem' }}>
              <div>
                <span style={{ color: '#64748B', fontSize: '0.75rem' }}>Claimed Amount:</span>
                <p style={{ fontWeight: 800, fontSize: '1.0625rem', color: '#059669', margin: 0 }}>
                  {formatCurrency(invoice.claimed_payment.amount || invoice.pending_amount)}
                </p>
              </div>
              <div>
                <span style={{ color: '#64748B', fontSize: '0.75rem' }}>Payment Mode:</span>
                <p style={{ fontWeight: 700, margin: 0, textTransform: 'uppercase', color: '#0F172A' }}>
                  {invoice.claimed_payment.payment_method}
                </p>
              </div>
              <div>
                <span style={{ color: '#64748B', fontSize: '0.75rem' }}>Transaction / UTR Ref:</span>
                <p style={{ fontFamily: 'monospace', fontWeight: 700, color: '#1E40AF', margin: 0 }}>
                  {invoice.claimed_payment.transaction_reference || 'Not provided'}
                </p>
              </div>
              <div>
                <span style={{ color: '#64748B', fontSize: '0.75rem' }}>Payment Date:</span>
                <p style={{ fontWeight: 600, color: '#0F172A', margin: 0 }}>
                  {formatDate(invoice.claimed_payment.payment_date)}
                </p>
              </div>
              {invoice.claimed_payment.notes && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <span style={{ color: '#64748B', fontSize: '0.75rem' }}>Tenant Notes:</span>
                  <p style={{ margin: 0, color: '#334155', fontStyle: 'italic' }}>"{invoice.claimed_payment.notes}"</p>
                </div>
              )}
              {invoice.claimed_payment.proof_url && (
                <div style={{ gridColumn: '1 / -1', marginTop: '0.25rem', paddingTop: '0.5rem', borderTop: '1px dashed #CBD5E1' }}>
                  <span style={{ color: '#64748B', fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '0.35rem' }}>
                    Attached Payment Proof / Screenshot:
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <a
                      href={
                        invoice.claimed_payment.proof_url.startsWith('http') || invoice.claimed_payment.proof_url.startsWith('data:')
                          ? invoice.claimed_payment.proof_url
                          : `http://localhost:8000${invoice.claimed_payment.proof_url}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                        padding: '0.4rem 0.75rem',
                        background: '#EFF6FF',
                        color: '#1D4ED8',
                        borderRadius: '0.5rem',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        textDecoration: 'none',
                        border: '1px solid #BFDBFE',
                      }}
                    >
                      <Eye size={14} /> View Full Screenshot / Receipt ↗
                    </a>
                  </div>
                </div>
              )}
            </div>

            {!showRejectPrompt ? (
              <div style={{ display: 'flex', gap: '0.625rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ color: '#DC2626', borderColor: '#FECACA' }}
                  onClick={() => setShowRejectPrompt(true)}
                  disabled={isVerifying}
                >
                  <XCircle size={14} /> Reject Claim
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  style={{ flex: 1, backgroundColor: '#059669', borderColor: '#059669', gap: '0.375rem', fontWeight: 700 }}
                  onClick={handleApproveClaim}
                  disabled={isVerifying}
                >
                  <ShieldCheck size={16} />
                  {isVerifying ? 'Verifying...' : 'Approve & Generate Receipt'}
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: '#FFFFFF', padding: '0.75rem', borderRadius: '0.5rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#DC2626' }}>
                  Reason for Rejection:
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Transaction ID not found in bank statement"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowRejectPrompt(false)}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={handleRejectClaim}
                    disabled={isRejecting}
                  >
                    {isRejecting ? 'Rejecting...' : 'Confirm Rejection'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Itemized Charges Breakdown */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <h4 style={{ fontWeight: 800, fontSize: '0.875rem', color: '#0F172A', margin: 0 }}>
              Line-Item Fee Breakdown
            </h4>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ fontSize: '0.75rem', color: '#2563EB', padding: '0.125rem 0.375rem', height: 24 }}
              onClick={openEditModal}
            >
              <Edit3 size={12} /> Edit Charges
            </button>
          </div>

          <div style={{ background: '#F8FAFC', borderRadius: '0.5rem', border: '1px solid #E2E8F0', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.375rem', fontSize: '0.8125rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748B' }}>Monthly Unit Rent:</span>
              <strong style={{ color: '#0F172A' }}>{formatCurrency(invoice.rent_amount)}</strong>
            </div>
            {invoice.maintenance_amount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Maintenance & Amenities:</span>
                <strong style={{ color: '#0F172A' }}>+{formatCurrency(invoice.maintenance_amount)}</strong>
              </div>
            )}
            {invoice.utility_amount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Utility / Electricity Surcharge:</span>
                <strong style={{ color: '#0F172A' }}>+{formatCurrency(invoice.utility_amount)}</strong>
              </div>
            )}
            {invoice.other_charges > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Other Charges:</span>
                <strong style={{ color: '#0F172A' }}>+{formatCurrency(invoice.other_charges)}</strong>
              </div>
            )}
            {invoice.discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669' }}>
                <span>Concession / Discount:</span>
                <strong>-{formatCurrency(invoice.discount)}</strong>
              </div>
            )}

            <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '0.375rem', marginTop: '0.25rem', display: 'flex', justifyContent: 'space-between', fontWeight: 800 }}>
              <span style={{ color: '#0F172A' }}>Total Invoice Amount:</span>
              <span style={{ color: '#0F172A', fontSize: '0.9375rem' }}>{formatCurrency(invoice.total_amount)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
              <span style={{ color: '#059669' }}>Total Paid:</span>
              <strong style={{ color: '#059669' }}>{formatCurrency(invoice.paid_amount)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: '#DC2626', fontWeight: 700 }}>
              <span>Balance Pending:</span>
              <span>{formatCurrency(invoice.pending_amount)}</span>
            </div>
          </div>
        </div>

        {/* Tenant Contact & Actions */}
        <div style={{ background: '#F8FAFC', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: '0.75rem', color: '#64748B', margin: 0, fontWeight: 600 }}>Tenant Contact</p>
            <p style={{ fontSize: '0.875rem', fontWeight: 700, margin: '0.1rem 0 0', color: '#0F172A' }}>
              {invoice.tenant_phone || 'No phone recorded'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.375rem' }}>
            {invoice.tenant_phone && (
              <>
                <a
                  href={`tel:${invoice.tenant_phone}`}
                  className="btn btn-secondary btn-sm"
                  style={{ gap: '0.25rem', fontSize: '0.75rem' }}
                >
                  <Phone size={13} /> Call
                </a>
                <a
                  href={`https://wa.me/91${invoice.tenant_phone.replace(/\D/g, '')}?text=Hi%20${encodeURIComponent(invoice.tenant_name || '')},%20this%20is%20a%20reminder%20for%20your%20rent%20invoice%20${invoice.invoice_number}%20amounting%20to%20${formatCurrency(invoice.pending_amount)}.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-sm"
                  style={{ gap: '0.25rem', fontSize: '0.75rem', color: '#059669' }}
                >
                  <MessageSquare size={13} /> WhatsApp
                </a>
              </>
            )}
            {!isPaid && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ gap: '0.25rem', fontSize: '0.75rem' }}
                onClick={handleSendReminder}
              >
                <Bell size={13} /> Send Alert
              </button>
            )}
          </div>
        </div>

        {/* Recorded Payments History */}
        {invoice.payments && invoice.payments.length > 0 && (
          <div>
            <h4 style={{ fontWeight: 800, fontSize: '0.875rem', color: '#0F172A', margin: '0 0 0.5rem' }}>
              Recorded Transactions ({invoice.payments.length})
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {invoice.payments.map((p) => (
                <div
                  key={p.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.625rem 0.75rem',
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '0.5rem',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#2563EB', background: '#EFF6FF', padding: '0.1rem 0.35rem', borderRadius: 4 }}>
                      {p.receipt_number}
                    </span>
                    <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '0.2rem 0 0' }}>
                      Paid on {formatDate(p.payment_date)} • {p.payment_method?.toUpperCase()}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.9375rem', color: '#059669', fontVariantNumeric: 'tabular-nums' }}>
                      {formatCurrency(p.amount)}
                    </span>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => generateRentReceiptPDF({
                        ...p,
                        tenant_name: invoice.tenant_name,
                        unit_number: invoice.unit_number,
                        property_name: invoice.property_name,
                        billing_month: invoice.billing_month,
                      })}
                      style={{ padding: '0.2rem 0.4rem', height: 26, fontSize: '0.75rem', color: '#2563EB' }}
                      title="Download PDF Receipt"
                    >
                      <Download size={14} /> PDF
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F1F5F9', paddingTop: '1rem', marginTop: '0.5rem' }}>
          <div>
            {invoice.paid_amount === 0 && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                style={{ color: '#EF4444', gap: '0.25rem', fontSize: '0.75rem' }}
                onClick={handleDeleteInvoice}
              >
                <Trash2 size={13} /> Cancel Invoice
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
            {!isPaid && (
              <button
                type="button"
                className="btn btn-primary"
                style={{ gap: '0.375rem' }}
                onClick={() => {
                  onClose()
                  onRecordPayment(invoice)
                }}
              >
                <Plus size={15} /> Record Payment
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Edit Charges Modal */}
      {showEditCharges && (
        <Modal
          isOpen={showEditCharges}
          onClose={() => setShowEditCharges(false)}
          title="Edit Invoice Charges & Discounts"
          maxWidth="460px"
        >
          <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <div className="form-group">
              <label className="input-label">Base Rent Amount (₹)</label>
              <input
                type="number"
                min="0"
                className="input"
                value={editRent}
                onChange={(e) => setEditRent(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="input-label">Maintenance (₹)</label>
                <input
                  type="number"
                  min="0"
                  className="input"
                  value={editMaint}
                  onChange={(e) => setEditMaint(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="input-label">Utility Surcharge (₹)</label>
                <input
                  type="number"
                  min="0"
                  className="input"
                  value={editUtil}
                  onChange={(e) => setEditUtil(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="input-label">Concession / Discount (₹)</label>
                <input
                  type="number"
                  min="0"
                  className="input"
                  value={editDisc}
                  onChange={(e) => setEditDisc(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="input-label">Due Date</label>
                <input
                  type="date"
                  className="input"
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="input-label">Invoice Notes</label>
              <input
                type="text"
                className="input"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="e.g. Utility adjustment added"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowEditCharges(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={isUpdating}>
                {isUpdating ? 'Saving...' : 'Save Adjustments'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </Modal>
  )
}
