import { apiClient } from '@/utils/apiClient'
import { API_ENDPOINTS } from '@/constants/apiEndpoints'
import { apiList, apiGet, apiMutate } from '@/utils/serviceHelper'
import type { ResponseResult } from '@/types/common'
import type {
  InstructorClassSalaryType,
  CreateInstructorClassSalaryRequest,
  UpdateInstructorClassSalaryRequest,
} from '@/types/apps/instructorClassSalaryTypes'

const toSalary = (d: any): InstructorClassSalaryType => ({
  id: d.id,
  userId: d.userId,
  userName: d.userName,
  classId: d.classId,
  className: d.className,
  role: d.role,
  salaryType: d.salaryType,
  rate: d.rate,
  notes: d.notes,
  isActive: d.isActive,
  createdAt: d.createdAt,
  updatedAt: d.updatedAt,
})

const instructorClassSalaryService = {
  async getAll(params?: { userId?: string; classId?: string }): Promise<ResponseResult<InstructorClassSalaryType[]>> {
    return apiList(
      () => apiClient.get<any>(API_ENDPOINTS.instructorClassSalaries.root, { params }),
      (data) => (Array.isArray(data) ? data : data?.records || []).map(toSalary)
    )
  },

  async getById(id: string): Promise<ResponseResult<InstructorClassSalaryType>> {
    return apiGet(
      () => apiClient.get<any>(API_ENDPOINTS.instructorClassSalaries.byId(id)),
      toSalary
    )
  },

  async create(data: CreateInstructorClassSalaryRequest): Promise<ResponseResult<InstructorClassSalaryType>> {
    return apiMutate(
      () => apiClient.post<any>(API_ENDPOINTS.instructorClassSalaries.root, data),
      toSalary
    )
  },

  async update(id: string, data: UpdateInstructorClassSalaryRequest): Promise<ResponseResult<InstructorClassSalaryType>> {
    return apiMutate(
      () => apiClient.put<any>(API_ENDPOINTS.instructorClassSalaries.byId(id), data),
      toSalary
    )
  },

  async delete(id: string): Promise<ResponseResult<void>> {
    return apiMutate(
      () => apiClient.delete<any>(API_ENDPOINTS.instructorClassSalaries.byId(id))
    )
  },
}

export default instructorClassSalaryService
