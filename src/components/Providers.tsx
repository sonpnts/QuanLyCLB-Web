// Type Imports
import type { ChildrenType, Direction } from '@core/types'

// Context Imports
import { AuthProvider } from '@/contexts/authContext'
import { VerticalNavProvider } from '@menu/contexts/verticalNavContext'
import { SettingsProvider } from '@core/contexts/settingsContext'
import ThemeProvider from '@components/theme'
import ReduxProvider from '@/redux-store/ReduxProvider'
import { NotificationProvider } from '@/contexts/notificationContext'

// Component Imports
import Notification from '@/components/Notification'

// Styled Component Imports
import AppReactToastify from '@/libs/styles/AppReactToastify'

// Util Imports
import { getMode, getSettingsFromCookie, getSystemMode } from '@core/utils/serverHelpers'

type Props = ChildrenType & {
  direction: Direction
}

const Providers = async (props: Props) => {
  // Props
  const { children, direction } = props

  // Vars
  const mode = await getMode()
  const settingsCookie = await getSettingsFromCookie()
  const systemMode = await getSystemMode()

  return (
    <AuthProvider>
      <NotificationProvider>
        <VerticalNavProvider>
          <SettingsProvider settingsCookie={settingsCookie} mode={mode}>
            <ThemeProvider direction={direction} systemMode={systemMode}>
              <ReduxProvider>{children}</ReduxProvider>
              <AppReactToastify direction={direction} hideProgressBar />
              <Notification />
            </ThemeProvider>
          </SettingsProvider>
        </VerticalNavProvider>
      </NotificationProvider>
    </AuthProvider>
  )
}

export default Providers
