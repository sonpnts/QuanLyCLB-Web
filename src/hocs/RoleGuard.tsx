'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

import { useAuth } from '@/contexts/authContext'
import { useAccessibleRoutes } from '@/hooks/useAccessibleRoutes'

type Props = {
  children: React.ReactNode
}

/**
 * Route-based access guard.
 *
 * Checks whether the current pathname exists in the user's role-filtered menu
 * (returned by GET /api/menu/by-role). If the route is not accessible, the
 * user is redirected to the 401 page.
 *
 * This guard is driven by the RBAC matrix stored in the backend — changing
 * MenuItem.RequiredRoles via the Permissions admin page automatically takes
 * effect here without any frontend code changes.
 *
 * Fallback behaviour:
 * - While the menu is loading → render nothing (avoid flash of 401)
 * - If the menu fetch fails (empty routes) → allow access (backend API will
 *   still enforce authorization on every request)
 */
export default function RoleGuard({ children }: Props) {
  const { isInitialized } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const { routes, loading } = useAccessibleRoutes()

  // Allow if: still loading, menu failed to load, or route is in accessible list
  const accessible = loading || routes.length === 0 || routes.includes(pathname)

  useEffect(() => {
    if (!isInitialized || loading) return
    if (!accessible) {
      router.replace('/pages/misc/401-not-authorized')
    }
  }, [isInitialized, loading, accessible, router])

  if (!isInitialized || loading || !accessible) return null

  return <>{children}</>
}
