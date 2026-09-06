import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Building2, MapPin, ChevronRight, Edit3, Trash2 } from 'lucide-react'
import { propertyApi } from '../../api/client'
import { Property } from '../../types'
import { MobilePage } from '../../components/layout/AppShell'
import { MobileHeader } from '../../components/navigation'
import { EmptyState, ErrorState, SkeletonCard, ProgressBar } from '../../components/ui'
import { EditPropertyModal } from '../../components/properties/EditPropertyModal'

export default function PropertiesPage() {
  const navigate = useNavigate()
  const [properties, setProperties] = useState<Property[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)
  const [editingProperty, setEditingProperty] = useState<Property | null>(null)

  const load = async () => {
    setIsLoading(true)
    setError(false)
    try {
      const res = await propertyApi.list()
      setProperties(res.data.data || [])
    } catch {
      setError(true)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handlePropertyUpdated = (updated: Property) => {
    setProperties((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)))
  }

  const handlePropertyDeleted = (deletedId: string) => {
    setProperties((prev) => prev.filter((p) => p.id !== deletedId))
  }

  return (
    <MobilePage
      role="owner"
      header={
        <MobileHeader
          title="Properties & Buildings"
          showBack
          rightAction={
            <button
              className="btn btn-primary btn-sm"
              onClick={() => navigate('/owner/properties/new')}
              aria-label="Add property"
              style={{ gap: '0.25rem' }}
            >
              <Plus size={15} />
              Add Building
            </button>
          }
        />
      }
    >
      {/* Desktop Header Row */}
      <div className="module-header hidden-mobile">
        <div className="module-header-info">
          <h1 className="module-header-title">
            Buildings & Properties ({properties.length})
          </h1>
          <p className="module-header-subtitle">
            Manage flats, floors, and occupancy across your real estate portfolio
          </p>
        </div>

        <div className="module-header-action">
          <button
            className="btn btn-primary"
            onClick={() => navigate('/owner/properties/new')}
            style={{ gap: '0.375rem' }}
          >
            <Plus size={16} /> Add Building
          </button>
        </div>
      </div>

      <div className="cards-grid">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : error ? (
          <ErrorState onRetry={load} />
        ) : properties.length === 0 ? (
          <div style={{ gridColumn: '1 / -1' }}>
            <EmptyState
              icon={<Building2 size={32} />}
              title="No properties yet"
              description="Add your first building to start managing your rental properties."
              action={
                <button className="btn btn-primary" onClick={() => navigate('/owner/properties/new')}>
                  <Plus size={18} /> Add Property
                </button>
              }
            />
          </div>
        ) : (
          properties.map((p) => (
            <PropertyCard
              key={p.id}
              property={p}
              onClick={() => navigate(`/owner/properties/${p.id}`)}
              onEdit={() => setEditingProperty(p)}
            />
          ))
        )}
      </div>

      {/* Edit Property Modal */}
      <EditPropertyModal
        property={editingProperty}
        isOpen={!!editingProperty}
        onClose={() => setEditingProperty(null)}
        onSuccess={handlePropertyUpdated}
        onDeleteSuccess={handlePropertyDeleted}
      />
    </MobilePage>
  )
}

function PropertyCard({
  property,
  onClick,
  onEdit,
}: {
  property: Property
  onClick: () => void
  onEdit: () => void
}) {
  const occ = property.occupancy_rate
  const occColor = occ >= 80 ? 'success' : occ >= 50 ? 'warning' : 'danger'

  return (
    <div
      onClick={onClick}
      className="card card-hover"
      style={{
        padding: '1rem 1.125rem',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: '0.875rem',
        position: 'relative',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', minWidth: 0, flex: 1 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: '#0F172A',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, color: 'white'
          }}>
            <Building2 size={18} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h3 style={{ fontWeight: 800, fontSize: '0.9375rem', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#0F172A' }}>
              {property.name}
            </h3>
            <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '0.125rem 0 0', display: 'flex', alignItems: 'center', gap: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <MapPin size={12} style={{ flexShrink: 0 }} />
              {property.city}, {property.state}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexShrink: 0 }}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onEdit()
            }}
            className="btn btn-ghost btn-sm"
            style={{
              padding: '0.25rem 0.5rem',
              height: 28,
              fontSize: '0.75rem',
              fontWeight: 600,
              borderRadius: 6,
              gap: '0.25rem',
              color: '#2563EB',
              background: '#EFF6FF',
              border: '1px solid #DBEAFE',
            }}
            title="Edit property details"
            aria-label={`Edit ${property.name}`}
          >
            <Edit3 size={13} />
            <span>Edit</span>
          </button>
          <ChevronRight size={18} style={{ color: '#94A3B8' }} />
        </div>
      </div>

      {/* Inline Compact Stats Pills */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.375rem', textAlign: 'center' }}>
        <div style={{ background: '#F8FAFC', borderRadius: 'var(--radius-sm)', padding: '0.375rem 0.25rem', border: '1px solid #F1F5F9' }}>
          <p style={{ fontWeight: 800, fontSize: '0.875rem', margin: 0, fontVariantNumeric: 'tabular-nums', color: '#0F172A' }}>{property.total_units}</p>
          <p style={{ fontSize: '0.625rem', color: '#64748B', margin: 0, fontWeight: 600 }}>Units</p>
        </div>
        <div style={{ background: '#ECFDF5', borderRadius: 'var(--radius-sm)', padding: '0.375rem 0.25rem', border: '1px solid #D1FAE5' }}>
          <p style={{ fontWeight: 800, fontSize: '0.875rem', margin: 0, color: '#059669', fontVariantNumeric: 'tabular-nums' }}>{property.occupied_units}</p>
          <p style={{ fontSize: '0.625rem', color: '#059669', margin: 0, fontWeight: 700 }}>Occupied</p>
        </div>
        <div style={{ background: '#FFFBEB', borderRadius: 'var(--radius-sm)', padding: '0.375rem 0.25rem', border: '1px solid #FEF3C7' }}>
          <p style={{ fontWeight: 800, fontSize: '0.875rem', margin: 0, color: '#D97706', fontVariantNumeric: 'tabular-nums' }}>{property.vacant_units}</p>
          <p style={{ fontSize: '0.625rem', color: '#D97706', margin: 0, fontWeight: 700 }}>Vacant</p>
        </div>
      </div>

      {/* Occupancy Progress */}
      <div style={{ paddingTop: '0.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.6875rem' }}>
          <span style={{ color: '#64748B', fontWeight: 600 }}>Occupancy</span>
          <span style={{ fontWeight: 800, color: '#0F172A' }}>{occ}%</span>
        </div>
        <ProgressBar value={occ} color={occColor} />
      </div>
    </div>
  )
}
