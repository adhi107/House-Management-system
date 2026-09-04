import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Wrench, CreditCard, ChevronRight } from 'lucide-react'
import { rentApi, maintenanceApi } from '../../api/client'
import { RentInvoice, MaintenanceRequest } from '../../types'
import { MobilePage } from '../../components/layout/AppShell'
import { MobileHeader } from '../../components/navigation'
import { useAuth } from '../../contexts/AuthContext'
import { formatCurrency, formatDate, EmptyState, SkeletonCard, StatusBadge } from '../../components/ui'

// ================================================
// TENANT RENT PAGE
// ================================================

export function TenantRentPage() {
  const navigate = useNavigate()
  const [invoices, setInvoices] = useState<RentInvoice[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    rentApi.listInvoices({}).then((res) => {
      setInvoices(res.data.data || [])
    }).catch(() => {}).finally(() => setIsLoading(false))
  }, [])

  return (
    <MobilePage role="tenant" header={<MobileHeader title="Rent & Payments" showBack />}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
          : invoices.length === 0
            ? <EmptyState icon={<CreditCard size={32} />} title="No invoices yet" description="Your rent invoices will appear here." />
            : invoices.map((inv) => (
              <div key={inv.id} className="card" style={{ padding: '1rem', borderLeft: `3px solid rgb(var(--${inv.status === 'paid' ? 'success' : inv.status === 'overdue' ? 'danger' : 'warning'}))` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.625rem' }}>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: '0.9375rem', margin: '0 0 0.125rem' }}>
                      {new Date(inv.billing_month + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })} Rent
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'rgb(var(--muted-foreground))', margin: 0 }}>
                      Due {formatDate(inv.due_date)}
                    </p>
                  </div>
                  <StatusBadge status={inv.status} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ fontWeight: 800, fontSize: '1.25rem', margin: 0, fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(inv.total_amount)}</p>
                  {inv.status === 'paid' && (
                    <span style={{ fontSize: '0.8125rem', color: 'rgb(var(--success))', fontWeight: 600 }}>✓ Paid {formatCurrency(inv.paid_amount)}</span>
                  )}
                </div>
                {inv.payments && inv.payments.length > 0 && (
                  <div style={{ marginTop: '0.625rem', paddingTop: '0.625rem', borderTop: '1px solid rgb(var(--border))', fontSize: '0.75rem', color: 'rgb(var(--muted-foreground))' }}>
                    {inv.payments.map((p: any) => (
                      <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>#{p.receipt_number}</span>
                        <span>{formatCurrency(p.amount)} on {formatDate(p.payment_date)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
        }
      </div>
    </MobilePage>
  )
}

// ================================================
// TENANT MAINTENANCE PAGE
// ================================================

const CATEGORIES = [
  { value: 'plumbing', label: 'Plumbing', icon: '🔧' },
  { value: 'electrical', label: 'Electrical', icon: '⚡' },
  { value: 'water', label: 'Water', icon: '💧' },
  { value: 'ac', label: 'AC', icon: '❄️' },
  { value: 'cleaning', label: 'Cleaning', icon: '🧹' },
  { value: 'internet', label: 'Internet', icon: '🌐' },
  { value: 'appliance', label: 'Appliance', icon: '📺' },
  { value: 'other', label: 'Other', icon: '🔨' },
]

export function TenantMaintenancePage() {
  const navigate = useNavigate()
  const [requests, setRequests] = useState<MaintenanceRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showNewForm, setShowNewForm] = useState(false)

  const load = () => {
    maintenanceApi.list({}).then((res) => {
      setRequests(res.data.data || [])
    }).catch(() => {}).finally(() => setIsLoading(false))
  }

  useEffect(() => { load() }, [])

  if (showNewForm) {
    return <NewMaintenanceForm onClose={() => { setShowNewForm(false); load() }} />
  }

  return (
    <MobilePage
      role="tenant"
      header={<MobileHeader title="Maintenance" showBack />}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
        ) : requests.length === 0 ? (
          <EmptyState
            icon={<Wrench size={32} />}
            title="Everything looks good 🎉"
            description="No active maintenance requests. Tap below to report an issue."
            action={
              <button className="btn btn-primary" onClick={() => setShowNewForm(true)}>
                <Plus size={18} /> New Request
              </button>
            }
          />
        ) : (
          requests.map((r) => (
            <div key={r.id} className="card" style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <h3 style={{ fontWeight: 700, fontSize: '0.9375rem', margin: 0 }}>{r.title}</h3>
                <StatusBadge status={r.status} />
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'rgb(var(--muted-foreground))', margin: '0 0 0.375rem', textTransform: 'capitalize' }}>
                {r.category} • #{r.request_number}
              </p>
              <p style={{ fontSize: '0.75rem', color: 'rgb(var(--muted-foreground))', margin: 0 }}>{formatDate(r.created_at)}</p>
            </div>
          ))
        )}
      </div>
      <div style={{ position: 'fixed', bottom: 'calc(var(--bottom-nav-height) + 1rem + var(--safe-bottom))', right: '1rem' }}>
        <button className="btn btn-primary" onClick={() => setShowNewForm(true)} style={{ borderRadius: 'var(--radius-full)', boxShadow: '0 4px 16px rgb(37 99 235 / 0.35)' }}>
          <Plus size={20} /> New Request
        </button>
      </div>
    </MobilePage>
  )
}

