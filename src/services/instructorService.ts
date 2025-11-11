import { apiClient } from '@/utils/apiClient'
import type { ResponseResult } from '@/types/common'

export interface GetInstructorsParams {
  SkillLevel?: string
  Certification?: string
  IsLeadCoach?: boolean
  CreatedDate?: string
  CreatedBy?: string
  UpdatedDate?: string
  UpdatedBy?: string
  IsActive?: boolean
  Keyword?: string
  PageSize?: number
  PageNumber?: number
}

export interface CreateInstructorRequest {
  fullName?: string
  email?: string
  phoneNumber?: string
  skillLevel?: string
  certification?: string
}

export interface UpdateInstructorRequest {
  fullName?: string
  phoneNumber?: string
  skillLevel?: string
  certification?: string
  isActive?: boolean
}

export interface ApiInstructorResponse {
  id: string
  fullName?: string
  email?: string
  phoneNumber?: string
  skillLevel?: string
  certification?: string
  isActive?: boolean
  createdAt?: string
  updatedAt?: string | null
  createdByUserId?: string | null
  updatedByUserId?: string | null
}

export interface InstructorType {
  id: string
  fullName: string
  email?: string
  phoneNumber?: string
  skillLevel?: string
  certification?: string
  isActive: boolean
  createdDate?: string
  createdBy?: string
  updatedDate?: string
  updatedBy?: string
}

class InstructorService {
  private mapApiInstructorToInstructorType(apiInstructor: ApiInstructorResponse): InstructorType {
    return {
      id: apiInstructor.id,
      fullName: apiInstructor.fullName || '',
      email: apiInstructor.email,
      phoneNumber: apiInstructor.phoneNumber,
      skillLevel: apiInstructor.skillLevel,
      certification: apiInstructor.certification,
      isActive: apiInstructor.isActive ?? true,
      createdDate: apiInstructor.createdAt,
      createdBy: apiInstructor.createdByUserId || undefined,
      updatedDate: apiInstructor.updatedAt || undefined,
      updatedBy: apiInstructor.updatedByUserId || undefined
    }
  }

  async getInstructors(params?: GetInstructorsParams): Promise<ResponseResult<InstructorType[]>> {
    const response = await apiClient.get<any>('/api/Instructors', { params })
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return {
        success: false,
        data: [],
        message: apiResponse.message
      }
    }

    const records: ApiInstructorResponse[] = apiResponse.data?.records || []
    const instructors = records.map(this.mapApiInstructorToInstructorType)

    return {
      success: true,
      data: instructors
    }
  }

  async getInstructorById(id: string): Promise<ResponseResult<InstructorType>> {
    const response = await apiClient.get<any>(`/api/Instructors/${id}`)
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return {
        success: false,
        message: apiResponse.message
      }
    }

    const instructorData = this.mapApiInstructorToInstructorType(apiResponse.data)

    return {
      success: true,
      data: instructorData
    }
  }

  async createInstructor(data: CreateInstructorRequest): Promise<ResponseResult<InstructorType>> {
    const response = await apiClient.post<any>('/api/Instructors', data)
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return {
        success: false,
        message: apiResponse.message
      }
    }

    const instructorData = this.mapApiInstructorToInstructorType(apiResponse.data)

    return {
      success: true,
      data: instructorData,
      message: apiResponse.message
    }
  }

  async updateInstructor(id: string, data: UpdateInstructorRequest): Promise<ResponseResult<InstructorType>> {
    const response = await apiClient.put<any>(`/api/Instructors/${id}`, data)
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return {
        success: false,
        message: apiResponse.message
      }
    }

    const instructorData = this.mapApiInstructorToInstructorType(apiResponse.data)

    return {
      success: true,
      data: instructorData,
      message: apiResponse.message
    }
  }

  async deleteInstructor(id: string): Promise<ResponseResult<void>> {
    const response = await apiClient.delete<any>(`/api/Instructors/${id}`)
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

  async restoreInstructor(id: string): Promise<ResponseResult<InstructorType>> {
    const response = await apiClient.post<any>(`/api/Instructors/${id}/restore`)
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return {
        success: false,
        message: apiResponse.message
      }
    }

    const instructorData = this.mapApiInstructorToInstructorType(apiResponse.data)

    return {
      success: true,
      data: instructorData,
      message: apiResponse.message
    }
  }
}

export default new InstructorService()





