import { apiClient } from '@/utils/apiClient'
import type { ProductType } from '@/types/apps/productTypes'
import type { ResponseResult } from '@/types/common'
import { API_ENDPOINTS } from '@/constants/apiEndpoints'

export interface GetProductsParams {
  pageNumber?: number
  pageSize?: number
  keyword?: string
  code?: string
  category?: string
  minUnitPrice?: number
  maxUnitPrice?: number
  isActive?: boolean
}

export interface CreateProductRequest {
  code: string
  name: string
  category: string
  unitPrice: number
  description?: string
}

export interface UpdateProductRequest {
  name: string
  category: string
  unitPrice: number
  description?: string
  isActive: boolean
}

const toProduct = (value: any): ProductType => ({
  id: value.id,
  code: value.code || '',
  name: value.name || '',
  category: value.category,
  unitPrice: Number(value.unitPrice || 0),
  description: value.description,
  isActive: value.isActive ?? true,
  createdAt: value.createdAt,
  updatedAt: value.updatedAt
})

const unwrapList = (value: any): any[] => {
  if (Array.isArray(value?.items)) return value.items
  if (Array.isArray(value?.records)) return value.records
  if (Array.isArray(value)) return value

  return []
}

class ProductService {
  async getProducts(params?: GetProductsParams): Promise<ResponseResult<ProductType[]>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.products.root, { params })
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: true, data: [] }
      }

      return {
        success: true,
        data: unwrapList(apiResponse.data).map(toProduct)
      }
    } catch {
      return { success: true, data: [] }
    }
  }

  async getProductById(id: string): Promise<ResponseResult<ProductType>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.products.byId(id))
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: false, message: apiResponse.message }
      }

      return { success: true, data: toProduct(apiResponse.data) }
    } catch (error: any) {
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async createProduct(data: CreateProductRequest): Promise<ResponseResult<ProductType>> {
    try {
      const response = await apiClient.post<any>(API_ENDPOINTS.products.root, data)
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: false, message: apiResponse.message }
      }

      return { success: true, data: toProduct(apiResponse.data), message: apiResponse.message }
    } catch (error: any) {
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async updateProduct(id: string, data: UpdateProductRequest): Promise<ResponseResult<ProductType>> {
    try {
      const response = await apiClient.put<any>(API_ENDPOINTS.products.byId(id), data)
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: false, message: apiResponse.message }
      }

      return { success: true, data: toProduct(apiResponse.data), message: apiResponse.message }
    } catch (error: any) {
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async deleteProduct(id: string): Promise<ResponseResult<void>> {
    try {
      const response = await apiClient.delete<any>(API_ENDPOINTS.products.byId(id))
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: false, message: apiResponse.message }
      }

      return { success: true, message: apiResponse.message }
    } catch (error: any) {
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async restoreProduct(id: string): Promise<ResponseResult<ProductType>> {
    try {
      const response = await apiClient.post<any>(API_ENDPOINTS.products.restore(id))
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: false, message: apiResponse.message }
      }

      return { success: true, data: toProduct(apiResponse.data), message: apiResponse.message }
    } catch (error: any) {
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }
}

export default new ProductService()
