// User Roles
export type UserRole = 'super_admin' | 'owner' | 'tenant'

export interface User {
  id: string
  email: string
  full_name: string
  phone?: string
  role: UserRole
  profile_photo?: string
  is_active: boolean
  organization_id?: string
  organization_name?: string
  organization_code?: string
  organization_status?: OrganizationStatus
  created_at?: string
}

export type OrganizationStatus = 'active' | 'suspended' | 'inactive'
export type OrganizationPlan = 'starter' | 'growth' | 'enterprise'

export interface Organization {
  id: string
  name: string
  organization_code: string
  owner_user_id?: string
  owner_name?: string
  owner_email?: string
  owner_phone?: string
  contact_details?: {
    email?: string
    phone?: string
    address?: string
    city?: string
    state?: string
    pincode?: string
  }
  status: OrganizationStatus
  plan: OrganizationPlan
  buildings_count?: number
  properties_count?: number
  units_count?: number
  tenants_count?: number
  invoices_count?: number
  max_properties?: number
  max_units?: number
  subdomain?: string
  notes?: string
  settings?: Record<string, any>
  created_at: string
  updated_at?: string
}

export interface AuditLog {
  id: string
  actor_user_id: string
  actor_email: string
  action: string
  organization_id?: string
  resource_type?: string
  resource_id?: string
  details?: Record<string, any>
  ip_address?: string
  created_at: string
}

export interface SuperAdminDashboard {
  stats: {
    total_organizations: number
    active_organizations: number
    suspended_organizations: number
    total_owners: number
    total_properties: number
    total_units: number
    occupied_units: number
    total_tenants: number
    platform_collected_revenue: number
  }
  recent_organizations: Organization[]
  recent_audit_logs: AuditLog[]
}

export interface Property {
  id: string
  name: string
  address: string
  city: string
  state: string
  pincode: string
  description?: string
  total_floors: number
  image?: string
  total_units: number
  occupied_units: number
  vacant_units: number
  monthly_rent: number
  occupancy_rate: number
  organization_id?: string
  owner_id?: string
  created_at: string
}

export interface Unit {
  id: string
  property_id: string
  property_name?: string
  organization_id?: string
  unit_number: string
  floor_number: number
  unit_type: string
  area_sqft?: number
  monthly_rent: number
  maintenance_charge: number
  security_deposit: number
  status: 'occupied' | 'vacant' | 'maintenance' | 'reserved' | 'inactive'
  description?: string
  tenant_id?: string
  tenant_name?: string
  tenant_phone?: string
  created_at: string
}

export interface Floor {
  floor_number: number
  total: number
  occupied: number
  units: Unit[]
}

export interface Tenant {
  id: string
  full_name: string
  phone: string
  email?: string
  permanent_address?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  id_type?: string
  id_number?: string
  occupation?: string
  notes?: string
  profile_photo?: string
  has_portal_access: boolean
  user_id?: string
  organization_id?: string
  owner_id?: string
  unit_id?: string
  unit_number?: string
  property_id?: string
  property_name?: string
  monthly_rent?: number
  rent_due_day?: number
  joining_date?: string
  current_rent_status?: 'paid' | 'pending' | 'partially_paid' | 'overdue'
  created_at: string
}

export type RentStatus = 'paid' | 'pending' | 'partially_paid' | 'overdue' | 'under_review' | 'waived'
export type PaymentMethod = 'cash' | 'upi' | 'bank_transfer' | 'card' | 'cheque' | 'other'

export interface ClaimedPayment {
  amount: number
  payment_method: PaymentMethod | string
  transaction_reference?: string
  payment_date: string
  proof_url?: string
  notes?: string
  reported_at?: string
  status?: string
  rejection_reason?: string
  receipt_number?: string
}

export interface RentInvoice {
  id: string
  invoice_number: string
  property_id: string
  property_name?: string
  property_address?: string
  unit_id: string
  unit_number?: string
  tenant_id: string
  tenant_name?: string
  tenant_phone?: string
  tenant_email?: string
  billing_month: string
  rent_amount: number
  maintenance_amount: number
  utility_amount: number
  other_charges: number
  discount: number
  total_amount: number
  paid_amount: number
  pending_amount: number
  status: RentStatus
  due_date: string
  notes?: string
  payment_claimed?: boolean
  claimed_payment?: ClaimedPayment
  payments?: Payment[]
  created_at: string
}

export interface Payment {
  id: string
  receipt_number: string
  invoice_id: string
  tenant_id: string
  tenant_name?: string
  tenant_phone?: string
  unit_id: string
  unit_number?: string
  property_id: string
  property_name?: string
  billing_month: string
  amount: number
  payment_method: PaymentMethod
  transaction_reference?: string
  payment_date: string
  notes?: string
  created_at: string
}

export interface RentSummary {
  expected: number
  collected: number
  pending: number
  overdue: number
  under_review?: number
  under_review_count?: number
  collection_rate: number
}

export interface MaintenanceRequest {
  id: string
  request_number: string
  property_id: string
  property_name?: string
  unit_id: string
  unit_number?: string
  tenant_id?: string
  tenant_name?: string
  category: 'plumbing' | 'electrical' | 'water' | 'ac' | 'cleaning' | 'internet' | 'appliance' | 'other'
  title: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  photos: string[]
  status: 'open' | 'in_progress' | 'on_hold' | 'resolved' | 'closed' | 'rejected'
  notes?: string
  assigned_to?: string
  resolved_at?: string
  created_at: string
}

export interface Expense {
  id: string
  property_id: string
  property_name?: string
  category: string
  description: string
  amount: number
  vendor?: string
  invoice_number?: string
  payment_method?: string
  date: string
  notes?: string
  created_at: string
}

export interface Agreement {
  id: string
  agreement_number: string
  tenant_id: string
  tenant_name?: string
  unit_id: string
  unit_number?: string
  property_id: string
  property_name?: string
  start_date: string
  end_date: string
  monthly_rent: number
  security_deposit: number
  notice_period_days?: number
  status: 'active' | 'expiring' | 'expired' | 'terminated'
  created_at: string
}

export interface Notification {
  id: string
  title: string
  message: string
  type: string
  read: boolean
  created_at: string
}

export interface TenantDashboard {
  tenant: {
    id: string
    full_name: string
    phone?: string
    email?: string
  }
  unit?: {
    id: string
    unit_number: string
    unit_type: string
    monthly_rent: number
  }
  property?: {
    id: string
    name: string
    address: string
  }
  current_invoice?: {
    id: string
    invoice_number?: string
    billing_month: string
    total_amount: number
    paid_amount: number
    pending_amount: number
    status: RentStatus
    due_date: string
  }
  recent_payments: {
    id: string
    billing_month: string
    amount: number
    payment_date: string
    receipt_number: string
    payment_method: string
  }[]
  maintenance_requests: {
    id: string
    request_number: string
    title: string
    category: string
    status: string
    created_at: string
  }[]
  unread_notifications: number
  is_org_suspended?: boolean
}

export interface OwnerDashboard {
  organization_name?: string
  total_properties: number
  total_units: number
  occupied_units: number
  vacant_units: number
  occupancy_rate: number
  expected_rent: number
  collected_rent: number
  pending_rent: number
  overdue_rent: number
  total_expenses: number
  net_income: number
  collection_rate: number
  alerts: {
    overdue_invoices: number
    under_review_invoices?: number
    expiring_agreements: number
    open_maintenance: number
    vacant_units: number
  }
  monthly_trend: {
    month: string
    month_key: string
    collected: number
    expenses: number
    net: number
  }[]
}

export type DashboardSummary = OwnerDashboard
