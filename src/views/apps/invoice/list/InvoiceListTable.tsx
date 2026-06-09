'use client'

import { useMemo, useState } from 'react'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControl from '@mui/material/FormControl'
import InputAdornment from '@mui/material/InputAdornment'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import TablePagination from '@mui/material/TablePagination'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'

import type { PaymentRecordType } from '@/types/apps/paymentTypes'
import { paymentMethodLabels, paymentTypeLabels } from '@/types/apps/paymentTypes'
import { formatDateTimeVN } from '@/utils/dateTime'
import { exportToExcel, formatVnCurrency, formatVnDate } from '@/utils/exportToExcel'
import ReceiptPreviewDialog from '@/views/apps/invoice/preview/ReceiptPreviewDialog'

import tableStyles from '@core/styles/table.module.css'

const toInputDate = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

const buildRange = (days: number) => {
  const today = new Date()
  const from = new Date(today)

  from.setDate(today.getDate() - (days - 1))

  return {
    from: toInputDate(from),
    to: toInputDate(today)
  }
}

type ReceiptRow = {
  receiptNumber: string
  studentName: string
  paymentDate: string
  method: number
  types: number[]
  periods: string[]
  totalAmount: number
  collectedByUserName: string
  classNames: string[]
  classLabel: string
  transferProofImageUrl?: string
  items: PaymentRecordType[]
}

type ClassOption = {
  id: string
  name: string
}

type Props = {
  payments: PaymentRecordType[]
  loading: boolean
  dateFrom: string
  dateTo: string
  onDateFromChange: (value: string) => void
  onDateToChange: (value: string) => void
  selectedClassId: string
  onClassIdChange: (value: string) => void
  classOptions: ClassOption[]
  isAdmin: boolean
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amount)

const formatDate = (dateStr: string) => formatDateTimeVN(dateStr)

const typeColorMap: Record<number, 'primary' | 'info' | 'success' | 'secondary' | 'warning'> = {
  0: 'primary',
  1: 'info',
  2: 'success',
  3: 'secondary',
  4: 'warning',
  5: 'info'
}

