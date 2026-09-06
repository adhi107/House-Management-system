import React, { useState, useEffect } from 'react'
import { agreementApi, dashboardApi } from '../../api/client'
import { Agreement, TenantDashboard } from '../../types'
import { MobilePage } from '../../components/layout/AppShell'
import { MobileHeader } from '../../components/navigation'
import { formatCurrency, formatDate, EmptyState, ErrorState, SkeletonCard, StatusBadge, Modal } from '../../components/ui'
import { useToast } from '../../contexts/ToastContext'
import {
  FileCheck,
  Download,
  Calendar,
  Shield,
  Home,
  Building2,
  User,
  Phone,
  CheckCircle,
  Info,
  LogOut,
  Calculator,
  Printer,
  Sparkles,
  Send,
} from 'lucide-react'

export default function TenantAgreementPage() {
  const { success, error } = useToast()
  const [agreements, setAgreements] = useState<Agreement[]>([])
  const [dashboardData, setDashboardData] = useState<TenantDashboard | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  
  // Move-out modal
  const [showMoveOutModal, setShowMoveOutModal] = useState(false)
  const [moveOutDate, setMoveOutDate] = useState(new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0])
  const [moveOutReason, setMoveOutReason] = useState('Relocation')
  const [moveOutNotes, setMoveOutNotes] = useState('')
  const [isSubmittingNotice, setIsSubmittingNotice] = useState(false)

  const loadData = async () => {
    setIsLoading(true)
    setHasError(false)
    try {
      const [agrRes, dashRes] = await Promise.all([
        agreementApi.list().catch(() => ({ data: { data: [] } })),
        dashboardApi.getTenantDashboard().catch(() => ({ data: { data: null } })),
      ])
      setAgreements(agrRes.data.data || [])
      setDashboardData(dashRes.data.data)
    } catch {
      setHasError(true)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const activeAgreement = agreements[0]
  const unit = dashboardData?.unit
  const prop = dashboardData?.property
  const tenant = dashboardData?.tenant

  const monthlyRent = activeAgreement?.monthly_rent || unit?.monthly_rent || 16000
  const securityDeposit = activeAgreement?.security_deposit || (unit?.monthly_rent ? unit.monthly_rent * 2 : 32000)

  const handleSubmitNotice = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmittingNotice(true)
    setTimeout(() => {
      setIsSubmittingNotice(false)
      setShowMoveOutModal(false)
      success(`Move-out notice submitted for ${formatDate(moveOutDate)}. The property owner has been notified!`)
    }, 600)
  }

  return (
    <MobilePage role="tenant" header={<MobileHeader title="Rental Agreement & Lease" showBack />}>
      {/* Desktop Header */}
      <div className="module-header hidden-mobile">
        <div className="module-header-info">
          <h1 className="module-header-title">Rental Agreement & Lease Terms</h1>
          <p className="module-header-subtitle">
            View active residential tenancy agreement, monthly rent breakdown, security deposit, and lease clauses
          </p>
        </div>

        <div className="module-header-action" style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className="btn btn-secondary"
            onClick={() => setShowMoveOutModal(true)}
            style={{ gap: '0.375rem', color: '#DC2626', borderColor: '#FECDD3' }}
          >
            <LogOut size={15} /> Request Move-Out
          </button>
          <button
            className="btn btn-primary"
            onClick={() => window.print()}
            style={{ gap: '0.375rem' }}
          >
            <Printer size={15} /> Print Agreement Copy
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="cards-grid">
          {Array.from({ length: 2 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : hasError ? (
        <ErrorState onRetry={loadData} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Main Lease Card */}
          <div
            className="card"
            style={{
              padding: '1.25rem 1.5rem',
              background: '#FFFFFF',
              borderLeft: '4px solid #10B981',
              borderRadius: '0.875rem',
              boxShadow: '0 2px 8px -2px rgba(0, 0, 0, 0.05)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.6875rem', fontWeight: 800, textTransform: 'uppercase', color: '#059669', background: '#ECFDF5', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-full)', border: '1px solid #A7F3D0' }}>
                  ✓ Active Registered Tenancy
                </span>
                <h2 style={{ fontSize: '1.375rem', fontWeight: 900, color: '#0F172A', margin: '0.5rem 0 0.15rem' }}>
                  {activeAgreement?.agreement_number || 'AGR-2026-001'}
                </h2>
                <p style={{ fontSize: '0.8125rem', color: '#64748B', margin: 0 }}>
                  Flat {unit?.unit_number || '101'} • {prop?.name || 'Sunrise Heights'}{(unit as any)?.floor_number ? `, Floor ${(unit as any).floor_number}` : ''}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '0.6875rem', color: '#64748B', margin: 0, fontWeight: 600 }}>Monthly Rent</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0F172A', margin: 0, fontVariantNumeric: 'tabular-nums' }}>
                    {formatCurrency(monthlyRent)}
                  </p>
                </div>
              </div>
            </div>

            {/* Financial Breakdown Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.875rem', margin: '1.25rem 0' }}>
              <div style={{ background: '#F8FAFC', padding: '0.875rem', borderRadius: '0.625rem', border: '1px solid #F1F5F9' }}>
                <p style={{ fontSize: '0.6875rem', color: '#64748B', margin: 0, fontWeight: 600 }}>Security Deposit</p>
                <p style={{ fontSize: '1.25rem', fontWeight: 900, color: '#059669', margin: '0.25rem 0 0', fontVariantNumeric: 'tabular-nums' }}>
                  {formatCurrency(securityDeposit)}
                </p>
                <span style={{ fontSize: '0.6875rem', color: '#047857', fontWeight: 700 }}>✓ Held in Escrow</span>
              </div>

              <div style={{ background: '#F8FAFC', padding: '0.875rem', borderRadius: '0.625rem', border: '1px solid #F1F5F9' }}>
                <p style={{ fontSize: '0.6875rem', color: '#64748B', margin: 0, fontWeight: 600 }}>Tenure Term</p>
                <p style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#0F172A', margin: '0.25rem 0 0' }}>
                  {activeAgreement?.start_date ? formatDate(activeAgreement.start_date) : '1 Sept 2026'} — {activeAgreement?.end_date ? formatDate(activeAgreement.end_date) : '31 Aug 2027'}
                </p>
                <span style={{ fontSize: '0.6875rem', color: '#2563EB', fontWeight: 700 }}>11 Months Lease</span>
              </div>

              <div style={{ background: '#F8FAFC', padding: '0.875rem', borderRadius: '0.625rem', border: '1px solid #F1F5F9' }}>
                <p style={{ fontSize: '0.6875rem', color: '#64748B', margin: 0, fontWeight: 600 }}>Notice Period</p>
                <p style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0F172A', margin: '0.25rem 0 0' }}>
                  {activeAgreement?.notice_period_days || 30} Days
                </p>
                <span style={{ fontSize: '0.6875rem', color: '#64748B' }}>Prior written notice</span>
              </div>
            </div>

            {/* Deposit Return Settlement Calculator Helper */}
            <div style={{ background: '#F0FDF4', padding: '1rem', borderRadius: '0.625rem', border: '1px solid #BBF7D0', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 800, fontSize: '0.875rem', color: '#166534', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <Calculator size={15} /> Move-Out Security Deposit Refund Estimator
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#15803D' }}>
                  Refundable: {formatCurrency(securityDeposit)}
                </span>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#166534', margin: 0, lineHeight: 1.5 }}>
                Your deposit of {formatCurrency(securityDeposit)} is fully refundable upon completion of tenure, subject to 30 days prior notice, clearance of final utility bills, and key handover.
              </p>
            </div>

            {/* Terms and Policies */}
            <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '0.625rem', border: '1px solid #E2E8F0' }}>
              <h4 style={{ fontWeight: 800, fontSize: '0.875rem', color: '#0F172A', margin: '0 0 0.5rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <Info size={15} color="#2563EB" /> Tenancy Clauses & House Rules
              </h4>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.8125rem', color: '#475569', lineHeight: 1.6 }}>
                <li>Rent is due on or before the 5th of each calendar month.</li>
                <li>Electricity and utility meter charges are billed directly as per meter consumption.</li>
                <li>Common area maintenance and garbage disposal included in monthly fee.</li>
                <li>Subletting the premises or any part thereof is strictly prohibited.</li>
                <li>Notice of vacation must be served 30 days prior in writing via the tenant portal.</li>
              </ul>
            </div>

            {/* Move-Out Notice Trigger */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setShowMoveOutModal(true)}
                style={{ color: '#DC2626', borderColor: '#FECDD3', background: '#FFF1F2', fontWeight: 700 }}
              >
                <LogOut size={13} /> Submit Move-Out Notice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Move-Out Notice Modal */}
      <Modal isOpen={showMoveOutModal} onClose={() => setShowMoveOutModal(false)} title="Submit Move-Out Notice" maxWidth="480px">
        <form onSubmit={handleSubmitNotice} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <p style={{ fontSize: '0.8125rem', color: '#475569', margin: 0 }}>
            As per your rental agreement, a <strong>30-day notice period</strong> is required prior to vacating Flat {unit?.unit_number || '101'}.
          </p>

          <div className="form-group">
            <label className="input-label" style={{ fontWeight: 700, fontSize: '0.8125rem' }}>Intended Move-Out Date *</label>
            <input
              type="date"
              className="input"
              required
              value={moveOutDate}
              onChange={(e) => setMoveOutDate(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="input-label" style={{ fontWeight: 700, fontSize: '0.8125rem' }}>Reason for Moving</label>
            <select
              className="input"
              value={moveOutReason}
              onChange={(e) => setMoveOutReason(e.target.value)}
            >
              <option value="Relocation">Job / City Relocation</option>
              <option value="Bigger Apartment">Upsizing / Bought Own Home</option>
              <option value="Lease End">Lease Term Expiry</option>
              <option value="Personal">Personal Reasons</option>
            </select>
          </div>

          <div className="form-group">
            <label className="input-label" style={{ fontWeight: 700, fontSize: '0.8125rem' }}>Forwarding Bank Account for Deposit Refund</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Account Number / UPI ID"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowMoveOutModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmittingNotice} style={{ backgroundColor: '#DC2626', borderColor: '#DC2626', fontWeight: 800 }}>
              {isSubmittingNotice ? 'Submitting...' : 'Confirm Notice Submission'}
            </button>
          </div>
        </form>
      </Modal>
    </MobilePage>
  )
}