// ================================================
// NEW MAINTENANCE FORM (Tenant, 3-step)
// ================================================

function NewMaintenanceForm({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(1)
  const [category, setCategory] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('medium')
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [requestNumber, setRequestNumber] = useState('')
  const [propertyId, setPropertyId] = useState('')
  const [unitId, setUnitId] = useState('')

  useEffect(() => {
    import('../../api/client').then(({ dashboardApi }) => {
      dashboardApi.getTenantDashboard().then((res) => {
        setPropertyId(res.data.data.property?.id || '')
        setUnitId(res.data.data.unit?.id || '')
      }).catch(() => {})
    })
  }, [])

  const handleSubmit = async () => {
    setIsLoading(true)
    try {
      const { maintenanceApi } = await import('../../api/client')
      const res = await maintenanceApi.create({
        property_id: propertyId,
        unit_id: unitId,
        category, title, description, priority,
      })
      setRequestNumber(res.data.data.request_number)
      setSuccess(true)
    } catch {
      alert('Failed to submit. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <MobilePage role="tenant" header={<MobileHeader title="Request Submitted" />} showBottomNav={false}>
        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
          <h2 style={{ fontWeight: 800, fontSize: '1.5rem', margin: '0 0 0.5rem' }}>Request Submitted!</h2>
          <p style={{ color: 'rgb(var(--muted-foreground))', marginBottom: '0.5rem' }}>Your maintenance request has been submitted.</p>
          <p style={{ fontWeight: 700, fontSize: '1.125rem', color: 'rgb(var(--primary))', marginBottom: '2rem' }}>Request ID: #{requestNumber}</p>
          <button className="btn btn-primary btn-full" onClick={onClose}>Back to Maintenance</button>
        </div>
      </MobilePage>
    )
  }

  return (
    <MobilePage role="tenant" header={<MobileHeader title={`Step ${step} of 3`} showBack onBack={step === 1 ? onClose : () => setStep(step - 1)} />} showBottomNav={false}>
      {/* Progress */}
      <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '1.5rem' }}>
        {[1, 2, 3].map((s) => (
          <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: s <= step ? 'rgb(var(--primary))' : 'rgb(var(--border))', transition: 'background 0.3s ease' }} />
        ))}
      </div>

      {step === 1 && (
        <>
          <h2 style={{ fontWeight: 700, fontSize: '1.25rem', margin: '0 0 0.5rem' }}>What's the problem?</h2>
          <p className="text-muted" style={{ marginBottom: '1.25rem' }}>Select the category that best fits your issue.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                onClick={() => setCategory(c.value)}
                style={{
                  padding: '1rem', borderRadius: 'var(--radius-lg)', textAlign: 'center',
                  border: `2px solid ${category === c.value ? 'rgb(var(--primary))' : 'rgb(var(--card-border))'}`,
                  background: category === c.value ? 'rgb(var(--primary-light))' : 'rgb(var(--card))',
                  cursor: 'pointer', transition: 'all 0.15s ease',
                }}
              >
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{c.icon}</div>
                <p style={{ fontWeight: 600, fontSize: '0.875rem', margin: 0, color: category === c.value ? 'rgb(var(--primary))' : 'rgb(var(--foreground))' }}>{c.label}</p>
              </button>
            ))}
          </div>
          <button className="btn btn-primary btn-full btn-lg" style={{ marginTop: '1.5rem' }} disabled={!category} onClick={() => setStep(2)}>Continue</button>
        </>
      )}

      {step === 2 && (
        <>
          <h2 style={{ fontWeight: 700, fontSize: '1.25rem', margin: '0 0 0.5rem' }}>Describe the problem</h2>
          <p className="text-muted" style={{ marginBottom: '1.25rem' }}>Give us details so we can help faster.</p>
          <div className="form-group">
            <label className="input-label" htmlFor="maint-title">Title</label>
            <input id="maint-title" type="text" className="input" placeholder="e.g. Water leakage in bathroom" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="input-label" htmlFor="maint-desc">Description</label>
            <textarea
              id="maint-desc" className="input" rows={4}
              placeholder="Describe the issue in detail..."
              value={description} onChange={(e) => setDescription(e.target.value)}
              style={{ resize: 'none' }}
            />
          </div>
          <button className="btn btn-primary btn-full btn-lg" disabled={!title || !description} onClick={() => setStep(3)}>Continue</button>
        </>
      )}

      {step === 3 && (
        <>
          <h2 style={{ fontWeight: 700, fontSize: '1.25rem', margin: '0 0 0.5rem' }}>Priority</h2>
          <p className="text-muted" style={{ marginBottom: '1.25rem' }}>How urgent is this issue?</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {[
              { value: 'low', label: 'Low', desc: 'Not urgent, can wait', color: 'var(--muted-foreground)' },
              { value: 'medium', label: 'Medium', desc: 'Should be fixed soon', color: 'var(--info)' },
              { value: 'high', label: 'High', desc: 'Needs prompt attention', color: 'var(--warning)' },
              { value: 'urgent', label: 'Urgent', desc: 'Critical issue, immediate fix needed', color: 'var(--danger)' },
            ].map((p) => (
              <button
                key={p.value}
                onClick={() => setPriority(p.value)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.875rem',
                  padding: '1rem', borderRadius: 'var(--radius-lg)', textAlign: 'left',
                  border: `2px solid ${priority === p.value ? `rgb(${p.color})` : 'rgb(var(--card-border))'}`,
                  background: priority === p.value ? `rgb(${p.color} / 0.08)` : 'rgb(var(--card))',
                  cursor: 'pointer', transition: 'all 0.15s ease',
                }}
              >
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: `rgb(${p.color})`, flexShrink: 0 }} />
                <div>
                  <p style={{ fontWeight: 700, margin: '0 0 0.125rem', fontSize: '0.9375rem' }}>{p.label}</p>
                  <p style={{ fontSize: '0.8125rem', color: 'rgb(var(--muted-foreground))', margin: 0 }}>{p.desc}</p>
                </div>
              </button>
            ))}
          </div>
          <button className="btn btn-primary btn-full btn-lg" disabled={isLoading} onClick={handleSubmit}>
            {isLoading ? 'Submitting...' : 'Submit Request'}
          </button>
        </>
      )}
    </MobilePage>
  )
}

