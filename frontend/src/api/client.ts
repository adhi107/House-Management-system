import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1'

// ================================================
// Axios Instance
// ================================================

export const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
})

// ================================================
// Request Interceptor — Attach Bearer Token
// ================================================

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ================================================
// Response Interceptor — Handle 401 / Refresh
// ================================================

let isRefreshing = false
let refreshQueue: Array<(token: string) => void> = []

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    if (error.response?.status === 401 && !original._retry) {
      const refreshToken = localStorage.getItem('refresh_token')
      if (!refreshToken) {
        clearAuth()
        window.location.href = '/login'
        return Promise.reject(error)
      }

      if (isRefreshing) {
        return new Promise((resolve) => {
          refreshQueue.push((token) => {
            original.headers.Authorization = `Bearer ${token}`
            resolve(api(original))
          })
        })
      }

      original._retry = true
      isRefreshing = true

      try {
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refresh_token: refreshToken })
        const { access_token, refresh_token: newRefresh } = data
        localStorage.setItem('access_token', access_token)
        localStorage.setItem('refresh_token', newRefresh)

        refreshQueue.forEach((cb) => cb(access_token))
        refreshQueue = []

        original.headers.Authorization = `Bearer ${access_token}`
        return api(original)
      } catch (refreshErr) {
        clearAuth()
        window.location.href = '/login'
        return Promise.reject(refreshErr)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export function clearAuth() {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('user')
}

// ================================================
// API MODULES
// ================================================

// Auth
export const authApi = {
  login: (data: object) => api.post('/auth/login', data),
  register: (data: object) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  changePassword: (data: object) => api.post('/auth/change-password', data),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data: object) => api.post('/auth/reset-password', data),
}

// Super Admin
export const superAdminApi = {
  getDashboard: () => api.get('/super-admin/dashboard'),
  listOrganizations: (params?: object) => api.get('/super-admin/organizations', { params }),
  createOrganization: (data: object) => api.post('/super-admin/organizations', data),
  getOrganization: (id: string) => api.get(`/super-admin/organizations/${id}`),
  updateOrganization: (id: string, data: object) => api.put(`/super-admin/organizations/${id}`, data),
  updateOrganizationStatus: (id: string, data: { status: string; reason?: string }) =>
    api.put(`/super-admin/organizations/${id}/status`, data),
  listOwners: (params?: object) => api.get('/super-admin/owners', { params }),
  createOwner: (data: object) => api.post('/super-admin/owners', data),
  updateOwner: (id: string, data: object) => api.put(`/super-admin/owners/${id}`, data),
  resetOwnerPassword: (id: string, new_password: string) =>
    api.put(`/super-admin/owners/${id}/reset-password`, { new_password }),
  listAuditLogs: (params?: object) => api.get('/super-admin/audit-logs', { params }),
  getSettings: () => api.get('/super-admin/settings'),
  updateSettings: (data: object) => api.put('/super-admin/settings', data),
}

// Owner Dashboard
export const dashboardApi = {
  getSummary: (property_id?: string) =>
    api.get('/dashboard/summary', { params: property_id ? { property_id } : {} }),
  getTenantDashboard: () => api.get('/tenant-dashboard'),
}

// Properties
export const propertyApi = {
  list: () => api.get('/properties'),
  get: (id: string) => api.get(`/properties/${id}`),
  create: (data: object) => api.post('/properties', data),
  update: (id: string, data: object) => api.put(`/properties/${id}`, data),
  delete: (id: string) => api.delete(`/properties/${id}`),
}

// Units
export const unitApi = {
  list: (params?: object) => api.get('/units', { params }),
  get: (id: string) => api.get(`/units/${id}`),
  create: (data: object) => api.post('/units', data),
  update: (id: string, data: object) => api.put(`/units/${id}`, data),
  delete: (id: string) => api.delete(`/units/${id}`),
}

// Tenants
export const tenantApi = {
  list: (params?: object) => api.get('/tenants', { params }),
  get: (id: string) => api.get(`/tenants/${id}`),
  create: (data: object) => api.post('/tenants', data),
  update: (id: string, data: object) => api.put(`/tenants/${id}`, data),
  assign: (data: object) => api.post('/tenants/assign', data),
  vacate: (id: string) => api.post(`/tenants/${id}/vacate`),
}

// Rent & Payments
export const rentApi = {
  listInvoices: (params?: object) => api.get('/rent/invoices', { params }),
  getInvoice: (id: string) => api.get(`/rent/invoices/${id}`),
  createInvoice: (data: object) => api.post('/rent/invoices', data),
  generateMonthly: (data: object) => api.post('/rent/generate', data),
  recordPayment: (data: object) => api.post('/rent/payments', data),
  listPayments: (params?: object) => api.get('/rent/payments', { params }),
  reportPayment: (invoiceId: string, data: object) => api.post(`/rent/invoices/${invoiceId}/report-payment`, data),
  verifyPayment: (invoiceId: string, data: object) => api.post(`/rent/invoices/${invoiceId}/verify-payment`, data),
  updateInvoice: (invoiceId: string, data: object) => api.patch(`/rent/invoices/${invoiceId}`, data),
  deleteInvoice: (invoiceId: string) => api.delete(`/rent/invoices/${invoiceId}`),
  sendReminders: (data: object) => api.post('/rent/remind', data),
}

// Maintenance
export const maintenanceApi = {
  list: (params?: object) => api.get('/maintenance', { params }),
  create: (data: object) => api.post('/maintenance', data),
  get: (id: string) => api.get(`/maintenance/${id}`),
  update: (id: string, data: object) => api.put(`/maintenance/${id}`, data),
}

// Expenses
export const expenseApi = {
  list: (params?: object) => api.get('/expenses', { params }),
  create: (data: object) => api.post('/expenses', data),
  delete: (id: string) => api.delete(`/expenses/${id}`),
}

// Agreements
export const agreementApi = {
  list: (params?: object) => api.get('/agreements', { params }),
  create: (data: object) => api.post('/agreements', data),
}

// Documents
export const documentApi = {
  list: (params?: object) => api.get('/documents', { params }),
  upload: (formData: FormData) =>
    api.post('/documents/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id: string) => api.delete(`/documents/${id}`),
}

// Notifications
export const notificationApi = {
  list: () => api.get('/notifications'),
  markRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/mark-all-read'),
  delete: (id: string) => api.delete(`/notifications/${id}`),
  clearAll: () => api.delete('/notifications'),
}

// Announcements
export const announcementApi = {
  list: () => api.get('/announcements'),
  create: (data: object) => api.post('/announcements', data),
}

// SMTP & Email Gateway
export const smtpApi = {
  getAdminConfig: () => api.get('/smtp/admin'),
  updateAdminConfig: (data: object) => api.put('/smtp/admin', data),
  testAdminSmtp: (data: object) => api.post('/smtp/admin/test', data),
  getOwnerConfig: () => api.get('/smtp/owner'),
  updateOwnerConfig: (data: object) => api.put('/smtp/owner', data),
  testOwnerSmtp: (data: object) => api.post('/smtp/owner/test', data),
  sendOwnerEmail: (data: object) => api.post('/smtp/owner/send', data),
  getOwnerLogs: () => api.get('/smtp/owner/logs'),
}

