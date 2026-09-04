import React from 'react'
import { clsx } from 'clsx'

// ================================================
// SKELETON LOADER
// ================================================

interface SkeletonProps {
  className?: string
  style?: React.CSSProperties
}

export function Skeleton({ className, style }: SkeletonProps) {
  return <div className={clsx('skeleton', className)} style={style} aria-hidden />
}

export function SkeletonCard() {
  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  )
}

export function SkeletonKpi() {
  return (
    <div className="kpi-card">
      <Skeleton className="h-3 w-20 mb-2" />
      <Skeleton className="h-7 w-28 mb-1" />
      <Skeleton className="h-3 w-16" />
    </div>
  )
}

// ================================================
// EMPTY STATE
// ================================================

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="empty-state animate-fade-in-up">
      {icon && (
        <div className="empty-state-icon">
          {icon}
        </div>
      )}
      <div>
        <p style={{ fontWeight: 600, fontSize: '1rem', margin: 0, color: 'rgb(var(--foreground))' }}>{title}</p>
        {description && (
          <p className="text-muted" style={{ fontSize: '0.875rem', margin: '0.375rem 0 0' }}>{description}</p>
        )}
      </div>
      {action && action}
    </div>
  )
}

// ================================================
// ERROR STATE
// ================================================

interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
}

export function ErrorState({ title = 'Something went wrong', message = "We couldn't load this information.", onRetry }: ErrorStateProps) {
  return (
    <div className="empty-state animate-fade-in-up">
      <div className="empty-state-icon" style={{ background: 'rgb(var(--danger-light))', color: 'rgb(var(--danger))' }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <div>
        <p style={{ fontWeight: 600, fontSize: '1rem', margin: 0, color: 'rgb(var(--foreground))' }}>{title}</p>
        <p className="text-muted" style={{ fontSize: '0.875rem', margin: '0.375rem 0 0' }}>{message}</p>
      </div>
      {onRetry && (
        <button className="btn btn-secondary btn-sm" onClick={onRetry}>Try Again</button>
      )}
    </div>
  )
}

// ================================================
// STATUS BADGE
// ================================================

const STATUS_LABELS: Record<string, string> = {
  paid: '✓ Paid',
  pending: '● Pending',
  partially_paid: '◐ Partial',
  overdue: '⚠ Overdue',
  waived: '– Waived',
  occupied: '● Occupied',
  vacant: '○ Vacant',
  maintenance: '⚠ Maintenance',
  reserved: '◈ Reserved',
  inactive: '– Inactive',
  open: '● Open',
  in_progress: '↻ In Progress',
  on_hold: '⏸ On Hold',
  resolved: '✓ Resolved',
  closed: '– Closed',
  rejected: '✗ Rejected',
  active: '✓ Active',
  expiring: '⚠ Expiring',
  expired: '✗ Expired',
  terminated: '– Terminated',
}

interface StatusBadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const label = STATUS_LABELS[status] || status
  return (
    <span className={clsx('badge', `badge-${status}`, className)}>
      {label}
    </span>
  )
}

// ================================================
// PROGRESS BAR
// ================================================

interface ProgressBarProps {
  value: number
  max?: number
  color?: 'primary' | 'success' | 'warning' | 'danger'
  showLabel?: boolean
  className?: string
}

export function ProgressBar({ value, max = 100, color = 'primary', showLabel = false, className }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div className={className}>
      {showLabel && (
        <div className="flex justify-between text-small text-muted mb-1">
          <span>{value.toFixed(0)}%</span>
        </div>
      )}
      <div className="progress-track">
        <div
          className={`progress-fill ${color !== 'primary' ? color : ''}`}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  )
}

// ================================================
// AVATAR
// ================================================

interface AvatarProps {
  name: string
  src?: string
  size?: 'sm' | 'md' | 'lg'
}

const SIZES = { sm: 32, md: 40, lg: 56 }
const FONT_SIZES = { sm: 12, md: 14, lg: 20 }

