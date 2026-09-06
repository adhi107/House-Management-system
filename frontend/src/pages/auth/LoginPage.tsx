import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import {
  Building2,
  Eye,
  EyeOff,
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  Sparkles,
  CheckCircle2,
  Receipt,
  Wrench,
  TrendingUp,
} from 'lucide-react'
import { AxiosError } from 'axios'

export default function LoginPage() {
  const { login } = useAuth()
  const { error: showError, success: showSuccess } = useToast()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [activeRoleTab, setActiveRoleTab] = useState<'super_admin' | 'owner' | 'tenant' | 'custom'>('owner')
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})

  const validate = () => {
    const e: { email?: string; password?: string } = {}
    if (!email) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email'
    if (!password) e.password = 'Password is required'
    else if (password.length < 6) e.password = 'Password too short'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleLoginWithCredentials = async (loginEmail: string, loginPass: string) => {
    setIsLoading(true)
    try {
      const user = await login(loginEmail.trim(), loginPass)
      showSuccess(`Welcome back, ${user.full_name}!`)
      if (user.role === 'super_admin') {
        navigate('/super-admin/dashboard')
      } else if (user.role === 'owner') {
        navigate('/owner/dashboard')
      } else {
        navigate('/tenant/dashboard')
      }
    } catch (err) {
      const axiosErr = err as AxiosError<{ detail: string }>
      showError(axiosErr.response?.data?.detail || 'Login failed. Please check your credentials.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickLogin = (role: 'super_admin' | 'owner' | 'tenant') => {
    setActiveRoleTab(role)
    if (role === 'super_admin') {
      setEmail('superadmin@propertyhub.dev')
      setPassword('ChangeMe123!')
      handleLoginWithCredentials('superadmin@propertyhub.dev', 'ChangeMe123!')
    } else if (role === 'owner') {
      setEmail('owner@propertyhub.dev')
      setPassword('ChangeMe123!')
      handleLoginWithCredentials('owner@propertyhub.dev', 'ChangeMe123!')
    } else if (role === 'tenant') {
      setEmail('tenant@propertyhub.dev')
      setPassword('ChangeMe123!')
      handleLoginWithCredentials('tenant@propertyhub.dev', 'ChangeMe123!')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    await handleLoginWithCredentials(email, password)
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)',
        color: '#FFFFFF',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background Decorative Glow Blobs */}
      <div
        style={{
          position: 'absolute',
          top: '-15%',
          left: '-10%',
          width: '50vw',
          height: '50vw',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(37, 99, 235, 0.18) 0%, rgba(37, 99, 235, 0) 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-15%',
          right: '-10%',
          width: '50vw',
          height: '50vw',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, rgba(168, 85, 247, 0) 70%)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          display: 'flex',
          width: '100%',
          maxWidth: '1240px',
          margin: '0 auto',
          padding: '2rem 1.5rem',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '3rem',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Left Side: SaaS Hero & Feature Showcase (Visible on Desktop) */}
        <div
          className="hidden-mobile"
          style={{
            flex: '1.1',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.75rem',
            paddingRight: '1rem',
          }}
        >
          {/* Logo Brand Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '0.875rem',
                background: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.5)',
              }}
            >
              <Building2 size={26} color="#FFFFFF" />
            </div>
            <div>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#FFFFFF' }}>
                PropertyHub SaaS
              </span>
              <span
                style={{
                  fontSize: '0.6875rem',
                  padding: '0.15rem 0.5rem',
                  backgroundColor: 'rgba(59, 130, 246, 0.2)',
                  color: '#60A5FA',
                  borderRadius: '9999px',
                  marginLeft: '0.5rem',
                  fontWeight: 700,
                  border: '1px solid rgba(96, 165, 250, 0.3)',
                }}
              >
                PRO v2.4
              </span>
            </div>
          </div>

          <div>
            <h1
              style={{
                fontSize: '2.5rem',
                fontWeight: 800,
                lineHeight: 1.15,
                letterSpacing: '-0.03em',
                margin: '0 0 1rem 0',
                background: 'linear-gradient(180deg, #FFFFFF 0%, #CBD5E1 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Modern Multi-Building Rental & Tenant Cloud OS
            </h1>
            <p style={{ fontSize: '1rem', color: '#94A3B8', lineHeight: 1.6, margin: 0, maxWidth: 500 }}>
              Automate rent invoices, track maintenance tickets in real-time, generate lease agreements, and manage tenant records effortlessly.
            </p>
          </div>

          {/* Feature Highlight Pills */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem', maxWidth: 520 }}>
            {[
              { title: '100% Automated Billing', desc: 'Instant UPI rent payment generation', icon: <Receipt size={18} color="#60A5FA" /> },
              { title: 'Live Maintenance Board', desc: 'Real-time issue status tracking', icon: <Wrench size={18} color="#34D399" /> },
              { title: 'Financial Analytics', desc: 'Cashflow, Dues & Occupancy KPIs', icon: <TrendingUp size={18} color="#FBBF24" /> },
              { title: 'Multi-Role Access', desc: 'Portals for Admins, Owners & Tenants', icon: <ShieldCheck size={18} color="#A78BFA" /> },
            ].map((f, i) => (
              <div
                key={i}
                style={{
                  padding: '0.875rem',
                  borderRadius: '0.75rem',
                  backgroundColor: 'rgba(30, 41, 59, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  backdropFilter: 'blur(8px)',
                  display: 'flex',
                  gap: '0.75rem',
                  alignItems: 'flex-start',
                }}
              >
                <div style={{ padding: '0.25rem', borderRadius: '0.375rem', backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
                  {f.icon}
                </div>
                <div>
                  <h2 style={{ fontSize: '0.8125rem', fontWeight: 700, margin: 0, color: '#F1F5F9' }}>{f.title}</h2>
                  <p style={{ fontSize: '0.6875rem', color: '#94A3B8', margin: '0.125rem 0 0 0' }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Security Guarantee Pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748B', fontSize: '0.8125rem' }}>
            <CheckCircle2 size={16} color="#10B981" />
            <span>Multi-tenant encrypted database • Fast API & React 18 engine</span>
          </div>
        </div>

        {/* Right Side: Auth Form Card */}
        <div
          style={{
            flex: '0.9',
            width: '100%',
            maxWidth: 440,
            margin: '0 auto',
          }}
        >
          <div
            className="animate-fade-in-up"
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '1.25rem',
              padding: '2rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)',
              color: '#0F172A',
            }}
          >
            {/* Header */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <h2 style={{ fontSize: '1.375rem', fontWeight: 800, margin: 0, color: '#0F172A', letterSpacing: '-0.02em' }}>
                  Sign In
                </h2>
                <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 500 }}>Secure Portal</span>
              </div>
              <p style={{ fontSize: '0.8125rem', color: '#64748B', margin: 0 }}>
                Select a persona or enter your email credentials
              </p>
            </div>

            {/* Quick Persona Demo Selector Buttons */}
            <div style={{ marginBottom: '1.25rem' }}>
              <span
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  color: '#94A3B8',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  display: 'block',
                  marginBottom: '0.5rem',
                }}
              >
                1-Click Persona Access
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('owner')}
                  disabled={isLoading}
                  style={{
                    padding: '0.625rem 0.375rem',
                    borderRadius: '0.625rem',
                    border: '1px solid #E2E8F0',
                    backgroundColor: activeRoleTab === 'owner' ? '#EFF6FF' : '#F8FAFC',
                    borderColor: activeRoleTab === 'owner' ? '#3B82F6' : '#E2E8F0',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.25rem',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Building2 size={18} color="#2563EB" />
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1E293B' }}>Owner</span>
                  <span style={{ fontSize: '0.625rem', color: '#64748B' }}>Sunrise</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('tenant')}
                  disabled={isLoading}
                  style={{
                    padding: '0.625rem 0.375rem',
                    borderRadius: '0.625rem',
                    border: '1px solid #E2E8F0',
                    backgroundColor: activeRoleTab === 'tenant' ? '#ECFDF5' : '#F8FAFC',
                    borderColor: activeRoleTab === 'tenant' ? '#10B981' : '#E2E8F0',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.25rem',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <UserCheck size={18} color="#059669" />
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1E293B' }}>Tenant</span>
                  <span style={{ fontSize: '0.625rem', color: '#64748B' }}>Flat 101</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('super_admin')}
                  disabled={isLoading}
                  style={{
                    padding: '0.625rem 0.375rem',
                    borderRadius: '0.625rem',
                    border: '1px solid #E2E8F0',
                    backgroundColor: activeRoleTab === 'super_admin' ? '#FAF5FF' : '#F8FAFC',
                    borderColor: activeRoleTab === 'super_admin' ? '#A855F7' : '#E2E8F0',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.25rem',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <ShieldCheck size={18} color="#7C3AED" />
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1E293B' }}>Super Admin</span>
                  <span style={{ fontSize: '0.625rem', color: '#64748B' }}>Platform</span>
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '1rem 0' }}>
              <div style={{ flex: 1, height: 1, backgroundColor: '#E2E8F0' }} />
              <span style={{ fontSize: '0.6875rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 600 }}>
                Or sign in manually
              </span>
              <div style={{ flex: 1, height: 1, backgroundColor: '#E2E8F0' }} />
            </div>

            {/* Credential Form */}
            <form onSubmit={handleSubmit} noValidate>
              {/* Email */}
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="input-label" htmlFor="email" style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="name@propertyhub.dev"
                    className={`input ${errors.email ? 'input-error' : ''}`}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      setErrors((p) => ({ ...p, email: '' }))
                    }}
                    style={{ paddingLeft: '2.5rem', backgroundColor: '#F8FAFC' }}
                    disabled={isLoading}
                  />
                  <Mail
                    size={18}
                    style={{
                      position: 'absolute',
                      left: '0.875rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#94A3B8',
                      pointerEvents: 'none',
                    }}
                  />
                </div>
                {errors.email && <p className="input-hint input-hint-error">{errors.email}</p>}
              </div>

              {/* Password */}
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="input-label" htmlFor="password" style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="password"
                    type={showPwd ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className={`input ${errors.password ? 'input-error' : ''}`}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      setErrors((p) => ({ ...p, password: '' }))
                    }}
                    style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem', backgroundColor: '#F8FAFC' }}
                    disabled={isLoading}
                  />
                  <Lock
                    size={18}
                    style={{
                      position: 'absolute',
                      left: '0.875rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#94A3B8',
                      pointerEvents: 'none',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((p) => !p)}
                    style={{
                      position: 'absolute',
                      right: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '0.25rem',
                      color: '#94A3B8',
                    }}
                    aria-label={showPwd ? 'Hide password' : 'Show password'}
                  >
                    {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && <p className="input-hint input-hint-error">{errors.password}</p>}
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="btn btn-primary btn-full btn-lg"
                disabled={isLoading}
                style={{
                  backgroundColor: '#0F172A',
                  borderColor: '#0F172A',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  boxShadow: '0 4px 14px rgba(15, 23, 42, 0.25)',
                  gap: '0.5rem',
                }}
              >
                {isLoading ? (
                  <span className="spinner" />
                ) : (
                  <>
                    Sign In <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
