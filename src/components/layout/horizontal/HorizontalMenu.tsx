// React Imports
import { useEffect, useState } from 'react'

// MUI Imports
import { useTheme } from '@mui/material/styles'

// Type Imports
import type { VerticalMenuContextProps } from '@menu/components/vertical-menu/Menu'

// Component Imports
import HorizontalNav, { Menu } from '@menu/horizontal-menu'
import VerticalNavContent from './VerticalNavContent'

import { GenerateHorizontalMenu } from '@components/GenerateMenu'

// Hook Imports
import useVerticalNav from '@menu/hooks/useVerticalNav'
import { useSettings } from '@core/hooks/useSettings'

// Styled Component Imports
import StyledHorizontalNavExpandIcon from '@menu/styles/horizontal/StyledHorizontalNavExpandIcon'
import StyledVerticalNavExpandIcon from '@menu/styles/vertical/StyledVerticalNavExpandIcon'

// Style Imports
import menuRootStyles from '@core/styles/horizontal/menuRootStyles'
import menuItemStyles from '@core/styles/horizontal/menuItemStyles'
import verticalNavigationCustomStyles from '@core/styles/vertical/navigationCustomStyles'
import verticalMenuItemStyles from '@core/styles/vertical/menuItemStyles'
import verticalMenuSectionStyles from '@core/styles/vertical/menuSectionStyles'

// Menu Data Imports
import menuData from '@/data/navigation/horizontalMenuData'
import menuService from '@/services/menuService'
import type { HorizontalMenuDataType } from '@/types/menuTypes'

type RenderExpandIconProps = {
  level?: number
}

type RenderVerticalExpandIconProps = {
  open?: boolean
  transitionDuration?: VerticalMenuContextProps['transitionDuration']
}

const RenderExpandIcon = ({ level }: RenderExpandIconProps) => (
  <StyledHorizontalNavExpandIcon level={level}>
    <i className='ri-arrow-right-s-line' />
  </StyledHorizontalNavExpandIcon>
)

const RenderVerticalExpandIcon = ({ open, transitionDuration }: RenderVerticalExpandIconProps) => (
  <StyledVerticalNavExpandIcon open={open} transitionDuration={transitionDuration}>
    <i className='ri-arrow-right-s-line' />
  </StyledVerticalNavExpandIcon>
)

const hasHrefDeep = (items: HorizontalMenuDataType[], href: string): boolean => {
  for (const item of items) {
    const menuItem = item as { href?: string; children?: HorizontalMenuDataType[] }

    if (menuItem.href === href) return true
    if (menuItem.children?.length && hasHrefDeep(menuItem.children, href)) return true
  }

  return false
}

const HorizontalMenu = () => {
  // Hooks
  const verticalNavOptions = useVerticalNav()
  const theme = useTheme()
  const { settings } = useSettings()

  // State
  const [dynamicMenu, setDynamicMenu] = useState<HorizontalMenuDataType[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const response = await menuService.getMenuByRole()

        if (response.success && response.data) {
          const fromApi = response.data as unknown as HorizontalMenuDataType[]

          if (hasHrefDeep(fromApi, '/apps/product/list')) {
            setDynamicMenu(fromApi)
          } else {
            setDynamicMenu([
              ...fromApi,
              {
                label: 'Sản phẩm',
                icon: 'ri-price-tag-3-line',
                href: '/apps/product/list'
              }
            ])
          }
        } else {
          setDynamicMenu(menuData())
        }
      } catch (error) {
        setDynamicMenu(menuData())
      } finally {
        setIsLoading(false)
      }
    }

    fetchMenu()
  }, [])

  // Vars
  const { skin } = settings
  const { transitionDuration } = verticalNavOptions

  return (
    <HorizontalNav
      switchToVertical
      verticalNavContent={VerticalNavContent}
      verticalNavProps={{
        customStyles: verticalNavigationCustomStyles(verticalNavOptions, theme),
        backgroundColor:
          skin === 'bordered' ? 'var(--mui-palette-background-paper)' : 'var(--mui-palette-background-default)'
      }}
    >
      <Menu
        rootStyles={menuRootStyles(theme)}
        renderExpandIcon={({ level }) => <RenderExpandIcon level={level} />}
        renderExpandedMenuItemIcon={{ icon: <i className='ri-circle-line' /> }}
        menuItemStyles={menuItemStyles(theme, 'ri-circle-line')}
        popoutMenuOffset={{
          mainAxis: ({ level }) => (level && level > 0 ? 4 : 16),
          alignmentAxis: 0
        }}
        verticalMenuProps={{
          menuItemStyles: verticalMenuItemStyles(verticalNavOptions, theme),
          renderExpandIcon: ({ open }) => (
            <RenderVerticalExpandIcon open={open} transitionDuration={transitionDuration} />
          ),
          renderExpandedMenuItemIcon: { icon: <i className='ri-circle-line' /> },
          menuSectionStyles: verticalMenuSectionStyles(verticalNavOptions, theme)
        }}
      >
        {!isLoading && <GenerateHorizontalMenu menuData={dynamicMenu} />}
      </Menu>
    </HorizontalNav>
  )
}

export default HorizontalMenu
