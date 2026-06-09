'use client'

import { useEffect, useRef, useState } from 'react'

import { useReactToPrint } from 'react-to-print'
import { toast } from 'react-toastify'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Typography from '@mui/material/Typography'

import { API_ENDPOINTS } from '@/constants/apiEndpoints'
import type { PaymentRecordType, ReceiptZnsStatusType } from '@/types/apps/paymentTypes'
import { apiClient } from '@/utils/apiClient'
import { formatDateTimeVN } from '@/utils/dateTime'

import PreviewCard from './PreviewCard'

type ReceiptPreviewDialogProps = {
  open: boolean
  receiptNumber: string | null
  onClose: () => void
}

const ReceiptPreviewDialog = ({ open, receiptNumber, onClose }: ReceiptPreviewDialogProps) => {
  const previewMaxWidth = 1000
  const [items, setItems] = useState<PaymentRecordType[]>([])
  const [loading, setLoading] = useState(false)
  const [znsStatus, setZnsStatus] = useState<ReceiptZnsStatusType | null>(null)
  const [znsLoading, setZnsLoading] = useState(false)
  const [znsRetrying, setZnsRetrying] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  const fetchReceipt = async (currentReceiptNumber: string) => {
    setLoading(true)

    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.payments.byReceipt(currentReceiptNumber))

      if (response.data?.isSuccess) {
        setItems(Array.isArray(response.data.data) ? response.data.data : [])
      } else {
        setItems([])
        toast.error(response.data?.message || 'Không thể tải biên lai.')
      }
    } catch {
      setItems([])
      toast.error('Lỗi khi tải biên lai.')
    } finally {
      setLoading(false)
    }
  }

  const fetchReceiptZnsStatus = async (currentReceiptNumber: string, retryIfMissing = false) => {
    setZnsLoading(true)

    try {
      let latestStatus: ReceiptZnsStatusType | null = null
      const totalAttempts = retryIfMissing ? 5 : 1

      for (let attempt = 0; attempt < totalAttempts; attempt++) {
        const response = await apiClient.get<any>(API_ENDPOINTS.payments.receiptZnsStatus(currentReceiptNumber))

        if (response.data?.isSuccess) {
          latestStatus = response.data.data as ReceiptZnsStatusType
          setZnsStatus(latestStatus)

          if (latestStatus.hasLog || !retryIfMissing) {
            return
          }
        } else {
          latestStatus = null
          setZnsStatus(null)
        }

        if (retryIfMissing && attempt < totalAttempts - 1) {
          await new Promise(resolve => window.setTimeout(resolve, 900))
        }
      }

      if (!latestStatus) {
        setZnsStatus(null)
      }
    } catch {
      setZnsStatus(null)
    } finally {
      setZnsLoading(false)
    }
  }

  useEffect(() => {
    if (!open || !receiptNumber) {
      setItems([])
      setZnsStatus(null)
      return
    }

    void fetchReceipt(receiptNumber)
    void fetchReceiptZnsStatus(receiptNumber, true)
  }, [open, receiptNumber])

  const handleRetryZns = async () => {
    if (!receiptNumber || !znsStatus?.canRetry) return

    try {
      setZnsRetrying(true)

      const response = await apiClient.post<any>(API_ENDPOINTS.payments.receiptZnsRetry(receiptNumber))

      if (response.data?.isSuccess) {
        await fetchReceiptZnsStatus(receiptNumber, true)
        toast.success(response.data.message || 'Đã gửi lại thông báo Zalo.')
        return
      }

      toast.error(response.data?.message || 'Không thể gửi lại thông báo Zalo.')
    } catch {
      toast.error('Lỗi khi gửi lại thông báo Zalo.')
    } finally {
      setZnsRetrying(false)
    }
  }

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: receiptNumber ? `Bien-lai-${receiptNumber}` : 'Bien-lai'
  })

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      PaperProps={{
        sx: {
          width: '100%',
          maxWidth: `${previewMaxWidth + 40}px`,
          mx: { xs: 1.5, sm: 3 }
        }
      }}
    >
      <DialogTitle>
        <Typography variant='h6'>Xem biên lai {receiptNumber ? `- ${receiptNumber}` : ''}</Typography>
      </DialogTitle>
      <DialogContent dividers>
        <Box display='flex' flexDirection='column' gap={3} alignItems='center'>
          <Box
            display='flex'
            alignItems='center'
            justifyContent='center'
            gap={2}
            flexWrap='wrap'
            sx={{ width: '100%', maxWidth: `${previewMaxWidth}px` }}
          >
            <Typography variant='body2' color='text.secondary'>
              Trạng thái Zalo:
            </Typography>
            {znsLoading ? (
              <Box display='flex' alignItems='center' gap={1}>
                <CircularProgress size={16} />
                <Typography variant='body2'>Đang kiểm tra...</Typography>
              </Box>
            ) : !znsStatus?.hasLog ? (
              <Typography variant='body2'>Chưa có lịch sử gửi Zalo.</Typography>
            ) : (
              <>
                <Chip
                  size='small'
                  color={znsStatus.isSent ? 'success' : 'error'}
                  label={znsStatus.isSent ? 'Đã gửi' : 'Gửi thất bại'}
                />
                {znsStatus.sentAtUtc ? (
                  <Typography variant='body2'>{formatDateTimeVN(znsStatus.sentAtUtc)}</Typography>
                ) : null}
              </>
            )}
          </Box>

          <Box sx={{ width: '100%', maxWidth: `${previewMaxWidth}px`, mx: 'auto' }}>
            <div ref={contentRef}>
              <PreviewCard items={items} receiptNumber={receiptNumber || ''} loading={loading} />
            </div>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 3 }, justifyContent: 'center' }}>
        <Box
          sx={{
            width: '100%',
            maxWidth: `${previewMaxWidth}px`,
            mx: 'auto',
            display: 'flex',
            justifyContent: 'center',
            gap: 1.5,
            flexWrap: 'wrap'
          }}
        >
          {znsStatus?.canRetry ? (
            <Button
              variant='contained'
              color='info'
              onClick={handleRetryZns}
              disabled={znsRetrying || znsLoading || loading}
              sx={{ minWidth: { xs: '100%', sm: 160 } }}
            >
              Gửi lại Zalo
            </Button>
          ) : null}
          <Button
            variant='contained'
            onClick={handlePrint}
            disabled={loading || items.length === 0}
            sx={{ minWidth: { xs: '100%', sm: 160 } }}
          >
            In biên lai
          </Button>
          <Button variant='outlined' onClick={onClose} sx={{ minWidth: { xs: '100%', sm: 120 } }}>
            Đóng
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  )
}

export default ReceiptPreviewDialog
