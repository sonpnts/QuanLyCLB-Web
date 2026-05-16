'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { useSearchParams } from 'next/navigation'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Divider from '@mui/material/Divider'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import type { Theme } from '@mui/material/styles'

import paymentService from '@/services/paymentService'
import type { PaymentRecordType } from '@/types/apps/paymentTypes'

import InvoiceCard from '@/views/apps/invoice/list/InvoiceCard'
import InvoiceListTable from '@/views/apps/invoice/list/InvoiceListTable'

import PaymentListTable from './PaymentListTable'

type TabKey = 'overview' | 'receipts' | 'payments'

const PaymentInvoiceMerged = () => {
  const searchParams = useSearchParams()
  const initialTab = (searchParams.get('tab') as TabKey | null) || 'overview'

  const isBelowSm = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'), { noSsr: true })

  const [tab, setTab] = useState<TabKey>(['overview', 'receipts', 'payments'].includes(initialTab) ? initialTab : 'overview')

  // Shared data for "overview" + "receipts"
  const [payments, setPayments] = useState<PaymentRecordType[]>([])
  const [loading, setLoading] = useState(true)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // For "Tạo phiếu thu" quick action
  const [createSignal, setCreateSignal] = useState(0)

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
    const totalTuition = payments.filter(item => item.type === 0).reduce((sum, item) => sum + Number(item.amount || 0), 0)
    const totalExamFees = payments.filter(item => item.type === 1).reduce((sum, item) => sum + Number(item.amount || 0), 0)

    return { paymentCount: payments.length, totalRevenue, totalTuition, totalExamFees }
  }, [payments])

  return (
    <Box className='flex flex-col gap-4'>
      <Box className='flex items-center justify-between gap-3 flex-wrap'>
        <Box>
          <Typography variant='h5'>Doanh số, biên lai và giao dịch</Typography>

        </Box>

        <Button
          variant='contained'
          onClick={() => {
            setTab('payments')
            setCreateSignal(v => v + 1)
          }}
        >
          Tạo phiếu thu tổng hợp
        </Button>
      </Box>

      <Card>
        <CardContent sx={{ pb: 0 }}>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            variant={isBelowSm ? 'scrollable' : 'standard'}
            scrollButtons={isBelowSm ? 'auto' : false}
            sx={{ minHeight: 42 }}
          >
            <Tab value='overview' label='Tổng quan' icon={<i className='ri-bar-chart-2-line' />} iconPosition='start' />
            <Tab value='receipts' label='Biên lai' icon={<i className='ri-file-list-3-line' />} iconPosition='start' />
            <Tab
              value='payments'
              label='Giao dịch'
              icon={<i className='ri-exchange-dollar-line' />}
              iconPosition='start'
            />
          </Tabs>
        </CardContent>

        <Divider />

        <CardContent>
          {tab === 'overview' && (
            <Box className='flex flex-col gap-4'>
              <InvoiceCard loading={loading} summary={summary} dateFrom={dateFrom} dateTo={dateTo} />

              <Card variant='outlined'>
                <CardContent className='flex flex-col gap-3'>
                  <Typography variant='subtitle1'>Nhanh</Typography>
                  <Box className='flex gap-2 flex-wrap'>
                    <Button
                      variant='outlined'
                      onClick={() => {
                        setTab('receipts')
                      }}
                      startIcon={<i className='ri-eye-line' />}
                    >
                      Xem biên lai
                    </Button>
                    <Button
                      variant='outlined'
                      onClick={() => {
                        setTab('payments')
                      }}
                      startIcon={<i className='ri-search-line' />}
                    >
                      Tra cứu giao dịch
                    </Button>
                  </Box>

                </CardContent>
              </Card>
            </Box>
          )}

          {tab === 'receipts' && (
            <Box className='flex flex-col gap-4'>
              <InvoiceCard loading={loading} summary={summary} dateFrom={dateFrom} dateTo={dateTo} />
              <InvoiceListTable
                payments={payments}
                loading={loading}
                dateFrom={dateFrom}
                dateTo={dateTo}
                onDateFromChange={setDateFrom}
                onDateToChange={setDateTo}
              />
            </Box>
          )}

          {tab === 'payments' && <PaymentListTable createSignal={createSignal} />}
        </CardContent>
      </Card>
    </Box>
  )
}

export default PaymentInvoiceMerged

