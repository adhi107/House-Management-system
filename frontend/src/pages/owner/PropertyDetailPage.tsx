import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Plus,
  Building2,
  Layers,
  Edit3,
  MapPin,
  DollarSign,
  TrendingUp,
  UserCheck,
  Home,
  Zap,
  Wrench,
  Receipt,
  FileText,
  UserPlus,
  Phone,
  MessageSquare,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Navigation,
  Share2,
} from 'lucide-react'
import { propertyApi, unitApi, tenantApi, expenseApi, maintenanceApi } from '../../api/client'
import { Property, Floor, Unit, Tenant } from '../../types'
import { MobilePage } from '../../components/layout/AppShell'
import { MobileHeader } from '../../components/navigation'
import { formatCurrency, formatDate, ErrorState, SkeletonCard, ProgressBar, EmptyState, Modal, StatusBadge } from '../../components/ui'
import { EditPropertyModal } from '../../components/properties/EditPropertyModal'
import EditUnitModal from './EditUnitModal'
import { useToast } from '../../contexts/ToastContext'

export default function PropertyDetailPage() {
  const { propertyId } = useParams<{ propertyId: string }>()
  const navigate = useNavigate()
  const { success, error: showError } = useToast()

  const [property, setProperty] = useState<(Property & { floors: Floor[] }) | null>(null)
  const [unassignedTenants, setUnassignedTenants] = useState<Tenant[]>([])
  const [activeIssuesCount, setActiveIssuesCount] = useState(0)
  const [totalExpenses, setTotalExpenses] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)

  // Modals
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedUnit, setSelectedUnit] = useState<any | null>(null)
  const [editingUnit, setEditingUnit] = useState<any | null>(null)
  const [showAddUnitModal, setShowAddUnitModal] = useState(false)
  const [assigningUnit, setAssigningUnit] = useState<any | null>(null)

  // Add Unit Form State
  const [newUnitNumber, setNewUnitNumber] = useState('')
  const [newFloorNumber, setNewFloorNumber] = useState('1')
  const [newUnitType, setNewUnitType] = useState('2BHK')
  const [newMonthlyRent, setNewMonthlyRent] = useState('')
  const [newDeposit, setNewDeposit] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Assign Tenant State
  const [selectedTenantId, setSelectedTenantId] = useState('')
  const [joiningDate, setJoiningDate] = useState(new Date().toISOString().split('T')[0])
  const [rentDueDay, setRentDueDay] = useState('5')

  const loadData = async () => {
    if (!propertyId) return
    setIsLoading(true)
    setError(false)
    try {
      const [propRes, tenRes, expRes, maintRes] = await Promise.all([
        propertyApi.get(propertyId),
        tenantApi.list({ unassigned: true }),
        expenseApi.list({ property_id: propertyId }),
        maintenanceApi.list({ property_id: propertyId }),
      ])
      setProperty(propRes.data.data)
      setUnassignedTenants(tenRes.data.data || [])
      setTotalExpenses(expRes.data.total_amount || 0)
      
      const maintList = maintRes.data.data || []
      const activeCount = maintList.filter((m: any) => m.status !== 'completed' && m.status !== 'cancelled').length
      setActiveIssuesCount(activeCount)
    } catch {
      setError(true)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [propertyId])

  // BI Metrics
  const biMetrics = useMemo(() => {
    if (!property) return null
    const totalUnits = property.total_units || 0
    const occupied = property.occupied_units || 0
    const vacant = property.vacant_units || 0
    const occRate = property.occupancy_rate || 0

    // Calculate total potential monthly revenue
    let totalPotentialRent = 0
    let currentContractedRent = 0

    if (property.floors) {
      property.floors.forEach((f) => {
        f.units.forEach((u: any) => {
          totalPotentialRent += u.monthly_rent || 0
          if (u.status === 'occupied') {
            currentContractedRent += u.monthly_rent || 0
          }
        })
      })
    }

    const netOperatingIncome = currentContractedRent - totalExpenses

    return {
      totalUnits,
      occupied,
      vacant,
      occRate,
      totalPotentialRent: totalPotentialRent || property.monthly_rent,
      currentContractedRent,
      totalExpenses,
      netOperatingIncome,
    }
  }, [property, totalExpenses])

  const handleAddUnit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!propertyId || !newUnitNumber || !newMonthlyRent) {
      showError('Please provide unit number and rent amount')
      return
    }

    setIsSubmitting(true)
    try {
      await unitApi.create({
        property_id: propertyId,
        unit_number: newUnitNumber,
        floor_number: parseInt(newFloorNumber) || 1,
        unit_type: newUnitType,
        monthly_rent: parseFloat(newMonthlyRent),
        maintenance_charge: 0,
        security_deposit: parseFloat(newDeposit) || parseFloat(newMonthlyRent) * 2,
      })
      success(`Unit ${newUnitNumber} added to building!`)
      setShowAddUnitModal(false)
      setNewUnitNumber('')
      setNewMonthlyRent('')
      setNewDeposit('')
      loadData()
    } catch (err: any) {
      showError(err.response?.data?.detail || 'Failed to add unit')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAssignTenant = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!assigningUnit || !selectedTenantId) {
      showError('Please select a tenant')
      return
    }

    setIsSubmitting(true)
    try {
      await tenantApi.assign({
        tenant_id: selectedTenantId,
        unit_id: assigningUnit._id || assigningUnit.id,
        property_id: propertyId!,
        monthly_rent: assigningUnit.monthly_rent,
        maintenance_charge: assigningUnit.maintenance_charge || 0,
        security_deposit: assigningUnit.security_deposit || assigningUnit.monthly_rent * 2,
        rent_due_day: parseInt(rentDueDay) || 5,
        joining_date: joiningDate,
      })
      success('Tenant assigned successfully!')
      setAssigningUnit(null)
      setSelectedTenantId('')
      loadData()
    } catch (err: any) {
      showError(err.response?.data?.detail || 'Failed to assign tenant')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleVacateUnit = async (unit: any) => {
    if (!unit.tenant_id) return
    if (!window.confirm(`Are you sure you want to vacate Flat ${unit.unit_number}?`)) return
    try {
      await tenantApi.vacate(unit.tenant_id)
      success(`Flat ${unit.unit_number} marked vacant!`)
      setSelectedUnit(null)
      loadData()
    } catch (err: any) {
      showError(err.response?.data?.detail || 'Failed to vacate unit')
    }
  }

  return (
    <MobilePage
      role="owner"
      header={
        <MobileHeader
          title={property?.name || 'Building Details'}
          showBack
          rightAction={
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setShowEditModal(true)}
                style={{ gap: '0.25rem' }}
              >
                <Edit3 size={14} /> Edit
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setShowAddUnitModal(true)}
                style={{ gap: '0.25rem' }}
              >
                <Plus size={14} /> Unit
              </button>
            </div>
          }
        />
      }
    >
      {/* Desktop Header */}
      <div className="hidden-mobile" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h1 style={{ fontSize: '1.375rem', fontWeight: 900, margin: 0, color: '#0F172A' }}>
              {property?.name || 'Property Details'}
            </h1>
            <span style={{ fontSize: '0.6875rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '1rem', background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}>
              {property?.total_floors || 1} Floors • {property?.total_units || 0} Flats
            </span>
          </div>
          <p style={{ fontSize: '0.8125rem', color: '#64748B', margin: '0.2rem 0 0', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <MapPin size={13} color="#2563EB" /> {property?.address}, {property?.city}, {property?.state} {property?.pincode}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => navigate(`/owner/rent/generate?property_id=${propertyId}`)}
            style={{ gap: '0.375rem', fontWeight: 600, color: '#2563EB', background: '#EFF6FF', borderColor: '#BFDBFE' }}
          >
            ⚡ Generate Invoices
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setShowEditModal(true)}
            style={{ gap: '0.375rem', fontWeight: 600 }}
          >
            <Edit3 size={14} /> Edit Building
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setShowAddUnitModal(true)}
            style={{ gap: '0.375rem', fontWeight: 700 }}
          >
            <Plus size={14} /> Add Flat
          </button>
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : error ? (
        <ErrorState onRetry={loadData} />
      ) : property && biMetrics ? (
        <>
          {/* BI FINANCIAL & OPERATIONAL KPI CARDS */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
              gap: '0.75rem',
              marginBottom: '1rem',
            }}
          >
            <div className="card" style={{ padding: '0.875rem 1rem', borderLeft: '4px solid #10B981', background: '#FFFFFF' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Occupancy Rate</span>
                <CheckCircle2 size={16} color="#10B981" />
              </div>
              <div style={{ fontSize: '1.375rem', fontWeight: 900, color: '#0F172A', fontVariantNumeric: 'tabular-nums' }}>
                {biMetrics.occRate.toFixed(0)}%
              </div>
              <p style={{ fontSize: '0.6875rem', color: '#059669', margin: '0.1rem 0 0', fontWeight: 600 }}>
                {biMetrics.occupied}/{biMetrics.totalUnits} Units Occupied
              </p>
            </div>

            <div className="card" style={{ padding: '0.875rem 1rem', borderLeft: '4px solid #3B82F6', background: '#FFFFFF' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Contracted Rent</span>
                <DollarSign size={16} color="#3B82F6" />
              </div>
              <div style={{ fontSize: '1.375rem', fontWeight: 900, color: '#0F172A', fontVariantNumeric: 'tabular-nums' }}>
                {formatCurrency(biMetrics.currentContractedRent)}
              </div>
              <p style={{ fontSize: '0.6875rem', color: '#64748B', margin: '0.1rem 0 0' }}>
                Potential: {formatCurrency(biMetrics.totalPotentialRent)}/mo
              </p>
            </div>

            <div className="card" style={{ padding: '0.875rem 1rem', borderLeft: '4px solid #F59E0B', background: '#FFFFFF' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Active Repairs</span>
                <Wrench size={16} color="#F59E0B" />
              </div>
              <div style={{ fontSize: '1.375rem', fontWeight: 900, color: activeIssuesCount > 0 ? '#B45309' : '#0F172A', fontVariantNumeric: 'tabular-nums' }}>
                {activeIssuesCount} Open
              </div>
              <p style={{ fontSize: '0.6875rem', color: '#64748B', margin: '0.1rem 0 0' }}>
                <button
                  type="button"
                  onClick={() => navigate('/owner/maintenance')}
                  style={{ background: 'none', border: 'none', padding: 0, color: '#2563EB', fontWeight: 600, fontSize: '0.6875rem', cursor: 'pointer' }}
                >
                  View tickets →
                </button>
              </p>
            </div>

            <div className="card" style={{ padding: '0.875rem 1rem', borderLeft: '4px solid #8B5CF6', background: '#FFFFFF' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Building OPEX</span>
                <Receipt size={16} color="#8B5CF6" />
              </div>
              <div style={{ fontSize: '1.375rem', fontWeight: 900, color: '#0F172A', fontVariantNumeric: 'tabular-nums' }}>
                {formatCurrency(totalExpenses)}
              </div>
              <p style={{ fontSize: '0.6875rem', color: '#64748B', margin: '0.1rem 0 0' }}>
                <button
                  type="button"
                  onClick={() => navigate('/owner/expenses')}
                  style={{ background: 'none', border: 'none', padding: 0, color: '#2563EB', fontWeight: 600, fontSize: '0.6875rem', cursor: 'pointer' }}
                >
                  View expenses →
                </button>
              </p>
            </div>
          </div>

          {/* ADDRESS & LOCATION BAR WITH MAPS SHORTCUT */}
          <div
            className="card"
            style={{
              padding: '1rem',
              marginBottom: '1rem',
              background: '#FFFFFF',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                <MapPin size={15} color="#DC2626" />
                <span style={{ fontWeight: 800, fontSize: '0.875rem', color: '#0F172A' }}>Address & Location</span>
              </div>
              <p style={{ fontSize: '0.8125rem', color: '#475569', margin: 0 }}>
                {property.address}, {property.city}, {property.state} {property.pincode}
              </p>
              {property.description && (
                <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '0.25rem 0 0' }}>
                  {property.description}
                </p>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.375rem' }}>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${property.name} ${property.address} ${property.city}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.75rem', gap: '0.25rem', textDecoration: 'none' }}
              >
                <Navigation size={13} /> Open in Maps
              </a>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setShowEditModal(true)}
                style={{ fontSize: '0.75rem', gap: '0.25rem' }}
              >
                <Edit3 size={13} /> Edit Info
              </button>
            </div>
          </div>

          {/* FLOORS & UNITS MATRIX SECTION */}
          <div className="card" style={{ padding: '1.25rem', background: '#FFFFFF', borderRadius: '0.75rem', border: '1px solid #E2E8F0', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>
                  Interactive Floor Stacking Matrix
                </h3>
                <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '0.1rem 0 0' }}>
                  Click on any flat to view tenant details, assign new residents, or manage rent
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.6875rem' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }}></span> Occupied
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3B82F6' }}></span> Vacant
                  </span>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => setShowAddUnitModal(true)} style={{ gap: '0.25rem', fontWeight: 700 }}>
                  <Plus size={14} /> Add Flat
                </button>
              </div>
            </div>

            {property.floors && property.floors.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {[...property.floors]
                  .sort((a, b) => b.floor_number - a.floor_number)
                  .map((floor) => {
                    const occCount = floor.units.filter((u: any) => u.status === 'occupied').length
                    return (
                      <div
                        key={floor.floor_number}
                        style={{
                          background: '#F8FAFC',
                          borderRadius: '0.75rem',
                          padding: '0.875rem',
                          border: '1px solid #E2E8F0',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.625rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontWeight: 800, fontSize: '0.875rem', color: '#0F172A' }}>
                              Floor {floor.floor_number}
                            </span>
                            <span style={{ fontSize: '0.6875rem', color: '#64748B' }}>
                              ({floor.units.length} Flats)
                            </span>
                          </div>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: occCount === floor.units.length ? '#059669' : '#D97706' }}>
                            {occCount}/{floor.units.length} occupied
                          </span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '0.625rem' }}>
                          {floor.units.map((unit: any) => {
                            const isOcc = unit.status === 'occupied'
                            return (
                              <div
                                key={unit._id || unit.id}
                                onClick={() => setSelectedUnit(unit)}
                                style={{
                                  padding: '0.75rem',
                                  borderRadius: '0.625rem',
                                  background: isOcc ? '#ECFDF5' : '#EFF6FF',
                                  border: `1.5px solid ${isOcc ? '#A7F3D0' : '#BFDBFE'}`,
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  justifyContent: 'space-between',
                                  minHeight: 90,
                                }}
                                className="card-hover"
                              >
                                <div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                                    <span style={{ fontWeight: 900, fontSize: '1.0625rem', color: '#0F172A' }}>
                                      {unit.unit_number}
                                    </span>
                                    <span
                                      style={{
                                        fontSize: '0.625rem',
                                        fontWeight: 800,
                                        padding: '0.1rem 0.35rem',
                                        borderRadius: '0.25rem',
                                        background: '#FFFFFF',
                                        color: isOcc ? '#059669' : '#1D4ED8',
                                        border: `1px solid ${isOcc ? '#A7F3D0' : '#BFDBFE'}`,
                                        textTransform: 'uppercase',
                                      }}
                                    >
                                      {unit.status}
                                    </span>
                                  </div>

                                  <p style={{ fontWeight: 800, fontSize: '0.8125rem', margin: 0, color: isOcc ? '#047857' : '#1E40AF', fontVariantNumeric: 'tabular-nums' }}>
                                    {formatCurrency(unit.monthly_rent)}/mo
                                  </p>
                                </div>

                                <div style={{ borderTop: `1px dashed ${isOcc ? '#A7F3D0' : '#BFDBFE'}`, paddingTop: '0.35rem', marginTop: '0.35rem' }}>
                                  <p style={{ fontSize: '0.6875rem', color: isOcc ? '#065F46' : '#64748B', margin: 0, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {isOcc ? `👤 ${unit.tenant_name || 'Resident'}` : '+ Click to Assign'}
                                  </p>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
              </div>
            ) : (
              <EmptyState
                icon={<Layers size={32} />}
                title="No units created for this property"
                description="Add flats and units to start collecting rent and assigning residents."
                action={
                  <button className="btn btn-primary btn-sm" onClick={() => setShowAddUnitModal(true)}>
                    <Plus size={15} /> Add First Unit
                  </button>
                }
              />
            )}
          </div>

          {/* UNIT DETAIL / QUICK ACTION MODAL */}
          {selectedUnit && (
            <Modal isOpen={true} onClose={() => setSelectedUnit(null)} title={`Flat ${selectedUnit.unit_number} Overview`} maxWidth="480px">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #E2E8F0' }}>
                  <div>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 900, margin: 0, color: '#0F172A' }}>
                      Flat {selectedUnit.unit_number} ({selectedUnit.unit_type || '2BHK'})
                    </h3>
                    <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '0.1rem 0 0' }}>
                      Floor {selectedUnit.floor_number} • {property.name}
                    </p>
                  </div>
                  <StatusBadge status={selectedUnit.status} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem', background: '#FFFFFF', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #E2E8F0' }}>
                  <div>
                    <span style={{ fontSize: '0.6875rem', color: '#64748B', fontWeight: 600 }}>Monthly Rent:</span>
                    <p style={{ fontWeight: 800, fontSize: '1rem', margin: 0, color: '#0F172A' }}>{formatCurrency(selectedUnit.monthly_rent)}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.6875rem', color: '#64748B', fontWeight: 600 }}>Security Deposit:</span>
                    <p style={{ fontWeight: 800, fontSize: '1rem', margin: 0, color: '#059669' }}>{formatCurrency(selectedUnit.security_deposit || selectedUnit.monthly_rent * 2)}</p>
                  </div>
                </div>

                {selectedUnit.tenant_name ? (
                  <div style={{ background: '#ECFDF5', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #A7F3D0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <div>
                        <span style={{ fontSize: '0.6875rem', color: '#047857', fontWeight: 700, textTransform: 'uppercase' }}>Current Resident</span>
                        <p style={{ fontWeight: 800, fontSize: '0.9375rem', color: '#065F46', margin: '0.1rem 0 0' }}>
                          👤 {selectedUnit.tenant_name}
                        </p>
                      </div>
                    </div>

                    {selectedUnit.tenant_phone && (
                      <div style={{ display: 'flex', gap: '0.375rem', marginTop: '0.35rem' }}>
                        <a
                          href={`https://wa.me/${selectedUnit.tenant_phone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-ghost btn-sm"
                          style={{ flex: 1, background: '#D1FAE5', color: '#059669', fontSize: '0.75rem', padding: '0.25rem 0.5rem', textDecoration: 'none', justifyContent: 'center' }}
                        >
                          <MessageSquare size={13} /> WhatsApp
                        </a>
                        <a
                          href={`tel:${selectedUnit.tenant_phone}`}
                          className="btn btn-ghost btn-sm"
                          style={{ flex: 1, background: '#D1FAE5', color: '#059669', fontSize: '0.75rem', padding: '0.25rem 0.5rem', textDecoration: 'none', justifyContent: 'center' }}
                        >
                          <Phone size={13} /> Call
                        </a>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ background: '#EFF6FF', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #BFDBFE' }}>
                    <p style={{ fontSize: '0.8125rem', color: '#1E40AF', margin: 0, fontWeight: 600 }}>
                      ℹ️ This flat is vacant and ready for tenant allocation.
                    </p>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', borderTop: '1px solid #F1F5F9', paddingTop: '0.75rem' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      const u = selectedUnit
                      setSelectedUnit(null)
                      setEditingUnit({
                        ...u,
                        property_name: property?.name,
                      })
                    }}
                    style={{ gap: '0.35rem', fontWeight: 700, color: '#2563EB', borderColor: '#BFDBFE', background: '#EFF6FF' }}
                  >
                    <Edit3 size={14} /> Edit Flat
                  </button>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setSelectedUnit(null)}>
                      Close
                    </button>

                    {!selectedUnit.tenant_name ? (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => {
                          const unitToAssign = selectedUnit
                          setSelectedUnit(null)
                          setAssigningUnit(unitToAssign)
                        }}
                        style={{ gap: '0.375rem', fontWeight: 700 }}
                      >
                        <UserPlus size={14} /> Assign Tenant
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => handleVacateUnit(selectedUnit)}
                        style={{ fontWeight: 700 }}
                      >
                        Vacate Flat
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </Modal>
          )}

          {/* EDIT FLAT MODAL */}
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

          {/* ADD FLAT MODAL */}
          <Modal isOpen={showAddUnitModal} onClose={() => setShowAddUnitModal(false)} title={`Add Flat to ${property.name}`} maxWidth="520px">
            <form onSubmit={handleAddUnit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* Flat No. & Floor Number */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="input-label" style={{ fontWeight: 700, fontSize: '0.8125rem' }}>Flat / Unit No. *</label>
                  <input
                    type="text"
                    className="input"
                    required
                    placeholder="e.g. 101, 202, B-4"
                    value={newUnitNumber}
                    onChange={(e) => setNewUnitNumber(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="input-label" style={{ fontWeight: 700, fontSize: '0.8125rem' }}>Floor Number *</label>
                  <input
                    type="number"
                    className="input"
                    required
                    min={0}
                    max={50}
                    value={newFloorNumber}
                    onChange={(e) => setNewFloorNumber(e.target.value)}
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

              {/* Financials: Monthly Rent + Smart Deposit Multipliers */}
              <div style={{ background: '#F8FAFC', padding: '0.75rem', borderRadius: '0.625rem', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <div className="form-group">
                    <label className="input-label" style={{ fontWeight: 700, fontSize: '0.8125rem' }}>Monthly Rent (₹) *</label>
                    <input
                      type="number"
                      className="input"
                      required
                      placeholder="e.g. 18000"
                      value={newMonthlyRent}
                      onChange={(e) => {
                        const val = e.target.value
                        setNewMonthlyRent(val)
                        if (val && !isNaN(parseFloat(val))) {
                          setNewDeposit(String(parseFloat(val) * 2))
                        }
                      }}
                    />
                  </div>

                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                      <label className="input-label" style={{ fontWeight: 700, fontSize: '0.8125rem', margin: 0 }}>Security Deposit (₹)</label>
                    </div>
                    <input
                      type="number"
                      className="input"
                      placeholder="e.g. 36000"
                      value={newDeposit}
                      onChange={(e) => setNewDeposit(e.target.value)}
                    />
                  </div>
                </div>

                {/* Deposit Multiplier Quick Pills */}
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

              {/* Maintenance Surcharge & Carpet Area */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="input-label" style={{ fontWeight: 700, fontSize: '0.8125rem' }}>Maintenance / Month (₹)</label>
                  <input
                    type="number"
                    className="input"
                    placeholder="0"
                    defaultValue="0"
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
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddUnitModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting} style={{ fontWeight: 800, padding: '0.5rem 1.25rem', background: '#0F172A', borderColor: '#0F172A' }}>
                  {isSubmitting ? 'Creating...' : 'Create Flat'}
                </button>
              </div>
            </form>
          </Modal>

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
                    <option value="">-- Choose unassigned resident --</option>
                    {unassignedTenants.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.full_name} ({t.phone || 'No phone'})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="input-label">Move-In Date *</label>
                    <input
                      type="date"
                      className="input"
                      required
                      value={joiningDate}
                      onChange={(e) => setJoiningDate(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="input-label">Rent Due Day of Month</label>
                    <input
                      type="number"
                      min={1}
                      max={28}
                      className="input"
                      required
                      value={rentDueDay}
                      onChange={(e) => setRentDueDay(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
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

          {/* Edit Property Modal */}
          <EditPropertyModal
            property={property}
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            onSuccess={(updated) => {
              setProperty((prev) => (prev ? { ...prev, ...updated } : null))
              success('Building details updated successfully!')
            }}
            onDeleteSuccess={() => {
              navigate('/owner/properties')
            }}
          />
        </>
      ) : null}
    </MobilePage>
  )
}
