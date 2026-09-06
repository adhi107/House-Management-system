import React, { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import { OwnerShell, TenantShell, PageLoader } from './components/layout/AppShell'
import { SuperAdminShell } from './components/layout/SuperAdminShell'

// Auth
import LoginPage from './pages/auth/LoginPage'

// Super Admin pages
const SuperAdminDashboardPage = lazy(() => import('./pages/superadmin/DashboardPage'))
const OrganizationsPage = lazy(() => import('./pages/superadmin/OrganizationsPage'))
const OrganizationDetailPage = lazy(() => import('./pages/superadmin/OrganizationDetailPage'))
const OwnersPage = lazy(() => import('./pages/superadmin/OwnersPage'))
const AuditLogsPage = lazy(() => import('./pages/superadmin/AuditLogsPage'))
const SuperAdminSettingsPage = lazy(() => import('./pages/superadmin/SettingsPage'))
const SuperAdminSmtpPage = lazy(() => import('./pages/superadmin/SmtpPage'))
const SuperAdminMorePage = lazy(() => import('./pages/superadmin/SuperAdminMorePage'))

// Owner pages
import OwnerDashboardPage from './pages/owner/DashboardPage'
import PropertiesPage from './pages/owner/PropertiesPage'
import TenantsPage from './pages/owner/TenantsPage'
import RentPage from './pages/owner/RentPage'
import MaintenancePage from './pages/owner/MaintenancePage'
import { AddPropertyPage, AddTenantPage, OwnerMorePage } from './pages/owner/Forms'

// Lazy-loaded Owner pages
const PropertyDetailPage = lazy(() => import('./pages/owner/PropertyDetailPage'))
const TenantDetailPage = lazy(() => import('./pages/owner/TenantDetailPage'))
const UnitsPage = lazy(() => import('./pages/owner/UnitsPage'))
const PaymentsPage = lazy(() => import('./pages/owner/PaymentsPage'))
const ExpensesPage = lazy(() => import('./pages/owner/ExpensesPage'))
const AgreementsPage = lazy(() => import('./pages/owner/AgreementsPage'))
const OwnerDocumentsPage = lazy(() => import('./pages/owner/DocumentsPage'))
const AnnouncementsPage = lazy(() => import('./pages/owner/AnnouncementsPage'))
const ReportsPage = lazy(() => import('./pages/owner/ReportsPage'))
const GenerateRentPage = lazy(() => import('./pages/owner/GenerateRentPage'))
const OwnerSmtpPage = lazy(() => import('./pages/owner/OwnerSmtpPage'))

// Shared pages
const NotificationsPage = lazy(() => import('./pages/shared/NotificationsPage'))
const ProfilePage = lazy(() => import('./pages/shared/ProfilePage'))
const SettingsPage = lazy(() => import('./pages/shared/SettingsPage'))

// Tenant pages
import TenantDashboardPage from './pages/tenant/TenantDashboardPage'
import { TenantRentPage, TenantMaintenancePage, TenantMorePage } from './pages/tenant'
const TenantPaymentsPage = lazy(() => import('./pages/tenant/TenantPaymentsPage'))
const TenantAgreementPage = lazy(() => import('./pages/tenant/TenantAgreementPage'))
const TenantDocumentsPage = lazy(() => import('./pages/tenant/TenantDocumentsPage'))

function NotFoundPage() {
  const nav = window.location.pathname.startsWith('/super-admin')
    ? '/super-admin/dashboard'
    : window.location.pathname.startsWith('/tenant')
    ? '/tenant/dashboard'
    : '/owner/dashboard'
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center', background: 'rgb(var(--background))' }}>
      <p style={{ fontSize: '4rem', margin: '0 0 1rem' }}>🏠</p>
      <h1 style={{ fontWeight: 800, fontSize: '1.5rem', margin: '0 0 0.5rem' }}>Page not found</h1>
      <p className="text-muted" style={{ marginBottom: '1.5rem' }}>The page you're looking for doesn't exist.</p>
      <a href={nav} className="btn btn-primary">Go Home</a>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/" element={<Navigate to="/login" replace />} />

              {/* Super Admin Routes */}
              <Route path="/super-admin" element={<SuperAdminShell />}>
                <Route path="dashboard" element={<SuperAdminDashboardPage />} />
                <Route path="organizations" element={<OrganizationsPage />} />
                <Route path="organizations/:orgId" element={<OrganizationDetailPage />} />
                <Route path="owners" element={<OwnersPage />} />
                <Route path="smtp" element={<SuperAdminSmtpPage />} />
                <Route path="audit-logs" element={<AuditLogsPage />} />
                <Route path="settings" element={<SuperAdminSettingsPage />} />
                <Route path="notifications" element={<NotificationsPage role="super_admin" />} />
                <Route path="more" element={<SuperAdminMorePage />} />
                <Route index element={<Navigate to="dashboard" replace />} />
              </Route>

              {/* Owner Routes */}
              <Route path="/owner" element={<OwnerShell />}>
                <Route path="dashboard" element={<OwnerDashboardPage />} />
                <Route path="properties" element={<PropertiesPage />} />
                <Route path="properties/new" element={<AddPropertyPage />} />
                <Route path="properties/:propertyId" element={<PropertyDetailPage />} />
                <Route path="units" element={<UnitsPage />} />
                <Route path="units/:unitId" element={<UnitsPage />} />
                <Route path="tenants" element={<TenantsPage />} />
                <Route path="tenants/new" element={<AddTenantPage />} />
                <Route path="tenants/:tenantId" element={<TenantDetailPage />} />
                <Route path="rent" element={<RentPage />} />
                <Route path="rent/generate" element={<GenerateRentPage />} />
                <Route path="rent/invoices/:invoiceId" element={<RentPage />} />
                <Route path="payments" element={<PaymentsPage />} />
                <Route path="maintenance" element={<MaintenancePage />} />
                <Route path="maintenance/:id" element={<MaintenancePage />} />
                <Route path="expenses" element={<ExpensesPage />} />
                <Route path="agreements" element={<AgreementsPage />} />
                <Route path="documents" element={<OwnerDocumentsPage />} />
                <Route path="announcements" element={<AnnouncementsPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="smtp" element={<OwnerSmtpPage />} />
                <Route path="notifications" element={<NotificationsPage role="owner" />} />
                <Route path="settings" element={<SettingsPage role="owner" />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="more" element={<OwnerMorePage />} />
                <Route index element={<Navigate to="dashboard" replace />} />
              </Route>

              {/* Tenant Routes */}
              <Route path="/tenant" element={<TenantShell />}>
                <Route path="dashboard" element={<TenantDashboardPage />} />
                <Route path="rent" element={<TenantRentPage />} />
                <Route path="maintenance" element={<TenantMaintenancePage />} />
                <Route path="maintenance/:id" element={<TenantMaintenancePage />} />
                <Route path="documents" element={<TenantDocumentsPage />} />
                <Route path="payments" element={<TenantPaymentsPage />} />
                <Route path="agreements" element={<TenantAgreementPage />} />
                <Route path="notifications" element={<NotificationsPage role="tenant" />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="settings" element={<SettingsPage role="tenant" />} />
                <Route path="more" element={<TenantMorePage />} />
                <Route index element={<Navigate to="dashboard" replace />} />
              </Route>

              {/* 404 */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
