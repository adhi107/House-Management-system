import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Building2,
  MapPin,
  Layers,
  ChevronRight,
  Plus,
  Minus,
  Check,
  Sparkles,
  ShieldCheck,
  Key,
  Eye,
  EyeOff,
  User,
  Phone,
  Mail,
  Briefcase,
  FileText,
  Home,
  Zap,
  Droplets,
  CheckCircle2,
  ArrowRight,
  Lock,
  Compass,
  DollarSign,
  AlertCircle,
  HelpCircle,
  Wifi,
  Shield,
} from 'lucide-react'
import { propertyApi, unitApi, tenantApi } from '../../api/client'
import { useToast } from '../../contexts/ToastContext'
import { useAuth } from '../../contexts/AuthContext'
import { MobilePage } from '../../components/layout/AppShell'
import { MobileHeader } from '../../components/navigation'
import { AxiosError } from 'axios'

// ================================================
// CONSTANTS & PRESETS
// ================================================

const PROPERTY_TYPES = [
  { id: 'apartment', label: 'Apartment Complex', icon: '🏢', desc: 'Multi-unit residential flats' },
  { id: 'villa', label: 'Independent Villa', icon: '🏡', desc: 'Standalone luxury home / bungalow' },
  { id: 'commercial', label: 'Commercial Plaza', icon: '🏬', desc: 'Office spaces & retail shops' },
  { id: 'pg', label: 'PG & Co-Living', icon: '🛏️', desc: 'Shared rooms & student hostel' },
  { id: 'gated', label: 'Gated Society', icon: '🏛️', desc: 'Private community towers' },
]

const POPULAR_CITIES = [
  { city: 'Hyderabad', state: 'Telangana', pin: '500001' },
  { city: 'Bengaluru', state: 'Karnataka', pin: '560001' },
  { city: 'Mumbai', state: 'Maharashtra', pin: '400001' },
  { city: 'Delhi NCR', state: 'Delhi', pin: '110001' },
  { city: 'Pune', state: 'Maharashtra', pin: '411001' },
  { city: 'Chennai', state: 'Tamil Nadu', pin: '600001' },
]

const AMENITIES_LIST = [
  { id: 'lift', label: 'Passenger Lift', icon: '🛗' },
  { id: 'water', label: '24/7 Water Supply', icon: '💧' },
  { id: 'cctv', label: '24/7 CCTV Security', icon: '📹' },
  { id: 'backup', label: 'DG Power Backup', icon: '⚡' },
  { id: 'parking', label: 'Covered Parking', icon: '🚗' },
  { id: 'security', label: 'Security Guard', icon: '👮' },
  { id: 'wifi', label: 'Fiber Internet Ready', icon: '📶' },
  { id: 'solar', label: 'Solar Water Heater', icon: '☀️' },
  { id: 'gym', label: 'Gym & Fitness', icon: '🏋️' },
  { id: 'ev', label: 'EV Charging Point', icon: '🔌' },
]

const OCCUPATION_PRESETS = [
  'Software Engineer',
  'Doctor / Healthcare',
  'Business / Trader',
  'Student',
  'Government / PSU',
  'Finance & Banking',
  'Self Employed',
]

// ================================================
// ADD PROPERTY FORM (HIGH-END APP EXPERIENCE)
// ================================================

