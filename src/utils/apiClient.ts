import axios from 'axios'
import type { AxiosError, AxiosRequestConfig } from 'axios'

import { authStorage } from './authStorage'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? ''
const REFRESH_ENDPOINT = process.env.NEXT_PUBLIC_REFRESH_ENDPOINT ?? '/auth/refresh'

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

apiClient.interceptors.request.use(config => {
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
    const response = (error as AxiosError).response
    const originalRequest = (error.config || {}) as RetryConfig

    if (response?.status === 401 && !originalRequest._retry) {

      const requestUrl = originalRequest.url ?? ''

      const isRefreshRequest =
        requestUrl === REFRESH_ENDPOINT ||
        requestUrl === `${API_BASE_URL}${REFRESH_ENDPOINT}`

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

    return Promise.reject(error)
  }
)

export default apiClient
