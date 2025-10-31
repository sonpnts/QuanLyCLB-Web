// Day of Week Constants
export const DAY_OF_WEEK_OPTIONS = [
  { value: 0, label: 'Chủ nhật' },
  { value: 1, label: 'Thứ hai' },
  { value: 2, label: 'Thứ ba' },
  { value: 3, label: 'Thứ tư' },
  { value: 4, label: 'Thứ năm' },
  { value: 5, label: 'Thứ sáu' },
  { value: 6, label: 'Thứ bảy' }
] as const

export const DAY_OF_WEEK_NAMES = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'] as const

// Helper function to get day name from day of week number
export const getDayName = (dayOfWeek: number): string => {
  return DAY_OF_WEEK_NAMES[dayOfWeek] || `Thứ ${dayOfWeek}`
}

// Status Constants
export const STATUS_OPTIONS = [
  { value: 'true', label: 'Hoạt động' },
  { value: 'false', label: 'Không hoạt động' }
] as const

export const STATUS_LABELS = {
  active: 'Hoạt động',
  inactive: 'Không hoạt động'
} as const

// Helper function to get status label
export const getStatusLabel = (isActive: boolean): string => {
  return isActive ? STATUS_LABELS.active : STATUS_LABELS.inactive
}

// Helper function to get status color for Chip
export const getStatusColor = (isActive: boolean): 'success' | 'error' => {
  return isActive ? 'success' : 'error'
}
