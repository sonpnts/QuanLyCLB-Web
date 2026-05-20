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
import financeService from '@/services/financeService'
import paymentService from '@/services/paymentService'
import type { InstructorClassCollectionType } from '@/types/apps/financeTypes'
import type { PaymentRecordType } from '@/types/apps/paymentTypes'
import { hasPermission } from '@/utils/permissionUtils'
import { hasAdminRole } from '@/utils/roleUtils'

import InvoiceCard from '@/views/apps/invoice/list/InvoiceCard'
import InvoiceListTable from '@/views/apps/invoice/list/InvoiceListTable'

const getBreakdownAmount = (collections: InstructorClassCollectionType[], key: string) =>
  collections.reduce(
    (sum, item) => sum + Number(item.breakdown.find(detail => detail.key === key)?.amount || 0),
    0
  )

const PaymentInvoiceMerged = () => {
  const router = useRouter()
  const { auth } = useAuth()

  const [payments, setPayments] = useState<PaymentRecordType[]>([])
  const [pendingCollections, setPendingCollections] = useState<InstructorClassCollectionType[]>([])
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
      const [paymentRes, collectionRes] = await Promise.all([
        paymentService.getPayments({
          pageSize: 1000,
          paymentDateFrom: dateFrom || undefined,
          paymentDateTo: dateTo || undefined
        }),
        isAdmin ? Promise.resolve({ success: true, data: [] as InstructorClassCollectionType[] }) : financeService.getMyClassCollections()
      ])

      const nextPayments = (paymentRes.data || []).sort(
        (a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
      )

      setPayments(nextPayments)
      setPendingCollections((collectionRes.data || []).filter(item => item.availableToHandover > 0))
    } finally {
      setLoading(false)
    }
  }, [dateFrom, dateTo, isAdmin])

  useEffect(() => {
    loadPayments()
  }, [loadPayments])

  const paymentSummary = useMemo(() => {
    const totalRevenue = payments.reduce((sum, item) => sum + Number(item.amount || 0), 0)
    const totalTuition = payments.filter(item => item.type === 0).reduce((sum, item) => sum + Number(item.amount || 0), 0)
    const totalExamFees = payments.filter(item => item.type === 1).reduce((sum, item) => sum + Number(item.amount || 0), 0)

    return { paymentCount: payments.length, totalRevenue, totalTuition, totalExamFees }
  }, [payments])

  const pendingSummary = useMemo(() => {
    const totalRevenue = pendingCollections.reduce((sum, item) => sum + Number(item.availableToHandover || 0), 0)
    const totalTuition = getBreakdownAmount(pendingCollections, 'tuition')
    const totalExamFees = getBreakdownAmount(pendingCollections, 'exam-fee')

    return {
      paymentCount: pendingCollections.length,
      totalRevenue,
      totalTuition,
      totalExamFees
    }
  }, [pendingCollections])

  const summary = isAdmin ? paymentSummary : pendingSummary

  const summaryStats = useMemo(() => {
    if (isAdmin) return undefined

    return [
      {
        title: loading ? '...' : String(pendingSummary.paymentCount),
        subtitle: 'Lớp chưa bàn giao',
        icon: 'ri-file-list-3-line'
      },
      {
        title: loading
          ? '...'
          : new Intl.NumberFormat('vi-VN', {
              style: 'currency',
              currency: 'VND',
              maximumFractionDigits: 0
            }).format(pendingSummary.totalRevenue),
        subtitle: 'Tổng chưa bàn giao',
        icon: 'ri-wallet-line'
      },
      {
        title: loading
          ? '...'
          : new Intl.NumberFormat('vi-VN', {
              style: 'currency',
              currency: 'VND',
              maximumFractionDigits: 0
            }).format(pendingSummary.totalTuition),
        subtitle: 'Học phí chưa bàn giao',
        icon: 'ri-money-dollar-circle-line'
      },
      {
        title: loading
          ? '...'
          : new Intl.NumberFormat('vi-VN', {
              style: 'currency',
              currency: 'VND',
              maximumFractionDigits: 0
            }).format(pendingSummary.totalExamFees),
        subtitle: 'Lệ phí thi chưa bàn giao',
        icon: 'ri-shield-star-line'
      }
    ]
  }, [isAdmin, loading, pendingSummary])

  return (
    <Box className='flex flex-col gap-4'>
      <Box className='flex items-center justify-between gap-3 flex-wrap'>
        <Box>
          <Typography variant='h5'>Lịch sử biên lai</Typography>
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
            <InvoiceCard
              loading={loading}
              summary={summary}
              dateFrom={dateFrom}
              dateTo={dateTo}
              rangeLabel={isAdmin ? undefined : 'Chưa bàn giao tới hiện tại'}
              stats={summaryStats}
            />
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
