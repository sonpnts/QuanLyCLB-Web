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
  isActive: boolean
  roles: string[]
  createdAt?: string
  updatedAt?: string | null
  createdByUserId?: string | null
  updatedByUserId?: string | null
  avatarColor?: ThemeColor

  // Federation (read-only display)
  memberCode?: string | null
  beltLevelName?: string
  beltLevelId?: string | null
  beltLevelOrder?: number | null
}

// API response type from /api/Users — field names match JSON from backend UserDto
export type ApiUserResponse = {
  id: string
  username: string
  email: string
  fullName: string
  phoneNumber?: string
  avatarUrl?: string | null
  isActive: boolean
  isGoogleAccount?: boolean
  roles: string[]

  // Federation (read-only display) — camelCase from BeltLevel* properties in UserDto
  memberCode?: string | null
  beltLevelId?: string | null
  beltLevelName?: string | null
  beltLevelOrder?: number | null
}

// API paginated response
export type ApiUsersListResponse = {
  totalRecords: number
  records: ApiUserResponse[]
}

// Vietnamese role label mapping
export const RoleLabels: Record<string, string> = {
  'Administrator': 'Quản trị viên',
  'Admin': 'Quản trị viên',
  'Coach': 'Huấn luyện viên',
  'Assistant': 'Trợ giảng',
  'Student': 'Võ sinh',
  'Member': 'Thành viên',
  'Moderator': 'Kiểm duyệt viên',
  'User': 'Người dùng',
}
