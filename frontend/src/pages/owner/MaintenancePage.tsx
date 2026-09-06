import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Plus,
  Wrench,
  ChevronRight,
  Save,
  X,
  AlertCircle,
  Clock,
  CheckCircle2,
  Phone,
  MessageSquare,
  DollarSign,
  UserCheck,
  Building2,
  FileText,
  Trash2,
  ArrowRight,
  Share2,
  Sparkles,
  Layers,
  Filter
} from 'lucide-react'
import { maintenanceApi, propertyApi, unitApi, expenseApi } from '../../api/client'
import { MaintenanceRequest, Property, Unit } from '../../types'
import { MobilePage } from '../../components/layout/AppShell'
import { MobileHeader } from '../../components/navigation'
import { EmptyState, ErrorState, SkeletonCard, StatusBadge, formatDate, Modal, formatCurrency } from '../../components/ui'
import { useToast } from '../../contexts/ToastContext'
import { AxiosError } from 'axios'

const STATUS_TABS = [
  { key: '', label: 'All Tickets' },
  { key: 'open', label: '🔴 Open' },
  { key: 'in_progress', label: '🟡 In Progress' },
  { key: 'resolved', label: '🟢 Resolved' },
  { key: 'closed', label: 'Closed' },
]

const CATEGORIES = [
  { key: 'plumbing', label: 'Plumbing', icon: '🔧' },
  { key: 'electrical', label: 'Electrical', icon: '⚡' },
  { key: 'water', label: 'Water Supply', icon: '💧' },
  { key: 'ac', label: 'AC / HVAC', icon: '❄️' },
  { key: 'cleaning', label: 'Cleaning', icon: '🧹' },
  { key: 'internet', label: 'Internet / Wi-Fi', icon: '🌐' },
  { key: 'appliance', label: 'Appliance', icon: '📺' },
  { key: 'other', label: 'General Repair', icon: '🔨' },
]

const PRIORITIES = [
  { key: 'low', label: 'Low', color: '#64748B', bg: '#F1F5F9' },
  { key: 'medium', label: 'Medium', color: '#0EA5E9', bg: '#E0F2FE' },
  { key: 'high', label: 'High', color: '#F59E0B', bg: '#FEF3C7' },
  { key: 'urgent', label: 'Urgent', color: '#EF4444', bg: '#FEE2E2' },
]

