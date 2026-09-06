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
  KeyRound,
  Shield,
  Layers
} from 'lucide-react'
import { AxiosError } from 'axios'

export default function LoginPage() {
  const { login } = useAuth()
  const { error: showError, success: showSuccess } = useToast()
  const navigate = useNavigate()

  // Form states
  const [email, setEmail] = useState('owner@propertyhub.dev')
  const [password, setPassword] = useState('ChangeMe123!')
  const [showPwd, setShowPwd] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [activePersona, setActivePersona] = useState<'owner' | 'tenant'>('owner')
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [showSuperAdminShortcut, setShowSuperAdminShortcut] = useState(false)

  const validate = () => {
    const e: { email?: string; password?: string } = {}
    if (!email.trim()) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(email.trim())) e.email = 'Enter a valid email address'
    if (!password) e.password = 'Password is required'
    else if (password.length < 6) e.password = 'Password must be at least 6 characters'
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
      showError(axiosErr.response?.data?.detail || 'Invalid email or password. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const selectPersona = (role: 'owner' | 'tenant') => {
    setActivePersona(role)
    setErrors({})
    if (role === 'owner') {
      setEmail('owner@propertyhub.dev')
      setPassword('ChangeMe123!')
    } else {
      setEmail('tenant@propertyhub.dev')
      setPassword('ChangeMe123!')
    }
  }

  const handleSuperAdminLogin = () => {
    setEmail('superadmin@propertyhub.dev')
    setPassword('ChangeMe123!')
    handleLoginWithCredentials('superadmin@propertyhub.dev', 'ChangeMe123!')
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
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(ellipse at top, #1E293B 0%, #0F172A 45%, #020617 100%)',
        color: '#FFFFFF',
        position: 'relative',
        overflow: 'hidden',
        padding: '1.5rem',
        fontFamily: 'inherit',
      }}
    >
      {/* Background Decorative Mesh Lights */}
      <div
        style={{
          position: 'absolute',
          top: '-15%',
          left: '20%',
          width: '50vw',
          height: '50vw',
          maxWidth: '600px',
          maxHeight: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0) 70%)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-15%',
          right: '20%',
          width: '50vw',
          height: '50vw',
          maxWidth: '600px',
          maxHeight: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, rgba(16, 185, 129, 0) 70%)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
        }}
      />

      {/* Main Container */}
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          position: 'relative',
          zIndex: 10,
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #2563EB 0%, #4F46E5 100%)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 12px 30px -6px rgba(37, 99, 235, 0.6), inset 0 1px 1px rgba(255,255,255,0.4)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              marginBottom: '1rem',
            }}
          >
            <Building2 size={30} color="#FFFFFF" />
          </div>
          <h1
            style={{
              fontSize: '1.75rem',
              fontWeight: 900,
              letterSpacing: '-0.03em',
              margin: '0 0 0.35rem 0',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
          >
            PropertyHub
            <span
              style={{
                fontSize: '0.65rem',
                padding: '0.15rem 0.5rem',
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                color: '#60A5FA',
                borderRadius: '9999px',
                fontWeight: 800,
                border: '1px solid rgba(96, 165, 250, 0.3)',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}
            >
              PRO
            </span>
          </h1>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#94A3B8' }}>
            Smart Property & Resident Management Platform
          </p>
        </div>

        {/* Elevated Glass Card */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '1.5rem',
            padding: '2.25rem 2rem',
            boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)',
            color: '#0F172A',
          }}
        >
          {/* Card Title & Status */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.25rem',
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: '1.35rem',
                  fontWeight: 900,
                  margin: 0,
                  color: '#0F172A',
                  letterSpacing: '-0.02em',
                }}
              >
                Sign In
              </h2>
              <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '0.15rem 0 0 0' }}>
                Select your portal role to continue
              </p>
            </div>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: '#059669',
                background: '#ECFDF5',
                padding: '0.2rem 0.6rem',
                borderRadius: '999px',
                border: '1px solid #A7F3D0',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  backgroundColor: '#10B981',
                  boxShadow: '0 0 6px #10B981',
                }}
              />
              Live
            </span>
          </div>

          {/* Segmented Persona Selector */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.5rem',
              background: '#F1F5F9',
              padding: '0.35rem',
              borderRadius: '0.875rem',
              marginBottom: '1.25rem',
            }}
          >
            <button
              type="button"
              onClick={() => selectPersona('owner')}
              disabled={isLoading}
              style={{
                padding: '0.7rem 0.5rem',
                borderRadius: '0.625rem',
                border: 'none',
                backgroundColor: activePersona === 'owner' ? '#FFFFFF' : 'transparent',
                boxShadow:
                  activePersona === 'owner'
                    ? '0 4px 12px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)'
                    : 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '7px',
                  background: activePersona === 'owner' ? '#EFF6FF' : '#E2E8F0',
                  color: activePersona === 'owner' ? '#2563EB' : '#64748B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Building2 size={16} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <div
                  style={{
                    fontSize: '0.825rem',
                    fontWeight: 800,
                    color: activePersona === 'owner' ? '#1E293B' : '#64748B',
                    lineHeight: 1.2,
                  }}
                >
                  Property Owner
                </div>
                <div style={{ fontSize: '0.65rem', color: '#94A3B8', fontWeight: 600 }}>Landlord</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => selectPersona('tenant')}
              disabled={isLoading}
              style={{
                padding: '0.7rem 0.5rem',
                borderRadius: '0.625rem',
                border: 'none',
                backgroundColor: activePersona === 'tenant' ? '#FFFFFF' : 'transparent',
                boxShadow:
                  activePersona === 'tenant'
                    ? '0 4px 12px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)'
                    : 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '7px',
                  background: activePersona === 'tenant' ? '#ECFDF5' : '#E2E8F0',
                  color: activePersona === 'tenant' ? '#059669' : '#64748B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <UserCheck size={16} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <div
                  style={{
                    fontSize: '0.825rem',
                    fontWeight: 800,
                    color: activePersona === 'tenant' ? '#1E293B' : '#64748B',
                    lineHeight: 1.2,
                  }}
                >
                  Tenant / Resident
                </div>
                <div style={{ fontSize: '0.65rem', color: '#94A3B8', fontWeight: 600 }}>Resident</div>
              </div>
            </button>
          </div>

          {/* Quick Auto-Fill Demo Chip */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.6rem 0.85rem',
              borderRadius: '0.75rem',
              backgroundColor: activePersona === 'owner' ? '#F0F7FF' : '#F0FDF4',
              border: `1px solid ${activePersona === 'owner' ? '#BFDBFE' : '#BBF7D0'}`,
              marginBottom: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Sparkles
                size={15}
                color={activePersona === 'owner' ? '#2563EB' : '#16A34A'}
                style={{ flexShrink: 0 }}
              />
              <span
                style={{
                  fontSize: '0.75rem',
                  color: activePersona === 'owner' ? '#1E40AF' : '#166534',
                  fontWeight: 700,
                }}
              >
                Demo: {activePersona === 'owner' ? 'Sunrise Heights (Owner)' : 'Flat 101 (Tenant)'}
              </span>
            </div>
            <button
              type="button"
              onClick={() =>
                handleLoginWithCredentials(
                  activePersona === 'owner' ? 'owner@propertyhub.dev' : 'tenant@propertyhub.dev',
                  'ChangeMe123!'
                )
              }
              disabled={isLoading}
              style={{
                padding: '0.3rem 0.65rem',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: activePersona === 'owner' ? '#2563EB' : '#16A34A',
                color: '#FFFFFF',
                fontSize: '0.7rem',
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'opacity 0.15s ease',
              }}
            >
              1-Tap Login
            </button>
          </div>

          {/* Credential Form */}
          <form onSubmit={handleSubmit} noValidate>
            {/* Email Field */}
            <div style={{ marginBottom: '1rem' }}>
              <label
                htmlFor="email"
                style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: '#334155',
                  marginBottom: '0.35rem',
                }}
              >
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setErrors((p) => ({ ...p, email: '' }))
                  }}
                  disabled={isLoading}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem 0.75rem 2.5rem',
                    fontSize: '0.875rem',
                    color: '#0F172A',
                    backgroundColor: '#F8FAFC',
                    border: errors.email ? '1.5px solid #EF4444' : '1.5px solid #E2E8F0',
                    borderRadius: '0.75rem',
                    outline: 'none',
                    transition: 'all 0.15s ease',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#2563EB')}
                  onBlur={(e) =>
                    (e.target.style.borderColor = errors.email ? '#EF4444' : '#E2E8F0')
                  }
                />
                <Mail
                  size={17}
                  style={{
                    position: 'absolute',
                    left: '0.85rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94A3B8',
                    pointerEvents: 'none',
                  }}
                />
              </div>
              {errors.email && (
                <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.72rem', color: '#EF4444', fontWeight: 600 }}>
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div style={{ marginBottom: '1.35rem' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.35rem',
                }}
              >
                <label
                  htmlFor="password"
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: '#334155',
                  }}
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() =>
                    alert('Demo Accounts Password: ChangeMe123!\nYou can also use the 1-Tap Login button above.')
                  }
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    fontSize: '0.75rem',
                    color: '#2563EB',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Forgot password?
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPwd ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setErrors((p) => ({ ...p, password: '' }))
                  }}
                  disabled={isLoading}
                  style={{
                    width: '100%',
                    padding: '0.75rem 2.6rem 0.75rem 2.5rem',
                    fontSize: '0.875rem',
                    color: '#0F172A',
                    backgroundColor: '#F8FAFC',
                    border: errors.password ? '1.5px solid #EF4444' : '1.5px solid #E2E8F0',
                    borderRadius: '0.75rem',
                    outline: 'none',
                    transition: 'all 0.15s ease',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#2563EB')}
                  onBlur={(e) =>
                    (e.target.style.borderColor = errors.password ? '#EF4444' : '#E2E8F0')
                  }
                />
                <Lock
                  size={17}
                  style={{
                    position: 'absolute',
                    left: '0.85rem',
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
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  aria-label={showPwd ? 'Hide password' : 'Show password'}
                >
                  {showPwd ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {errors.password && (
                <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.72rem', color: '#EF4444', fontWeight: 600 }}>
                  {errors.password}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '0.85rem 1rem',
                borderRadius: '0.75rem',
                border: 'none',
                background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: '0.925rem',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: '0 8px 20px -4px rgba(15, 23, 42, 0.4)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (!isLoading) (e.currentTarget.style.transform = 'translateY(-1px)')
              }}
              onMouseLeave={(e) => {
                if (!isLoading) (e.currentTarget.style.transform = 'translateY(0)')
              }}
            >
              {isLoading ? (
                <div
                  style={{
                    width: 20,
                    height: 20,
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#FFFFFF',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }}
                />
              ) : (
                <>
                  Sign In to Portal <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>

          {/* Super Admin Console (Discrete) */}
          <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
            {!showSuperAdminShortcut ? (
              <button
                type="button"
                onClick={() => setShowSuperAdminShortcut(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '0.72rem',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.3rem 0.6rem',
                  borderRadius: '6px',
                  fontWeight: 600,
                }}
              >
                <KeyRound size={13} /> Root Console Access
              </button>
            ) : (
              <div
                style={{
                  padding: '0.65rem 0.85rem',
                  borderRadius: '0.75rem',
                  background: '#FAF5FF',
                  border: '1px solid #E9D5FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.5rem',
                }}
              >
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#7C3AED' }}>
                    Platform Super Admin
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#6B7280' }}>superadmin@propertyhub.dev</div>
                </div>
                <button
                  type="button"
                  onClick={handleSuperAdminLogin}
                  disabled={isLoading}
                  style={{
                    background: '#7C3AED',
                    border: 'none',
                    color: '#FFFFFF',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    padding: '0.35rem 0.75rem',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  Instant Login
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Trust Indicators */}
        <div
          style={{
            marginTop: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1.5rem',
            color: '#64748B',
            fontSize: '0.75rem',
            fontWeight: 600,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Shield size={14} color="#3B82F6" /> 256-Bit Encrypted
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <CheckCircle2 size={14} color="#10B981" /> 99.9% Uptime
          </div>
        </div>
      </div>
    </div>
  )
}
