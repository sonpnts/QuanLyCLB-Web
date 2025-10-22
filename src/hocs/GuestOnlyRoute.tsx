'use client'

// React Imports
import { useEffect } from 'react'

// Next Imports
import { useRouter } from 'next/navigation'

// Type Imports
import type { ChildrenType } from '@core/types'
import type { Locale } from '@configs/i18n'

// Config Imports
import themeConfig from '@configs/themeConfig'

// Util Imports
import { getLocalizedUrl } from '@/utils/i18n'
import { useAuth } from '@/contexts/authContext'

const GuestOnlyRoute = ({ children, lang }: ChildrenType & { lang: Locale }) => {
  const router = useRouter()
  const { isAuthenticated, isInitialized } = useAuth()

  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      router.replace(getLocalizedUrl(themeConfig.homePageUrl, lang))
    }
  }, [isAuthenticated, isInitialized, lang, router])

  if (!isInitialized || isAuthenticated) {
    return null
  }

  return <>{children}</>
}

export default GuestOnlyRoute
