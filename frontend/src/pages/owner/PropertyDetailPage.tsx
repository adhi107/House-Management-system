import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Plus, Building2, Layers, Edit3, MapPin } from 'lucide-react'
import { propertyApi } from '../../api/client'
import { Property, Floor } from '../../types'
import { MobilePage } from '../../components/layout/AppShell'
import { MobileHeader } from '../../components/navigation'
import { formatCurrency, ErrorState, SkeletonCard, ProgressBar, EmptyState } from '../../components/ui'
import { EditPropertyModal } from '../../components/properties/EditPropertyModal'

export default function PropertyDetailPage() {
  const { propertyId } = useParams<{ propertyId: string }>()
  const navigate = useNavigate()
  const [property, setProperty] = useState<(Property & { floors: Floor[] }) | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  const loadData = () => {
    setIsLoading(true)
    setError(false)
    propertyApi.get(propertyId!)
      .then((res) => {
        setProperty(res.data.data)
      })
      .catch(() => setError(true))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    loadData()
  }, [propertyId])

  return (
    <MobilePage
      role="owner"
      header={
        <MobileHeader
          title={property?.name || 'Property Details'}
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
                onClick={() => navigate(`/owner/units?property_id=${propertyId}`)}
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
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>
            {property?.name || 'Property Details'}
          </h1>
          <p style={{ fontSize: '0.8125rem', color: '#64748B', margin: '0.125rem 0 0', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <MapPin size={13} /> {property?.address}, {property?.city}, {property?.state}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setShowEditModal(true)}
            style={{ gap: '0.375rem' }}
          >
            <Edit3 size={14} /> Edit Building
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => navigate(`/owner/units?property_id=${propertyId}`)}
            style={{ gap: '0.375rem' }}
          >
            <Plus size={14} /> Add Unit
          </button>
        </div>
      </div>

      {isLoading ? (
        <SkeletonCard />
      ) : error ? (
        <ErrorState onRetry={loadData} />
      ) : property ? (
        <>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
            {[
              { label: 'Units', value: property.total_units },
              { label: 'Occupied', value: property.occupied_units, color: 'success' },
              { label: 'Vacant', value: property.vacant_units, color: property.vacant_units > 0 ? 'warning' : '' },
              { label: 'Floors', value: property.total_floors },
            ].map((s) => (
              <div key={s.label} className="card" style={{ padding: '0.75rem', textAlign: 'center' }}>
                <p style={{ fontWeight: 800, fontSize: '1.25rem', margin: '0 0 0.125rem', color: s.color ? `rgb(var(--${s.color}))` : 'rgb(var(--foreground))' }}>{s.value}</p>
                <p style={{ fontSize: '0.625rem', color: 'rgb(var(--muted-foreground))', margin: 0, fontWeight: 500 }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Occupancy */}
          <div className="card" style={{ padding: '1rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Occupancy Rate</span>
              <span style={{ fontWeight: 700, color: 'rgb(var(--primary))' }}>{property.occupancy_rate.toFixed(1)}%</span>
            </div>
            <ProgressBar value={property.occupancy_rate} color={property.occupancy_rate >= 80 ? 'success' : property.occupancy_rate >= 50 ? 'warning' : 'danger'} />
            <p style={{ fontSize: '0.75rem', color: 'rgb(var(--muted-foreground))', margin: '0.5rem 0 0' }}>
              Monthly Revenue: <strong>{formatCurrency(property.monthly_rent)}</strong>
            </p>
          </div>

          {/* Address & Details */}
          <div className="card" style={{ padding: '1rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontWeight: 600, fontSize: '0.875rem', margin: '0 0 0.375rem' }}>📍 Address & Location</p>
              <p style={{ fontSize: '0.875rem', color: 'rgb(var(--muted-foreground))', margin: 0 }}>
                {property.address}, {property.city}, {property.state} {property.pincode}
              </p>
              {property.description && (
                <p style={{ fontSize: '0.8125rem', color: '#64748B', margin: '0.5rem 0 0' }}>
                  {property.description}
                </p>
              )}
            </div>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setShowEditModal(true)}
              style={{ color: '#2563EB', padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
            >
              <Edit3 size={13} /> Edit
            </button>
          </div>

          {/* Floor view */}
          <div>
            <div className="section-header">
              <h3 className="text-h3" style={{ margin: 0 }}>Floors & Units</h3>
              <button className="btn btn-primary btn-sm" onClick={() => navigate(`/owner/units?property_id=${propertyId}`)}>
                <Plus size={14} /> Add Unit
              </button>
            </div>

            {property.floors && property.floors.length > 0 ? (
              [...property.floors].sort((a, b) => b.floor_number - a.floor_number).map((floor) => (
                <FloorSection key={floor.floor_number} floor={floor} onUnitClick={(unitId) => navigate(`/owner/units/${unitId}`)} />
              ))
            ) : (
              <EmptyState
                icon={<Layers size={32} />}
                title="No units yet"
                description="Add units to this property to start managing tenants."
                action={<button className="btn btn-primary btn-sm" onClick={() => navigate(`/owner/units?property_id=${propertyId}`)}>Add Unit</button>}
              />
            )}
          </div>

          {/* Edit Property Modal */}
          <EditPropertyModal
            property={property}
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            onSuccess={(updated) => {
              setProperty((prev) => prev ? { ...prev, ...updated } : null)
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

function FloorSection({ floor, onUnitClick }: { floor: Floor; onUnitClick: (id: string) => void }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', padding: '0 0.25rem' }}>
        <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>Floor {floor.floor_number}</span>
        <span style={{ fontSize: '0.75rem', color: 'rgb(var(--muted-foreground))' }}>
          {floor.occupied}/{floor.total} occupied
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
        {floor.units.map((unit: any) => (
          <UnitTile key={unit._id || unit.id} unit={unit} onClick={() => onUnitClick(unit._id || unit.id)} />
        ))}
      </div>
    </div>
  )
}

function UnitTile({ unit, onClick }: { unit: any; onClick: () => void }) {
  const statusColors: Record<string, { bg: string; text: string; border: string }> = {
    occupied: { bg: 'rgb(220 252 231 / 0.5)', text: 'rgb(21 128 61)', border: 'rgb(134 239 172)' },
    vacant: { bg: 'rgb(var(--card))', text: 'rgb(var(--muted-foreground))', border: 'rgb(var(--card-border))' },
    maintenance: { bg: 'rgb(254 249 195 / 0.5)', text: 'rgb(161 98 7)', border: 'rgb(253 224 71)' },
  }
  const colors = statusColors[unit.status] || statusColors.vacant

  return (
    <button
      onClick={onClick}
      style={{
        padding: '0.75rem 0.5rem', borderRadius: 'var(--radius-md)', border: `1.5px solid ${colors.border}`,
        background: colors.bg, cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s ease',
      }}
    >
      <p style={{ fontWeight: 700, fontSize: '1rem', margin: '0 0 0.125rem', color: colors.text }}>{unit.unit_number}</p>
      <p style={{ fontSize: '0.5625rem', margin: '0 0 0.25rem', color: colors.text, fontWeight: 600, textTransform: 'uppercase' }}>{unit.status}</p>
      {unit.tenant_name && (
        <p style={{ fontSize: '0.5625rem', margin: 0, color: 'rgb(var(--muted-foreground))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{unit.tenant_name.split(' ')[0]}</p>
      )}
    </button>
  )
}