export default function MaintenancePage() {
  const navigate = useNavigate()
  const params = useParams()
  const { success, error, info } = useToast()

  const [requests, setRequests] = useState<MaintenanceRequest[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [selectedPropertyFilter, setSelectedPropertyFilter] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [activeTab, setActiveTab] = useState('')
  const [total, setTotal] = useState(0)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<MaintenanceRequest | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const load = async (status = activeTab) => {
    setIsLoading(true)
    setHasError(false)
    try {
      const [res, propRes] = await Promise.all([
        maintenanceApi.list({ status: status || undefined }),
        propertyApi.list().catch(() => ({ data: { data: [] } })),
      ])
      const list = res.data.data || []
      setRequests(list)
      setTotal(res.data.total || list.length)
      setProperties(propRes.data.data || [])

      if (params.id) {
        const matched = list.find((r: MaintenanceRequest) => r.id === params.id)
        if (matched) setSelectedTicket(matched)
      }
    } catch {
      setHasError(true)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [activeTab])

  const filteredRequests = requests.filter((r) => {
    if (selectedPropertyFilter && r.property_id !== selectedPropertyFilter) return false
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      r.title.toLowerCase().includes(q) ||
      (r.description || '').toLowerCase().includes(q) ||
      (r.tenant_name || '').toLowerCase().includes(q) ||
      (r.unit_number || '').toLowerCase().includes(q) ||
      r.request_number.toLowerCase().includes(q)
    )
  })

  // Urgent and Open Count Metrics
  const openCount = requests.filter((r) => r.status === 'open').length
  const urgentCount = requests.filter((r) => r.priority === 'urgent' && r.status !== 'closed' && r.status !== 'resolved').length
  const inProgressCount = requests.filter((r) => r.status === 'in_progress').length
  const resolvedCount = requests.filter((r) => r.status === 'resolved').length

  return (
    <MobilePage
      role="owner"
      header={
        <MobileHeader
          title="Maintenance & Repairs"
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
            Maintenance & Repairs Dispatch ({total})
          </h1>
          <p className="module-header-subtitle">
            Manage plumbing, electrical, and repair tickets, assign technicians, track repair costs, and log expenses
          </p>
        </div>

        <div className="module-header-action" style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className="btn btn-primary"
            onClick={() => setShowAddModal(true)}
            style={{ gap: '0.375rem', backgroundColor: '#2563EB', borderColor: '#2563EB', fontWeight: 700 }}
          >
            <Plus size={16} /> Log Repair Ticket
          </button>
        </div>
      </div>

      {/* QUICK STATUS KPI METRICS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
        
        <div
          onClick={() => setActiveTab('open')}
          className="card card-hover"
          style={{
            padding: '0.875rem',
            background: activeTab === 'open' ? '#FEF2F2' : '#FFFFFF',
            borderLeft: '4px solid #EF4444',
            cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#EF4444', textTransform: 'uppercase' }}>Open Tickets</span>
          <p style={{ fontSize: '1.375rem', fontWeight: 900, margin: '0.15rem 0 0', color: '#0F172A' }}>{openCount}</p>
        </div>

        <div
          onClick={() => setActiveTab('in_progress')}
          className="card card-hover"
          style={{
            padding: '0.875rem',
            background: activeTab === 'in_progress' ? '#FEF3C7' : '#FFFFFF',
            borderLeft: '4px solid #F59E0B',
            cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#D97706', textTransform: 'uppercase' }}>In Progress</span>
          <p style={{ fontSize: '1.375rem', fontWeight: 900, margin: '0.15rem 0 0', color: '#0F172A' }}>{inProgressCount}</p>
        </div>

        <div
          onClick={() => setActiveTab('resolved')}
          className="card card-hover"
          style={{
            padding: '0.875rem',
            background: activeTab === 'resolved' ? '#ECFDF5' : '#FFFFFF',
            borderLeft: '4px solid #10B981',
            cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#059669', textTransform: 'uppercase' }}>Resolved</span>
          <p style={{ fontSize: '1.375rem', fontWeight: 900, margin: '0.15rem 0 0', color: '#0F172A' }}>{resolvedCount}</p>
        </div>

        {urgentCount > 0 && (
          <div
            className="card"
            style={{
              padding: '0.875rem',
              background: '#FEE2E2',
              borderLeft: '4px solid #DC2626',
              border: '1.5px solid #FCA5A5',
            }}
          >
            <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#991B1B', textTransform: 'uppercase' }}>⚠️ Urgent Attention</span>
            <p style={{ fontSize: '1.375rem', fontWeight: 900, margin: '0.15rem 0 0', color: '#991B1B' }}>{urgentCount}</p>
          </div>
        )}

      </div>

      {/* FILTER & SEARCH BAR */}
      <div
        className="card"
        style={{
          padding: '0.875rem 1rem',
          marginBottom: '1rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.625rem',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#FFFFFF',
        }}
      >
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <input
            type="search"
            className="input"
            style={{ height: 38, fontSize: '0.8125rem' }}
            placeholder="Search tickets by title, description, flat #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <select
          className="input"
          style={{ height: 38, width: 'auto', minWidth: 160, fontSize: '0.8125rem' }}
          value={selectedPropertyFilter}
          onChange={(e) => setSelectedPropertyFilter(e.target.value)}
        >
          <option value="">🏢 All Buildings</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* Status Tabs */}
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

      {/* Ticket List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
        ) : hasError ? (
          <ErrorState onRetry={() => load(activeTab)} />
        ) : filteredRequests.length === 0 ? (
          <EmptyState
            icon={<Wrench size={36} />}
            title={activeTab === 'resolved' ? 'No resolved tickets' : activeTab ? `No ${activeTab.replace('_', ' ')} requests` : 'Everything is working smoothly! 🎉'}
            description="No maintenance tickets found for this filter."
            action={
              <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                <Plus size={18} /> New Request
              </button>
            }
          />
        ) : (
          filteredRequests.map((r) => (
            <EnhancedMaintenanceCard
              key={r.id}
              request={r}
              onClick={() => setSelectedTicket(r)}
            />
          ))
        )}
      </div>

      {/* NEW TICKET MODAL */}
      <AddMaintenanceModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          setShowAddModal(false)
          load()
        }}
      />

      {/* TICKET DETAIL & ACTION MODAL */}
      {selectedTicket && (
        <MaintenanceDetailModal
          ticket={selectedTicket}
          isOpen={!!selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onRefresh={() => load(activeTab)}
        />
      )}
    </MobilePage>
  )
}

