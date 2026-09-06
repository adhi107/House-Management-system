import React, { useState, useEffect } from 'react'
import { superAdminApi } from '../../api/client'
import { User, Organization } from '../../types'
import { MobilePage } from '../../components/layout/AppShell'
import { MobileHeader } from '../../components/navigation'
import { formatDate, EmptyState, ErrorState, SkeletonCard, Modal } from '../../components/ui'
import { useToast } from '../../contexts/ToastContext'
import { Users, Plus, Key, Search, Mail, Phone, Building2, Edit3, Save, CheckCircle2 } from 'lucide-react'
import { AxiosError } from 'axios'

export default function OwnersPage() {
  const { success, error } = useToast()
  const [owners, setOwners] = useState<User[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingOwner, setEditingOwner] = useState<User | null>(null)
  const [resetOwner, setResetOwner] = useState<User | null>(null)
  const [newPassword, setNewPassword] = useState('')

  // Create Form State
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [selectedOrgId, setSelectedOrgId] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadData = async () => {
    setIsLoading(true)
    setHasError(false)
    try {
      const [ownersRes, orgsRes] = await Promise.all([
        superAdminApi.listOwners({ search: searchTerm || undefined }),
        superAdminApi.listOrganizations(),
      ])
      setOwners(ownersRes.data.data || [])
      setOrganizations(orgsRes.data.data || [])
    } catch {
      setHasError(true)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [searchTerm])

  const handleCreateOwner = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName || !email || !password || !selectedOrgId) {
      error('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)
    try {
      await superAdminApi.createOwner({
        full_name: fullName,
        email,
        phone,
        password,
        organization_id: selectedOrgId,
      })
      success('Owner account created successfully!')
      setShowCreateModal(false)
      setFullName('')
      setEmail('')
      setPhone('')
      setPassword('')
      loadData()
    } catch (err: any) {
      error(err.response?.data?.detail || 'Failed to create owner account')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resetOwner || !newPassword) return

    setIsSubmitting(true)
    try {
      await superAdminApi.resetOwnerPassword(resetOwner.id, newPassword)
      success(`Password reset for ${resetOwner.full_name}!`)
      setResetOwner(null)
      setNewPassword('')
    } catch (err: any) {
      error(err.response?.data?.detail || 'Failed to reset password')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <MobilePage
      role="super_admin"
      header={
        <MobileHeader
          title="Owner Accounts"
          rightAction={
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setShowCreateModal(true)}
              style={{ gap: '0.25rem' }}
            >
              <Plus size={16} /> New Owner
            </button>
          }
        />
      }
    >
      {/* Desktop Header */}
      <div className="module-header hidden-mobile">
        <div className="module-header-info">
          <h1 className="module-header-title">
            Owner Accounts ({owners.length})
          </h1>
          <p className="module-header-subtitle">
            Manage real estate owner logins, company associations, and security credentials
          </p>
        </div>

        <div className="module-header-action">
          <button
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
            style={{ gap: '0.375rem' }}
          >
            <Plus size={16} /> New Owner
          </button>
        </div>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '1rem', width: '100%' }}>
        <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
        <input
          type="search"
          className="input"
          style={{ paddingLeft: 42, background: '#FFFFFF', borderRadius: 'var(--radius-full)' }}
          placeholder="Search owners by name, email, or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Owners Cards Grid */}
      <div className="cards-grid">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : hasError ? (
          <ErrorState onRetry={loadData} />
        ) : owners.length === 0 ? (
          <div style={{ gridColumn: '1 / -1' }}>
            <EmptyState
              icon={<Users size={32} />}
              title="No owners found"
              description="Provision an owner account for an organization."
              action={
                <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                  <Plus size={18} /> New Owner
                </button>
              }
            />
          </div>
        ) : (
          owners.map((owner) => (
            <div
              key={owner.id}
              className="card card-hover"
              style={{
                padding: '0.875rem 1rem',
                borderLeft: '3.5px solid #10B981',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '0.625rem',
                background: '#FFFFFF',
              }}
            >
              {/* Header */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.375rem' }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <h4 style={{ fontWeight: 800, fontSize: '0.9375rem', margin: 0, color: '#0F172A', letterSpacing: '-0.01em' }}>
                      {owner.full_name}
                    </h4>
                    <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '0.15rem 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {owner.email}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0 }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingOwner(owner)
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
                      title="Edit owner details"
                    >
                      <Edit3 size={12} />
                      <span>Edit</span>
                    </button>

                    <span
                      style={{
                        fontSize: '0.625rem',
                        fontWeight: 800,
                        padding: '0.15rem 0.45rem',
                        borderRadius: 'var(--radius-full)',
                        background: '#ECFDF5',
                        color: '#059669',
                        border: '1px solid #A7F3D0',
                      }}
                    >
                      OWNER
                    </span>
                  </div>
                </div>

                {/* Organization and Phone details */}
                <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', color: '#334155' }}>
                    <Building2 size={13} color="#64748B" style={{ flexShrink: 0 }} />
                    <span style={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {owner.organization_name || 'No Organization'}
                    </span>
                  </div>

                  {owner.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.6875rem', color: '#64748B' }}>
                      <Phone size={12} color="#94A3B8" style={{ flexShrink: 0 }} />
                      <span>{owner.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions Row */}
              <div style={{ display: 'flex', gap: '0.375rem', borderTop: '1px solid #F1F5F9', paddingTop: '0.5rem', alignItems: 'center' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ flex: 1, gap: '0.3rem', height: 28, fontSize: '0.75rem' }}
                  onClick={() => setResetOwner(owner)}
                >
                  <Key size={12} /> Reset Password
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Owner Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create Owner Account">
        <form onSubmit={handleCreateOwner}>
          <div className="form-group">
            <label className="input-label">Assign to Organization</label>
            <select
              className="input"
              value={selectedOrgId}
              onChange={(e) => setSelectedOrgId(e.target.value)}
              required
            >
              <option value="">-- Choose Organization --</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name} ({org.organization_code})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="input-label">Full Name</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Vikramaditya Rao"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="input-label">Email Address</label>
              <input
                type="email"
                className="input"
                placeholder="owner@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="input-label">Phone Number</label>
              <input
                type="tel"
                className="input"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="input-label">Initial Password</label>
            <input
              type="password"
              className="input"
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowCreateModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Owner Modal */}
      {editingOwner && (
        <EditOwnerModal
          owner={editingOwner}
          organizations={organizations}
          isOpen={!!editingOwner}
          onClose={() => setEditingOwner(null)}
          onSuccess={() => {
            setEditingOwner(null)
            loadData()
          }}
        />
      )}

      {/* Reset Password Modal */}
      <Modal
        isOpen={!!resetOwner}
        onClose={() => {
          setResetOwner(null)
          setNewPassword('')
        }}
        title={`Reset Password — ${resetOwner?.full_name}`}
      >
        <form onSubmit={handleResetPassword}>
          <p style={{ color: '#64748B', fontSize: '0.8125rem', margin: '0 0 1rem' }}>
            Enter a new password for <strong>{resetOwner?.email}</strong>.
          </p>

          <div className="form-group">
            <label className="input-label">New Password</label>
            <input
              type="password"
              className="input"
              placeholder="Min. 8 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ flex: 1 }}
              onClick={() => {
                setResetOwner(null)
                setNewPassword('')
              }}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Set Password'}
            </button>
          </div>
        </form>
      </Modal>
    </MobilePage>
  )
}

function EditOwnerModal({
  owner,
  organizations,
  isOpen,
  onClose,
  onSuccess,
}: {
  owner: User
  organizations: Organization[]
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}) {
  const { success, error } = useToast()
  const [fullName, setFullName] = useState(owner.full_name || '')
  const [email, setEmail] = useState(owner.email || '')
  const [phone, setPhone] = useState(owner.phone || '')
  const [organizationId, setOrganizationId] = useState(owner.organization_id || '')
  const [isLoading, setIsLoading] = useState(false)

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim() || !email.trim()) {
      error('Full name and email are required')
      return
    }

    setIsLoading(true)
    try {
      await superAdminApi.updateOwner(owner.id, {
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        organization_id: organizationId || undefined,
      })
      success('Owner account updated successfully!')
      onSuccess()
    } catch (err) {
      const axiosErr = err as AxiosError<{ detail: string }>
      error(axiosErr.response?.data?.detail || 'Failed to update owner')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit ${owner.full_name}`} maxWidth="480px">
      <form onSubmit={handleUpdate}>
        <div className="form-group">
          <label className="input-label">Full Name</label>
          <input
            type="text"
            className="input"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div className="form-group">
            <label className="input-label">Email</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="input-label">Phone</label>
            <input
              type="tel"
              className="input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="input-label">Organization</label>
          <select
            className="input"
            value={organizationId}
            onChange={(e) => setOrganizationId(e.target.value)}
          >
            <option value="">-- Select Organization --</option>
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name} ({org.organization_code})
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
          <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose} disabled={isLoading}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" style={{ flex: 1, gap: '0.375rem' }} disabled={isLoading}>
            <Save size={15} />
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
