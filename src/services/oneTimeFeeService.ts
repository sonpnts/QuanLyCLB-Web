import { apiClient } from '@/utils/apiClient'
import type { ResponseResult } from '@/types/common'
import { API_ENDPOINTS } from '@/constants/apiEndpoints'
import { apiList, apiMutate } from '@/utils/serviceHelper'
import type {
  FeeDefinitionType,
  FeePriceType,
  OneTimeFeeOptionType,
  StudentOneTimeFeeStatusType,
  UpsertFeePriceRequest
} from '@/types/apps/oneTimeFeeTypes'

class OneTimeFeeService {
  async getOptions(studentId: string, classId: string): Promise<ResponseResult<OneTimeFeeOptionType[]>> {
    return apiList(
      () => apiClient.get<any>(API_ENDPOINTS.oneTimeFees.options, { params: { studentId, classId } }),
      data =>
        (Array.isArray(data) ? data : []).map((item: any) => ({
          feeCode: item.feeCode ?? item.FeeCode ?? '',
          feeName: item.feeName ?? item.FeeName ?? '',
          amount: Number(item.amount ?? item.Amount ?? 0),
          scopeType: item.scopeType ?? item.ScopeType ?? 'Global',
          scopeId: item.scopeId ?? item.ScopeId ?? null,
          isPaid: Boolean(item.isPaid ?? item.IsPaid)
        }))
    )
  }

  async getStudentStatuses(studentId: string): Promise<ResponseResult<StudentOneTimeFeeStatusType[]>> {
    return apiList(
      () => apiClient.get<any>(API_ENDPOINTS.oneTimeFees.studentStatuses(studentId)),
      data => (Array.isArray(data) ? data : [])
    )
  }

  async getDefinitions(): Promise<ResponseResult<FeeDefinitionType[]>> {
    return apiList(
      () => apiClient.get<any>(API_ENDPOINTS.oneTimeFees.definitions),
      data => (Array.isArray(data) ? data : [])
    )
  }

  async updateDefinition(feeCode: string, payload: Pick<FeeDefinitionType, 'name' | 'description' | 'isRequiredForExam' | 'isActive'>) {
    return apiMutate(
      () => apiClient.put<any>(API_ENDPOINTS.oneTimeFees.updateDefinition(feeCode), payload),
      data => data as FeeDefinitionType
    )
  }

  async getPrices(): Promise<ResponseResult<FeePriceType[]>> {
    return apiList(
      () => apiClient.get<any>(API_ENDPOINTS.oneTimeFees.prices),
      data => (Array.isArray(data) ? data : [])
    )
  }

  async upsertPrice(req: UpsertFeePriceRequest): Promise<ResponseResult<FeePriceType>> {
    return apiMutate(
      () => apiClient.post<any>(API_ENDPOINTS.oneTimeFees.upsertPrice, req),
      data => data as FeePriceType
    )
  }
}

export default new OneTimeFeeService()
