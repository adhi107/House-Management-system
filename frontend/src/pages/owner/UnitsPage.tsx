import React, { useState, useEffect, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  Plus,
  Building2,
  UserPlus,
  UserMinus,
  Home,
  Filter,
  Layers,
  CheckCircle2,
  AlertCircle,
  Edit3,
  Trash2,
  Save,
  Search,
  LayoutGrid,
  ListFilter,
  TrendingDown,
  DollarSign,
  ShieldCheck,
  Zap,
  Phone,
  MessageSquare,
} from 'lucide-react'
import { unitApi, propertyApi, tenantApi } from '../../api/client'
import { Unit, Property, Tenant } from '../../types'
import { MobilePage } from '../../components/layout/AppShell'
import { MobileHeader } from '../../components/navigation'
import { formatCurrency, EmptyState, ErrorState, SkeletonCard, StatusBadge, Modal } from '../../components/ui'
import { useToast } from '../../contexts/ToastContext'
import EditUnitModal from './EditUnitModal'

const STATUS_FILTERS = [
  { key: '', label: 'All Units' },
  { key: 'occupied', label: 'Occupied' },
  { key: 'vacant', label: 'Vacant' },
  { key: 'maintenance', label: 'Under Maintenance' },
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
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'floor' | 'table'>('grid')
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

  // BI Metrics
  const biMetrics = useMemo(() => {
    const total = units.length
    const occupied = units.filter((u) => u.status === 'occupied').length
    const vacant = units.filter((u) => u.status === 'vacant').length
    const maintenance = units.filter((u) => u.status === 'maintenance').length
    const occRate = total > 0 ? Math.round((occupied / total) * 100) : 0

    const totalPotentialRent = units.reduce((acc, curr) => acc + (curr.monthly_rent || 0), 0)
    const vacantRevenueLoss = units
      .filter((u) => u.status === 'vacant')
      .reduce((acc, curr) => acc + (curr.monthly_rent || 0), 0)

    return {
      total,
      occupied,
      vacant,
      maintenance,
      occRate,
      totalPotentialRent,
      vacantRevenueLoss,
    }
  }, [units])

  // Filtered Units
  const filteredUnits = useMemo(() => {
    return units.filter((u) => {
      if (selectedType !== 'all' && u.unit_type !== selectedType) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchNumber = u.unit_number?.toLowerCase().includes(q)
        const matchTenant = u.tenant_name?.toLowerCase().includes(q)
        const matchProp = u.property_name?.toLowerCase().includes(q)
        if (!matchNumber && !matchTenant && !matchProp) return false
      }
      return true
    })
  }, [units, selectedType, searchQuery])

  // Floor Grouping for Matrix View
  const floorGroups = useMemo(() => {
    const groups: Record<number, Unit[]> = {}
    filteredUnits.forEach((u) => {
      const fl = u.floor_number ?? 1
      if (!groups[fl]) groups[fl] = []
      groups[fl].push(u)
    })
    return groups
  }, [filteredUnits])

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
            Units & Flats Portfolio ({units.length})
          </h1>
          <p style={{ fontSize: '0.8125rem', color: '#64748B', margin: '0.125rem 0 0' }}>
            Interactive floor stacking matrix, vacancy loss analytics, and instant occupant assignment
          </p>
        </div>

        <button
          className="btn btn-primary btn-sm"
          onClick={() => setShowAddUnit(true)}
          style={{ gap: '0.375rem', fontWeight: 700 }}
        >
          <Plus size={15} /> Add Unit / Flat
        </button>
      </div>

      {/* BI KPI SUMMARY CARDS */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '0.875rem',
          marginBottom: '1.25rem',
        }}
      >
        <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #10B981', background: '#FFFFFF' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Portfolio Occupancy</span>
            <CheckCircle2 size={16} color="#10B981" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0F172A', fontVariantNumeric: 'tabular-nums' }}>
            {biMetrics.occRate}%
          </div>
          <p style={{ fontSize: '0.6875rem', color: '#059669', margin: '0.15rem 0 0', fontWeight: 600 }}>
            {biMetrics.occupied} Occupied of {biMetrics.total} units
          </p>
        </div>

        <div
          className="card"
          style={{
            padding: '1rem',
            borderLeft: `4px solid ${biMetrics.vacantRevenueLoss > 0 ? '#EF4444' : '#64748B'}`,
            background: biMetrics.vacantRevenueLoss > 0 ? '#FEF2F2' : '#FFFFFF',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: biMetrics.vacantRevenueLoss > 0 ? '#991B1B' : '#64748B', textTransform: 'uppercase' }}>
              Vacancy Revenue Loss
            </span>
            <TrendingDown size={16} color={biMetrics.vacantRevenueLoss > 0 ? '#DC2626' : '#94A3B8'} />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: biMetrics.vacantRevenueLoss > 0 ? '#B91C1C' : '#0F172A', fontVariantNumeric: 'tabular-nums' }}>
            {formatCurrency(biMetrics.vacantRevenueLoss)}/mo
          </div>
          <p style={{ fontSize: '0.6875rem', color: biMetrics.vacantRevenueLoss > 0 ? '#B91C1C' : '#64748B', margin: '0.15rem 0 0', fontWeight: 600 }}>
            {biMetrics.vacant} vacant unit{biMetrics.vacant !== 1 ? 's' : ''} leaking rent
          </p>
        </div>

        <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #3B82F6', background: '#FFFFFF' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Gross Rent Potential</span>
            <DollarSign size={16} color="#3B82F6" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0F172A', fontVariantNumeric: 'tabular-nums' }}>
            {formatCurrency(biMetrics.totalPotentialRent)}
          </div>
          <p style={{ fontSize: '0.6875rem', color: '#64748B', margin: '0.15rem 0 0' }}>
            100% capacity monthly yield
          </p>
        </div>
      </div>

      {/* FILTER, SEARCH & VIEW SWITCHER BAR */}
      <div className="card" style={{ padding: '0.75rem 1rem', marginBottom: '1rem', background: '#FFFFFF' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', flex: '1 1 200px' }}>
            <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              className="input"
              style={{ paddingLeft: '2rem', height: 36, fontSize: '0.8125rem' }}
              placeholder="Search flat number, resident, building..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Building Selector */}
          {properties.length > 0 && (
            <div style={{ minWidth: 160 }}>
              <select
                className="input"
                style={{ height: 36, fontSize: '0.8125rem' }}
                value={selectedPropertyId}
                onChange={(e) => {
                  setSelectedPropertyId(e.target.value)
                  setSearchParams(e.target.value ? { property_id: e.target.value } : {})
                }}
              >
                <option value="">🏢 All Buildings ({properties.length})</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Status Tabs */}
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                className={`btn btn-sm ${statusFilter === f.key ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setStatusFilter(f.key)}
                style={{ fontSize: '0.75rem', padding: '0.35rem 0.6rem' }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* View Mode Switcher */}
          <div style={{ display: 'flex', gap: '0.25rem', background: '#F1F5F9', padding: '0.2rem', borderRadius: '0.5rem' }}>
            <button
              type="button"
              className={`btn btn-sm ${viewMode === 'grid' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setViewMode('grid')}
              style={{ fontSize: '0.75rem', padding: '0.3rem 0.5rem', height: 28 }}
              title="Grid Cards"
            >
              <LayoutGrid size={14} />
            </button>
            <button
              type="button"
              className={`btn btn-sm ${viewMode === 'floor' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setViewMode('floor')}
              style={{ fontSize: '0.75rem', padding: '0.3rem 0.5rem', height: 28, gap: '0.25rem' }}
              title="Floor Stacking Matrix"
            >
              <Layers size={14} /> Floor Matrix
            </button>
          </div>
        </div>
      </div>

      {/* UNITS CONTENT */}
      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '0.875rem' }}>
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : hasError ? (
        <ErrorState onRetry={loadData} />
      ) : filteredUnits.length === 0 ? (
        <EmptyState
          icon={<Home size={32} />}
          title="No units match your filter"
          description="Add a new flat or clear your filters to view portfolio units."
          action={
            <button className="btn btn-primary" onClick={() => setShowAddUnit(true)}>
              <Plus size={18} /> Add Unit / Flat
            </button>
          }
        />
      ) : viewMode === 'floor' ? (
        /* INTERACTIVE FLOOR STACKING MATRIX VIEW */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {Object.entries(floorGroups)
            .sort(([a], [b]) => Number(b) - Number(a))
            .map(([floor, floorUnits]) => (
              <div
                key={floor}
                className="card"
                style={{ padding: '1rem', background: '#FFFFFF', borderRadius: '0.75rem', border: '1px solid #E2E8F0' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.9375rem', color: '#0F172A' }}>
                      Floor {floor}
                    </span>
                    <span style={{ fontSize: '0.6875rem', color: '#64748B' }}>
                      ({floorUnits.length} Flats • {floorUnits.filter((u) => u.status === 'occupied').length} Occupied)
                    </span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.625rem' }}>
                  {floorUnits.map((u) => {
                    const isOcc = u.status === 'occupied'
                    return (
                      <div
                        key={u.id}
                        style={{
                          padding: '0.75rem',
                          borderRadius: '0.5rem',
                          background: isOcc ? '#ECFDF5' : u.status === 'vacant' ? '#EFF6FF' : '#FFFBEB',
                          border: `1.5px solid ${isOcc ? '#A7F3D0' : u.status === 'vacant' ? '#BFDBFE' : '#FDE68A'}`,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          minHeight: 110,
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                            <span style={{ fontWeight: 900, fontSize: '0.9375rem', color: '#0F172A' }}>
                              Flat {u.unit_number}
                            </span>
                            <span style={{ fontSize: '0.625rem', fontWeight: 700, padding: '0.1rem 0.3rem', borderRadius: 4, background: '#FFFFFF' }}>
                              {u.unit_type}
                            </span>
                          </div>
                          <p style={{ fontSize: '0.75rem', fontWeight: 800, color: isOcc ? '#065F46' : '#1E40AF', margin: 0, fontVariantNumeric: 'tabular-nums' }}>
                            {formatCurrency(u.monthly_rent)}/mo
                          </p>
                          <p style={{ fontSize: '0.6875rem', color: '#64748B', margin: '0.15rem 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {u.tenant_name ? `👤 ${u.tenant_name}` : 'Vacant'}
                          </p>
                        </div>

                        <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.5rem' }}>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => setEditingUnit(u)}
                            style={{ flex: 1, fontSize: '0.6875rem', padding: '0.25rem', background: '#FFFFFF', border: '1px solid #E2E8F0', color: '#2563EB', fontWeight: 700 }}
                            title="Edit flat details"
                          >
                            <Edit3 size={11} /> Edit
                          </button>
                          {!isOcc ? (
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              onClick={() => setAssigningUnit(u)}
                              style={{ flex: 1.2, fontSize: '0.6875rem', padding: '0.25rem' }}
                            >
                              Assign
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => setVacatingUnit(u)}
                              style={{ flex: 1.2, fontSize: '0.6875rem', padding: '0.25rem', color: '#DC2626' }}
                            >
                              Vacate
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
        </div>
      ) : (
        /* STANDARD CARDS GRID VIEW */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '0.875rem',
          }}
        >
          {filteredUnits.map((unit) => {
            const cleanPhone = unit.tenant_phone?.replace(/\D/g, '') || ''
            return (
              <div
                key={unit.id}
                className="card card-hover"
                style={{
                  padding: '0.875rem 1rem',
                  borderRadius: '0.75rem',
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderLeft: `4px solid ${unit.status === 'occupied' ? '#10B981' : unit.status === 'vacant' ? '#3B82F6' : '#F59E0B'}`,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
                }}
              >
                <div>
                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <h3 style={{ fontWeight: 800, fontSize: '0.9375rem', margin: 0, color: '#0F172A' }}>
                          Flat {unit.unit_number}
                        </h3>
                        <span style={{ fontSize: '0.6875rem', fontWeight: 700, padding: '0.1rem 0.375rem', borderRadius: 4, background: '#F1F5F9', color: '#475569' }}>
                          {unit.unit_type}
                        </span>
                        {unit.area_sqft ? (
                          <span style={{ fontSize: '0.625rem', fontWeight: 600, padding: '0.1rem 0.3rem', borderRadius: 4, background: '#F8FAFC', color: '#64748B', border: '1px solid #E2E8F0' }}>
                            {unit.area_sqft} sqft
                          </span>
                        ) : null}
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
                          fontWeight: 700,
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
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.375rem', background: '#F8FAFC', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #F1F5F9', marginBottom: '0.625rem' }}>
                    <div>
                      <p style={{ fontSize: '0.625rem', color: '#64748B', margin: 0, fontWeight: 600 }}>Monthly Rent</p>
                      <p style={{ fontWeight: 800, fontSize: '0.875rem', margin: 0, color: '#0F172A', fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(unit.monthly_rent)}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.625rem', color: '#64748B', margin: 0, fontWeight: 600 }}>Deposit</p>
                      <p style={{ fontWeight: 800, fontSize: '0.875rem', margin: 0, color: '#059669', fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(unit.security_deposit || 0)}</p>
                    </div>
                  </div>
                </div>

                {/* Footer Tenant Info or Assign Action */}
                <div>
                  {unit.tenant_name ? (
                    <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '0.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                        <div>
                          <p style={{ fontSize: '0.625rem', color: '#64748B', margin: 0, fontWeight: 600 }}>Resident</p>
                          <p style={{ fontWeight: 700, fontSize: '0.8125rem', margin: 0, color: '#0F172A' }}>{unit.tenant_name}</p>
                        </div>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          style={{ color: '#E11D48', padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                          onClick={() => setVacatingUnit(unit)}
                        >
                          <UserMinus size={13} /> Vacate
                        </button>
                      </div>

                      {unit.tenant_phone && (
                        <div style={{ display: 'flex', gap: '0.35rem' }}>
                          <a
                            href={`https://wa.me/${cleanPhone}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-ghost btn-sm"
                            style={{ flex: 1, padding: '0.2rem', fontSize: '0.6875rem', background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', textDecoration: 'none', justifyContent: 'center' }}
                          >
                            <MessageSquare size={12} /> WhatsApp
                          </a>
                          <a
                            href={`tel:${unit.tenant_phone}`}
                            className="btn btn-ghost btn-sm"
                            style={{ flex: 1, padding: '0.2rem', fontSize: '0.6875rem', background: '#F8FAFC', color: '#334155', border: '1px solid #E2E8F0', textDecoration: 'none', justifyContent: 'center' }}
                          >
                            <Phone size={12} /> Call
                          </a>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '0.5rem' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setAssigningUnit(unit)}
                        style={{ width: '100%', gap: '0.375rem', fontWeight: 600 }}
                      >
                        <UserPlus size={13} /> Assign Tenant
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ADD UNIT MODAL WITH SMART PILLS & DEPOSIT MULTIPLIER */}
      <Modal isOpen={showAddUnit} onClose={() => setShowAddUnit(false)} title="Add New Flat / Unit" maxWidth="520px">
        <form onSubmit={handleAddUnit} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {properties.length > 1 && (
            <div className="form-group">
              <label className="input-label" style={{ fontWeight: 700, fontSize: '0.8125rem' }}>Building / Property *</label>
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
              <label className="input-label" style={{ fontWeight: 700, fontSize: '0.8125rem' }}>Unit / Flat No. *</label>
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
              <label className="input-label" style={{ fontWeight: 700, fontSize: '0.8125rem' }}>Floor Number *</label>
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

          {/* Visual Configuration Selector Pills */}
          <div>
            <label className="input-label" style={{ fontWeight: 700, fontSize: '0.8125rem', marginBottom: '0.35rem', display: 'block' }}>
              Configuration / Layout *
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              {['1RK', '1BHK', '2BHK', '3BHK', '4BHK', 'Studio', 'Commercial', 'Penthouse'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setNewUnitType(type)}
                  style={{
                    padding: '0.3rem 0.65rem',
                    borderRadius: '0.375rem',
                    fontSize: '0.75rem',
                    fontWeight: newUnitType === type ? 800 : 500,
                    border: newUnitType === type ? '1.5px solid #2563EB' : '1px solid #E2E8F0',
                    background: newUnitType === type ? '#EFF6FF' : '#F8FAFC',
                    color: newUnitType === type ? '#1D4ED8' : '#334155',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Financials: Monthly Rent + Quick Multipliers */}
          <div style={{ background: '#F8FAFC', padding: '0.75rem', borderRadius: '0.625rem', border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <div className="form-group">
                <label className="input-label" style={{ fontWeight: 700, fontSize: '0.8125rem' }}>Monthly Rent (₹) *</label>
                <input
                  type="number"
                  className="input"
                  placeholder="e.g. 18000"
                  value={newMonthlyRent}
                  onChange={(e) => {
                    const val = e.target.value
                    setNewMonthlyRent(val)
                    if (val && !isNaN(parseFloat(val))) {
                      setNewDeposit(String(parseFloat(val) * 2))
                    }
                  }}
                  required
                />
              </div>
              <div className="form-group">
                <label className="input-label" style={{ fontWeight: 700, fontSize: '0.8125rem' }}>Security Deposit (₹)</label>
                <input
                  type="number"
                  className="input"
                  placeholder="e.g. 36000"
                  value={newDeposit}
                  onChange={(e) => setNewDeposit(e.target.value)}
                />
              </div>
            </div>

            {/* Quick Deposit Multipliers */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.6875rem' }}>
              <span style={{ color: '#64748B', fontWeight: 600 }}>Quick Deposit:</span>
              {[
                { label: '1x Rent', mul: 1 },
                { label: '2x Rent', mul: 2 },
                { label: '3x Rent', mul: 3 },
                { label: '6x Rent', mul: 6 },
              ].map((d) => (
                <button
                  key={d.label}
                  type="button"
                  onClick={() => {
                    if (newMonthlyRent) {
                      setNewDeposit(String(parseFloat(newMonthlyRent) * d.mul))
                    }
                  }}
                  style={{
                    padding: '0.15rem 0.45rem',
                    borderRadius: '0.25rem',
                    fontSize: '0.6875rem',
                    background: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    color: '#334155',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="input-label" style={{ fontWeight: 700, fontSize: '0.8125rem' }}>Maintenance Charges / Mo (₹)</label>
              <input
                type="number"
                className="input"
                placeholder="0"
                value={newMaintenance}
                onChange={(e) => setNewMaintenance(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="input-label" style={{ fontWeight: 700, fontSize: '0.8125rem' }}>Carpet Area (Sq. Ft.)</label>
              <input
                type="number"
                className="input"
                placeholder="e.g. 1150"
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem', borderTop: '1px solid #F1F5F9', paddingTop: '0.75rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowAddUnit(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting} style={{ fontWeight: 800, padding: '0.5rem 1.25rem', background: '#0F172A', borderColor: '#0F172A' }}>
              {isSubmitting ? 'Creating...' : 'Create Flat'}
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT UNIT MODAL */}
      <EditUnitModal
        unit={editingUnit}
        isOpen={!!editingUnit}
        onClose={() => setEditingUnit(null)}
        onSuccess={() => {
          loadData()
          setEditingUnit(null)
        }}
        onDeleteSuccess={() => {
          loadData()
          setEditingUnit(null)
        }}
      />

      {/* ASSIGN TENANT MODAL */}
      {assigningUnit && (
        <Modal isOpen={true} onClose={() => setAssigningUnit(null)} title={`Assign Resident to Flat ${assigningUnit.unit_number}`} maxWidth="480px">
          <form onSubmit={handleAssignTenant} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <div className="form-group">
              <label className="input-label">Select Tenant *</label>
              <select
                className="input"
                value={selectedTenantId}
                onChange={(e) => setSelectedTenantId(e.target.value)}
                required
              >
                <option value="">-- Choose unassigned tenant --</option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.full_name} ({t.phone || 'No phone'})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="input-label">Move-In / Joining Date *</label>
                <input
                  type="date"
                  className="input"
                  value={joiningDate}
                  onChange={(e) => setJoiningDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="input-label">Rent Due Day of Month</label>
                <input
                  type="number"
                  min={1}
                  max={28}
                  className="input"
                  value={rentDueDay}
                  onChange={(e) => setRentDueDay(e.target.value)}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.75rem', borderTop: '1px solid #F1F5F9', paddingTop: '0.75rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setAssigningUnit(null)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting} style={{ fontWeight: 700 }}>
                {isSubmitting ? 'Assigning...' : 'Confirm Assignment'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* VACATE MODAL */}
      {vacatingUnit && (
        <Modal isOpen={true} onClose={() => setVacatingUnit(null)} title={`Vacate Flat ${vacatingUnit.unit_number}?`} maxWidth="420px">
          <div>
            <p style={{ fontSize: '0.875rem', color: '#475569', margin: '0 0 1rem' }}>
              Are you sure you want to vacate resident <strong>{vacatingUnit.tenant_name}</strong> from Flat {vacatingUnit.unit_number}? This will mark the flat as vacant and available for new occupancy.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setVacatingUnit(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleVacateUnit}
                disabled={isSubmitting}
                style={{ fontWeight: 700 }}
              >
                {isSubmitting ? 'Vacating...' : 'Confirm Vacate'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </MobilePage>
  )
}

