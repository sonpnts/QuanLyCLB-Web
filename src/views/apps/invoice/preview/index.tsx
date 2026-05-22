'use client'

// React Imports
import { useState, useEffect, useRef } from 'react'
import { useReactToPrint } from 'react-to-print'

// MUI Imports
import Grid from '@mui/material/Grid2'

// Type Imports
import type { PaymentRecordType } from '@/types/apps/paymentTypes'

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
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!id) return

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
        <PreviewActions onPrint={handlePrint} />
      </Grid>
    </Grid>
  )
}

export default Preview
