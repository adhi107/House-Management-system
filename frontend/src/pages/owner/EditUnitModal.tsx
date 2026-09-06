import React, { useState, useEffect } from 'react'
import {
  X,
  Edit3,
  Save,
  Trash2,
  AlertTriangle,
  Zap,
  ShieldCheck,
  Building,
  Home,
  CheckCircle2,
  DollarSign,
  Phone,
  MessageSquare,
} from 'lucide-react'
import { Unit } from '../../types'
import { unitApi } from '../../api/client'
import { Modal, formatCurrency } from '../../components/ui'
import { useToast } from '../../contexts/ToastContext'

interface EditUnitModalProps {
  unit: Unit | null
  isOpen: boolean
  onClose: () => void
  onSuccess: (updatedUnit?: any) => void
  onDeleteSuccess?: () => void
}

const UNIT_TYPES = ['1RK', '1BHK', '2BHK', '3BHK', '4BHK', 'Studio', 'Penthouse', 'Commercial', 'Shop']

export default function EditUnitModal({
  unit,
  isOpen,
  onClose,
  onSuccess,
  onDeleteSuccess,
}: EditUnitModalProps) {
  const { success, error } = useToast()

  const [unitNumber, setUnitNumber] = useState('')
  const [floorNumber, setFloorNumber] = useState('1')
  const [unitType, setUnitType] = useState('2BHK')
  const [monthlyRent, setMonthlyRent] = useState('')
  const [securityDeposit, setSecurityDeposit] = useState('')
  const [maintenanceCharge, setMaintenanceCharge] = useState('0')
  const [areaSqft, setAreaSqft] = useState('')
  const [status, setStatus] = useState<'vacant' | 'occupied' | 'maintenance'>('vacant')
  const [description, setDescription] = useState('')
  const [furnishing, setFurnishing] = useState('Semi-Furnished')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (unit) {
      setUnitNumber(unit.unit_number || '')
      setFloorNumber(String(unit.floor_number ?? 1))
      setUnitType(unit.unit_type || '2BHK')
      setMonthlyRent(String(unit.monthly_rent || ''))
      setSecurityDeposit(String(unit.security_deposit || ''))
      setMaintenanceCharge(String(unit.maintenance_charge || '0'))
      setAreaSqft(unit.area_sqft ? String(unit.area_sqft) : '')
      setStatus((unit.status as any) || 'vacant')
      setDescription(unit.description || '')
      setShowDeleteConfirm(false)
    }
  }, [unit])

  if (!isOpen || !unit) return null

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!unitNumber.trim() || !monthlyRent) {
      error('Please provide unit number and rent amount')
      return
    }

    setIsSubmitting(true)
    try {
      const payload: any = {
        unit_number: unitNumber.trim(),
        floor_number: parseInt(floorNumber) || 1,
        unit_type: unitType,
        monthly_rent: parseFloat(monthlyRent) || 0,
        security_deposit: parseFloat(securityDeposit) || 0,
        maintenance_charge: parseFloat(maintenanceCharge) || 0,
        status: status,
      }

      if (areaSqft) {
        payload.area_sqft = parseFloat(areaSqft)
      }
      if (description) {
        payload.description = description
      }

      const res = await unitApi.update(unit.id, payload)
      success(res.data?.message || 'Flat details updated successfully!')
      onSuccess(payload)
      onClose()
    } catch (err: any) {
      error(err.response?.data?.detail || 'Failed to update unit')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (unit.status === 'occupied') {
      error('Cannot delete an occupied flat. Please vacate the resident first.')
      return
    }

    setIsDeleting(true)
    try {
      await unitApi.delete(unit.id)
      success(`Flat ${unit.unit_number} deleted successfully`)
      if (onDeleteSuccess) {
        onDeleteSuccess()
      } else {
        onSuccess()
      }
      onClose()
    } catch (err: any) {
      error(err.response?.data?.detail || 'Failed to delete flat')
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const cleanPhone = (phone?: string) => phone?.replace(/\D/g, '') || ''

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit Flat ${unit.unit_number}`} maxWidth="560px">
      <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        
        {/* Unit & Property Badge Banner */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.75rem 1rem',
            borderRadius: '0.625rem',
            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
            color: '#FFFFFF',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Building size={16} color="#38BDF8" />
              <span style={{ fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.01em' }}>
                Flat {unitNumber || unit.unit_number}
              </span>
              <span
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  padding: '0.15rem 0.45rem',
                  borderRadius: 4,
                  background: 'rgba(255,255,255,0.15)',
                  color: '#BAE6FD',
                }}
              >
                {unitType}
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#94A3B8', margin: '0.15rem 0 0' }}>
              {unit.property_name || 'Building Property'} • Floor {floorNumber}
            </p>
          </div>

          <div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              style={{
                background: status === 'occupied' ? '#065F46' : status === 'vacant' ? '#1E40AF' : '#92400E',
                color: '#FFFFFF',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '0.375rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '0.3rem 0.6rem',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value="vacant">🟢 Vacant (Available)</option>
              <option value="occupied">🔵 Occupied</option>
              <option value="maintenance">🟠 Under Maintenance</option>
            </select>
          </div>
        </div>

        {/* Resident Mini-Card if Occupied */}
        {unit.tenant_name && (
          <div
            style={{
              padding: '0.625rem 0.875rem',
              borderRadius: '0.5rem',
              background: '#ECFDF5',
              border: '1px solid #A7F3D0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#047857', textTransform: 'uppercase' }}>
                Current Resident
              </span>
              <p style={{ fontWeight: 800, fontSize: '0.875rem', color: '#065F46', margin: '0.1rem 0 0' }}>
                👤 {unit.tenant_name}
              </p>
            </div>

            {unit.tenant_phone && (
              <div style={{ display: 'flex', gap: '0.375rem' }}>
                <a
                  href={`https://wa.me/${cleanPhone(unit.tenant_phone)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-ghost btn-sm"
                  style={{ background: '#D1FAE5', color: '#059669', fontSize: '0.75rem', padding: '0.25rem 0.5rem', textDecoration: 'none' }}
                >
                  <MessageSquare size={13} /> WhatsApp
                </a>
                <a
                  href={`tel:${unit.tenant_phone}`}
                  className="btn btn-ghost btn-sm"
                  style={{ background: '#D1FAE5', color: '#059669', fontSize: '0.75rem', padding: '0.25rem 0.5rem', textDecoration: 'none' }}
                >
                  <Phone size={13} /> Call
                </a>
              </div>
            )}
          </div>
        )}

        {/* Unit Number & Floor */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div className="form-group">
            <label className="input-label" style={{ fontWeight: 700, fontSize: '0.8125rem' }}>
              Flat / Unit No. *
            </label>
            <input
              type="text"
              className="input"
              required
              value={unitNumber}
              onChange={(e) => setUnitNumber(e.target.value)}
              placeholder="e.g. 102"
            />
          </div>

          <div className="form-group">
            <label className="input-label" style={{ fontWeight: 700, fontSize: '0.8125rem' }}>
              Floor Number *
            </label>
            <input
              type="number"
              className="input"
              required
              min={0}
              max={100}
              value={floorNumber}
              onChange={(e) => setFloorNumber(e.target.value)}
            />
          </div>
        </div>

        {/* Layout / Configuration Selector Pills */}
        <div>
          <label className="input-label" style={{ fontWeight: 700, fontSize: '0.8125rem', marginBottom: '0.35rem', display: 'block' }}>
            Unit Layout / Configuration *
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
            {UNIT_TYPES.map((type) => {
              const isSelected = unitType === type
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setUnitType(type)}
                  style={{
                    padding: '0.3rem 0.65rem',
                    borderRadius: '0.375rem',
                    fontSize: '0.75rem',
                    fontWeight: isSelected ? 800 : 500,
                    border: isSelected ? '1.5px solid #2563EB' : '1px solid #E2E8F0',
                    background: isSelected ? '#EFF6FF' : '#F8FAFC',
                    color: isSelected ? '#1D4ED8' : '#334155',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {type}
                </button>
              )
            })}
          </div>
        </div>

        {/* Financial Section with Quick Multipliers */}
        <div style={{ background: '#F8FAFC', padding: '0.875rem', borderRadius: '0.625rem', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div className="form-group">
              <label className="input-label" style={{ fontWeight: 700, fontSize: '0.8125rem' }}>
                Monthly Rent (₹) *
              </label>
              <input
                type="number"
                className="input"
                required
                value={monthlyRent}
                onChange={(e) => {
                  const val = e.target.value
                  setMonthlyRent(val)
                }}
                placeholder="e.g. 16000"
              />
            </div>

            <div className="form-group">
              <label className="input-label" style={{ fontWeight: 700, fontSize: '0.8125rem' }}>
                Security Deposit (₹)
              </label>
              <input
                type="number"
                className="input"
                value={securityDeposit}
                onChange={(e) => setSecurityDeposit(e.target.value)}
                placeholder="e.g. 32000"
              />
            </div>
          </div>

          {/* Quick Deposit Multipliers */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.6875rem' }}>
            <span style={{ color: '#64748B', fontWeight: 600 }}>Deposit Multiplier:</span>
            {[
              { label: '1x Rent', mul: 1 },
              { label: '2x Rent', mul: 2 },
              { label: '3x Rent', mul: 3 },
              { label: '6x Rent', mul: 6 },
            ].map((d) => (
              <button
                key={d.label}
                type="button"
                onClick={() => {
                  if (monthlyRent) {
                    setSecurityDeposit(String(parseFloat(monthlyRent) * d.mul))
                  }
                }}
                style={{
                  padding: '0.15rem 0.45rem',
                  borderRadius: '0.25rem',
                  fontSize: '0.6875rem',
                  background: '#FFFFFF',
                  border: '1px solid #CBD5E1',
                  color: '#334155',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Maintenance Surcharge & Area */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div className="form-group">
            <label className="input-label" style={{ fontWeight: 700, fontSize: '0.8125rem' }}>
              Maintenance / Month (₹)
            </label>
            <input
              type="number"
              className="input"
              value={maintenanceCharge}
              onChange={(e) => setMaintenanceCharge(e.target.value)}
              placeholder="0"
            />
          </div>

          <div className="form-group">
            <label className="input-label" style={{ fontWeight: 700, fontSize: '0.8125rem' }}>
              Carpet Area (Sq. Ft.)
            </label>
            <input
              type="number"
              className="input"
              value={areaSqft}
              onChange={(e) => setAreaSqft(e.target.value)}
              placeholder="e.g. 1150"
            />
          </div>
        </div>

        {/* Furnishing Status */}
        <div>
          <label className="input-label" style={{ fontWeight: 700, fontSize: '0.8125rem', marginBottom: '0.35rem', display: 'block' }}>
            Furnishing Status
          </label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {['Unfurnished', 'Semi-Furnished', 'Fully Furnished'].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFurnishing(f)}
                style={{
                  flex: 1,
                  padding: '0.35rem 0.5rem',
                  borderRadius: '0.375rem',
                  fontSize: '0.75rem',
                  fontWeight: furnishing === f ? 700 : 500,
                  border: furnishing === f ? '1.5px solid #059669' : '1px solid #E2E8F0',
                  background: furnishing === f ? '#ECFDF5' : '#FFFFFF',
                  color: furnishing === f ? '#065F46' : '#475569',
                  cursor: 'pointer',
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Delete Confirmation Box */}
        {showDeleteConfirm ? (
          <div
            style={{
              padding: '0.75rem',
              borderRadius: '0.5rem',
              background: '#FFF1F2',
              border: '1px solid #FECDD3',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#E11D48', fontWeight: 700, fontSize: '0.8125rem' }}>
              <AlertTriangle size={16} />
              <span>Confirm deleting Flat {unit.unit_number}?</span>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#9F1239', margin: 0 }}>
              This will permanently remove this flat and its history. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
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
                style={{ fontWeight: 800 }}
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete Flat'}
              </button>
            </div>
          </div>
        ) : null}

        {/* Action Buttons Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '0.5rem',
            borderTop: '1px solid #F1F5F9',
            paddingTop: '0.75rem',
          }}
        >
          <div>
            {!showDeleteConfirm && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={unit.status === 'occupied'}
                style={{
                  background: 'none',
                  border: 'none',
                  color: unit.status === 'occupied' ? '#94A3B8' : '#E11D48',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: unit.status === 'occupied' ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}
                title={unit.status === 'occupied' ? 'Cannot delete occupied flat' : 'Delete this flat'}
              >
                <Trash2 size={14} />
                <span>Delete Flat</span>
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
              style={{
                fontWeight: 800,
                padding: '0.5rem 1.25rem',
                background: '#0F172A',
                borderColor: '#0F172A',
                gap: '0.375rem',
              }}
            >
              <Save size={15} />
              <span>{isSubmitting ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
