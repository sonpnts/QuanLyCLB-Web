'use client'

import { useAuth } from '@/contexts/authContext'

/**
 * Returns true if the current user has at least one of the given roles.
 * Roles are case-sensitive and must match the backend values exactly.
 *
 * Prefer using RoleGuard (route-based) for page-level protection.
 * useHasRole is useful for conditional rendering inside a page
 * (e.g. hiding a button for non-admins).
 */
export function useHasRole(allowedRoles: string[]): boolean {
  const { auth } = useAuth()
  const userRoles = auth?.roles ?? []

  return allowedRoles.some(role => userRoles.includes(role))
}

/** Convenience: returns true if user is an Administrator or Admin */
export function useIsAdmin(): boolean {
  return useHasRole(['Administrator', 'Admin'])
}

/** Convenience: returns true if user is a Coach */
export function useIsCoach(): boolean {
  return useHasRole(['Coach', 'Instructor'])
}
