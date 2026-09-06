import React, { useState, useEffect } from 'react'
import { expenseApi, propertyApi, unitApi } from '../../api/client'
import { Expense, Property, Unit } from '../../types'
import { MobilePage } from '../../components/layout/AppShell'
import { MobileHeader } from '../../components/navigation'
import { formatCurrency, formatDate, EmptyState, SkeletonCard, Modal } from '../../components/ui'
import { TrendingDown, Plus, Trash2, Calendar, Tag, Building2 } from 'lucide-react'
import { useToast } from '../../contexts/ToastContext'
import { AxiosError } from 'axios'

const EXPENSE_CATEGORIES = [
  { key: 'maintenance', label: 'Maintenance & Repairs', icon: '🔧' },
  { key: 'utility', label: 'Electricity / Water Bills', icon: '💡' },
  { key: 'cleaning', label: 'Cleaning & Waste Mgmt', icon: '🧹' },
  { key: 'security', label: 'Security & Watchman', icon: '🛡️' },
  { key: 'tax', label: 'Property Tax / Municipal', icon: '🏛️' },
  { key: 'insurance', label: 'Building Insurance', icon: '📄' },
  { key: 'salary', label: 'Staff Salary / Wages', icon: '💼' },
  { key: 'other', label: 'General / Miscellaneous', icon: '📦' },
]

