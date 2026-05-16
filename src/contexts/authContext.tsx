'use client'

// React Imports
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

// Third-party Imports
import type { AxiosError } from 'axios'

// Type Imports
import type { ChildrenType } from '@core/types'

// Util Imports
import { API_ENDPOINTS } from '@/constants/apiEndpoints'
import { apiClient } from '@/utils/apiClient'
import { authStorage } from '@/utils/authStorage'
import type { AuthSnapshot, AuthUser } from '@/utils/authStorage'

type LoginPayload = {
  username: string
  password: string
}

type ApiAuthResponse = {
  accessToken?: string
  refreshToken?: string
  expiresAtUtc?: string | null
  roles?: string[]
  permissions?: string[]
  instructor?: AuthUser
  avatar?: string
}

type ApiLoginResponse = {
  data?: ApiAuthResponse
  message?: string | string[]
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
  loginWithGoogle: (authorizationCode: string) => Promise<LoginResult>
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

  const persistAuth = useCallback(
    (
      payload: ApiAuthResponse | undefined,
      fallbackUser?: AuthUser,
      errorMessage?: string | string[]
    ): LoginResult => {
      if (!payload?.accessToken || !payload?.refreshToken) {
        return {
          success: false,
          message: errorMessage ?? 'Invalid login response.'
        }
      }

      const user = payload.instructor ?? fallbackUser

      if (!user) {
        return {
          success: false,
          message: errorMessage ?? 'Missing user information in login response.'
        }
      }

      const authSnapshot: AuthSnapshot = {
        accessToken: payload.accessToken,
        refreshToken: payload.refreshToken,
        expiresAtUtc: payload.expiresAtUtc,
        user,
        roles: Array.isArray(payload.roles) ? payload.roles : [],
        permissions: Array.isArray(payload.permissions) ? payload.permissions : []
      }

      authStorage.set(authSnapshot)

      return { success: true }
    },
    []
  )

  const handleLoginError = useCallback((error: unknown): LoginResult => {
    const axiosError = error as AxiosError<ApiLoginResponse>
    const responseMessage = axiosError.response?.data?.message
    const fallbackMessage = axiosError.message || 'Đăng nhập thất bại.'

    return {
      success: false,
      message: responseMessage ?? fallbackMessage
    }
  }, [])

  const login = useCallback(
    async (payload: LoginPayload): Promise<LoginResult> => {
      try {
        const response = await apiClient.post<ApiLoginResponse>(API_ENDPOINTS.auth.password, payload)

        return persistAuth(
          response.data?.data,
          {
            id: payload.username,
            fullName: payload.username,
            email: payload.username
          },
          response.data?.message
        )
      } catch (error) {
        return handleLoginError(error)
      }
    },
    [handleLoginError, persistAuth]
  )

  const loginWithGoogle = useCallback(
    async (authorizationCode: string): Promise<LoginResult> => {
      try {
        const response = await apiClient.post<ApiLoginResponse>(API_ENDPOINTS.auth.google, { authorizationCode })

        return persistAuth(response.data?.data, undefined, response.data?.message)
      } catch (error) {
        return handleLoginError(error)
      }
    },
    [handleLoginError, persistAuth]
  )

  const logout = useCallback(() => {
    authStorage.clear()
    setAuth(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      auth,
      isAuthenticated: Boolean(auth?.accessToken),
      isInitialized,
      login,
      loginWithGoogle,
      logout
    }),
    [auth, isInitialized, login, loginWithGoogle, logout]
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
