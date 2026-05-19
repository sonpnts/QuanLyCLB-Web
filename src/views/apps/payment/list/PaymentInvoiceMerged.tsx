'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { useRouter } from 'next/navigation'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'

import { useAuth } from '@/contexts/authContext'
import paymentService from '@/services/paymentService'
import type { PaymentRecordType } from '@/types/apps/paymentTypes'
import { hasPermission } from '@/utils/permissionUtils'
import { hasAdminRole } from '@/utils/roleUtils'

import InvoiceCard from '@/views/apps/invoice/list/InvoiceCard'
import InvoiceListTable from '@/views/apps/invoice/list/InvoiceListTable'

const PaymentInvoiceMerged = () => {
  const router = useRouter()
  const { auth } = useAuth()

  const [payments, setPayments] = useState<PaymentRecordType[]>([])
  const [loading, setLoading] = useState(true)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const isAdmin = useMemo(
    () => hasPermission(auth?.permissions, 'Payment.Collect.ManageAll') || hasAdminRole(auth?.roles),
    [auth?.permissions, auth?.roles]
  )

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
          <Typography variant='h5'>Lịch sử biên lai</Typography>
          <Typography variant='body2' color='text.secondary'>
            Tổng quan doanh số và danh sách biên lai được hiển thị chung trên một màn hình.
          </Typography>
        </Box>

        <Box className='flex gap-2 flex-wrap'>
          {isAdmin ? (
            <Button variant='outlined' color='warning' onClick={() => router.push('/apps/invoice/add?mode=replacement')}>
              Tạo hóa đơn thay
            </Button>
          ) : null}
          <Button variant='contained' onClick={() => router.push('/apps/invoice/add')}>
            Thêm thanh toán
          </Button>
        </Box>
      </Box>

      <Card>
        <CardContent>
          <Box className='flex flex-col gap-4'>
            <InvoiceCard loading={loading} summary={summary} dateFrom={dateFrom} dateTo={dateTo} />
            <Divider />
            <InvoiceListTable
              payments={payments}
              loading={loading}
              dateFrom={dateFrom}
              dateTo={dateTo}
              onDateFromChange={setDateFrom}
              onDateToChange={setDateTo}
            />
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}

export default PaymentInvoiceMerged
