import { apiClient } from '@/utils/apiClient'
import type { ResponseResult } from '@/types/common'
import { API_ENDPOINTS } from '@/constants/apiEndpoints'
import { apiGet, apiList } from '@/utils/serviceHelper'
import type {
  ZaloLinkCoachOverviewType,
  ZaloLinkCoachClassStatsType,
  ZaloLinkCoachStudentRowType,
  ZaloLinkLookupResultType,
  ZaloLinkOverviewType,
  ZaloLinkClassStatsType,
  ZaloUnlinkedStudentRowType
} from '@/types/apps/zaloLinkTypes'

const toNumber = (value: unknown): number => {
  const parsed = Number(value)

  return Number.isFinite(parsed) ? parsed : 0
}

const mapOverviewClass = (value: any): ZaloLinkClassStatsType => ({
  classId: value?.classId ?? value?.ClassId ?? '',
  classCode: value?.classCode ?? value?.ClassCode ?? '',
  className: value?.className ?? value?.ClassName ?? '',
  branchName: value?.branchName ?? value?.BranchName ?? '',
  totalStudents: toNumber(value?.totalStudents ?? value?.TotalStudents),
  linkedStudents: toNumber(value?.linkedStudents ?? value?.LinkedStudents),
  unlinkedStudents: toNumber(value?.unlinkedStudents ?? value?.UnlinkedStudents),
  linkedRate: toNumber(value?.linkedRate ?? value?.LinkedRate)
})

const mapCoachOverviewClass = (value: any): ZaloLinkCoachClassStatsType => ({
  classId: value?.classId ?? value?.ClassId ?? '',
  classCode: value?.classCode ?? value?.ClassCode ?? '',
  className: value?.className ?? value?.ClassName ?? '',
  branchName: value?.branchName ?? value?.BranchName ?? '',
  totalStudents: toNumber(value?.totalStudents ?? value?.TotalStudents),
  linkedStudents: toNumber(value?.linkedStudents ?? value?.LinkedStudents),
  unlinkedStudents: toNumber(value?.unlinkedStudents ?? value?.UnlinkedStudents),
  linkedRate: toNumber(value?.linkedRate ?? value?.LinkedRate)
})

const mapOverview = (value: any): ZaloLinkOverviewType => ({
  totalStudents: toNumber(value?.totalStudents ?? value?.TotalStudents),
  linkedStudents: toNumber(value?.linkedStudents ?? value?.LinkedStudents),
  unlinkedStudents: toNumber(value?.unlinkedStudents ?? value?.UnlinkedStudents),
  linkedRate: toNumber(value?.linkedRate ?? value?.LinkedRate),
  classes: Array.isArray(value?.classes ?? value?.Classes) ? (value?.classes ?? value?.Classes).map(mapOverviewClass) : []
})

const mapCoachOverview = (value: any): ZaloLinkCoachOverviewType => ({
  totalStudents: toNumber(value?.totalStudents ?? value?.TotalStudents),
  linkedStudents: toNumber(value?.linkedStudents ?? value?.LinkedStudents),
  unlinkedStudents: toNumber(value?.unlinkedStudents ?? value?.UnlinkedStudents),
  linkedRate: toNumber(value?.linkedRate ?? value?.LinkedRate),
  classes: Array.isArray(value?.classes ?? value?.Classes) ? (value?.classes ?? value?.Classes).map(mapCoachOverviewClass) : []
})

class ZaloLinkService {
  async getStats(): Promise<ResponseResult<ZaloLinkOverviewType>> {
    return apiGet(
      () => apiClient.get<any>(API_ENDPOINTS.zaloLinks.stats),
      data => mapOverview(data)
    )
  }

  async getUnlinkedStudents(classId?: string): Promise<ResponseResult<ZaloUnlinkedStudentRowType[]>> {
    const params = classId ? { classId } : undefined
    return apiList(
      () => apiClient.get<any>(API_ENDPOINTS.zaloLinks.unlinked, { params }),
      data => (Array.isArray(data) ? data : [])
    )
  }

  async lookupStudent(params: { phoneNumber?: string; userIdZalo?: string }): Promise<ResponseResult<ZaloLinkLookupResultType | null>> {
    return apiList(
      () => apiClient.get<any>(API_ENDPOINTS.zaloLinks.lookup, { params }),
      data => (data ? data : null)
    ) as unknown as Promise<ResponseResult<ZaloLinkLookupResultType | null>>
  }

  async getCoachOverview(): Promise<ResponseResult<ZaloLinkCoachOverviewType>> {
    return apiGet(
      () => apiClient.get<any>(API_ENDPOINTS.zaloLinks.coachOverview),
      data => mapCoachOverview(data)
    )
  }

  async getCoachStudents(params?: { classId?: string; onlyUnlinked?: boolean; keyword?: string }): Promise<ResponseResult<ZaloLinkCoachStudentRowType[]>> {
    return apiList(
      () => apiClient.get<any>(API_ENDPOINTS.zaloLinks.coachStudents, { params }),
      data => (Array.isArray(data) ? data : [])
    )
  }
}

export default new ZaloLinkService()
