import { useEffect, useRef, useCallback, useState } from 'react'

interface UseDataLoaderOptions<T, P> {
  fetchFn: (params: P) => Promise<{ success: boolean; data?: T; message?: string }>
  params: P
  onError?: (message: string) => void
  enabled?: boolean
}

export function useDataLoader<T, P>({ fetchFn, params, onError, enabled = true }: UseDataLoaderOptions<T, P>) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Refs để tránh duplicate calls
  const loadedRef = useRef(false)
  const currentParamsRef = useRef<string>('')
  const abortControllerRef = useRef<AbortController | null>(null)

  const load = useCallback(async () => {
    const paramsKey = JSON.stringify(params)

    // Tránh load lại nếu params không đổi
    if (loadedRef.current && currentParamsRef.current === paramsKey) {
      return
    }

    // Cancel request trước đó nếu có
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    abortControllerRef.current = new AbortController()

    try {
      setLoading(true)
      setError(null)
      currentParamsRef.current = paramsKey
      loadedRef.current = true

      const response = await fetchFn(params)

      if (response.success && response.data !== undefined) {
        setData(response.data)
      } else {
        const errorMsg = response.message || 'Không thể tải dữ liệu'
        setError(errorMsg)
        onError?.(errorMsg)
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        const errorMsg = 'Đã có lỗi khi tải dữ liệu'
        setError(errorMsg)
        onError?.(errorMsg)
      }
    } finally {
      setLoading(false)
    }
  }, [fetchFn, params, onError])

  useEffect(() => {
    if (enabled) {
      load()
    }

    return () => {
      abortControllerRef.current?.abort()
    }
  }, [load, enabled])

  // Reset để cho phép reload
  const reset = useCallback(() => {
    loadedRef.current = false
    currentParamsRef.current = ''
  }, [])

  // Force reload
  const reload = useCallback(() => {
    reset()
    load()
  }, [reset, load])

  return { data, setData, loading, error, reload, reset }
}

// Hook đơn giản hơn cho việc load 1 lần
export function useOnceLoader<T>(fetchFn: () => Promise<{ success: boolean; data?: T; message?: string }>) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const loadedRef = useRef(false)

  useEffect(() => {
    if (loadedRef.current) return

    const load = async () => {
      try {
        loadedRef.current = true
        setLoading(true)
        const response = await fetchFn()
        if (response.success && response.data !== undefined) {
          setData(response.data)
        }
      } catch (error) {
        console.error('Error loading data:', error)
        loadedRef.current = false // Cho phép retry nếu lỗi
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [fetchFn])

  return { data, loading }
}
