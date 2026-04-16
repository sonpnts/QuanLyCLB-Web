export type SystemConfigType = {
  keyName: string
  value: string
  description?: string
  createdAt: string
  updatedAt?: string
}

export const SYSTEM_CONFIG_KEYS = {
  TIME_LATENESS: 'timeLateness',
  ALLOWED_RADIUS_METERS: 'allowedRadiusMeters',
} as const
