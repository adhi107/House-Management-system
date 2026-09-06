import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, User, Home, Phone, Mail, Edit3, Check, X, ExternalLink, Briefcase } from 'lucide-react'
import { tenantApi } from '../../api/client'
import { Tenant } from '../../types'
import { MobilePage } from '../../components/layout/AppShell'
import { MobileHeader } from '../../components/navigation'
import { formatCurrency, EmptyState, ErrorState, SkeletonCard, StatusBadge, Avatar } from '../../components/ui'

export default function TenantsPage() {
  const navigate = useNavigate()
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)
  const [search, setSearch] = useState('')
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null)
  const [total, setTotal] = useState(0)

  const load = async (q = search) => {
    setIsLoading(true)
    setError(false)
    try {
      const res = await tenantApi.list({ search: q || undefined, per_page: 50 })
      setTenants(res.data.data || [])
      setTotal(res.data.total || (res.data.data ? res.data.data.length : 0))
    } catch {
      setError(true)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleSearch = (v: string) => {
    setSearch(v)
    if (v.length === 0 || v.length >= 2) load(v)
  }

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
      <div className="module-header hidden-mobile">
        <div className="module-header-info">
          <h1 className="module-header-title">
            Tenants & Residents ({total})
          </h1>
          <p className="module-header-subtitle">
            Manage active residents, leases, contact details, and payment statuses
          </p>
        </div>

        <div className="module-header-action">
          <button
            className="btn btn-primary"
            onClick={() => navigate('/owner/tenants/new')}
            style={{ gap: '0.375rem' }}
          >
            <Plus size={16} /> Add Tenant
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div style={{ position: 'relative', marginBottom: '1rem' }}>
        <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgb(var(--muted-foreground))', pointerEvents: 'none' }} />
        <input
          type="search"
          className="input"
          style={{ paddingLeft: 44 }}
          placeholder="Search tenants by name, phone, or unit..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          aria-label="Search tenants"
        />
      </div>

      <div style={{ marginBottom: '0.875rem', fontSize: '0.8125rem', color: 'rgb(var(--muted-foreground))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Showing {tenants.length} of {total} tenant{total !== 1 ? 's' : ''}</span>
        <button
          className="btn btn-secondary btn-sm mobile-only"
          onClick={() => navigate('/owner/tenants/new')}
          style={{ gap: '0.25rem', fontSize: '0.75rem' }}
        >
          <Plus size={13} /> Add Tenant
        </button>
      </div>

      {isLoading ? (
        <div className="cards-grid">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : error ? (
        <ErrorState onRetry={load} />
      ) : tenants.length === 0 ? (
        <EmptyState
          icon={<User size={32} />}
          title="No tenants found"
          description={search ? `No tenants matched "${search}"` : "Add your first tenant to start managing units and rent."}
          action={
            <button className="btn btn-primary" onClick={() => navigate('/owner/tenants/new')}>
              <Plus size={18} /> Add Tenant
            </button>
          }
        />
      ) : (
        <div className="cards-grid">
          {tenants.map((t) => (
            <TenantCard
              key={t.id}
              tenant={t}
              onClick={() => navigate(`/owner/tenants/${t.id}`)}
              onEdit={() => setEditingTenant(t)}
            />
          ))}
        </div>
      )}

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
  return (
    <div
      className="card card-hover"
      style={{
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        minHeight: 185,
        borderRadius: 'var(--radius)',
        position: 'relative',
      }}
    >
      {/* Top row: Avatar + Name + Status */}
      <div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.625rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', minWidth: 0, flex: 1 }}>
            <Avatar name={tenant.full_name} src={tenant.profile_photo} size="sm" />
            <div style={{ minWidth: 0, flex: 1 }}>
              <h3
                onClick={onClick}
                style={{
                  fontWeight: 700,
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
                <div style={{ fontSize: '0.75rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: 3, marginTop: 1 }}>
                  <Briefcase size={11} /> {tenant.occupation}
                </div>
              )}
            </div>
          </div>
          {tenant.current_rent_status ? (
            <StatusBadge status={tenant.current_rent_status} />
          ) : (
            <span className="badge badge-success" style={{ fontSize: '0.6875rem' }}>Active</span>
          )}
        </div>

        {/* Flat / Property location */}
        <div style={{ marginBottom: '0.5rem' }}>
          {tenant.unit_number ? (
            <div style={{ fontSize: '0.8125rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.375rem', fontWeight: 500 }}>
              <Home size={13} style={{ color: '#0284C7', flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                Flat {tenant.unit_number} • {tenant.property_name || 'Building'}
              </span>
            </div>
          ) : (
            <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>No unit assigned</span>
          )}
        </div>

        {/* Contact info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '0.625rem', fontSize: '0.75rem', color: '#64748B' }}>
          {tenant.phone && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <Phone size={12} style={{ color: '#94A3B8' }} />
              <a href={`tel:${tenant.phone}`} style={{ color: 'inherit', textDecoration: 'none' }} onClick={(e) => e.stopPropagation()}>
                {tenant.phone}
              </a>
            </div>
          )}
          {tenant.email && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <Mail size={12} style={{ color: '#94A3B8', flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{tenant.email}</span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom row: Rent + Action Buttons */}
      <div
        style={{
          borderTop: '1px solid #F1F5F9',
          paddingTop: '0.625rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem',
        }}
      >
        <div>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', display: 'block', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>
            Monthly Rent
          </span>
          <span style={{ fontWeight: 700, fontSize: '0.9375rem', fontVariantNumeric: 'tabular-nums', color: '#0F172A' }}>
            {tenant.monthly_rent ? formatCurrency(tenant.monthly_rent) : '—'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={(e) => {
              e.stopPropagation()
              onEdit()
            }}
            style={{
              padding: '0.3rem 0.6rem',
              fontSize: '0.75rem',
              gap: '0.25rem',
              fontWeight: 600,
            }}
            title="Edit Tenant"
          >
            <Edit3 size={13} /> Edit
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={(e) => {
              e.stopPropagation()
              onClick()
            }}
            style={{
              padding: '0.3rem 0.5rem',
              fontSize: '0.75rem',
            }}
            title="View Details"
          >
            <ExternalLink size={13} />
          </button>
        </div>
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
  const [formData, setFormData] = useState({
    full_name: tenant.full_name || '',
    phone: tenant.phone || '',
    email: tenant.email || '',
    occupation: tenant.occupation || '',
    monthly_rent: tenant.monthly_rent ? String(tenant.monthly_rent) : '',
    permanent_address: tenant.permanent_address || '',
    emergency_contact_name: tenant.emergency_contact_name || '',
    emergency_contact_phone: tenant.emergency_contact_phone || '',
    notes: tenant.notes || '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      await tenantApi.update(tenant.id, {
        full_name: formData.full_name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined,
        occupation: formData.occupation.trim() || undefined,
        monthly_rent: formData.monthly_rent ? parseFloat(formData.monthly_rent) : undefined,
        permanent_address: formData.permanent_address.trim() || undefined,
        emergency_contact_name: formData.emergency_contact_name.trim() || undefined,
        emergency_contact_phone: formData.emergency_contact_phone.trim() || undefined,
        notes: formData.notes.trim() || undefined,
      })
      onSaved()
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to update tenant details')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '520px',
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: '#ffffff',
          borderRadius: '1rem',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          padding: '1.5rem',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0, color: '#0F172A' }}>
              Edit Tenant
            </h2>
            <p style={{ fontSize: '0.8125rem', color: '#64748B', margin: '0.125rem 0 0 0' }}>
              Update contact info, occupation, and rent for {tenant.full_name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="btn btn-secondary btn-sm"
            style={{ padding: '0.375rem', borderRadius: '50%' }}
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div style={{ padding: '0.75rem 1rem', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', borderRadius: '0.5rem', fontSize: '0.8125rem', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
            <div>
              <label className="label" style={{ fontWeight: 600, fontSize: '0.8125rem', marginBottom: '0.25rem', display: 'block' }}>
                Full Name *
              </label>
              <input
                type="text"
                className="input"
                required
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              />
            </div>
            <div>
              <label className="label" style={{ fontWeight: 600, fontSize: '0.8125rem', marginBottom: '0.25rem', display: 'block' }}>
                Phone Number *
              </label>
              <input
                type="tel"
                className="input"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
            <div>
              <label className="label" style={{ fontWeight: 600, fontSize: '0.8125rem', marginBottom: '0.25rem', display: 'block' }}>
                Email Address
              </label>
              <input
                type="email"
                className="input"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="tenant@example.com"
              />
            </div>
            <div>
              <label className="label" style={{ fontWeight: 600, fontSize: '0.8125rem', marginBottom: '0.25rem', display: 'block' }}>
                Occupation
              </label>
              <input
                type="text"
                className="input"
                value={formData.occupation}
                onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                placeholder="e.g. Software Engineer"
              />
            </div>
          </div>

          <div>
            <label className="label" style={{ fontWeight: 600, fontSize: '0.8125rem', marginBottom: '0.25rem', display: 'block' }}>
              Monthly Rent (₹)
            </label>
            <input
              type="number"
              className="input"
              value={formData.monthly_rent}
              onChange={(e) => setFormData({ ...formData, monthly_rent: e.target.value })}
              placeholder="e.g. 15000"
            />
          </div>

          <div>
            <label className="label" style={{ fontWeight: 600, fontSize: '0.8125rem', marginBottom: '0.25rem', display: 'block' }}>
              Permanent Address
            </label>
            <textarea
              className="input"
              rows={2}
              value={formData.permanent_address}
              onChange={(e) => setFormData({ ...formData, permanent_address: e.target.value })}
              placeholder="Permanent home address..."
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
            <div>
              <label className="label" style={{ fontWeight: 600, fontSize: '0.8125rem', marginBottom: '0.25rem', display: 'block' }}>
                Emergency Contact Name
              </label>
              <input
                type="text"
                className="input"
                value={formData.emergency_contact_name}
                onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
              />
            </div>
            <div>
              <label className="label" style={{ fontWeight: 600, fontSize: '0.8125rem', marginBottom: '0.25rem', display: 'block' }}>
                Emergency Phone
              </label>
              <input
                type="tel"
                className="input"
                value={formData.emergency_contact_phone}
                onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting} style={{ gap: '0.375rem' }}>
              {isSubmitting ? 'Saving...' : <><Check size={16} /> Save Changes</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
