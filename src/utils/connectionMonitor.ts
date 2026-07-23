const MAINTENANCE_KEY = 'cmis_maintenance'
const MAINTENANCE_URL = '/pages/misc/under-maintenance'
const DASHBOARD_URL = '/'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.trim() ?? ''

export function isOnMaintenancePage(): boolean {
  if (typeof window === 'undefined') return false
  return window.location.pathname === MAINTENANCE_URL
}

export function isOnPublicPage(): boolean {
  if (typeof window === 'undefined') return false
  const path = window.location.pathname
  return (
    path === MAINTENANCE_URL ||
    path === '/' ||
    path.startsWith('/login') ||
    path.startsWith('/pages/misc/under-maintenance')
  )
}

export function setMaintenanceMode(active: boolean) {
  if (typeof window === 'undefined') return

  if (active) {
    sessionStorage.setItem(MAINTENANCE_KEY, 'true')
  } else {
    sessionStorage.removeItem(MAINTENANCE_KEY)
  }
}

export function isInMaintenanceMode(): boolean {
  if (typeof window === 'undefined') return false
  return sessionStorage.getItem(MAINTENANCE_KEY) === 'true'
}

export function redirectToMaintenance() {
  if (typeof window === 'undefined') return
  if (isOnMaintenancePage()) return

  setMaintenanceMode(true)
  window.location.href = MAINTENANCE_URL
}

export function redirectToDashboard() {
  if (typeof window === 'undefined') return

  setMaintenanceMode(false)
  window.location.href = DASHBOARD_URL
}

export async function pingServer(timeoutMs: number = 5000): Promise<boolean> {
  const baseUrl = API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '')

  if (!baseUrl) return false

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    const response = await fetch(baseUrl, {
      method: 'HEAD',
      signal: controller.signal,
      cache: 'no-store'
    })

    clearTimeout(timeoutId)

    // 2xx hoặc 401/403 đều nghĩa server đang sống (401/403 chỉ là chưa có quyền)
    return response.ok || response.status === 401 || response.status === 403
  } catch {
    return false
  }
}
