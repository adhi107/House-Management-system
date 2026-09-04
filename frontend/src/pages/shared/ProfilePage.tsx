import React from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { MobilePage } from '../../components/layout/AppShell'
import { MobileHeader } from '../../components/navigation'
import { Avatar } from '../../components/ui'

export default function ProfilePage() {
  const { user } = useAuth()
  if (!user) return null
  const role = user.role === 'owner' ? 'owner' : 'tenant'

  return (
    <MobilePage role={role} header={<MobileHeader title="Profile" showBack />}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '1.5rem 0', marginBottom: '1.5rem' }}>
        <Avatar name={user.full_name} src={user.profile_photo} size="lg" />
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontWeight: 800, fontSize: '1.25rem', margin: '0 0 0.25rem' }}>{user.full_name}</h2>
          <p style={{ fontSize: '0.875rem', color: 'rgb(var(--muted-foreground))', margin: '0 0 0.5rem' }}>{user.email}</p>
          <span className="badge badge-active" style={{ textTransform: 'capitalize' }}>{user.role}</span>
        </div>
      </div>
      <div className="card" style={{ overflow: 'hidden' }}>
        {[
          { label: 'Full Name', value: user.full_name },
          { label: 'Email', value: user.email },
          { label: 'Phone', value: user.phone || '—' },
          { label: 'Role', value: user.role.charAt(0).toUpperCase() + user.role.slice(1) },
        ].map((row, i, arr) => (
          <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.875rem 1rem', borderBottom: i < arr.length - 1 ? '1px solid rgb(var(--border))' : 'none' }}>
            <span style={{ fontSize: '0.875rem', color: 'rgb(var(--muted-foreground))' }}>{row.label}</span>
            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{row.value}</span>
          </div>
        ))}
      </div>
    </MobilePage>
  )
}
