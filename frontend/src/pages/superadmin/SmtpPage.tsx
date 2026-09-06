import React, { useState, useEffect } from 'react'
import { smtpApi } from '../../api/client'
import { MobilePage } from '../../components/layout/AppShell'
import { MobileHeader } from '../../components/navigation'
import { ErrorState, SkeletonCard } from '../../components/ui'
import { useToast } from '../../contexts/ToastContext'
import {
  Mail,
  Server,
  ShieldCheck,
  Send,
  Save,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Building2,
  Sparkles,
  RefreshCw,
  Sliders,
  CheckCheck,
  Zap,
  Lock,
  Globe
} from 'lucide-react'

interface AdminSmtpConfig {
  host: string
  port: number
  tls: boolean
  ssl_tls: boolean
  username: string
  password: string
  from_name: string
  from_email: string
  is_enabled: boolean
  allow_owner_custom_smtp: boolean
  default_monthly_quota: number
  org_permissions: Record<string, {
    smtp_granted: boolean
    allow_custom_relay: boolean
    monthly_quota: number
    used_this_month: number
  }>
}

interface OrgItem {
  id: string
  name: string
  code: string
  owner_name: string
  plan: string
  status: string
  smtp_granted: boolean
  allow_custom_relay: boolean
  monthly_quota: number
  used_this_month: number
}

