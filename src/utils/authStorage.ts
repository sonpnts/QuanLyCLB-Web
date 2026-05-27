const STORAGE_KEY = 'clb-auth'

export type AuthUser = {
  id: string
  fullName: string
  email: string
  phoneNumber?: string | null
  beltLevelName?: string | null
  avatar?: string | null
}

export type AuthSnapshot = {
  accessToken: string
  refreshToken: string
  expiresAtUtc?: string | null
  user: AuthUser
  roles: string[]
  permissions: string[]
}

type AuthTokens = Partial<Pick<AuthSnapshot, 'accessToken' | 'refreshToken' | 'expiresAtUtc'>>

type Listener = (value: AuthSnapshot | null) => void

const listeners = new Set<Listener>()

const isBrowser = () => typeof window !== 'undefined'

const notify = (value: AuthSnapshot | null) => {
  listeners.forEach(listener => listener(value))
}

export const authStorage = {
  get(): AuthSnapshot | null {
    if (!isBrowser()) {
      return null
    }

    const raw = window.localStorage.getItem(STORAGE_KEY)

    if (!raw) {
      return null
    }

    try {
      const parsed = JSON.parse(raw) as Partial<AuthSnapshot>

      
return {
        accessToken: parsed.accessToken || '',
        refreshToken: parsed.refreshToken || '',
        expiresAtUtc: parsed.expiresAtUtc,
        user: parsed.user as AuthUser,
        roles: Array.isArray(parsed.roles) ? parsed.roles : [],
        permissions: Array.isArray(parsed.permissions) ? parsed.permissions : []
      }
    } catch (error) {
      window.localStorage.removeItem(STORAGE_KEY)

      return null
    }
  },
  set(value: AuthSnapshot) {
    if (!isBrowser()) {
      return
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
    notify(value)
  },
  updateTokens(tokens: AuthTokens) {
    if (!isBrowser()) {
      return null
    }

    const current = this.get()

    if (!current) {
      return null
    }

    const updated: AuthSnapshot = {
      ...current,
      ...tokens
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    notify(updated)

    return updated
  },
  clear() {
    if (!isBrowser()) {
      return
    }

    window.localStorage.removeItem(STORAGE_KEY)
    notify(null)
  },
  subscribe(listener: Listener) {
    listeners.add(listener)

    return () => {
      listeners.delete(listener)
    }
  }
}

export type { AuthTokens }
