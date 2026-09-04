import React, { useState, useEffect } from 'react'
import { FileText, Upload, Download, Trash2, Plus, ShieldCheck, Clock, File } from 'lucide-react'
import { documentApi } from '../../api/client'
import { MobilePage } from '../../components/layout/AppShell'
import { MobileHeader } from '../../components/navigation'
import { EmptyState, ErrorState, SkeletonCard, formatDate } from '../../components/ui'

interface DocItem {
  id: string
  name: string
  filename: string
  entity_type: string
  entity_id: string
  content_type: string
  size: number
  created_at: string
}

export default function TenantDocumentsPage() {
  const [documents, setDocuments] = useState<DocItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)

  const load = async () => {
    setIsLoading(true)
    setError(false)
    try {
      const res = await documentApi.list()
      setDocuments(res.data.data || [])
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
      role="tenant"
      header={
        <MobileHeader
          title="My Documents"
          showBack
          rightAction={
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setShowUploadModal(true)}
              style={{ gap: '0.25rem' }}
            >
              <Plus size={16} /> Upload
            </button>
          }
        />
      }
    >
      {/* Desktop Header */}
      <div className="module-header hidden-mobile">
        <div className="module-header-info">
          <h1 className="module-header-title">My Documents ({documents.length})</h1>
          <p className="module-header-subtitle">
            Access your rental agreements, KYC records, and uploaded verification files
          </p>
        </div>
        <div className="module-header-action">
          <button
            className="btn btn-primary"
            onClick={() => setShowUploadModal(true)}
            style={{ gap: '0.375rem' }}
          >
            <Upload size={16} /> Upload Document
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="cards-grid">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : error ? (
        <ErrorState onRetry={load} />
      ) : documents.length === 0 ? (
        <EmptyState
          icon={<FileText size={36} />}
          title="No documents uploaded yet"
          description="Upload your identity proof (Aadhaar, PAN, Passport) or lease files for secure storage."
          action={
            <button className="btn btn-primary" onClick={() => setShowUploadModal(true)}>
              <Upload size={16} /> Upload Document
            </button>
          }
        />
      ) : (
        <div className="cards-grid">
          {documents.map((doc) => (
            <DocumentCard key={doc.id} doc={doc} onDeleted={load} />
          ))}
        </div>
      )}

      {showUploadModal && (
        <UploadDocumentModal
          onClose={() => setShowUploadModal(false)}
          onUploaded={() => {
            setShowUploadModal(false)
            load()
          }}
        />
      )}
    </MobilePage>
  )
}

function DocumentCard({ doc, onDeleted }: { doc: DocItem; onDeleted: () => void }) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${doc.name}"?`)) return
    setIsDeleting(true)
    try {
      await documentApi.delete(doc.id)
      onDeleted()
    } catch {
      alert('Failed to delete document')
    } finally {
      setIsDeleting(false)
    }
  }

  const formatSize = (bytes: number) => {
    if (!bytes) return '0 KB'
    const kb = bytes / 1024
    if (kb < 1024) return `${kb.toFixed(1)} KB`
    return `${(kb / 1024).toFixed(1)} MB`
  }

  return (
    <div
      className="card card-hover"
      style={{
        padding: '1.125rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        minHeight: 155,
      }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '0.5rem',
              backgroundColor: '#EFF6FF',
              color: '#2563EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <FileText size={20} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h3
              style={{
                fontWeight: 700,
                fontSize: '0.9375rem',
                margin: 0,
                color: '#0F172A',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={doc.name}
            >
              {doc.name}
            </h3>
            <span
              style={{
                fontSize: '0.6875rem',
                padding: '0.125rem 0.375rem',
                backgroundColor: '#F1F5F9',
                color: '#475569',
                borderRadius: '0.25rem',
                textTransform: 'uppercase',
                fontWeight: 600,
                letterSpacing: '0.03em',
                display: 'inline-block',
                marginTop: '0.25rem',
              }}
            >
              {doc.entity_type}
            </span>
          </div>
        </div>

        <div style={{ fontSize: '0.75rem', color: '#64748B', display: 'flex', gap: '0.875rem', marginBottom: '0.75rem' }}>
          <span>{formatSize(doc.size)}</span>
          <span>•</span>
          <span>{formatDate(doc.created_at)}</span>
        </div>
      </div>

      <div
        style={{
          borderTop: '1px solid #F1F5F9',
          paddingTop: '0.625rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <a
          href={`/uploads/${doc.entity_type}/${doc.filename}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secondary btn-sm"
          style={{ fontSize: '0.75rem', padding: '0.3rem 0.625rem', gap: '0.25rem' }}
        >
          <Download size={13} /> View / Download
        </a>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="btn btn-secondary btn-sm"
          style={{ color: '#EF4444', padding: '0.3rem 0.5rem' }}
          title="Delete document"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )
}

function UploadDocumentModal({
  onClose,
  onUploaded,
}: {
  onClose: () => void
  onUploaded: () => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [name, setName] = useState('')
  const [docType, setDocType] = useState('kyc')
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      setError('Please select a file to upload')
      return
    }

    setIsUploading(true)
    setError('')

    const formData = new FormData()
    formData.append('file', file)
    formData.append('name', name.trim() || file.name)
    formData.append('entity_type', docType)
    formData.append('entity_id', 'self')

    try {
      await documentApi.upload(formData)
      onUploaded()
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to upload document')
    } finally {
      setIsUploading(false)
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
          maxWidth: '480px',
          backgroundColor: '#ffffff',
          borderRadius: '1rem',
          padding: '1.5rem',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: '0 0 0.25rem 0', color: '#0F172A' }}>
          Upload Document
        </h2>
        <p style={{ fontSize: '0.8125rem', color: '#64748B', margin: '0 0 1.25rem 0' }}>
          Upload identity proof, salary slips, or utility bills (PDF, JPG, PNG)
        </p>

        {error && (
          <div style={{ padding: '0.75rem', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', borderRadius: '0.5rem', fontSize: '0.8125rem', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="label" style={{ fontWeight: 600, fontSize: '0.8125rem', marginBottom: '0.25rem', display: 'block' }}>
              Document Name
            </label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Aadhaar Card Front & Back"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="label" style={{ fontWeight: 600, fontSize: '0.8125rem', marginBottom: '0.25rem', display: 'block' }}>
              Document Category
            </label>
            <select
              className="input"
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
            >
              <option value="kyc">KYC / Identity Proof</option>
              <option value="agreement">Rental Agreement</option>
              <option value="receipt">Payment Receipt</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="label" style={{ fontWeight: 600, fontSize: '0.8125rem', marginBottom: '0.25rem', display: 'block' }}>
              File * (Max 10MB)
            </label>
            <input
              type="file"
              className="input"
              required
              accept=".pdf,.jpg,.jpeg,.png,.docx"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  setFile(e.target.files[0])
                  if (!name) setName(e.target.files[0].name.replace(/\.[^/.]+$/, ''))
                }
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isUploading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isUploading} style={{ gap: '0.375rem' }}>
              {isUploading ? 'Uploading...' : <><Upload size={16} /> Upload</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
