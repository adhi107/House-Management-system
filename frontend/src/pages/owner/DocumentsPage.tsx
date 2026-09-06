import React, { useState, useEffect } from 'react'
import { FileText, Upload, Download, Trash2, Plus, Search, Filter, Folder, ExternalLink } from 'lucide-react'
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

export default function OwnerDocumentsPage() {
  const [documents, setDocuments] = useState<DocItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')
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

  const filteredDocs = documents.filter((d) => {
    const matchesSearch = d.name?.toLowerCase().includes(search.toLowerCase()) || d.entity_type?.toLowerCase().includes(search.toLowerCase())
    const matchesType = selectedType === 'all' || d.entity_type === selectedType
    return matchesSearch && matchesType
  })

  return (
    <MobilePage
      role="owner"
      header={
        <MobileHeader
          title="Document Repository"
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
          <h1 className="module-header-title">Document Repository ({documents.length})</h1>
          <p className="module-header-subtitle">
            Store and manage lease agreements, tenant KYC proofs, property deeds, and tax receipts
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

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
          <Search
            size={18}
            style={{
              position: 'absolute',
              left: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'rgb(var(--muted-foreground))',
              pointerEvents: 'none',
            }}
          />
          <input
            type="search"
            className="input"
            style={{ paddingLeft: 44 }}
            placeholder="Search documents by name or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
          {[
            { value: 'all', label: 'All Files' },
            { value: 'agreement', label: 'Agreements' },
            { value: 'kyc', label: 'Tenant KYC' },
            { value: 'property', label: 'Property Deeds' },
            { value: 'invoice', label: 'Bills & Invoices' },
          ].map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedType(cat.value)}
              className={`btn btn-sm ${selectedType === cat.value ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.8125rem', whiteSpace: 'nowrap' }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '0.875rem', fontSize: '0.8125rem', color: 'rgb(var(--muted-foreground))', display: 'flex', justifyContent: 'space-between' }}>
        <span>Showing {filteredDocs.length} of {documents.length} document{documents.length !== 1 ? 's' : ''}</span>
      </div>

      {isLoading ? (
        <div className="cards-grid">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : error ? (
        <ErrorState onRetry={load} />
      ) : filteredDocs.length === 0 ? (
        <EmptyState
          icon={<Folder size={36} />}
          title="No documents found"
          description={search ? `No files matched "${search}"` : 'Upload your first property or tenant document.'}
          action={
            <button className="btn btn-primary" onClick={() => setShowUploadModal(true)}>
              <Upload size={16} /> Upload Document
            </button>
          }
        />
      ) : (
        <div className="cards-grid">
          {filteredDocs.map((doc) => (
            <OwnerDocumentCard key={doc.id} doc={doc} onDeleted={load} />
          ))}
        </div>
      )}

      {showUploadModal && (
        <OwnerUploadModal
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

function OwnerDocumentCard({ doc, onDeleted }: { doc: DocItem; onDeleted: () => void }) {
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
        minHeight: 160,
      }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '0.5rem',
              backgroundColor: '#EEF2FF',
              color: '#4F46E5',
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

function OwnerUploadModal({
  onClose,
  onUploaded,
}: {
  onClose: () => void
  onUploaded: () => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [name, setName] = useState('')
  const [docType, setDocType] = useState('property')
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
    formData.append('entity_id', 'general')

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
          Upload lease agreements, KYC papers, property blueprints or expense receipts
        </p>

        {error && (
          <div style={{ padding: '0.75rem', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', borderRadius: '0.5rem', fontSize: '0.8125rem', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="label" style={{ fontWeight: 600, fontSize: '0.8125rem', marginBottom: '0.25rem', display: 'block' }}>
              Document Title *
            </label>
            <input
              type="text"
              className="input"
              required
              placeholder="e.g. Master Lease Template 2026"
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
              <option value="property">Property Document / Blueprint</option>
              <option value="agreement">Rental Agreement</option>
              <option value="kyc">Tenant KYC / ID</option>
              <option value="invoice">Expense / Maintenance Invoice</option>
              <option value="other">General File</option>
            </select>
          </div>

          <div>
            <label className="label" style={{ fontWeight: 600, fontSize: '0.8125rem', marginBottom: '0.25rem', display: 'block' }}>
              Select File * (PDF, Images, DOCX - Max 10MB)
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
              {isUploading ? 'Uploading...' : <><Upload size={16} /> Upload Document</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
