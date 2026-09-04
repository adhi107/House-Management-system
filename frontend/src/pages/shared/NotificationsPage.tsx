import React, { useState, useEffect } from 'react'
import { notificationApi } from '../../api/client'
import { Notification } from '../../types'
import { MobilePage } from '../../components/layout/AppShell'
import { MobileHeader } from '../../components/navigation'
import { EmptyState, SkeletonCard } from '../../components/ui'
import { Bell } from 'lucide-react'

interface Props { role: 'owner' | 'tenant' }

export default function NotificationsPage({ role }: Props) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [unread, setUnread] = useState(0)

  const load = async () => {
    try {
      const res = await notificationApi.list()
      setNotifications(res.data.data || [])
      setUnread(res.data.unread_count || 0)
    } catch {
      //
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const markAllRead = async () => {
    await notificationApi.markAllRead()
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnread(0)
  }

  const markRead = async (id: string) => {
    await notificationApi.markRead(id)
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n))
    setUnread((p) => Math.max(0, p - 1))
  }

  return (
    <MobilePage role={role} header={
      <MobileHeader
        title={`Notifications ${unread > 0 ? `(${unread})` : ''}`}
        showBack
        rightAction={
          unread > 0 ? (
            <button onClick={markAllRead} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgb(var(--primary))', fontSize: '0.8125rem', fontWeight: 600 }}>
              Mark all read
            </button>
          ) : undefined
        }
      />
    }>
      {isLoading ? (
        Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
      ) : notifications.length === 0 ? (
        <EmptyState icon={<Bell size={32} />} title="No notifications" description="You're all caught up!" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => !n.read && markRead(n.id)}
              className="card"
              style={{
                display: 'block', width: '100%', textAlign: 'left', border: 'none', cursor: n.read ? 'default' : 'pointer',
                padding: '1rem',
                background: n.read ? 'rgb(var(--card))' : 'rgb(var(--primary-light))',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem', gap: '0.5rem' }}>
                <h3 style={{ fontWeight: 600, fontSize: '0.875rem', margin: 0, flex: 1 }}>{n.title}</h3>
                {!n.read && (
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgb(var(--primary))', flexShrink: 0, marginTop: 3 }} />
                )}
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'rgb(var(--muted-foreground))', margin: '0 0 0.375rem', lineHeight: 1.5 }}>{n.message}</p>
              <p style={{ fontSize: '0.6875rem', color: 'rgb(var(--muted-foreground))', margin: 0 }}>
                {new Date(n.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
              </p>
            </button>
          ))}
        </div>
      )}
    </MobilePage>
  )
}
