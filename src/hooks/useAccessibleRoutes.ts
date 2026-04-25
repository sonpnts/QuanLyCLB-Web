'use client'

import { useState, useEffect } from 'react'

import type { VerticalMenuDataType } from '@/types/menuTypes'
import menuService from '@/services/menuService'
import { useAuth } from '@/contexts/authContext'

function extractHrefs(items: VerticalMenuDataType[]): string[] {
  const hrefs: string[] = []

  for (const item of items) {
    const href = (item as any).href
    if (href) hrefs.push(href)

    const children = (item as any).children
    if (children) hrefs.push(...extractHrefs(children))
  }

  return hrefs
}

/**
 * Returns the list of hrefs the current user can access, derived from
 * the role-filtered menu returned by the backend.
 *
 * Uses menuService's built-in cache so it doesn't re-fetch on every render.
 */
export function useAccessibleRoutes(): { routes: string[]; loading: boolean } {
  const { isAuthenticated, isInitialized } = useAuth()
  const [routes, setRoutes] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isInitialized) return

    if (!isAuthenticated) {
      setRoutes([])
      setLoading(false)
      return
    }

    menuService.getMenuByRole().then(res => {
      if (res.success && res.data && res.data.length > 0) {
        setRoutes(extractHrefs(res.data))
      } else {
        // Menu fetch failed — set empty so guard falls back to "allow"
        setRoutes([])
      }

      setLoading(false)
    })
  }, [isAuthenticated, isInitialized])

  return { routes, loading }
}
