import { API_ENDPOINTS } from '@/constants/apiEndpoints'
import type {
  MiniAppLinkClassOptionType,
  MiniAppLinkedPhoneType,
  MiniAppManagedStudentPagedType,
  MiniAppManagedStudentRowType
} from '@/types/apps/miniAppLinkTypes'
import type { ResponseResult } from '@/types/common'
import { apiClient } from '@/utils/apiClient'
import { apiGet, apiMutate } from '@/utils/serviceHelper'
import { logger } from '@/utils/logger'

const toNumber = (value: unknown): number => {
  const parsed = Number(value)

  return Number.isFinite(parsed) ? parsed : 0
}

const mapClassOption = (value: any): MiniAppLinkClassOptionType => ({
  classId: value?.classId ?? value?.ClassId ?? '',
  classCode: value?.classCode ?? value?.ClassCode ?? '',
  className: value?.className ?? value?.ClassName ?? '',
  branchName: value?.branchName ?? value?.BranchName ?? '',
  studentCount: toNumber(value?.studentCount ?? value?.StudentCount)
})

const mapLinkedPhone = (value: any): MiniAppLinkedPhoneType => ({
  id: value?.id ?? value?.Id ?? '',
  phoneNumber: value?.phoneNumber ?? value?.PhoneNumber ?? '',
  createdAt: value?.createdAt ?? value?.CreatedAt ?? '',
  updatedAt: value?.updatedAt ?? value?.UpdatedAt ?? null
})

const mapStudentClass = (value: any) => ({
  classId: value?.classId ?? value?.ClassId ?? '',
  classCode: value?.classCode ?? value?.ClassCode ?? '',
  className: value?.className ?? value?.ClassName ?? '',
  branchName: value?.branchName ?? value?.BranchName ?? ''
})

const mapStudentRow = (value: any): MiniAppManagedStudentRowType => ({
  studentId: value?.studentId ?? value?.StudentId ?? '',
  studentCode: value?.studentCode ?? value?.StudentCode ?? null,
  studentName: value?.studentName ?? value?.StudentName ?? '',
  primaryPhoneNumber: value?.primaryPhoneNumber ?? value?.PrimaryPhoneNumber ?? null,
  classes: Array.isArray(value?.classes ?? value?.Classes) ? (value?.classes ?? value?.Classes).map(mapStudentClass) : [],
  linkedPhones: Array.isArray(value?.linkedPhones ?? value?.LinkedPhones)
    ? (value?.linkedPhones ?? value?.LinkedPhones).map(mapLinkedPhone)
    : []
})

const unwrapPaged = (value: any): MiniAppManagedStudentPagedType => {
  const rawRecords = value?.records ?? value?.Records ?? []

  return {
    totalRecords: toNumber(value?.totalRecords ?? value?.TotalRecords),
    records: Array.isArray(rawRecords) ? rawRecords.map(mapStudentRow) : []
  }
}

class MiniAppLinkService {
  async getClasses(): Promise<ResponseResult<MiniAppLinkClassOptionType[]>> {
    return apiGet(
      () => apiClient.get<any>(API_ENDPOINTS.miniAppLinks.classes),
      data => (Array.isArray(data) ? data.map(mapClassOption) : [])
    ) as unknown as Promise<ResponseResult<MiniAppLinkClassOptionType[]>>
  }

  async getStudentsPaged(params?: {
    classId?: string
    keyword?: string
    pageNumber?: number
    pageSize?: number
  }): Promise<ResponseResult<MiniAppManagedStudentPagedType>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.miniAppLinks.students, { params })
      const apiResponse = response.data

      if (!apiResponse?.isSuccess) {
        return { success: false, message: apiResponse?.message, data: { totalRecords: 0, records: [] } }
      }

      return { success: true, data: unwrapPaged(apiResponse.data), message: apiResponse?.message }
    } catch (error: any) {
      logger.error('MiniAppLinkService', 'getStudentsPaged', error)

      return {
        success: false,
        message: error?.response?.data?.message || 'Lỗi kết nối máy chủ',
        data: { totalRecords: 0, records: [] }
      }
    }
  }

  async createLink(payload: { studentId: string; phoneNumber: string }): Promise<ResponseResult<MiniAppLinkedPhoneType>> {
    return apiMutate(
      () => apiClient.post<any>(API_ENDPOINTS.miniAppLinks.root, payload),
      data => mapLinkedPhone(data)
    )
  }

  async updateLink(id: string, payload: { phoneNumber: string }): Promise<ResponseResult<MiniAppLinkedPhoneType>> {
    return apiMutate(
      () => apiClient.put<any>(API_ENDPOINTS.miniAppLinks.byId(id), payload),
      data => mapLinkedPhone(data)
    )
  }

  async deleteLink(id: string): Promise<ResponseResult<void>> {
    return apiMutate(() => apiClient.delete<any>(API_ENDPOINTS.miniAppLinks.byId(id)))
  }
}

export default new MiniAppLinkService()
