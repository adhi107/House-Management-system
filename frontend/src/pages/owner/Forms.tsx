import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, MapPin, Layers, ChevronRight } from 'lucide-react'
import { propertyApi, unitApi, tenantApi } from '../../api/client'
import { useToast } from '../../contexts/ToastContext'
import { useAuth } from '../../contexts/AuthContext'
import { MobilePage } from '../../components/layout/AppShell'
import { MobileHeader } from '../../components/navigation'
import { AxiosError } from 'axios'

// ================================================
// ADD PROPERTY FORM
// ================================================

export function AddPropertyPage() {
  const navigate = useNavigate()
  const { success, error } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [form, setForm] = useState({ name: '', address: '', city: '', state: '', pincode: '', total_floors: '4', description: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name) e.name = 'Property name is required'
    if (!form.address) e.address = 'Address is required'
    if (!form.city) e.city = 'City is required'
    if (!form.state) e.state = 'State is required'
    if (!form.pincode) e.pincode = 'Pincode is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setIsLoading(true)
    try {
      const res = await propertyApi.create({ ...form, total_floors: parseInt(form.total_floors) })
      success('Property added successfully!')
      navigate(`/owner/properties/${res.data.data.id}`)
    } catch (err) {
      const axiosErr = err as AxiosError<{ detail: string }>
      error(axiosErr.response?.data?.detail || 'Failed to add property')
    } finally {
      setIsLoading(false)
    }
  }

  const set = (k: string, v: string) => { setForm((p) => ({ ...p, [k]: v })); setErrors((p) => ({ ...p, [k]: '' })) }

  return (
    <MobilePage role="owner" header={<MobileHeader title="Add Property" showBack />} showBottomNav={false}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <FormField label="Property Name" id="name" error={errors.name}>
          <input id="name" type="text" className={`input ${errors.name ? 'input-error' : ''}`} placeholder="e.g. Green Valley Residency" value={form.name} onChange={(e) => set('name', e.target.value)} />
        </FormField>
        <FormField label="Full Address" id="address" error={errors.address}>
          <textarea id="address" className={`input ${errors.address ? 'input-error' : ''}`} rows={2} placeholder="Street address..." value={form.address} onChange={(e) => set('address', e.target.value)} style={{ resize: 'none' }} />
        </FormField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <FormField label="City" id="city" error={errors.city}>
            <input id="city" type="text" className={`input ${errors.city ? 'input-error' : ''}`} placeholder="Hyderabad" value={form.city} onChange={(e) => set('city', e.target.value)} />
          </FormField>
          <FormField label="State" id="state" error={errors.state}>
            <input id="state" type="text" className={`input ${errors.state ? 'input-error' : ''}`} placeholder="Telangana" value={form.state} onChange={(e) => set('state', e.target.value)} />
          </FormField>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <FormField label="Pincode" id="pincode" error={errors.pincode}>
            <input id="pincode" type="text" inputMode="numeric" className={`input ${errors.pincode ? 'input-error' : ''}`} placeholder="500001" value={form.pincode} onChange={(e) => set('pincode', e.target.value)} maxLength={6} />
          </FormField>
          <FormField label="Total Floors" id="floors">
            <input id="floors" type="number" inputMode="numeric" className="input" min={1} max={50} value={form.total_floors} onChange={(e) => set('total_floors', e.target.value)} />
          </FormField>
        </div>
        <FormField label="Description (optional)" id="desc">
          <textarea id="desc" className="input" rows={2} placeholder="Additional details..." value={form.description} onChange={(e) => set('description', e.target.value)} style={{ resize: 'none' }} />
        </FormField>
        <button className="btn btn-primary btn-full btn-lg" disabled={isLoading} onClick={handleSubmit} style={{ marginTop: '0.5rem' }}>
          {isLoading ? 'Adding...' : <><Building2 size={20} /> Add Property</>}
        </button>
      </div>
    </MobilePage>
  )
}

// ================================================
// ADD TENANT FORM
// ================================================

