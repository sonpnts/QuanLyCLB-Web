'use client'

// Type Imports
import type { Locale } from '@configs/i18n'
import type { ChildrenType } from '@core/types'

// Context Imports
import { useAuth } from '@/contexts/authContext'

// Component Imports
import AuthRedirect from '@/components/AuthRedirect'

export default function AuthGuard({ children, locale }: ChildrenType & { locale: Locale }) {
  const { isAuthenticated, isInitialized } = useAuth()

  if (!isInitialized) {
    return null
  }

  if (!isAuthenticated) {
    return <AuthRedirect lang={locale} />
  }

  return <>{children}</>
}
