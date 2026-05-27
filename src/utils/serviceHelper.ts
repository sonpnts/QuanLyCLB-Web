import type { ResponseResult } from '@/types/common'
import { logger } from '@/utils/logger'

/**
 * Wraps an API list call: on failure returns { success: true, data: [] } (no error shown to user)
 */
export async function apiList<T>(
  fetchFn: () => Promise<any>,
  mapFn: (data: any) => T[],
  context?: { className?: string; method?: string }
): Promise<ResponseResult<T[]>> {
  try {
    const response = await fetchFn()
    const api = response.data

    if (!api?.isSuccess) return { success: true, data: [] }
    
return { success: true, data: mapFn(api.data) }
  } catch (error) {
    logger.error(context?.className ?? 'serviceHelper', context?.method ?? 'apiList', error)
    
return { success: true, data: [] }
  }
}

/**
 * Wraps an API single-item GET: on failure returns { success: false, message }
 */
export async function apiGet<T>(
  fetchFn: () => Promise<any>,
  mapFn: (data: any) => T,
  context?: { className?: string; method?: string }
): Promise<ResponseResult<T>> {
  try {
    const response = await fetchFn()
    const api = response.data

    if (!api?.isSuccess) return { success: false, message: api?.message }
    
return { success: true, data: mapFn(api.data) }
  } catch (error: any) {
    logger.error(context?.className ?? 'serviceHelper', context?.method ?? 'apiGet', error)
    
return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
  }
}

/**
 * Wraps a mutation (POST/PUT/DELETE): on failure returns { success: false, message }
 */
export async function apiMutate<T = void>(
  fetchFn: () => Promise<any>,
  mapFn?: (data: any) => T,
  context?: { className?: string; method?: string }
): Promise<ResponseResult<T>> {
  try {
    const response = await fetchFn()
    const api = response.data

    if (!api?.isSuccess) return { success: false, message: api?.message }
    
return { success: true, data: mapFn ? mapFn(api.data) : (undefined as T), message: api?.message }
  } catch (error: any) {
    logger.error(context?.className ?? 'serviceHelper', context?.method ?? 'apiMutate', error)
    
return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
  }
}

/**
 * Extract list data from various API response shapes
 */
export function extractList<T>(data: any): T[] {
  if (!data) return []
  if (Array.isArray(data)) return data as T[]
  
return data.records || data.items || data.data || []
}
