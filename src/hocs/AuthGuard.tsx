'use client'

// Type Imports
import type { ChildrenType } from '@core/types'

// Context Imports
import { useAuth } from '@/contexts/authContext'

// Component Imports
import AuthRedirect from '@/components/AuthRedirect'

export default function AuthGuard({ children }: ChildrenType) {
  const { isAuthenticated, isInitialized } = useAuth()

  if (!isInitialized) {
    return null
  }

  if (!isAuthenticated) {
    return <AuthRedirect />
  }

  return <>{children}</>
}