export function AddPropertyPage() {
  const navigate = useNavigate()
  const { success, error } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [progressMsg, setProgressMsg] = useState('')

  // Form State
  const [form, setForm] = useState({
    name: '',
    property_type: 'apartment',
    address: '',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '500081',
    total_floors: 4,
    description: '',
  })

  // Selected Amenities
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([
    'water',
    'cctv',
    'lift',
    'parking',
  ])

  // Unit Auto Generation Wizard
  const [autoGenUnits, setAutoGenUnits] = useState(true)
  const [unitsPerFloor, setUnitsPerFloor] = useState(2)
  const [defaultUnitType, setDefaultUnitType] = useState('2BHK')
  const [defaultRent, setDefaultRent] = useState('18000')
  const [defaultDeposit, setDefaultDeposit] = useState('36000')
  const [defaultMaintenance, setDefaultMaintenance] = useState('1500')

  const [errors, setErrors] = useState<Record<string, string>>({})

  const toggleAmenity = (id: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    )
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Property name is required'
    if (!form.address.trim()) e.address = 'Street address is required'
    if (!form.city.trim()) e.city = 'City is required'
    if (!form.state.trim()) e.state = 'State is required'
    if (!form.pincode.trim() || form.pincode.length < 6) e.pincode = 'Valid 6-digit Pincode required'
    if (form.total_floors < 1 || form.total_floors > 50) e.total_floors = 'Floors must be between 1 and 50'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setIsLoading(true)
    setProgressMsg('Registering property building...')
    try {
      // Build description with amenities summary
      const amenitiesText = selectedAmenities.length
        ? `\nAmenities: ${selectedAmenities.join(', ')}`
        : ''
      const fullDesc = (form.description + amenitiesText).trim()

      const res = await propertyApi.create({
        name: form.name.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        pincode: form.pincode.trim(),
        total_floors: form.total_floors,
        description: fullDesc || undefined,
      })

      const newPropertyId = res.data.data.id

      // Auto-generate units across all floors if toggled
      if (autoGenUnits && unitsPerFloor > 0) {
        setProgressMsg(`Generating ${form.total_floors * unitsPerFloor} units across ${form.total_floors} floors...`)
        const unitPromises = []
        for (let fl = 1; fl <= form.total_floors; fl++) {
          for (let u = 1; u <= unitsPerFloor; u++) {
            const unitNumber = `${fl}${u < 10 ? '0' + u : u}`
            unitPromises.push(
              unitApi.create({
                property_id: newPropertyId,
                unit_number: unitNumber,
                floor_number: fl,
                unit_type: defaultUnitType,
                monthly_rent: parseFloat(defaultRent) || 0,
                security_deposit: parseFloat(defaultDeposit) || 0,
                maintenance_charge: parseFloat(defaultMaintenance) || 0,
              })
            )
          }
        }
        await Promise.allSettled(unitPromises)
      }

      success(
        autoGenUnits
          ? `🎉 Property "${form.name}" & ${form.total_floors * unitsPerFloor} units created successfully!`
          : `🎉 Property "${form.name}" added successfully!`
      )
      navigate(`/owner/properties/${newPropertyId}`)
    } catch (err) {
      const axiosErr = err as AxiosError<{ detail: string }>
      error(axiosErr.response?.data?.detail || 'Failed to add property')
    } finally {
      setIsLoading(false)
      setProgressMsg('')
    }
  }

  const set = (k: string, v: any) => {
    setForm((p) => ({ ...p, [k]: v }))
    setErrors((p) => ({ ...p, [k]: '' }))
  }

  // Calculate total units preview
  const totalUnitsCalculated = form.total_floors * unitsPerFloor

  return (
    <MobilePage
      role="owner"
      header={<MobileHeader title="Add New Property" showBack />}
      showBottomNav={false}
    >
      <div style={{ maxWidth: 740, margin: '0 auto', paddingBottom: '3rem' }}>
        {/* Hero Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
            borderRadius: '1.125rem',
            padding: '1.5rem',
            color: '#FFFFFF',
            marginBottom: '1.25rem',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 8px 24px -4px rgba(15, 23, 42, 0.25)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: -30,
              right: -30,
              width: 140,
              height: 140,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(59, 130, 246, 0.25) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '0.875rem',
                background: 'linear-gradient(135deg, #2563EB, #3B82F6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)',
              }}
            >
              <Building2 size={24} color="#FFFFFF" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF' }}>
                  Property Registration
                </h1>
                <span
                  style={{
                    background: 'rgba(59, 130, 246, 0.2)',
                    border: '1px solid rgba(59, 130, 246, 0.4)',
                    color: '#93C5FD',
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    padding: '0.15rem 0.5rem',
                    borderRadius: '999px',
                  }}
                >
                  STEP-BY-STEP WIZARD
                </span>
              </div>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem', color: '#94A3B8' }}>
                Set up building specs, location, amenities, and auto-generate tenant units.
              </p>
            </div>
          </div>
        </div>

        {/* Section 1: Property Type */}
        <div className="card" style={{ padding: '1.25rem', marginBottom: '1.25rem' }}>
          <label
            style={{
              display: 'block',
              fontSize: '0.8125rem',
              fontWeight: 800,
              color: '#0F172A',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              marginBottom: '0.75rem',
            }}
          >
            1. Select Property Type
          </label>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: '0.625rem',
            }}
          >
            {PROPERTY_TYPES.map((type) => {
              const active = form.property_type === type.id
              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => set('property_type', type.id)}
                  style={{
                    padding: '0.875rem 0.625rem',
                    borderRadius: '0.75rem',
                    border: active ? '2px solid #2563EB' : '1px solid #E2E8F0',
                    background: active ? '#EFF6FF' : '#F8FAFC',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.15s ease',
                    boxShadow: active ? '0 4px 12px rgba(37, 99, 235, 0.15)' : 'none',
                  }}
                >
                  <span style={{ fontSize: '1.5rem', display: 'block', marginBottom: '0.25rem' }}>
                    {type.icon}
                  </span>
                  <span
                    style={{
                      fontSize: '0.8125rem',
                      fontWeight: 700,
                      color: active ? '#1D4ED8' : '#334155',
                      display: 'block',
                    }}
                  >
                    {type.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Section 2: Building Identity */}
        <div className="card" style={{ padding: '1.25rem', marginBottom: '1.25rem' }}>
          <label
            style={{
              display: 'block',
              fontSize: '0.8125rem',
              fontWeight: 800,
              color: '#0F172A',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              marginBottom: '0.875rem',
            }}
          >
            2. Property Identity & Basic Info
          </label>

          <FormField label="Property / Building Name *" id="prop-name" error={errors.name}>
            <div style={{ position: 'relative' }}>
              <Building2
                size={18}
                style={{
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94A3B8',
                }}
              />
              <input
                id="prop-name"
                type="text"
                className={`input ${errors.name ? 'input-error' : ''}`}
                style={{ paddingLeft: '2.5rem', height: 44, fontSize: '0.9375rem', fontWeight: 600 }}
                placeholder="e.g. Green Valley Residency, Palm Heights"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
              />
            </div>
          </FormField>

          {/* Quick Name Suffix Suggestions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap', marginTop: '-0.25rem', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.6875rem', color: '#64748B', fontWeight: 600 }}>Suggestions:</span>
            {['Residency', 'Heights', 'Apartments', 'Enclave', 'Towers', 'Plaza', 'Villas'].map((suf) => (
              <button
                key={suf}
                type="button"
                onClick={() => {
                  const base = form.name.trim()
                  if (!base) set('name', `Skyline ${suf}`)
                  else if (!base.includes(suf)) set('name', `${base} ${suf}`)
                }}
                style={{
                  padding: '0.2rem 0.5rem',
                  fontSize: '0.6875rem',
                  borderRadius: '999px',
                  background: '#F1F5F9',
                  border: '1px solid #E2E8F0',
                  color: '#475569',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                + {suf}
              </button>
            ))}
          </div>

          <FormField label="Full Street Address *" id="prop-address" error={errors.address}>
            <div style={{ position: 'relative' }}>
              <MapPin
                size={18}
                style={{
                  position: 'absolute',
                  left: 12,
                  top: 14,
                  color: '#94A3B8',
                }}
              />
              <textarea
                id="prop-address"
                className={`input ${errors.address ? 'input-error' : ''}`}
                rows={2}
                style={{ paddingLeft: '2.5rem', fontSize: '0.875rem', resize: 'none' }}
                placeholder="Plot No, Street, Landmark, Near Metro Station..."
                value={form.address}
                onChange={(e) => set('address', e.target.value)}
              />
            </div>
          </FormField>

          {/* Quick Metro City Pills */}
          <div style={{ marginBottom: '0.875rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: '0.375rem' }}>
              Quick Select Metro City:
            </span>
            <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
              {POPULAR_CITIES.map((c) => (
                <button
                  key={c.city}
                  type="button"
                  onClick={() => {
                    set('city', c.city)
                    set('state', c.state)
                    set('pincode', c.pin)
                  }}
                  style={{
                    padding: '0.3rem 0.625rem',
                    fontSize: '0.75rem',
                    borderRadius: '0.5rem',
                    background: form.city === c.city ? '#2563EB' : '#F1F5F9',
                    color: form.city === c.city ? '#FFFFFF' : '#334155',
                    border: form.city === c.city ? '1px solid #2563EB' : '1px solid #E2E8F0',
                    cursor: 'pointer',
                    fontWeight: 600,
                    transition: 'all 0.15s ease',
                  }}
                >
                  {c.city}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem' }}>
            <FormField label="City *" id="prop-city" error={errors.city}>
              <input
                id="prop-city"
                type="text"
                className={`input ${errors.city ? 'input-error' : ''}`}
                value={form.city}
                onChange={(e) => set('city', e.target.value)}
              />
            </FormField>
            <FormField label="State *" id="prop-state" error={errors.state}>
              <input
                id="prop-state"
                type="text"
                className={`input ${errors.state ? 'input-error' : ''}`}
                value={form.state}
                onChange={(e) => set('state', e.target.value)}
              />
            </FormField>
            <FormField label="Pincode (6 digits) *" id="prop-pincode" error={errors.pincode}>
              <input
                id="prop-pincode"
                type="text"
                inputMode="numeric"
                maxLength={6}
                className={`input ${errors.pincode ? 'input-error' : ''}`}
                value={form.pincode}
                onChange={(e) => set('pincode', e.target.value.replace(/\D/g, ''))}
              />
            </FormField>
          </div>
        </div>

        {/* Section 3: Floors & Structural Architecture */}
        <div className="card" style={{ padding: '1.25rem', marginBottom: '1.25rem' }}>
          <label
            style={{
              display: 'block',
              fontSize: '0.8125rem',
              fontWeight: 800,
              color: '#0F172A',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              marginBottom: '0.875rem',
            }}
          >
            3. Floor Architecture & Layout
          </label>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem',
              borderRadius: '0.75rem',
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              marginBottom: '1rem',
            }}
          >
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9375rem', color: '#0F172A' }}>
                Total Number of Floors
              </p>
              <p style={{ margin: '0.15rem 0 0', fontSize: '0.75rem', color: '#64748B' }}>
                From Ground Floor (G) to Top Floor
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => set('total_floors', Math.max(1, form.total_floors - 1))}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: '#FFFFFF',
                  border: '1px solid #CBD5E1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '1.125rem',
                  fontWeight: 800,
                  color: '#0F172A',
                }}
              >
                <Minus size={16} />
              </button>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#2563EB', minWidth: 28, textAlign: 'center' }}>
                {form.total_floors}
              </span>
              <button
                type="button"
                onClick={() => set('total_floors', Math.min(50, form.total_floors + 1))}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: '#FFFFFF',
                  border: '1px solid #CBD5E1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '1.125rem',
                  fontWeight: 800,
                  color: '#0F172A',
                }}
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* Quick Floor Preset Chips */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            {[1, 2, 3, 4, 5, 8, 10, 15].map((fl) => (
              <button
                key={fl}
                type="button"
                onClick={() => set('total_floors', fl)}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  background: form.total_floors === fl ? '#2563EB' : '#F1F5F9',
                  color: form.total_floors === fl ? '#FFFFFF' : '#475569',
                  border: form.total_floors === fl ? '1px solid #2563EB' : '1px solid #E2E8F0',
                  cursor: 'pointer',
                }}
              >
                {fl} {fl === 1 ? 'Floor' : 'Floors'}
              </button>
            ))}
          </div>

          <FormField label="Property Notes / Description (optional)" id="prop-desc">
            <textarea
              id="prop-desc"
              className="input"
              rows={2}
              style={{ fontSize: '0.875rem', resize: 'none' }}
              placeholder="e.g. 24-hr security, dedicated borewell, near metro station gate 2..."
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
            />
          </FormField>
        </div>

        {/* Section 4: Amenities & Highlights */}
        <div className="card" style={{ padding: '1.25rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
            <label
              style={{
                fontSize: '0.8125rem',
                fontWeight: 800,
                color: '#0F172A',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                margin: 0,
              }}
            >
              4. Amenities & Facilities ({selectedAmenities.length} selected)
            </label>
            <button
              type="button"
              onClick={() =>
                setSelectedAmenities(
                  selectedAmenities.length === AMENITIES_LIST.length
                    ? []
                    : AMENITIES_LIST.map((a) => a.id)
                )
              }
              style={{
                background: 'none',
                border: 'none',
                color: '#2563EB',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {selectedAmenities.length === AMENITIES_LIST.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
              gap: '0.625rem',
            }}
          >
            {AMENITIES_LIST.map((amenity) => {
              const checked = selectedAmenities.includes(amenity.id)
              return (
                <button
                  key={amenity.id}
                  type="button"
                  onClick={() => toggleAmenity(amenity.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.625rem 0.75rem',
                    borderRadius: '0.625rem',
                    border: checked ? '1.5px solid #2563EB' : '1px solid #E2E8F0',
                    background: checked ? '#EFF6FF' : '#F8FAFC',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span style={{ fontSize: '1.125rem' }}>{amenity.icon}</span>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: checked ? 700 : 500,
                      color: checked ? '#1E40AF' : '#334155',
                      flex: 1,
                    }}
                  >
                    {amenity.label}
                  </span>
                  {checked && <Check size={14} color="#2563EB" strokeWidth={3} />}
                </button>
              )
            })}
          </div>
        </div>

        {/* Section 5: Smart Unit Auto-Generation Setup */}
        <div
          className="card"
          style={{
            padding: '1.25rem',
            marginBottom: '1.5rem',
            border: autoGenUnits ? '1.5px solid #3B82F6' : '1px solid #E2E8F0',
            background: autoGenUnits ? '#F8FAFC' : '#FFFFFF',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: '1rem',
              marginBottom: autoGenUnits ? '1.25rem' : 0,
            }}
          >
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '0.625rem',
                  background: 'linear-gradient(135deg, #10B981, #059669)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  flexShrink: 0,
                }}
              >
                <Sparkles size={20} />
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: 800, fontSize: '0.9375rem', color: '#0F172A' }}>
                  Fast Unit Auto-Generator
                </p>
                <p style={{ margin: '0.15rem 0 0', fontSize: '0.75rem', color: '#64748B' }}>
                  Automatically generate {totalUnitsCalculated} units across all {form.total_floors} floors (101, 102, 201...)
                </p>
              </div>
            </div>
            <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={autoGenUnits}
                onChange={(e) => setAutoGenUnits(e.target.checked)}
                style={{ width: 22, height: 22, accentColor: '#2563EB', cursor: 'pointer' }}
              />
            </label>
          </div>

          {autoGenUnits && (
            <div
              style={{
                paddingTop: '1rem',
                borderTop: '1px solid #E2E8F0',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}
            >
              {/* Units per floor */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.375rem' }}>
                  Units per Floor:
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {[1, 2, 3, 4, 5, 6].map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setUnitsPerFloor(u)}
                      style={{
                        padding: '0.4rem 0.875rem',
                        borderRadius: '0.5rem',
                        fontSize: '0.8125rem',
                        fontWeight: 700,
                        background: unitsPerFloor === u ? '#2563EB' : '#FFFFFF',
                        color: unitsPerFloor === u ? '#FFFFFF' : '#334155',
                        border: unitsPerFloor === u ? '1px solid #2563EB' : '1px solid #CBD5E1',
                        cursor: 'pointer',
                      }}
                    >
                      {u} {u === 1 ? 'Unit / Floor' : 'Units / Floor'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Default Unit Config */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.375rem' }}>
                    Default Unit Type
                  </label>
                  <select
                    className="input"
                    value={defaultUnitType}
                    onChange={(e) => setDefaultUnitType(e.target.value)}
                    style={{ height: 40, fontSize: '0.8125rem', fontWeight: 600 }}
                  >
                    <option value="1RK">1 RK</option>
                    <option value="1BHK">1 BHK</option>
                    <option value="2BHK">2 BHK</option>
                    <option value="3BHK">3 BHK</option>
                    <option value="4BHK">4 BHK</option>
                    <option value="Studio">Studio Apartment</option>
                    <option value="Commercial">Commercial / Office</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.375rem' }}>
                    Default Monthly Rent (₹)
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    className="input"
                    value={defaultRent}
                    onChange={(e) => setDefaultRent(e.target.value)}
                    style={{ height: 40, fontSize: '0.8125rem', fontWeight: 600 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.375rem' }}>
                    Security Deposit (₹)
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    className="input"
                    value={defaultDeposit}
                    onChange={(e) => setDefaultDeposit(e.target.value)}
                    style={{ height: 40, fontSize: '0.8125rem', fontWeight: 600 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.375rem' }}>
                    Maintenance (₹)
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    className="input"
                    value={defaultMaintenance}
                    onChange={(e) => setDefaultMaintenance(e.target.value)}
                    style={{ height: 40, fontSize: '0.8125rem', fontWeight: 600 }}
                  />
                </div>
              </div>

              {/* Live Preview of Generated Units */}
              <div
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '0.5rem',
                  background: '#EFF6FF',
                  border: '1px solid #BFDBFE',
                  fontSize: '0.75rem',
                  color: '#1E40AF',
                }}
              >
                <span style={{ fontWeight: 800 }}>⚡ Units to be generated ({totalUnitsCalculated} Total):</span>
                <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginTop: '0.375rem' }}>
                  {Array.from({ length: form.total_floors }).map((_, fIdx) => {
                    const fl = fIdx + 1
                    return Array.from({ length: unitsPerFloor }).map((_, uIdx) => {
                      const u = uIdx + 1
                      const num = `${fl}${u < 10 ? '0' + u : u}`
                      return (
                        <span
                          key={num}
                          style={{
                            background: '#DBEAFE',
                            color: '#1E3A8A',
                            fontWeight: 700,
                            padding: '0.125rem 0.375rem',
                            borderRadius: '0.25rem',
                            fontSize: '0.6875rem',
                          }}
                        >
                          Flat {num}
                        </span>
                      )
                    })
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div style={{ position: 'sticky', bottom: '1rem', zIndex: 10 }}>
          <button
            type="button"
            className="btn btn-primary btn-full btn-lg"
            disabled={isLoading}
            onClick={handleSubmit}
            style={{
              height: 52,
              borderRadius: '0.875rem',
              fontSize: '1rem',
              fontWeight: 800,
              boxShadow: '0 8px 20px -2px rgba(37, 99, 235, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.625rem',
            }}
          >
            {isLoading ? (
              <>
                <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
                <span>{progressMsg || 'Processing...'}</span>
              </>
            ) : (
              <>
                <Building2 size={20} />
                <span>Register & Create Property {autoGenUnits ? `(+${totalUnitsCalculated} Units)` : ''}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </MobilePage>
  )
}

// ================================================
// ADD TENANT FORM (HIGH-END APP EXPERIENCE)
// ================================================

export function AddTenantPage() {
  const navigate = useNavigate()
  const { success, error } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    email: '',
    occupation: 'Software Engineer',
    permanent_address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    id_type: 'Aadhaar',
    id_number: '',
    notes: '',
    create_portal_access: true,
    portal_password: 'Pass@' + Math.floor(1000 + Math.random() * 9000),
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.full_name.trim()) e.full_name = 'Tenant full name is required'
    if (!form.phone.trim() || form.phone.replace(/\D/g, '').length < 10) {
      e.phone = 'Valid 10-digit mobile number required'
    }
    if (form.create_portal_access && (!form.portal_password || form.portal_password.length < 6)) {
      e.portal_password = 'Password must be at least 6 characters'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setIsLoading(true)
    try {
      const res = await tenantApi.create({
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        occupation: form.occupation.trim() || undefined,
        permanent_address: form.permanent_address.trim() || undefined,
        emergency_contact_name: form.emergency_contact_name.trim() || undefined,
        emergency_contact_phone: form.emergency_contact_phone.trim() || undefined,
        id_type: form.id_type || undefined,
        id_number: form.id_number.trim() || undefined,
        notes: form.notes.trim() || undefined,
        create_portal_access: form.create_portal_access,
        portal_password: form.create_portal_access ? form.portal_password : undefined,
      })

      success(`🎉 Tenant "${form.full_name}" registered successfully!`)
      navigate(`/owner/tenants/${res.data.data.id}`)
    } catch (err) {
      const axiosErr = err as AxiosError<{ detail: string }>
      error(axiosErr.response?.data?.detail || 'Failed to register tenant')
    } finally {
      setIsLoading(false)
    }
  }

  const set = (k: string, v: any) => {
    setForm((p) => ({ ...p, [k]: v }))
    setErrors((p) => ({ ...p, [k]: '' }))
  }

  const generateRandomPassword = () => {
    const rand = Math.floor(100000 + Math.random() * 900000)
    set('portal_password', `Tenant@${rand}`)
  }

  return (
    <MobilePage
      role="owner"
      header={<MobileHeader title="Register Resident" showBack />}
      showBottomNav={false}
    >
      <div style={{ maxWidth: 740, margin: '0 auto', paddingBottom: '3rem' }}>
        {/* Hero Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, #064E3B 0%, #065F46 100%)',
            borderRadius: '1.125rem',
            padding: '1.5rem',
            color: '#FFFFFF',
            marginBottom: '1.25rem',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 8px 24px -4px rgba(6, 78, 59, 0.25)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '0.875rem',
                background: 'linear-gradient(135deg, #10B981, #059669)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
              }}
            >
              <User size={24} color="#FFFFFF" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF' }}>
                  Resident Onboarding
                </h1>
                <span
                  style={{
                    background: 'rgba(16, 185, 129, 0.25)',
                    border: '1px solid rgba(16, 185, 129, 0.5)',
                    color: '#A7F3D0',
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    padding: '0.15rem 0.5rem',
                    borderRadius: '999px',
                  }}
                >
                  DIGITAL KYC & ACCESS
                </span>
              </div>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem', color: '#D1FAE5' }}>
                Register personal contact details, ID verification, and generate app login credentials.
              </p>
            </div>
          </div>
        </div>

        {/* Section 1: Personal & Contact Details */}
        <div className="card" style={{ padding: '1.25rem', marginBottom: '1.25rem' }}>
          <label
            style={{
              display: 'block',
              fontSize: '0.8125rem',
              fontWeight: 800,
              color: '#0F172A',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              marginBottom: '0.875rem',
            }}
          >
            1. Personal & Contact Information
          </label>

          <FormField label="Tenant Full Name *" id="tenant-name" error={errors.full_name}>
            <div style={{ position: 'relative' }}>
              <User
                size={18}
                style={{
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94A3B8',
                }}
              />
              <input
                id="tenant-name"
                type="text"
                className={`input ${errors.full_name ? 'input-error' : ''}`}
                style={{ paddingLeft: '2.5rem', height: 44, fontSize: '0.9375rem', fontWeight: 600 }}
                placeholder="e.g. Rajeev Adithya, Priya Sharma"
                value={form.full_name}
                onChange={(e) => set('full_name', e.target.value)}
              />
            </div>
          </FormField>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
            <FormField label="Mobile Phone Number *" id="tenant-phone" error={errors.phone}>
              <div style={{ position: 'relative' }}>
                <Phone
                  size={18}
                  style={{
                    position: 'absolute',
                    left: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94A3B8',
                  }}
                />
                <input
                  id="tenant-phone"
                  type="tel"
                  inputMode="tel"
                  className={`input ${errors.phone ? 'input-error' : ''}`}
                  style={{ paddingLeft: '2.5rem', height: 44, fontWeight: 600 }}
                  placeholder="+91 98765 43210"
                  value={form.phone}
                  onChange={(e) => set('phone', e.target.value)}
                />
              </div>
            </FormField>

            <FormField label="Email Address (optional)" id="tenant-email">
              <div style={{ position: 'relative' }}>
                <Mail
                  size={18}
                  style={{
                    position: 'absolute',
                    left: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94A3B8',
                  }}
                />
                <input
                  id="tenant-email"
                  type="email"
                  inputMode="email"
                  className="input"
                  style={{ paddingLeft: '2.5rem', height: 44 }}
                  placeholder="resident@example.com"
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                />
              </div>
            </FormField>
          </div>

          {/* Occupation Selection */}
          <div style={{ marginTop: '0.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.375rem' }}>
              Occupation / Profession
            </label>
            <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
              {OCCUPATION_PRESETS.map((occ) => (
                <button
                  key={occ}
                  type="button"
                  onClick={() => set('occupation', occ)}
                  style={{
                    padding: '0.25rem 0.625rem',
                    fontSize: '0.75rem',
                    borderRadius: '999px',
                    background: form.occupation === occ ? '#059669' : '#F1F5F9',
                    color: form.occupation === occ ? '#FFFFFF' : '#334155',
                    border: form.occupation === occ ? '1px solid #059669' : '1px solid #E2E8F0',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  {occ}
                </button>
              ))}
            </div>
            <input
              type="text"
              className="input"
              placeholder="Or type custom occupation..."
              value={form.occupation}
              onChange={(e) => set('occupation', e.target.value)}
              style={{ height: 38, fontSize: '0.8125rem' }}
            />
          </div>
        </div>

        {/* Section 2: Identification & Verification */}
        <div className="card" style={{ padding: '1.25rem', marginBottom: '1.25rem' }}>
          <label
            style={{
              display: 'block',
              fontSize: '0.8125rem',
              fontWeight: 800,
              color: '#0F172A',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              marginBottom: '0.875rem',
            }}
          >
            2. ID Verification & Emergency Contact
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.375rem' }}>
                ID Proof Document
              </label>
              <select
                className="input"
                value={form.id_type}
                onChange={(e) => set('id_type', e.target.value)}
                style={{ height: 42, fontWeight: 600 }}
              >
                <option value="Aadhaar">Aadhaar Card (UIDAI)</option>
                <option value="PAN">PAN Card</option>
                <option value="Passport">Passport</option>
                <option value="Driving License">Driving License</option>
                <option value="Voter ID">Voter ID</option>
              </select>
            </div>

            <FormField label="ID Document Number" id="id-num">
              <div style={{ position: 'relative' }}>
                <ShieldCheck
                  size={18}
                  style={{
                    position: 'absolute',
                    left: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94A3B8',
                  }}
                />
                <input
                  id="id-num"
                  type="text"
                  className="input"
                  style={{ paddingLeft: '2.5rem', height: 42 }}
                  placeholder="e.g. 1234 5678 9012"
                  value={form.id_number}
                  onChange={(e) => set('id_number', e.target.value)}
                />
              </div>
            </FormField>
          </div>

          <FormField label="Permanent Home Address (optional)" id="tenant-perm-addr">
            <textarea
              id="tenant-perm-addr"
              className="input"
              rows={2}
              style={{ fontSize: '0.875rem', resize: 'none' }}
              placeholder="Permanent home town address..."
              value={form.permanent_address}
              onChange={(e) => set('permanent_address', e.target.value)}
            />
          </FormField>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
            <FormField label="Emergency Contact Name" id="emg-name">
              <input
                id="emg-name"
                type="text"
                className="input"
                placeholder="Parent / Spouse / Relative"
                value={form.emergency_contact_name}
                onChange={(e) => set('emergency_contact_name', e.target.value)}
              />
            </FormField>

            <FormField label="Emergency Phone" id="emg-phone">
              <input
                id="emg-phone"
                type="tel"
                inputMode="tel"
                className="input"
                placeholder="+91 98765 00000"
                value={form.emergency_contact_phone}
                onChange={(e) => set('emergency_contact_phone', e.target.value)}
              />
            </FormField>
          </div>
        </div>

        {/* Section 3: Digital Resident Portal Access */}
        <div
          className="card"
          style={{
            padding: '1.25rem',
            marginBottom: '1.5rem',
            border: form.create_portal_access ? '1.5px solid #10B981' : '1px solid #E2E8F0',
            background: form.create_portal_access ? '#F0FDF4' : '#FFFFFF',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: '1rem',
              marginBottom: form.create_portal_access ? '1.25rem' : 0,
            }}
          >
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '0.625rem',
                  background: 'linear-gradient(135deg, #10B981, #059669)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  flexShrink: 0,
                }}
              >
                <Key size={20} />
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: 800, fontSize: '0.9375rem', color: '#0F172A' }}>
                  Resident Mobile App & Portal Access
                </p>
                <p style={{ margin: '0.15rem 0 0', fontSize: '0.75rem', color: '#475569' }}>
                  Enables resident to login with phone number to view rent receipts, agreements & raise tickets.
                </p>
              </div>
            </div>
            <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={form.create_portal_access}
                onChange={(e) => set('create_portal_access', e.target.checked)}
                style={{ width: 22, height: 22, accentColor: '#10B981', cursor: 'pointer' }}
              />
            </label>
          </div>

          {form.create_portal_access && (
            <div
              style={{
                paddingTop: '1rem',
                borderTop: '1px solid #DCFCE7',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              <FormField
                label="Set Initial Portal Login Password *"
                id="portal-pwd"
                error={errors.portal_password}
              >
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <Lock
                      size={18}
                      style={{
                        position: 'absolute',
                        left: 12,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#94A3B8',
                      }}
                    />
                    <input
                      id="portal-pwd"
                      type={showPassword ? 'text' : 'password'}
                      className={`input ${errors.portal_password ? 'input-error' : ''}`}
                      style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem', height: 44, fontWeight: 700 }}
                      placeholder="Minimum 6 characters"
                      value={form.portal_password}
                      onChange={(e) => set('portal_password', e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: 12,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#64748B',
                        cursor: 'pointer',
                      }}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="btn btn-secondary"
                    style={{ height: 44, padding: '0 1rem', fontSize: '0.8125rem', whiteSpace: 'nowrap' }}
                  >
                    🎲 Auto Generate
                  </button>
                </div>
              </FormField>

              <div
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '0.5rem',
                  background: '#DCFCE7',
                  border: '1px solid #BBF7D0',
                  fontSize: '0.75rem',
                  color: '#166534',
                }}
              >
                <span style={{ fontWeight: 800 }}>🔑 Login Credentials Summary:</span>
                <p style={{ margin: '0.25rem 0 0' }}>
                  Login Phone: <strong>{form.phone || '[Enter phone above]'}</strong> | Initial Password: <strong>{form.portal_password}</strong>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Section 4: Internal Landlord Notes */}
        <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
          <FormField label="Private Landlord Notes (optional)" id="tenant-notes">
            <textarea
              id="tenant-notes"
              className="input"
              rows={2}
              style={{ fontSize: '0.875rem', resize: 'none' }}
              placeholder="e.g. Has 2-wheeler, works from home, recommended by owner friend..."
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
            />
          </FormField>
        </div>

        {/* Action Button */}
        <div style={{ position: 'sticky', bottom: '1rem', zIndex: 10 }}>
          <button
            type="button"
            className="btn btn-primary btn-full btn-lg"
            disabled={isLoading}
            onClick={handleSubmit}
            style={{
              height: 52,
              borderRadius: '0.875rem',
              fontSize: '1rem',
              fontWeight: 800,
              background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
              borderColor: '#059669',
              boxShadow: '0 8px 20px -2px rgba(16, 185, 129, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.625rem',
            }}
          >
            {isLoading ? (
              <>
                <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
                <span>Registering Resident...</span>
              </>
            ) : (
              <>
                <User size={20} />
                <span>Save & Onboard Resident</span>
              </>
            )}
          </button>
        </div>
      </div>
    </MobilePage>
  )
}

// ================================================
// OWNER MORE PAGE (POLISHED APP-STORE / MATERIAL 3 STYLE)
// ================================================

export function OwnerMorePage() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const sections = [
    {
      title: 'Financial & Leasing',
      items: [
        { label: 'Payment Records & Ledgers', icon: '💳', to: '/owner/payments', desc: 'Track UPI, cash, & online rent collections' },
        { label: 'Rental Agreements & e-Signs', icon: '📄', to: '/owner/agreements', desc: 'View digital lease terms & validity' },
        { label: 'Operational Expenses', icon: '📊', to: '/owner/expenses', desc: 'Log repairs, electricity & contractor bills' },
        { label: 'Generate Monthly Rent', icon: '⚡', to: '/owner/rent/generate', desc: 'Batch invoice generator for all occupied flats' },
      ],
    },
    {
      title: 'Operations & Communication',
      items: [
        { label: 'Email & Mail SMTP Gateway', icon: '✉️', to: '/owner/smtp', desc: 'Configure custom relay & email residents' },
        { label: 'Building Maintenance Requests', icon: '🔧', to: '/owner/maintenance', desc: 'Review active tickets & assign technicians' },
        { label: 'Property & Tenant Documents', icon: '📁', to: '/owner/documents', desc: 'Store title deeds, tax receipts & ID proofs' },
        { label: 'Notice & Announcements', icon: '📢', to: '/owner/announcements', desc: 'Broadcast circulars to all residents' },
      ],
    },
    {
      title: 'Analytics & Account',
      items: [
        { label: 'Reports & Revenue Analytics', icon: '📈', to: '/owner/reports', desc: 'Export monthly profit/loss & occupancy' },
        { label: 'Notifications Center', icon: '🔔', to: '/owner/notifications', desc: 'System alerts & payment receipts' },
        { label: 'Organization Settings', icon: '⚙️', to: '/owner/settings', desc: 'Business profile, branding & policies' },
        { label: 'My Owner Profile', icon: '👤', to: '/owner/profile', desc: 'Account credentials & contact info' },
      ],
    },
  ]

  return (
    <MobilePage role="owner" header={<MobileHeader title="Owner Portal Menu" />}>
      <div style={{ maxWidth: 640, margin: '0 auto', paddingBottom: '2.5rem' }}>
        {/* Profile Card Header */}
        <div
          className="card"
          style={{
            padding: '1.25rem',
            marginBottom: '1.25rem',
            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
            color: '#FFFFFF',
            borderRadius: '1rem',
            boxShadow: '0 8px 24px -4px rgba(15, 23, 42, 0.3)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #2563EB, #60A5FA)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
                fontWeight: 800,
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)',
                border: '2px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              {user?.full_name?.substring(0, 2).toUpperCase() || 'PH'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800, color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.full_name}
                </h2>
                <span
                  style={{
                    background: 'rgba(37, 99, 235, 0.3)',
                    border: '1px solid rgba(59, 130, 246, 0.5)',
                    color: '#93C5FD',
                    fontSize: '0.625rem',
                    fontWeight: 800,
                    padding: '0.125rem 0.375rem',
                    borderRadius: '999px',
                  }}
                >
                  LANDLORD
                </span>
              </div>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: '#94A3B8' }}>
                {user?.organization_name || user?.email}
              </p>
            </div>
          </div>
        </div>

        {/* Menu Sections */}
        {sections.map((sec) => (
          <div key={sec.title} style={{ marginBottom: '1.25rem' }}>
            <p
              style={{
                fontWeight: 800,
                fontSize: '0.6875rem',
                color: '#64748B',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: '0.5rem',
                paddingLeft: '0.25rem',
              }}
            >
              {sec.title}
            </p>
            <div className="card" style={{ overflow: 'hidden', padding: 0, borderRadius: '0.875rem' }}>
              {sec.items.map((item, i) => (
                <button
                  key={item.label}
                  onClick={() => navigate(item.to)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.875rem',
                    padding: '0.875rem 1rem',
                    width: '100%',
                    background: 'none',
                    border: 'none',
                    borderBottom: i < sec.items.length - 1 ? '1px solid #F1F5F9' : 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '0.625rem',
                      background: '#F1F5F9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.125rem',
                      flexShrink: 0,
                    }}
                  >
                    {item.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: '0.875rem', color: '#0F172A' }}>
                      {item.label}
                    </p>
                    <p style={{ margin: '0.1rem 0 0', fontSize: '0.6875rem', color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.desc}
                    </p>
                  </div>
                  <ChevronRight size={18} color="#94A3B8" />
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Logout Button */}
        <button
          className="btn btn-danger btn-full btn-lg"
          onClick={async () => {
            await logout()
            navigate('/login')
          }}
          style={{
            height: 48,
            borderRadius: '0.75rem',
            fontWeight: 700,
            marginTop: '0.5rem',
          }}
        >
          Sign Out of Owner Account
        </button>
      </div>
    </MobilePage>
  )
}

// ================================================
// REUSABLE FORM FIELD
// ================================================

function FormField({
  label,
  id,
  children,
  error,
}: {
  label: string
  id: string
  children: React.ReactNode
  error?: string
}) {
  return (
    <div className="form-group" style={{ marginBottom: '1rem' }}>
      <label
        className="input-label"
        htmlFor={id}
        style={{
          display: 'block',
          fontSize: '0.8125rem',
          fontWeight: 700,
          color: '#334155',
          marginBottom: '0.375rem',
        }}
      >
        {label}
      </label>
      {children}
      {error && (
        <p
          className="input-hint input-hint-error"
          style={{
            margin: '0.25rem 0 0',
            fontSize: '0.75rem',
            color: '#DC2626',
            fontWeight: 600,
          }}
        >
          {error}
        </p>
      )}
    </div>
  )
}
