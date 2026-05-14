// Next Imports

// MUI Imports
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript'

// Third-party Imports
import 'react-perfect-scrollbar/dist/css/styles.css'

// Type Imports
import type { ChildrenType } from '@core/types'

// Util Imports
import { getSystemMode } from '@core/utils/serverHelpers'

// Style Imports
import '@/app/globals.css'

// Generated Icon CSS Imports
import '@assets/iconify-icons/generated-icons.css'

export const metadata = {
  title: 'CMIS - Tấn Đạt Taekwondo',
  description: 'Central Management Information System - Hệ thống thông tin quản lý tập trung',
  icons: {
    icon: [{ url: '/images/logos/logo.svg', type: 'image/svg+xml' }],
    shortcut: ['/images/logos/logo.svg'],
    apple: [{ url: '/images/logos/logo.svg', type: 'image/svg+xml' }]
  },
  openGraph: {
    title: 'CMIS - Tấn Đạt Taekwondo',
    description: 'Hệ thống thông tin quản lý tập trung',
    images: ['/images/logos/logo.svg']
  },
  twitter: {
    card: 'summary',
    title: 'CMIS - Tấn Đạt Taekwondo',
    description: 'Hệ thống thông tin quản lý tập trung',
    images: ['/images/logos/logo.svg']
  }
}

const RootLayout = async (props: ChildrenType) => {
  const { children } = props

  // Vars
  const systemMode = await getSystemMode()

  return (
    <html id='__next' lang='vi' dir='ltr' suppressHydrationWarning>
      <body className='flex is-full min-bs-full flex-auto flex-col' suppressHydrationWarning>
        <InitColorSchemeScript attribute='data' defaultMode={systemMode} />
        {children}
      </body>
    </html>
  )
}

export default RootLayout
