import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { MobilePage } from '../../components/layout/AppShell'
import { MobileHeader } from '../../components/navigation'
import { authApi } from '../../api/client'
import { Settings, Lock, Bell, User, Shield, Moon, Check, Save } from 'lucide-react'

export default function SettingsPage({ role }: { role?: 'owner' | 'tenant' | 'super_admin' }) {
  const { user } = useAuth()
  const { success, error } = useToast()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  // Notification toggles
  const [emailAlerts, setEmailAlerts] = useState(true)
  const [smsAlerts, setSmsAlerts] = useState(true)
  const [paymentReminders, setPaymentReminders] = useState(true)

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentPassword || !newPassword) {
      error('Please enter both current and new password')
      return
    }
    if (newPassword !== confirmPassword) {
      error('New passwords do not match')
      return
    }
    if (newPassword.length < 8) {
      error('New password must be at least 8 characters')
      return
    }

    setIsChangingPassword(true)
    try {
      await authApi.changePassword({ current_password: currentPassword, new_password: newPassword })
      success('Password updated successfully!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      error(err.response?.data?.detail || 'Failed to update password')
    } finally {
      setIsChangingPassword(false)
    }
  }

  const effectiveRole = role || (user?.role as any) || 'owner'

  return (
    <MobilePage role={effectiveRole} header={<MobileHeader title="Account Settings" showBack />}>
      {/* Desktop Header */}
      <div className="module-header hidden-mobile">
        <div className="module-header-info">
          <h1 className="module-header-title">Account & Security Settings</h1>
          <p className="module-header-subtitle">
            Manage your credentials, login security, and communication preferences
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {/* Profile Card */}
        <div className="card" style={{ padding: '1.25rem', background: '#FFFFFF' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.75rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 800, color: '#0F172A' }}>Profile Overview</h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748B' }}>Personal contact information</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.8125rem' }}>
            <div>
              <label className="input-label">Full Name</label>
              <input type="text" className="input" value={user?.full_name || ''} readOnly style={{ background: '#F8FAFC' }} />
            </div>
            <div>
              <label className="input-label">Email Address</label>
              <input type="email" className="input" value={user?.email || ''} readOnly style={{ background: '#F8FAFC' }} />
            </div>
            <div>
              <label className="input-label">Role</label>
              <input type="text" className="input" value={(user?.role || '').toUpperCase()} readOnly style={{ background: '#F8FAFC' }} />
            </div>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="card" style={{ padding: '1.25rem', background: '#FFFFFF' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.75rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#FFFBEB', color: '#B45309', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Lock size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 800, color: '#0F172A' }}>Security & Password</h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748B' }}>Update your login password</p>
            </div>
          </div>

          <form onSubmit={handlePasswordChange}>
            <div className="form-group">
              <label className="input-label">Current Password</label>
              <input
                type="password"
                className="input"
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="input-label">New Password</label>
              <input
                type="password"
                className="input"
                placeholder="Min 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>

            <div className="form-group">
              <label className="input-label">Confirm New Password</label>
              <input
                type="password"
                className="input"
                placeholder="Re-type new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full"
              style={{ marginTop: '1rem', gap: '0.375rem' }}
              disabled={isChangingPassword}
            >
              <Save size={15} />
              {isChangingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>

        {/* Notifications & Alert Preferences */}
        <div className="card" style={{ padding: '1.25rem', background: '#FFFFFF' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.75rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#ECFDF5', color: '#047857', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bell size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 800, color: '#0F172A' }}>Notifications</h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748B' }}>Control delivery channels</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontSize: '0.8125rem' }}>
              <div>
                <p style={{ fontWeight: 700, margin: 0, color: '#0F172A' }}>Email Receipts & Invoices</p>
                <p style={{ margin: 0, fontSize: '0.6875rem', color: '#64748B' }}>Receive PDF copies of monthly billing</p>
              </div>
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => {
                  setEmailAlerts(e.target.checked)
                  success('Notification preference saved')
                }}
              />
            </label>

            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontSize: '0.8125rem' }}>
              <div>
                <p style={{ fontWeight: 700, margin: 0, color: '#0F172A' }}>SMS Payment Reminders</p>
                <p style={{ margin: 0, fontSize: '0.6875rem', color: '#64748B' }}>Get text alert when rent is due</p>
              </div>
              <input
                type="checkbox"
                checked={smsAlerts}
                onChange={(e) => {
                  setSmsAlerts(e.target.checked)
                  success('Notification preference saved')
                }}
              />
            </label>

            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontSize: '0.8125rem' }}>
              <div>
                <p style={{ fontWeight: 700, margin: 0, color: '#0F172A' }}>Maintenance Ticket Updates</p>
                <p style={{ margin: 0, fontSize: '0.6875rem', color: '#64748B' }}>Live status alerts when issues resolve</p>
              </div>
              <input
                type="checkbox"
                checked={paymentReminders}
                onChange={(e) => {
                  setPaymentReminders(e.target.checked)
                  success('Notification preference saved')
                }}
              />
            </label>
          </div>
        </div>
      </div>
    </MobilePage>
  )
}
