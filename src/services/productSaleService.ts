import { apiClient } from '@/utils/apiClient'
import { logger } from '@/utils/logger'
import type { ProductSaleType } from '@/types/apps/productSaleTypes'
import type { ResponseResult } from '@/types/common'
import { API_ENDPOINTS } from '@/constants/apiEndpoints'

export interface GetProductSalesParams {
  productId?: string
  classId?: string
  soldByUserId?: string
  saleDateFrom?: string
  saleDateTo?: string
  minTotalAmount?: number
  maxTotalAmount?: number
  keyword?: string
  pageNumber?: number
  pageSize?: number
  isActive?: boolean
}

export interface CreateProductSaleRequest {
  productId: string
  classId: string
  quantity: number
  unitPrice?: number
  saleDate?: string
  soldByUserId?: string
  buyerName?: string
  notes?: string
}

export interface UpdateProductSaleRequest {
  quantity: number
  unitPrice: number
  saleDate: string
  isActive: boolean
  soldByUserId?: string
  buyerName?: string
  notes?: string
}

const toProductSale = (value: any): ProductSaleType => {
  const quantity = Number(value.quantity || 0)
  const unitPrice = Number(value.unitPrice || 0)
  const totalAmount = Number(value.totalAmount ?? quantity * unitPrice)

  return {
    id: value.id,
    productId: value.productId,
    productName: value.productName,
    classId: value.classId,
    className: value.className,
    soldByUserId: value.soldByUserId,
    soldByUserName: value.soldByUserName,
    quantity,
    unitPrice,
    totalAmount,
    saleDate: value.saleDate || value.createdAt,
    buyerName: value.buyerName,
    notes: value.notes,
    isActive: value.isActive ?? true,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt
  }
}

const unwrapList = (value: any): any[] => {
  if (Array.isArray(value?.items)) return value.items
  if (Array.isArray(value?.records)) return value.records
  if (Array.isArray(value)) return value

  return []
}

class ProductSaleService {
  async getProductSales(params?: GetProductSalesParams): Promise<ResponseResult<ProductSaleType[]>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.productSales.root, { params })
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: true, data: [] }
      }

      return {
        success: true,
        data: unwrapList(apiResponse.data).map(toProductSale)
      }
    } catch (error) {
      logger.error('ProductSaleService', 'getProductSales', error)
      return { success: true, data: [] }
    }
  }

  async getProductSaleById(id: string): Promise<ResponseResult<ProductSaleType>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.productSales.byId(id))
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: false, message: apiResponse.message }
      }

      return { success: true, data: toProductSale(apiResponse.data) }
    } catch (error: any) {
      logger.error('ProductSaleService', 'getProductSaleById', error)
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async createProductSale(data: CreateProductSaleRequest): Promise<ResponseResult<ProductSaleType>> {
    try {
      const response = await apiClient.post<any>(API_ENDPOINTS.productSales.root, data)
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: false, message: apiResponse.message }
      }

      return { success: true, data: toProductSale(apiResponse.data), message: apiResponse.message }
    } catch (error: any) {
      logger.error('ProductSaleService', 'createProductSale', error)
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async updateProductSale(id: string, data: UpdateProductSaleRequest): Promise<ResponseResult<ProductSaleType>> {
    try {
      const response = await apiClient.put<any>(API_ENDPOINTS.productSales.byId(id), data)
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: false, message: apiResponse.message }
      }

      return { success: true, data: toProductSale(apiResponse.data), message: apiResponse.message }
    } catch (error: any) {
      logger.error('ProductSaleService', 'updateProductSale', error)
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async deleteProductSale(id: string): Promise<ResponseResult<void>> {
    try {
      const response = await apiClient.delete<any>(API_ENDPOINTS.productSales.byId(id))
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: false, message: apiResponse.message }
      }

      return { success: true, message: apiResponse.message }
    } catch (error: any) {
      logger.error('ProductSaleService', 'deleteProductSale', error)
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async restoreProductSale(id: string): Promise<ResponseResult<ProductSaleType>> {
    try {
      const response = await apiClient.post<any>(API_ENDPOINTS.productSales.restore(id))
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: false, message: apiResponse.message }
      }

      return { success: true, data: toProductSale(apiResponse.data), message: apiResponse.message }
    } catch (error: any) {
      logger.error('ProductSaleService', 'restoreProductSale', error)
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }
}

export default new ProductSaleService()
