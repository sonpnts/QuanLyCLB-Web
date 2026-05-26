import { apiClient } from '@/utils/apiClient'
import type { ResponseResult } from '@/types/common'
import { API_ENDPOINTS } from '@/constants/apiEndpoints'
import { apiGet, apiList, apiMutate } from '@/utils/serviceHelper'
import type {
  CreateFeeDefinitionRequest,
  FeeDefinitionType,
  GetOneTimeFeeAdminStatusesParams,
  MarkOneTimeFeePaidRequestType,
  OneTimeFeeAdminStatusesResultType,
  OneTimeFeeAdminStatusType,
  OneTimeFeeImportResultType,
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
          isPaid: Boolean(item.isPaid ?? item.IsPaid),
          isRequiredForExam: Boolean(item.isRequiredForExam ?? item.IsRequiredForExam)
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

  async createDefinition(payload: CreateFeeDefinitionRequest) {
    return apiMutate(
      () => apiClient.post<any>(API_ENDPOINTS.oneTimeFees.createDefinition, payload),
      data => data as FeeDefinitionType
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

  async importPaidStatuses(feeCode: string, file: File): Promise<ResponseResult<OneTimeFeeImportResultType>> {
    const formData = new FormData()

    formData.append('feeCode', feeCode)
    formData.append('file', file)

    return apiMutate(
      () =>
        apiClient.post<any>(API_ENDPOINTS.oneTimeFees.importPaid, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }),
      data => data as OneTimeFeeImportResultType
    )
  }

  async getAdminStatuses(params?: GetOneTimeFeeAdminStatusesParams): Promise<ResponseResult<OneTimeFeeAdminStatusesResultType>> {
    return apiGet(
      () => apiClient.get<any>(API_ENDPOINTS.oneTimeFees.adminStatuses, { params }),
      (data: any) => ({
        totalRecords: Number(data?.totalRecords ?? data?.totalCount ?? 0),
        pageNumber: Number(data?.pageNumber ?? params?.pageNumber ?? 1),
        pageSize: Number(data?.pageSize ?? params?.pageSize ?? 10),
        records: Array.isArray(data?.records)
          ? data.records.map(
              (item: any): OneTimeFeeAdminStatusType => ({
                studentId: item.studentId,
                studentCode: item.studentCode ?? null,
                studentName: item.studentName ?? '',
                classId: item.classId,
                classCode: item.classCode ?? null,
                className: item.className ?? '',
                branchId: item.branchId,
                branchName: item.branchName ?? null,
                feeCode: item.feeCode ?? '',
                feeName: item.feeName ?? '',
                amount: Number(item.amount ?? 0),
                scopeType: item.scopeType ?? 'Global',
                scopeId: item.scopeId ?? null,
                isPaid: Boolean(item.isPaid),
                paidAt: item.paidAt ?? null,
                paymentRecordId: item.paymentRecordId ?? null,
                recordedByUserId: item.recordedByUserId ?? null,
                recordedByUserName: item.recordedByUserName ?? null,
                note: item.note ?? null,
                paidSource: item.paidSource ?? null
              })
            )
          : []
      }),
      { className: 'OneTimeFeeService', method: 'getAdminStatuses' }
    )
  }

  async markPaidManually(payload: MarkOneTimeFeePaidRequestType): Promise<ResponseResult<void>> {
    return apiMutate(
      () => apiClient.post<any>(API_ENDPOINTS.oneTimeFees.markPaid, payload),
      undefined,
      { className: 'OneTimeFeeService', method: 'markPaidManually' }
    )
  }
}

export default new OneTimeFeeService()
