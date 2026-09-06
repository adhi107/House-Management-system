import React, { useState, useEffect, useMemo } from 'react'
import { expenseApi, propertyApi, documentApi } from '../../api/client'
import { Expense, Property } from '../../types'
import { MobilePage } from '../../components/layout/AppShell'
import { MobileHeader } from '../../components/navigation'
import { formatCurrency, formatDate, EmptyState, SkeletonCard, Modal } from '../../components/ui'
import {
  TrendingDown,
  Plus,
  Trash2,
  Calendar,
  Tag,
  Building2,
  Download,
  Search,
  Filter,
  Receipt,
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  DollarSign,
  ShieldAlert,
  Percent,
} from 'lucide-react'
import { useToast } from '../../contexts/ToastContext'
import { AxiosError } from 'axios'

const EXPENSE_CATEGORIES = [
  { key: 'all', label: 'All Expenses', icon: '📊' },
  { key: 'maintenance', label: 'Maintenance & Repairs', icon: '🔧', color: '#EF4444' },
  { key: 'utility', label: 'Electricity & Water', icon: '💡', color: '#F59E0B' },
  { key: 'cleaning', label: 'Cleaning & Waste', icon: '🧹', color: '#10B981' },
  { key: 'security', label: 'Security & Watchman', icon: '🛡️', color: '#3B82F6' },
  { key: 'tax', label: 'Property Tax & Legal', icon: '🏛️', color: '#8B5CF6' },
  { key: 'insurance', label: 'Building Insurance', icon: '📄', color: '#06B6D4' },
  { key: 'salary', label: 'Staff Salary & Wages', icon: '💼', color: '#EC4899' },
  { key: 'other', label: 'General / Misc', icon: '📦', color: '#64748B' },
]

