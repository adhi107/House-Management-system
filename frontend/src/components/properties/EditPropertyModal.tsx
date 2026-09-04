import React, { useState, useEffect } from 'react'
import { Building2, Save, X, Trash2 } from 'lucide-react'
import { propertyApi } from '../../api/client'
import { Property } from '../../types'
import { Modal } from '../ui'
import { useToast } from '../../contexts/ToastContext'
import { AxiosError } from 'axios'

interface EditPropertyModalProps {
  property: Property | null
  isOpen: boolean
  onClose: () => void
  onSuccess: (updatedProperty: Property) => void
  onDeleteSuccess?: (deletedId: string) => void
}

export function EditPropertyModal({
  property,
  isOpen,
  onClose,
  onSuccess,
  onDeleteSuccess,
}: EditPropertyModalProps) {
  const { success, error } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const [form, setForm] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    total_floors: '1',
    description: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (property) {
      setForm({
        name: property.name || '',
        address: property.address || '',
        city: property.city || '',
        state: property.state || '',
        pincode: property.pincode || '',
        total_floors: String(property.total_floors || 1),
        description: property.description || '',
      })
      setErrors({})
      setShowDeleteConfirm(false)
    }
  }, [property, isOpen])

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Property name is required'
    if (!form.address.trim()) e.address = 'Address is required'
    if (!form.city.trim()) e.city = 'City is required'
    if (!form.state.trim()) e.state = 'State is required'
    if (!form.pincode.trim()) e.pincode = 'Pincode is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!property || !validate()) return

    setIsLoading(true)
    try {
      const payload = {
        name: form.name.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        pincode: form.pincode.trim(),
        total_floors: parseInt(form.total_floors) || 1,
        description: form.description.trim(),
      }

      await propertyApi.update(property.id, payload)
      success('Property updated successfully!')
      onSuccess({
        ...property,
        ...payload,
      })
      onClose()
    } catch (err) {
      const axiosErr = err as AxiosError<{ detail: string }>
      error(axiosErr.response?.data?.detail || 'Failed to update property')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!property) return
    setIsDeleting(true)
    try {
      await propertyApi.delete(property.id)
      success('Property deleted successfully!')
      if (onDeleteSuccess) {
        onDeleteSuccess(property.id)
      }
      onClose()
    } catch (err) {
      const axiosErr = err as AxiosError<{ detail: string }>
      error(axiosErr.response?.data?.detail || 'Failed to delete property. Check for active units.')
    } finally {
      setIsDeleting(false)
    }
  }

  const set = (k: string, v: string) => {
    setForm((p) => ({ ...p, [k]: v }))
    setErrors((p) => ({ ...p, [k]: '' }))
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Property / Building" maxWidth="540px">
      <form onSubmit={handleSave}>
        <div className="form-group">
          <label className="input-label" htmlFor="edit-name">Property Name</label>
          <input
            id="edit-name"
            type="text"
            className={`input ${errors.name ? 'input-error' : ''}`}
            placeholder="e.g. Sunrise Heights"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
          />
          {errors.name && <p className="input-hint input-hint-error">{errors.name}</p>}
        </div>

        <div className="form-group">
          <label className="input-label" htmlFor="edit-address">Full Address</label>
          <textarea
            id="edit-address"
            className={`input ${errors.address ? 'input-error' : ''}`}
            rows={2}
            placeholder="Street address..."
            value={form.address}
            onChange={(e) => set('address', e.target.value)}
            style={{ resize: 'none' }}
          />
          {errors.address && <p className="input-hint input-hint-error">{errors.address}</p>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div className="form-group">
            <label className="input-label" htmlFor="edit-city">City</label>
            <input
              id="edit-city"
              type="text"
              className={`input ${errors.city ? 'input-error' : ''}`}
              placeholder="Hyderabad"
              value={form.city}
              onChange={(e) => set('city', e.target.value)}
            />
            {errors.city && <p className="input-hint input-hint-error">{errors.city}</p>}
          </div>
          <div className="form-group">
            <label className="input-label" htmlFor="edit-state">State</label>
            <input
              id="edit-state"
              type="text"
              className={`input ${errors.state ? 'input-error' : ''}`}
              placeholder="Telangana"
              value={form.state}
              onChange={(e) => set('state', e.target.value)}
            />
            {errors.state && <p className="input-hint input-hint-error">{errors.state}</p>}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div className="form-group">
            <label className="input-label" htmlFor="edit-pincode">Pincode</label>
            <input
              id="edit-pincode"
              type="text"
              inputMode="numeric"
              className={`input ${errors.pincode ? 'input-error' : ''}`}
              placeholder="500001"
              value={form.pincode}
              onChange={(e) => set('pincode', e.target.value)}
              maxLength={6}
            />
            {errors.pincode && <p className="input-hint input-hint-error">{errors.pincode}</p>}
          </div>
          <div className="form-group">
            <label className="input-label" htmlFor="edit-floors">Total Floors</label>
            <input
              id="edit-floors"
              type="number"
              inputMode="numeric"
              className="input"
              min={1}
              max={50}
              value={form.total_floors}
              onChange={(e) => set('total_floors', e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="input-label" htmlFor="edit-desc">Description (optional)</label>
          <textarea
            id="edit-desc"
            className="input"
            rows={2}
            placeholder="Property description or amenities..."
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            style={{ resize: 'none' }}
          />
        </div>

        {/* Delete confirmation section */}
        {showDeleteConfirm ? (
          <div style={{ padding: '0.875rem', borderRadius: 8, background: '#FEF2F2', border: '1px solid #FECACA', marginBottom: '1rem' }}>
            <p style={{ margin: '0 0 0.5rem', fontWeight: 700, fontSize: '0.8125rem', color: '#991B1B' }}>
              Are you sure you want to delete this property?
            </p>
            <p style={{ margin: '0 0 0.75rem', fontSize: '0.75rem', color: '#B91C1C' }}>
              This will remove the property record. Properties with existing occupied units cannot be deleted.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        ) : null}

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginTop: '1.25rem', borderTop: '1px solid #F1F5F9', paddingTop: '1rem' }}>
          <div>
            {!showDeleteConfirm && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                style={{ color: '#E11D48', gap: '0.25rem' }}
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 size={14} /> Delete
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isLoading || isDeleting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isLoading || isDeleting} style={{ gap: '0.375rem' }}>
              <Save size={15} />
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
