import { apiClient } from '@/utils/apiClient'
import { logger } from '@/utils/logger'
import type { ResponseResult } from '@/types/common'
import { API_ENDPOINTS } from '@/constants/apiEndpoints'

export interface FederationMemberDto {
  id: string
  memberCode: string
  fullName: string
  isEffective?: string | null
  dateOfBirth?: string | null  // "YYYY-MM-DD"
  gender?: string | null       // "Nam" | "Nữ"
  phoneNumber?: string | null
  idCard?: string | null
  email?: string | null
  address?: string | null
  beltRank?: string | null
  clubName?: string | null
  memberOrganization?: string | null
  oldMemberCode?: string | null
  syncedAt?: string
}

export interface SearchFederationMembersParams {
  keyword?: string
  pageNumber?: number
  pageSize?: number
}

export interface PagedFederationResult {
  items: FederationMemberDto[]
  totalCount: number
  pageNumber: number
  pageSize: number
}

class FederationMemberService {
  /** Tìm kiếm hội viên theo tên hoặc mã (lazy loading) */
  async search(params: SearchFederationMembersParams): Promise<ResponseResult<PagedFederationResult>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.federationMembers.root, {
        params: {
          keyword: params.keyword,
          pageNumber: params.pageNumber ?? 1,
          pageSize: params.pageSize ?? 10
        }
      })

      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: false, message: apiResponse.message }
      }

      // Backend trả về { items, totalCount, pageNumber, pageSize } hoặc { records, totalRecords }
      const raw = apiResponse.data
      const items: FederationMemberDto[] = raw?.items || raw?.records || []
      const totalCount: number = raw?.totalCount ?? raw?.totalRecords ?? items.length

      return {
        success: true,
        data: {
          items,
          totalCount,
          pageNumber: raw?.pageNumber ?? params.pageNumber ?? 1,
          pageSize: raw?.pageSize ?? params.pageSize ?? 10
        }
      }
    } catch (error) {
      logger.error('FederationMemberService', 'search', error)
      
return { success: false, message: 'Lỗi kết nối máy chủ' }
    }
  }

  /** Tra cứu chính xác theo mã hội viên */
  async getByCode(memberCode: string): Promise<ResponseResult<FederationMemberDto>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.federationMembers.byCode(memberCode))
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: false, message: apiResponse.message }
      }

      return { success: true, data: apiResponse.data }
    } catch (error: any) {
      logger.error('FederationMemberService', 'getByCode', error)
      const status = error?.response?.status

      if (status === 404) return { success: false, message: `Không tìm thấy hội viên với mã '${memberCode}'` }
      
return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }
}

const federationMemberService = new FederationMemberService()

export default federationMemberService
