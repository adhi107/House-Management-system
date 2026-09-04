import React, { useState, useEffect } from 'react'
import { superAdminApi } from '../../api/client'
import { MobilePage } from '../../components/layout/AppShell'
import { MobileHeader } from '../../components/navigation'
import { ErrorState, SkeletonCard } from '../../components/ui'
import { useToast } from '../../contexts/ToastContext'
import { Settings, Save, ShieldCheck, Mail, Info } from 'lucide-react'

export default function SuperAdminSettingsPage() {
  const { success, error } = useToast()
  const [settings, setSettings] = useState<any>({
    allow_self_registration: true,
    maintenance_mode: false,
    max_buildings_per_org: 50,
    support_email: 'support@propertyhub.app',
    platform_announcement: '',
  })
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const loadData = async () => {
    setIsLoading(true)
    setHasError(false)
    try {
      const res = await superAdminApi.getSettings()
      if (res.data.data) {
        setSettings(res.data.data)
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      await superAdminApi.updateSettings(settings)
      success('Platform settings updated successfully!')
    } catch (err: any) {
      error(err.response?.data?.detail || 'Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <MobilePage
      role="super_admin"
      header={<MobileHeader title="Platform Settings" />}
    >
      {isLoading ? (
        <SkeletonCard />
      ) : hasError ? (
        <ErrorState onRetry={loadData} />
      ) : (
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontWeight: 800, fontSize: '1rem', margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={18} color="rgb(var(--primary))" /> Multi-Tenant Policies
            </h3>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <p style={{ fontWeight: 600, fontSize: '0.875rem', margin: 0 }}>Allow Owner Self-Registration</p>
                <p style={{ fontSize: '0.75rem', color: 'rgb(var(--muted-foreground))', margin: 0 }}>
                  Permit new property owners to sign up and auto-provision an organization.
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.allow_self_registration ?? true}
                onChange={(e) => setSettings({ ...settings, allow_self_registration: e.target.checked })}
                style={{ width: 20, height: 20, cursor: 'pointer' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderTop: '1px solid rgb(var(--border))', paddingTop: '1rem' }}>
              <div>
                <p style={{ fontWeight: 600, fontSize: '0.875rem', margin: 0 }}>Platform Maintenance Mode</p>
                <p style={{ fontSize: '0.75rem', color: 'rgb(var(--muted-foreground))', margin: 0 }}>
                  Show maintenance banner across all tenant & owner portals.
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.maintenance_mode ?? false}
                onChange={(e) => setSettings({ ...settings, maintenance_mode: e.target.checked })}
                style={{ width: 20, height: 20, cursor: 'pointer' }}
              />
            </div>

            <div className="form-group" style={{ borderTop: '1px solid rgb(var(--border))', paddingTop: '1rem' }}>
              <label className="input-label">Max Buildings Per Organization</label>
              <input
                type="number"
                className="input"
                value={settings.max_buildings_per_org || 50}
                onChange={(e) => setSettings({ ...settings, max_buildings_per_org: parseInt(e.target.value) || 1 })}
                min={1}
                max={500}
              />
            </div>
          </div>

          <div className="card" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontWeight: 800, fontSize: '1rem', margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Mail size={18} color="rgb(var(--info))" /> Communication & Support
            </h3>

            <div className="form-group">
              <label className="input-label">Platform Support Email</label>
              <input
                type="email"
                className="input"
                value={settings.support_email || ''}
                onChange={(e) => setSettings({ ...settings, support_email: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="input-label">Global Platform Announcement</label>
              <textarea
                className="input"
                rows={3}
                placeholder="Optional broadcast banner text..."
                value={settings.platform_announcement || ''}
                onChange={(e) => setSettings({ ...settings, platform_announcement: e.target.value })}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg btn-full"
            disabled={isSaving}
            style={{ gap: '0.5rem' }}
          >
            <Save size={18} /> {isSaving ? 'Saving Settings...' : 'Save Platform Settings'}
          </button>
        </form>
      )}
    </MobilePage>
  )
}
