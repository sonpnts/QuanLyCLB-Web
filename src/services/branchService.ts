import apiClient from '@/utils/apiClient'

// API Types
export interface GetBranchesParams {
  MinLatitude?: number
  MaxLatitude?: number
  MinLongitude?: number
  MaxLongitude?: number
  CreatedDate?: string // DateTime format
  CreatedBy?: string
  UpdatedDate?: string // DateTime format
  UpdatedBy?: string
  IsActive?: boolean
  Keyword?: string
  PageSize?: number
  PageNumber?: number
}

export interface CreateBranchRequest {
  name?: string
  address?: string
  latitude: number
  longitude: number
  allowedRadiusMeters: number
  googleMapsEmbedUrl?: string
}

export interface UpdateBranchRequest {
  name?: string
  address?: string
  latitude?: number
  longitude?: number
  allowedRadiusMeters?: number
  googleMapsEmbedUrl?: string
  isActive?: boolean
}

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

export interface BranchType {
  id: string
  name: string
  address?: string
  latitude: number
  longitude: number
  allowedRadiusMeters: number
  googleMapsEmbedUrl?: string
  isActive: boolean
  createdDate?: string
  createdBy?: string
  updatedDate?: string
  updatedBy?: string
}

export interface ResponseResult<T = any> {
  success: boolean
  data?: T
  message?: string
  errors?: string[]
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