export function AddTenantPage() {
  const navigate = useNavigate()
  const { success, error } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [form, setForm] = useState({ full_name: '', phone: '', email: '', occupation: '', permanent_address: '', notes: '', create_portal_access: false, portal_password: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.full_name) e.full_name = 'Name is required'
    if (!form.phone || form.phone.length < 10) e.phone = 'Valid phone number is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setIsLoading(true)
    try {
      const res = await tenantApi.create(form)
      success('Tenant added successfully!')
      navigate(`/owner/tenants/${res.data.data.id}`)
    } catch (err) {
      const axiosErr = err as AxiosError<{ detail: string }>
      error(axiosErr.response?.data?.detail || 'Failed to add tenant')
    } finally {
      setIsLoading(false)
    }
  }

  const set = (k: string, v: string | boolean) => { setForm((p) => ({ ...p, [k]: v })); setErrors((p) => ({ ...p, [k]: '' })) }

  return (
    <MobilePage role="owner" header={<MobileHeader title="Add Tenant" showBack />} showBottomNav={false}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <FormField label="Full Name" id="name" error={errors.full_name}>
          <input id="name" type="text" className={`input ${errors.full_name ? 'input-error' : ''}`} placeholder="Rajeev Adithya" value={form.full_name} onChange={(e) => set('full_name', e.target.value)} />
        </FormField>
        <FormField label="Phone Number" id="phone" error={errors.phone}>
          <input id="phone" type="tel" inputMode="tel" className={`input ${errors.phone ? 'input-error' : ''}`} placeholder="+91 98765 43210" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
        </FormField>
        <FormField label="Email (optional)" id="email">
          <input id="email" type="email" inputMode="email" className="input" placeholder="tenant@example.com" value={form.email} onChange={(e) => set('email', e.target.value)} />
        </FormField>
        <FormField label="Occupation (optional)" id="occ">
          <input id="occ" type="text" className="input" placeholder="Software Engineer" value={form.occupation} onChange={(e) => set('occupation', e.target.value)} />
        </FormField>
        <FormField label="Permanent Address (optional)" id="addr">
          <textarea id="addr" className="input" rows={2} placeholder="Permanent home address..." value={form.permanent_address} onChange={(e) => set('permanent_address', e.target.value)} style={{ resize: 'none' }} />
        </FormField>
        <FormField label="Notes (optional)" id="notes">
          <textarea id="notes" className="input" rows={2} placeholder="Any notes about the tenant..." value={form.notes} onChange={(e) => set('notes', e.target.value)} style={{ resize: 'none' }} />
        </FormField>

        {/* Portal access */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', borderRadius: 'var(--radius-md)', background: 'rgb(var(--muted))', marginBottom: '1rem' }}>
          <input id="portal" type="checkbox" checked={form.create_portal_access} onChange={(e) => set('create_portal_access', e.target.checked)} style={{ width: 20, height: 20, cursor: 'pointer' }} />
          <label htmlFor="portal" style={{ fontWeight: 600, cursor: 'pointer', flex: 1 }}>
            Create tenant portal access
            <p style={{ fontWeight: 400, fontSize: '0.75rem', color: 'rgb(var(--muted-foreground))', margin: '0.125rem 0 0' }}>Allows the tenant to login and view their rent, payments, and maintenance.</p>
          </label>
        </div>

        {form.create_portal_access && (
          <FormField label="Portal Password" id="portal-pwd">
            <input id="portal-pwd" type="password" className="input" placeholder="Minimum 8 characters" value={form.portal_password} onChange={(e) => set('portal_password', e.target.value)} />
          </FormField>
        )}

        <button className="btn btn-primary btn-full btn-lg" disabled={isLoading} onClick={handleSubmit}>
          {isLoading ? 'Adding...' : 'Add Tenant'}
        </button>
      </div>
    </MobilePage>
  )
}

// ================================================
// MORE PAGE (OWNER)
// ================================================

export function OwnerMorePage() {
  const navigate = useNavigate()
  const { logout } = useAuth()

  const sections = [
    {
      title: 'Management',
      items: [
        { label: 'Payments', icon: '💳', to: '/owner/payments' },
        { label: 'Tenants', icon: '👤', to: '/owner/tenants' },
        { label: 'Expenses', icon: '📊', to: '/owner/expenses' },
        { label: 'Agreements', icon: '📄', to: '/owner/agreements' },
        { label: 'Documents', icon: '📁', to: '/owner/documents' },
      ],
    },
    {
      title: 'Reports',
      items: [
        { label: 'Reports', icon: '📈', to: '/owner/reports' },
        { label: 'Announcements', icon: '📢', to: '/owner/announcements' },
        { label: 'Notifications', icon: '🔔', to: '/owner/notifications' },
      ],
    },
    {
      title: 'Account',
      items: [
        { label: 'Profile', icon: '👤', to: '/owner/profile' },
        { label: 'Settings', icon: '⚙️', to: '/owner/settings' },
      ],
    },
  ]

  return (
    <MobilePage role="owner" header={<MobileHeader title="More" />}>
      {sections.map((s) => (
        <div key={s.title} style={{ marginBottom: '1.25rem' }}>
          <p style={{ fontWeight: 600, fontSize: '0.75rem', color: 'rgb(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>{s.title}</p>
          <div className="card" style={{ overflow: 'hidden' }}>
            {s.items.map((item, i) => (
              <button key={item.label} onClick={() => navigate(item.to)} style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '0.875rem 1rem', width: '100%', background: 'none', border: 'none', borderBottom: i < s.items.length - 1 ? '1px solid rgb(var(--border))' : 'none', cursor: 'pointer', textAlign: 'left' }}>
                <span style={{ fontSize: '1.25rem', width: 28, textAlign: 'center' }}>{item.icon}</span>
                <span style={{ fontWeight: 500, flex: 1 }}>{item.label}</span>
                <ChevronRight size={18} style={{ color: 'rgb(var(--muted-foreground))' }} />
              </button>
            ))}
          </div>
        </div>
      ))}
      <button className="btn btn-danger btn-full" onClick={async () => { await logout(); navigate('/login') }}>
        Logout
      </button>
    </MobilePage>
  )
}

// ================================================
// REUSABLE FORM FIELD
// ================================================

function FormField({ label, id, children, error }: { label: string; id: string; children: React.ReactNode; error?: string }) {
  return (
    <div className="form-group">
      <label className="input-label" htmlFor={id}>{label}</label>
      {children}
      {error && <p className="input-hint input-hint-error">{error}</p>}
    </div>
  )
}
