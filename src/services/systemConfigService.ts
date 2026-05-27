import { apiClient } from '@/utils/apiClient'
import { API_ENDPOINTS } from '@/constants/apiEndpoints'
import { apiList, apiGet, apiMutate } from '@/utils/serviceHelper'
import type { ResponseResult } from '@/types/common'
import type { SystemConfigType } from '@/types/apps/systemConfigTypes'

const toConfig = (d: any): SystemConfigType => ({
  keyName: d.keyName,
  value: d.value,
  description: d.description,
  createdAt: d.createdAt,
  updatedAt: d.updatedAt,
})

const systemConfigService = {
  async getAll(): Promise<ResponseResult<SystemConfigType[]>> {
    return apiList(
      () => apiClient.get<any>(API_ENDPOINTS.systemConfig.root),
      (data) => {
        // Backend trả về mảng SystemConfigDto[]
        if (Array.isArray(data)) return data.map(toConfig)


        // Fallback: nếu vẫn là dict { key: value } (API cũ) thì chuyển đổi
        if (data && typeof data === 'object' && !data.records) {
          return Object.entries(data as Record<string, string>).map(([k, v]) => ({
            keyName: k,
            value: v,
            description: undefined,
            createdAt: '',
            updatedAt: undefined,
          } as SystemConfigType))
        }

        
return (data?.records || []).map(toConfig)
      }
    )
  },

  async getByKey(key: string): Promise<ResponseResult<SystemConfigType>> {
    return apiGet(
      () => apiClient.get<any>(API_ENDPOINTS.systemConfig.byKey(key)),
      toConfig
    )
  },

  async upsert(keyName: string, value: string, description?: string): Promise<ResponseResult<SystemConfigType>> {
    return apiMutate(
      () => apiClient.post<any>(API_ENDPOINTS.systemConfig.root, { keyName, value, description }),
      toConfig
    )
  },

  async delete(key: string): Promise<ResponseResult<void>> {
    return apiMutate(
      () => apiClient.delete<any>(API_ENDPOINTS.systemConfig.byKey(key))
    )
  },
}

export default systemConfigService
