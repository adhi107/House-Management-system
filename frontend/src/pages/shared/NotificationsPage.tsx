import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { notificationApi } from '../../api/client'
import { Notification } from '../../types'
import { MobilePage } from '../../components/layout/AppShell'
import { MobileHeader } from '../../components/navigation'
import { EmptyState, SkeletonCard } from '../../components/ui'
import { useToast } from '../../contexts/ToastContext'
import {
  Bell,
  CheckCheck,
  Trash2,
  Receipt,
  Wrench,
  Megaphone,
  FileCheck,
  ShieldAlert,
  CreditCard,
  Clock,
  Sparkles,
  ArrowRight,
  Filter,
  RefreshCw,
  CheckCircle2
} from 'lucide-react'

interface Props {
  role: 'owner' | 'tenant' | 'super_admin'
}

export default function NotificationsPage({ role }: Props) {
  const navigate = useNavigate()
  const { success, error } = useToast()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [filter, setFilter] = useState<'all' | 'unread' | 'payments' | 'maintenance' | 'announcements'>('all')

  const loadData = async (showQuiet = false) => {
    if (!showQuiet) setIsLoading(true)
    else setIsRefreshing(true)
    try {
      const res = await notificationApi.list()
      setNotifications(res.data.data || [])
      setUnreadCount(res.data.unread_count || 0)
    } catch {
      //
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
    // Poll every 20 seconds for real-time notifications
    const interval = setInterval(() => {
      loadData(true)
    }, 20000)
    return () => clearInterval(interval)
  }, [])

  const markAllRead = async () => {
    try {
      await notificationApi.markAllRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      setUnreadCount(0)
      success('All notifications marked as read!')
    } catch {
      error('Failed to mark all as read')
    }
  }

  const markRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    try {
      await notificationApi.markRead(id)
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
      setUnreadCount((p) => Math.max(0, p - 1))
    } catch {
      //
    }
  }

  const deleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await notificationApi.delete(id)
      const target = notifications.find(n => n.id === id)
      setNotifications((prev) => prev.filter((n) => n.id !== id))
      if (target && !target.read) {
        setUnreadCount((p) => Math.max(0, p - 1))
      }
      success('Notification dismissed')
    } catch {
      error('Failed to dismiss notification')
    }
  }

  const clearAll = async () => {
    if (window.confirm('Clear all notification history?')) {
      try {
        await notificationApi.clearAll()
        setNotifications([])
        setUnreadCount(0)
        success('Notification history cleared')
      } catch {
        error('Failed to clear notifications')
      }
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'payment_claimed':
      case 'rent_due':
      case 'payment_received':
        return { icon: CreditCard, color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)', label: 'Payment' }
      case 'maintenance_request':
      case 'maintenance_update':
        return { icon: Wrench, color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)', label: 'Maintenance' }
      case 'announcement':
        return { icon: Megaphone, color: '#6366F1', bg: 'rgba(99, 102, 241, 0.12)', label: 'Announcement' }
      case 'agreement':
      case 'lease_signed':
        return { icon: FileCheck, color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.12)', label: 'Lease' }
      default:
        return { icon: Bell, color: '#2563EB', bg: 'rgba(37, 99, 235, 0.12)', label: 'Notice' }
    }
  }

  const getActionTarget = (notif: Notification) => {
    const type = notif.type || ''
    if (role === 'owner') {
      if (type.includes('payment')) return { label: 'Review Payments', to: '/owner/payments' }
      if (type.includes('maintenance')) return { label: 'Open Maintenance', to: '/owner/maintenance' }
      if (type.includes('agreement')) return { label: 'View Agreements', to: '/owner/agreements' }
      if (type.includes('announcement')) return { label: 'Announcements', to: '/owner/announcements' }
    } else if (role === 'tenant') {
      if (type.includes('payment') || type.includes('rent')) return { label: 'Pay / View Bills', to: '/tenant/rent' }
      if (type.includes('maintenance')) return { label: 'View Tickets', to: '/tenant/maintenance' }
      if (type.includes('agreement')) return { label: 'View Lease', to: '/tenant/agreements' }
    }
    return null
  }

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (filter === 'unread') return !n.read
      if (filter === 'payments') return n.type?.includes('payment') || n.type?.includes('rent')
      if (filter === 'maintenance') return n.type?.includes('maintenance')
      if (filter === 'announcements') return n.type?.includes('announcement')
      return true
    })
  }, [notifications, filter])

  const filterTabs = [
    { id: 'all', label: `All (${notifications.length})` },
    { id: 'unread', label: `Unread (${unreadCount})` },
    { id: 'payments', label: 'Payments' },
    { id: 'maintenance', label: 'Maintenance' },
    { id: 'announcements', label: 'Broadcasts' },
  ] as const

  return (
    <MobilePage
      role={role as any}
      header={
        <MobileHeader
          title="Notification Center"
          showBack
          rightAction={
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <button
                onClick={() => loadData(true)}
                disabled={isRefreshing}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'rgb(var(--foreground))',
                  padding: 6,
                  display: 'flex',
                  alignItems: 'center'
                }}
                title="Refresh notifications"
              >
                <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
              </button>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'rgb(var(--primary))',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    padding: '4px 8px',
                  }}
                >
                  Mark all read
                </button>
              )}
            </div>
          }
        />
      }
    >
      {/* Desktop Top Header */}
      <div className="module-header hidden-mobile">
        <div className="module-header-info">
          <h1 className="module-header-title">Notification & Activity Center</h1>
          <p className="module-header-subtitle">
            Real-time updates on rent claims, invoices, maintenance tickets, and property announcements
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="btn btn-outline btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}
            >
              <CheckCheck size={16} /> Mark All Read ({unreadCount})
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={clearAll}
              className="btn btn-ghost btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#EF4444' }}
            >
              <Trash2 size={15} /> Clear All
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs Strip */}
      <div
        style={{
          display: 'flex',
          gap: '0.4rem',
          overflowX: 'auto',
          paddingBottom: '0.25rem',
          marginBottom: '1rem',
          scrollbarWidth: 'none',
        }}
      >
        {filterTabs.map((tab) => {
          const isSelected = filter === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id as any)}
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: '999px',
                fontSize: '0.78rem',
                fontWeight: 700,
                border: isSelected ? '1px solid rgb(var(--primary))' : '1px solid rgb(var(--border))',
                background: isSelected ? 'rgb(var(--primary))' : 'rgb(var(--card))',
                color: isSelected ? '#ffffff' : 'rgb(var(--foreground))',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filteredNotifications.length === 0 ? (
        <EmptyState
          icon={<Bell size={36} />}
          title={filter === 'unread' ? 'No unread notifications' : 'All caught up! 🎉'}
          description={
            filter === 'unread'
              ? 'You have reviewed all incoming notifications.'
              : 'New rent alerts, maintenance requests, and announcements will appear here.'
          }
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filteredNotifications.map((n) => {
            const meta = getNotificationIcon(n.type || '')
            const Icon = meta.icon
            const action = getActionTarget(n)

            return (
              <div
                key={n.id}
                onClick={() => {
                  if (!n.read) markRead(n.id)
                  if (action) navigate(action.to)
                }}
                className="card card-hover"
                style={{
                  padding: '1rem 1.15rem',
                  borderRadius: '12px',
                  background: n.read ? 'rgb(var(--card))' : 'linear-gradient(135deg, rgba(37,99,235,0.06) 0%, rgba(79,70,229,0.03) 100%)',
                  border: n.read ? '1px solid rgb(var(--border))' : '1px solid rgba(37,99,235,0.3)',
                  borderLeft: `4px solid ${meta.color}`,
                  cursor: 'pointer',
                  display: 'flex',
                  gap: '0.85rem',
                  alignItems: 'flex-start',
                  transition: 'all 0.2s ease',
                }}
              >
                {/* Icon Pill */}
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: '10px',
                    background: meta.bg,
                    color: meta.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                >
                  <Icon size={19} />
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontSize: '0.65rem',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          color: meta.color,
                          background: meta.bg,
                          padding: '0.1rem 0.4rem',
                          borderRadius: '4px',
                        }}
                      >
                        {meta.label}
                      </span>
                      <h3 style={{ fontWeight: 800, fontSize: '0.9rem', margin: 0, color: 'rgb(var(--foreground))' }}>
                        {n.title}
                      </h3>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                      {!n.read && (
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: '#2563EB',
                            boxShadow: '0 0 0 3px rgba(37,99,235,0.2)',
                          }}
                        />
                      )}
                      <button
                        type="button"
                        onClick={(e) => deleteNotification(n.id, e)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'rgb(var(--muted-foreground))',
                          padding: 4,
                          display: 'flex',
                          alignItems: 'center',
                          borderRadius: '4px',
                        }}
                        title="Dismiss notification"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <p
                    style={{
                      fontSize: '0.8125rem',
                      color: 'rgb(var(--muted-foreground))',
                      margin: '0 0 0.5rem',
                      lineHeight: 1.45,
                    }}
                  >
                    {n.message}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.7rem', color: 'rgb(var(--muted-foreground))', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Clock size={12} />
                      {new Date(n.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>

                    {action && (
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color: '#2563EB',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                        }}
                      >
                        {action.label} <ArrowRight size={13} />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </MobilePage>
  )
}
