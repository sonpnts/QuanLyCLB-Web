'use client'

// Next Imports
import Link from 'next/link'

// MUI Imports
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'

import type { ReceiptZnsStatusType } from '@/types/apps/paymentTypes'
import { formatDateTimeVN } from '@/utils/dateTime'

import { useRouter } from 'next/navigation'

type Props = {
  onPrint: () => void
  znsStatus: ReceiptZnsStatusType | null
  znsLoading: boolean
  znsRetrying: boolean
  onRetryZns: () => void
}


const PreviewActions = ({ onPrint, znsStatus, znsLoading, znsRetrying, onRetryZns }: Props) => {
  const router = useRouter()

  return (
    <Card>
      <CardContent className='flex flex-col gap-4'>
        <Box className='flex flex-col gap-2'>
          <Typography variant='subtitle2' color='text.secondary'>
            Trạng thái Zalo
          </Typography>
          {znsLoading ? (
            <Box className='flex items-center gap-2'>
              <CircularProgress size={18} />
              <Typography variant='body2'>Đang kiểm tra...</Typography>
            </Box>
          ) : !znsStatus?.hasLog ? (
            <Typography variant='body2'>Chưa có lịch sử gửi Zalo.</Typography>
          ) : (
            <Box className='flex flex-col gap-2'>
              <Box className='flex items-center gap-2 flex-wrap'>
                <Chip
                  size='small'
                  color={znsStatus.isSent ? 'success' : 'error'}
                  label={znsStatus.isSent ? 'Đã gửi' : 'Gửi thất bại'}
                />
              </Box>
              {znsStatus.monthlyStatuses && znsStatus.monthlyStatuses.length > 0 && (
                <Box className='flex flex-col gap-1'>
                  {znsStatus.monthlyStatuses.map((ms) => (
                    <Box key={`${ms.forMonth}-${ms.forYear}`} className='flex items-center gap-2 flex-wrap'>
                      <Chip
                        size='small'
                        variant='outlined'
                        color={ms.isSent ? 'success' : ms.hasLog ? 'error' : 'default'}
                        label={ms.monthLabel}
                      />
                      <Typography variant='caption' color={ms.isSent ? 'success.main' : ms.hasLog ? 'error.main' : 'text.secondary'}>
                        {ms.isSent ? 'Đã gửi' : ms.hasLog ? 'Gửi thất bại' : 'Chưa gửi'}
                      </Typography>
                      {ms.sentAt && (
                        <Typography variant='caption' color='text.secondary'>
                          {formatDateTimeVN(ms.sentAt)}
                        </Typography>
                      )}
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          )}
          {znsStatus?.canRetry && (
            <Button
              fullWidth
              variant='contained'
              color='info'
              startIcon={<i className='ri-refresh-line' />}
              onClick={onRetryZns}
              disabled={znsRetrying || znsLoading}
            >
              Gửi lại Zalo
            </Button>
          )}
        </Box>
        <Button fullWidth variant='contained' startIcon={<i className='ri-printer-line' />} onClick={onPrint}>
          In biên lai
        </Button>
        <Button
          fullWidth
          color='secondary'
          variant='outlined'
          startIcon={<i className='ri-arrow-left-line' />}
          onClick={() => router.back()}
        >
          Quay lại
        </Button>
      </CardContent>
    </Card>
  )
}

export default PreviewActions

