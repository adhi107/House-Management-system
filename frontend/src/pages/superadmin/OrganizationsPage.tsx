import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { superAdminApi } from '../../api/client'
import { Organization, OrganizationStatus, OrganizationPlan } from '../../types'
import { MobilePage } from '../../components/layout/AppShell'
import { MobileHeader } from '../../components/navigation'
import { formatDate, EmptyState, ErrorState, SkeletonCard, Modal } from '../../components/ui'
import { useToast } from '../../contexts/ToastContext'
import {
  Building,
  Plus,
  Search,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  ShieldAlert,
  User,
  Power,
  Edit3,
  Save,
  Building2,
  Users,
  Home,
  ExternalLink,
} from 'lucide-react'
import { AxiosError } from 'axios'

const STATUS_FILTERS = [
  { key: '', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'suspended', label: 'Suspended' },
  { key: 'inactive', label: 'Inactive' },
]

export default function OrganizationsPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { success, error } = useToast()

  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(searchParams.get('new') === 'true')
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null)
  const [statusChangeOrg, setStatusChangeOrg] = useState<Organization | null>(null)
  const [suspensionReason, setSuspensionReason] = useState('')

  // Form
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [plan, setPlan] = useState<OrganizationPlan>('starter')
  const [ownerName, setOwnerName] = useState('')
  const [ownerEmail, setOwnerEmail] = useState('')
  const [ownerPhone, setOwnerPhone] = useState('')
  const [ownerPassword, setOwnerPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadData = async () => {
    setIsLoading(true)
    setHasError(false)
    try {
      const res = await superAdminApi.listOrganizations({
        status: statusFilter || undefined,
        search: searchQuery || undefined,
      })
      setOrganizations(res.data.data || [])
    } catch {
      setHasError(true)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [statusFilter, searchQuery])

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !code) {
      error('Please provide Organization Name and Code')
      return
    }

    setIsSubmitting(true)
    try {
      await superAdminApi.createOrganization({
        name,
        organization_code: code,
        plan,
        owner_name: ownerName || undefined,
        owner_email: ownerEmail || undefined,
        owner_phone: ownerPhone || undefined,
        owner_password: ownerPassword || undefined,
      })
      success('Organization created successfully!')
      setShowCreateModal(false)
      setName('')
      setCode('')
      setOwnerName('')
      setOwnerEmail('')
      setOwnerPassword('')
      loadData()
    } catch (err: any) {
      error(err.response?.data?.detail || 'Failed to create organization')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStatusUpdate = async () => {
    if (!statusChangeOrg) return
    const newStatus: OrganizationStatus = statusChangeOrg.status === 'active' ? 'suspended' : 'active'

    setIsSubmitting(true)
    try {
      await superAdminApi.updateOrganizationStatus(statusChangeOrg.id, {
        status: newStatus,
        reason: suspensionReason || undefined,
      })
      success(`Organization ${newStatus === 'active' ? 'activated' : 'suspended'} successfully!`)
      setStatusChangeOrg(null)
      setSuspensionReason('')
      loadData()
    } catch (err: any) {
      error(err.response?.data?.detail || 'Failed to update organization status')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getPlanBadge = (p: string) => {
    const pl = (p || '').toLowerCase()
    if (pl === 'enterprise') {
      return { bg: '#EEF2FF', color: '#4338CA', border: '#C7D2FE', label: 'Enterprise' }
    }
    if (pl === 'growth') {
      return { bg: '#E0F2FE', color: '#0369A1', border: '#BAE6FD', label: 'Growth' }
    }
    return { bg: '#ECFDF5', color: '#047857', border: '#A7F3D0', label: 'Starter' }
  }

  return (
    <MobilePage
      role="super_admin"
      header={
        <MobileHeader
          title="Organizations"
          rightAction={
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setShowCreateModal(true)}
              style={{ gap: '0.25rem' }}
            >
              <Plus size={16} /> New Org
            </button>
          }
        />
      }
    >
      {/* Desktop Header */}
      <div className="module-header hidden-mobile">
        <div className="module-header-info">
          <h1 className="module-header-title">
            Organizations ({organizations.length})
          </h1>
          <p className="module-header-subtitle">
            Manage multi-tenant SaaS clients, subscription plans, quotas, and owner accounts
          </p>
        </div>

        <div className="module-header-action">
          <button
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
            style={{ gap: '0.375rem' }}
          >
            <Plus size={16} /> New Organization
          </button>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div style={{ position: 'relative', marginBottom: '1rem', width: '100%' }}>
        <Search
          size={16}
          style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}
        />
        <input
          type="search"
          className="input"
          style={{ paddingLeft: 42, background: '#FFFFFF', borderRadius: 'var(--radius-full)' }}
          placeholder="Search by name, organization code, or owner..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Tabs */}
      <div className="tabs-scroll" style={{ marginBottom: '1rem' }}>
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.key}
            className={`tab-item ${statusFilter === f.key ? 'active' : ''}`}
            onClick={() => setStatusFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Organizations Grid */}
      <div className="cards-grid">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : hasError ? (
          <ErrorState onRetry={loadData} />
        ) : organizations.length === 0 ? (
          <div style={{ gridColumn: '1 / -1' }}>
            <EmptyState
              icon={<Building size={32} />}
              title="No organizations found"
              description="Create your first organization to onboard an owner."
              action={
                <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                  <Plus size={18} /> New Organization
                </button>
              }
            />
          </div>
        ) : (
          organizations.map((org) => {
            const isSuspended = org.status === 'suspended'
            const isActive = org.status === 'active'
            const planBadge = getPlanBadge(org.plan)

            return (
              <div
                key={org.id}
                className="card card-hover"
                style={{
                  padding: '0.875rem 1rem',
                  borderLeft: `3.5px solid ${isActive ? '#10B981' : isSuspended ? '#E11D48' : '#64748B'}`,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '0.625rem',
                  background: '#FFFFFF',
                }}
              >
                {/* Header Row */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.375rem' }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap' }}>
                        <h3 style={{ fontWeight: 800, fontSize: '0.9375rem', margin: 0, color: '#0F172A', letterSpacing: '-0.01em' }}>
                          {org.name}
                        </h3>
                        <span
                          style={{
                            fontSize: '0.625rem',
                            fontWeight: 800,
                            padding: '0.1rem 0.375rem',
                            borderRadius: 4,
                            background: planBadge.bg,
                            color: planBadge.color,
                            border: `1px solid ${planBadge.border}`,
                            textTransform: 'uppercase',
                          }}
                        >
                          {planBadge.label}
                        </span>
                      </div>

                      <p style={{ fontSize: '0.6875rem', color: '#64748B', margin: '0.15rem 0 0' }}>
                        Code: <strong style={{ color: '#0F172A' }}>{org.organization_code}</strong> • {formatDate(org.created_at)}
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0 }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingOrg(org)
                        }}
                        className="btn btn-ghost btn-sm"
                        style={{
                          padding: '0.15rem 0.4rem',
                          height: 24,
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          borderRadius: 4,
                          gap: '0.2rem',
                          color: '#2563EB',
                          background: '#EFF6FF',
                          border: '1px solid #DBEAFE',
                        }}
                        title="Edit organization"
                      >
                        <Edit3 size={12} />
                        <span>Edit</span>
                      </button>

                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          padding: '0.15rem 0.45rem',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '0.625rem',
                          fontWeight: 800,
                          background: isActive ? '#ECFDF5' : isSuspended ? '#FFF1F2' : '#F1F5F9',
                          color: isActive ? '#059669' : isSuspended ? '#E11D48' : '#64748B',
                          border: `1px solid ${isActive ? '#A7F3D0' : isSuspended ? '#FECDD3' : '#E2E8F0'}`,
                          textTransform: 'uppercase',
                        }}
                      >
                        {org.status}
                      </span>
                    </div>
                  </div>

                  {/* Owner info capsule */}
                  <div style={{ background: '#F8FAFC', padding: '0.375rem 0.5rem', borderRadius: 'var(--radius-xs)', border: '1px solid #F1F5F9', marginTop: '0.5rem' }}>
                    <p style={{ fontSize: '0.6875rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <User size={12} color="#64748B" style={{ flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <strong>{org.owner_name || 'Unassigned'}</strong> {org.owner_email ? `(${org.owner_email})` : ''}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Metric Counts Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.375rem', textAlign: 'center' }}>
                  <div style={{ background: '#F8FAFC', border: '1px solid #F1F5F9', borderRadius: 'var(--radius-sm)', padding: '0.375rem 0.25rem' }}>
                    <p style={{ fontWeight: 800, fontSize: '0.875rem', margin: 0, color: '#0F172A', fontVariantNumeric: 'tabular-nums' }}>{org.buildings_count || 0}</p>
                    <p style={{ fontSize: '0.625rem', color: '#64748B', margin: 0, fontWeight: 600 }}>Buildings</p>
                  </div>
                  <div style={{ background: '#F8FAFC', border: '1px solid #F1F5F9', borderRadius: 'var(--radius-sm)', padding: '0.375rem 0.25rem' }}>
                    <p style={{ fontWeight: 800, fontSize: '0.875rem', margin: 0, color: '#0F172A', fontVariantNumeric: 'tabular-nums' }}>{org.units_count || 0}</p>
                    <p style={{ fontSize: '0.625rem', color: '#64748B', margin: 0, fontWeight: 600 }}>Units</p>
                  </div>
                  <div style={{ background: '#F8FAFC', border: '1px solid #F1F5F9', borderRadius: 'var(--radius-sm)', padding: '0.375rem 0.25rem' }}>
                    <p style={{ fontWeight: 800, fontSize: '0.875rem', margin: 0, color: '#0F172A', fontVariantNumeric: 'tabular-nums' }}>{org.tenants_count || 0}</p>
                    <p style={{ fontSize: '0.625rem', color: '#64748B', margin: 0, fontWeight: 600 }}>Tenants</p>
                  </div>
                </div>

                {/* Actions Row */}
                <div style={{ display: 'flex', gap: '0.375rem', borderTop: '1px solid #F1F5F9', paddingTop: '0.5rem', alignItems: 'center' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1, gap: '0.25rem', height: 28, fontSize: '0.75rem' }}
                    onClick={() => navigate(`/super-admin/organizations/${org.id}`)}
                  >
                    <ExternalLink size={12} /> View Details
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{
                      height: 28,
                      padding: '0 0.5rem',
                      fontSize: '0.6875rem',
                      color: isActive ? '#E11D48' : '#059669',
                      background: isActive ? '#FFF1F2' : '#ECFDF5',
                      border: `1px solid ${isActive ? '#FECDD3' : '#A7F3D0'}`,
                      gap: '0.25rem',
                    }}
                    onClick={() => setStatusChangeOrg(org)}
                  >
                    <Power size={12} /> {isActive ? 'Suspend' : 'Activate'}
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Create Organization Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create New Organization">
        <form onSubmit={handleCreateOrg}>
          <div className="form-group">
            <label className="input-label">Organization Name</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Apex Property Group"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (!code) {
                  setCode(`ORG-${e.target.value.substring(0, 4).toUpperCase()}`)
                }
              }}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="input-label">Organization Code</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. ORG-APEX"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                required
              />
            </div>
            <div className="form-group">
              <label className="input-label">Subscription Plan</label>
              <select
                className="input"
                value={plan}
                onChange={(e) => setPlan(e.target.value as OrganizationPlan)}
              >
                <option value="starter">Starter Plan</option>
                <option value="growth">Growth Plan</option>
                <option value="enterprise">Enterprise Plan</option>
              </select>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '0.875rem', marginTop: '0.5rem' }}>
            <p style={{ fontWeight: 700, fontSize: '0.8125rem', color: '#0F172A', marginBottom: '0.5rem' }}>
              Primary Owner Account (Optional)
            </p>
            <div className="form-group">
              <label className="input-label">Owner Full Name</label>
              <input
                type="text"
                className="input"
                placeholder="Vikramaditya Rao"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="input-label">Owner Email</label>
                <input
                  type="email"
                  className="input"
                  placeholder="owner@company.com"
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="input-label">Owner Password</label>
                <input
                  type="password"
                  className="input"
                  placeholder="Temporary password"
                  value={ownerPassword}
                  onChange={(e) => setOwnerPassword(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowCreateModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Organization'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Organization Modal */}
      {editingOrg && (
        <EditOrganizationModal
          org={editingOrg}
          isOpen={!!editingOrg}
          onClose={() => setEditingOrg(null)}
          onSuccess={() => {
            setEditingOrg(null)
            loadData()
          }}
        />
      )}

      {/* Status Change Confirm Modal */}
      <Modal
        isOpen={!!statusChangeOrg}
        onClose={() => {
          setStatusChangeOrg(null)
          setSuspensionReason('')
        }}
        title={`${statusChangeOrg?.status === 'active' ? 'Suspend' : 'Activate'} Organization`}
      >
        <p style={{ color: '#64748B', lineHeight: 1.6 }}>
          {statusChangeOrg?.status === 'active'
            ? `Suspending ${statusChangeOrg?.name} will prevent all owners, property managers, and tenants in this organization from logging in.`
            : `Re-activating ${statusChangeOrg?.name} will restore login access for all users in this organization.`}
        </p>

        {statusChangeOrg?.status === 'active' && (
          <div className="form-group" style={{ marginTop: '0.75rem' }}>
            <label className="input-label">Reason for Suspension (Optional)</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Non-payment, violation of terms"
              value={suspensionReason}
              onChange={(e) => setSuspensionReason(e.target.value)}
            />
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
          <button
            className="btn btn-secondary"
            style={{ flex: 1 }}
            onClick={() => {
              setStatusChangeOrg(null)
              setSuspensionReason('')
            }}
          >
            Cancel
          </button>
          <button
            className={`btn ${statusChangeOrg?.status === 'active' ? 'btn-danger' : 'btn-primary'}`}
            style={{ flex: 1 }}
            onClick={handleStatusUpdate}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Updating...' : `Confirm ${statusChangeOrg?.status === 'active' ? 'Suspension' : 'Activation'}`}
          </button>
        </div>
      </Modal>
    </MobilePage>
  )
}

function EditOrganizationModal({
  org,
  isOpen,
  onClose,
  onSuccess,
}: {
  org: Organization
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}) {
  const { success, error } = useToast()
  const [name, setName] = useState(org.name || '')
  const [plan, setPlan] = useState<OrganizationPlan>((org.plan as OrganizationPlan) || 'starter')
  const [status, setStatus] = useState<OrganizationStatus>((org.status as OrganizationStatus) || 'active')
  const [maxProperties, setMaxProperties] = useState(String(org.max_properties || '10'))
  const [maxUnits, setMaxUnits] = useState(String(org.max_units || '50'))
  const [subdomain, setSubdomain] = useState(org.subdomain || '')
  const [notes, setNotes] = useState(org.notes || '')
  const [ownerName, setOwnerName] = useState(org.owner_name || '')
  const [ownerEmail, setOwnerEmail] = useState(org.owner_email || '')
  const [ownerPhone, setOwnerPhone] = useState(org.owner_phone || '')
  
  // Feature Entitlements
  const [featureWhatsApp, setFeatureWhatsApp] = useState(true)
  const [featureUPI, setFeatureUPI] = useState(true)
  const [featureAgreements, setFeatureAgreements] = useState(true)
  const [featureBIReports, setFeatureBIReports] = useState(true)

  const [isLoading, setIsLoading] = useState(false)

  const handlePlanSelect = (selectedPlan: OrganizationPlan) => {
    setPlan(selectedPlan)
    if (selectedPlan === 'starter') {
      setMaxProperties('5')
      setMaxUnits('25')
    } else if (selectedPlan === 'growth') {
      setMaxProperties('20')
      setMaxUnits('150')
    } else if (selectedPlan === 'enterprise') {
      setMaxProperties('100')
      setMaxUnits('1000')
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      error('Organization name is required')
      return
    }

    setIsLoading(true)
    try {
      await superAdminApi.updateOrganization(org.id, {
        name: name.trim(),
        plan,
        status,
        max_properties: parseInt(maxProperties) || 10,
        max_units: parseInt(maxUnits) || 50,
        subdomain: subdomain.trim() || undefined,
        notes: notes.trim() || undefined,
        owner_name: ownerName.trim() || undefined,
        owner_email: ownerEmail.trim() || undefined,
        owner_phone: ownerPhone.trim() || undefined,
        settings: {
          feature_whatsapp: featureWhatsApp,
          feature_upi: featureUPI,
          feature_agreements: featureAgreements,
          feature_bi_reports: featureBIReports,
        },
      })
      success(`Organization "${name}" updated successfully!`)
      onSuccess()
      onClose()
    } catch (err) {
      const axiosErr = err as AxiosError<{ detail: string }>
      error(axiosErr.response?.data?.detail || 'Failed to update organization')
    } finally {
      setIsLoading(false)
    }
  }

  const cleanPhone = (p?: string) => p?.replace(/\D/g, '') || ''

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit ${org.name}`} maxWidth="580px">
      <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        
        {/* Top Header Badge Card */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.875rem 1rem',
            borderRadius: '0.625rem',
            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
            color: '#FFFFFF',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Building2 size={18} color="#38BDF8" />
              <span style={{ fontWeight: 900, fontSize: '1.0625rem', letterSpacing: '-0.01em' }}>
                {name || org.name}
              </span>
              <span style={{ fontSize: '0.6875rem', fontWeight: 800, padding: '0.15rem 0.45rem', borderRadius: 4, background: 'rgba(255,255,255,0.15)', color: '#BAE6FD' }}>
                {org.organization_code}
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#94A3B8', margin: '0.2rem 0 0' }}>
              Plan: <strong style={{ color: '#F8FAFC', textTransform: 'uppercase' }}>{plan}</strong> • Created: {formatDate(org.created_at)}
            </p>
          </div>

          <div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as OrganizationStatus)}
              style={{
                background: status === 'active' ? '#065F46' : status === 'suspended' ? '#9F1239' : '#1E293B',
                color: '#FFFFFF',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '0.375rem',
                fontSize: '0.75rem',
                fontWeight: 800,
                padding: '0.35rem 0.65rem',
                cursor: 'pointer',
              }}
            >
              <option value="active">🟢 Active</option>
              <option value="suspended">🔴 Suspended</option>
              <option value="inactive">⚪ Inactive</option>
            </select>
          </div>
        </div>

        {/* Organization Name & Code */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '0.75rem' }}>
          <div className="form-group">
            <label className="input-label" style={{ fontWeight: 700, fontSize: '0.8125rem' }}>Organization Name *</label>
            <input
              type="text"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="input-label" style={{ fontWeight: 700, fontSize: '0.8125rem' }}>Client Code</label>
            <input
              type="text"
              className="input"
              value={org.organization_code}
              disabled
              style={{ background: '#F1F5F9', color: '#64748B', fontWeight: 700 }}
            />
          </div>
        </div>

        {/* Interactive Subscription Plan Tier Cards */}
        <div>
          <label className="input-label" style={{ fontWeight: 700, fontSize: '0.8125rem', marginBottom: '0.35rem', display: 'block' }}>
            Subscription Tier / Plan *
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
            {[
              { id: 'starter', label: 'Starter', price: '₹1,499/mo', desc: 'Up to 5 Props • 25 Units' },
              { id: 'growth', label: 'Growth', price: '₹3,999/mo', desc: 'Up to 20 Props • 150 Units' },
              { id: 'enterprise', label: 'Enterprise', price: '₹9,999/mo', desc: 'Unlimited Props & Units' },
            ].map((p) => {
              const isSelected = plan === p.id
              return (
                <div
                  key={p.id}
                  onClick={() => handlePlanSelect(p.id as OrganizationPlan)}
                  style={{
                    padding: '0.625rem 0.5rem',
                    borderRadius: '0.5rem',
                    border: isSelected ? '2px solid #2563EB' : '1px solid #E2E8F0',
                    background: isSelected ? '#EFF6FF' : '#FFFFFF',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <p style={{ fontWeight: 800, fontSize: '0.8125rem', margin: 0, color: isSelected ? '#1D4ED8' : '#0F172A' }}>
                    {p.label}
                  </p>
                  <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: isSelected ? '#2563EB' : '#059669', margin: '0.1rem 0' }}>
                    {p.price}
                  </p>
                  <p style={{ fontSize: '0.625rem', color: '#64748B', margin: 0 }}>
                    {p.desc}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Quota Limits: Max Properties & Max Units */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', background: '#F8FAFC', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #E2E8F0' }}>
          <div className="form-group">
            <label className="input-label" style={{ fontWeight: 700, fontSize: '0.8125rem' }}>Max Buildings / Properties</label>
            <input
              type="number"
              className="input"
              min={1}
              value={maxProperties}
              onChange={(e) => setMaxProperties(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="input-label" style={{ fontWeight: 700, fontSize: '0.8125rem' }}>Max Units / Flats</label>
            <input
              type="number"
              className="input"
              min={1}
              value={maxUnits}
              onChange={(e) => setMaxUnits(e.target.value)}
            />
          </div>
        </div>

        {/* Owner Contact Information & Communication */}
        <div style={{ background: '#FFFFFF', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #E2E8F0' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0F172A', display: 'block', marginBottom: '0.5rem' }}>
            👤 Assigned Landlord / Organization Owner
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <div className="form-group">
              <label className="input-label" style={{ fontSize: '0.75rem' }}>Owner Full Name</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Ramesh Patel"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="input-label" style={{ fontSize: '0.75rem' }}>Owner Phone</label>
              <input
                type="tel"
                className="input"
                placeholder="e.g. 9876543210"
                value={ownerPhone}
                onChange={(e) => setOwnerPhone(e.target.value)}
              />
            </div>
          </div>

          {ownerPhone && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <a
                href={`https://wa.me/${cleanPhone(ownerPhone)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost btn-sm"
                style={{ flex: 1, background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', fontSize: '0.6875rem', textDecoration: 'none', justifyContent: 'center' }}
              >
                💬 WhatsApp Owner
              </a>
              <a
                href={`tel:${ownerPhone}`}
                className="btn btn-ghost btn-sm"
                style={{ flex: 1, background: '#F8FAFC', color: '#334155', border: '1px solid #E2E8F0', fontSize: '0.6875rem', textDecoration: 'none', justifyContent: 'center' }}
              >
                📞 Direct Call
              </a>
            </div>
          )}
        </div>

        {/* Feature Entitlements Toggles */}
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0F172A', display: 'block', marginBottom: '0.35rem' }}>
            ⚡ Platform Feature Entitlements
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.75rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', background: '#F8FAFC', padding: '0.35rem 0.5rem', borderRadius: '0.375rem', border: '1px solid #E2E8F0' }}>
              <input type="checkbox" checked={featureWhatsApp} onChange={(e) => setFeatureWhatsApp(e.target.checked)} />
              <span>WhatsApp Alerts</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', background: '#F8FAFC', padding: '0.35rem 0.5rem', borderRadius: '0.375rem', border: '1px solid #E2E8F0' }}>
              <input type="checkbox" checked={featureUPI} onChange={(e) => setFeatureUPI(e.target.checked)} />
              <span>UPI Payment Gateway</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', background: '#F8FAFC', padding: '0.35rem 0.5rem', borderRadius: '0.375rem', border: '1px solid #E2E8F0' }}>
              <input type="checkbox" checked={featureAgreements} onChange={(e) => setFeatureAgreements(e.target.checked)} />
              <span>Digital Lease & E-Sign</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', background: '#F8FAFC', padding: '0.35rem 0.5rem', borderRadius: '0.375rem', border: '1px solid #E2E8F0' }}>
              <input type="checkbox" checked={featureBIReports} onChange={(e) => setFeatureBIReports(e.target.checked)} />
              <span>BI Analytics & CSV</span>
            </label>
          </div>
        </div>

        {/* Custom Subdomain */}
        <div className="form-group">
          <label className="input-label" style={{ fontWeight: 700, fontSize: '0.8125rem' }}>Custom Subdomain</label>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <input
              type="text"
              className="input"
              placeholder="e.g. bluehorizon"
              value={subdomain}
              onChange={(e) => setSubdomain(e.target.value)}
              style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
            />
            <span style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', borderLeft: 'none', padding: '0.5rem 0.65rem', fontSize: '0.75rem', color: '#64748B', fontWeight: 600, borderTopRightRadius: '0.375rem', borderBottomRightRadius: '0.375rem' }}>
              .propertyhub.app
            </span>
          </div>
        </div>

        {/* Admin Notes */}
        <div className="form-group">
          <label className="input-label" style={{ fontWeight: 700, fontSize: '0.8125rem' }}>Internal Admin Notes</label>
          <textarea
            className="input"
            rows={2}
            style={{ height: 'auto', padding: '0.5rem 0.75rem' }}
            placeholder="Add internal notes about this account..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', borderTop: '1px solid #F1F5F9', paddingTop: '0.75rem' }}>
          <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose} disabled={isLoading}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" style={{ flex: 1.5, gap: '0.375rem', background: '#0F172A', borderColor: '#0F172A', fontWeight: 800 }} disabled={isLoading}>
            <Save size={15} />
            {isLoading ? 'Saving Changes...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