function EnhancedMaintenanceCard({ request, onClick }: { request: MaintenanceRequest; onClick: () => void }) {
  const priorityInfo = PRIORITIES.find((p) => p.key === request.priority) || PRIORITIES[1]
  const categoryItem = CATEGORIES.find((c) => c.key === request.category)

  return (
    <div
      onClick={onClick}
      className="card card-hover"
      style={{
        width: '100%',
        padding: '1.125rem',
        textAlign: 'left',
        cursor: 'pointer',
        background: '#FFFFFF',
        borderLeft: `4px solid ${priorityInfo.color}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem' }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: '0.75rem',
            background: priorityInfo.bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            flexShrink: 0,
          }}
        >
          {categoryItem?.icon || '🔨'}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#2563EB', background: '#EFF6FF', padding: '0.1rem 0.35rem', borderRadius: 4 }}>
                #{request.request_number}
              </span>
              <span style={{ fontSize: '0.6875rem', fontWeight: 800, textTransform: 'uppercase', color: priorityInfo.color }}>
                • {priorityInfo.label} Priority
              </span>
            </div>
            <StatusBadge status={request.status} />
          </div>

          <h3 style={{ fontWeight: 800, fontSize: '1rem', margin: '0 0 0.2rem', color: '#0F172A' }}>
            {request.title}
          </h3>

          <p style={{ fontSize: '0.8125rem', color: '#64748B', margin: '0 0 0.5rem', lineHeight: 1.4 }}>
            Flat {request.unit_number} • {request.property_name}
          </p>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F1F5F9', paddingTop: '0.5rem', fontSize: '0.75rem' }}>
            <span style={{ color: '#64748B' }}>
              Reported by: <strong style={{ color: '#0F172A' }}>{request.tenant_name || 'Resident'}</strong>
            </span>
            <span style={{ color: '#94A3B8' }}>{formatDate(request.created_at)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function MaintenanceDetailModal({
  ticket,
  isOpen,
  onClose,
  onRefresh,
}: {
  ticket: MaintenanceRequest
  isOpen: boolean
  onClose: () => void
  onRefresh: () => void
}) {
  const { success, error, info } = useToast()
  const [status, setStatus] = useState(ticket.status)
  const [technician, setTechnician] = useState(ticket.assigned_to || '')
  const [estimatedCost, setEstimatedCost] = useState('')
  const [resolutionNotes, setResolutionNotes] = useState(ticket.notes || '')
  const [isUpdating, setIsUpdating] = useState(false)
  const [isConvertingExpense, setIsConvertingExpense] = useState(false)

  const handleUpdateTicket = async () => {
    setIsUpdating(true)
    try {
      await maintenanceApi.update(ticket.id, {
        status,
        assigned_to: technician.trim() || undefined,
        notes: resolutionNotes.trim() || undefined,
      })
      success('Ticket updated successfully!')
      onRefresh()
      onClose()
    } catch (err: any) {
      error(err?.response?.data?.detail || 'Failed to update ticket')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleConvertToExpense = async () => {
    const cost = parseFloat(estimatedCost)
    if (!cost || cost <= 0) {
      error('Please enter a valid repair expense amount (₹)')
      return
    }

    setIsConvertingExpense(true)
    try {
      await expenseApi.create({
        property_id: ticket.property_id,
        category: 'maintenance',
        amount: cost,
        description: `Repair: ${ticket.title} (Flat ${ticket.unit_number || 'N/A'} - Ticket #${ticket.request_number})`,
        vendor: technician || 'Service Technician',
        date: new Date().toISOString().slice(0, 10),
      })
      success(`₹${cost.toLocaleString('en-IN')} added to Property Expenses!`)
      setEstimatedCost('')
    } catch {
      error('Failed to log expense')
    } finally {
      setIsConvertingExpense(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Maintenance Ticket #${ticket.request_number}`}
      maxWidth="580px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        
        {/* Ticket Header Card */}
        <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
            <div>
              <span style={{ fontSize: '0.6875rem', fontWeight: 800, textTransform: 'uppercase', color: '#2563EB', background: '#EFF6FF', padding: '0.1rem 0.4rem', borderRadius: 4 }}>
                {ticket.category.toUpperCase()}
              </span>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 800, margin: '0.25rem 0 0.1rem', color: '#0F172A' }}>
                {ticket.title}
              </h3>
              <p style={{ fontSize: '0.8125rem', color: '#64748B', margin: 0 }}>
                Flat {ticket.unit_number} • {ticket.property_name}
              </p>
            </div>
            <StatusBadge status={ticket.status} />
          </div>

          <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #E2E8F0', fontSize: '0.8125rem', color: '#334155', lineHeight: 1.5 }}>
            <p style={{ margin: '0 0 0.25rem', fontWeight: 700, color: '#0F172A' }}>Description:</p>
            {ticket.description}
          </div>
        </div>

        {/* Status & Technician Assignment Controls */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div className="form-group">
            <label className="input-label">Update Ticket Status</label>
            <select
              className="input"
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
            >
              <option value="open">🔴 Open (Pending Action)</option>
              <option value="in_progress">🟡 In Progress (Assigned)</option>
              <option value="on_hold">⏸️ On Hold</option>
              <option value="resolved">🟢 Resolved (Work Complete)</option>
              <option value="closed">✔️ Closed</option>
              <option value="rejected">❌ Rejected</option>
            </select>
          </div>

          <div className="form-group">
            <label className="input-label">Assigned Technician / Vendor</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Ramesh (Plumber) 9876543210"
              value={technician}
              onChange={(e) => setTechnician(e.target.value)}
            />
          </div>
        </div>

        {/* Resolution Notes */}
        <div className="form-group">
          <label className="input-label">Technician Resolution / Action Notes</label>
          <textarea
            className="input"
            rows={2}
            placeholder="e.g. Replaced faulty washer valve. Verified no leakages."
            value={resolutionNotes}
            onChange={(e) => setResolutionNotes(e.target.value)}
            style={{ resize: 'none' }}
          />
        </div>

        {/* 1-Click Convert Repair Cost to Property Expense */}
        <div style={{ background: '#ECFDF5', padding: '0.875rem 1rem', borderRadius: '0.5rem', border: '1px solid #A7F3D0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <div>
              <p style={{ fontWeight: 800, fontSize: '0.8125rem', margin: 0, color: '#065F46' }}>
                💳 Log Repair Cost to Property Expenses
              </p>
              <p style={{ fontSize: '0.6875rem', color: '#047857', margin: 0 }}>
                Directly writes this repair bill into your operating expense ledger
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="number"
              min="0"
              className="input"
              style={{ flex: 1, height: 36, fontSize: '0.8125rem' }}
              placeholder="Repair cost in ₹ (e.g. 750)"
              value={estimatedCost}
              onChange={(e) => setEstimatedCost(e.target.value)}
            />
            <button
              type="button"
              className="btn btn-primary btn-sm"
              style={{ backgroundColor: '#059669', borderColor: '#059669', gap: '0.25rem' }}
              onClick={handleConvertToExpense}
              disabled={isConvertingExpense}
            >
              {isConvertingExpense ? 'Logging...' : '+ Add Expense'}
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', borderTop: '1px solid #F1F5F9', paddingTop: '1rem' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isUpdating}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleUpdateTicket}
            disabled={isUpdating}
            style={{ gap: '0.375rem' }}
          >
            <Save size={15} />
            {isUpdating ? 'Saving...' : 'Save Ticket Updates'}
          </button>
        </div>

      </div>
    </Modal>
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
      success('Maintenance ticket logged successfully!')
      onSuccess()
    } catch (err) {
      const axiosErr = err as AxiosError<{ detail: string }>
      error(axiosErr.response?.data?.detail || 'Failed to create request')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Log New Maintenance Ticket" maxWidth="520px">
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
