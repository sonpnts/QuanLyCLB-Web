'use client'

// React Imports
import { useEffect } from 'react'

// Next Imports
import { useRouter } from 'next/navigation'

// Type Imports
import type { ChildrenType } from '@core/types'

// Config Imports
import themeConfig from '@configs/themeConfig'

// Util Imports

import { useAuth } from '@/contexts/authContext'

const GuestOnlyRoute = ({ children }: ChildrenType) => {
  const router = useRouter()
  const { isAuthenticated, isInitialized } = useAuth()

  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      router.replace(themeConfig.homePageUrl)
    }
  }, [isAuthenticated, isInitialized, router])

  if (!isInitialized || isAuthenticated) {
    return null
  }

  return <>{children}</>
}

export default GuestOnlyRoute
