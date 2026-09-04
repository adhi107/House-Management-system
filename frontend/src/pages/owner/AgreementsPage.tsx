import React, { useState, useEffect } from 'react'
import { agreementApi, propertyApi, tenantApi, unitApi } from '../../api/client'
import { Agreement, Property, Tenant, Unit } from '../../types'
import { MobilePage } from '../../components/layout/AppShell'
import { MobileHeader } from '../../components/navigation'
import { formatCurrency, formatDate, EmptyState, SkeletonCard, StatusBadge, Modal } from '../../components/ui'
import { FileCheck, Plus, Calendar, User, Home } from 'lucide-react'
import { useToast } from '../../contexts/ToastContext'
import { AxiosError } from 'axios'

export default function AgreementsPage() {
  const [agreements, setAgreements] = useState<Agreement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)

  const load = () => {
    setIsLoading(true)
    agreementApi.list({}).then((res) => {
      setAgreements(res.data.data || [])
    }).catch(() => {}).finally(() => setIsLoading(false))
  }

  useEffect(() => { load() }, [])

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
              <Plus size={16} /> Add
            </button>
          }
        />
      }
    >
      {/* Desktop Header Row */}
      <div className="hidden-mobile" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>
            Rental Agreements ({agreements.length})
          </h1>
          <p style={{ fontSize: '0.8125rem', color: '#64748B', margin: '0.125rem 0 0' }}>
            Manage lease terms, tenancy agreements, deposit terms, and expiration dates
          </p>
        </div>

        <button
          className="btn btn-primary btn-sm"
          onClick={() => setShowAddModal(true)}
          style={{ gap: '0.375rem' }}
        >
          <Plus size={15} /> New Agreement
        </button>
      </div>

      <div style={{ marginBottom: '0.625rem', fontSize: '0.8125rem', color: 'rgb(var(--muted-foreground))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>{agreements.length} active/recorded agreement{agreements.length !== 1 ? 's' : ''}</span>
        <button
          className="btn btn-secondary btn-sm mobile-only"
          onClick={() => setShowAddModal(true)}
          style={{ gap: '0.25rem', fontSize: '0.75rem' }}
        >
          <Plus size={13} /> New Agreement
        </button>
      </div>

      {isLoading ? (
        Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
      ) : agreements.length === 0 ? (
        <EmptyState
          icon={<FileCheck size={32} />}
          title="No agreements found"
          description="Create legal rental agreements with deposit and lease periods."
          action={
            <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
              <Plus size={18} /> New Agreement
            </button>
          }
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {agreements.map((a) => (
            <div
              key={a.id}
              className="card card-hover"
              style={{
                padding: '1rem',
                borderLeft: `3.5px solid ${a.status === 'active' ? '#10B981' : a.status === 'expiring' ? '#F59E0B' : '#94A3B8'}`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <div>
                  <h3 style={{ fontWeight: 800, fontSize: '0.9375rem', margin: '0 0 0.125rem', color: '#0F172A' }}>
                    {a.tenant_name || 'Resident'}
                  </h3>
                  <p style={{ fontSize: '0.8125rem', color: '#64748B', margin: 0 }}>
                    Flat {a.unit_number} • {a.property_name || 'Building'}
                  </p>
                </div>
                <StatusBadge status={a.status || 'active'} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', background: '#F8FAFC', padding: '0.5rem 0.75rem', borderRadius: 6, margin: '0.5rem 0' }}>
                <div>
                  <span style={{ fontSize: '0.6875rem', color: '#64748B', display: 'block', fontWeight: 600 }}>Rent / Month</span>
                  <span style={{ fontWeight: 800, fontSize: '0.875rem', color: '#0F172A', fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(a.monthly_rent)}</span>
                </div>
                <div>
                  <span style={{ fontSize: '0.6875rem', color: '#64748B', display: 'block', fontWeight: 600 }}>Security Deposit</span>
                  <span style={{ fontWeight: 800, fontSize: '0.875rem', color: '#0F172A', fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(a.security_deposit || 0)}</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748B', marginTop: '0.25rem' }}>
                <span>Duration: {formatDate(a.start_date)} – {formatDate(a.end_date)}</span>
                <span>Notice: {a.notice_period_days || 30} days</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Agreement Modal */}
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
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [selectedTenantId, setSelectedTenantId] = useState('')
  const [selectedPropertyId, setSelectedPropertyId] = useState('')
  const [selectedUnitId, setSelectedUnitId] = useState('')
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(() => {
    const d = new Date()
    d.setFullYear(d.getFullYear() + 1)
    return d.toISOString().split('T')[0]
  })
  const [monthlyRent, setMonthlyRent] = useState('')
  const [securityDeposit, setSecurityDeposit] = useState('')
  const [noticePeriod, setNoticePeriod] = useState('30')
  const [notes, setNotes] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (isOpen) {
      tenantApi.list({ per_page: 100 }).then((res) => {
        const tList = res.data.data || []
        setTenants(tList)
        if (tList.length > 0) setSelectedTenantId(tList[0].id)
      }).catch(() => {})

      propertyApi.list().then((res) => {
        const pList = res.data.data || []
        setProperties(pList)
        if (pList.length > 0) setSelectedPropertyId(pList[0].id)
      }).catch(() => {})

      setMonthlyRent('')
      setSecurityDeposit('')
      setNoticePeriod('30')
      setNotes('')
      setErrors({})
    }
  }, [isOpen])

  useEffect(() => {
    if (selectedPropertyId) {
      unitApi.list({ property_id: selectedPropertyId }).then((res) => {
        const uList = res.data.data || []
        setUnits(uList)
        if (uList.length > 0) {
          setSelectedUnitId(uList[0].id)
          if (uList[0].monthly_rent) setMonthlyRent(String(uList[0].monthly_rent))
          if (uList[0].security_deposit) setSecurityDeposit(String(uList[0].security_deposit))
        } else {
          setSelectedUnitId('')
        }
      }).catch(() => {})
    }
  }, [selectedPropertyId])

  const handleUnitChange = (uId: string) => {
    setSelectedUnitId(uId)
    const unit = units.find((u) => u.id === uId)
    if (unit) {
      if (unit.monthly_rent) setMonthlyRent(String(unit.monthly_rent))
      if (unit.security_deposit) setSecurityDeposit(String(unit.security_deposit))
    }
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!selectedTenantId) e.tenant = 'Please select a tenant'
    if (!selectedPropertyId) e.property = 'Please select a building'
    if (!selectedUnitId) e.unit = 'Please select a flat/unit'
    if (!monthlyRent || parseFloat(monthlyRent) <= 0) e.rent = 'Enter a valid monthly rent'
    if (!startDate) e.startDate = 'Start date required'
    if (!endDate) e.endDate = 'End date required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setIsLoading(true)
    try {
      await agreementApi.create({
        tenant_id: selectedTenantId,
        property_id: selectedPropertyId,
        unit_id: selectedUnitId,
        start_date: startDate,
        end_date: endDate,
        monthly_rent: parseFloat(monthlyRent),
        security_deposit: parseFloat(securityDeposit) || 0,
        notice_period_days: parseInt(noticePeriod) || 30,
        notes: notes.trim() || undefined,
      })
      success('Rental agreement created successfully!')
      onSuccess()
    } catch (err) {
      const axiosErr = err as AxiosError<{ detail: string }>
      error(axiosErr.response?.data?.detail || 'Failed to create agreement')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Rental Agreement" maxWidth="540px">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="input-label">Select Tenant</label>
          <select
            className={`input ${errors.tenant ? 'input-error' : ''}`}
            value={selectedTenantId}
            onChange={(e) => setSelectedTenantId(e.target.value)}
          >
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>{t.full_name} ({t.phone || 'No phone'})</option>
            ))}
          </select>
          {errors.tenant && <p className="input-hint input-hint-error">{errors.tenant}</p>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div className="form-group">
            <label className="input-label">Building / Property</label>
            <select
              className={`input ${errors.property ? 'input-error' : ''}`}
              value={selectedPropertyId}
              onChange={(e) => setSelectedPropertyId(e.target.value)}
            >
              {properties.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            {errors.property && <p className="input-hint input-hint-error">{errors.property}</p>}
          </div>

          <div className="form-group">
            <label className="input-label">Flat / Unit</label>
            <select
              className={`input ${errors.unit ? 'input-error' : ''}`}
              value={selectedUnitId}
              onChange={(e) => handleUnitChange(e.target.value)}
            >
              {units.length === 0 ? (
                <option value="">No units available</option>
              ) : (
                units.map((u) => (
                  <option key={u.id} value={u.id}>Flat {u.unit_number} (Floor {u.floor_number})</option>
                ))
              )}
            </select>
            {errors.unit && <p className="input-hint input-hint-error">{errors.unit}</p>}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div className="form-group">
            <label className="input-label">Start Date</label>
            <input
              type="date"
              className={`input ${errors.startDate ? 'input-error' : ''}`}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="input-label">End Date</label>
            <input
              type="date"
              className={`input ${errors.endDate ? 'input-error' : ''}`}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div className="form-group">
            <label className="input-label">Monthly Rent (₹)</label>
            <input
              type="number"
              inputMode="decimal"
              className={`input ${errors.rent ? 'input-error' : ''}`}
              placeholder="e.g. 18000"
              value={monthlyRent}
              onChange={(e) => setMonthlyRent(e.target.value)}
            />
            {errors.rent && <p className="input-hint input-hint-error">{errors.rent}</p>}
          </div>

          <div className="form-group">
            <label className="input-label">Security Deposit (₹)</label>
            <input
              type="number"
              inputMode="decimal"
              className="input"
              placeholder="e.g. 50000"
              value={securityDeposit}
              onChange={(e) => setSecurityDeposit(e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="input-label">Notice Period (Days)</label>
          <input
            type="number"
            className="input"
            value={noticePeriod}
            onChange={(e) => setNoticePeriod(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="input-label">Additional Notes (optional)</label>
          <textarea
            className="input"
            rows={2}
            placeholder="Special terms, maintenance terms, etc."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{ resize: 'none' }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.25rem', borderTop: '1px solid #F1F5F9', paddingTop: '1rem' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={isLoading} style={{ gap: '0.375rem' }}>
            <Plus size={15} />
            {isLoading ? 'Creating...' : 'Create Agreement'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
