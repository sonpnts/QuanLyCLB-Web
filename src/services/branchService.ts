import { apiClient } from '@/utils/apiClient'
import type { ResponseResult } from '@/types/common'
import { API_ENDPOINTS } from '@/constants/apiEndpoints'
import { apiList, apiGet, apiMutate, extractList } from '@/utils/serviceHelper'

// Type Imports
import type { BranchType, GetBranchesParams, CreateBranchRequest, UpdateBranchRequest } from '@/types/apps/branchTypes'

// Re-export types for backward compatibility
export type { BranchType, GetBranchesParams, CreateBranchRequest, UpdateBranchRequest }

// API Types
export interface ApiBranchResponse {
  id: string
  name?: string
  address?: string
  latitude: number
  longitude: number
  allowedRadiusMeters: number
  googleMapsEmbedUrl?: string
  tuitionFee: number
  isActive?: boolean
  createdAt?: string
  updatedAt?: string | null
  createdByUserId?: string | null
  updatedByUserId?: string | null
}

const toBranch = (apiBranch: ApiBranchResponse): BranchType => ({
  id: apiBranch.id,
  name: apiBranch.name || '',
  address: apiBranch.address,
  latitude: apiBranch.latitude,
  longitude: apiBranch.longitude,
  allowedRadiusMeters: apiBranch.allowedRadiusMeters,
  googleMapsEmbedUrl: apiBranch.googleMapsEmbedUrl,
  tuitionFee: apiBranch.tuitionFee,
  isActive: apiBranch.isActive ?? true,
  createdDate: apiBranch.createdAt,
  createdBy: apiBranch.createdByUserId || undefined,
  updatedDate: apiBranch.updatedAt || undefined,
  updatedBy: apiBranch.updatedByUserId || undefined
})

class BranchService {
  async getBranches(params?: GetBranchesParams): Promise<ResponseResult<BranchType[]>> {
    return apiList(
      () => apiClient.get<any>(API_ENDPOINTS.branches.root, { params }),
      data => extractList<ApiBranchResponse>(data).map(toBranch)
    )
  }

  async getBranchById(id: string): Promise<ResponseResult<BranchType>> {
    return apiGet(
      () => apiClient.get<any>(API_ENDPOINTS.branches.byId(id)),
      toBranch
    )
  }

  async createBranch(data: CreateBranchRequest): Promise<ResponseResult<BranchType>> {
    return apiMutate(
      () => apiClient.post<any>(API_ENDPOINTS.branches.root, data),
      toBranch
    )
  }

  async updateBranch(id: string, data: UpdateBranchRequest): Promise<ResponseResult<BranchType>> {
    return apiMutate(
      () => apiClient.put<any>(API_ENDPOINTS.branches.byId(id), data),
      toBranch
    )
  }

  async deleteBranch(id: string): Promise<ResponseResult<void>> {
    return apiMutate(
      () => apiClient.delete<any>(API_ENDPOINTS.branches.byId(id))
    )
  }

  async restoreBranch(id: string): Promise<ResponseResult<BranchType>> {
    return apiMutate(
      () => apiClient.post<any>(API_ENDPOINTS.branches.restore(id)),
      toBranch
    )
  }
}

export default new BranchService()
