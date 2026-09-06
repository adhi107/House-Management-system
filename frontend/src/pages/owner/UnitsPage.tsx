import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Plus, Building2, UserPlus, UserMinus, Home, Filter, Layers, CheckCircle2, AlertCircle, Edit3, Trash2, Save } from 'lucide-react'
import { unitApi, propertyApi, tenantApi } from '../../api/client'
import { Unit, Property, Tenant } from '../../types'
import { MobilePage } from '../../components/layout/AppShell'
import { MobileHeader } from '../../components/navigation'
import { formatCurrency, EmptyState, ErrorState, SkeletonCard, StatusBadge, Modal } from '../../components/ui'
import { useToast } from '../../contexts/ToastContext'
import { AxiosError } from 'axios'

const STATUS_FILTERS = [
  { key: '', label: 'All' },
  { key: 'occupied', label: 'Occupied' },
  { key: 'vacant', label: 'Vacant' },
  { key: 'maintenance', label: 'Maintenance' },
]

export default function UnitsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { success, error } = useToast()

  const propertyIdParam = searchParams.get('property_id') || ''
  const [selectedPropertyId, setSelectedPropertyId] = useState(propertyIdParam)
  const [properties, setProperties] = useState<Property[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '')
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  // Modals
  const [showAddUnit, setShowAddUnit] = useState(false)
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null)
  const [assigningUnit, setAssigningUnit] = useState<Unit | null>(null)
  const [vacatingUnit, setVacatingUnit] = useState<Unit | null>(null)

  // Add Unit Form State
  const [newUnitNumber, setNewUnitNumber] = useState('')
  const [newFloorNumber, setNewFloorNumber] = useState('1')
  const [newUnitType, setNewUnitType] = useState('2BHK')
  const [newMonthlyRent, setNewMonthlyRent] = useState('')
  const [newMaintenance, setNewMaintenance] = useState('0')
  const [newDeposit, setNewDeposit] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Assign Form State
  const [selectedTenantId, setSelectedTenantId] = useState('')
  const [joiningDate, setJoiningDate] = useState(new Date().toISOString().split('T')[0])
  const [rentDueDay, setRentDueDay] = useState('5')

  const loadData = async () => {
    setIsLoading(true)
    setHasError(false)
    try {
      const [propsRes, unitsRes, tenantsRes] = await Promise.all([
        propertyApi.list(),
        unitApi.list({ property_id: selectedPropertyId || undefined, status: statusFilter || undefined }),
        tenantApi.list({ unassigned: true }),
      ])
      setProperties(propsRes.data.data || [])
      setUnits(unitsRes.data.data || [])
      setTenants(tenantsRes.data.data || [])
    } catch {
      setHasError(true)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [selectedPropertyId, statusFilter])

  const handleAddUnit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPropertyId && properties.length === 0) {
      error('Please create a property first!')
      return
    }
    const propId = selectedPropertyId || (properties[0]?.id ?? '')
    if (!newUnitNumber || !newMonthlyRent) {
      error('Please provide unit number and rent amount')
      return
    }

    setIsSubmitting(true)
    try {
      await unitApi.create({
        property_id: propId,
        unit_number: newUnitNumber,
        floor_number: parseInt(newFloorNumber) || 1,
        unit_type: newUnitType,
        monthly_rent: parseFloat(newMonthlyRent),
        maintenance_charge: parseFloat(newMaintenance) || 0,
        security_deposit: parseFloat(newDeposit) || (parseFloat(newMonthlyRent) * 2),
      })
      success('Unit created successfully!')
      setShowAddUnit(false)
      setNewUnitNumber('')
      setNewMonthlyRent('')
      setNewDeposit('')
      loadData()
    } catch (err: any) {
      error(err.response?.data?.detail || 'Failed to create unit')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAssignTenant = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!assigningUnit || !selectedTenantId) {
      error('Please select a tenant')
      return
    }

    setIsSubmitting(true)
    try {
      await tenantApi.assign({
        tenant_id: selectedTenantId,
        unit_id: assigningUnit.id,
        property_id: assigningUnit.property_id,
        monthly_rent: assigningUnit.monthly_rent,
        maintenance_charge: assigningUnit.maintenance_charge,
        security_deposit: assigningUnit.security_deposit,
        rent_due_day: parseInt(rentDueDay) || 5,
        joining_date: joiningDate,
      })
      success('Tenant assigned to unit successfully!')
      setAssigningUnit(null)
      setSelectedTenantId('')
      loadData()
    } catch (err: any) {
      error(err.response?.data?.detail || 'Failed to assign tenant')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleVacateUnit = async () => {
    if (!vacatingUnit || !vacatingUnit.tenant_id) return
    setIsSubmitting(true)
    try {
      await tenantApi.vacate(vacatingUnit.tenant_id)
      success('Unit vacated successfully!')
      setVacatingUnit(null)
      loadData()
    } catch (err: any) {
      error(err.response?.data?.detail || 'Failed to vacate unit')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <MobilePage
      role="owner"
      header={
        <MobileHeader
          title="Units Management"
          showBack
          rightAction={
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setShowAddUnit(true)}
              style={{ gap: '0.25rem' }}
            >
              <Plus size={16} /> Add Unit
            </button>
          }
        />
      }
    >
      {/* Desktop Header Row */}
      <div className="module-header hidden-mobile">
        <div className="module-header-info">
          <h1 className="module-header-title">
            Units & Flats Management
          </h1>
          <p className="module-header-subtitle">
            Manage flats, floors, monthly rent rates, and occupant assignments
          </p>
        </div>

        <div className="module-header-action">
          <button
            className="btn btn-primary"
            onClick={() => setShowAddUnit(true)}
            style={{ gap: '0.375rem' }}
          >
            <Plus size={16} /> Add Unit
          </button>
        </div>
      </div>

      {/* Property Selector */}
      {properties.length > 1 && (
        <div style={{ marginBottom: '1rem' }}>
          <label className="input-label">Filter by Building</label>
          <select
            className="input"
            value={selectedPropertyId}
            onChange={(e) => {
              setSelectedPropertyId(e.target.value)
              setSearchParams(e.target.value ? { property_id: e.target.value } : {})
            }}
          >
            <option value="">All Buildings ({properties.length})</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.city})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Status Tabs */}
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

      {/* Units List */}
      <div className="cards-grid">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : hasError ? (
          <ErrorState onRetry={loadData} />
        ) : units.length === 0 ? (
          <div style={{ gridColumn: '1 / -1' }}>
            <EmptyState
              icon={<Home size={32} />}
              title="No units found"
              description="Add your first flat/unit to manage occupancy and rent."
              action={
                <button className="btn btn-primary" onClick={() => setShowAddUnit(true)}>
                  <Plus size={18} /> Add Unit
                </button>
              }
            />
          </div>
        ) : (
          units.map((unit) => (
            <div
              key={unit.id}
              className="card card-hover"
              style={{
                padding: '0.875rem 1rem',
                borderLeft: `3.5px solid ${unit.status === 'occupied' ? '#10B981' : unit.status === 'vacant' ? '#0EA5E9' : '#D97706'}`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '0.625rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <h3 style={{ fontWeight: 800, fontSize: '0.9375rem', margin: 0, color: '#0F172A' }}>
                      Flat {unit.unit_number}
                    </h3>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 700, padding: '0.1rem 0.375rem', borderRadius: 4, background: '#F1F5F9', color: '#475569' }}>
                      {unit.unit_type}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '0.125rem 0 0' }}>
                    Floor {unit.floor_number} • {unit.property_name || 'Building'}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditingUnit(unit)
                    }}
                    className="btn btn-ghost btn-sm"
                    style={{
                      padding: '0.2rem 0.45rem',
                      height: 26,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      borderRadius: 6,
                      gap: '0.25rem',
                      color: '#2563EB',
                      background: '#EFF6FF',
                      border: '1px solid #DBEAFE',
                    }}
                    title="Edit flat details"
                    aria-label={`Edit Flat ${unit.unit_number}`}
                  >
                    <Edit3 size={13} />
                    <span>Edit</span>
                  </button>
                  <StatusBadge status={unit.status} />
                </div>
              </div>

              {/* Financial & Rent Details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.375rem', background: '#F8FAFC', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid #F1F5F9' }}>
                <div>
                  <p style={{ fontSize: '0.625rem', color: '#64748B', margin: 0, fontWeight: 600 }}>Monthly Rent</p>
                  <p style={{ fontWeight: 800, fontSize: '0.875rem', margin: 0, color: '#0F172A', fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(unit.monthly_rent)}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.625rem', color: '#64748B', margin: 0, fontWeight: 600 }}>Deposit</p>
                  <p style={{ fontWeight: 800, fontSize: '0.875rem', margin: 0, color: '#0F172A', fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(unit.security_deposit || 0)}</p>
                </div>
              </div>

              {unit.tenant_name ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F1F5F9', paddingTop: '0.5rem' }}>
                  <div>
                    <p style={{ fontSize: '0.625rem', color: '#64748B', margin: 0, fontWeight: 600 }}>Resident</p>
                    <p style={{ fontWeight: 700, fontSize: '0.8125rem', margin: 0, color: '#0F172A' }}>{unit.tenant_name}</p>
                  </div>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ color: '#E11D48', padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                    onClick={() => setVacatingUnit(unit)}
                  >
                    <UserMinus size={13} /> Vacate
                  </button>
                </div>
              ) : (
                <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '0.5rem' }}>
                  <button
                    className="btn btn-secondary btn-sm btn-full"
                    onClick={() => setAssigningUnit(unit)}
                    style={{ gap: '0.375rem' }}
                  >
                    <UserPlus size={13} /> Assign Tenant
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add Unit Modal */}
      <Modal isOpen={showAddUnit} onClose={() => setShowAddUnit(false)} title="Add New Unit">
        <form onSubmit={handleAddUnit}>
          {properties.length > 1 && (
            <div className="form-group">
              <label className="input-label">Building / Property</label>
              <select
                className="input"
                value={selectedPropertyId || properties[0]?.id}
                onChange={(e) => setSelectedPropertyId(e.target.value)}
              >
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="input-label">Unit / Flat No.</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. 101, A-2"
                value={newUnitNumber}
                onChange={(e) => setNewUnitNumber(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="input-label">Floor Number</label>
              <input
                type="number"
                className="input"
                min={0}
                max={50}
                value={newFloorNumber}
                onChange={(e) => setNewFloorNumber(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="input-label">Unit Type / Configuration</label>
            <select
              className="input"
              value={newUnitType}
              onChange={(e) => setNewUnitType(e.target.value)}
            >
              <option value="1RK">1 RK</option>
              <option value="1BHK">1 BHK</option>
              <option value="2BHK">2 BHK</option>
              <option value="3BHK">3 BHK</option>
              <option value="4BHK">4 BHK</option>
              <option value="Commercial">Commercial Shop / Office</option>
              <option value="Studio">Studio Apartment</option>
              <option value="Penthouse">Penthouse</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="input-label">Monthly Rent (₹)</label>
              <input
                type="number"
                className="input"
                placeholder="15000"
                value={newMonthlyRent}
                onChange={(e) => setNewMonthlyRent(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="input-label">Security Deposit (₹)</label>
              <input
                type="number"
                className="input"
                placeholder="30000"
                value={newDeposit}
                onChange={(e) => setNewDeposit(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="input-label">Maintenance Charges / Month (₹)</label>
            <input
              type="number"
              className="input"
              placeholder="0"
              value={newMaintenance}
              onChange={(e) => setNewMaintenance(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowAddUnit(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Unit'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Unit Modal */}
      {editingUnit && (
        <EditUnitModal
          unit={editingUnit}
          isOpen={!!editingUnit}
          onClose={() => setEditingUnit(null)}
          onSuccess={() => {
            setEditingUnit(null)
            loadData()
          }}
        />
      )}

      {/* Assign Tenant Modal */}
      <Modal
        isOpen={!!assigningUnit}
        onClose={() => setAssigningUnit(null)}
        title={`Assign Tenant — Flat ${assigningUnit?.unit_number}`}
      >
        <form onSubmit={handleAssignTenant}>
          <div className="form-group">
            <label className="input-label">Select Tenant</label>
            {tenants.length === 0 ? (
              <div style={{ padding: '0.75rem', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, fontSize: '0.8125rem', color: '#991B1B' }}>
                No unassigned tenants found.{' '}
                <button
                  type="button"
                  onClick={() => navigate('/owner/tenants/new')}
                  style={{ color: '#2563EB', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}
                >
                  Add a tenant first
                </button>
              </div>
            ) : (
              <select
                className="input"
                value={selectedTenantId}
                onChange={(e) => setSelectedTenantId(e.target.value)}
                required
              >
                <option value="">-- Choose Tenant --</option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.full_name} ({t.phone})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="input-label">Move-in Date</label>
              <input
                type="date"
                className="input"
                value={joiningDate}
                onChange={(e) => setJoiningDate(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="input-label">Rent Due Day</label>
              <input
                type="number"
                className="input"
                min={1}
                max={28}
                value={rentDueDay}
                onChange={(e) => setRentDueDay(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setAssigningUnit(null)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={isSubmitting || tenants.length === 0}>
              {isSubmitting ? 'Assigning...' : 'Assign Tenant'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Vacate Unit Confirm Dialog */}
      <Modal
        isOpen={!!vacatingUnit}
        onClose={() => setVacatingUnit(null)}
        title="Confirm Vacate"
      >
        <p style={{ color: 'rgb(var(--muted-foreground))', lineHeight: 1.6 }}>
          Are you sure you want to vacate <strong>Flat {vacatingUnit?.unit_number}</strong> from tenant <strong>{vacatingUnit?.tenant_name}</strong>? The unit will be marked as vacant.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setVacatingUnit(null)}>
            Cancel
          </button>
          <button className="btn btn-danger" style={{ flex: 1 }} onClick={handleVacateUnit} disabled={isSubmitting}>
            {isSubmitting ? 'Vacating...' : 'Confirm Vacate'}
          </button>
        </div>
      </Modal>
    </MobilePage>
  )
}

function EditUnitModal({
  unit,
  isOpen,
  onClose,
  onSuccess,
}: {
  unit: Unit
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}) {
  const { success, error } = useToast()
  const [unitNumber, setUnitNumber] = useState(unit.unit_number || '')
  const [floorNumber, setFloorNumber] = useState(String(unit.floor_number || 1))
  const [unitType, setUnitType] = useState(unit.unit_type || '2BHK')
  const [monthlyRent, setMonthlyRent] = useState(String(unit.monthly_rent || ''))
  const [maintenance, setMaintenance] = useState(String(unit.maintenance_charge || '0'))
  const [deposit, setDeposit] = useState(String(unit.security_deposit || ''))
  const [status, setStatus] = useState(unit.status || 'vacant')
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!unitNumber.trim() || !monthlyRent) {
      error('Please provide unit number and rent')
      return
    }

    setIsLoading(true)
    try {
      await unitApi.update(unit.id, {
        unit_number: unitNumber.trim(),
        floor_number: parseInt(floorNumber) || 1,
        unit_type: unitType,
        monthly_rent: parseFloat(monthlyRent),
        maintenance_charge: parseFloat(maintenance) || 0,
        security_deposit: parseFloat(deposit) || 0,
        status,
      })
      success('Unit details updated successfully!')
      onSuccess()
    } catch (err) {
      const axiosErr = err as AxiosError<{ detail: string }>
      error(axiosErr.response?.data?.detail || 'Failed to update unit')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (unit.status === 'occupied') {
      error('Cannot delete an occupied unit. Vacate tenant first.')
      return
    }

    setIsDeleting(true)
    try {
      await unitApi.delete(unit.id)
      success('Unit deleted successfully')
      onSuccess()
    } catch (err) {
      const axiosErr = err as AxiosError<{ detail: string }>
      error(axiosErr.response?.data?.detail || 'Failed to delete unit')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit Flat ${unit.unit_number}`} maxWidth="520px">
      <form onSubmit={handleUpdate}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div className="form-group">
            <label className="input-label">Unit / Flat No.</label>
            <input
              type="text"
              className="input"
              value={unitNumber}
              onChange={(e) => setUnitNumber(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="input-label">Floor Number</label>
            <input
              type="number"
              className="input"
              min={0}
              max={50}
              value={floorNumber}
              onChange={(e) => setFloorNumber(e.target.value)}
              required
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div className="form-group">
            <label className="input-label">Configuration</label>
            <select
              className="input"
              value={unitType}
              onChange={(e) => setUnitType(e.target.value)}
            >
              <option value="1RK">1 RK</option>
              <option value="1BHK">1 BHK</option>
              <option value="2BHK">2 BHK</option>
              <option value="3BHK">3 BHK</option>
              <option value="4BHK">4 BHK</option>
              <option value="Commercial">Commercial Shop / Office</option>
              <option value="Studio">Studio Apartment</option>
              <option value="Penthouse">Penthouse</option>
            </select>
          </div>

          <div className="form-group">
            <label className="input-label">Status</label>
            <select
              className="input"
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
            >
              <option value="vacant">Vacant</option>
              <option value="occupied">Occupied</option>
              <option value="maintenance">Maintenance</option>
              <option value="reserved">Reserved</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div className="form-group">
            <label className="input-label">Monthly Rent (₹)</label>
            <input
              type="number"
              className="input"
              value={monthlyRent}
              onChange={(e) => setMonthlyRent(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="input-label">Security Deposit (₹)</label>
            <input
              type="number"
              className="input"
              value={deposit}
              onChange={(e) => setDeposit(e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="input-label">Maintenance Charges / Month (₹)</label>
          <input
            type="number"
            className="input"
            value={maintenance}
            onChange={(e) => setMaintenance(e.target.value)}
          />
        </div>

        {/* Delete confirmation section */}
        {showDeleteConfirm ? (
          <div style={{ padding: '0.75rem 1rem', borderRadius: 8, background: '#FEF2F2', border: '1px solid #FECACA', marginBottom: '1rem' }}>
            <p style={{ margin: '0 0 0.5rem', fontWeight: 700, fontSize: '0.8125rem', color: '#991B1B' }}>
              Delete Flat {unit.unit_number}?
            </p>
            <p style={{ margin: '0 0 0.75rem', fontSize: '0.75rem', color: '#B91C1C' }}>
              This flat record will be removed permanently. Only vacant units can be deleted.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        ) : null}

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginTop: '1.25rem', borderTop: '1px solid #F1F5F9', paddingTop: '1rem' }}>
          <div>
            {!showDeleteConfirm && unit.status !== 'occupied' && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                style={{ color: '#E11D48', gap: '0.25rem' }}
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 size={14} /> Delete
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isLoading || isDeleting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isLoading || isDeleting} style={{ gap: '0.375rem' }}>
              <Save size={15} />
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
