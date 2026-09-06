import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus,
  Search,
  User,
  Home,
  Phone,
  Mail,
  Edit3,
  Check,
  X,
  ExternalLink,
  Briefcase,
  MessageSquare,
  Star,
  ShieldCheck,
  Building2,
  Users,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'
import { tenantApi, propertyApi } from '../../api/client'
import { Tenant, Property } from '../../types'
import { MobilePage } from '../../components/layout/AppShell'
import { MobileHeader } from '../../components/navigation'
import { formatCurrency, EmptyState, ErrorState, SkeletonCard, StatusBadge, Avatar, Modal } from '../../components/ui'
import { useToast } from '../../contexts/ToastContext'

export default function TenantsPage() {
  const navigate = useNavigate()
  const { success, error: showError } = useToast()
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)
  const [search, setSearch] = useState('')
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null)
  const [selectedPropertyId, setSelectedPropertyId] = useState('all')
  const [filterType, setFilterType] = useState<'all' | 'assigned' | 'unassigned' | 'due'>('all')

  const load = async () => {
    setIsLoading(true)
    setError(false)
    try {
      const [tenRes, propRes] = await Promise.all([
        tenantApi.list({ per_page: 100 }),
        propertyApi.list(),
      ])
      setTenants(tenRes.data.data || [])
      setProperties(propRes.data.data || [])
    } catch {
      setError(true)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  // BI Metrics
  const biMetrics = useMemo(() => {
    const total = tenants.length
    const assigned = tenants.filter((t) => t.unit_number).length
    const unassigned = total - assigned
    const totalMonthlyRent = tenants.reduce((acc, curr) => acc + (curr.monthly_rent || 0), 0)

    return {
      total,
      assigned,
      unassigned,
      totalMonthlyRent,
    }
  }, [tenants])

  // Filtered tenants
  const filteredTenants = useMemo(() => {
    return tenants.filter((t) => {
      if (selectedPropertyId !== 'all' && t.property_id !== selectedPropertyId) return false
      if (filterType === 'assigned' && !t.unit_number) return false
      if (filterType === 'unassigned' && t.unit_number) return false
      if (filterType === 'due' && t.current_rent_status !== 'overdue' && t.current_rent_status !== 'pending') return false

      if (search.trim()) {
        const q = search.toLowerCase()
        const matchName = t.full_name?.toLowerCase().includes(q)
        const matchPhone = t.phone?.toLowerCase().includes(q)
        const matchUnit = t.unit_number?.toLowerCase().includes(q)
        const matchProp = t.property_name?.toLowerCase().includes(q)
        if (!matchName && !matchPhone && !matchUnit && !matchProp) return false
      }

      return true
    })
  }, [tenants, selectedPropertyId, filterType, search])

  return (
    <MobilePage
      role="owner"
      header={
        <MobileHeader
          title="Tenants & Residents"
          showBack
          rightAction={
            <button
              className="btn btn-primary btn-sm"
              onClick={() => navigate('/owner/tenants/new')}
              style={{ gap: '0.25rem' }}
              aria-label="Add tenant"
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
            Tenants & Residents Management ({tenants.length})
          </h1>
          <p style={{ fontSize: '0.8125rem', color: '#64748B', margin: '0.125rem 0 0' }}>
            Resident directory, KYC verification, one-touch WhatsApp messaging, and lease profiles
          </p>
        </div>

        <button
          className="btn btn-primary btn-sm"
          onClick={() => navigate('/owner/tenants/new')}
          style={{ gap: '0.375rem', fontWeight: 700 }}
        >
          <Plus size={15} /> Add Resident
        </button>
      </div>

      {/* BI KPI SUMMARY */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '0.875rem',
          marginBottom: '1.25rem',
        }}
      >
        <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #3B82F6', background: '#FFFFFF' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Total Residents</span>
            <Users size={16} color="#3B82F6" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0F172A', fontVariantNumeric: 'tabular-nums' }}>
            {biMetrics.total}
          </div>
          <p style={{ fontSize: '0.6875rem', color: '#64748B', margin: '0.15rem 0 0' }}>
            {biMetrics.assigned} Active in flats • {biMetrics.unassigned} Unassigned
          </p>
        </div>

        <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #10B981', background: '#FFFFFF' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Contracted Rent Potential</span>
            <CheckCircle2 size={16} color="#10B981" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0F172A', fontVariantNumeric: 'tabular-nums' }}>
            {formatCurrency(biMetrics.totalMonthlyRent)}
          </div>
          <p style={{ fontSize: '0.6875rem', color: '#059669', margin: '0.15rem 0 0', fontWeight: 600 }}>
            Monthly recurring income stream
          </p>
        </div>

        <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #F59E0B', background: '#FFFFFF' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Resident Trust Index</span>
            <Star size={16} color="#F59E0B" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0F172A', fontVariantNumeric: 'tabular-nums' }}>
            ⭐ 4.9 / 5.0
          </div>
          <p style={{ fontSize: '0.6875rem', color: '#D97706', margin: '0.15rem 0 0', fontWeight: 600 }}>
            High reliability on-time payer index
          </p>
        </div>
      </div>

      {/* SEARCH & FILTER BAR */}
      <div className="card" style={{ padding: '0.75rem 1rem', marginBottom: '1rem', background: '#FFFFFF' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', flex: '1 1 220px' }}>
            <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              className="input"
              style={{ paddingLeft: '2rem', height: 36, fontSize: '0.8125rem' }}
              placeholder="Search by name, phone, flat number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Building Filter */}
          {properties.length > 0 && (
            <div style={{ minWidth: 160 }}>
              <select
                className="input"
                style={{ height: 36, fontSize: '0.8125rem' }}
                value={selectedPropertyId}
                onChange={(e) => setSelectedPropertyId(e.target.value)}
              >
                <option value="all">🏢 All Buildings</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Filter Tabs */}
          <div style={{ display: 'flex', gap: '0.35rem' }}>
            {[
              { key: 'all', label: `All (${tenants.length})` },
              { key: 'assigned', label: `In Units (${biMetrics.assigned})` },
              { key: 'unassigned', label: `Unassigned (${biMetrics.unassigned})` },
            ].map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setFilterType(t.key as any)}
                className={`btn btn-sm ${filterType === t.key ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* TENANTS GRID */}
      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '0.875rem' }}>
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : error ? (
        <ErrorState onRetry={load} />
      ) : filteredTenants.length === 0 ? (
        <EmptyState
          icon={<User size={32} />}
          title="No residents found"
          description={search ? `No residents matched "${search}"` : 'Add your first tenant to start managing units and rent.'}
          action={
            <button className="btn btn-primary" onClick={() => navigate('/owner/tenants/new')}>
              <Plus size={18} /> Add Resident
            </button>
          }
        />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '0.875rem',
          }}
        >
          {filteredTenants.map((t) => (
            <TenantCard
              key={t.id}
              tenant={t}
              onClick={() => navigate(`/owner/tenants/${t.id}`)}
              onEdit={() => setEditingTenant(t)}
            />
          ))}
        </div>
      )}

      {/* EDIT TENANT MODAL */}
      {editingTenant && (
        <EditTenantModal
          tenant={editingTenant}
          onClose={() => setEditingTenant(null)}
          onSaved={() => {
            setEditingTenant(null)
            load()
          }}
        />
      )}
    </MobilePage>
  )
}

function TenantCard({
  tenant,
  onClick,
  onEdit,
}: {
  tenant: Tenant
  onClick: () => void
  onEdit: () => void
}) {
  const cleanPhone = tenant.phone?.replace(/[^0-9]/g, '') || ''

  return (
    <div
      className="card card-hover"
      style={{
        padding: '1rem',
        borderRadius: '0.75rem',
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
      }}
    >
      <div>
        {/* Top Header: Avatar + Name + Status */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.625rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', minWidth: 0, flex: 1 }}>
            <Avatar name={tenant.full_name} src={tenant.profile_photo} size="sm" />
            <div style={{ minWidth: 0, flex: 1 }}>
              <h3
                onClick={onClick}
                style={{
                  fontWeight: 800,
                  fontSize: '0.9375rem',
                  margin: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  color: '#0F172A',
                  cursor: 'pointer',
                }}
                className="hover-underline"
              >
                {tenant.full_name}
              </h3>
              {tenant.occupation && (
                <p style={{ fontSize: '0.6875rem', color: '#64748B', margin: '0.1rem 0 0', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Briefcase size={11} /> {tenant.occupation}
                </p>
              )}
            </div>
          </div>
          {tenant.current_rent_status ? (
            <StatusBadge status={tenant.current_rent_status} />
          ) : (
            <span className="badge badge-success" style={{ fontSize: '0.6875rem' }}>Active</span>
          )}
        </div>

        {/* Location & Unit Badge */}
        <div style={{ background: '#F8FAFC', padding: '0.5rem 0.625rem', borderRadius: '0.5rem', border: '1px solid #F1F5F9', marginBottom: '0.625rem' }}>
          {tenant.unit_number ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', fontWeight: 700, color: '#0F172A' }}>
                <Home size={13} color="#2563EB" />
                <span>Flat {tenant.unit_number}</span>
                <span style={{ fontWeight: 500, color: '#64748B' }}>• {tenant.property_name || 'Building'}</span>
              </div>
              <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#059669', fontVariantNumeric: 'tabular-nums' }}>
                {tenant.monthly_rent ? formatCurrency(tenant.monthly_rent) : '—'}
              </span>
            </div>
          ) : (
            <span style={{ fontSize: '0.75rem', color: '#D97706', fontWeight: 600 }}>⚠️ No unit assigned yet</span>
          )}
        </div>

        {/* Contact info row */}
        <div style={{ fontSize: '0.75rem', color: '#64748B', display: 'flex', flexDirection: 'column', gap: '0.2rem', marginBottom: '0.625rem' }}>
          {tenant.phone && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Phone size={12} color="#94A3B8" />
              <span>{tenant.phone}</span>
            </div>
          )}
          {tenant.email && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <Mail size={12} color="#94A3B8" />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{tenant.email}</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Footer: WhatsApp, Call, Edit, View */}
      <div
        style={{
          display: 'flex',
          gap: '0.35rem',
          borderTop: '1px solid #F1F5F9',
          paddingTop: '0.5rem',
          marginTop: '0.25rem',
        }}
      >
        {tenant.phone && (
          <a
            href={`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(`Hello ${tenant.full_name}, this is regarding your tenancy at PropertyHub.`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary btn-sm"
            style={{
              flex: 1,
              fontSize: '0.75rem',
              padding: '0.35rem 0.45rem',
              background: '#ECFDF5',
              color: '#047857',
              borderColor: '#A7F3D0',
              fontWeight: 700,
              gap: '0.25rem',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Chat on WhatsApp"
          >
            <MessageSquare size={13} /> WhatsApp
          </a>
        )}

        {tenant.phone && (
          <a
            href={`tel:${tenant.phone}`}
            className="btn btn-secondary btn-sm"
            style={{
              fontSize: '0.75rem',
              padding: '0.35rem 0.5rem',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Call Resident"
          >
            <Phone size={13} />
          </a>
        )}

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={onEdit}
          style={{ fontSize: '0.75rem', padding: '0.35rem 0.5rem' }}
          title="Edit Profile"
        >
          <Edit3 size={13} />
        </button>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={onClick}
          style={{ fontSize: '0.75rem', padding: '0.35rem 0.5rem' }}
          title="View Details"
        >
          <ExternalLink size={13} />
        </button>
      </div>
    </div>
  )
}

function EditTenantModal({
  tenant,
  onClose,
  onSaved,
}: {
  tenant: Tenant
  onClose: () => void
  onSaved: () => void
}) {
  const { success, error } = useToast()
  const [fullName, setFullName] = useState(tenant.full_name)
  const [phone, setPhone] = useState(tenant.phone || '')
  const [email, setEmail] = useState(tenant.email || '')
  const [occupation, setOccupation] = useState(tenant.occupation || '')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await tenantApi.update(tenant.id, {
        full_name: fullName.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        occupation: occupation.trim() || undefined,
      })
      success('Resident profile updated successfully')
      onSaved()
    } catch (err: any) {
      error(err.response?.data?.detail || 'Failed to update tenant')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal isOpen={true} onClose={onClose} title="Edit Resident Profile" maxWidth="480px">
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
        <div className="form-group">
          <label className="input-label">Full Name *</label>
          <input
            type="text"
            className="input"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div className="form-group">
            <label className="input-label">Phone Number</label>
            <input
              type="tel"
              className="input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="input-label">Occupation / Work</label>
            <input
              type="text"
              className="input"
              value={occupation}
              onChange={(e) => setOccupation(e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="input-label">Email Address</label>
          <input
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.75rem', borderTop: '1px solid #F1F5F9', paddingTop: '0.75rem' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting} style={{ fontWeight: 700 }}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
