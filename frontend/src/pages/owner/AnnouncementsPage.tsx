import React, { useState, useEffect } from 'react'
import { Megaphone, Plus, Search, Send, Users, Building, CheckCircle, Calendar, MessageSquare } from 'lucide-react'
import { announcementApi, propertyApi, tenantApi } from '../../api/client'
import { Property, Tenant } from '../../types'
import { MobilePage } from '../../components/layout/AppShell'
import { MobileHeader } from '../../components/navigation'
import { EmptyState, ErrorState, SkeletonCard, formatDate } from '../../components/ui'

interface AnnouncementItem {
  id: string
  title: string
  message: string
  target: string
  property_id?: string
  tenant_id?: string
  created_at: string
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)
  const [showModal, setShowModal] = useState(false)

  const load = async () => {
    setIsLoading(true)
    setError(false)
    try {
      const res = await announcementApi.list()
      setAnnouncements(res.data.data || [])
    } catch {
      setError(true)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <MobilePage
      role="owner"
      header={
        <MobileHeader
          title="Announcements"
          showBack
          rightAction={
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setShowModal(true)}
              style={{ gap: '0.25rem' }}
            >
              <Plus size={16} /> New
            </button>
          }
        />
      }
    >
      {/* Desktop Header */}
      <div className="module-header hidden-mobile">
        <div className="module-header-info">
          <h1 className="module-header-title">Announcements ({announcements.length})</h1>
          <p className="module-header-subtitle">
            Broadcast emergency alerts, maintenance schedules, or festival wishes to your tenants
          </p>
        </div>
        <div className="module-header-action">
          <button
            className="btn btn-primary"
            onClick={() => setShowModal(true)}
            style={{ gap: '0.375rem' }}
          >
            <Megaphone size={16} /> + New Announcement
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '0.875rem', fontSize: '0.8125rem', color: 'rgb(var(--muted-foreground))', display: 'flex', justifyContent: 'space-between' }}>
        <span>Showing {announcements.length} broadcast{announcements.length !== 1 ? 's' : ''}</span>
      </div>

      {isLoading ? (
        <div className="cards-grid">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : error ? (
        <ErrorState onRetry={load} />
      ) : announcements.length === 0 ? (
        <EmptyState
          icon={<Megaphone size={36} />}
          title="No announcements sent yet"
          description="Create your first notice or broadcast to notify your tenants instantly."
          action={
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              <Megaphone size={16} /> Send Announcement
            </button>
          }
        />
      ) : (
        <div className="cards-grid">
          {announcements.map((item) => (
            <AnnouncementCard key={item.id} announcement={item} />
          ))}
        </div>
      )}

      {showModal && (
        <CreateAnnouncementModal
          onClose={() => setShowModal(false)}
          onCreated={() => {
            setShowModal(false)
            load()
          }}
        />
      )}
    </MobilePage>
  )
}

