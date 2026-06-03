import axios from 'axios'
import type { AxiosError, AxiosRequestConfig } from 'axios'

import { API_ENDPOINTS } from '@/constants/apiEndpoints'
import { authStorage } from './authStorage'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.trim() ?? ''

const baseUrlWithoutTrailingSlash = API_BASE_URL.replace(/\/+$/, '')
const baseUrlHasApiSuffix = baseUrlWithoutTrailingSlash.toLowerCase().endsWith('/api')

const normalizeEndpoint = (endpoint: string) => {
  const trimmed = endpoint.trim()

  if (!trimmed) return trimmed

  if (baseUrlHasApiSuffix && /^\/api(\/|$)/i.test(trimmed)) {
    return trimmed.replace(/^\/api/i, '')
  }

  return trimmed
}

const REFRESH_ENDPOINT = normalizeEndpoint(API_ENDPOINTS.auth.refresh)

const apiClient = axios.create({
  baseURL: API_BASE_URL
})

const refreshClient = axios.create({
  baseURL: API_BASE_URL
})

type RetryConfig = AxiosRequestConfig & { _retry?: boolean }

let refreshPromise: Promise<void> | null = null

const fetchNewTokens = async () => {
  const stored = authStorage.get()

  if (!stored?.refreshToken) {
    throw new Error('Missing refresh token')
  }

  const response = await refreshClient.post(REFRESH_ENDPOINT, {
    refreshToken: stored.refreshToken
  })

  const payload = response.data?.data

  if (!payload?.accessToken) {
    throw new Error('Invalid refresh response')
  }

  authStorage.updateTokens({
    accessToken: payload.accessToken,
    refreshToken: payload.refreshToken,
    expiresAtUtc: payload.expiresAtUtc
  })
}

refreshClient.interceptors.request.use(config => {
  config.url = normalizeEndpoint(config.url ?? '')
  
return config
})

apiClient.interceptors.request.use(config => {
  config.url = normalizeEndpoint(config.url ?? '')

  const auth = authStorage.get()

  if (auth?.accessToken) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${auth.accessToken}`
  }

  return config
})

apiClient.interceptors.response.use(
  response => response,
  async error => {
    const axiosError = error as AxiosError
    const response = axiosError.response
    const originalRequest = (error.config || {}) as RetryConfig

    // Handle 401 — try to refresh token and retry
    if (response?.status === 401 && !originalRequest._retry) {
      const requestUrl = normalizeEndpoint(originalRequest.url ?? '')
      const isRefreshRequest = requestUrl === REFRESH_ENDPOINT

      if (!isRefreshRequest) {
        originalRequest._retry = true

        try {
          refreshPromise = refreshPromise ?? fetchNewTokens()
          await refreshPromise
          refreshPromise = null

          const auth = authStorage.get()

          if (auth?.accessToken) {
            originalRequest.headers = originalRequest.headers ?? {}
            originalRequest.headers.Authorization = `Bearer ${auth.accessToken}`

            return apiClient(originalRequest)
          }
        } catch (refreshError) {
          refreshPromise = null
          authStorage.clear()
        }
      }
    }

    // For HTTP errors that have a response body (4xx, 5xx), return as resolved
    // so service methods can handle them gracefully without throwing.
    // The backend always returns { isSuccess: false, message: "..." } for errors.
    if (response) {
      return {
        data: response.data ?? { isSuccess: false, message: `Lỗi ${response.status}` },
        status: response.status,
        headers: response.headers,
        config: error.config
      }
    }

    // Network errors (no response from server) — still reject
    return Promise.reject(error)
  }
)

export { apiClient }
