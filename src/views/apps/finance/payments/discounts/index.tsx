'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { useRouter } from 'next/navigation'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
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


import { useNotification } from '@/contexts/notificationContext'
import classService from '@/services/classService'
import paymentService from '@/services/paymentService'
import type { ClassType } from '@/types/apps/classTypes'
import type { PaymentRecordType } from '@/types/apps/paymentTypes'
import { formatDateTimeVN } from '@/utils/dateTime'

type DiscountScope = 'manual' | 'approved' | 'combo' | 'mixed' | 'all'

const discountScopeOptions: Array<{ value: DiscountScope; label: string }> = [
  { value: 'manual', label: 'Giảm trừ thủ công' },
  { value: 'approved', label: 'Miễn/giảm đã duyệt' },
  { value: 'combo', label: 'Combo' },
  { value: 'mixed', label: 'Kết hợp cả hai' },
  { value: 'all', label: 'Tất cả' }
]

const formatCurrency = (amount?: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Number(amount || 0))

const formatDateTime = (value?: string) => formatDateTimeVN(value)

const getDiscountScopeLabel = (row: PaymentRecordType) => {
  const sourceCount = [row.hasManualDiscount, row.hasApprovedDiscount, row.hasComboDiscount].filter(Boolean).length

  if (sourceCount > 1) return 'Kết hợp'
  if (row.hasManualDiscount) return 'Thủ công'
  if (row.hasApprovedDiscount) return 'Đã duyệt'
  if (row.hasComboDiscount) return 'Combo'

  return 'Khác'
}

const getDiscountScopeColor = (row: PaymentRecordType): 'warning' | 'info' | 'secondary' | 'success' | 'default' => {
  const sourceCount = [row.hasManualDiscount, row.hasApprovedDiscount, row.hasComboDiscount].filter(Boolean).length

  if (sourceCount > 1) return 'secondary'
  if (row.hasManualDiscount) return 'warning'
  if (row.hasApprovedDiscount) return 'info'
  if (row.hasComboDiscount) return 'success'

  return 'default'
}

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
  const [discountScope, setDiscountScope] = useState<DiscountScope>('all')
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
      showNotification('Không thể tải danh sách lớp.', 'error')
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
        discountScope,
        keyword: keyword.trim() || undefined,
        paymentDateFrom: paymentDateFrom || undefined,
        paymentDateTo: paymentDateTo || undefined,
        isActive: true
      })

      if (!response.success || !response.data) {
        setRecords([])
        setTotalRecords(0)
        showNotification(response.message || 'Không thể tải danh sách biên lai có giảm trừ.', 'error')

        return
      }

      setRecords(response.data.records || [])
      setTotalRecords(response.data.totalRecords || 0)
    } catch {
      setRecords([])
      setTotalRecords(0)
      showNotification('Đã có lỗi khi tải danh sách biên lai có giảm trừ.', 'error')
    } finally {
      setLoadingTable(false)
    }
  }, [classId, discountScope, keyword, page, paymentDateFrom, paymentDateTo, rowsPerPage, showNotification])

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
        // subheader='Mặc định hiển thị tất cả các loại giảm trừ. Bạn có thể đổi bộ lọc để xem giảm trừ thủ công, giảm trừ đã duyệt, giá combo hoặc biên lai kết hợp.'
      />
      <CardContent>
        <Stack spacing={3}>
          <Alert severity='info'>
            Mặc định hiển thị tất cả các loại giảm trừ. Bạn có thể lọc riêng theo loại giảm trừ thủ công, miễn/giảm học phí đã duyệt, hoặc giá combo ở bộ lọc phía dưới.
          </Alert>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              select
              fullWidth
              label='Loại giảm trừ'
              value={discountScope}
              onChange={event => {
                setDiscountScope(event.target.value as DiscountScope)
                setPage(0)
              }}
            >
              {discountScopeOptions.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>

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
              <MenuItem value=''>Tất cả lớp</MenuItem>
              {sortedClasses.map(item => (
                <MenuItem key={item.id} value={item.id}>
                  {item.code }
                </MenuItem>
              ))}
            </TextField>

            <TextField
              fullWidth
              label='Từ ngày'
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
              label='Đến ngày'
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
              label='Tìm kiếm'
              placeholder='Số biên lai, học viên, người thu, lý do'
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
                    <TableCell>Loại giảm trừ</TableCell>
                    <TableCell>Người thu</TableCell>
                    <TableCell>Lớp</TableCell>
                    <TableCell>Ngày thu</TableCell>
                    <TableCell>Học viên</TableCell>
                    <TableCell align='right'>Giảm thủ công</TableCell>
                    <TableCell align='right'>Tổng giảm</TableCell>
                    <TableCell>Lý do giảm trừ</TableCell>
                    <TableCell align='right'>Preview</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loadingTable ? (
                    <TableRow>
                      <TableCell colSpan={10} align='center'>
                        <Box className='flex justify-center py-6'>
                          <CircularProgress size={24} />
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : records.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} align='center'>
                        Không có biên lai giảm trừ phù hợp.
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
                        <TableCell>
                          <Chip size='small' variant='tonal' color={getDiscountScopeColor(row)} label={getDiscountScopeLabel(row)} />
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
                            {formatCurrency(row.invoiceManualDiscountAmount)}
                          </Typography>
                        </TableCell>
                        <TableCell align='right'>
                          <Typography variant='body2' color='error.main' sx={{ fontWeight: 700 }}>
                            {formatCurrency(row.invoiceDiscountAmount)}
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
