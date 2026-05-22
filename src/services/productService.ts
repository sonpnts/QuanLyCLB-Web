import { apiClient } from '@/utils/apiClient'
import type {
  ProductInventoryTransactionType,
  ProductReportSummaryType,
  ProductType,
  ProductVariantType
} from '@/types/apps/productTypes'
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

export interface UpsertProductVariantRequest {
  id?: string
  label: string
  size?: string
  color?: string
  additionalPrice: number
  isActive?: boolean
}

export interface CreateProductRequest {
  code: string
  name: string
  category: string
  unitPrice: number
  description?: string
  variants?: UpsertProductVariantRequest[]
}

export interface UpdateProductRequest {
  name: string
  category: string
  unitPrice: number
  description?: string
  variants?: UpsertProductVariantRequest[]
  isActive: boolean
}

export interface CreateProductInventoryEntryRequest {
  productId: string
  productVariantId?: string
  quantity: number
  unitCost?: number
  transactionType: string
  notes?: string
}

const toVariant = (value: any): ProductVariantType => ({
  id: value.id,
  sku: value.sku || '',
  label: value.label || '',
  size: value.size || undefined,
  color: value.color || undefined,
  additionalPrice: Number(value.additionalPrice || 0),
  stockQuantity: Number(value.stockQuantity || 0),
  isActive: value.isActive ?? true
})

const toProduct = (value: any): ProductType => ({
  id: value.id,
  code: value.code || '',
  name: value.name || '',
  category: value.category,
  unitPrice: Number(value.unitPrice || 0),
  description: value.description,
  hasVariants: value.hasVariants ?? false,
  totalStockQuantity: Number(value.totalStockQuantity || 0),
  variants: Array.isArray(value.variants) ? value.variants.map(toVariant) : [],
  isActive: value.isActive ?? true,
  createdAt: value.createdAt,
  updatedAt: value.updatedAt
})

const toInventoryTransaction = (value: any): ProductInventoryTransactionType => ({
  id: value.id,
  productId: value.productId,
  productName: value.productName || '',
  productVariantId: value.productVariantId || undefined,
  productVariantLabel: value.productVariantLabel || undefined,
  transactionType: value.transactionType || '',
  quantityChange: Number(value.quantityChange || 0),
  stockAfterTransaction: Number(value.stockAfterTransaction || 0),
  unitCost: value.unitCost !== null && value.unitCost !== undefined ? Number(value.unitCost) : undefined,
  referenceType: value.referenceType || undefined,
  referenceId: value.referenceId || undefined,
  notes: value.notes || undefined,
  isActive: value.isActive ?? true,
  createdAt: value.createdAt,
  createdByUserId: value.createdByUserId || undefined
})

const toReportSummary = (value: any): ProductReportSummaryType => ({
  totalProducts: Number(value.totalProducts || 0),
  totalVariants: Number(value.totalVariants || 0),
  totalUnitsInStock: Number(value.totalUnitsInStock || 0),
  totalStockValue: Number(value.totalStockValue || 0),
  topSellingProducts: Array.isArray(value.topSellingProducts)
    ? value.topSellingProducts.map((item: any) => ({
        productId: item.productId,
        productCode: item.productCode || '',
        productName: item.productName || '',
        productVariantLabel: item.productVariantLabel || undefined,
        soldQuantity: Number(item.soldQuantity || 0),
        revenue: Number(item.revenue || 0)
      }))
    : [],
  recentTransactions: Array.isArray(value.recentTransactions) ? value.recentTransactions.map(toInventoryTransaction) : []
})

class ProductService {
  async getSaleOptions(): Promise<ResponseResult<ProductType[]>> {
    return apiList(() => apiClient.get<any>(API_ENDPOINTS.products.saleOptions), data => extractList<any>(data).map(toProduct))
  }

  async getProducts(params?: GetProductsParams): Promise<ResponseResult<ProductType[]>> {
    return apiList(() => apiClient.get<any>(API_ENDPOINTS.products.root, { params }), data => extractList<any>(data).map(toProduct))
  }

  async getInventory(params?: GetProductsParams): Promise<ResponseResult<ProductType[]>> {
    return apiList(() => apiClient.get<any>(API_ENDPOINTS.products.inventory, { params }), data => extractList<any>(data).map(toProduct))
  }

  async getInventoryTransactions(productId?: string): Promise<ResponseResult<ProductInventoryTransactionType[]>> {
    return apiList(
      () => apiClient.get<any>(API_ENDPOINTS.products.inventoryTransactions, { params: { productId } }),
      data => extractList<any>(data).map(toInventoryTransaction)
    )
  }

  async createInventoryEntry(data: CreateProductInventoryEntryRequest): Promise<ResponseResult<ProductInventoryTransactionType>> {
    return apiMutate(() => apiClient.post<any>(API_ENDPOINTS.products.inventoryEntries, data), toInventoryTransaction)
  }

  async getReportSummary(fromDate?: string, toDate?: string): Promise<ResponseResult<ProductReportSummaryType>> {
    return apiGet(() => apiClient.get<any>(API_ENDPOINTS.products.reportSummary, { params: { fromDate, toDate } }), toReportSummary)
  }

  async getProductById(id: string): Promise<ResponseResult<ProductType>> {
    return apiGet(() => apiClient.get<any>(API_ENDPOINTS.products.byId(id)), toProduct)
  }

  async createProduct(data: CreateProductRequest): Promise<ResponseResult<ProductType>> {
    return apiMutate(() => apiClient.post<any>(API_ENDPOINTS.products.root, data), toProduct)
  }

  async updateProduct(id: string, data: UpdateProductRequest): Promise<ResponseResult<ProductType>> {
    return apiMutate(() => apiClient.put<any>(API_ENDPOINTS.products.byId(id), data), toProduct)
  }

  async deleteProduct(id: string): Promise<ResponseResult<void>> {
    return apiMutate(() => apiClient.delete<any>(API_ENDPOINTS.products.byId(id)))
  }

  async restoreProduct(id: string): Promise<ResponseResult<ProductType>> {
    return apiMutate(() => apiClient.post<any>(API_ENDPOINTS.products.restore(id)), toProduct)
  }
}

export default new ProductService()
