import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus,
  Building2,
  MapPin,
  ChevronRight,
  Edit3,
  Trash2,
  DollarSign,
  Users,
  Search,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowRight,
  TrendingUp,
  Sparkles,
} from 'lucide-react'
import { propertyApi } from '../../api/client'
import { Property } from '../../types'
import { MobilePage } from '../../components/layout/AppShell'
import { MobileHeader } from '../../components/navigation'
import { formatCurrency, EmptyState, ErrorState, SkeletonCard, ProgressBar } from '../../components/ui'
import { EditPropertyModal } from '../../components/properties/EditPropertyModal'

export default function PropertiesPage() {
  const navigate = useNavigate()
  const [properties, setProperties] = useState<Property[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)
  const [editingProperty, setEditingProperty] = useState<Property | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [cityFilter, setCityFilter] = useState('all')

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

  useEffect(() => {
    load()
  }, [])

  const handlePropertyUpdated = (updated: Property) => {
    setProperties((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)))
  }

  const handlePropertyDeleted = (deletedId: string) => {
    setProperties((prev) => prev.filter((p) => p.id !== deletedId))
  }

  // BI Metrics
  const biMetrics = useMemo(() => {
    const totalBuildings = properties.length
    const totalUnits = properties.reduce((acc, curr) => acc + (curr.total_units || 0), 0)
    const occupiedUnits = properties.reduce((acc, curr) => acc + (curr.occupied_units || 0), 0)
    const vacantUnits = properties.reduce((acc, curr) => acc + (curr.vacant_units || 0), 0)
    const totalMonthlyRent = properties.reduce((acc, curr) => acc + (curr.monthly_rent || 0), 0)
    const avgOccupancy = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0

    const cities = Array.from(new Set(properties.map((p) => p.city).filter(Boolean)))

    return {
      totalBuildings,
      totalUnits,
      occupiedUnits,
      vacantUnits,
      totalMonthlyRent,
      avgOccupancy,
      cities,
    }
  }, [properties])

  // Filtered Properties
  const filteredProperties = useMemo(() => {
    return properties.filter((p) => {
      if (cityFilter !== 'all' && p.city !== cityFilter) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchName = p.name?.toLowerCase().includes(q)
        const matchCity = p.city?.toLowerCase().includes(q)
        const matchAddr = p.address?.toLowerCase().includes(q)
        if (!matchName && !matchCity && !matchAddr) return false
      }
      return true
    })
  }, [properties, cityFilter, searchQuery])

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
              <Plus size={15} /> Add
            </button>
          }
        />
      }
    >
      {/* Desktop Header Row */}
      <div className="hidden-mobile" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>
            Real Estate Portfolio & Buildings ({properties.length})
          </h1>
          <p style={{ fontSize: '0.8125rem', color: '#64748B', margin: '0.125rem 0 0' }}>
            Manage buildings, floor stacking layouts, occupancy distribution, and rental yields
          </p>
        </div>

        <button
          className="btn btn-primary btn-sm"
          onClick={() => navigate('/owner/properties/new')}
          style={{ gap: '0.375rem', fontWeight: 700 }}
        >
          <Plus size={15} /> Add New Building
        </button>
      </div>

      {/* PORTFOLIO BI KPI METRICS */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '0.875rem',
          marginBottom: '1.25rem',
        }}
      >
        <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #3B82F6', background: '#FFFFFF' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Portfolio Assets</span>
            <Building2 size={16} color="#3B82F6" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0F172A', fontVariantNumeric: 'tabular-nums' }}>
            {biMetrics.totalBuildings} <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#64748B' }}>Buildings</span>
          </div>
          <p style={{ fontSize: '0.6875rem', color: '#64748B', margin: '0.15rem 0 0' }}>
            {biMetrics.totalUnits} Total Flats / Units
          </p>
        </div>

        <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #10B981', background: '#FFFFFF' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Average Occupancy</span>
            <CheckCircle2 size={16} color="#10B981" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0F172A', fontVariantNumeric: 'tabular-nums' }}>
            {biMetrics.avgOccupancy}%
          </div>
          <p style={{ fontSize: '0.6875rem', color: '#059669', margin: '0.15rem 0 0', fontWeight: 600 }}>
            {biMetrics.occupiedUnits} Occupied • {biMetrics.vacantUnits} Vacant
          </p>
        </div>

        <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #8B5CF6', background: '#FFFFFF' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Monthly Rent Potential</span>
            <DollarSign size={16} color="#8B5CF6" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0F172A', fontVariantNumeric: 'tabular-nums' }}>
            {formatCurrency(biMetrics.totalMonthlyRent)}
          </div>
          <p style={{ fontSize: '0.6875rem', color: '#64748B', margin: '0.15rem 0 0' }}>
            Combined portfolio gross target
          </p>
        </div>
      </div>

      {/* SEARCH & FILTER BAR */}
      <div className="card" style={{ padding: '0.75rem 1rem', marginBottom: '1rem', background: '#FFFFFF' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', flex: '1 1 240px' }}>
            <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              className="input"
              style={{ paddingLeft: '2rem', height: 36, fontSize: '0.8125rem' }}
              placeholder="Search by building name, address, city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* City Filter Pills */}
          <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto' }}>
            <button
              type="button"
              onClick={() => setCityFilter('all')}
              className={`btn btn-sm ${cityFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
            >
              All Locations ({properties.length})
            </button>
            {biMetrics.cities.map((city) => (
              <button
                key={city}
                type="button"
                onClick={() => setCityFilter(city)}
                className={`btn btn-sm ${cityFilter === city ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
              >
                📍 {city}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* PROPERTIES CARDS GRID */}
      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '0.875rem' }}>
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : error ? (
        <ErrorState onRetry={load} />
      ) : filteredProperties.length === 0 ? (
        <EmptyState
          icon={<Building2 size={32} />}
          title="No properties match your filter"
          description={searchQuery ? `No properties found for "${searchQuery}"` : 'Add your first building to start managing your rental properties.'}
          action={
            <button className="btn btn-primary" onClick={() => navigate('/owner/properties/new')}>
              <Plus size={18} /> Add Property
            </button>
          }
        />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '1rem',
          }}
        >
          {filteredProperties.map((p) => (
            <PropertyCard
              key={p.id}
              property={p}
              onClick={() => navigate(`/owner/properties/${p.id}`)}
              onEdit={() => setEditingProperty(p)}
              onGenerateRent={() => navigate(`/owner/rent/generate?property_id=${p.id}`)}
            />
          ))}
        </div>
      )}

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
  onGenerateRent,
}: {
  property: Property
  onClick: () => void
  onEdit: () => void
  onGenerateRent: () => void
}) {
  const occ = property.occupancy_rate || 0
  const occColor = occ >= 80 ? 'success' : occ >= 50 ? 'warning' : 'danger'

  return (
    <div
      className="card card-hover"
      style={{
        padding: '1.125rem',
        borderRadius: '0.875rem',
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: '0.875rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
      }}
    >
      <div>
        {/* Header: Icon + Title + Location + Edit Button */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <div
            onClick={onClick}
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0, flex: 1, cursor: 'pointer' }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: '#0F172A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                color: 'white',
              }}
            >
              <Building2 size={22} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <h3
                style={{
                  fontWeight: 900,
                  fontSize: '1rem',
                  margin: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  color: '#0F172A',
                }}
                className="hover-underline"
              >
                {property.name}
              </h3>
              <p
                style={{
                  fontSize: '0.75rem',
                  color: '#64748B',
                  margin: '0.15rem 0 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                <MapPin size={12} color="#2563EB" style={{ flexShrink: 0 }} />
                {property.city}, {property.state}
              </p>
            </div>
          </div>

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
          >
            <Edit3 size={13} />
            <span>Edit</span>
          </button>
        </div>

        {/* Stats Pill Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.375rem', textAlign: 'center', marginBottom: '0.75rem' }}>
          <div style={{ background: '#F8FAFC', borderRadius: '0.5rem', padding: '0.45rem 0.25rem', border: '1px solid #F1F5F9' }}>
            <p style={{ fontWeight: 800, fontSize: '0.9375rem', margin: 0, fontVariantNumeric: 'tabular-nums', color: '#0F172A' }}>
              {property.total_units}
            </p>
            <p style={{ fontSize: '0.625rem', color: '#64748B', margin: 0, fontWeight: 600 }}>Total Flats</p>
          </div>
          <div style={{ background: '#ECFDF5', borderRadius: '0.5rem', padding: '0.45rem 0.25rem', border: '1px solid #D1FAE5' }}>
            <p style={{ fontWeight: 800, fontSize: '0.9375rem', margin: 0, color: '#059669', fontVariantNumeric: 'tabular-nums' }}>
              {property.occupied_units}
            </p>
            <p style={{ fontSize: '0.625rem', color: '#059669', margin: 0, fontWeight: 700 }}>Occupied</p>
          </div>
          <div style={{ background: '#FFFBEB', borderRadius: '0.5rem', padding: '0.45rem 0.25rem', border: '1px solid #FEF3C7' }}>
            <p style={{ fontWeight: 800, fontSize: '0.9375rem', margin: 0, color: '#D97706', fontVariantNumeric: 'tabular-nums' }}>
              {property.vacant_units}
            </p>
            <p style={{ fontSize: '0.625rem', color: '#D97706', margin: 0, fontWeight: 700 }}>Vacant</p>
          </div>
        </div>

        {/* Occupancy Progress Bar */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.6875rem' }}>
            <span style={{ color: '#64748B', fontWeight: 600 }}>Occupancy Health</span>
            <span style={{ fontWeight: 800, color: '#0F172A' }}>{occ}%</span>
          </div>
          <ProgressBar value={occ} color={occColor} />
        </div>
      </div>

      {/* Action Footer */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          borderTop: '1px solid #F1F5F9',
          paddingTop: '0.75rem',
          marginTop: '0.25rem',
        }}
      >
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={onGenerateRent}
          style={{ flex: 1, fontSize: '0.75rem', color: '#2563EB', background: '#EFF6FF', borderColor: '#BFDBFE', fontWeight: 600, gap: '0.25rem' }}
        >
          ⚡ Rent Invoices
        </button>

        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={onClick}
          style={{ flex: 1, fontSize: '0.75rem', fontWeight: 700, gap: '0.25rem' }}
        >
          <Layers size={13} /> View Floors →
        </button>
      </div>
    </div>
  )
}
