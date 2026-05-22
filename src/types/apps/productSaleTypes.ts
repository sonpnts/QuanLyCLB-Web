export type ProductSaleType = {
  id: string
  source?: 'product-sale' | 'payment'
  receiptNumber?: string
  studentName?: string
  productId: string
  productName?: string
  productVariantId?: string
  productVariantLabel?: string
  paymentRecordId?: string
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