export default function ExpensesPage() {
  const { success, error: showError } = useToast()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [totalAmount, setTotalAmount] = useState(0)
  const [showAddModal, setShowAddModal] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const load = () => {
    setIsLoading(true)
    expenseApi.list({}).then((res) => {
      setExpenses(res.data.data || [])
      setTotalAmount(res.data.total_amount || 0)
    }).catch(() => {}).finally(() => setIsLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!window.confirm('Are you sure you want to delete this expense record?')) return
    setDeletingId(id)
    try {
      await expenseApi.delete(id)
      success('Expense deleted successfully')
      setExpenses((prev) => prev.filter((exp) => exp.id !== id))
      setTotalAmount((prev) => {
        const item = expenses.find((exp) => exp.id === id)
        return prev - (item?.amount || 0)
      })
    } catch {
      showError('Failed to delete expense')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <MobilePage
      role="owner"
      header={
        <MobileHeader
          title="Property Expenses"
          showBack
          rightAction={
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setShowAddModal(true)}
              style={{ gap: '0.25rem' }}
            >
              <Plus size={16} /> Add
            </button>
          }
        />
      }
    >
      {/* Desktop Header Row */}
      <div className="hidden-mobile" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>
            Property Expenses
          </h1>
          <p style={{ fontSize: '0.8125rem', color: '#64748B', margin: '0.125rem 0 0' }}>
            Track utility bills, repairs, staff salaries, and maintenance expenditures
          </p>
        </div>

        <button
          className="btn btn-primary btn-sm"
          onClick={() => setShowAddModal(true)}
          style={{ gap: '0.375rem' }}
        >
          <Plus size={15} /> Add Expense
        </button>
      </div>

      {!isLoading && expenses.length > 0 && (
        <div className="card" style={{ padding: '1rem', marginBottom: '1.25rem', background: '#FEF2F2', border: '1px solid #FECACA', borderLeft: '4px solid #EF4444' }}>
          <p style={{ fontSize: '0.75rem', color: '#991B1B', margin: '0 0 0.25rem', fontWeight: 700 }}>Total Expenditures Recorded</p>
          <p style={{ fontWeight: 800, fontSize: '1.75rem', margin: 0, color: '#B91C1C', fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(totalAmount)}</p>
        </div>
      )}

      {isLoading ? (
        Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
      ) : expenses.length === 0 ? (
        <EmptyState
          icon={<TrendingDown size={32} />}
          title="No expenses recorded"
          description="Track property expenses to get accurate profit and net income reports."
          action={
            <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
              <Plus size={18} /> Add First Expense
            </button>
          }
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {expenses.map((e) => {
            const cat = EXPENSE_CATEGORIES.find((c) => c.key === e.category)
            return (
              <div key={e.id} className="card card-hover" style={{ padding: '0.875rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0, flex: 1 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.125rem', flexShrink: 0 }}>
                    {cat?.icon || '📦'}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ fontWeight: 700, fontSize: '0.9375rem', margin: '0 0 0.125rem', color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {e.description}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: '#64748B', margin: 0, textTransform: 'capitalize' }}>
                      {cat?.label || e.category} • {formatDate(e.date)} {e.vendor ? `• Vendor: ${e.vendor}` : ''}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                  <p style={{ fontWeight: 800, fontSize: '0.9375rem', margin: 0, color: '#EF4444', fontVariantNumeric: 'tabular-nums' }}>
                    -{formatCurrency(e.amount)}
                  </p>
                  <button
                    onClick={(ev) => handleDelete(e.id, ev)}
                    disabled={deletingId === e.id}
                    className="btn btn-ghost btn-sm"
                    style={{ color: '#94A3B8', padding: '0.25rem 0.375rem' }}
                    title="Delete expense"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add Expense Modal */}
      <AddExpenseModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          setShowAddModal(false)
          load()
        }}
      />
    </MobilePage>
  )
}

function AddExpenseModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}) {
  const { success, error } = useToast()
  const [properties, setProperties] = useState<Property[]>([])
  const [selectedPropertyId, setSelectedPropertyId] = useState('')
  const [category, setCategory] = useState('maintenance')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [description, setDescription] = useState('')
  const [vendor, setVendor] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('upi')
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (isOpen) {
      propertyApi.list().then((res) => {
        const props = res.data.data || []
        setProperties(props)
        if (props.length > 0) {
          setSelectedPropertyId(props[0].id)
        }
      }).catch(() => {})
      setCategory('maintenance')
      setAmount('')
      setDescription('')
      setVendor('')
      setDate(new Date().toISOString().split('T')[0])
      setPaymentMethod('upi')
      setErrors({})
    }
  }, [isOpen])

  const validate = () => {
    const e: Record<string, string> = {}
    if (!selectedPropertyId) e.property = 'Please select a building'
    if (!amount || parseFloat(amount) <= 0) e.amount = 'Enter a valid expense amount'
    if (!description.trim()) e.description = 'Description is required'
    if (!date) e.date = 'Date is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setIsLoading(true)
    try {
      await expenseApi.create({
        property_id: selectedPropertyId,
        category,
        amount: parseFloat(amount),
        description: description.trim(),
        date,
        vendor: vendor.trim() || undefined,
        payment_method: paymentMethod,
      })
      success('Expense recorded successfully!')
      onSuccess()
    } catch (err) {
      const axiosErr = err as AxiosError<{ detail: string }>
      error(axiosErr.response?.data?.detail || 'Failed to record expense')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record New Expense" maxWidth="520px">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="input-label">Building / Property</label>
          <select
            className={`input ${errors.property ? 'input-error' : ''}`}
            value={selectedPropertyId}
            onChange={(e) => setSelectedPropertyId(e.target.value)}
          >
            {properties.map((p) => (
              <option key={p.id} value={p.id}>{p.name} ({p.city})</option>
            ))}
          </select>
          {errors.property && <p className="input-hint input-hint-error">{errors.property}</p>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div className="form-group">
            <label className="input-label">Expense Category</label>
            <select
              className="input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>{c.icon} {c.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="input-label">Amount (₹)</label>
            <input
              type="number"
              inputMode="decimal"
              className={`input ${errors.amount ? 'input-error' : ''}`}
              placeholder="e.g. 2500"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value)
                setErrors((p) => ({ ...p, amount: '' }))
              }}
            />
            {errors.amount && <p className="input-hint input-hint-error">{errors.amount}</p>}
          </div>
        </div>

        <div className="form-group">
          <label className="input-label">Description</label>
          <input
            type="text"
            className={`input ${errors.description ? 'input-error' : ''}`}
            placeholder="e.g. Water tank cleaning charges"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value)
              setErrors((p) => ({ ...p, description: '' }))
            }}
          />
          {errors.description && <p className="input-hint input-hint-error">{errors.description}</p>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div className="form-group">
            <label className="input-label">Date</label>
            <input
              type="date"
              className={`input ${errors.date ? 'input-error' : ''}`}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            {errors.date && <p className="input-hint input-hint-error">{errors.date}</p>}
          </div>

          <div className="form-group">
            <label className="input-label">Payment Mode</label>
            <select
              className="input"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option value="upi">📱 UPI</option>
              <option value="cash">💵 Cash</option>
              <option value="bank_transfer">🏦 Bank Transfer / NEFT</option>
              <option value="card">💳 Card</option>
              <option value="cheque">📝 Cheque</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="input-label">Vendor / Paid To (optional)</label>
          <input
            type="text"
            className="input"
            placeholder="e.g. Metro Plumbers Ltd."
            value={vendor}
            onChange={(e) => setVendor(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.25rem', borderTop: '1px solid #F1F5F9', paddingTop: '1rem' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={isLoading} style={{ gap: '0.375rem' }}>
            <Plus size={15} />
            {isLoading ? 'Saving...' : 'Record Expense'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
