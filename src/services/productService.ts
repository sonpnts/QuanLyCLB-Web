import { apiClient } from '@/utils/apiClient'
import type { ProductType } from '@/types/apps/productTypes'
import type { ResponseResult } from '@/types/common'
import { API_ENDPOINTS } from '@/constants/apiEndpoints'
import { apiList, apiGet, apiMutate, extractList } from '@/utils/serviceHelper'

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

class ProductService {
  async getSaleOptions(): Promise<ResponseResult<ProductType[]>> {
    return apiList(
      () => apiClient.get<any>(API_ENDPOINTS.products.saleOptions),
      data => extractList<any>(data).map(toProduct)
    )
  }

  async getProducts(params?: GetProductsParams): Promise<ResponseResult<ProductType[]>> {
    return apiList(
      () => apiClient.get<any>(API_ENDPOINTS.products.root, { params }),
      data => extractList<any>(data).map(toProduct)
    )
  }

  async getProductById(id: string): Promise<ResponseResult<ProductType>> {
    return apiGet(
      () => apiClient.get<any>(API_ENDPOINTS.products.byId(id)),
      toProduct
    )
  }

  async createProduct(data: CreateProductRequest): Promise<ResponseResult<ProductType>> {
    return apiMutate(
      () => apiClient.post<any>(API_ENDPOINTS.products.root, data),
      toProduct
    )
  }

  async updateProduct(id: string, data: UpdateProductRequest): Promise<ResponseResult<ProductType>> {
    return apiMutate(
      () => apiClient.put<any>(API_ENDPOINTS.products.byId(id), data),
      toProduct
    )
  }

  async deleteProduct(id: string): Promise<ResponseResult<void>> {
    return apiMutate(
      () => apiClient.delete<any>(API_ENDPOINTS.products.byId(id))
    )
  }

  async restoreProduct(id: string): Promise<ResponseResult<ProductType>> {
    return apiMutate(
      () => apiClient.post<any>(API_ENDPOINTS.products.restore(id)),
      toProduct
    )
  }
}

export default new ProductService()
