import type { ThemeColor } from '@core/types'

export type ProductVariantType = {
  id: string
  sku: string
  label: string
  size?: string
  color?: string
  additionalPrice: number
  stockQuantity: number
  isActive: boolean
}

export type ProductInventoryBatchEntryItemType = {
  productVariantId?: string
  quantity: number
  unitCost?: number
  notes?: string
}

export type ProductBundleItemType = {
  id: string
  productId: string
  productCode: string
  productName: string
  quantity: number
  discountAmount: number
  availableStock: number
  sortOrder: number
  isActive: boolean
}

export type ProductBundleType = {
  id: string
  code: string
  name: string
  description?: string
  isActive: boolean
  items: ProductBundleItemType[]
  createdAt?: string
  updatedAt?: string | null
}

export type ProductType = {
  id: string
  code: string
  name: string
  category?: string
  unitPrice: number
  description?: string
  hasVariants?: boolean
  totalStockQuantity?: number
  variants?: ProductVariantType[]
  isActive: boolean
  createdAt?: string
  updatedAt?: string | null
}

export type ProductInventoryTransactionType = {
  id: string
  productId: string
  productName: string
  productVariantId?: string
  productVariantLabel?: string
  transactionType: string
  quantityChange: number
  stockAfterTransaction: number
  unitCost?: number
  referenceType?: string
  referenceId?: string
  notes?: string
  isActive: boolean
  createdAt?: string
  createdByUserId?: string
}

export type ProductReportItemType = {
  productId: string
  productCode: string
  productName: string
  productVariantLabel?: string
  soldQuantity: number
  revenue: number
}

export type ProductReportSummaryType = {
  totalProducts: number
  totalVariants: number
  totalUnitsInStock: number
  totalStockValue: number
  topSellingProducts: ProductReportItemType[]
  recentTransactions: ProductInventoryTransactionType[]
}

export type ProductStatusMap = {
  [key: string]: ThemeColor
}

export const productStatusColorMap: ProductStatusMap = {
  Active: 'success',
  Inactive: 'secondary'
}
