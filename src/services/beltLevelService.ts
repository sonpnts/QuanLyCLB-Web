import { apiClient } from '@/utils/apiClient'
import type { BeltLevelType } from '@/types/apps/beltExamTypes'
import type { ResponseResult } from '@/types/common'

// Query parameters for GET /api/belt-levels
export interface GetBeltLevelsParams {
  pageNumber?: number
  pageSize?: number
  keyword?: string
}

// Request body for POST /api/belt-levels
export interface CreateBeltLevelRequest {
  name: string
  order: number
  description?: string
  colorCode?: string
}

// Request body for PUT /api/belt-levels/{id}
export interface UpdateBeltLevelRequest {
  name?: string
  order?: number
  description?: string
  colorCode?: string
}

class BeltLevelService {
  async getBeltLevels(params?: GetBeltLevelsParams): Promise<ResponseResult<BeltLevelType[]>> {
    try {
      const response = await apiClient.get<any>('/belt-levels', { params })
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: false, data: [], message: apiResponse.message }
      }

      // Handle different response formats
      let data = apiResponse.data

      if (data && typeof data === 'object' && !Array.isArray(data)) {
        data = data.items || data.records || []
      }

      return { success: true, data: Array.isArray(data) ? data : [] }
    } catch (error) {
      console.error('Error fetching belt levels:', error)

      return { success: false, data: [], message: 'Không thể tải danh sách cấp đai' }
    }
  }

  async getBeltLevelById(id: string): Promise<ResponseResult<BeltLevelType>> {
    try {
      const response = await apiClient.get<any>(`/belt-levels/${id}`)
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: false, message: apiResponse.message }
      }

      return { success: true, data: apiResponse.data }
    } catch (error) {
      console.error('Error fetching belt level:', error)

      return { success: false, message: 'Không thể tải thông tin cấp đai' }
    }
  }

  async createBeltLevel(data: CreateBeltLevelRequest): Promise<ResponseResult<BeltLevelType>> {
    try {
      const response = await apiClient.post<any>('/belt-levels', data)
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: false, message: apiResponse.message }
      }

      return { success: true, data: apiResponse.data, message: apiResponse.message || 'Tạo cấp đai thành công' }
    } catch (error) {
      console.error('Error creating belt level:', error)

      return { success: false, message: 'Không thể tạo cấp đai' }
    }
  }

  async updateBeltLevel(id: string, data: UpdateBeltLevelRequest): Promise<ResponseResult<BeltLevelType>> {
    try {
      const response = await apiClient.put<any>(`/belt-levels/${id}`, data)
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: false, message: apiResponse.message }
      }

      return { success: true, data: apiResponse.data, message: apiResponse.message || 'Cập nhật cấp đai thành công' }
    } catch (error) {
      console.error('Error updating belt level:', error)

      return { success: false, message: 'Không thể cập nhật cấp đai' }
    }
  }

  async deleteBeltLevel(id: string): Promise<ResponseResult<void>> {
    try {
      const response = await apiClient.delete<any>(`/belt-levels/${id}`)
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: false, message: apiResponse.message }
      }

      return { success: true, message: apiResponse.message || 'Xóa cấp đai thành công' }
    } catch (error) {
      console.error('Error deleting belt level:', error)

      return { success: false, message: 'Không thể xóa cấp đai' }
    }
  }
}

const beltLevelService = new BeltLevelService()
export default beltLevelService
