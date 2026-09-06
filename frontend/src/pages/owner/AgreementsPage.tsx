import React, { useState, useEffect, useMemo } from 'react'
import { agreementApi, propertyApi, tenantApi, unitApi } from '../../api/client'
import { Agreement, Property, Tenant, Unit } from '../../types'
import { MobilePage } from '../../components/layout/AppShell'
import { MobileHeader } from '../../components/navigation'
import { formatCurrency, formatDate, EmptyState, SkeletonCard, StatusBadge, Modal } from '../../components/ui'
import {
  FileCheck,
  Plus,
  Calendar,
  User,
  Home,
  AlertTriangle,
  RefreshCw,
  Printer,
  ShieldAlert,
  Search,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  Clock,
  Download,
  Building2,
  ShieldCheck,
  Calculator,
} from 'lucide-react'
import { useToast } from '../../contexts/ToastContext'
import { AxiosError } from 'axios'

export default function AgreementsPage() {
  const { success, error: showError } = useToast()
  const [agreements, setAgreements] = useState<Agreement[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false)
  const [renewingAgreement, setRenewingAgreement] = useState<Agreement | null>(null)
  const [viewingAgreement, setViewingAgreement] = useState<Agreement | null>(null)
  const [settlingAgreement, setSettlingAgreement] = useState<Agreement | null>(null)

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expiring' | 'terminated'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const load = async () => {
    setIsLoading(true)
    try {
      const [agrRes, propRes] = await Promise.all([
        agreementApi.list({}),
        propertyApi.list(),
      ])
      setAgreements(agrRes.data.data || [])
      setProperties(propRes.data.data || [])
    } catch {
      showError('Failed to load rental agreements')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  // BI Metrics
  const biMetrics = useMemo(() => {
    const now = new Date()
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(now.getDate() + 30)

    let activeCount = 0
    let expiringCount = 0
    let totalDeposits = 0
    let totalMonthlyRental = 0

    agreements.forEach((a) => {
      const endDate = new Date(a.end_date)
      const isExpiringSoon = a.status === 'active' && endDate <= thirtyDaysFromNow && endDate >= now

      if (a.status === 'active') {
        activeCount++
        totalDeposits += a.security_deposit || 0
        totalMonthlyRental += a.monthly_rent || 0
      }
      if (isExpiringSoon || a.status === 'expiring') {
        expiringCount++
      }
    })

    return {
      activeCount,
      expiringCount,
      totalDeposits,
      totalMonthlyRental,
      totalAgreements: agreements.length,
    }
  }, [agreements])

  // Filtered agreements
  const filteredAgreements = useMemo(() => {
    return agreements.filter((a) => {
      if (statusFilter !== 'all') {
        if (statusFilter === 'expiring') {
          const now = new Date()
          const thirtyDays = new Date()
          thirtyDays.setDate(now.getDate() + 30)
          const end = new Date(a.end_date)
          const isSoon = a.status === 'active' && end <= thirtyDays && end >= now
          if (a.status !== 'expiring' && !isSoon) return false
        } else if (a.status !== statusFilter) {
          return false
        }
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchTenant = a.tenant_name?.toLowerCase().includes(q)
        const matchUnit = a.unit_number?.toLowerCase().includes(q)
        const matchProp = a.property_name?.toLowerCase().includes(q)
        if (!matchTenant && !matchUnit && !matchProp) return false
      }

      return true
    })
  }, [agreements, statusFilter, searchQuery])

  return (
    <MobilePage
      role="owner"
      header={
        <MobileHeader
          title="Rental Agreements"
          showBack
          rightAction={
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setShowAddModal(true)}
              style={{ gap: '0.25rem' }}
            >
              <Plus size={16} /> New
            </button>
          }
        />
      }
    >
      {/* Desktop Header Row */}
      <div className="hidden-mobile" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>
            Rental Agreements & Lease Lifecycles
          </h1>
          <p style={{ fontSize: '0.8125rem', color: '#64748B', margin: '0.125rem 0 0' }}>
            Manage lease terms, escalation rates, security deposit escrow, and renewals
          </p>
        </div>

        <button
          className="btn btn-primary btn-sm"
          onClick={() => setShowAddModal(true)}
          style={{ gap: '0.375rem', fontWeight: 700 }}
        >
          <Plus size={15} /> New Agreement
        </button>
      </div>

      {/* BI KPI METRIC SUMMARY */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '0.875rem',
          marginBottom: '1.25rem',
        }}
      >
        <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #10B981', background: '#FFFFFF' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Active Leases</span>
            <FileCheck size={16} color="#10B981" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0F172A', fontVariantNumeric: 'tabular-nums' }}>
            {biMetrics.activeCount}
          </div>
          <p style={{ fontSize: '0.6875rem', color: '#059669', margin: '0.15rem 0 0', fontWeight: 600 }}>
            {formatCurrency(biMetrics.totalMonthlyRental)}/mo contracted
          </p>
        </div>

        <div
          className="card"
          style={{
            padding: '1rem',
            borderLeft: `4px solid ${biMetrics.expiringCount > 0 ? '#F59E0B' : '#64748B'}`,
            background: biMetrics.expiringCount > 0 ? '#FFFBEB' : '#FFFFFF',
            cursor: biMetrics.expiringCount > 0 ? 'pointer' : 'default',
          }}
          onClick={() => biMetrics.expiringCount > 0 && setStatusFilter('expiring')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: biMetrics.expiringCount > 0 ? '#92400E' : '#64748B', textTransform: 'uppercase' }}>
              Expiring &lt;30 Days
            </span>
            <AlertTriangle size={16} color={biMetrics.expiringCount > 0 ? '#D97706' : '#94A3B8'} />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: biMetrics.expiringCount > 0 ? '#B45309' : '#0F172A', fontVariantNumeric: 'tabular-nums' }}>
            {biMetrics.expiringCount}
          </div>
          <p style={{ fontSize: '0.6875rem', color: biMetrics.expiringCount > 0 ? '#B45309' : '#64748B', margin: '0.15rem 0 0', fontWeight: 600 }}>
            {biMetrics.expiringCount > 0 ? 'Action needed: Renew or Vacate' : 'No upcoming expirations'}
          </p>
        </div>

        <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #3B82F6', background: '#FFFFFF' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Security Deposits Held</span>
            <ShieldCheck size={16} color="#3B82F6" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0F172A', fontVariantNumeric: 'tabular-nums' }}>
            {formatCurrency(biMetrics.totalDeposits)}
          </div>
          <p style={{ fontSize: '0.6875rem', color: '#64748B', margin: '0.15rem 0 0' }}>
            Safely held in refundable escrow
          </p>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="card" style={{ padding: '0.75rem 1rem', marginBottom: '1rem', background: '#FFFFFF' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', flex: '1 1 220px' }}>
            <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              className="input"
              style={{ paddingLeft: '2rem', height: 36, fontSize: '0.8125rem' }}
              placeholder="Search by tenant, flat number, or building..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Status Tabs */}
          <div style={{ display: 'flex', gap: '0.35rem' }}>
            {[
              { key: 'all', label: `All (${agreements.length})` },
              { key: 'active', label: `Active (${biMetrics.activeCount})` },
              { key: 'expiring', label: `Expiring Soon (${biMetrics.expiringCount})` },
              { key: 'terminated', label: 'Past / Ended' },
            ].map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setStatusFilter(t.key as any)}
                className={`btn btn-sm ${statusFilter === t.key ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* AGREEMENTS GRID */}
      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '0.875rem' }}>
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filteredAgreements.length === 0 ? (
        <EmptyState
          icon={<FileCheck size={32} />}
          title="No agreements found"
          description="Create legal rental agreements to manage lease durations and deposits."
          action={
            <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
              <Plus size={18} /> New Agreement
            </button>
          }
        />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '0.875rem',
          }}
        >
          {filteredAgreements.map((a) => {
            const endDate = new Date(a.end_date)
            const isExpiring = a.status === 'expiring' || (a.status === 'active' && endDate <= new Date(Date.now() + 30 * 86400000))
            const borderCol = a.status === 'active' && !isExpiring ? '#10B981' : isExpiring ? '#F59E0B' : '#94A3B8'

            return (
              <div
                key={a.id}
                className="card card-hover"
                style={{
                  padding: '1rem',
                  borderRadius: '0.75rem',
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderLeft: `4px solid ${borderCol}`,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
                }}
              >
                <div>
                  {/* Top Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <div>
                      <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>
                        {a.tenant_name || 'Resident'}
                      </h3>
                      <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '0.125rem 0 0' }}>
                        Flat {a.unit_number} • {a.property_name}
                      </p>
                    </div>
                    <StatusBadge status={a.status} />
                  </div>

                  {/* Financials Row */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '0.5rem',
                      background: '#F8FAFC',
                      padding: '0.5rem 0.625rem',
                      borderRadius: '0.5rem',
                      border: '1px solid #F1F5F9',
                      marginBottom: '0.625rem',
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '0.625rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Monthly Rent</span>
                      <p style={{ fontWeight: 900, fontSize: '1rem', margin: 0, color: '#0F172A', fontVariantNumeric: 'tabular-nums' }}>
                        {formatCurrency(a.monthly_rent)}
                      </p>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.625rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Security Deposit</span>
                      <p style={{ fontWeight: 800, fontSize: '1rem', margin: 0, color: '#059669', fontVariantNumeric: 'tabular-nums' }}>
                        {formatCurrency(a.security_deposit)}
                      </p>
                    </div>
                  </div>

                  {/* Period & Notice Tag */}
                  <div style={{ fontSize: '0.6875rem', color: '#64748B', display: 'flex', flexDirection: 'column', gap: '0.2rem', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Calendar size={12} color="#94A3B8" />
                      <span>Term: <strong>{formatDate(a.start_date)}</strong> → <strong style={{ color: isExpiring ? '#D97706' : '#0F172A' }}>{formatDate(a.end_date)}</strong></span>
                    </div>
                    {a.notice_period_days && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Clock size={12} color="#94A3B8" />
                        <span>Notice Period: <strong>{a.notice_period_days} Days</strong></span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div
                  style={{
                    display: 'flex',
                    gap: '0.375rem',
                    borderTop: '1px solid #F1F5F9',
                    paddingTop: '0.5rem',
                    marginTop: '0.25rem',
                  }}
                >
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setViewingAgreement(a)}
                    style={{ flex: 1, fontSize: '0.75rem', padding: '0.35rem 0.5rem', gap: '0.25rem' }}
                  >
                    <Printer size={13} /> View Copy
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setRenewingAgreement(a)}
                    style={{ flex: 1, fontSize: '0.75rem', padding: '0.35rem 0.5rem', gap: '0.25rem', color: '#1D4ED8', borderColor: '#BFDBFE', background: '#EFF6FF' }}
                  >
                    <RefreshCw size={13} /> Renew Lease
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setSettlingAgreement(a)}
                    style={{ fontSize: '0.75rem', padding: '0.35rem 0.5rem', gap: '0.25rem', color: '#DC2626', borderColor: '#FECACA' }}
                    title="Move-out deposit settlement"
                  >
                    <Calculator size={13} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* RENEW LEASE MODAL */}
      {renewingAgreement && (
        <RenewAgreementModal
          agreement={renewingAgreement}
          onClose={() => setRenewingAgreement(null)}
          onSuccess={() => {
            setRenewingAgreement(null)
            load()
          }}
        />
      )}

      {/* MOVE-OUT DEPOSIT SETTLEMENT MODAL */}
      {settlingAgreement && (
        <DepositSettlementModal
          agreement={settlingAgreement}
          onClose={() => setSettlingAgreement(null)}
        />
      )}

      {/* VIEW DIGITAL LEASE MODAL */}
      {viewingAgreement && (
        <ViewAgreementModal
          agreement={viewingAgreement}
          onClose={() => setViewingAgreement(null)}
        />
      )}

      {/* NEW AGREEMENT MODAL */}
      <AddAgreementModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          setShowAddModal(false)
          load()
        }}
      />
    </MobilePage>
  )
}

// ================================================
// LEASE RENEWAL ENGINE MODAL
// ================================================
function RenewAgreementModal({
  agreement,
  onClose,
  onSuccess,
}: {
  agreement: Agreement
  onClose: () => void
  onSuccess: () => void
}) {
  const { success, error } = useToast()
  const [escalationPercent, setEscalationPercent] = useState('5')
  const [newRent, setNewRent] = useState(String(Math.round(agreement.monthly_rent * 1.05)))
  const [newDeposit, setNewDeposit] = useState(String(agreement.security_deposit))
  const [newEndDate, setNewEndDate] = useState(() => {
    const d = new Date(agreement.end_date)
    d.setMonth(d.getMonth() + 11)
    return d.toISOString().split('T')[0]
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handlePercentChange = (pct: string) => {
    setEscalationPercent(pct)
    const factor = 1 + parseFloat(pct) / 100
    const calculated = Math.round(agreement.monthly_rent * factor)
    setNewRent(String(calculated))
  }

  const handleRenew = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await agreementApi.create({
        property_id: agreement.property_id,
        unit_id: agreement.unit_id,
        tenant_id: agreement.tenant_id,
        start_date: agreement.end_date,
        end_date: newEndDate,
        monthly_rent: parseFloat(newRent),
        security_deposit: parseFloat(newDeposit),
        notice_period_days: agreement.notice_period_days || 30,
        notes: `Renewed with ${escalationPercent}% rent escalation`,
      })
      success(`Lease renewed successfully at ₹${parseFloat(newRent).toLocaleString('en-IN')}/mo!`)
      onSuccess()
    } catch (err) {
      const axiosErr = err as AxiosError<{ detail: string }>
      error(axiosErr.response?.data?.detail || 'Failed to renew agreement')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal isOpen={true} onClose={onClose} title="Renew Rental Lease Agreement" maxWidth="480px">
      <form onSubmit={handleRenew} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ background: '#F8FAFC', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #E2E8F0' }}>
          <p style={{ margin: 0, fontWeight: 800, fontSize: '0.9375rem', color: '#0F172A' }}>
            {agreement.tenant_name} • Flat {agreement.unit_number}
          </p>
          <p style={{ margin: '0.15rem 0 0', fontSize: '0.75rem', color: '#64748B' }}>
            Current Contract: {formatCurrency(agreement.monthly_rent)}/mo (Expires {formatDate(agreement.end_date)})
          </p>
        </div>

        {/* Escalation Selector */}
        <div>
          <label className="label" style={{ fontWeight: 700, fontSize: '0.8125rem', marginBottom: '0.35rem', display: 'block' }}>
            Rent Escalation Hike %
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
            {['0', '5', '10', '15'].map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => handlePercentChange(pct)}
                className={`btn btn-sm ${escalationPercent === pct ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.75rem', fontWeight: 700 }}
              >
                +{pct}%
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div>
            <label className="label" style={{ fontWeight: 700, fontSize: '0.8125rem', marginBottom: '0.25rem', display: 'block' }}>
              New Monthly Rent (₹) *
            </label>
            <input
              type="number"
              className="input"
              required
              value={newRent}
              onChange={(e) => setNewRent(e.target.value)}
            />
          </div>

          <div>
            <label className="label" style={{ fontWeight: 700, fontSize: '0.8125rem', marginBottom: '0.25rem', display: 'block' }}>
              Security Deposit (₹)
            </label>
            <input
              type="number"
              className="input"
              value={newDeposit}
              onChange={(e) => setNewDeposit(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="label" style={{ fontWeight: 700, fontSize: '0.8125rem', marginBottom: '0.25rem', display: 'block' }}>
            New Lease End Date *
          </label>
          <input
            type="date"
            className="input"
            required
            value={newEndDate}
            onChange={(e) => setNewEndDate(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting} style={{ backgroundColor: '#1D4ED8', borderColor: '#1D4ED8', fontWeight: 700 }}>
            {isSubmitting ? 'Renewing...' : 'Confirm & Renew Agreement'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ================================================
// MOVE-OUT SETTLEMENT CALCULATOR
// ================================================
function DepositSettlementModal({
  agreement,
  onClose,
}: {
  agreement: Agreement
  onClose: () => void
}) {
  const [unpaidRent, setUnpaidRent] = useState('0')
  const [repairs, setRepairs] = useState('0')
  const [cleaning, setCleaning] = useState('0')

  const totalDeposit = agreement.security_deposit || 0
  const deductions = (parseFloat(unpaidRent) || 0) + (parseFloat(repairs) || 0) + (parseFloat(cleaning) || 0)
  const netRefund = Math.max(0, totalDeposit - deductions)

  return (
    <Modal isOpen={true} onClose={onClose} title="Move-Out Settlement & Refund" maxWidth="480px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ background: '#F8FAFC', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #E2E8F0' }}>
          <p style={{ margin: 0, fontWeight: 800, fontSize: '0.9375rem', color: '#0F172A' }}>
            {agreement.tenant_name} • Flat {agreement.unit_number}
          </p>
          <p style={{ margin: '0.15rem 0 0', fontSize: '0.75rem', color: '#64748B' }}>
            Total Security Deposit Held: <strong>{formatCurrency(totalDeposit)}</strong>
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div>
            <label className="label" style={{ fontWeight: 700, fontSize: '0.8125rem', marginBottom: '0.25rem', display: 'block' }}>
              Unpaid Rent Dues (₹)
            </label>
            <input
              type="number"
              className="input"
              placeholder="0"
              value={unpaidRent}
              onChange={(e) => setUnpaidRent(e.target.value)}
            />
          </div>

          <div>
            <label className="label" style={{ fontWeight: 700, fontSize: '0.8125rem', marginBottom: '0.25rem', display: 'block' }}>
              Damages / Repairs (₹)
            </label>
            <input
              type="number"
              className="input"
              placeholder="0"
              value={repairs}
              onChange={(e) => setRepairs(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="label" style={{ fontWeight: 700, fontSize: '0.8125rem', marginBottom: '0.25rem', display: 'block' }}>
            Painting & Deep Cleaning (₹)
          </label>
          <input
            type="number"
            className="input"
            placeholder="0"
            value={cleaning}
            onChange={(e) => setCleaning(e.target.value)}
          />
        </div>

        {/* Calculation Result Box */}
        <div style={{ background: '#ECFDF5', padding: '1rem', borderRadius: '0.75rem', border: '1.5px solid #10B981', textAlign: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: '#065F46', fontWeight: 700, textTransform: 'uppercase' }}>
            Net Refund Payable to Tenant
          </span>
          <p style={{ fontSize: '1.75rem', fontWeight: 900, color: '#047857', margin: '0.25rem 0', fontVariantNumeric: 'tabular-nums' }}>
            {formatCurrency(netRefund)}
          </p>
          <p style={{ fontSize: '0.6875rem', color: '#065F46', margin: 0 }}>
            Original Deposit: {formatCurrency(totalDeposit)} • Total Deductions: -{formatCurrency(deductions)}
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              window.print()
            }}
            style={{ backgroundColor: '#059669', borderColor: '#059669', fontWeight: 700, gap: '0.375rem' }}
          >
            <Printer size={15} /> Print Settlement Slip
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ================================================
// DIGITAL LEASE VIEW & PRINT MODAL
// ================================================
function ViewAgreementModal({
  agreement,
  onClose,
}: {
  agreement: Agreement
  onClose: () => void
}) {
  return (
    <Modal isOpen={true} onClose={onClose} title="Digital Rental Agreement Contract" maxWidth="640px">
      <div style={{ maxHeight: '75vh', overflowY: 'auto', padding: '0.5rem' }}>
        <div
          id="printable-agreement"
          style={{
            background: '#FFFFFF',
            padding: '1.5rem',
            border: '1px solid #E2E8F0',
            borderRadius: '0.5rem',
            fontFamily: 'serif',
            color: '#0F172A',
            lineHeight: 1.6,
          }}
        >
          <div style={{ textAlign: 'center', borderBottom: '2px solid #0F172A', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Residential Rental Lease Agreement
            </h2>
            <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '0.25rem 0 0' }}>
              Executed in accordance with standard tenancy laws
            </p>
          </div>

          <p style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>
            This Agreement is made on <strong>{formatDate(agreement.start_date)}</strong> between the Property Owner / Landlord and the Tenant named below:
          </p>

          <div style={{ background: '#F8FAFC', padding: '0.875rem', borderRadius: '0.375rem', border: '1px solid #E2E8F0', marginBottom: '1rem', fontSize: '0.8125rem' }}>
            <p style={{ margin: '0 0 0.35rem' }}><strong>Tenant Name:</strong> {agreement.tenant_name || 'Resident'}</p>
            <p style={{ margin: '0 0 0.35rem' }}><strong>Premises:</strong> Flat {agreement.unit_number}, {agreement.property_name}</p>
            <p style={{ margin: '0 0 0.35rem' }}><strong>Tenancy Term:</strong> {formatDate(agreement.start_date)} to {formatDate(agreement.end_date)}</p>
            <p style={{ margin: '0 0 0.35rem' }}><strong>Monthly Rental:</strong> {formatCurrency(agreement.monthly_rent)} per English calendar month</p>
            <p style={{ margin: '0 0 0.35rem' }}><strong>Interest-Free Security Deposit:</strong> {formatCurrency(agreement.security_deposit)}</p>
            <p style={{ margin: 0 }}><strong>Notice Period:</strong> {agreement.notice_period_days || 30} Days</p>
          </div>

          <h4 style={{ fontSize: '0.875rem', fontWeight: 800, margin: '1rem 0 0.35rem' }}>Terms & Conditions:</h4>
          <ol style={{ fontSize: '0.8125rem', paddingLeft: '1.25rem', color: '#334155', margin: 0 }}>
            <li>The Tenant agrees to pay the monthly rental on or before the due date specified.</li>
            <li>The Premises shall be used solely for private residential dwelling purposes.</li>
            <li>The Security Deposit shall be refunded upon peaceful handover of keys, subject to deduction of any unpaid utilities or repair damages.</li>
            <li>Either party may terminate this agreement by providing written notice as stated in the notice period.</li>
          </ol>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid #CBD5E1' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ height: 40, borderBottom: '1px solid #0F172A', marginBottom: '0.35rem' }}></div>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, margin: 0 }}>Landlord / Authorized Signatory</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ height: 40, borderBottom: '1px solid #0F172A', marginBottom: '0.35rem' }}></div>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, margin: 0 }}>Tenant Signature ({agreement.tenant_name})</p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => window.print()}
            style={{ gap: '0.375rem', fontWeight: 700 }}
          >
            <Printer size={15} /> Print / Save PDF
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ================================================
// ADD AGREEMENT MODAL
// ================================================
function AddAgreementModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}) {
  const { success, error } = useToast()
  const [properties, setProperties] = useState<Property[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [selectedPropertyId, setSelectedPropertyId] = useState('')
  const [selectedTenantId, setSelectedTenantId] = useState('')
  const [selectedUnitId, setSelectedUnitId] = useState('')
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(() => {
    const d = new Date()
    d.setMonth(d.getMonth() + 11)
    return d.toISOString().split('T')[0]
  })
  const [monthlyRent, setMonthlyRent] = useState('')
  const [deposit, setDeposit] = useState('')
  const [noticeDays, setNoticeDays] = useState('30')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      Promise.all([
        propertyApi.list(),
        tenantApi.list({ unassigned: true }),
      ]).then(([propRes, tenRes]) => {
        const p = propRes.data.data || []
        const t = tenRes.data.data || []
        setProperties(p)
        setTenants(t)
        if (p.length > 0) {
          setSelectedPropertyId(p[0].id)
          loadUnits(p[0].id)
        }
        if (t.length > 0) setSelectedTenantId(t[0].id)
      }).catch(() => {})
    }
  }, [isOpen])

  const loadUnits = (propId: string) => {
    unitApi.list({ property_id: propId, status: 'vacant' }).then((res) => {
      const u = res.data.data || []
      setUnits(u)
      if (u.length > 0) {
        setSelectedUnitId(u[0].id)
        setMonthlyRent(String(u[0].monthly_rent || ''))
        setDeposit(String(u[0].security_deposit || (u[0].monthly_rent ? u[0].monthly_rent * 2 : '')))
      }
    }).catch(() => {})
  }

  const handlePropertyChange = (propId: string) => {
    setSelectedPropertyId(propId)
    loadUnits(propId)
  }

  const handleUnitChange = (unitId: string) => {
    setSelectedUnitId(unitId)
    const found = units.find((u) => u.id === unitId)
    if (found) {
      setMonthlyRent(String(found.monthly_rent || ''))
      setDeposit(String(found.security_deposit || (found.monthly_rent ? found.monthly_rent * 2 : '')))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPropertyId || !selectedUnitId || !selectedTenantId || !monthlyRent) {
      error('Please fill all mandatory fields')
      return
    }

    setIsLoading(true)
    try {
      await agreementApi.create({
        property_id: selectedPropertyId,
        unit_id: selectedUnitId,
        tenant_id: selectedTenantId,
        start_date: startDate,
        end_date: endDate,
        monthly_rent: parseFloat(monthlyRent),
        security_deposit: parseFloat(deposit) || (parseFloat(monthlyRent) * 2),
        notice_period_days: parseInt(noticeDays) || 30,
      })
      success('Rental agreement generated successfully!')
      onSuccess()
    } catch (err) {
      const axiosErr = err as AxiosError<{ detail: string }>
      error(axiosErr.response?.data?.detail || 'Failed to create agreement')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Rental Agreement" maxWidth="520px">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div className="form-group">
            <label className="input-label">Building / Property *</label>
            <select
              className="input"
              value={selectedPropertyId}
              onChange={(e) => handlePropertyChange(e.target.value)}
            >
              {properties.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="input-label">Unit / Flat *</label>
            <select
              className="input"
              value={selectedUnitId}
              onChange={(e) => handleUnitChange(e.target.value)}
            >
              {units.length === 0 ? (
                <option value="">No vacant units</option>
              ) : (
                units.map((u) => (
                  <option key={u.id} value={u.id}>Flat {u.unit_number} ({u.unit_type})</option>
                ))
              )}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="input-label">Tenant / Resident *</label>
          <select
            className="input"
            value={selectedTenantId}
            onChange={(e) => setSelectedTenantId(e.target.value)}
          >
            {tenants.length === 0 ? (
              <option value="">No unassigned tenants</option>
            ) : (
              tenants.map((t) => (
                <option key={t.id} value={t.id}>{t.full_name} ({t.phone || 'No phone'})</option>
              ))
            )}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div className="form-group">
            <label className="input-label">Monthly Rent (₹) *</label>
            <input
              type="number"
              className="input"
              required
              placeholder="e.g. 18000"
              value={monthlyRent}
              onChange={(e) => setMonthlyRent(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="input-label">Security Deposit (₹) *</label>
            <input
              type="number"
              className="input"
              required
              placeholder="e.g. 36000"
              value={deposit}
              onChange={(e) => setDeposit(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div className="form-group">
            <label className="input-label">Lease Start Date *</label>
            <input
              type="date"
              className="input"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="input-label">Lease End Date *</label>
            <input
              type="date"
              className="input"
              required
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem', borderTop: '1px solid #F1F5F9', paddingTop: '0.75rem' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={isLoading} style={{ gap: '0.375rem', fontWeight: 700 }}>
            <Plus size={15} />
            {isLoading ? 'Creating...' : 'Create Agreement'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
