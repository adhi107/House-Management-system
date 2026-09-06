import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Wrench, ChevronRight, Save, X, AlertCircle } from 'lucide-react'
import { maintenanceApi, propertyApi, unitApi } from '../../api/client'
import { MaintenanceRequest, Property, Unit } from '../../types'
import { MobilePage } from '../../components/layout/AppShell'
import { MobileHeader } from '../../components/navigation'
import { EmptyState, ErrorState, SkeletonCard, StatusBadge, formatDate, Modal } from '../../components/ui'
import { useToast } from '../../contexts/ToastContext'
import { AxiosError } from 'axios'

const STATUS_TABS = [
  { key: '', label: 'All' },
  { key: 'open', label: 'Open' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'resolved', label: 'Resolved' },
]

const CATEGORIES = [
  { key: 'plumbing', label: 'Plumbing', icon: '🔧' },
  { key: 'electrical', label: 'Electrical', icon: '⚡' },
  { key: 'water', label: 'Water', icon: '💧' },
  { key: 'ac', label: 'AC / HVAC', icon: '❄️' },
  { key: 'cleaning', label: 'Cleaning', icon: '🧹' },
  { key: 'internet', label: 'Internet / Wi-Fi', icon: '🌐' },
  { key: 'appliance', label: 'Appliance', icon: '📺' },
  { key: 'other', label: 'General / Other', icon: '🔨' },
]

const PRIORITIES = [
  { key: 'low', label: 'Low', color: '#64748B' },
  { key: 'medium', label: 'Medium', color: '#0EA5E9' },
  { key: 'high', label: 'High', color: '#F59E0B' },
  { key: 'urgent', label: 'Urgent', color: '#EF4444' },
]

