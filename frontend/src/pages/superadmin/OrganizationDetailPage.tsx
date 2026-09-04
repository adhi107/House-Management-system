import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { superAdminApi } from '../../api/client'
import { Organization } from '../../types'
import { MobilePage } from '../../components/layout/AppShell'
import { MobileHeader } from '../../components/navigation'
import { formatDate, ErrorState, SkeletonCard, Modal } from '../../components/ui'
import { useToast } from '../../contexts/ToastContext'
import {
  Building,
  User,
  Shield,
  Layers,
  Power,
  Key,
  CheckCircle2,
  AlertCircle,
  Clock,
} from 'lucide-react'

export default function OrganizationDetailPage() {
  const { orgId } = useParams<{ orgId: string }>()
  const navigate = useNavigate()
  const { success, error } = useToast()

  const [org, setOrg] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [suspensionReason, setSuspensionReason] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  const loadData = async () => {
    setIsLoading(true)
    setHasError(false)
    try {
      const res = await superAdminApi.getOrganization(orgId!)
      setOrg(res.data.data)
    } catch {
      setHasError(true)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (orgId) loadData()
  }, [orgId])

  const handleStatusToggle = async () => {
    if (!org) return
    const newStatus = org.status === 'active' ? 'suspended' : 'active'
    setIsUpdating(true)
    try {
      await superAdminApi.updateOrganizationStatus(org.id, {
        status: newStatus,
        reason: suspensionReason || undefined,
      })
      success(`Organization ${newStatus === 'active' ? 'activated' : 'suspended'} successfully!`)
      setShowStatusModal(false)
      loadData()
    } catch (err: any) {
      error(err.response?.data?.detail || 'Failed to update status')
    } finally {
      setIsUpdating(false)
    }
  }

  if (isLoading) {
    return (
      <MobilePage role="super_admin" header={<MobileHeader title="Organization" showBack />}>
        <SkeletonCard />
      </MobilePage>
    )
  }

  if (hasError || !org) {
    return (
      <MobilePage role="super_admin" header={<MobileHeader title="Organization" showBack />}>
        <ErrorState onRetry={loadData} />
      </MobilePage>
    )
  }

  const isActive = org.status === 'active'
  const isSuspended = org.status === 'suspended'

  return (
    <MobilePage
      role="super_admin"
      header={
        <MobileHeader
          title={org.name}
          showBack
          rightAction={
            <button
              className={`btn btn-sm ${isActive ? 'btn-danger' : 'btn-primary'}`}
              onClick={() => setShowStatusModal(true)}
            >
              <Power size={14} /> {isActive ? 'Suspend' : 'Activate'}
            </button>
          }
        />
      }
    >
      {/* Banner Card */}
      <div className="card" style={{
        padding: '1.25rem',
        marginBottom: '1rem',
        borderLeft: `4px solid ${isActive ? 'rgb(var(--success))' : isSuspended ? 'rgb(var(--danger))' : 'rgb(var(--muted-foreground))'}`,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
          <div>
            <h2 style={{ fontWeight: 800, fontSize: '1.25rem', margin: '0 0 0.25rem' }}>{org.name}</h2>
            <p style={{ fontSize: '0.8125rem', color: 'rgb(var(--muted-foreground))', margin: 0 }}>
              Code: <strong style={{ color: 'rgb(var(--foreground))' }}>{org.organization_code}</strong>
            </p>
          </div>
          <span className={`badge badge-${isActive ? 'active' : isSuspended ? 'overdue' : 'inactive'}`}>
            {org.status.toUpperCase()}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginTop: '1rem', textAlign: 'center' }}>
          <div style={{ background: 'rgb(var(--muted) / 0.5)', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
            <p style={{ fontWeight: 800, fontSize: '1.125rem', margin: 0 }}>{org.buildings_count || 0}</p>
            <p style={{ fontSize: '0.625rem', color: 'rgb(var(--muted-foreground))', margin: 0 }}>Buildings</p>
          </div>
          <div style={{ background: 'rgb(var(--muted) / 0.5)', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
            <p style={{ fontWeight: 800, fontSize: '1.125rem', margin: 0 }}>{org.units_count || 0}</p>
            <p style={{ fontSize: '0.625rem', color: 'rgb(var(--muted-foreground))', margin: 0 }}>Units</p>
          </div>
          <div style={{ background: 'rgb(var(--muted) / 0.5)', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
            <p style={{ fontWeight: 800, fontSize: '1.125rem', margin: 0 }}>{org.tenants_count || 0}</p>
            <p style={{ fontSize: '0.625rem', color: 'rgb(var(--muted-foreground))', margin: 0 }}>Tenants</p>
          </div>
          <div style={{ background: 'rgb(var(--muted) / 0.5)', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
            <p style={{ fontWeight: 800, fontSize: '1.125rem', margin: 0 }}>{org.invoices_count || 0}</p>
            <p style={{ fontSize: '0.625rem', color: 'rgb(var(--muted-foreground))', margin: 0 }}>Invoices</p>
          </div>
        </div>
      </div>

      {/* Owner Details */}
      <div className="card" style={{ padding: '1rem', marginBottom: '1rem' }}>
        <h3 style={{ fontWeight: 700, fontSize: '0.9375rem', margin: '0 0 0.75rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <User size={16} /> Primary Owner
        </h3>
        {org.owner ? (
          <div>
            <p style={{ fontWeight: 700, fontSize: '0.9375rem', margin: '0 0 0.125rem' }}>{org.owner.full_name}</p>
            <p style={{ fontSize: '0.8125rem', color: 'rgb(var(--muted-foreground))', margin: '0 0 0.25rem' }}>{org.owner.email}</p>
            {org.owner.phone && (
              <p style={{ fontSize: '0.8125rem', color: 'rgb(var(--muted-foreground))', margin: 0 }}>{org.owner.phone}</p>
            )}
          </div>
        ) : (
          <p style={{ color: 'rgb(var(--muted-foreground))', fontSize: '0.875rem', margin: 0 }}>
            No owner account assigned yet.
          </p>
        )}
      </div>

      {/* Subscription Plan & Meta */}
      <div className="card" style={{ padding: '1rem', marginBottom: '1rem' }}>
        <h3 style={{ fontWeight: 700, fontSize: '0.9375rem', margin: '0 0 0.75rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <Shield size={16} /> Plan & Settings
        </h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.375rem 0', borderBottom: '1px solid rgb(var(--border))' }}>
          <span style={{ fontSize: '0.8125rem', color: 'rgb(var(--muted-foreground))' }}>Current Plan</span>
          <span style={{ fontWeight: 700, textTransform: 'uppercase', color: 'rgb(var(--primary))' }}>{org.plan}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.375rem 0', borderBottom: '1px solid rgb(var(--border))' }}>
          <span style={{ fontSize: '0.8125rem', color: 'rgb(var(--muted-foreground))' }}>Created On</span>
          <span style={{ fontWeight: 600 }}>{formatDate(org.created_at)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.375rem 0' }}>
          <span style={{ fontSize: '0.8125rem', color: 'rgb(var(--muted-foreground))' }}>Tenant Portal</span>
          <span style={{ fontWeight: 600, color: 'rgb(var(--success))' }}>Enabled</span>
        </div>
      </div>

      {/* Buildings under this Org */}
      {org.buildings && org.buildings.length > 0 && (
        <div>
          <h3 className="text-h3" style={{ margin: '0 0 0.5rem' }}>Buildings ({org.buildings.length})</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {org.buildings.map((b: any) => (
              <div key={b.id || b._id} className="card" style={{ padding: '0.875rem' }}>
                <p style={{ fontWeight: 700, fontSize: '0.9375rem', margin: '0 0 0.125rem' }}>{b.name}</p>
                <p style={{ fontSize: '0.75rem', color: 'rgb(var(--muted-foreground))', margin: 0 }}>
                  {b.address}, {b.city} • {b.total_floors} Floors
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suspend / Activate Modal */}
      <Modal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        title={isActive ? 'Suspend Organization' : 'Activate Organization'}
      >
        <p style={{ color: 'rgb(var(--muted-foreground))', lineHeight: 1.6 }}>
          {isActive ? (
            <>
              Suspending <strong>{org.name}</strong> will block all data modification and payment collection for this organization immediately.
            </>
          ) : (
            <>
              Activating <strong>{org.name}</strong> will restore full access for the owner and tenants.
            </>
          )}
        </p>

        {isActive && (
          <div className="form-group" style={{ marginTop: '0.75rem' }}>
            <label className="input-label">Reason (optional)</label>
            <input
              type="text"
              className="input"
              placeholder="Reason for suspension..."
              value={suspensionReason}
              onChange={(e) => setSuspensionReason(e.target.value)}
            />
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowStatusModal(false)}>
            Cancel
          </button>
          <button
            className={`btn ${isActive ? 'btn-danger' : 'btn-primary'}`}
            style={{ flex: 1 }}
            onClick={handleStatusToggle}
            disabled={isUpdating}
          >
            {isUpdating ? 'Updating...' : isActive ? 'Confirm Suspend' : 'Confirm Activate'}
          </button>
        </div>
      </Modal>
    </MobilePage>
  )
}
