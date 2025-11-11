'use client'

/**
 * EXAMPLE: Cách sử dụng Notification System
 *
 * File này chỉ là ví dụ, xóa đi nếu không cần
 */

// MUI Imports
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'

import { useNotification } from '@/contexts/notificationContext'
import { showSuccess, showError, showWarning, showInfo, NotificationMessages } from '@/utils/notifications'

const NotificationExample = () => {
  const { showNotification } = useNotification()

  return (
    <Paper sx={{ p: 4, m: 4 }}>
      <Typography variant='h5' gutterBottom>
        Notification System Examples
      </Typography>

      <Stack spacing={2} mt={3}>
        <Button
          variant='contained'
          color='success'
          onClick={() => showSuccess(showNotification, 'Thành công! Lớp học đã được tạo.')}
        >
          Show Success
        </Button>

        <Button
          variant='contained'
          color='error'
          onClick={() => showError(showNotification, 'Đã có lỗi xảy ra. Vui lòng thử lại.')}
        >
          Show Error
        </Button>

        <Button
          variant='contained'
          color='warning'
          onClick={() => showWarning(showNotification, 'Vui lòng kiểm tra lại thông tin.')}
        >
          Show Warning
        </Button>

        <Button variant='contained' color='info' onClick={() => showInfo(showNotification, 'Đang xử lý dữ liệu...')}>
          Show Info
        </Button>

        <Button variant='outlined' onClick={() => showSuccess(showNotification, NotificationMessages.success.create)}>
          Using Predefined Success Message
        </Button>

        <Button variant='outlined' onClick={() => showError(showNotification, NotificationMessages.error.create)}>
          Using Predefined Error Message
        </Button>

        <Button
          variant='outlined'
          onClick={() => {
            // Show multiple notifications
            showSuccess(showNotification, 'Task 1 completed')
            setTimeout(() => showInfo(showNotification, 'Processing task 2...'), 1000)
            setTimeout(() => showSuccess(showNotification, 'All tasks completed!'), 3000)
          }}
        >
          Show Multiple Notifications
        </Button>
      </Stack>
    </Paper>
  )
}

export default NotificationExample

/**
 * Cách sử dụng trong component của bạn:
 *
 * 1. Import hook:
 *    import { useNotification } from '@/contexts/notificationContext'
 *
 * 2. Sử dụng trong component:
 *    const { showNotification } = useNotification()
 *
 * 3. Hiển thị thông báo:
 *    showNotification('Thành công!', 'success')
 *    showNotification('Lỗi!', 'error')
 *    showNotification('Cảnh báo!', 'warning')
 *    showNotification('Thông tin...', 'info')
 *
 * 4. Hoặc dùng helper:
 *    import { showSuccess } from '@/utils/notifications'
 *    showSuccess(showNotification, 'Thành công!')
 */
