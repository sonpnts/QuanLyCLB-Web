export type ProductSaleType = {
  id: string
  productId: string
  productName?: string
  classId?: string
  className?: string
  soldByUserId?: string
  soldByUserName?: string
  quantity: number
  unitPrice: number
  totalAmount: number
  saleDate?: string
  buyerName?: string
  notes?: string
  isActive?: boolean
  createdAt?: string
  updatedAt?: string | null
}