export default function ExpensesPage() {
  const { success, error: showError } = useToast()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [totalAmount, setTotalAmount] = useState(0)
  const [showAddModal, setShowAddModal] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  
  // Filters & Search
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedPropertyId, setSelectedPropertyId] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const load = async () => {
    setIsLoading(true)
    try {
      const [expRes, propRes] = await Promise.all([
        expenseApi.list({}),
        propertyApi.list(),
      ])
      setExpenses(expRes.data.data || [])
      setTotalAmount(expRes.data.total_amount || 0)
      setProperties(propRes.data.data || [])
    } catch {
      showError('Failed to load expenses data')
    } finally {
      setIsLoading(false)
    }
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

  // Filtered expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      if (selectedCategory !== 'all' && e.category !== selectedCategory) return false
      if (selectedPropertyId !== 'all' && e.property_id !== selectedPropertyId) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchDesc = e.description?.toLowerCase().includes(q)
        const matchVendor = e.vendor?.toLowerCase().includes(q)
        const matchProp = e.property_name?.toLowerCase().includes(q)
        if (!matchDesc && !matchVendor && !matchProp) return false
      }
      return true
    })
  }, [expenses, selectedCategory, selectedPropertyId, searchQuery])

  // BI Metrics
  const biMetrics = useMemo(() => {
    const total = expenses.reduce((acc, curr) => acc + (curr.amount || 0), 0)
    const categoryTotals: Record<string, number> = {}
    expenses.forEach((e) => {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount
    })

    let topCategory = 'None'
    let topCategoryAmount = 0
    Object.entries(categoryTotals).forEach(([cat, amt]) => {
      if (amt > topCategoryAmount) {
        topCategoryAmount = amt
        topCategory = cat
      }
    })

    const topCategoryPercent = total > 0 ? Math.round((topCategoryAmount / total) * 100) : 0
    const catLabel = EXPENSE_CATEGORIES.find((c) => c.key === topCategory)?.label || topCategory

    return {
      total,
      count: expenses.length,
      topCategory: catLabel,
      topCategoryPercent,
      avgExpense: expenses.length > 0 ? Math.round(total / expenses.length) : 0,
    }
  }, [expenses])

  // CSV Export for Accountants / Tax
  const exportCSV = () => {
    if (filteredExpenses.length === 0) return
    const headers = ['Date', 'Category', 'Description', 'Property', 'Vendor', 'Payment Method', 'Amount (INR)']
    const rows = filteredExpenses.map((e) => [
      e.date,
      e.category,
      `"${e.description.replace(/"/g, '""')}"`,
      `"${(e.property_name || '').replace(/"/g, '""')}"`,
      `"${(e.vendor || '').replace(/"/g, '""')}"`,
      e.payment_method || 'N/A',
      e.amount,
    ])
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `Property_Expenses_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    success('Expense report exported as CSV!')
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
            Property Expenses & Outflows
          </h1>
          <p style={{ fontSize: '0.8125rem', color: '#64748B', margin: '0.125rem 0 0' }}>
            Real-time OPEX tracking, vendor disbursements, utility bills, and tax-deductible items
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.625rem' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={exportCSV}
            disabled={filteredExpenses.length === 0}
            style={{ gap: '0.375rem', fontWeight: 600 }}
          >
            <Download size={15} /> Export CSV
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setShowAddModal(true)}
            style={{ gap: '0.375rem', fontWeight: 700 }}
          >
            <Plus size={15} /> Add Expense
          </button>
        </div>
      </div>

      {/* BI KPI SUMMARY CARDS */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '0.875rem',
          marginBottom: '1.25rem',
        }}
      >
        <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #EF4444', background: '#FFFFFF' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Total OPEX Recorded</span>
            <TrendingDown size={16} color="#EF4444" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0F172A', fontVariantNumeric: 'tabular-nums' }}>
            {formatCurrency(biMetrics.total)}
          </div>
          <p style={{ fontSize: '0.6875rem', color: '#64748B', margin: '0.15rem 0 0' }}>
            Across {biMetrics.count} recorded transactions
          </p>
        </div>

        <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #F59E0B', background: '#FFFFFF' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Highest Spend Category</span>
            <Percent size={16} color="#F59E0B" />
          </div>
          <div style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {biMetrics.topCategory}
          </div>
          <p style={{ fontSize: '0.6875rem', color: '#D97706', margin: '0.15rem 0 0', fontWeight: 600 }}>
            {biMetrics.topCategoryPercent}% of total expenditure
          </p>
        </div>

        <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #3B82F6', background: '#FFFFFF' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Average Ticket Size</span>
            <DollarSign size={16} color="#3B82F6" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0F172A', fontVariantNumeric: 'tabular-nums' }}>
            {formatCurrency(biMetrics.avgExpense)}
          </div>
          <p style={{ fontSize: '0.6875rem', color: '#64748B', margin: '0.15rem 0 0' }}>
            Average per expense record
          </p>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="card" style={{ padding: '0.875rem', marginBottom: '1rem', background: '#FFFFFF' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', flex: '1 1 220px' }}>
            <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              className="input"
              style={{ paddingLeft: '2rem', height: 36, fontSize: '0.8125rem' }}
              placeholder="Search by vendor, description, or property..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Property Dropdown Filter */}
          <div style={{ minWidth: 180 }}>
            <select
              className="input"
              style={{ height: 36, fontSize: '0.8125rem' }}
              value={selectedPropertyId}
              onChange={(e) => setSelectedPropertyId(e.target.value)}
            >
              <option value="all">🏢 All Properties</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div
          style={{
            display: 'flex',
            gap: '0.375rem',
            overflowX: 'auto',
            paddingTop: '0.75rem',
            marginTop: '0.75rem',
            borderTop: '1px solid #F1F5F9',
          }}
        >
          {EXPENSE_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.key
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setSelectedCategory(cat.key)}
                style={{
                  padding: '0.3rem 0.65rem',
                  borderRadius: '2rem',
                  fontSize: '0.75rem',
                  fontWeight: isSelected ? 700 : 500,
                  whiteSpace: 'nowrap',
                  border: isSelected ? '1px solid #2563EB' : '1px solid #E2E8F0',
                  background: isSelected ? '#EFF6FF' : '#F8FAFC',
                  color: isSelected ? '#1D4ED8' : '#475569',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                }}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* EXPENSE LIST */}
      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '0.75rem' }}>
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filteredExpenses.length === 0 ? (
        <EmptyState
          icon={<TrendingDown size={32} />}
          title="No expenses match your filter"
          description="Adjust your search criteria or record a new property expense."
          action={
            <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
              <Plus size={18} /> Record New Expense
            </button>
          }
        />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '0.75rem',
          }}
        >
          {filteredExpenses.map((e) => {
            const cat = EXPENSE_CATEGORIES.find((c) => c.key === e.category)
            return (
              <div
                key={e.id}
                className="card card-hover"
                style={{
                  padding: '0.875rem 1rem',
                  borderRadius: '0.75rem',
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: '0.5rem',
                          background: '#F1F5F9',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1rem',
                          flexShrink: 0,
                        }}
                      >
                        {cat?.icon || '📦'}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <h4
                          style={{
                            fontWeight: 800,
                            fontSize: '0.875rem',
                            margin: 0,
                            color: '#0F172A',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {e.description}
                        </h4>
                        <span style={{ fontSize: '0.6875rem', color: '#64748B' }}>
                          {formatDate(e.date)}
                        </span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span
                        style={{
                          fontWeight: 900,
                          fontSize: '1.0625rem',
                          color: '#DC2626',
                          fontVariantNumeric: 'tabular-nums',
                          display: 'block',
                        }}
                      >
                        -{formatCurrency(e.amount)}
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '0.35rem',
                      fontSize: '0.6875rem',
                      marginBottom: '0.5rem',
                    }}
                  >
                    <span
                      style={{
                        background: '#EFF6FF',
                        color: '#1D4ED8',
                        padding: '0.1rem 0.4rem',
                        borderRadius: '0.25rem',
                        fontWeight: 600,
                      }}
                    >
                      {cat?.label || e.category}
                    </span>
                    {e.property_name && (
                      <span style={{ background: '#F1F5F9', color: '#475569', padding: '0.1rem 0.4rem', borderRadius: '0.25rem' }}>
                        🏢 {e.property_name}
                      </span>
                    )}
                    {e.vendor && (
                      <span style={{ background: '#F8FAFC', color: '#64748B', padding: '0.1rem 0.4rem', borderRadius: '0.25rem', border: '1px solid #E2E8F0' }}>
                        👤 {e.vendor}
                      </span>
                    )}
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderTop: '1px solid #F1F5F9',
                    paddingTop: '0.5rem',
                    marginTop: '0.25rem',
                  }}
                >
                  <span style={{ fontSize: '0.6875rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>
                    💳 {e.payment_method?.toUpperCase() || 'UPI'}
                  </span>

                  <button
                    onClick={(ev) => handleDelete(e.id, ev)}
                    disabled={deletingId === e.id}
                    className="btn btn-ghost btn-sm"
                    style={{ color: '#94A3B8', padding: '0.2rem 0.4rem', height: 'auto' }}
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
  const [isTaxDeductible, setIsTaxDeductible] = useState(true)
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
      setIsTaxDeductible(true)
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
          <label className="input-label">Building / Property *</label>
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
            <label className="input-label">Category *</label>
            <select
              className="input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {EXPENSE_CATEGORIES.filter((c) => c.key !== 'all').map((c) => (
                <option key={c.key} value={c.key}>{c.icon} {c.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="input-label">Amount (₹) *</label>
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
          <label className="input-label">Description *</label>
          <input
            type="text"
            className={`input ${errors.description ? 'input-error' : ''}`}
            placeholder="e.g. Water tank cleaning & plumbing repairs"
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
            <label className="input-label">Disbursement Date *</label>
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
              <option value="upi">📱 UPI / GPay / PhonePe</option>
              <option value="cash">💵 Cash Out</option>
              <option value="bank_transfer">🏦 Bank Transfer / NEFT</option>
              <option value="card">💳 Company Debit Card</option>
              <option value="cheque">📝 Cheque</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="input-label">Vendor / Payee (optional)</label>
          <input
            type="text"
            className="input"
            placeholder="e.g. Royal Facility Services"
            value={vendor}
            onChange={(e) => setVendor(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.25rem', borderTop: '1px solid #F1F5F9', paddingTop: '1rem' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={isLoading} style={{ gap: '0.375rem', fontWeight: 700 }}>
            <Plus size={15} />
            {isLoading ? 'Saving...' : 'Record Expense'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
