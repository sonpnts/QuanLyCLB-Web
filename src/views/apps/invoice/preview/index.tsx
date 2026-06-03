'use client'

// React Imports
import { useState, useEffect, useRef } from 'react'

import { useReactToPrint } from 'react-to-print'
import { toast } from 'react-toastify'

// MUI Imports
import Grid from '@mui/material/Grid2'

// Type Imports
import type { PaymentRecordType, ReceiptZnsStatusType } from '@/types/apps/paymentTypes'

// API Imports
import { apiClient } from '@/utils/apiClient'
import { API_ENDPOINTS } from '@/constants/apiEndpoints'

// Component Imports
import PreviewActions from './PreviewActions'
import PreviewCard from './PreviewCard'

type Props = {
  id: string // receiptNumber (URL-decoded)
}

const Preview = ({ id }: Props) => {
  const [items, setItems] = useState<PaymentRecordType[]>([])
  const [loading, setLoading] = useState(true)
  const [znsStatus, setZnsStatus] = useState<ReceiptZnsStatusType | null>(null)
  const [znsLoading, setZnsLoading] = useState(false)
  const [znsRetrying, setZnsRetrying] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

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

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: `Bien-lai-${id}`,
    pageStyle: `
    // @page {
    //   size: A5 landscape;
    //   margin: 8mm;
    // }

    @media print {
      html,
      body {
        margin: 0 !important;
        padding: 0 !important;
        background: #fff !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }

      body * {
        visibility: hidden !important;
      }

      #print-card,
      #print-card * {
        visibility: visible !important;
      }

      #print-card {
        position: absolute !important;
        left: 0 !important;
        top: 0 !important;

        width: 194mm !important;
        max-width: 194mm !important;
        min-height: auto !important;

        margin: 0 !important;
        padding: 0 !important;
        box-shadow: none !important;
        border-radius: 0 !important;
        overflow: hidden !important;

        transform: none !important;
        zoom: 1 !important;

        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }

      #print-card * {
        box-sizing: border-box !important;
      }

      #print-card .MuiCardContent-root {
        padding: 5mm !important;
      }

      #print-card .MuiGrid-container {
        display: flex !important;
        flex-wrap: nowrap !important;
        width: 100% !important;
      }

      #print-card .MuiGrid-root {
        min-width: 0 !important;
      }

      #print-card .MuiGrid-root[class*="MuiGrid-grid-sm-6"],
      #print-card .MuiGrid-root[class*="MuiGrid-grid-md-6"] {
        flex: 0 0 50% !important;
        max-width: 50% !important;
        width: 50% !important;
      }

      #print-card .flex-col.sm\\:flex-row,
      #print-card .receipt-header,
      #print-card .print-row {
        display: flex !important;
        flex-direction: row !important;
        flex-wrap: nowrap !important;
        width: 100% !important;
      }

      #print-card .print-col {
        flex: 0 0 50% !important;
        max-width: 50% !important;
        width: 50% !important;
      }

      #print-card table {
        width: 100% !important;
        table-layout: fixed !important;
        border-collapse: collapse !important;
        font-size: 10px !important;
      }

      #print-card th,
      #print-card td {
        padding: 5px 8px !important;
        line-height: 1.25 !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }

      #print-card tr,
      #print-card table,
      #print-card .print-row,
      #print-card .signature-section {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }

      #print-card .overflow-x-auto {
        overflow: visible !important;
      }

      #print-card .previewCard__signature-space {
        height: 16mm !important;
      }
    }
  `
  })

  return (
    <Grid container spacing={6} className='preview-layout'>
      <Grid size={{ xs: 12, md: 9 }} className='preview-layout__content'>
        <div ref={contentRef}>
          <PreviewCard items={items} receiptNumber={id} loading={loading} />
        </div>
      </Grid>
      <Grid size={{ xs: 12, md: 3 }} className='preview-layout__actions'>
        <PreviewActions
          onPrint={handlePrint}
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
