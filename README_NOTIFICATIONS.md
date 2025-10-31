# Hướng dẫn sử dụng hệ thống Thông báo

## Tổng quan

Hệ thống thông báo sử dụng Material-UI Snackbar để hiển thị các thông báo tự động ở góc phải trên cùng. Thông báo sẽ tự động biến mất sau 5 giây.

## Cách sử dụng

### 1. Import hook trong component

```typescript
import { useNotification } from '@/contexts/notificationContext'

const MyComponent = () => {
  const { showNotification } = useNotification()

  // Sử dụng showNotification để hiển thị thông báo
}
```

### 2. Sử dụng trực tiếp

```typescript
const { showNotification } = useNotification()

// Thành công
showNotification('Tạo thành công!', 'success')

// Lỗi
showNotification('Đã có lỗi xảy ra!', 'error')

// Cảnh báo
showNotification('Vui lòng kiểm tra lại!', 'warning')

// Thông tin
showNotification('Đang xử lý...', 'info')
```

### 3. Sử dụng với helper functions

```typescript
import { showSuccess, showError, NotificationMessages } from '@/utils/notifications'

const { showNotification } = useNotification()

// Sử dụng helper
showSuccess(showNotification, 'Tạo lớp học thành công!')
showError(showNotification, 'Không thể tạo lớp học.')

// Hoặc dùng messages có sẵn
showSuccess(showNotification, NotificationMessages.success.create)
showError(showNotification, NotificationMessages.error.create)
```

## Các loại thông báo

1. **success**: Thành công (màu xanh lá)
2. **error**: Lỗi (màu đỏ)
3. **warning**: Cảnh báo (màu cam)
4. **info**: Thông tin (màu xanh dương)

## Ví dụ sử dụng trong component

```typescript
'use client'

import { useState } from 'react'
import { useNotification } from '@/contexts/notificationContext'
import { showSuccess, showError } from '@/utils/notifications'
import Button from '@mui/material/Button'

const MyComponent = () => {
  const [loading, setLoading] = useState(false)
  const { showNotification } = useNotification()

  const handleSubmit = async () => {
    try {
      setLoading(true)

      // API call
      const response = await someService.create()

      if (response.success) {
        showSuccess(showNotification, 'Tạo thành công!')
      } else {
        showError(showNotification, 'Không thể tạo.')
      }
    } catch (error) {
      showError(showNotification, 'Đã có lỗi xảy ra.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={handleSubmit} disabled={loading}>
      Submit
    </Button>
  )
}
```

## Tính năng

- ✅ Hiển thị ở góc phải trên cùng
- ✅ Tự động biến mất sau 5 giây
- ✅ Có thể đóng thủ công bằng nút X
- ✅ Hỗ trợ 4 loại: success, error, warning, info
- ✅ Có tiêu đề tự động theo loại thông báo
- ✅ Ẩn các thông báo đã chọn khỏi dropdown
- ✅ Hiển thị dưới dạng chip







