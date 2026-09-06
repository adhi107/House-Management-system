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
  const [status, setStatus] = useState(owner.is_active !== false ? 'active' : 'suspended')
  const [roleScope, setRoleScope] = useState('Full Administrator')
  const [showPasswordReset, setShowPasswordReset] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const selectedOrg = organizations.find((o) => o.id === organizationId)

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim() || !email.trim()) {
      error('Full name and email are required')
      return
    }

    setIsLoading(true)
    try {
      const payload: any = {
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        organization_id: organizationId || undefined,
        is_active: status === 'active',
      }

      await superAdminApi.updateOwner(owner.id, payload)

      if (showPasswordReset && newPassword.trim()) {
        if (newPassword.length < 6) {
          error('Password must be at least 6 characters')
          setIsLoading(false)
          return
        }
        await superAdminApi.resetOwnerPassword(owner.id, newPassword.trim())
      }

      success(`Landlord "${fullName}" account updated successfully!`)
      onSuccess()
      onClose()
    } catch (err) {
      const axiosErr = err as AxiosError<{ detail: string }>
      error(axiosErr.response?.data?.detail || 'Failed to update owner')
    } finally {
      setIsLoading(false)
    }
  }

  const cleanPhone = (p?: string) => p?.replace(/\D/g, '') || ''

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$'
    let pwd = ''
    for (let i = 0; i < 10; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setNewPassword(pwd)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit ${owner.full_name}`} maxWidth="560px">
      <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        
        {/* Top Header Profile Banner */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #2563EB, #10B981)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: '1.125rem',
              }}
            >
              {fullName.charAt(0) || 'L'}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ fontWeight: 900, fontSize: '1rem', color: '#FFFFFF' }}>
                  {fullName || owner.full_name}
                </span>
                <span style={{ fontSize: '0.625rem', fontWeight: 800, padding: '0.1rem 0.35rem', borderRadius: 4, background: 'rgba(255,255,255,0.2)', color: '#BAE6FD' }}>
                  OWNER
                </span>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#94A3B8', margin: '0.15rem 0 0' }}>
                {selectedOrg ? `${selectedOrg.name} (${selectedOrg.organization_code})` : 'Unassigned Organization'}
              </p>
            </div>
          </div>

          <div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={{
                background: status === 'active' ? '#065F46' : '#9F1239',
                color: '#FFFFFF',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '0.375rem',
                fontSize: '0.75rem',
                fontWeight: 800,
                padding: '0.35rem 0.6rem',
                cursor: 'pointer',
              }}
            >
              <option value="active">🟢 Active</option>
              <option value="suspended">🔴 Suspended</option>
            </select>
          </div>
        </div>

        {/* Full Name */}
        <div className="form-group">
          <label className="input-label" style={{ fontWeight: 700, fontSize: '0.8125rem' }}>Full Name *</label>
          <input
            type="text"
            className="input"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            placeholder="e.g. Vikramaditya Rao"
          />
        </div>

        {/* Email & Phone */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.75rem' }}>
          <div className="form-group">
            <label className="input-label" style={{ fontWeight: 700, fontSize: '0.8125rem' }}>Email Address *</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="input-label" style={{ fontWeight: 700, fontSize: '0.8125rem' }}>Phone Number</label>
            <input
              type="tel"
              className="input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +91 9876543210"
            />
          </div>
        </div>

        {/* Direct Contact Shortcuts */}
        {(phone || email) && (
          <div style={{ display: 'flex', gap: '0.5rem', background: '#F8FAFC', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #E2E8F0' }}>
            {phone && (
              <a
                href={`https://wa.me/${cleanPhone(phone)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost btn-sm"
                style={{ flex: 1, background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', fontSize: '0.75rem', textDecoration: 'none', justifyContent: 'center' }}
              >
                💬 WhatsApp Owner
              </a>
            )}
            {phone && (
              <a
                href={`tel:${phone}`}
                className="btn btn-ghost btn-sm"
                style={{ flex: 1, background: '#FFFFFF', color: '#334155', border: '1px solid #CBD5E1', fontSize: '0.75rem', textDecoration: 'none', justifyContent: 'center' }}
              >
                📞 Call Landlord
              </a>
            )}
            {email && (
              <a
                href={`mailto:${email}`}
                className="btn btn-ghost btn-sm"
                style={{ flex: 1, background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', fontSize: '0.75rem', textDecoration: 'none', justifyContent: 'center' }}
              >
                ✉️ Send Email
              </a>
            )}
          </div>
        )}

        {/* Organization Assignment */}
        <div className="form-group">
          <label className="input-label" style={{ fontWeight: 700, fontSize: '0.8125rem' }}>Associated Organization *</label>
          <select
            className="input"
            value={organizationId}
            onChange={(e) => setOrganizationId(e.target.value)}
          >
            <option value="">-- Choose Organization --</option>
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name} ({org.organization_code}) — {org.plan?.toUpperCase()} Plan
              </option>
            ))}
          </select>
        </div>

        {/* Security & Password Reset Section */}
        <div style={{ background: '#F8FAFC', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0F172A' }}>
              🔑 Security & Credentials
            </span>
            <button
              type="button"
              onClick={() => {
                setShowPasswordReset(!showPasswordReset)
                if (!showPasswordReset && !newPassword) generatePassword()
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#2563EB',
                fontWeight: 700,
                fontSize: '0.75rem',
                cursor: 'pointer',
              }}
            >
              {showPasswordReset ? 'Hide Password Box' : '+ Reset Password'}
            </button>
          </div>

          {showPasswordReset && (
            <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="text"
                className="input"
                placeholder="Enter new password (min. 6 chars)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={{ flex: 1, fontFamily: 'monospace', fontWeight: 600 }}
              />
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={generatePassword}
                style={{ fontSize: '0.6875rem', fontWeight: 700, whiteSpace: 'nowrap' }}
              >
                Auto Generate
              </button>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', borderTop: '1px solid #F1F5F9', paddingTop: '0.75rem' }}>
          <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose} disabled={isLoading}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" style={{ flex: 1.5, gap: '0.375rem', background: '#0F172A', borderColor: '#0F172A', fontWeight: 800 }} disabled={isLoading}>
            <Save size={15} />
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
