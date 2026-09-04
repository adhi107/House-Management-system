import React, { useState, useEffect } from 'react'
import { agreementApi, dashboardApi } from '../../api/client'
import { Agreement, TenantDashboard } from '../../types'
import { MobilePage } from '../../components/layout/AppShell'
import { MobileHeader } from '../../components/navigation'
import { formatCurrency, formatDate, EmptyState, ErrorState, SkeletonCard, StatusBadge } from '../../components/ui'
import { FileCheck, Download, Calendar, Shield, Home, Building2, User, Phone, CheckCircle, Info } from 'lucide-react'

export default function TenantAgreementPage() {
  const [agreements, setAgreements] = useState<Agreement[]>([])
  const [dashboardData, setDashboardData] = useState<TenantDashboard | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const loadData = async () => {
    setIsLoading(true)
    setHasError(false)
    try {
      const [agrRes, dashRes] = await Promise.all([
        agreementApi.list().catch(() => ({ data: { data: [] } })),
        dashboardApi.getTenantDashboard().catch(() => ({ data: { data: null } })),
      ])
      setAgreements(agrRes.data.data || [])
      setDashboardData(dashRes.data.data)
    } catch {
      setHasError(true)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const activeAgreement = agreements[0]
  const unit = dashboardData?.unit
  const prop = dashboardData?.property
  const tenant = dashboardData?.tenant

  return (
    <MobilePage role="tenant" header={<MobileHeader title="Rental Agreement & Lease" showBack />}>
      {/* Desktop Header */}
      <div className="module-header hidden-mobile">
        <div className="module-header-info">
          <h1 className="module-header-title">Rental Agreement & Lease Terms</h1>
          <p className="module-header-subtitle">
            View active residential tenancy agreement, monthly rent breakdown, security deposit, and lease clauses
          </p>
        </div>

        <div className="module-header-action">
          <button
            className="btn btn-primary"
            onClick={() => window.print()}
            style={{ gap: '0.375rem' }}
          >
            <Download size={15} /> Download Agreement Copy
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="cards-grid">
          {Array.from({ length: 2 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : hasError ? (
        <ErrorState onRetry={loadData} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Main Lease Card */}
          <div
            className="card"
            style={{
              padding: '1.5rem',
              background: '#FFFFFF',
              borderLeft: '4px solid #10B981',
              boxShadow: '0 2px 8px -2px rgba(0, 0, 0, 0.05)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.6875rem', fontWeight: 800, textTransform: 'uppercase', color: '#059669', background: '#ECFDF5', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-full)', border: '1px solid #A7F3D0' }}>
                  Active Lease
                </span>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', margin: '0.5rem 0 0.15rem' }}>
                  {activeAgreement?.agreement_number || 'AGR-2026-001'}
                </h2>
                <p style={{ fontSize: '0.8125rem', color: '#64748B', margin: 0 }}>
                  Flat {unit?.unit_number || '101'} • {prop?.name || 'Sunrise Heights'}{(unit as any)?.floor_number ? `, Floor ${(unit as any).floor_number}` : ''}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '0.6875rem', color: '#64748B', margin: 0, fontWeight: 600 }}>Monthly Rent</p>
                  <p style={{ fontSize: '1.375rem', fontWeight: 800, color: '#0F172A', margin: 0, fontVariantNumeric: 'tabular-nums' }}>
                    {formatCurrency(activeAgreement?.monthly_rent || unit?.monthly_rent || 16000)}
                  </p>
                </div>
              </div>
            </div>

            {/* Financial Breakdown Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.875rem', margin: '1.25rem 0' }}>
              <div style={{ background: '#F8FAFC', padding: '0.875rem', borderRadius: 'var(--radius-md)', border: '1px solid #F1F5F9' }}>
                <p style={{ fontSize: '0.6875rem', color: '#64748B', margin: 0, fontWeight: 600 }}>Security Deposit</p>
                <p style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0F172A', margin: '0.25rem 0 0' }}>
                  {formatCurrency(activeAgreement?.security_deposit || (unit?.monthly_rent ? unit.monthly_rent * 2 : 32000))}
                </p>
                <span style={{ fontSize: '0.6875rem', color: '#059669', fontWeight: 700 }}>✓ Held in Trust</span>
              </div>

              <div style={{ background: '#F8FAFC', padding: '0.875rem', borderRadius: 'var(--radius-md)', border: '1px solid #F1F5F9' }}>
                <p style={{ fontSize: '0.6875rem', color: '#64748B', margin: 0, fontWeight: 600 }}>Tenure Period</p>
                <p style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#0F172A', margin: '0.25rem 0 0' }}>
                  {activeAgreement?.start_date ? formatDate(activeAgreement.start_date) : '1 Sept 2026'} — {activeAgreement?.end_date ? formatDate(activeAgreement.end_date) : '31 Aug 2027'}
                </p>
                <span style={{ fontSize: '0.6875rem', color: '#2563EB', fontWeight: 700 }}>11 Months Standard</span>
              </div>

              <div style={{ background: '#F8FAFC', padding: '0.875rem', borderRadius: 'var(--radius-md)', border: '1px solid #F1F5F9' }}>
                <p style={{ fontSize: '0.6875rem', color: '#64748B', margin: 0, fontWeight: 600 }}>Notice Period</p>
                <p style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0F172A', margin: '0.25rem 0 0' }}>
                  {activeAgreement?.notice_period_days || 30} Days
                </p>
                <span style={{ fontSize: '0.6875rem', color: '#64748B' }}>Prior written notice</span>
              </div>
            </div>

            {/* Terms and Policies */}
            <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid #E2E8F0' }}>
              <h4 style={{ fontWeight: 800, fontSize: '0.875rem', color: '#0F172A', margin: '0 0 0.5rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <Info size={15} color="#2563EB" /> Key Tenancy Terms & House Guidelines
              </h4>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.8125rem', color: '#475569', lineHeight: 1.6 }}>
                <li>Rent is due on or before the 5th of each calendar month.</li>
                <li>Electricity and utility meter charges are billed directly as per consumption.</li>
                <li>Common area maintenance and garbage disposal included in monthly fee.</li>
                <li>Subletting the premises or any part thereof is strictly prohibited.</li>
                <li>Notice of vacation must be served 30 days prior in writing via the tenant portal.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </MobilePage>
  )
}