const InvoiceListTable = ({
  payments,
  loading,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  selectedClassId,
  onClassIdChange,
  classOptions,
  isAdmin
}: Props) => {
  const [search, setSearch] = useState('')
  const [methodFilter, setMethodFilter] = useState<string>('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [proofImageUrl, setProofImageUrl] = useState<string | null>(null)
  const [proofImageOpen, setProofImageOpen] = useState(false)
  const [receiptPreviewOpen, setReceiptPreviewOpen] = useState(false)
  const [selectedReceiptNumber, setSelectedReceiptNumber] = useState<string | null>(null)
  const preset30 = useMemo(() => buildRange(30), [])
  const preset60 = useMemo(() => buildRange(60), [])
  const isPreset30 = dateFrom === preset30.from && dateTo === preset30.to
  const isPreset60 = dateFrom === preset60.from && dateTo === preset60.to
  const isCustomRange = !isPreset30 && !isPreset60

  const receipts = useMemo(() => {
    const grouped = new Map<string, PaymentRecordType[]>()

    payments.forEach(payment => {
      const key = payment.receiptNumber || payment.id

      if (!grouped.has(key)) grouped.set(key, [])
      grouped.get(key)!.push(payment)
    })

    const rows: ReceiptRow[] = Array.from(grouped.entries()).map(([receiptNumber, items]) => {
      const first = items[0]
      const classNames = [...new Set(items.map(item => item.className).filter(Boolean) as string[])]

      const periods = [
        ...new Set(
          items
            .filter(item => item.forMonth && item.forYear)
            .map(item => `${String(item.forMonth).padStart(2, '0')}/${item.forYear}`)
        )
      ]

      return {
        receiptNumber,
        studentName: first.studentName || '-',
        paymentDate: first.paymentDate,
        method: first.method,
        collectedByUserName: first.collectedByUserName || '-',
        types: [...new Set(items.map(item => item.type))],
        periods,
        classNames,
        classLabel: classNames.length > 0 ? classNames.join(', ') : '-',
        totalAmount: items.reduce((sum, item) => sum + Number(item.amount || 0), 0),
        transferProofImageUrl: items.find(item => item.transferProofImageUrl)?.transferProofImageUrl,
        items
      }
    })

    return rows.sort((left, right) => new Date(right.paymentDate).getTime() - new Date(left.paymentDate).getTime())
  }, [payments])

  const filtered = useMemo(() => {
    const keyword = search.toLowerCase().trim()

    return receipts.filter(receipt => {
      const matchSearch =
        !keyword ||
        receipt.receiptNumber.toLowerCase().includes(keyword) ||
        receipt.studentName.toLowerCase().includes(keyword) ||
        receipt.classLabel.toLowerCase().includes(keyword) ||
        receipt.collectedByUserName.toLowerCase().includes(keyword)

      const matchMethod = methodFilter === '' || String(receipt.method) === methodFilter
      const matchType = typeFilter === '' || receipt.types.includes(Number(typeFilter))

      return matchSearch && matchMethod && matchType
    })
  }, [methodFilter, receipts, search, typeFilter])

  const paged = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

  const handleResetFilters = () => {
    onDateFromChange(preset30.from)
    onDateToChange(preset30.to)
    onClassIdChange('')
    setMethodFilter('')
    setTypeFilter('')
    setSearch('')
    setPage(0)
  }

  const applyQuickRange = (from: string, to: string) => {
    onDateFromChange(from)
    onDateToChange(to)
    setPage(0)
  }

  const openProofImage = (imageUrl?: string) => {
    if (!imageUrl) return

    setProofImageUrl(imageUrl)
    setProofImageOpen(true)
  }

  const openReceiptPreview = (receiptNumber: string) => {
    setSelectedReceiptNumber(receiptNumber)
    setReceiptPreviewOpen(true)
  }

  return (
    <>
      <Card>
        <CardContent className='flex justify-between gap-4 flex-wrap flex-col sm:flex-row items-start sm:items-center'>
          <Box>
            <Typography variant='h6'>Danh sách biên lai</Typography>
            <Typography variant='body2' color='text.secondary'>
              {isAdmin
                ? 'Xem lịch sử thu tiền toàn hệ thống theo từng biên lai gộp.'
                : 'Chỉ hiển thị các biên lai do bạn trực tiếp thu, có thể lọc tiếp theo lớp phụ trách.'}
            </Typography>
          </Box>
          <Button
            variant='outlined'
            color='success'
            startIcon={<i className='ri-file-excel-2-line' />}
            disabled={filtered.length === 0}
            onClick={() => {
              exportToExcel({
                filename: 'lich-su-bien-lai',
                rows: filtered,
                columns: [
                  { header: 'Số biên lai', accessor: 'receiptNumber' },
                  { header: 'Ngày thu', accessor: 'paymentDate', formatter: formatVnDate },
                  { header: 'Học viên', accessor: 'studentName' },
                  { header: 'Lớp', accessor: 'classLabel' },
                  { header: 'Người thu', accessor: 'collectedByUserName' },
                  {
                    header: 'Loại thu',
                    accessor: 'types',
                    formatter: value =>
                      Array.isArray(value)
                        ? value
                            .map((type: number) => paymentTypeLabels[type] || '')
                            .filter(Boolean)
                            .join(', ')
                        : ''
                  },
                  {
                    header: 'Phương thức',
                    accessor: 'method',
                    formatter: value => paymentMethodLabels[value as number] || ''
                  },
                  {
                    header: 'Kỳ',
                    accessor: 'periods',
                    formatter: value => (Array.isArray(value) && value.length > 0 ? value.join(', ') : '-')
                  },
                  { header: 'Tổng tiền (VND)', accessor: 'totalAmount', formatter: formatVnCurrency },
                  { header: 'Số khoản thu', accessor: row => (row as ReceiptRow).items.length }
                ]
              })
            }}
          >
            Xuất Excel
          </Button>
        </CardContent>

        <CardContent className='pt-0'>
          <div className='flex gap-3 flex-wrap items-center'>
            <Button size='small' variant={isPreset30 ? 'contained' : 'outlined'} onClick={() => applyQuickRange(preset30.from, preset30.to)}>
              1 tháng trước
            </Button>
            <Button size='small' variant={isPreset60 ? 'contained' : 'outlined'} onClick={() => applyQuickRange(preset60.from, preset60.to)}>
              2 tháng trước
            </Button>
            <Button
              size='small'
              variant={isCustomRange ? 'contained' : 'outlined'}
              onClick={() => {
                onDateFromChange('')
                onDateToChange('')
                setPage(0)
              }}
            >
              Tùy chỉnh
            </Button>
            <TextField
              size='small'
              label='Từ ngày'
              type='date'
              value={dateFrom}
              onChange={event => {
                onDateFromChange(event.target.value)
                setPage(0)
              }}
              slotProps={{ inputLabel: { shrink: true } }}
              className='min-is-[150px]'
            />
            <TextField
              size='small'
              label='Đến ngày'
              type='date'
              value={dateTo}
              onChange={event => {
                onDateToChange(event.target.value)
                setPage(0)
              }}
              slotProps={{ inputLabel: { shrink: true } }}
              className='min-is-[150px]'
            />
            <FormControl size='small' className='min-is-[220px]'>
              <InputLabel>Lớp học</InputLabel>
              <Select
                value={selectedClassId}
                label='Lớp học'
                onChange={event => {
                  onClassIdChange(event.target.value)
                  setPage(0)
                }}
              >
                <MenuItem value=''>Tất cả lớp</MenuItem>
                {classOptions.map(option => (
                  <MenuItem key={option.id} value={option.id}>
                    {option.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size='small' className='min-is-[170px]'>
              <InputLabel>Phương thức</InputLabel>
              <Select
                value={methodFilter}
                label='Phương thức'
                onChange={event => {
                  setMethodFilter(event.target.value)
                  setPage(0)
                }}
              >
                <MenuItem value=''>Tất cả</MenuItem>
                <MenuItem value='0'>Tiền mặt</MenuItem>
                <MenuItem value='1'>Chuyển khoản</MenuItem>
                <MenuItem value='2'>Khác</MenuItem>
              </Select>
            </FormControl>
            <FormControl size='small' className='min-is-[190px]'>
              <InputLabel>Loại thu</InputLabel>
              <Select
                value={typeFilter}
                label='Loại thu'
                onChange={event => {
                  setTypeFilter(event.target.value)
                  setPage(0)
                }}
              >
                <MenuItem value=''>Tất cả</MenuItem>
                {Object.entries(paymentTypeLabels)
                  .filter(([key]) => Number(key) <= 5)
                  .map(([key, label]) => (
                    <MenuItem key={key} value={key}>
                      {label}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
            <TextField
              size='small'
              placeholder='Tìm theo học viên, lớp, người thu, số biên lai...'
              value={search}
              onChange={event => {
                setSearch(event.target.value)
                setPage(0)
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position='start'>
                      <i className='ri-search-line text-textSecondary' />
                    </InputAdornment>
                  )
                }
              }}
              className='min-is-[280px]'
            />
            <Button variant='outlined' color='secondary' onClick={handleResetFilters}>
              Đặt lại bộ lọc
            </Button>
          </div>
        </CardContent>

        <div className='overflow-x-auto'>
          {loading ? (
            <Box display='flex' justifyContent='center' p={8}>
              <CircularProgress />
            </Box>
          ) : (
            <table className={tableStyles.table}>
              <thead>
                <tr>
                  <th>Số biên lai</th>
                  <th>Học viên</th>
                  <th>Lớp</th>
                  <th>Ngày thu</th>
                  <th>Người thu</th>
                  <th>Phương thức</th>
                  <th>Loại thu</th>
                  <th>Kỳ</th>
                  <th>Tổng tiền</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              {paged.length === 0 ? (
                <tbody>
                  <tr>
                    <td colSpan={10} className='text-center'>
                      Không có biên lai phù hợp.
                    </td>
                  </tr>
                </tbody>
              ) : (
                <tbody>
                  {paged.map(row => (
                    <tr
                      key={row.receiptNumber}
                      onClick={() => openReceiptPreview(row.receiptNumber)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>
                        <Typography color='primary.main' className='font-mono text-sm' fontWeight={600}>
                          {row.receiptNumber}
                        </Typography>
                      </td>
                      <td>
                        <Typography color='text.primary'>{row.studentName}</Typography>
                      </td>
                      <td>
                        <Typography color='text.secondary'>{row.classLabel}</Typography>
                      </td>
                      <td>
                        <Typography>{formatDate(row.paymentDate)}</Typography>
                      </td>
                      <td>
                        <Typography>{row.collectedByUserName}</Typography>
                      </td>
                      <td>
                        <Chip
                          label={paymentMethodLabels[row.method] ?? '-'}
                          size='small'
                          color={row.method === 1 ? 'info' : 'secondary'}
                          variant='tonal'
                        />
                      </td>
                      <td>
                        <div className='flex gap-1 flex-wrap'>
                          {row.types.map(type => (
                            <Chip
                              key={type}
                              label={paymentTypeLabels[type]}
                              size='small'
                              variant='tonal'
                              color={typeColorMap[type] ?? 'secondary'}
                            />
                          ))}
                        </div>
                      </td>
                      <td>
                        <Typography color='text.secondary'>{row.periods.length > 0 ? row.periods.join(', ') : '-'}</Typography>
                      </td>
                      <td>
                        <Typography color='text.primary' className='font-medium'>
                          {formatCurrency(row.totalAmount)}
                        </Typography>
                      </td>
                      <td onClick={event => event.stopPropagation()}>
                        <div className='flex gap-1 flex-wrap'>
                          {row.transferProofImageUrl && (
                            <Tooltip title='Xem ảnh chuyển khoản'>
                              <Button
                                size='small'
                                variant='outlined'
                                color='info'
                                startIcon={<i className='ri-image-line' />}
                                onClick={() => openProofImage(row.transferProofImageUrl)}
                              >
                                Ảnh CK
                              </Button>
                            </Tooltip>
                          )}
                          {!row.transferProofImageUrl && (
                            <Typography variant='body2' color='text.disabled'>
                              -
                            </Typography>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              )}
            </table>
          )}
        </div>

        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component='div'
          className='border-bs'
          count={filtered.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, nextPage) => setPage(nextPage)}
          onRowsPerPageChange={event => {
            setRowsPerPage(Number(event.target.value))
            setPage(0)
          }}
          labelRowsPerPage='Số dòng mỗi trang:'
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}`}
        />
      </Card>

      <Dialog
        open={proofImageOpen}
        onClose={() => {
          setProofImageOpen(false)
          setProofImageUrl(null)
        }}
        maxWidth='md'
        fullWidth
      >
        <DialogTitle>Ảnh minh chứng chuyển khoản</DialogTitle>
        <DialogContent>
          {proofImageUrl && (
            <Box className='flex justify-center'>
              <Box
                component='img'
                src={proofImageUrl}
                alt='Ảnh chuyển khoản'
                sx={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: 1 }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            variant='outlined'
            href={proofImageUrl || '#'}
            target='_blank'
            rel='noopener noreferrer'
            startIcon={<i className='ri-external-link-line' />}
            disabled={!proofImageUrl}
          >
            Mở ảnh gốc
          </Button>
          <Button
            onClick={() => {
              setProofImageOpen(false)
              setProofImageUrl(null)
            }}
          >
            Đóng
          </Button>
        </DialogActions>
      </Dialog>

      <ReceiptPreviewDialog
        open={receiptPreviewOpen}
        receiptNumber={selectedReceiptNumber}
        onClose={() => {
          setReceiptPreviewOpen(false)
          setSelectedReceiptNumber(null)
        }}
      />
    </>
  )
}

export default InvoiceListTable
