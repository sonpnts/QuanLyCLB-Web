'use client'

// React Imports
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

// Third-party Imports
import type { AxiosError } from 'axios'

// Type Imports
import type { ChildrenType } from '@core/types'

// Util Imports
import apiClient from '@/utils/apiClient'
import { authStorage } from '@/utils/authStorage'
import type { AuthSnapshot } from '@/utils/authStorage'

const LOGIN_ENDPOINT = process.env.NEXT_PUBLIC_LOGIN_ENDPOINT ?? '/api/Auth/google'

type LoginPayload = {
  email: string
  password: string
}

type LoginResult =
  | {
      success: true
    }
  | {
      success: false
      message?: string | string[]
    }

type AuthContextValue = {
  auth: AuthSnapshot | null
  isAuthenticated: boolean
  isInitialized: boolean
  login: (payload: LoginPayload) => Promise<LoginResult>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export const AuthProvider = ({ children }: ChildrenType) => {
  const [auth, setAuth] = useState<AuthSnapshot | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    const stored = authStorage.get()

    if (stored) {
      setAuth(stored)
    }

    setIsInitialized(true)

    const unsubscribe = authStorage.subscribe(value => {
      setAuth(value)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const login = useCallback(async (payload: LoginPayload): Promise<LoginResult> => {
    try {
      const response = await apiClient.post(LOGIN_ENDPOINT, payload)
      const data = response.data?.data

      if (!data?.accessToken || !data?.refreshToken) {
        return {
          success: false,
          message: response.data?.message ?? 'Invalid login response.'
        }
      }

      const instructor = data.instructor ?? {
        id: payload.email,
        fullName: payload.email,
        email: payload.email
      }

      const authSnapshot: AuthSnapshot = {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresAtUtc: data.expiresAtUtc,
        user: instructor,
        roles: Array.isArray(data.roles) ? data.roles : []
      }

      authStorage.set(authSnapshot)

      return { success: true }
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string | string[] }>
      const responseMessage = axiosError.response?.data?.message
      const fallbackMessage = axiosError.message || 'Login failed.'

      return {
        success: false,
        message: responseMessage ?? fallbackMessage
      }
    }
  }, [])

  const logout = useCallback(() => {
    authStorage.clear()
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      auth,
      isAuthenticated: Boolean(auth?.accessToken),
      isInitialized,
      login,
      logout
    }),
    [auth, isInitialized, login, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}
