import { apiClient } from '@/utils/apiClient'
import type { ResponseResult } from '@/types/common'

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
  isActive?: boolean
  createdAt?: string
  updatedAt?: string | null
  createdByUserId?: string | null
  updatedByUserId?: string | null
}

class BranchService {
  private mapApiBranchToBranchType(apiBranch: ApiBranchResponse): BranchType {
    return {
      id: apiBranch.id,
      name: apiBranch.name || '',
      address: apiBranch.address,
      latitude: apiBranch.latitude,
      longitude: apiBranch.longitude,
      allowedRadiusMeters: apiBranch.allowedRadiusMeters,
      googleMapsEmbedUrl: apiBranch.googleMapsEmbedUrl,
      isActive: apiBranch.isActive ?? true,
      createdDate: apiBranch.createdAt,
      createdBy: apiBranch.createdByUserId || undefined,
      updatedDate: apiBranch.updatedAt || undefined,
      updatedBy: apiBranch.updatedByUserId || undefined
    }
  }

  async getBranches(params?: GetBranchesParams): Promise<ResponseResult<BranchType[]>> {
    const response = await apiClient.get<any>('/api/Branches', { params })
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return {
        success: false,
        data: [],
        message: apiResponse.message
      }
    }

    const records: ApiBranchResponse[] = apiResponse.data?.records || []
    const branches = records.map(this.mapApiBranchToBranchType)

    return {
      success: true,
      data: branches
    }
  }

  async getBranchById(id: string): Promise<ResponseResult<BranchType>> {
    const response = await apiClient.get<any>(`/api/Branches/${id}`)
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return {
        success: false,
        message: apiResponse.message
      }
    }

    const branchData = this.mapApiBranchToBranchType(apiResponse.data)

    return {
      success: true,
      data: branchData
    }
  }

  async createBranch(data: CreateBranchRequest): Promise<ResponseResult<BranchType>> {
    const response = await apiClient.post<any>('/api/Branches', data)
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return {
        success: false,
        message: apiResponse.message
      }
    }

    const branchData = this.mapApiBranchToBranchType(apiResponse.data)

    return {
      success: true,
      data: branchData,
      message: apiResponse.message
    }
  }

  async updateBranch(id: string, data: UpdateBranchRequest): Promise<ResponseResult<BranchType>> {
    const response = await apiClient.put<any>(`/api/Branches/${id}`, data)
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return {
        success: false,
        message: apiResponse.message
      }
    }

    const branchData = this.mapApiBranchToBranchType(apiResponse.data)

    return {
      success: true,
      data: branchData,
      message: apiResponse.message
    }
  }

  async deleteBranch(id: string): Promise<ResponseResult<void>> {
    const response = await apiClient.delete<any>(`/api/Branches/${id}`)
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return {
        success: false,
        message: apiResponse.message
      }
    }

    return {
      success: true,
      message: apiResponse.message
    }
  }

  async restoreBranch(id: string): Promise<ResponseResult<BranchType>> {
    const response = await apiClient.post<any>(`/api/Branches/${id}/restore`)
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return {
        success: false,
        message: apiResponse.message
      }
    }

    const branchData = this.mapApiBranchToBranchType(apiResponse.data)

    return {
      success: true,
      data: branchData,
      message: apiResponse.message
    }
  }
}

export default new BranchService()
