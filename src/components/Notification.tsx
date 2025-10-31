'use client'

// MUI Imports
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import IconButton from '@mui/material/IconButton'
import Slide, { SlideProps } from '@mui/material/Slide'

// Context Imports
import { useNotification } from '@/contexts/notificationContext'

// Type Imports
import type { NotificationSeverity } from '@/contexts/notificationContext'

function SlideTransition(props: SlideProps) {
  return <Slide {...props} direction='down' />
}

const Notification = () => {
  const { notifications, removeNotification } = useNotification()

  const handleClose = (id: string) => {
    removeNotification(id)
  }

  return (
    <>
      {notifications.map(notification => (
        <Snackbar
          key={notification.id}
          open={true}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          TransitionComponent={SlideTransition}
          sx={{ top: { xs: 20, sm: 24 } }}
        >
          <Alert
            onClose={() => handleClose(notification.id)}
            severity={notification.severity as NotificationSeverity}
            variant='filled'
            sx={{
              minWidth: { xs: 300, sm: 350 },
              '& .MuiAlert-action': {
                alignItems: 'center'
              }
            }}
          >
            <AlertTitle sx={{ fontWeight: 600 }}>{getSeverityTitle(notification.severity)}</AlertTitle>
            {notification.message}
          </Alert>
        </Snackbar>
      ))}
    </>
  )
}

const getSeverityTitle = (severity: string): string => {
  switch (severity) {
    case 'success':
      return 'Thành công'
    case 'error':
      return 'Lỗi'
    case 'warning':
      return 'Cảnh báo'
    case 'info':
    default:
      return 'Thông tin'
  }
}

export default Notification






