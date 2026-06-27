'use client'

import { useState, useEffect } from 'react'

import { toast } from 'react-toastify'

import Grid from '@mui/material/Grid2'

import type { PaymentRecordType, ReceiptZnsStatusType } from '@/types/apps/paymentTypes'

import { apiClient } from '@/utils/apiClient'
import { API_ENDPOINTS } from '@/constants/apiEndpoints'

import PreviewActions from './PreviewActions'
import PreviewCard from './PreviewCard'

type Props = {
  id: string
}

const Preview = ({ id }: Props) => {
  const [items, setItems] = useState<PaymentRecordType[]>([])
  const [loading, setLoading] = useState(true)
  const [znsStatus, setZnsStatus] = useState<ReceiptZnsStatusType | null>(null)
  const [znsLoading, setZnsLoading] = useState(false)
  const [znsRetrying, setZnsRetrying] = useState(false)

  const fetchReceiptZnsStatus = async (currentReceiptNumber: string, retryIfMissing = false) => {
    setZnsLoading(true)

    try {
      let latestStatus: ReceiptZnsStatusType | null = null
      const totalAttempts = retryIfMissing ? 10 : 1

      for (let attempt = 0; attempt < totalAttempts; attempt++) {
        const response = await apiClient.get<any>(API_ENDPOINTS.payments.receiptZnsStatus(currentReceiptNumber))

        if (response.data?.isSuccess) {
          latestStatus = response.data.data as ReceiptZnsStatusType
          setZnsStatus(latestStatus)

          if (latestStatus.isSent || !retryIfMissing) {
            return
          }
        } else {
          latestStatus = null
          setZnsStatus(null)
        }

        if (retryIfMissing && attempt < totalAttempts - 1) {
          await new Promise(resolve => window.setTimeout(resolve, 1500))
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
    if (!id) {
      setItems([])
      setZnsStatus(null)

      return
    }

    const fetchReceipt = async () => {
      setLoading(true)

      try {
        const res = await apiClient.get<any>(API_ENDPOINTS.payments.byReceipt(id))

        if (res.data?.isSuccess) {
          const data = res.data.data

          setItems(Array.isArray(data) ? data : [])
        }
      } catch {
        // silent - PreviewCard will show empty state
      } finally {
        setLoading(false)
      }
    }

    fetchReceipt()
  }, [id])

  useEffect(() => {
    if (!id) {
      setZnsStatus(null)

      return
    }

    void fetchReceiptZnsStatus(id, true)
  }, [id])

  const handleRetryZns = async () => {
    if (!id || !znsStatus?.canRetry) return

    try {
      setZnsRetrying(true)

      const response = await apiClient.post<any>(API_ENDPOINTS.payments.receiptZnsRetry(id))

      if (response.data?.isSuccess) {
        await fetchReceiptZnsStatus(id, true)
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

  return (
    <Grid container spacing={6} className='preview-layout'>
      <Grid size={{ xs: 12, md: 9 }} className='preview-layout__content'>
        <PreviewCard items={items} receiptNumber={id} loading={loading} />
      </Grid>
      <Grid size={{ xs: 12, md: 3 }} className='preview-layout__actions'>
        <PreviewActions
          receiptNumber={id}
          znsStatus={znsStatus}
          znsLoading={znsLoading}
          znsRetrying={znsRetrying}
          onRetryZns={handleRetryZns}
        />
      </Grid>
    </Grid>
  )
}

export default Preview
