import { apiClient } from '@/utils/apiClient'
import { logger } from '@/utils/logger'
import { authStorage } from '@/utils/authStorage'
import type { ResponseResult } from '@/types/common'
import type { VerticalMenuDataType } from '@/types/menuTypes'
import { API_ENDPOINTS } from '@/constants/apiEndpoints'

// API Response Types (matching backend DTOs)
export interface MenuItemDto {
  id: string
  label: string
  icon?: string | null
  href?: string | null
  isSection: boolean
  order: number
  children?: MenuItemDto[] | null
}

export interface MenuResponse {
  menuItems: MenuItemDto[]
}

class MenuService {
  private inFlightGetMenu: Promise<ResponseResult<VerticalMenuDataType[]>> | null = null
  private menuCache: { expiresAt: number; value: ResponseResult<VerticalMenuDataType[]> } | null = null
  private readonly menuCacheTtlMs = 3000

  /**
   * Transform API menu items to frontend menu format
   */
  private transformMenuItem(apiItem: MenuItemDto): VerticalMenuDataType {
    const item: VerticalMenuDataType = {
      label: apiItem.label,
      isSection: apiItem.isSection
    }

    if (apiItem.icon) {
      item.icon = apiItem.icon
    }

    if (apiItem.href) {
      ; (item as any).href = apiItem.href
    }

    if (apiItem.children && apiItem.children.length > 0) {
      ; (item as any).children = apiItem.children.map(child => this.transformMenuItem(child))
    }

    return item
  }

  /**
   * Get menu items based on current user's roles (from JWT token)
   * The backend will automatically extract roles from the JWT token
   */
  async getMenuByRole(): Promise<ResponseResult<VerticalMenuDataType[]>> {
    const now = Date.now()
    if (this.menuCache && this.menuCache.expiresAt > now) {
      return this.menuCache.value
    }

    if (this.inFlightGetMenu) {
      return this.inFlightGetMenu
    }

    const auth = authStorage.get()

    // Prevent noisy unauthorized/invalid-token calls during bootstrap.
    if (!auth?.accessToken) {
      return {
        success: false,
        data: [],
        message: 'Missing access token'
      }
    }

    this.inFlightGetMenu = (async () => {
      try {
        const response = await apiClient.get<any>(API_ENDPOINTS.menu.byRole)
        const apiResponse = response.data

        if (!apiResponse.isSuccess) {
          const failedResult: ResponseResult<VerticalMenuDataType[]> = {
            success: false,
            data: [],
            message: apiResponse.message || 'Failed to fetch menu'
          }

          this.menuCache = {
            expiresAt: Date.now() + this.menuCacheTtlMs,
            value: failedResult
          }

          return failedResult
        }

        const menuData: MenuResponse = apiResponse.data
        const menuItems = menuData.menuItems || []

        // Transform API menu items to frontend format
        const transformedMenu = menuItems.map(item => this.transformMenuItem(item))
        const successResult: ResponseResult<VerticalMenuDataType[]> = {
          success: true,
          data: transformedMenu
        }

        this.menuCache = {
          expiresAt: Date.now() + this.menuCacheTtlMs,
          value: successResult
        }

        return successResult
      } catch (error: any) {
        logger.error('MenuService', 'getMenuByRole', error)
        const status = error?.response?.status
        const message = error?.response?.data?.message || error?.message || 'Failed to fetch menu'
        const failedResult: ResponseResult<VerticalMenuDataType[]> = {
          success: false,
          data: [],
          message: status ? `[${status}] ${message}` : message
        }

        this.menuCache = {
          expiresAt: Date.now() + this.menuCacheTtlMs,
          value: failedResult
        }

        return failedResult
      } finally {
        this.inFlightGetMenu = null
      }
    })()

    return this.inFlightGetMenu
  }

  async getMenuByUser(userId: string): Promise<ResponseResult<VerticalMenuDataType[]>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.menu.byUser(userId))
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: false, data: [], message: apiResponse.message || 'Failed to fetch menu' }
      }

      const menuData: MenuResponse = apiResponse.data
      const menuItems = menuData.menuItems || []
      const transformedMenu = menuItems.map(item => this.transformMenuItem(item))
      return { success: true, data: transformedMenu }
    } catch (error: any) {
      logger.error('MenuService', 'getMenuByUser', error)
      return { success: false, data: [], message: error?.response?.data?.message || error?.message || 'Failed to fetch menu' }
    }
  }

  /** Clear the local menu cache so the next call re-fetches from the server. */
  invalidateCache(): void {
    this.menuCache = null
    this.inFlightGetMenu = null
  }

  /**
   * Seed initial menu data (Admin only - for development/initial setup)
   */
  async seedMenuData(): Promise<ResponseResult<void>> {
    try {
      const response = await apiClient.post<any>(API_ENDPOINTS.menu.seed)
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return {
          success: false,
          message: apiResponse.message || 'Failed to seed menu data'
        }
      }

      return {
        success: true,
        message: apiResponse.message || 'Menu data seeded successfully'
      }
    } catch (error: any) {
      logger.error('MenuService', 'seedMenuData', error)
      return {
        success: false,
        message: error.message || 'Failed to seed menu data'
      }
    }
  }
}

export default new MenuService()
