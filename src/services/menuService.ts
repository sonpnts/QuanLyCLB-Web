import { apiClient } from '@/utils/apiClient'
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
    const auth = authStorage.get()

    // Prevent noisy unauthorized/invalid-token calls during bootstrap.
    if (!auth?.accessToken) {
      return {
        success: false,
        data: [],
        message: 'Missing access token'
      }
    }

    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.menu.byRole)
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return {
          success: false,
          data: [],
          message: apiResponse.message || 'Failed to fetch menu'
        }
      }

      const menuData: MenuResponse = apiResponse.data
      const menuItems = menuData.menuItems || []

      // Transform API menu items to frontend format
      const transformedMenu = menuItems.map(item => this.transformMenuItem(item))

      return {
        success: true,
        data: transformedMenu
      }
    } catch (error: any) {
      const status = error?.response?.status
      const message = error?.response?.data?.message || error?.message || 'Failed to fetch menu'

      return {
        success: false,
        data: [],
        message: status ? `[${status}] ${message}` : message
      }
    }
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
      return {
        success: false,
        message: error.message || 'Failed to seed menu data'
      }
    }
  }
}

export default new MenuService()
