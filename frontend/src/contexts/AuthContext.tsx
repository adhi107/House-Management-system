import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { User, UserRole } from '../types'
import { authApi } from '../api/client'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isSuperAdmin: boolean
  isOwner: boolean
  isTenant: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<User>
  logout: () => Promise<void>
  updateUser: (user: Partial<User>) => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const isAuthenticated = !!user
  const isSuperAdmin = user?.role === 'super_admin'
  const isOwner = user?.role === 'owner'
  const isTenant = user?.role === 'tenant'

  // Restore session on mount
  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem('access_token')
      const storedUser = localStorage.getItem('user')
      if (!token) {
        setIsLoading(false)
        return
      }
      try {
        if (storedUser) {
          setUser(JSON.parse(storedUser))
        }
        const { data } = await authApi.getMe()
        const userData: User = data
        setUser(userData)
        localStorage.setItem('user', JSON.stringify(userData))
      } catch {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user')
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }
    restoreSession()
  }, [])

  const login = useCallback(async (email: string, password: string): Promise<User> => {
    const res = await authApi.login({ email, password })
    const { access_token, refresh_token } = res.data
    localStorage.setItem('access_token', access_token)
    localStorage.setItem('refresh_token', refresh_token)

    const { data: userData } = await authApi.getMe()
    setUser(userData)
    localStorage.setItem('user', JSON.stringify(userData))
    return userData
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch {
      // Silent fail
    } finally {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')
      setUser(null)
    }
  }, [])

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev
      const updated = { ...prev, ...updates }
      localStorage.setItem('user', JSON.stringify(updated))
      return updated
    })
  }, [])

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isSuperAdmin, isOwner, isTenant, isLoading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