export default function SuperAdminSmtpPage() {
  const { success, error } = useToast()
  const [config, setConfig] = useState<AdminSmtpConfig>({
    host: 'smtp.gmail.com',
    port: 587,
    tls: true,
    ssl_tls: false,
    username: 'smtp-relay@propertyhub.app',
    password: '',
    from_name: 'PropertyHub Global',
    from_email: 'noreply@propertyhub.app',
    is_enabled: true,
    allow_owner_custom_smtp: true,
    default_monthly_quota: 5000,
    org_permissions: {}
  })
  const [organizations, setOrganizations] = useState<OrgItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [testRecipient, setTestRecipient] = useState('superadmin@propertyhub.dev')
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [activeTab, setActiveTab] = useState<'gateway' | 'orgs' | 'test'>('gateway')

  const loadData = async () => {
    setIsLoading(true)
    setHasError(false)
    try {
      const res = await smtpApi.getAdminConfig()
      if (res.data?.data) {
        setConfig(res.data.data.config)
        setOrganizations(res.data.data.organizations || [])
      }
    } catch {
      setHasError(true)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleOrgToggle = (orgId: string, field: 'smtp_granted' | 'allow_custom_relay', value: boolean) => {
    setOrganizations(prev => prev.map(o => o.id === orgId ? { ...o, [field]: value } : o))
    setConfig(prev => {
      const perms = { ...prev.org_permissions }
      const current = perms[orgId] || {
        smtp_granted: true,
        allow_custom_relay: true,
        monthly_quota: 5000,
        used_this_month: 0
      }
      perms[orgId] = {
        ...current,
        [field]: value
      }
      return {
        ...prev,
        org_permissions: perms
      }
    })
  }

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setIsSaving(true)
    try {
      // Build latest permissions from organizations list
      const latestPerms: Record<string, any> = {}
      organizations.forEach(o => {
        latestPerms[o.id] = {
          smtp_granted: o.smtp_granted,
          allow_custom_relay: o.allow_custom_relay,
          monthly_quota: o.monthly_quota || 5000,
          used_this_month: o.used_this_month || 0,
        }
      })
      const payload = {
        ...config,
        org_permissions: latestPerms
      }
      await smtpApi.updateAdminConfig(payload)
      success('SMTP Gateway configuration and Owner permissions saved successfully!')
    } catch (err: any) {
      error(err.response?.data?.detail || 'Failed to save SMTP settings')
    } finally {
      setIsSaving(false)
    }
  }

  const handleTestEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!testRecipient) return
    setIsTesting(true)
    setTestResult(null)
    try {
      const res = await smtpApi.testAdminSmtp({
        recipient: testRecipient,
        subject: 'PropertyHub Cloud SMTP Gateway Handshake',
        message: 'This is a verified test email sent from the Super Admin SMTP Relay.'
      })
      setTestResult({ success: true, message: res.data?.message || 'Email delivered successfully!' })
      success('Test email dispatched successfully!')
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'SMTP Connection failed'
      setTestResult({ success: false, message: msg })
      error(msg)
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <MobilePage
      role="super_admin"
      header={
        <MobileHeader
          title="Mail & SMTP Gateway"
          rightAction={
            <button
              onClick={() => handleSave()}
              className="btn btn-sm btn-primary"
              disabled={isSaving}
              style={{ fontWeight: 700, padding: '0.4rem 0.85rem' }}
            >
              <Save size={14} /> {isSaving ? 'Saving...' : 'Save'}
            </button>
          }
        />
      }
    >
      {/* Desktop Header */}
      <div className="module-header hidden-mobile">
        <div className="module-header-info">
          <h1 className="module-header-title">Mail & SMTP Gateway Control</h1>
          <p className="module-header-subtitle">
            Configure global email relays, authenticate SMTP servers, and grant custom email privileges to Property Owners
          </p>
        </div>

        <button
          onClick={() => handleSave()}
          className="btn btn-primary"
          disabled={isSaving}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, padding: '0.6rem 1.25rem' }}
        >
          <Save size={16} /> {isSaving ? 'Saving Changes...' : 'Save All SMTP Settings'}
        </button>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : hasError ? (
        <ErrorState onRetry={loadData} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingBottom: '3rem' }}>
          
          {/* Top Tabs */}
          <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', scrollbarWidth: 'none' }}>
            {[
              { id: 'gateway', label: 'Global SMTP Gateway', icon: Server },
              { id: 'orgs', label: `Owner Entitlements (${organizations.length})`, icon: Building2 },
              { id: 'test', label: 'Test Connection & Logs', icon: Send },
            ].map(tab => {
              const Icon = tab.icon
              const isSelected = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.55rem 1rem',
                    borderRadius: '999px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    border: isSelected ? '1px solid rgb(var(--primary))' : '1px solid rgb(var(--border))',
                    background: isSelected ? 'rgb(var(--primary))' : 'rgb(var(--card))',
                    color: isSelected ? '#ffffff' : 'rgb(var(--foreground))',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Icon size={15} />
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* TAB 1: Global SMTP Gateway Config */}
          {activeTab === 'gateway' && (
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="card" style={{ padding: '1.5rem', borderRadius: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid rgb(var(--border))', paddingBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div style={{ width: 34, height: 34, borderRadius: '10px', background: 'rgba(37,99,235,0.12)', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Server size={18} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.05rem' }}>Master SMTP Relay Server</h3>
                      <p style={{ margin: 0, fontSize: '0.72rem', color: 'rgb(var(--muted-foreground))' }}>Global cloud fallback relay for all automated system emails</p>
                    </div>
                  </div>
                  
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>Enable Relay</span>
                    <input
                      type="checkbox"
                      checked={config.is_enabled}
                      onChange={(e) => setConfig({ ...config, is_enabled: e.target.checked })}
                      style={{ width: 18, height: 18, cursor: 'pointer' }}
                    />
                  </label>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div className="form-group">
                    <label className="input-label" style={{ fontWeight: 700, fontSize: '0.8rem' }}>SMTP Host</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="e.g. smtp.gmail.com or smtp.sendgrid.net"
                      value={config.host}
                      onChange={(e) => setConfig({ ...config, host: e.target.value })}
                      style={{ borderRadius: '10px', fontFamily: 'monospace' }}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="input-label" style={{ fontWeight: 700, fontSize: '0.8rem' }}>Port</label>
                    <input
                      type="number"
                      className="input"
                      placeholder="587"
                      value={config.port}
                      onChange={(e) => setConfig({ ...config, port: parseInt(e.target.value) || 587 })}
                      style={{ borderRadius: '10px' }}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="input-label" style={{ fontWeight: 700, fontSize: '0.8rem' }}>Authentication Username / API Key</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="user@propertyhub.app or apikey"
                      value={config.username}
                      onChange={(e) => setConfig({ ...config, username: e.target.value })}
                      style={{ borderRadius: '10px' }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="input-label" style={{ fontWeight: 700, fontSize: '0.8rem' }}>Authentication Password / Secret</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="input"
                        placeholder="••••••••••••"
                        value={config.password}
                        onChange={(e) => setConfig({ ...config, password: e.target.value })}
                        style={{ borderRadius: '10px', paddingRight: '2.5rem' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgb(var(--muted-foreground))' }}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', borderTop: '1px solid rgb(var(--border))', paddingTop: '1.25rem' }}>
                  <div className="form-group">
                    <label className="input-label" style={{ fontWeight: 700, fontSize: '0.8rem' }}>Default Sender Name</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="PropertyHub Global"
                      value={config.from_name}
                      onChange={(e) => setConfig({ ...config, from_name: e.target.value })}
                      style={{ borderRadius: '10px' }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="input-label" style={{ fontWeight: 700, fontSize: '0.8rem' }}>Default From Email</label>
                    <input
                      type="email"
                      className="input"
                      placeholder="noreply@propertyhub.app"
                      value={config.from_email}
                      onChange={(e) => setConfig({ ...config, from_email: e.target.value })}
                      style={{ borderRadius: '10px' }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="input-label" style={{ fontWeight: 700, fontSize: '0.8rem' }}>Global Owner Custom Relay Policy</label>
                    <select
                      className="input"
                      value={config.allow_owner_custom_smtp ? 'enabled' : 'disabled'}
                      onChange={(e) => setConfig({ ...config, allow_owner_custom_smtp: e.target.value === 'enabled' })}
                      style={{ borderRadius: '10px' }}
                    >
                      <option value="enabled">Allow Owners to connect their own SMTP relays</option>
                      <option value="disabled">Force Platform Relay only (Strict)</option>
                    </select>
                  </div>
                </div>
              </div>
            </form>
          )}

          {/* TAB 2: Organization Entitlements Matrix */}
          {activeTab === 'orgs' && (
            <div className="card" style={{ padding: '1.25rem', borderRadius: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid rgb(var(--border))', paddingBottom: '0.75rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Building2 size={18} color="#2563eb" /> Organization SMTP Access & Sidebar Display
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'rgb(var(--muted-foreground))' }}>
                    When enabled, the <strong>"Email & SMTP"</strong> module automatically displays in the Owner's sidebar.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleSave()}
                  className="btn btn-primary btn-sm"
                  disabled={isSaving}
                  style={{ fontWeight: 700 }}
                >
                  <Save size={14} /> Save Entitlements
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {organizations.map((org) => (
                  <div
                    key={org.id}
                    style={{
                      padding: '1rem',
                      borderRadius: '12px',
                      background: org.smtp_granted ? 'rgb(var(--background))' : 'rgba(239,68,68,0.03)',
                      border: org.smtp_granted ? '1px solid rgb(var(--border))' : '1px solid rgba(239,68,68,0.2)',
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '1rem'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'rgb(var(--foreground))' }}>{org.name}</span>
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '1px 6px', borderRadius: '4px', background: 'rgba(37,99,235,0.12)', color: '#2563eb', textTransform: 'uppercase' }}>
                          {org.plan}
                        </span>
                        <span style={{ fontSize: '0.65rem', color: 'rgb(var(--muted-foreground))', fontFamily: 'monospace' }}>
                          {org.code}
                        </span>
                      </div>
                      <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'rgb(var(--muted-foreground))' }}>
                        Owner: <strong>{org.owner_name}</strong> • Quota: {org.monthly_quota?.toLocaleString()} emails/mo
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
                      {/* Show in sidebar toggle */}
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={org.smtp_granted}
                          onChange={(e) => handleOrgToggle(org.id, 'smtp_granted', e.target.checked)}
                          style={{ width: 17, height: 17, cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: org.smtp_granted ? '#10b981' : 'rgb(var(--muted-foreground))' }}>
                          {org.smtp_granted ? '✓ Sidebar Visible' : 'Hidden from Sidebar'}
                        </span>
                      </label>

                      {/* Custom Relay toggle */}
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={org.allow_custom_relay}
                          disabled={!org.smtp_granted}
                          onChange={(e) => handleOrgToggle(org.id, 'allow_custom_relay', e.target.checked)}
                          style={{ width: 17, height: 17, cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgb(var(--foreground))' }}>
                          Allow Custom SMTP Credentials
                        </span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: Test Connection Tool */}
          {activeTab === 'test' && (
            <div className="card" style={{ padding: '1.5rem', borderRadius: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem', borderBottom: '1px solid rgb(var(--border))', paddingBottom: '0.75rem' }}>
                <div style={{ width: 34, height: 34, borderRadius: '10px', background: 'rgba(16,185,129,0.12)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Send size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.05rem' }}>SMTP Diagnostic & Live Test</h3>
                  <p style={{ margin: 0, fontSize: '0.72rem', color: 'rgb(var(--muted-foreground))' }}>Verify real-time TLS handshake and recipient delivery</p>
                </div>
              </div>

              <form onSubmit={handleTestEmail} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 600 }}>
                <div className="form-group">
                  <label className="input-label" style={{ fontWeight: 700, fontSize: '0.8rem' }}>Recipient Email Address</label>
                  <input
                    type="email"
                    className="input"
                    placeholder="e.g. your-email@domain.com"
                    value={testRecipient}
                    onChange={(e) => setTestRecipient(e.target.value)}
                    style={{ borderRadius: '10px' }}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isTesting}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, alignSelf: 'flex-start', padding: '0.65rem 1.5rem', borderRadius: '10px' }}
                >
                  <Send size={16} />
                  {isTesting ? 'Initiating Handshake...' : 'Send Test Diagnostic Email'}
                </button>
              </form>

              {testResult && (
                <div style={{
                  marginTop: '1.25rem',
                  padding: '1rem',
                  borderRadius: '12px',
                  background: testResult.success ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                  border: `1px solid ${testResult.success ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem'
                }}>
                  {testResult.success ? <CheckCircle2 size={20} color="#10b981" /> : <AlertCircle size={20} color="#ef4444" />}
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.875rem', color: testResult.success ? '#065F46' : '#991B1B' }}>
                      {testResult.success ? 'SMTP Handshake Verified' : 'SMTP Error'}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'rgb(var(--foreground))', marginTop: '2px' }}>
                      {testResult.message}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      )}
    </MobilePage>
  )
}
