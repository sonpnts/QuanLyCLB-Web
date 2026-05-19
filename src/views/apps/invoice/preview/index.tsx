'use client'

// React Imports
import { useState, useEffect } from 'react'

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

  const handlePrint = () => window.print()

  return (
    <Grid container spacing={6} className='preview-layout'>
      <Grid size={{ xs: 12, md: 9 }} className='preview-layout__content'>
        <PreviewCard items={items} receiptNumber={id} loading={loading} />
      </Grid>
      <Grid size={{ xs: 12, md: 3 }} className='preview-layout__actions'>
        <PreviewActions onPrint={handlePrint} />
      </Grid>
    </Grid>
  )
}

export default Preview
