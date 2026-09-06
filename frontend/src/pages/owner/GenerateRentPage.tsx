import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Zap,
  Building2,
  Calendar,
  DollarSign,
  Bell,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Users,
  Info,
  User,
  Search,
  Check,
  Calculator,
  Share2,
  FileText,
  Clock,
  Plus,
  Minus,
  RefreshCw,
} from 'lucide-react'
import { rentApi, propertyApi, unitApi, tenantApi } from '../../api/client'
import { Property, Unit, Tenant } from '../../types'
import { MobilePage } from '../../components/layout/AppShell'
import { MobileHeader } from '../../components/navigation'
import { useToast } from '../../contexts/ToastContext'
import { formatCurrency } from '../../components/ui'
import { AxiosError } from 'axios'

export default function GenerateRentPage() {
  const navigate = useNavigate()
  const { success, error, info } = useToast()

  const now = new Date()
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  // Mode Selection: 'batch' | 'person' | 'checklist'
  const [activeTab, setActiveTab] = useState<'batch' | 'person' | 'checklist'>('batch')

  // Common State
  const [billingMonth, setBillingMonth] = useState(defaultMonth)
  const [properties, setProperties] = useState<Property[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [tenants, setTenants] = useState<any[]>([])
  const [existingInvoices, setExistingInvoices] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingData, setIsFetchingData] = useState(true)

  // Batch Mode State
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('')
  const [dueDay, setDueDay] = useState<number>(5)
  const [utilitySurcharge, setUtilitySurcharge] = useState<string>('0')
  const [notifyTenants, setNotifyTenants] = useState<boolean>(true)
  const [customNotes, setCustomNotes] = useState<string>('')

  // Person-Wise Mode State
  const [selectedTenantId, setSelectedTenantId] = useState<string>('')
  const [personRent, setPersonRent] = useState<string>('0')
  const [personMaintenance, setPersonMaintenance] = useState<string>('0')
  const [personUtility, setPersonUtility] = useState<string>('0')
  const [personOtherCharges, setPersonOtherCharges] = useState<string>('0')
  const [personDiscount, setPersonDiscount] = useState<string>('0')
  const [personDueDate, setPersonDueDate] = useState<string>(`${defaultMonth}-05`)
  const [personNotes, setPersonNotes] = useState<string>('')
  const [tenantSearchQuery, setTenantSearchQuery] = useState<string>('')

  // Meter Reading Calculator for Person Mode
  const [showMeterCalc, setShowMeterCalc] = useState<boolean>(false)
  const [prevMeter, setPrevMeter] = useState<string>('0')
  const [currMeter, setCurrMeter] = useState<string>('0')
  const [ratePerUnit, setRatePerUnit] = useState<string>('8')

  // Checklist Mode State
  const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>([])
  const [checklistSearch, setChecklistSearch] = useState<string>('')

  // Fetch initial data
  const fetchData = async () => {
    setIsFetchingData(true)
    try {
      const [propRes, unitRes, tenantRes, invoiceRes] = await Promise.all([
        propertyApi.list(),
        unitApi.list(),
        tenantApi.list({ per_page: 100 }),
        rentApi.listInvoices({ billing_month: billingMonth }),
      ])
      setProperties(propRes.data.data || [])
      setUnits(unitRes.data.data || [])
      setTenants(tenantRes.data.data || [])
      setExistingInvoices(invoiceRes.data.data || [])
    } catch {
      error('Failed to load data for rent generation')
    } finally {
      setIsFetchingData(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [billingMonth])

  // Map of unit_id -> existing invoice
  const existingInvoicesMap = useMemo(() => {
    const map = new Map<string, any>()
    existingInvoices.forEach((inv) => {
      if (inv.unit_id) map.set(inv.unit_id, inv)
    })
    return map
  }, [existingInvoices])

  // Filter occupied units based on selected property
  const relevantUnits = useMemo(() => {
    return units.filter((u) => {
      if (selectedPropertyId && u.property_id !== selectedPropertyId) return false
      return u.status === 'occupied'
    })
  }, [units, selectedPropertyId])

  // Occupied tenants list with unit info
  const occupiedTenants = useMemo(() => {
    return tenants.filter((t) => t.unit_id)
  }, [tenants])

  // When selectedTenantId changes in Person Mode, pre-fill values
  useEffect(() => {
    if (!selectedTenantId) {
      if (occupiedTenants.length > 0) {
        setSelectedTenantId(occupiedTenants[0].id)
      }
      return
    }

    const tenant = occupiedTenants.find((t) => t.id === selectedTenantId)
    if (tenant) {
      const unit = units.find((u) => u.id === tenant.unit_id)
      setPersonRent(String(tenant.monthly_rent || unit?.monthly_rent || 0))
      setPersonMaintenance(String(tenant.maintenance_charge || unit?.maintenance_charge || 0))
      setPersonDueDate(`${billingMonth}-${String(tenant.rent_due_day || 5).padStart(2, '0')}`)
    }
  }, [selectedTenantId, occupiedTenants, units, billingMonth])

  // Meter Calculator Effect
  useEffect(() => {
    const prev = parseFloat(prevMeter) || 0
    const curr = parseFloat(currMeter) || 0
    const rate = parseFloat(ratePerUnit) || 0
    if (curr >= prev && rate > 0) {
      const unitsConsumed = curr - prev
      const totalUtility = unitsConsumed * rate
      setPersonUtility(String(totalUtility))
    }
  }, [prevMeter, currMeter, ratePerUnit])

  // Batch Calculations
  const estimatedBaseRent = relevantUnits.reduce((sum, u) => sum + (u.monthly_rent || 0), 0)
  const estimatedMaintenance = relevantUnits.reduce((sum, u) => sum + (u.maintenance_charge || 0), 0)
  const extraUtility = parseFloat(utilitySurcharge) || 0
  const totalEstimatedUtility = extraUtility * relevantUnits.length
  const grandEstimatedTotal = estimatedBaseRent + estimatedMaintenance + totalEstimatedUtility

  // Person-Wise Calculations
  const personRentNum = parseFloat(personRent) || 0
  const personMaintNum = parseFloat(personMaintenance) || 0
  const personUtilityNum = parseFloat(personUtility) || 0
  const personOtherNum = parseFloat(personOtherCharges) || 0
  const personDiscountNum = parseFloat(personDiscount) || 0
  const personGrandTotal = Math.max(0, personRentNum + personMaintNum + personUtilityNum + personOtherNum - personDiscountNum)

  const selectedTenantObj = occupiedTenants.find((t) => t.id === selectedTenantId)
  const selectedTenantUnit = units.find((u) => u.id === selectedTenantObj?.unit_id)
  const selectedTenantProperty = properties.find((p) => p.id === selectedTenantObj?.property_id)
  const isSelectedTenantAlreadyInvoiced = selectedTenantObj ? existingInvoicesMap.has(selectedTenantObj.unit_id) : false

  // Handle Batch Generation
  const handleBatchGenerate = async () => {
    if (!billingMonth) {
      error('Please select a billing month')
      return
    }

    setIsLoading(true)
    try {
      const res = await rentApi.generateMonthly({
        billing_month: billingMonth,
        property_id: selectedPropertyId || undefined,
        due_day: Number(dueDay) || 5,
        utility_surcharge: extraUtility,
        notify_tenants: notifyTenants,
        notes: customNotes.trim() || undefined,
      })

      const created = res.data.data.created
      const skipped = res.data.data.skipped

      if (created > 0) {
        success(`🎉 Successfully generated ${created} rent invoice${created > 1 ? 's' : ''}! (${skipped} skipped as already existing)`)
      } else {
        info(`All ${skipped} invoices for this billing cycle are already up to date!`)
      }
      navigate('/owner/rent')
    } catch (err: any) {
      error(err?.response?.data?.detail || 'Failed to generate monthly rent invoices')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle Person-Wise Generation
  const handlePersonGenerate = async () => {
    if (!selectedTenantObj || !selectedTenantUnit) {
      error('Please select a resident to generate invoice for')
      return
    }

    setIsLoading(true)
    try {
      await rentApi.createInvoice({
        tenant_id: selectedTenantObj.id,
        unit_id: selectedTenantUnit.id,
        property_id: selectedTenantProperty?.id || selectedTenantUnit.property_id,
        billing_month: billingMonth,
        rent_amount: personRentNum,
        maintenance_amount: personMaintNum,
        utility_amount: personUtilityNum,
        other_charges: personOtherNum,
        discount: personDiscountNum,
        due_date: personDueDate,
        notes: personNotes.trim() || undefined,
      })

      success(`🎉 Rent invoice created for ${selectedTenantObj.full_name} (${selectedTenantUnit.unit_number})!`)
      navigate('/owner/rent')
    } catch (err) {
      const axiosErr = err as AxiosError<{ detail: string }>
      error(axiosErr.response?.data?.detail || 'Failed to create rent invoice for this tenant')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle Checklist Multi-Select Generation
  const handleChecklistGenerate = async () => {
    if (selectedUnitIds.length === 0) {
      error('Please select at least one resident to generate rent')
      return
    }

    setIsLoading(true)
    try {
      const res = await rentApi.generateMonthly({
        billing_month: billingMonth,
        unit_ids: selectedUnitIds,
        due_day: Number(dueDay) || 5,
        utility_surcharge: extraUtility,
        notify_tenants: notifyTenants,
        notes: customNotes.trim() || undefined,
      })

      const created = res.data.data.created
      const skipped = res.data.data.skipped
      success(`🎉 Generated ${created} invoice${created > 1 ? 's' : ''} for selected residents!`)
      navigate('/owner/rent')
    } catch (err: any) {
      error(err?.response?.data?.detail || 'Failed to generate invoices for selected units')
    } finally {
      setIsLoading(false)
    }
  }

  // Quick preset months
  const setNextMonth = () => {
    const d = new Date()
    d.setMonth(d.getMonth() + 1)
    setBillingMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  const setThisMonth = () => {
    setBillingMonth(defaultMonth)
  }

  // Open WhatsApp with invoice summary
  const shareViaWhatsApp = () => {
    if (!selectedTenantObj) return
    const text = encodeURIComponent(
      `Hello ${selectedTenantObj.full_name},\n\nYour rent invoice for ${billingMonth} (Unit ${selectedTenantUnit?.unit_number || ''}) has been generated.\n\n• Base Rent: ₹${personRentNum.toLocaleString('en-IN')}\n• Maintenance: ₹${personMaintNum.toLocaleString('en-IN')}\n• Utilities/Electricity: ₹${personUtilityNum.toLocaleString('en-IN')}\n• Total Due: ₹${personGrandTotal.toLocaleString('en-IN')}\n• Due Date: ${personDueDate}\n\nPlease pay on or before the due date via the Resident Portal or UPI.\nThank you!`
    )
    window.open(`https://wa.me/${selectedTenantObj.phone?.replace(/\D/g, '')}?text=${text}`, '_blank')
  }

  // Filtered tenants for person search
  const filteredOccupiedTenants = occupiedTenants.filter((t) => {
    if (!tenantSearchQuery) return true
    const q = tenantSearchQuery.toLowerCase()
    return (
      t.full_name?.toLowerCase().includes(q) ||
      t.phone?.includes(q) ||
      t.unit_number?.toLowerCase().includes(q) ||
      t.property_name?.toLowerCase().includes(q)
    )
  })

  // Filtered units for checklist
  const filteredChecklistUnits = relevantUnits.filter((u) => {
    if (!checklistSearch) return true
    const q = checklistSearch.toLowerCase()
    const tenant = occupiedTenants.find((t) => t.unit_id === u.id)
    return (
      u.unit_number.toLowerCase().includes(q) ||
      tenant?.full_name?.toLowerCase().includes(q) ||
      tenant?.phone?.includes(q)
    )
  })

  const unbilledUnitsCount = relevantUnits.filter((u) => !existingInvoicesMap.has(u.id)).length

  return (
    <MobilePage
      role="owner"
      header={<MobileHeader title="Generate Rent" showBack onBack={() => navigate('/owner/rent')} />}
      showBottomNav={false}
    >
      <div style={{ maxWidth: 740, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingBottom: '3rem' }}>
        
        {/* Header Hero Banner */}
        <div
          style={{
            padding: '1.5rem',
            borderRadius: '1.125rem',
            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #1E3A8A 100%)',
            color: '#FFFFFF',
            boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.3)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  backgroundColor: 'rgba(59, 130, 246, 0.25)',
                  color: '#93C5FD',
                  padding: '0.25rem 0.625rem',
                  borderRadius: '9999px',
                  border: '1px solid rgba(147, 197, 253, 0.3)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <Zap size={13} /> INVOICING ENGINE
              </span>
              <span style={{ fontSize: '0.75rem', color: '#93C5FD', fontWeight: 700 }}>
                Cycle: {billingMonth}
              </span>
            </div>
            <h1 style={{ fontWeight: 900, fontSize: '1.375rem', margin: '0 0 0.25rem', color: '#FFFFFF' }}>
              Rent Invoice Dispatch Center
            </h1>
            <p style={{ fontSize: '0.8125rem', color: '#94A3B8', margin: 0, lineHeight: 1.4 }}>
              Generate invoices in bulk across buildings, customize person-wise with meter readings, or multi-select specific flats.
            </p>
          </div>
        </div>

        {/* Mode Selector Segmented Tabs */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0.5rem',
            padding: '0.375rem',
            borderRadius: '0.875rem',
            background: '#F1F5F9',
            border: '1px solid #E2E8F0',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('batch')}
            style={{
              padding: '0.625rem 0.5rem',
              borderRadius: '0.625rem',
              border: 'none',
              background: activeTab === 'batch' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'batch' ? '#1D4ED8' : '#64748B',
              fontWeight: 800,
              fontSize: '0.8125rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.375rem',
              boxShadow: activeTab === 'batch' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <Zap size={16} /> <span>Batch All</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('person')}
            style={{
              padding: '0.625rem 0.5rem',
              borderRadius: '0.625rem',
              border: 'none',
              background: activeTab === 'person' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'person' ? '#1D4ED8' : '#64748B',
              fontWeight: 800,
              fontSize: '0.8125rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.375rem',
              boxShadow: activeTab === 'person' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <User size={16} /> <span>Person-Wise</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('checklist')}
            style={{
              padding: '0.625rem 0.5rem',
              borderRadius: '0.625rem',
              border: 'none',
              background: activeTab === 'checklist' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'checklist' ? '#1D4ED8' : '#64748B',
              fontWeight: 800,
              fontSize: '0.8125rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.375rem',
              boxShadow: activeTab === 'checklist' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <Users size={16} /> <span>Select Flats</span>
          </button>
        </div>

        {/* Billing Month Bar */}
        <div
          className="card"
          style={{
            padding: '1rem 1.25rem',
            borderRadius: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Calendar size={18} color="#2563EB" />
            <div>
              <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', display: 'block' }}>
                Billing Cycle
              </span>
              <input
                type="month"
                className="input"
                style={{ height: 36, fontSize: '0.875rem', fontWeight: 700, padding: '0.25rem 0.625rem', width: 170 }}
                value={billingMonth}
                onChange={(e) => setBillingMonth(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={setThisMonth}
              style={{ fontSize: '0.75rem', fontWeight: 700 }}
            >
              This Month
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={setNextMonth}
              style={{ fontSize: '0.75rem', fontWeight: 700 }}
            >
              Next Month
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={fetchData}
              title="Refresh invoice state"
              style={{ border: '1px solid #E2E8F0', padding: '0.35rem 0.5rem' }}
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* TAB 1: BATCH INVOICING MODE */}
        {/* ======================================================== */}
        {activeTab === 'batch' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Live Calculation Preview */}
            <div
              className="card"
              style={{
                padding: '1.25rem',
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '1rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem', paddingBottom: '0.75rem', borderBottom: '1px solid #F1F5F9' }}>
                <h2 style={{ fontSize: '0.9375rem', fontWeight: 800, margin: 0, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Sparkles size={16} color="#2563EB" /> Batch Estimation Preview
                </h2>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#059669', background: '#ECFDF5', padding: '0.2rem 0.5rem', borderRadius: '999px' }}>
                  {relevantUnits.length} Occupied Units
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', textAlign: 'center' }}>
                <div style={{ background: '#F8FAFC', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #F1F5F9' }}>
                  <p style={{ fontSize: '0.6875rem', color: '#64748B', margin: '0 0 0.25rem', fontWeight: 600 }}>Base Rent Sum</p>
                  <p style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>
                    {formatCurrency(estimatedBaseRent)}
                  </p>
                </div>
                <div style={{ background: '#F8FAFC', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #F1F5F9' }}>
                  <p style={{ fontSize: '0.6875rem', color: '#64748B', margin: '0 0 0.25rem', fontWeight: 600 }}>Maintenance</p>
                  <p style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>
                    {formatCurrency(estimatedMaintenance)}
                  </p>
                </div>
                <div style={{ background: '#EFF6FF', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #DBEAFE' }}>
                  <p style={{ fontSize: '0.6875rem', color: '#1E40AF', margin: '0 0 0.25rem', fontWeight: 700 }}>Total Expected</p>
                  <p style={{ fontSize: '1.0625rem', fontWeight: 900, margin: 0, color: '#1D4ED8' }}>
                    {formatCurrency(grandEstimatedTotal)}
                  </p>
                </div>
              </div>
            </div>

            {/* Batch Form */}
            <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                <div>
                  <label className="input-label" style={{ fontWeight: 700, color: '#0F172A' }}>
                    Target Building / Property
                  </label>
                  <select
                    className="input"
                    value={selectedPropertyId}
                    onChange={(e) => setSelectedPropertyId(e.target.value)}
                  >
                    <option value="">🏢 All Buildings ({properties.length} Total)</option>
                    {properties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.occupied_units} Occupied / {p.total_units} Units)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="input-label" style={{ fontWeight: 700, color: '#0F172A' }}>
                    Payment Due Day of Month
                  </label>
                  <select
                    className="input"
                    value={dueDay}
                    onChange={(e) => setDueDay(Number(e.target.value))}
                  >
                    <option value={1}>1st of Month</option>
                    <option value={5}>5th of Month (Default Standard)</option>
                    <option value={7}>7th of Month</option>
                    <option value={10}>10th of Month</option>
                    <option value={15}>15th of Month</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                <div>
                  <label className="input-label" style={{ fontWeight: 700, color: '#0F172A' }}>
                    Flat Utility / Electricity Surcharge (₹ / unit)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    className="input"
                    placeholder="e.g. 500 (Optional)"
                    value={utilitySurcharge}
                    onChange={(e) => setUtilitySurcharge(e.target.value)}
                  />
                  <p style={{ fontSize: '0.6875rem', color: '#64748B', margin: '0.25rem 0 0' }}>
                    Added to all generated invoices for water/generator/amenities.
                  </p>
                </div>

                <div>
                  <label className="input-label" style={{ fontWeight: 700, color: '#0F172A' }}>
                    Resident Notifications
                  </label>
                  <div
                    onClick={() => setNotifyTenants(!notifyTenants)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.65rem 0.875rem',
                      borderRadius: '0.5rem',
                      background: notifyTenants ? '#ECFDF5' : '#F8FAFC',
                      border: `1px solid ${notifyTenants ? '#A7F3D0' : '#E2E8F0'}`,
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={notifyTenants}
                      onChange={(e) => setNotifyTenants(e.target.checked)}
                      style={{ width: 18, height: 18, accentColor: '#059669', cursor: 'pointer' }}
                    />
                    <div>
                      <p style={{ fontSize: '0.8125rem', fontWeight: 700, margin: 0, color: notifyTenants ? '#065F46' : '#334155' }}>
                        Send In-App Rent Due Alerts
                      </p>
                      <p style={{ fontSize: '0.6875rem', color: '#64748B', margin: 0 }}>
                        Instant notification in resident portal
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="input-label" style={{ fontWeight: 700, color: '#0F172A' }}>
                  Invoice Note / Memo (Optional)
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Please clear rent before 5th to avoid late fees"
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                />
              </div>

              <div
                style={{
                  padding: '0.875rem',
                  backgroundColor: '#F8FAFC',
                  borderRadius: '0.75rem',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.625rem',
                  fontSize: '0.75rem',
                  color: '#475569',
                }}
              >
                <Info size={16} color="#2563EB" style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <strong>Idempotent Safe Generation:</strong> Invoices already generated for {billingMonth} will be automatically skipped without duplicate billing.
                </div>
              </div>

              <button
                type="button"
                className="btn btn-primary btn-full btn-lg"
                disabled={isLoading || isFetchingData}
                onClick={handleBatchGenerate}
                style={{
                  height: 50,
                  fontSize: '0.9375rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                }}
              >
                {isLoading ? (
                  'Generating Batch Invoices...'
                ) : (
                  <>
                    <Zap size={18} />
                    <span>Generate Rent Invoices ({relevantUnits.length} Occupied Units)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: PERSON-WISE CUSTOM INVOICING MODE */}
        {/* ======================================================== */}
        {activeTab === 'person' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Step 1: Resident Selector */}
            <div className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', margin: 0 }}>
                  1. Select Resident / Tenant
                </label>
                <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                  {occupiedTenants.length} Assigned Tenants
                </span>
              </div>

              {/* Search Bar */}
              <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
                <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input
                  type="text"
                  className="input"
                  style={{ paddingLeft: '2.25rem', height: 40, fontSize: '0.8125rem' }}
                  placeholder="Search by tenant name, flat number, or phone..."
                  value={tenantSearchQuery}
                  onChange={(e) => setTenantSearchQuery(e.target.value)}
                />
              </div>

              {/* Scrollable Resident Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: '0.625rem',
                  maxHeight: 220,
                  overflowY: 'auto',
                  padding: '0.25rem',
                }}
              >
                {filteredOccupiedTenants.map((t) => {
                  const isSelected = selectedTenantId === t.id
                  const hasInvoice = existingInvoicesMap.has(t.unit_id)
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedTenantId(t.id)}
                      style={{
                        padding: '0.75rem',
                        borderRadius: '0.75rem',
                        border: isSelected ? '2px solid #2563EB' : '1px solid #E2E8F0',
                        background: isSelected ? '#EFF6FF' : '#F8FAFC',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s ease',
                        boxShadow: isSelected ? '0 4px 12px rgba(37, 99, 235, 0.15)' : 'none',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.875rem', color: isSelected ? '#1E40AF' : '#0F172A' }}>
                          {t.full_name}
                        </span>
                        {hasInvoice && (
                          <span style={{ fontSize: '0.5625rem', fontWeight: 800, background: '#DCFCE7', color: '#166534', padding: '0.1rem 0.35rem', borderRadius: '999px' }}>
                            BILLED
                          </span>
                        )}
                      </div>
                      <p style={{ margin: '0.15rem 0 0', fontSize: '0.75rem', color: '#64748B' }}>
                        Flat: <strong>{t.unit_number || 'N/A'}</strong> ({t.property_name || 'Building'})
                      </p>
                      <p style={{ margin: '0.15rem 0 0', fontSize: '0.6875rem', color: '#059669', fontWeight: 700 }}>
                        Rent: {formatCurrency(t.monthly_rent || 0)}/mo
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Step 2: Itemized Cost Breakdown Builder */}
            {selectedTenantObj && (
              <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.75rem' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>
                      2. Custom Invoice Breakdown for {selectedTenantObj.full_name}
                    </h3>
                    <p style={{ margin: '0.15rem 0 0', fontSize: '0.75rem', color: '#64748B' }}>
                      Unit: {selectedTenantUnit?.unit_number} • Building: {selectedTenantProperty?.name || selectedTenantObj.property_name}
                    </p>
                  </div>
                  {isSelectedTenantAlreadyInvoiced && (
                    <span style={{ fontSize: '0.75rem', background: '#FEF3C7', color: '#92400E', padding: '0.2rem 0.5rem', borderRadius: '0.375rem', fontWeight: 700 }}>
                      ⚠️ Invoice already exists for this cycle
                    </span>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                  <div>
                    <label className="input-label" style={{ fontWeight: 700, color: '#334155' }}>
                      Base Rent (₹) *
                    </label>
                    <input
                      type="number"
                      className="input"
                      style={{ fontWeight: 700, fontSize: '0.9375rem' }}
                      value={personRent}
                      onChange={(e) => setPersonRent(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="input-label" style={{ fontWeight: 700, color: '#334155' }}>
                      Maintenance Fee (₹)
                    </label>
                    <input
                      type="number"
                      className="input"
                      value={personMaintenance}
                      onChange={(e) => setPersonMaintenance(e.target.value)}
                    />
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label className="input-label" style={{ fontWeight: 700, color: '#334155' }}>
                        Electricity / Utilities (₹)
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowMeterCalc(!showMeterCalc)}
                        style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: '0.6875rem', fontWeight: 700, cursor: 'pointer' }}
                      >
                        {showMeterCalc ? 'Hide Meter' : '⚡ Meter Calc'}
                      </button>
                    </div>
                    <input
                      type="number"
                      className="input"
                      value={personUtility}
                      onChange={(e) => setPersonUtility(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="input-label" style={{ fontWeight: 700, color: '#334155' }}>
                      Other / Water Charges (₹)
                    </label>
                    <input
                      type="number"
                      className="input"
                      placeholder="e.g. 300"
                      value={personOtherCharges}
                      onChange={(e) => setPersonOtherCharges(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="input-label" style={{ fontWeight: 700, color: '#16A34A' }}>
                      Discount / Waiver (- ₹)
                    </label>
                    <input
                      type="number"
                      className="input"
                      placeholder="e.g. 500"
                      value={personDiscount}
                      onChange={(e) => setPersonDiscount(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="input-label" style={{ fontWeight: 700, color: '#334155' }}>
                      Payment Due Date
                    </label>
                    <input
                      type="date"
                      className="input"
                      value={personDueDate}
                      onChange={(e) => setPersonDueDate(e.target.value)}
                    />
                  </div>
                </div>

                {/* Meter Reading Sub-Calculator */}
                {showMeterCalc && (
                  <div
                    style={{
                      padding: '0.875rem',
                      borderRadius: '0.625rem',
                      background: '#F0FDF4',
                      border: '1px solid #BBF7D0',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                      gap: '0.625rem',
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#166534', display: 'block', marginBottom: '0.2rem' }}>
                        Previous Reading
                      </span>
                      <input
                        type="number"
                        className="input"
                        style={{ height: 34, fontSize: '0.8125rem' }}
                        value={prevMeter}
                        onChange={(e) => setPrevMeter(e.target.value)}
                      />
                    </div>
                    <div>
                      <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#166534', display: 'block', marginBottom: '0.2rem' }}>
                        Current Reading
                      </span>
                      <input
                        type="number"
                        className="input"
                        style={{ height: 34, fontSize: '0.8125rem' }}
                        value={currMeter}
                        onChange={(e) => setCurrMeter(e.target.value)}
                      />
                    </div>
                    <div>
                      <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#166534', display: 'block', marginBottom: '0.2rem' }}>
                        Rate (₹ / kWh)
                      </span>
                      <input
                        type="number"
                        className="input"
                        style={{ height: 34, fontSize: '0.8125rem' }}
                        value={ratePerUnit}
                        onChange={(e) => setRatePerUnit(e.target.value)}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <span style={{ fontSize: '0.6875rem', color: '#15803D', fontWeight: 700 }}>
                        Calculated Utility:
                      </span>
                      <span style={{ fontSize: '1rem', fontWeight: 800, color: '#166534' }}>
                        {formatCurrency(personUtilityNum)}
                      </span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="input-label" style={{ fontWeight: 700, color: '#334155' }}>
                    Personal Invoice Notes (Optional)
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. Includes parking slot #4 and AC servicing share"
                    value={personNotes}
                    onChange={(e) => setPersonNotes(e.target.value)}
                  />
                </div>

                {/* Live Invoice Receipt Preview */}
                <div
                  style={{
                    padding: '1rem 1.25rem',
                    borderRadius: '0.75rem',
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#0F172A' }}>
                      🧾 Real-Time Invoice Summary
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                      Due: {personDueDate}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.8125rem', color: '#475569' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Base Rent:</span>
                      <strong>{formatCurrency(personRentNum)}</strong>
                    </div>
                    {personMaintNum > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Maintenance:</span>
                        <strong>+{formatCurrency(personMaintNum)}</strong>
                      </div>
                    )}
                    {personUtilityNum > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Electricity / Utilities:</span>
                        <strong>+{formatCurrency(personUtilityNum)}</strong>
                      </div>
                    )}
                    {personOtherNum > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Other Charges:</span>
                        <strong>+{formatCurrency(personOtherNum)}</strong>
                      </div>
                    )}
                    {personDiscountNum > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16A34A' }}>
                        <span>Discount / Waiver:</span>
                        <strong>-{formatCurrency(personDiscountNum)}</strong>
                      </div>
                    )}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        paddingTop: '0.5rem',
                        marginTop: '0.25rem',
                        borderTop: '1px solid #E2E8F0',
                        fontSize: '1rem',
                        fontWeight: 900,
                        color: '#1D4ED8',
                      }}
                    >
                      <span>TOTAL PAYABLE:</span>
                      <span>{formatCurrency(personGrandTotal)}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={shareViaWhatsApp}
                    style={{ flex: 1, gap: '0.375rem', color: '#047857', borderColor: '#A7F3D0', background: '#ECFDF5' }}
                  >
                    <Share2 size={16} /> Share on WhatsApp
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={isLoading || isSelectedTenantAlreadyInvoiced}
                    onClick={handlePersonGenerate}
                    style={{ flex: 2, height: 48, fontSize: '0.9375rem', fontWeight: 800, gap: '0.5rem' }}
                  >
                    {isLoading ? (
                      'Creating Invoice...'
                    ) : (
                      <>
                        <User size={18} />
                        <span>Issue Custom Invoice ({formatCurrency(personGrandTotal)})</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: RESIDENT SELECTION CHECKLIST MODE */}
        {/* ======================================================== */}
        {activeTab === 'checklist' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 800, color: '#0F172A' }}>
                    Multi-Select Resident Checklist
                  </h3>
                  <p style={{ margin: '0.15rem 0 0', fontSize: '0.75rem', color: '#64748B' }}>
                    Pick specific units to generate rent for ({selectedUnitIds.length} of {relevantUnits.length} selected)
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.375rem' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.6875rem' }}
                    onClick={() => {
                      const unbilledIds = relevantUnits.filter((u) => !existingInvoicesMap.has(u.id)).map((u) => u.id)
                      setSelectedUnitIds(unbilledIds)
                    }}
                  >
                    Select Unbilled ({unbilledUnitsCount})
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.6875rem' }}
                    onClick={() => setSelectedUnitIds(relevantUnits.map((u) => u.id))}
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: '0.6875rem' }}
                    onClick={() => setSelectedUnitIds([])}
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Search in checklist */}
              <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
                <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input
                  type="text"
                  className="input"
                  style={{ paddingLeft: '2.25rem', height: 38, fontSize: '0.8125rem' }}
                  placeholder="Filter by flat number or tenant..."
                  value={checklistSearch}
                  onChange={(e) => setChecklistSearch(e.target.value)}
                />
              </div>

              {/* Checklist items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 360, overflowY: 'auto' }}>
                {filteredChecklistUnits.map((u) => {
                  const tenant = occupiedTenants.find((t) => t.unit_id === u.id)
                  const hasInvoice = existingInvoicesMap.has(u.id)
                  const isChecked = selectedUnitIds.includes(u.id)

                  return (
                    <div
                      key={u.id}
                      onClick={() => {
                        setSelectedUnitIds((prev) =>
                          prev.includes(u.id) ? prev.filter((id) => id !== u.id) : [...prev, u.id]
                        )
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.75rem 1rem',
                        borderRadius: '0.625rem',
                        border: isChecked ? '1.5px solid #2563EB' : '1px solid #E2E8F0',
                        background: isChecked ? '#EFF6FF' : '#FFFFFF',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          style={{ width: 18, height: 18, accentColor: '#2563EB', cursor: 'pointer' }}
                        />
                        <div>
                          <p style={{ margin: 0, fontWeight: 800, fontSize: '0.875rem', color: '#0F172A' }}>
                            Flat {u.unit_number} — {tenant?.full_name || 'Assigned Resident'}
                          </p>
                          <p style={{ margin: '0.1rem 0 0', fontSize: '0.6875rem', color: '#64748B' }}>
                            {u.property_name || 'Property'} • Rent: {formatCurrency(u.monthly_rent || 0)} + Maint: {formatCurrency(u.maintenance_charge || 0)}
                          </p>
                        </div>
                      </div>

                      <div>
                        {hasInvoice ? (
                          <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#166534', background: '#DCFCE7', padding: '0.15rem 0.5rem', borderRadius: '999px' }}>
                            BILLED
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#1D4ED8', background: '#DBEAFE', padding: '0.15rem 0.5rem', borderRadius: '999px' }}>
                            READY
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Action Button for Checklist */}
              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #F1F5F9' }}>
                <button
                  type="button"
                  className="btn btn-primary btn-full btn-lg"
                  disabled={isLoading || selectedUnitIds.length === 0}
                  onClick={handleChecklistGenerate}
                  style={{ height: 50, fontSize: '0.9375rem', fontWeight: 800, gap: '0.5rem' }}
                >
                  {isLoading ? (
                    'Generating Invoices...'
                  ) : (
                    <>
                      <Users size={18} />
                      <span>Generate Invoices for ({selectedUnitIds.length}) Selected Flats</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </MobilePage>
  )
}

