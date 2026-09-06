import React, { useState, useEffect } from 'react'
import { smtpApi, tenantApi, propertyApi } from '../../api/client'
import { MobilePage } from '../../components/layout/AppShell'
import { MobileHeader } from '../../components/navigation'
import { ErrorState, SkeletonCard } from '../../components/ui'
import { useToast } from '../../contexts/ToastContext'
import {
  Mail,
  Server,
  Send,
  Save,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Building2,
  Sparkles,
  RefreshCw,
  Users,
  Clock,
  CheckCheck,
  ShieldCheck,
  Zap,
  Lock,
  Inbox
} from 'lucide-react'

interface OwnerSmtpConfig {
  use_custom_smtp: boolean
  host: string
  port: number
  tls: boolean
  ssl_tls: boolean
  username: string
  password: string
  from_name: string
  from_email: string
}

interface EmailLog {
  id: string
  sender_email: string
  recipient_email: string
  subject: string
  status: string
  error_detail?: string
  target_type?: string
  created_at: string
}

export default function OwnerSmtpPage() {
  const { success, error } = useToast()
  const [config, setConfig] = useState<OwnerSmtpConfig>({
    use_custom_smtp: false,
    host: 'smtp.gmail.com',
    port: 587,
    tls: true,
    ssl_tls: false,
    username: '',
    password: '',
    from_name: '',
    from_email: '',
  })
  const [isGranted, setIsGranted] = useState(true)
  const [allowCustomRelay, setAllowCustomRelay] = useState(true)
  const [monthlyQuota, setMonthlyQuota] = useState(5000)
  const [usedThisMonth, setUsedThisMonth] = useState(0)
  const [logs, setLogs] = useState<EmailLog[]>([])
  
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [isDispatching, setIsDispatching] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [activeTab, setActiveTab] = useState<'config' | 'compose' | 'logs'>('config')

  // Test email state
  const [testRecipient, setTestRecipient] = useState('')
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  // Quick Composer State
  const [composeTarget, setComposeTarget] = useState<'all' | 'custom'>('all')
  const [composeRecipient, setComposeRecipient] = useState('')
  const [composeSubject, setComposeSubject] = useState('')
  const [composeBody, setComposeBody] = useState('')

  const loadData = async () => {
    setIsLoading(true)
    setHasError(false)
    try {
      const res = await smtpApi.getOwnerConfig()
      if (res.data?.data) {
        setConfig(res.data.data.config)
        setIsGranted(res.data.data.is_granted ?? true)
        setAllowCustomRelay(res.data.data.allow_custom_relay ?? true)
        setMonthlyQuota(res.data.data.monthly_quota || 5000)
        setUsedThisMonth(res.data.data.used_this_month || 0)
        setLogs(res.data.data.recent_logs || [])
        if (!testRecipient && res.data.data.config?.from_email) {
          setTestRecipient(res.data.data.config.from_email)
        }
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

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setIsSaving(true)
    try {
      await smtpApi.updateOwnerConfig(config)
      success('Email SMTP configuration saved successfully!')
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
      const res = await smtpApi.testOwnerSmtp({
        recipient: testRecipient,
        subject: `PropertyHub Test Dispatch: ${config.from_name || 'Management'}`,
        message: 'This is a verified test email sent via your property management SMTP email gateway.',
        custom_config: config,
      })
      setTestResult({ success: true, message: res.data?.message || 'Email delivered successfully!' })
      success('Test email delivered successfully!')
      loadData()
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'SMTP Connection failed'
      setTestResult({ success: false, message: msg })
      error(msg)
    } finally {
      setIsTesting(false)
    }
  }

  const handleComposeSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!composeSubject || !composeBody) {
      error('Subject and message body are required')
      return
    }

    setIsDispatching(true)
    try {
      let recipients: string[] = []
      if (composeTarget === 'all') {
        // Fetch all active tenants
        const tRes = await tenantApi.list()
        recipients = (tRes.data?.data || [])
          .map((t: any) => t.email)
          .filter((em: string) => em && em.includes('@'))
        
        if (recipients.length === 0) {
          recipients = [config.from_email || 'tenant@propertyhub.dev']
        }
      } else {
        recipients = [composeRecipient.trim()]
      }

      await smtpApi.sendOwnerEmail({
        recipients,
        subject: composeSubject,
        body_html: `<div style="font-family: Arial, sans-serif; padding: 15px; color: #1e293b;">${composeBody.replace(/\n/g, '<br/>')}</div>`,
        target_type: composeTarget,
      })

      success(`Email sent to ${recipients.length} recipient(s)!`)
      setComposeSubject('')
      setComposeBody('')
      loadData()
      setActiveTab('logs')
    } catch (err: any) {
      error(err.response?.data?.detail || 'Failed to dispatch email')
    } finally {
      setIsDispatching(false)
    }
  }

  return (
    <MobilePage
      role="owner"
      header={
        <MobileHeader
          title="Email & SMTP Gateway"
          showBack
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
      {/* Desktop Module Header */}
      <div className="module-header hidden-mobile">
        <div className="module-header-info">
          <h1 className="module-header-title">Email Communications & SMTP Gateway</h1>
          <p className="module-header-subtitle">
            Send rent receipts, payment reminders, and announcements directly via your custom or platform SMTP email relay
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            onClick={() => handleSave()}
            className="btn btn-primary"
            disabled={isSaving}
            style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 800 }}
          >
            <Save size={16} /> {isSaving ? 'Saving...' : 'Save SMTP Settings'}
          </button>
        </div>
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
          
          {/* Quota & Status Ribbon */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(37,99,235,0.08) 0%, rgba(79,70,229,0.06) 100%)',
            border: '1px solid rgba(37,99,235,0.2)',
            borderRadius: '16px',
            padding: '1rem 1.25rem',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: 42,
                height: 42,
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 4px 12px rgba(37,99,235,0.25)'
              }}>
                <Mail size={20} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>
                    {config.use_custom_smtp ? 'Custom SMTP Relay Connected' : 'PropertyHub Cloud Relay Active'}
                  </h3>
                  <span style={{
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    padding: '2px 6px',
                    borderRadius: '999px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#10b981',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    textTransform: 'uppercase'
                  }}>
                    Ready to Send
                  </span>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'rgb(var(--muted-foreground))', margin: '2px 0 0' }}>
                  Monthly Dispatched: <strong>{logs.length}</strong> / {monthlyQuota.toLocaleString()} emails
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setActiveTab('compose')}
                className="btn btn-sm btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}
              >
                <Send size={14} /> Send Email Notice
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', scrollbarWidth: 'none' }}>
            {[
              { id: 'config', label: 'SMTP Server Settings', icon: Server },
              { id: 'compose', label: 'Send Notice / Mail', icon: Send },
              { id: 'logs', label: `Dispatch History (${logs.length})`, icon: Inbox },
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

          {/* TAB 1: SMTP Settings Form */}
          {activeTab === 'config' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <form onSubmit={handleSave} className="card" style={{ padding: '1.5rem', borderRadius: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid rgb(var(--border))', paddingBottom: '0.75rem' }}>
                  <div>
                    <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Server size={18} color="#2563eb" /> Relay Mode & Sender Details
                    </h3>
                    <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'rgb(var(--muted-foreground))' }}>
                      Choose between PropertyHub Managed Relay or your own custom SMTP domain server.
                    </p>
                  </div>

                  {allowCustomRelay && (
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>Use Custom SMTP</span>
                      <input
                        type="checkbox"
                        checked={config.use_custom_smtp}
                        onChange={(e) => setConfig({ ...config, use_custom_smtp: e.target.checked })}
                        style={{ width: 18, height: 18, cursor: 'pointer' }}
                      />
                    </label>
                  )}
                </div>

                {/* Sender Display Details */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div className="form-group">
                    <label className="input-label" style={{ fontWeight: 700, fontSize: '0.8rem' }}>Sender Name (Appears in inbox)</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="e.g. Sunrise Heights Management"
                      value={config.from_name}
                      onChange={(e) => setConfig({ ...config, from_name: e.target.value })}
                      style={{ borderRadius: '10px' }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="input-label" style={{ fontWeight: 700, fontSize: '0.8rem' }}>Sender From Email</label>
                    <input
                      type="email"
                      className="input"
                      placeholder="e.g. billing@sunriseheights.com"
                      value={config.from_email}
                      onChange={(e) => setConfig({ ...config, from_email: e.target.value })}
                      style={{ borderRadius: '10px' }}
                    />
                  </div>
                </div>

                {/* Custom SMTP Server inputs */}
                {config.use_custom_smtp && (
                  <div style={{ borderTop: '1px solid rgb(var(--border))', paddingTop: '1.25rem' }}>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 800, margin: '0 0 1rem', color: '#2563eb' }}>Custom SMTP Server Parameters</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                      <div className="form-group">
                        <label className="input-label" style={{ fontWeight: 700, fontSize: '0.8rem' }}>SMTP Host</label>
                        <input
                          type="text"
                          className="input"
                          placeholder="smtp.gmail.com or smtp.zoho.com"
                          value={config.host}
                          onChange={(e) => setConfig({ ...config, host: e.target.value })}
                          style={{ borderRadius: '10px', fontFamily: 'monospace' }}
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
                        />
                      </div>

                      <div className="form-group">
                        <label className="input-label" style={{ fontWeight: 700, fontSize: '0.8rem' }}>SMTP Username / App Email</label>
                        <input
                          type="text"
                          className="input"
                          placeholder="user@domain.com"
                          value={config.username}
                          onChange={(e) => setConfig({ ...config, username: e.target.value })}
                          style={{ borderRadius: '10px' }}
                        />
                      </div>

                      <div className="form-group">
                        <label className="input-label" style={{ fontWeight: 700, fontSize: '0.8rem' }}>SMTP Password / App Password</label>
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
                  </div>
                )}

                <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSaving}
                    style={{ fontWeight: 800, padding: '0.65rem 1.5rem', borderRadius: '10px' }}
                  >
                    <Save size={16} /> {isSaving ? 'Saving Configuration...' : 'Save Configuration'}
                  </button>
                </div>
              </form>

              {/* Instant Test Diagnostic Box */}
              <div className="card" style={{ padding: '1.25rem', borderRadius: '16px' }}>
                <h3 style={{ margin: '0 0 0.5rem', fontWeight: 800, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Send size={16} color="#10b981" /> 1-Click SMTP Connection Test
                </h3>
                <p style={{ margin: '0 0 1rem', fontSize: '0.75rem', color: 'rgb(var(--muted-foreground))' }}>
                  Send a test email to verify that your sender domain and credentials deliver to inboxes without rejection.
                </p>

                <form onSubmit={handleTestEmail} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <input
                    type="email"
                    className="input"
                    placeholder="Enter test recipient email..."
                    value={testRecipient}
                    onChange={(e) => setTestRecipient(e.target.value)}
                    style={{ flex: '1 1 240px', borderRadius: '10px' }}
                    required
                  />
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isTesting}
                    style={{ fontWeight: 700, borderRadius: '10px' }}
                  >
                    <Send size={15} /> {isTesting ? 'Testing Handshake...' : 'Send Test Email'}
                  </button>
                </form>

                {testResult && (
                  <div style={{
                    marginTop: '1rem',
                    padding: '0.75rem 1rem',
                    borderRadius: '10px',
                    background: testResult.success ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                    border: `1px solid ${testResult.success ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.5rem'
                  }}>
                    {testResult.success ? <CheckCircle2 size={18} color="#10b981" /> : <AlertCircle size={18} color="#ef4444" />}
                    <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{testResult.message}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Compose & Send Email Notice */}
          {activeTab === 'compose' && (
            <form onSubmit={handleComposeSend} className="card" style={{ padding: '1.5rem', borderRadius: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem', borderBottom: '1px solid rgb(var(--border))', paddingBottom: '0.75rem' }}>
                <div style={{ width: 34, height: 34, borderRadius: '10px', background: 'rgba(37,99,235,0.12)', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Send size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.05rem' }}>Compose & Dispatch Email Notice</h3>
                  <p style={{ margin: 0, fontSize: '0.72rem', color: 'rgb(var(--muted-foreground))' }}>Broadcast official announcements or payment reminders to your tenants</p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="input-label" style={{ fontWeight: 700, fontSize: '0.8rem' }}>Recipient Target</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => setComposeTarget('all')}
                      style={{
                        flex: 1,
                        padding: '0.6rem',
                        borderRadius: '10px',
                        border: composeTarget === 'all' ? '2px solid #2563eb' : '1px solid rgb(var(--border))',
                        background: composeTarget === 'all' ? 'rgba(37,99,235,0.1)' : 'rgb(var(--background))',
                        color: composeTarget === 'all' ? '#2563eb' : 'inherit',
                        fontWeight: 700,
                        fontSize: '0.825rem',
                        cursor: 'pointer'
                      }}
                    >
                      📢 All Active Residents / Tenants
                    </button>
                    <button
                      type="button"
                      onClick={() => setComposeTarget('custom')}
                      style={{
                        flex: 1,
                        padding: '0.6rem',
                        borderRadius: '10px',
                        border: composeTarget === 'custom' ? '2px solid #2563eb' : '1px solid rgb(var(--border))',
                        background: composeTarget === 'custom' ? 'rgba(37,99,235,0.1)' : 'rgb(var(--background))',
                        color: composeTarget === 'custom' ? '#2563eb' : 'inherit',
                        fontWeight: 700,
                        fontSize: '0.825rem',
                        cursor: 'pointer'
                      }}
                    >
                      ✉️ Specific Email Recipient
                    </button>
                  </div>
                </div>

                {composeTarget === 'custom' && (
                  <div className="form-group">
                    <label className="input-label" style={{ fontWeight: 700, fontSize: '0.8rem' }}>Recipient Email Address</label>
                    <input
                      type="email"
                      className="input"
                      placeholder="tenant@email.com"
                      value={composeRecipient}
                      onChange={(e) => setComposeRecipient(e.target.value)}
                      style={{ borderRadius: '10px' }}
                      required
                    />
                  </div>
                )}

                <div className="form-group">
                  <label className="input-label" style={{ fontWeight: 700, fontSize: '0.8rem' }}>Email Subject</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. Monthly Maintenance Notice / Upcoming Inspection"
                    value={composeSubject}
                    onChange={(e) => setComposeSubject(e.target.value)}
                    style={{ borderRadius: '10px' }}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="input-label" style={{ fontWeight: 700, fontSize: '0.8rem' }}>Message Content</label>
                  <textarea
                    className="input"
                    rows={6}
                    placeholder="Type your official announcement or notice message here..."
                    value={composeBody}
                    onChange={(e) => setComposeBody(e.target.value)}
                    style={{ borderRadius: '10px', resize: 'vertical' }}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-lg"
                  disabled={isDispatching}
                  style={{ fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', borderRadius: '10px' }}
                >
                  <Send size={18} /> {isDispatching ? 'Dispatching Mails...' : 'Send Official Email Now'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: Dispatch Logs */}
          {activeTab === 'logs' && (
            <div className="card" style={{ padding: '1.25rem', borderRadius: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid rgb(var(--border))', paddingBottom: '0.75rem' }}>
                <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Inbox size={18} color="#2563eb" /> Outbound Email Dispatch Log
                </h3>
                <button
                  onClick={loadData}
                  className="btn btn-outline btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                >
                  <RefreshCw size={13} /> Refresh
                </button>
              </div>

              {logs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'rgb(var(--muted-foreground))' }}>
                  <Mail size={36} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
                  <p style={{ margin: 0, fontWeight: 600 }}>No outbound emails dispatched yet</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      style={{
                        padding: '0.85rem 1rem',
                        borderRadius: '10px',
                        background: 'rgb(var(--background))',
                        border: '1px solid rgb(var(--border))',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '0.5rem'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.85rem' }}>{log.subject}</span>
                          <span style={{
                            fontSize: '0.65rem',
                            fontWeight: 800,
                            padding: '1px 5px',
                            borderRadius: '4px',
                            background: log.status === 'delivered' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                            color: log.status === 'delivered' ? '#10b981' : '#ef4444',
                            textTransform: 'uppercase'
                          }}>
                            {log.status}
                          </span>
                        </div>
                        <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: 'rgb(var(--muted-foreground))' }}>
                          To: <strong>{log.recipient_email}</strong> • From: {log.sender_email}
                        </p>
                      </div>

                      <span style={{ fontSize: '0.7rem', color: 'rgb(var(--muted-foreground))', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Clock size={12} />
                        {new Date(log.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      )}
    </MobilePage>
  )
}