export function Avatar({ name, src, size = 'md' }: AvatarProps) {
  const dim = SIZES[size]
  const fontSize = FONT_SIZES[size]
  const initials = name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        width={dim}
        height={dim}
        style={{ borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
      />
    )
  }

  const colors = [
    { bg: 'rgb(219 234 254)', color: 'rgb(29 78 216)' },
    { bg: 'rgb(220 252 231)', color: 'rgb(21 128 61)' },
    { bg: 'rgb(254 226 226)', color: 'rgb(185 28 28)' },
    { bg: 'rgb(237 233 254)', color: 'rgb(109 40 217)' },
    { bg: 'rgb(255 237 213)', color: 'rgb(194 65 12)' },
  ]
  const colorIdx = name.charCodeAt(0) % colors.length
  const { bg, color } = colors[colorIdx]

  return (
    <div
      style={{
        width: dim, height: dim, borderRadius: '50%',
        background: bg, color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize, fontWeight: 700, flexShrink: 0, userSelect: 'none',
      }}
      aria-label={name}
    >
      {initials}
    </div>
  )
}

// ================================================
// BOTTOM SHEET
// ================================================

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}

export function BottomSheet({ isOpen, onClose, title, children }: BottomSheetProps) {
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="bottom-sheet-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }} role="dialog" aria-modal>
      <div className="bottom-sheet">
        <div className="bottom-sheet-handle" />
        {title && (
          <div className="flex items-center justify-between mb-4">
            <h3 style={{ fontWeight: 700, fontSize: '1.125rem', margin: 0 }}>{title}</h3>
            <button
              onClick={onClose}
              className="btn btn-ghost btn-icon"
              aria-label="Close"
              style={{ minHeight: 36, minWidth: 36 }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}

// ================================================
// MODAL (Desktop-first, converts on mobile)
// ================================================

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  maxWidth?: string
}

export function Modal({ isOpen, onClose, title, children, maxWidth = '480px' }: ModalProps) {
  React.useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }} role="dialog" aria-modal>
      <div className="modal" style={{ maxWidth }}>
        {title && (
          <div style={{ padding: '1.25rem 1.25rem 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontWeight: 700, fontSize: '1.125rem', margin: 0 }}>{title}</h3>
            <button onClick={onClose} className="btn btn-ghost btn-icon" aria-label="Close" style={{ minHeight: 36, minWidth: 36 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}
        <div style={{ padding: title ? '1rem 1.25rem 1.25rem' : '1.25rem' }}>
          {children}
        </div>
      </div>
    </div>
  )
}

// ================================================
// CONFIRM DIALOG
// ================================================

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
  isDestructive?: boolean
  isLoading?: boolean
}

export function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmLabel = 'Confirm', isDestructive, isLoading }: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <p style={{ color: 'rgb(var(--muted-foreground))', marginBottom: '1.25rem', lineHeight: 1.6 }}>{message}</p>
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button className="btn btn-secondary" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
        <button
          className={`btn ${isDestructive ? 'btn-danger' : 'btn-primary'}`}
          onClick={onConfirm}
          disabled={isLoading}
          style={{ flex: 1 }}
        >
          {isLoading ? 'Loading...' : confirmLabel}
        </button>
      </div>
    </Modal>
  )
}

// ================================================
// CURRENCY FORMAT
// ================================================

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatMonth(month: string): string {
  const [year, m] = month.split('-')
  const date = new Date(parseInt(year), parseInt(m) - 1)
  return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ================================================
// SECTION HEADER
// ================================================

interface SectionHeaderProps {
  title: string
  action?: React.ReactNode
}

export function SectionHeader({ title, action }: SectionHeaderProps) {
  return (
    <div className="section-header">
      <h3 className="text-h3" style={{ margin: 0 }}>{title}</h3>
      {action}
    </div>
  )
}
