'use client'

// React Imports
import { createContext, useContext, useState, useCallback } from 'react'

// Type Imports
import type { ReactNode } from 'react'

export type NotificationSeverity = 'success' | 'error' | 'warning' | 'info'

interface Notification {
  id: string
  message: string
  severity: NotificationSeverity
}

interface NotificationContextType {
  showNotification: (message: string, severity?: NotificationSeverity) => void
  notifications: Notification[]
  removeNotification: (id: string) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export const useNotification = () => {
  const context = useContext(NotificationContext)

  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider')
  }

  return context
}

interface NotificationProviderProps {
  children: ReactNode
}

export const NotificationProvider = ({ children }: NotificationProviderProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id))
  }, [])

  const showNotification = useCallback(
    (message: string, severity: NotificationSeverity = 'info') => {
      const id = `${Date.now()}-${Math.random()}`
      const newNotification: Notification = { id, message, severity }

      setNotifications(prev => [...prev, newNotification])

      // Auto remove after 5 seconds
      setTimeout(() => {
        removeNotification(id)
      }, 5000)
    },
    [removeNotification]
  )

  return (
    <NotificationContext.Provider value={{ showNotification, notifications, removeNotification }}>
      {children}
    </NotificationContext.Provider>
  )
}

// Export helper functions for convenience
export const notificationHelper = {
  success: (message: string) => ({ message, severity: 'success' as NotificationSeverity }),
  error: (message: string) => ({ message, severity: 'error' as NotificationSeverity }),
  warning: (message: string) => ({ message, severity: 'warning' as NotificationSeverity }),
  info: (message: string) => ({ message, severity: 'info' as NotificationSeverity })
}
