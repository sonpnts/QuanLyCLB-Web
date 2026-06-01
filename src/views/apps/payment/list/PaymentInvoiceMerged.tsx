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
import classService from '@/services/classService'
import paymentService from '@/services/paymentService'
import studentAttendanceService from '@/services/studentAttendanceService'
import type { PaymentRecordType } from '@/types/apps/paymentTypes'
import { hasPermission } from '@/utils/permissionUtils'
import { hasAdminRole } from '@/utils/roleUtils'

import InvoiceCard from '@/views/apps/invoice/list/InvoiceCard'
import InvoiceListTable from '@/views/apps/invoice/list/InvoiceListTable'

type PaymentClassOption = {
  id: string
  name: string
}

const PaymentInvoiceMerged = () => {
  const router = useRouter()
  const { auth } = useAuth()

  const [payments, setPayments] = useState<PaymentRecordType[]>([])
  const [loading, setLoading] = useState(true)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [selectedClassId, setSelectedClassId] = useState('')
  const [classOptions, setClassOptions] = useState<PaymentClassOption[]>([])

  const isAdmin = useMemo(
    () => hasPermission(auth?.permissions, 'Payment.Collect.ManageAll') || hasAdminRole(auth?.roles),
    [auth?.permissions, auth?.roles]
  )

  useEffect(() => {
    const loadClassOptions = async () => {
      if (isAdmin) {
        const result = await classService.getClassLookup({ isActive: true, pageSize: 1000 })

        if (!result.success || !result.data) {
          setClassOptions([])

          return
        }

        setClassOptions(
          result.data
            .map(item => ({
              id: item.id,
              name: item.code ? `${item.name} (${item.code})` : item.name
            }))
            .sort((left, right) => left.name.localeCompare(right.name, 'vi'))
        )

        return
      }

      const result = await studentAttendanceService.getCoachClasses()

      if (!result.success || !result.data) {
        setClassOptions([])

        return
      }

      setClassOptions(
        result.data
          .map(item => ({
            id: item.classId,
            name: item.classCode ? `${item.className} (${item.classCode})` : item.className
          }))
          .sort((left, right) => left.name.localeCompare(right.name, 'vi'))
      )
    }

    loadClassOptions()
  }, [isAdmin])

  const loadPayments = useCallback(async () => {
    setLoading(true)

    try {
      const response = await paymentService.getPayments({
        pageSize: 1000,
        classId: selectedClassId || undefined,
        collectedByUserId: isAdmin ? undefined : auth?.user?.id || undefined,
        paymentDateFrom: dateFrom || undefined,
        paymentDateTo: dateTo || undefined
      })

      const nextPayments = (response.data || []).sort(
        (left, right) => new Date(right.paymentDate).getTime() - new Date(left.paymentDate).getTime()
      )

      setPayments(nextPayments)
    } finally {
      setLoading(false)
    }
  }, [auth?.user?.id, dateFrom, dateTo, isAdmin, selectedClassId])

  useEffect(() => {
    loadPayments()
  }, [loadPayments])

  const summary = useMemo(() => {
    const totalRevenue = payments.reduce((sum, item) => sum + Number(item.amount || 0), 0)
    const totalTuition = payments.filter(item => item.type === 0).reduce((sum, item) => sum + Number(item.amount || 0), 0)
    const totalExamFees = payments.filter(item => item.type === 1).reduce((sum, item) => sum + Number(item.amount || 0), 0)

    return {
      paymentCount: payments.length,
      totalRevenue,
      totalTuition,
      totalExamFees
    }
  }, [payments])

  return (
    <Box className='flex flex-col gap-4'>
      <Box className='flex items-center justify-between gap-3 flex-wrap'>
        <Box>
          <Typography variant='h5'>Lịch sử thanh toán theo biên lai</Typography>
          <Typography variant='body2' color='text.secondary'>
            Danh sách này gộp các khoản thu theo từng biên lai để dễ xem lịch sử, người thu và minh chứng chuyển khoản.
          </Typography>
        </Box>

        <Box className='flex gap-2 flex-wrap'>
          {isAdmin && (
            <Button variant='outlined' color='warning' onClick={() => router.push('/apps/invoice/add?mode=replacement')}>
              Tạo hóa đơn thay
            </Button>
          )}
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
              selectedClassId={selectedClassId}
              onClassIdChange={setSelectedClassId}
              classOptions={classOptions}
              isAdmin={isAdmin}
            />
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}

export default PaymentInvoiceMerged
