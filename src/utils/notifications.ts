/**
 * Notification utility functions
 *
 * Use this file to easily create notification messages
 */

// Example usage:
// import { showSuccess, showError } from '@/utils/notifications'
// import { useNotification } from '@/contexts/notificationContext'
//
// const { showNotification } = useNotification()
// showSuccess(showNotification, 'Thành công!')

type NotificationSeverity = 'success' | 'error' | 'warning' | 'info'

type ShowNotificationFn = (message: string, severity?: NotificationSeverity) => void

/**
 * Show success notification
 */
export const showSuccess = (showNotification: ShowNotificationFn, message: string) => {
  showNotification(message, 'success')
}

/**
 * Show error notification
 */
export const showError = (showNotification: ShowNotificationFn, message: string) => {
  showNotification(message, 'error')
}

/**
 * Show warning notification
 */
export const showWarning = (showNotification: ShowNotificationFn, message: string) => {
  showNotification(message, 'warning')
}

/**
 * Show info notification
 */
export const showInfo = (showNotification: ShowNotificationFn, message: string) => {
  showNotification(message, 'info')
}

/**
 * Common notification messages
 */
export const NotificationMessages = {
  // Success messages
  success: {
    create: 'Tạo thành công!',
    update: 'Cập nhật thành công!',
    delete: 'Xóa thành công!',
    save: 'Lưu thành công!',
    submit: 'Gửi thành công!',
    upload: 'Tải lên thành công!'
  },

  // Error messages
  error: {
    create: 'Không thể tạo. Vui lòng thử lại.',
    update: 'Không thể cập nhật. Vui lòng thử lại.',
    delete: 'Không thể xóa. Vui lòng thử lại.',
    save: 'Không thể lưu. Vui lòng thử lại.',
    submit: 'Không thể gửi. Vui lòng thử lại.',
    upload: 'Không thể tải lên. Vui lòng thử lại.',
    load: 'Không thể tải dữ liệu. Vui lòng thử lại.',
    generic: 'Đã có lỗi xảy ra. Vui lòng thử lại.'
  },

  // Warning messages
  warning: {
    unsavedChanges: 'Bạn có thay đổi chưa lưu.',
    confirmAction: 'Vui lòng xác nhận hành động này.',
    validationFailed: 'Vui lòng kiểm tra lại thông tin nhập vào.'
  },

  // Info messages
  info: {
    loading: 'Đang tải dữ liệu...',
    processing: 'Đang xử lý...',
    saving: 'Đang lưu...'
  }
}
