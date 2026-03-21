import type { ThemeColor } from '@core/types'

export type ProductType = {
  id: string
  code: string
  name: string
  category?: string
  unitPrice: number
  description?: string
  isActive: boolean
  createdAt?: string
  updatedAt?: string | null
}

export type ProductStatusMap = {
  [key: string]: ThemeColor
}

export const productStatusColorMap: ProductStatusMap = {
  Active: 'success',
  Inactive: 'secondary'
}
