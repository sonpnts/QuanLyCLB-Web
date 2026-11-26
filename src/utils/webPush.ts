import { API_ENDPOINTS } from '@/constants/apiEndpoints'
import { apiClient } from '@/utils/apiClient'

const LOCAL_STORAGE_REGISTERED_KEY = 'cmis_webpush_registered'
const LOCAL_STORAGE_DISMISSED_AT_KEY = 'cmis_webpush_popup_dismissed_at'
const DISMISS_SNOOZE_MS = 24 * 60 * 60 * 1000 // 24 giờ
const SESSION_STORAGE_DISMISSED_KEY = 'cmis_webpush_popup_dismissed_session'

export const isWebPushPopupEnabled = (): boolean => {
  return process.env.NEXT_PUBLIC_POPNOTIWEB === 'true'
}

export const isWebPushSupported = (): boolean => {
  if (typeof window === 'undefined') return false

  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

export const isStandaloneMode = (): boolean => {
  if (typeof window === 'undefined') return false

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

export type DevicePlatformType = 'ios' | 'android' | 'desktop' | 'other'

export const getDeviceInfo = (): {
  platform: DevicePlatformType
  browserName: string
  deviceName: string
  userAgent: string
} => {
  if (typeof window === 'undefined') {
    return {
      platform: 'other',
      browserName: 'Unknown',
      deviceName: 'Unknown',
      userAgent: ''
    }
  }

  const ua = window.navigator.userAgent
  let platform: DevicePlatformType = 'desktop'
  let deviceName = 'Máy tính'
  let browserName = 'Trình duyệt'

  if (/iPad|iPhone|iPod/.test(ua)) {
    platform = 'ios'
    deviceName = /iPad/.test(ua) ? 'iPad' : 'iPhone'
  } else if (/Android/.test(ua)) {
    platform = 'android'
    deviceName = 'Điện thoại Android'
  } else if (/Macintosh|Mac OS X/.test(ua)) {
    platform = 'desktop'
    deviceName = 'Máy tính Mac'
  } else if (/Windows/.test(ua)) {
    platform = 'desktop'
    deviceName = 'Máy tính Windows'
  }

  if (ua.includes('Edg/')) {
    browserName = 'Microsoft Edge'
  } else if (ua.includes('Chrome/') && !ua.includes('Edg/')) {
    browserName = 'Google Chrome'
  } else if (ua.includes('Safari/') && !ua.includes('Chrome/')) {
    browserName = 'Safari'
  } else if (ua.includes('Firefox/')) {
    browserName = 'Mozilla Firefox'
  }

  return {
    platform,
    browserName,
    deviceName,
    userAgent: ua
  }
}

export const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }

  return outputArray
}

export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!('serviceWorker' in navigator)) return null

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    })

    await navigator.serviceWorker.ready

    return registration
  } catch (error) {
    console.error('Service Worker registration failed:', error)
    return null
  }
}

export const getPushSubscription = async (): Promise<PushSubscription | null> => {
  if (!isWebPushSupported()) return null

  try {
    const registration = await navigator.serviceWorker.ready
    return await registration.pushManager.getSubscription()
  } catch (error) {
    console.error('Failed to get push subscription:', error)
    return null
  }
}

export const fetchVapidPublicKey = async (): Promise<string | null> => {
  try {
    const res = await apiClient.get<any>(API_ENDPOINTS.webpush.config)

    if (res.data?.data?.publicKey) {
      return res.data.data.publicKey
    }

    if (res.data?.publicKey) {
      return res.data.publicKey
    }

    return null
  } catch (error) {
    console.error('Failed to fetch VAPID public key:', error)
    return null
  }
}

