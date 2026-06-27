'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { API_ENDPOINTS } from '@/constants/apiEndpoints'
import { apiClient } from '@/utils/apiClient'
import type { ReceiptZnsStatusType } from '@/types/apps/paymentTypes'
import { formatDateTimeVN } from '@/utils/dateTime'
import { useNotification } from '@/contexts/notificationContext'

type Props = {
  receiptNumber: string
  znsStatus: ReceiptZnsStatusType | null
  znsLoading: boolean
  znsRetrying: boolean
  onRetryZns: () => void
}

const PreviewActions = ({ receiptNumber, znsStatus, znsLoading, znsRetrying, onRetryZns }: Props) => {
  const router = useRouter()
  const { showNotification } = useNotification()
  const [printing, setPrinting] = useState(false)

  const handlePrint = async () => {
    if (!receiptNumber) return

    try {
      setPrinting(true)
      const response = await apiClient.get(API_ENDPOINTS.print.receipt(receiptNumber), {
        responseType: 'blob'
      })

      if (response.status >= 400 || response.data?.isSuccess === false) {
        const msg = response.data?.message || 'Không thể tải biên lai để in.'
        showNotification(msg, 'error')
        return
      }

      const contentType = response.headers?.['content-type'] || ''
      if (!contentType.includes('application/pdf')) {
        const text = typeof response.data === 'string' ? response.data : await (response.data as Blob).text()
        try {
          const parsed = JSON.parse(text)
          showNotification(parsed?.message || 'Lỗi server khi tạo PDF.', 'error')
        } catch {
          showNotification('Phản hồi không hợp lệ từ server.', 'error')
        }
        return
      }

      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')

      setTimeout(() => URL.revokeObjectURL(url), 30000)
    } catch {
      showNotification('Không thể tải biên lai để in. Vui lòng thử lại.', 'error')
    } finally {
      setPrinting(false)
    }
  }

  return (
    <Card>
      <CardContent>
        <Stack spacing={3}>
          <Box>
            <Typography variant='subtitle2' color='text.secondary' gutterBottom>
              Trạng thái Zalo
            </Typography>
            {znsLoading ? (
              <Box className='flex items-center gap-2'>
                <CircularProgress size={16} />
                <Typography variant='body2'>Đang kiểm tra...</Typography>
              </Box>
            ) : !znsStatus?.hasLog ? (
              <Typography variant='body2'>Chưa có lịch sử gửi Zalo.</Typography>
            ) : (
              <Stack spacing={1.5}>
                <Chip
                  size='small'
                  icon={znsStatus.isSent ? <i className='ri-check-line' /> : <i className='ri-close-line' />}
                  color={znsStatus.isSent ? 'success' : 'error'}
                  label={znsStatus.isSent ? 'Đã gửi' : 'Gửi thất bại'}
                />
                {znsStatus.monthlyStatuses?.map(ms => (
                  <Box key={`${ms.forMonth}-${ms.forYear}`} className='flex items-center gap-1.5 flex-wrap'>
                    <Chip
                      size='small'
                      variant='outlined'
                      icon={ms.isSent ? <i className='ri-check-line' /> : ms.hasLog ? <i className='ri-close-line' /> : <i className='ri-time-line' />}
                      color={ms.isSent ? 'success' : ms.hasLog ? 'error' : 'default'}
                      label={ms.monthLabel}
                    />
                    {ms.sentAt && (
                      <Typography variant='caption' color='text.secondary'>
                        {formatDateTimeVN(ms.sentAt)}
                      </Typography>
                    )}
                  </Box>
                ))}
              </Stack>
            )}
          </Box>

          <Stack spacing={1.5}>
            {znsStatus?.canRetry && (
              <Button
                fullWidth
                variant='contained'
                color='info'
                startIcon={znsRetrying ? <CircularProgress size={16} color='inherit' /> : <i className='ri-whatsapp-line' />}
                onClick={onRetryZns}
                disabled={znsRetrying || znsLoading}
                sx={{ minHeight: 40 }}
              >
                Gửi lại Zalo
              </Button>
            )}
            <Button
              fullWidth
              variant='contained'
              startIcon={printing ? <CircularProgress size={16} color='inherit' /> : <i className='ri-printer-line' />}
              onClick={handlePrint}
              disabled={printing}
              sx={{ minHeight: 40 }}
            >
              {printing ? 'Đang tải...' : 'In biên lai'}
            </Button>
            <Button
              fullWidth
              color='secondary'
              variant='outlined'
              startIcon={<i className='ri-arrow-go-back-line' />}
              onClick={() => router.back()}
              sx={{ minHeight: 40 }}
            >
              Quay lại
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  )
}

export default PreviewActions
