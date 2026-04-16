import { apiClient } from '@/utils/apiClient'
import type { BeltLevelType } from '@/types/apps/beltExamTypes'
import type { ResponseResult } from '@/types/common'
import { API_ENDPOINTS } from '@/constants/apiEndpoints'
import { apiList, apiGet, apiMutate, extractList } from '@/utils/serviceHelper'

// Query parameters for GET /api/belt-levels
export interface GetBeltLevelsParams {
  pageNumber?: number
  pageSize?: number
  keyword?: string
}

// Request body for POST /api/belt-levels
export interface CreateBeltLevelRequest {
  name: string
  order: number
  description?: string
  colorCode?: string
}

// Request body for PUT /api/belt-levels/{id}
export interface UpdateBeltLevelRequest {
  name?: string
  order?: number
  description?: string
  colorCode?: string
}

class BeltLevelService {
  async getBeltLevels(params?: GetBeltLevelsParams): Promise<ResponseResult<BeltLevelType[]>> {
    return apiList(
      () => apiClient.get<any>(API_ENDPOINTS.beltLevels.root, { params }),
      data => extractList<BeltLevelType>(data)
    )
  }

  async getBeltLevelById(id: string): Promise<ResponseResult<BeltLevelType>> {
    return apiGet(
      () => apiClient.get<any>(API_ENDPOINTS.beltLevels.byId(id)),
      data => data as BeltLevelType
    )
  }

  async createBeltLevel(data: CreateBeltLevelRequest): Promise<ResponseResult<BeltLevelType>> {
    return apiMutate(
      () => apiClient.post<any>(API_ENDPOINTS.beltLevels.root, data),
      d => d as BeltLevelType
    )
  }

  async updateBeltLevel(id: string, data: UpdateBeltLevelRequest): Promise<ResponseResult<BeltLevelType>> {
    return apiMutate(
      () => apiClient.put<any>(API_ENDPOINTS.beltLevels.byId(id), data),
      d => d as BeltLevelType
    )
  }

  async deleteBeltLevel(id: string): Promise<ResponseResult<void>> {
    return apiMutate(
      () => apiClient.delete<any>(API_ENDPOINTS.beltLevels.byId(id))
    )
  }
}

const beltLevelService = new BeltLevelService()
export default beltLevelService