// ================================================
// STUB PAGES
// ================================================

export function TenantDocumentsPage() {
  return <MobilePage role="tenant" header={<MobileHeader title="Documents" showBack />}><p className="text-muted" style={{ textAlign: 'center', paddingTop: '3rem' }}>Documents coming soon.</p></MobilePage>
}

export function TenantMorePage() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const items = [
    { label: 'Payments', icon: '💳', to: '/tenant/payments' },
    { label: 'Receipts', icon: '🧾', to: '/tenant/payments' },
    { label: 'Agreement', icon: '📄', to: '/tenant/agreements' },
    { label: 'Notifications', icon: '🔔', to: '/tenant/notifications' },
    { label: 'Profile', icon: '👤', to: '/tenant/profile' },
    { label: 'Settings', icon: '⚙️', to: '/tenant/settings' },
  ]
  return (
    <MobilePage role="tenant" header={<MobileHeader title="More" />}>
      <div className="card" style={{ overflow: 'hidden' }}>
        {items.map((item, i) => (
          <button key={item.label} onClick={() => navigate(item.to)} style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '1rem 1.125rem', width: '100%', background: 'none', border: 'none', borderBottom: i < items.length - 1 ? '1px solid rgb(var(--border))' : 'none', cursor: 'pointer', textAlign: 'left' }}>
            <span style={{ fontSize: '1.25rem' }}>{item.icon}</span>
            <span style={{ fontWeight: 500 }}>{item.label}</span>
            <ChevronRight size={18} style={{ marginLeft: 'auto', color: 'rgb(var(--muted-foreground))' }} />
          </button>
        ))}
      </div>
      <button className="btn btn-danger btn-full" style={{ marginTop: '1rem' }} onClick={async () => { await logout(); navigate('/login') }}>
        Logout
      </button>
    </MobilePage>
  )
}