export const subscribeDeviceToPush = async (): Promise<{
  success: boolean
  message: string
}> => {
  if (!isWebPushSupported()) {
    return {
      success: false,
      message: 'Trình duyệt hiện tại không hỗ trợ Web Push Notification.'
    }
  }

  try {
    // 1. Request Notification Permission
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      return {
        success: false,
        message:
          permission === 'denied'
            ? 'Quyền thông báo đã bị từ chối. Vui lòng mở Cài đặt trình duyệt để cho phép thông báo.'
            : 'Bạn chưa cấp quyền nhận thông báo.'
      }
    }

    // 2. Ensure Service Worker is registered and ready
    const registration = await registerServiceWorker()
    if (!registration) {
      return {
        success: false,
        message: 'Không thể kích hoạt Service Worker trên trình duyệt này.'
      }
    }

    // 3. Fetch VAPID Public Key
    const vapidPublicKey = await fetchVapidPublicKey()
    if (!vapidPublicKey) {
      return {
        success: false,
        message: 'Không thể lấy cấu hình VAPID từ máy chủ. Vui lòng thử lại sau.'
      }
    }

    // 4. Create or reuse Push Subscription
    let subscription = await registration.pushManager.getSubscription()
    if (!subscription) {
      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey)
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey
      })
    }

    if (!subscription) {
      return {
        success: false,
        message: 'Không thể tạo Push Subscription trên thiết bị.'
      }
    }

    // 5. Extract P256dh and Auth keys
    const rawKey = subscription.getKey ? subscription.getKey('p256dh') : null
    const rawAuth = subscription.getKey ? subscription.getKey('auth') : null

    const p256dh = rawKey
      ? btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(rawKey))))
      : ''
    const auth = rawAuth
      ? btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(rawAuth))))
      : ''

    const deviceInfo = getDeviceInfo()

    // 6. Send subscription to backend
    const payload = {
      endpoint: subscription.endpoint,
      p256dh,
      auth,
      deviceName: deviceInfo.deviceName,
      browserName: deviceInfo.browserName,
      platform: deviceInfo.platform,
      userAgent: deviceInfo.userAgent
    }

    const response = await apiClient.post(API_ENDPOINTS.webpush.subscriptions, payload)

    if (response.data?.isSuccess || response.status === 200) {
      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_REGISTERED_KEY, 'true')
      }

      return {
        success: true,
        message: 'Đăng ký nhận thông báo Web Push thành công!'
      }
    }

    return {
      success: false,
      message: response.data?.message || 'Lưu subscription lên máy chủ thất bại.'
    }
  } catch (error: any) {
    console.error('Error during push registration:', error)
    return {
      success: false,
      message: error?.message || 'Đã xảy ra lỗi trong quá trình đăng ký thông báo.'
    }
  }
}

export const unsubscribeDeviceFromPush = async (): Promise<{
  success: boolean
  message: string
}> => {
  try {
    const subscription = await getPushSubscription()
    if (subscription) {
      await apiClient.delete(API_ENDPOINTS.webpush.subscriptions, {
        data: { endpoint: subscription.endpoint }
      })
      await subscription.unsubscribe()
    }

    if (typeof window !== 'undefined') {
      localStorage.removeItem(LOCAL_STORAGE_REGISTERED_KEY)
    }

    return {
      success: true,
      message: 'Đã hủy nhận thông báo trên thiết bị này.'
    }
  } catch (error: any) {
    return {
      success: false,
      message: error?.message || 'Lỗi khi hủy đăng ký thông báo.'
    }
  }
}

export const checkIsDeviceSubscribed = async (): Promise<boolean> => {
  if (typeof window === 'undefined') return false
  if (!isWebPushSupported()) return false

  if (Notification.permission !== 'granted') {
    return false
  }

  try {
    const sub = await getPushSubscription()
    if (!sub) return false

    // Check with backend
    const res = await apiClient.get<any>(
      API_ENDPOINTS.webpush.myStatus(sub.endpoint)
    )

    const isSubscribed = Boolean(res.data?.data?.isSubscribed ?? res.data?.isSubscribed)
    if (isSubscribed) {
      localStorage.setItem(LOCAL_STORAGE_REGISTERED_KEY, 'true')
    }

    return isSubscribed
  } catch {
    // If backend check fails, fallback to local storage & subscription existence
    return localStorage.getItem(LOCAL_STORAGE_REGISTERED_KEY) === 'true'
  }
}

// Giữ nguyên tên hàm để component không phải đổi import
export const isPopupDismissedInSession = (): boolean => {
  if (typeof window === 'undefined') return false

  const raw = localStorage.getItem(LOCAL_STORAGE_DISMISSED_AT_KEY)
  if (!raw) return false

  const dismissedAt = Number(raw)
  if (Number.isNaN(dismissedAt)) return false

  return Date.now() - dismissedAt < DISMISS_SNOOZE_MS
}

export const setPopupDismissedInSession = (): void => {
  if (typeof window === 'undefined') return
  localStorage.setItem(LOCAL_STORAGE_DISMISSED_AT_KEY, String(Date.now()))
}

// Gọi khi đăng nhập thành công (hoặc khi logout) để lần đăng nhập sau popup hiện lại
export const clearPopupDismissed = (): void => {
  if (typeof window === 'undefined') return
  localStorage.removeItem(LOCAL_STORAGE_DISMISSED_AT_KEY)
}
