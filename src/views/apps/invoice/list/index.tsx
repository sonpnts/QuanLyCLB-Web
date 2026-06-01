'use client'

// React Imports
import { useCallback, useEffect, useMemo, useState } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid2'

// Component Imports
import InvoiceListTable from './InvoiceListTable'
import InvoiceCard from './InvoiceCard'

// Type & Service Imports
import type { PaymentRecordType } from '@/types/apps/paymentTypes'
import paymentService from '@/services/paymentService'

const InvoiceList = () => {
  const [payments, setPayments] = useState<PaymentRecordType[]>([])
  const [loading, setLoading] = useState(true)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [selectedClassId, setSelectedClassId] = useState('')

  const loadPayments = useCallback(async () => {
    setLoading(true)

    try {
      const res = await paymentService.getPayments({
        pageSize: 1000,
        paymentDateFrom: dateFrom || undefined,
        paymentDateTo: dateTo || undefined
      })

      const nextPayments = (res.data || []).sort(
        (a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
      )

      setPayments(nextPayments)
    } finally {
      setLoading(false)
    }
  }, [dateFrom, dateTo])

  useEffect(() => {
    loadPayments()
  }, [loadPayments])

  const summary = useMemo(() => {
    const totalRevenue = payments.reduce((sum, item) => sum + Number(item.amount || 0), 0)

    const totalTuition = payments
      .filter(item => item.type === 0)
      .reduce((sum, item) => sum + Number(item.amount || 0), 0)

    const totalExamFees = payments
      .filter(item => item.type === 1)
      .reduce((sum, item) => sum + Number(item.amount || 0), 0)

    return {
      paymentCount: payments.length,
      totalRevenue,
      totalTuition,
      totalExamFees
    }
  }, [payments])

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <InvoiceCard loading={loading} summary={summary} dateFrom={dateFrom} dateTo={dateTo} />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <InvoiceListTable
          payments={payments}
          loading={loading}
          dateFrom={dateFrom}
          dateTo={dateTo}
          onDateFromChange={setDateFrom}
          onDateToChange={setDateTo}
          selectedClassId={selectedClassId}
          onClassIdChange={setSelectedClassId}
          classOptions={[]}
          isAdmin
        />
      </Grid>
    </Grid>
  )
}

export default InvoiceList
