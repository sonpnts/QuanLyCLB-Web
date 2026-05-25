'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import CircularProgress from '@mui/material/CircularProgress'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TablePagination from '@mui/material/TablePagination'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import { useRouter } from 'next/navigation'

import classService from '@/services/classService'
import paymentService from '@/services/paymentService'
import { useNotification } from '@/contexts/notificationContext'
import type { ClassType } from '@/types/apps/classTypes'
import type { PaymentRecordType } from '@/types/apps/paymentTypes'

const formatCurrency = (amount?: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Number(amount || 0))

const formatDateTime = (value?: string) => (value ? new Date(value).toLocaleString('vi-VN') : '-')

const DiscountedReceiptsView = () => {
  const router = useRouter()
  const { showNotification } = useNotification()

  const [loadingFilters, setLoadingFilters] = useState(true)
  const [loadingTable, setLoadingTable] = useState(false)
  const [classes, setClasses] = useState<ClassType[]>([])
  const [records, setRecords] = useState<PaymentRecordType[]>([])
  const [totalRecords, setTotalRecords] = useState(0)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [classId, setClassId] = useState('')
  const [keyword, setKeyword] = useState('')
  const [paymentDateFrom, setPaymentDateFrom] = useState('')
  const [paymentDateTo, setPaymentDateTo] = useState('')

  const sortedClasses = useMemo(
    () => [...classes].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'vi')),
    [classes]
  )

  const loadFilters = useCallback(async () => {
    try {
      setLoadingFilters(true)
      const response = await classService.getClasses({ isActive: true, pageSize: 1000 })
      setClasses(response.success && response.data ? response.data : [])
    } catch {
      showNotification('Khong the tai danh sach lop.', 'error')
    } finally {
      setLoadingFilters(false)
    }
  }, [showNotification])

  const loadRecords = useCallback(async () => {
    try {
      setLoadingTable(true)
      const response = await paymentService.getDiscountedReceipts({
        pageNumber: page + 1,
        pageSize: rowsPerPage,
        classId: classId || undefined,
        keyword: keyword.trim() || undefined,
        paymentDateFrom: paymentDateFrom || undefined,
        paymentDateTo: paymentDateTo || undefined,
        isActive: true
      })

      if (!response.success || !response.data) {
        setRecords([])
        setTotalRecords(0)
        showNotification(response.message || 'Khong the tai danh sach bien lai co giam tru.', 'error')
        return
      }

      setRecords(response.data.records || [])
      setTotalRecords(response.data.totalRecords || 0)
    } catch {
      setRecords([])
      setTotalRecords(0)
      showNotification('Da co loi khi tai danh sach bien lai co giam tru.', 'error')
    } finally {
      setLoadingTable(false)
    }
  }, [classId, keyword, page, paymentDateFrom, paymentDateTo, rowsPerPage, showNotification])

  useEffect(() => {
    loadFilters()
  }, [loadFilters])

  useEffect(() => {
    loadRecords()
  }, [loadRecords])

  const openPreview = (receiptNumber?: string) => {
    if (!receiptNumber) return
    router.push(`/apps/invoice/preview/${encodeURIComponent(receiptNumber)}`)
  }

  return (
    <Card>
      <CardHeader
        title='Biên lai có giảm trừ'
        subheader='Tổng hợp các biên lai đã áp dụng giảm trừ. Bấm vào dòng hoặc nút xem để mở preview biên lai.'
      />
      <CardContent>
        <Stack spacing={3}>
          <Alert severity='info'>
            Trang này chỉ hiển thị các biên lai có giảm trừ lớn hơn 0, giúp admin rà soát nhanh số tiền và lý do giảm.
          </Alert>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              select
              fullWidth
              label='Lớp'
              value={classId}
              onChange={event => {
                setClassId(event.target.value)
                setPage(0)
              }}
              disabled={loadingFilters}
            >
              <MenuItem value=''>Tat ca lop</MenuItem>
              {sortedClasses.map(item => (
                <MenuItem key={item.id} value={item.id}>
                  {item.code ? `${item.code} - ${item.name}` : item.name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              fullWidth
              label='Tu ngay'
              type='date'
              slotProps={{ inputLabel: { shrink: true } }}
              value={paymentDateFrom}
              onChange={event => {
                setPaymentDateFrom(event.target.value)
                setPage(0)
              }}
            />

            <TextField
              fullWidth
              label='Den ngay'
              type='date'
              slotProps={{ inputLabel: { shrink: true } }}
              value={paymentDateTo}
              onChange={event => {
                setPaymentDateTo(event.target.value)
                setPage(0)
              }}
            />

            <TextField
              fullWidth
              label='Tim kiem'
              placeholder='So bien lai, hoc vien, nguoi thu, ly do'
              value={keyword}
              onChange={event => {
                setKeyword(event.target.value)
                setPage(0)
              }}
            />
          </Stack>

          {loadingFilters ? (
            <Box className='flex justify-center py-8'>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table size='small'>
                <TableHead>
                  <TableRow>
                    <TableCell>Số biên lai</TableCell>
                    <TableCell>Người thu</TableCell>
                    <TableCell>Lớp</TableCell>
                    <TableCell>Ngày thu</TableCell>
                    <TableCell>Học viên</TableCell>
                    <TableCell align='right'>Số tiền giảm trừ</TableCell>
                    <TableCell>Lý do giảm trừ</TableCell>
                    <TableCell align='right'>Preview</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loadingTable ? (
                    <TableRow>
                      <TableCell colSpan={8} align='center'>
                        <Box className='flex justify-center py-6'>
                          <CircularProgress size={24} />
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : records.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align='center'>
                        Khong co bien lai giam tru phu hop.
                      </TableCell>
                    </TableRow>
                  ) : (
                    records.map(row => (
                      <TableRow
                        hover
                        key={row.id}
                        onClick={() => openPreview(row.receiptNumber)}
                        sx={{ cursor: row.receiptNumber ? 'pointer' : 'default' }}
                      >
                        <TableCell>
                          <Typography variant='body2' sx={{ fontWeight: 700, color: 'primary.main' }}>
                            {row.receiptNumber || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>{row.collectedByUserName || '-'}</TableCell>
                        <TableCell>{row.className || '-'}</TableCell>
                        <TableCell>{formatDateTime(row.paymentDate)}</TableCell>
                        <TableCell>
                          <Typography variant='body2' sx={{ fontWeight: 600 }}>
                            {row.studentName || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell align='right'>
                          <Typography variant='body2' color='warning.main' sx={{ fontWeight: 700 }}>
                            {formatCurrency(row.discountAmount)}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ maxWidth: 360 }}>
                          <Typography variant='body2'>{row.discountReason || '-'}</Typography>
                        </TableCell>
                        <TableCell align='right' onClick={event => event.stopPropagation()}>
                          <Button
                            size='small'
                            variant='outlined'
                            disabled={!row.receiptNumber}
                            onClick={() => openPreview(row.receiptNumber)}
                          >
                            Xem biên lai
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          <TablePagination
            component='div'
            count={totalRecords}
            page={page}
            onPageChange={(_, nextPage) => setPage(nextPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={event => {
              setRowsPerPage(Number(event.target.value))
              setPage(0)
            }}
            rowsPerPageOptions={[10, 25, 50]}
            labelRowsPerPage='Số dòng mỗi trang:'
          />
        </Stack>
      </CardContent>
    </Card>
  )
}

export default DiscountedReceiptsView
