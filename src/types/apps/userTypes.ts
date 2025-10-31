// Type Imports
import type { ThemeColor } from '@core/types'

// Updated type mapped from API
export type UsersType = {
  id: string
  username: string
  email: string
  fullName: string
  phoneNumber?: string
  avatarUrl?: string | null
  skillLevel?: string
  certification?: string
  isActive: boolean
  roles: string[]
  createdAt?: string
  updatedAt?: string | null
  createdByUserId?: string | null
  updatedByUserId?: string | null
  avatarColor?: ThemeColor
}

// API response type from /api/Users
export type ApiUserResponse = {
  id: string
  username: string
  email: string
  fullName: string
  phoneNumber?: string
  avatarUrl?: string | null
  skillLevel?: string
  certification?: string
  isActive: boolean
  hasPassword?: boolean
  isGoogleAccount?: boolean
  roles: string[] // Array of roles
}

// API paginated response
export type ApiUsersListResponse = {
  totalRecords: number
  records: ApiUserResponse[]
}
