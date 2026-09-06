import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { tenantApi, rentApi } from '../../api/client'
import { Tenant, RentInvoice, Payment } from '../../types'
import { MobilePage } from '../../components/layout/AppShell'
import { MobileHeader } from '../../components/navigation'
import { formatCurrency, formatDate, ErrorState, SkeletonCard, StatusBadge, Avatar } from '../../components/ui'
import PaymentSheet from './PaymentSheet'

export default function TenantDetailPage() {
  const { tenantId } = useParams<{ tenantId: string }>()
  const navigate = useNavigate()
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [invoices, setInvoices] = useState<RentInvoice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)
  const [payInvoice, setPayInvoice] = useState<RentInvoice | null>(null)

  const load = async () => {
    try {
      const [tRes, invRes] = await Promise.all([
        tenantApi.get(tenantId!),
        rentApi.listInvoices({ tenant_id: tenantId }),
      ])
      setTenant(tRes.data.data)
      setInvoices(invRes.data.data || [])
    } catch {
      setError(true)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { load() }, [tenantId])

  if (isLoading) return <MobilePage role="owner" header={<MobileHeader title="Tenant" showBack />}><SkeletonCard /></MobilePage>
  if (error || !tenant) return <MobilePage role="owner" header={<MobileHeader title="Tenant" showBack />}><ErrorState onRetry={load} /></MobilePage>

  const pendingInvoice = invoices.find((i) => i.status !== 'paid' && i.status !== 'waived')

  return (
    <MobilePage role="owner" header={<MobileHeader title="Tenant Details" showBack />}>
      {/* Header Card */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <Avatar name={tenant.full_name} src={tenant.profile_photo} size="lg" />
        <div style={{ flex: 1 }}>
          <h2 style={{ fontWeight: 800, fontSize: '1.125rem', margin: '0 0 0.25rem' }}>{tenant.full_name}</h2>
          {tenant.unit_number && (
            <p style={{ fontSize: '0.875rem', color: 'rgb(var(--muted-foreground))', margin: '0 0 0.25rem' }}>
              Flat {tenant.unit_number} • {tenant.property_name}
            </p>
          )}
          <p style={{ fontSize: '0.875rem', color: 'rgb(var(--muted-foreground))', margin: 0 }}>{tenant.phone}</p>
        </div>
      </div>

      {/* Info */}
      <div className="card" style={{ padding: '1rem', marginBottom: '1rem' }}>
        <InfoRow label="Monthly Rent" value={tenant.monthly_rent ? formatCurrency(tenant.monthly_rent) : '—'} />
        <InfoRow label="Due Day" value={tenant.rent_due_day ? `${tenant.rent_due_day}th of month` : '—'} />
        <InfoRow label="Joining Date" value={tenant.joining_date ? formatDate(tenant.joining_date) : '—'} />
        <InfoRow label="Email" value={tenant.email || '—'} />
        <InfoRow label="Occupation" value={tenant.occupation || '—'} />
      </div>

      {/* Quick actions */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
        {pendingInvoice && (
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setPayInvoice(pendingInvoice)}>
            💳 Record Payment
          </button>
        )}
        <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => navigate(`/owner/maintenance?tenant_id=${tenantId}`)}>
          🔧 Maintenance
        </button>
      </div>

      {/* Recent Invoices */}
      <h3 style={{ fontWeight: 700, fontSize: '1rem', margin: '0 0 0.75rem' }}>Rent History</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {invoices.map((inv) => (
          <div key={inv.id} className="card" style={{ padding: '0.875rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: `3px solid rgb(var(--${inv.status === 'paid' ? 'success' : inv.status === 'overdue' ? 'danger' : 'warning'}))` }}>
            <div>
              <p style={{ fontWeight: 600, margin: '0 0 0.125rem', fontSize: '0.875rem' }}>
                {new Date(inv.billing_month + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
              </p>
              <p style={{ fontSize: '0.75rem', color: 'rgb(var(--muted-foreground))', margin: 0 }}>Due {formatDate(inv.due_date)}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontWeight: 700, margin: '0 0 0.25rem', fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(inv.total_amount)}</p>
              <StatusBadge status={inv.status} />
            </div>
          </div>
        ))}
        {invoices.length === 0 && (
          <p style={{ color: 'rgb(var(--muted-foreground))', textAlign: 'center', padding: '1.5rem 0' }}>No rent history yet</p>
        )}
      </div>

      {payInvoice && (
        <PaymentSheet invoice={payInvoice} onClose={() => setPayInvoice(null)} onSuccess={() => { setPayInvoice(null); load() }} />
      )}
    </MobilePage>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid rgb(var(--border))' }}>
      <span style={{ fontSize: '0.8125rem', color: 'rgb(var(--muted-foreground))' }}>{label}</span>
      <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{value}</span>
    </div>
  )
}