function AnnouncementCard({ announcement }: { announcement: AnnouncementItem }) {
  const getTargetBadge = () => {
    switch (announcement.target) {
      case 'building':
        return { label: 'Building Notice', color: '#0284C7', bg: '#E0F2FE' }
      case 'tenant':
        return { label: 'Direct Tenant', color: '#7C3AED', bg: '#EDE9FE' }
      default:
        return { label: 'All Tenants', color: '#059669', bg: '#D1FAE5' }
    }
  }

  const badge = getTargetBadge()

  return (
    <div
      className="card card-hover"
      style={{
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        minHeight: 180,
      }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <span
            style={{
              fontSize: '0.6875rem',
              padding: '0.2rem 0.5rem',
              borderRadius: '9999px',
              fontWeight: 700,
              backgroundColor: badge.bg,
              color: badge.color,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            {badge.label}
          </span>
          <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Calendar size={12} /> {formatDate(announcement.created_at)}
          </span>
        </div>

        <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: '#0F172A' }}>
          {announcement.title}
        </h3>

        <p
          style={{
            fontSize: '0.875rem',
            color: '#475569',
            margin: 0,
            lineHeight: 1.5,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {announcement.message}
        </p>
      </div>

      <div
        style={{
          borderTop: '1px solid #F1F5F9',
          paddingTop: '0.625rem',
          marginTop: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.375rem',
          fontSize: '0.75rem',
          color: '#10B981',
          fontWeight: 600,
        }}
      >
        <CheckCircle size={13} /> Delivered to tenant inboxes
      </div>
    </div>
  )
}

function CreateAnnouncementModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: () => void
}) {
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [target, setTarget] = useState('all')
  const [propertyId, setPropertyId] = useState('')
  const [tenantId, setTenantId] = useState('')
  const [properties, setProperties] = useState<Property[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    propertyApi.list().then((r) => setProperties(r.data.data || [])).catch(() => {})
    tenantApi.list().then((r) => setTenants(r.data.data || [])).catch(() => {})
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      await announcementApi.create({
        title: title.trim(),
        message: message.trim(),
        target,
        property_id: target === 'building' ? propertyId : undefined,
        tenant_id: target === 'tenant' ? tenantId : undefined,
      })
      onCreated()
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to send announcement')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '520px',
          backgroundColor: '#ffffff',
          borderRadius: '1rem',
          padding: '1.5rem',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.25rem' }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '0.5rem',
              backgroundColor: '#EFF6FF',
              color: '#2563EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Megaphone size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0, color: '#0F172A' }}>
              Broadcast Announcement
            </h2>
            <p style={{ fontSize: '0.8125rem', color: '#64748B', margin: 0 }}>
              Send an instant notification to your tenants
            </p>
          </div>
        </div>

        {error && (
          <div style={{ padding: '0.75rem', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', borderRadius: '0.5rem', fontSize: '0.8125rem', marginTop: '1rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.25rem' }}>
          <div>
            <label className="label" style={{ fontWeight: 600, fontSize: '0.8125rem', marginBottom: '0.25rem', display: 'block' }}>
              Target Audience
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
              {[
                { value: 'all', label: 'All Tenants' },
                { value: 'building', label: 'One Property' },
                { value: 'tenant', label: 'One Tenant' },
              ].map((t) => (
                <button
                  type="button"
                  key={t.value}
                  onClick={() => setTarget(t.value)}
                  className={`btn btn-sm ${target === t.value ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.8125rem' }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {target === 'building' && (
            <div>
              <label className="label" style={{ fontWeight: 600, fontSize: '0.8125rem', marginBottom: '0.25rem', display: 'block' }}>
                Select Property *
              </label>
              <select
                className="input"
                required
                value={propertyId}
                onChange={(e) => setPropertyId(e.target.value)}
              >
                <option value="">Choose a property...</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {target === 'tenant' && (
            <div>
              <label className="label" style={{ fontWeight: 600, fontSize: '0.8125rem', marginBottom: '0.25rem', display: 'block' }}>
                Select Tenant *
              </label>
              <select
                className="input"
                required
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
              >
                <option value="">Choose a tenant...</option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.full_name} {t.unit_number ? `(Flat ${t.unit_number})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="label" style={{ fontWeight: 600, fontSize: '0.8125rem', marginBottom: '0.25rem', display: 'block' }}>
              Subject / Title *
            </label>
            <input
              type="text"
              className="input"
              required
              placeholder="e.g. Water Tank Maintenance This Sunday (10 AM - 2 PM)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="label" style={{ fontWeight: 600, fontSize: '0.8125rem', marginBottom: '0.25rem', display: 'block' }}>
              Message Details *
            </label>
            <textarea
              className="input"
              required
              rows={4}
              placeholder="Write your detailed announcement message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting} style={{ gap: '0.375rem' }}>
              {isSubmitting ? 'Sending...' : <><Send size={16} /> Broadcast Now</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