export default function MaintenancePage() {
  const navigate = useNavigate()
  const [requests, setRequests] = useState<MaintenanceRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)
  const [activeTab, setActiveTab] = useState('')
  const [total, setTotal] = useState(0)
  const [showAddModal, setShowAddModal] = useState(false)

  const load = async (status = activeTab) => {
    setIsLoading(true)
    setError(false)
    try {
      const res = await maintenanceApi.list({ status: status || undefined })
      setRequests(res.data.data || [])
      setTotal(res.data.total || 0)
    } catch {
      setError(true)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { load() }, [activeTab])

  return (
    <MobilePage
      role="owner"
      header={
        <MobileHeader
          title="Maintenance Requests"
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
      <div className="module-header hidden-mobile">
        <div className="module-header-info">
          <h1 className="module-header-title">
            Maintenance Requests ({total})
          </h1>
          <p className="module-header-subtitle">
            Track plumbing, electrical, and repair tickets across all your units
          </p>
        </div>

        <div className="module-header-action">
          <button
            className="btn btn-primary"
            onClick={() => setShowAddModal(true)}
            style={{ gap: '0.375rem' }}
          >
            <Plus size={16} /> New Request
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-scroll" style={{ marginBottom: '1rem' }}>
        {STATUS_TABS.map((t) => (
          <button
            key={t.key}
            className={`tab-item ${activeTab === t.key ? 'active' : ''}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ marginBottom: '0.5rem', fontSize: '0.8125rem', color: 'rgb(var(--muted-foreground))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>{total} request{total !== 1 ? 's' : ''}</span>
        <button
          className="btn btn-secondary btn-sm mobile-only"
          onClick={() => setShowAddModal(true)}
          style={{ gap: '0.25rem', fontSize: '0.75rem' }}
        >
          <Plus size={13} /> New Request
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
        ) : error ? (
          <ErrorState onRetry={load} />
        ) : requests.length === 0 ? (
          <EmptyState
            icon={<Wrench size={32} />}
            title={activeTab === 'resolved' ? 'No resolved requests' : activeTab ? `No ${activeTab.replace('_', ' ')} requests` : 'Everything looks good 🎉'}
            description="No active maintenance requests."
            action={
              <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                <Plus size={18} /> New Request
              </button>
            }
          />
        ) : (
          requests.map((r) => (
            <MaintenanceCard key={r.id} request={r} onClick={() => navigate(`/owner/maintenance/${r.id}`)} />
          ))
        )}
      </div>

      {/* Add Maintenance Modal */}
      <AddMaintenanceModal
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

function MaintenanceCard({ request, onClick }: { request: MaintenanceRequest; onClick: () => void }) {
  const priorityColor: Record<string, string> = {
    urgent: '#EF4444',
    high: '#F59E0B',
    medium: '#0EA5E9',
    low: '#64748B',
  }

  const categoryItem = CATEGORIES.find((c) => c.key === request.category)

  return (
    <div
      onClick={onClick}
      className="card card-hover"
      style={{
        width: '100%', padding: '1rem', textAlign: 'left', cursor: 'pointer',
        borderLeft: `3.5px solid ${priorityColor[request.priority] || '#CBD5E1'}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
        <span style={{ fontSize: '1.75rem', flexShrink: 0 }}>{categoryItem?.icon || '🔨'}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
              #{request.request_number}
            </span>
            <StatusBadge status={request.status} />
          </div>
          <h3 style={{ fontWeight: 700, fontSize: '0.9375rem', margin: '0 0 0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#0F172A' }}>
            {request.title}
          </h3>
          <p style={{ fontSize: '0.8125rem', color: '#64748B', margin: '0 0 0.375rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            Flat {request.unit_number} • {request.property_name}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {request.tenant_name && (
              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                by {request.tenant_name}
              </span>
            )}
            <span style={{ fontSize: '0.75rem', color: '#94A3B8', marginLeft: 'auto' }}>
              {formatDate(request.created_at)}
            </span>
          </div>
        </div>
        <ChevronRight size={18} style={{ color: '#94A3B8', flexShrink: 0, marginTop: 4 }} />
      </div>
    </div>
  )
}

function AddMaintenanceModal({
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
  const [units, setUnits] = useState<Unit[]>([])
  const [selectedPropertyId, setSelectedPropertyId] = useState('')
  const [selectedUnitId, setSelectedUnitId] = useState('')
  const [category, setCategory] = useState('plumbing')
  const [priority, setPriority] = useState('medium')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (isOpen) {
      propertyApi.list().then((res) => {
        const props = res.data.data || []
        setProperties(props)
        if (props.length > 0) {
          setSelectedPropertyId(props[0].id)
        }
      }).catch(() => {})
      setTitle('')
      setDescription('')
      setCategory('plumbing')
      setPriority('medium')
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
        } else {
          setSelectedUnitId('')
        }
      }).catch(() => {})
    }
  }, [selectedPropertyId])

  const validate = () => {
    const e: Record<string, string> = {}
    if (!selectedPropertyId) e.property = 'Please select a building'
    if (!selectedUnitId) e.unit = 'Please select a flat/unit'
    if (!title.trim()) e.title = 'Title is required'
    if (!description.trim()) e.description = 'Description is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setIsLoading(true)
    try {
      await maintenanceApi.create({
        property_id: selectedPropertyId,
        unit_id: selectedUnitId,
        category,
        priority,
        title: title.trim(),
        description: description.trim(),
      })
      success('Maintenance request created successfully!')
      onSuccess()
    } catch (err) {
      const axiosErr = err as AxiosError<{ detail: string }>
      error(axiosErr.response?.data?.detail || 'Failed to create request')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Maintenance Request" maxWidth="520px">
      <form onSubmit={handleSubmit}>
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
              onChange={(e) => setSelectedUnitId(e.target.value)}
            >
              {units.length === 0 ? (
                <option value="">No units available</option>
              ) : (
                units.map((u) => (
                  <option key={u.id} value={u.id}>Flat {u.unit_number} {u.tenant_name ? `(${u.tenant_name})` : ''}</option>
                ))
              )}
            </select>
            {errors.unit && <p className="input-hint input-hint-error">{errors.unit}</p>}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div className="form-group">
            <label className="input-label">Category</label>
            <select
              className="input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>{c.icon} {c.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="input-label">Priority</label>
            <select
              className="input"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              {PRIORITIES.map((p) => (
                <option key={p.key} value={p.key}>{p.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="input-label">Issue Title</label>
          <input
            type="text"
            className={`input ${errors.title ? 'input-error' : ''}`}
            placeholder="e.g. Water leakage in bathroom"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value)
              setErrors((p) => ({ ...p, title: '' }))
            }}
          />
          {errors.title && <p className="input-hint input-hint-error">{errors.title}</p>}
        </div>

        <div className="form-group">
          <label className="input-label">Details / Description</label>
          <textarea
            className={`input ${errors.description ? 'input-error' : ''}`}
            rows={3}
            placeholder="Describe the issue in detail..."
            value={description}
            onChange={(e) => {
              setDescription(e.target.value)
              setErrors((p) => ({ ...p, description: '' }))
            }}
            style={{ resize: 'none' }}
          />
          {errors.description && <p className="input-hint input-hint-error">{errors.description}</p>}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.25rem', borderTop: '1px solid #F1F5F9', paddingTop: '1rem' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={isLoading} style={{ gap: '0.375rem' }}>
            <Plus size={15} />
            {isLoading ? 'Creating...' : 'Create Ticket'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
