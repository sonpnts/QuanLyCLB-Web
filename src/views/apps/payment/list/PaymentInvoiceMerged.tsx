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
import type { CollectedPaymentSummaryType, ReceiptListItemType } from '@/types/apps/paymentTypes'
import { hasPermission } from '@/utils/permissionUtils'
import { hasAdminRole } from '@/utils/roleUtils'

import InvoiceCard from '@/views/apps/invoice/list/InvoiceCard'
import InvoiceListTable from '@/views/apps/invoice/list/InvoiceListTable'

type PaymentClassOption = {
  id: string
  name: string
}

const emptySummary: CollectedPaymentSummaryType = {
  receiptCount: 0,
  totalTuition: 0,
  totalExamFees: 0,
  totalOtherFees: 0,
  grandTotal: 0
}

const toInputDate = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

const getDefaultDateRange = () => {
  const today = new Date()
  const from = new Date(today)

  from.setDate(today.getDate() - 29)

  return {
    dateFrom: toInputDate(from),
    dateTo: toInputDate(today)
  }
}

const PaymentInvoiceMerged = () => {
  const router = useRouter()
  const { auth } = useAuth()
  const defaultRange = useMemo(() => getDefaultDateRange(), [])

  const [receipts, setReceipts] = useState<ReceiptListItemType[]>([])
  const [summary, setSummary] = useState<CollectedPaymentSummaryType>(emptySummary)
  const [loading, setLoading] = useState(true)
  const [summaryLoading, setSummaryLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [search, setSearch] = useState('')
  const [methodFilter, setMethodFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [dateFrom, setDateFrom] = useState(defaultRange.dateFrom)
  const [dateTo, setDateTo] = useState(defaultRange.dateTo)
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

  const buildSharedFilters = useCallback(
    () => ({
      classId: selectedClassId || undefined,
      collectedByUserId: isAdmin ? undefined : auth?.user?.id || undefined,
      paymentDateFrom: dateFrom || undefined,
      paymentDateTo: dateTo || undefined
    }),
    [auth?.user?.id, dateFrom, dateTo, isAdmin, selectedClassId]
  )

  const loadReceipts = useCallback(async () => {
    setLoading(true)

    try {
      const response = await paymentService.getReceiptList({
        ...buildSharedFilters(),
        pageNumber: page + 1,
        pageSize: rowsPerPage,
        keyword: search.trim() || undefined,
        method: methodFilter !== '' ? Number(methodFilter) : undefined,
        type: typeFilter !== '' ? Number(typeFilter) : undefined
      })

      setReceipts(response.data?.records || [])
      setTotalCount(Number(response.data?.totalRecords || 0))
    } finally {
      setLoading(false)
    }
  }, [buildSharedFilters, methodFilter, page, rowsPerPage, search, typeFilter])

  const loadSummary = useCallback(async () => {
    setSummaryLoading(true)

    try {
      const response = await paymentService.getReceiptSummary(buildSharedFilters())

      setSummary(response.data || emptySummary)
    } finally {
      setSummaryLoading(false)
    }
  }, [buildSharedFilters])

  useEffect(() => {
    loadReceipts()
  }, [loadReceipts])

  useEffect(() => {
    loadSummary()
  }, [loadSummary])

  return (
    <Box className='flex flex-col gap-4'>
      <Box className='flex items-center justify-between gap-3 flex-wrap'>
        <Box>
          <Typography variant='h5'>Lịch sử thanh toán theo biên lai</Typography>
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
            <InvoiceCard loading={summaryLoading} summary={summary} dateFrom={dateFrom} dateTo={dateTo} />
            <Divider />
            <InvoiceListTable
              receipts={receipts}
              loading={loading}
              totalCount={totalCount}
              page={page}
              rowsPerPage={rowsPerPage}
              search={search}
              methodFilter={methodFilter}
              typeFilter={typeFilter}
              dateFrom={dateFrom}
              dateTo={dateTo}
              onSearchChange={setSearch}
              onMethodFilterChange={setMethodFilter}
              onTypeFilterChange={setTypeFilter}
              onPageChange={setPage}
              onRowsPerPageChange={setRowsPerPage}
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
