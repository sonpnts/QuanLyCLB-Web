'use client'

// React Imports
import { useMemo, useState } from 'react'

// Next Imports
import Link from 'next/link'

// MUI Imports
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import TextField from '@mui/material/TextField'
import TablePagination from '@mui/material/TablePagination'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'
import InputAdornment from '@mui/material/InputAdornment'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'

// Type Imports
import type { PaymentRecordType } from '@/types/apps/paymentTypes'
import { paymentTypeLabels, paymentMethodLabels } from '@/types/apps/paymentTypes'

// Style Imports
import tableStyles from '@core/styles/table.module.css'

// Utils
import { exportToExcel, formatVnDate, formatVnCurrency } from '@/utils/exportToExcel'

type ReceiptRow = {
  receiptNumber: string
  studentName: string
  paymentDate: string
  method: number
  types: number[]
  totalAmount: number
  items: PaymentRecordType[]
}

type Props = {
  payments: PaymentRecordType[]
  loading: boolean
  dateFrom: string
  dateTo: string
  onDateFromChange: (value: string) => void
  onDateToChange: (value: string) => void
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amount)

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })

const typeColorMap: Record<number, 'primary' | 'info' | 'success' | 'secondary'> = {
  0: 'primary',
  1: 'info',
  2: 'success',
  3: 'secondary'
}

const InvoiceListTable = ({ payments, loading, dateFrom, dateTo, onDateFromChange, onDateToChange }: Props) => {
  const [search, setSearch] = useState('')
  const [methodFilter, setMethodFilter] = useState<string>('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const receipts = useMemo(() => {
    const grouped = new Map<string, PaymentRecordType[]>()

    payments.forEach(payment => {
      const key = payment.receiptNumber || payment.id

      if (!grouped.has(key)) grouped.set(key, [])
      grouped.get(key)!.push(payment)
    })

    const rows: ReceiptRow[] = Array.from(grouped.entries()).map(([receiptNumber, items]) => {
      const first = items[0]

      return {
        receiptNumber,
        studentName: first.studentName || '-',
        paymentDate: first.paymentDate,
        method: first.method,
        types: [...new Set(items.map(item => item.type))],
        totalAmount: items.reduce((sum, item) => sum + Number(item.amount || 0), 0),
        items
      }
    })

    return rows.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
  }, [payments])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()

    return receipts.filter(receipt => {
      const matchSearch =
        !q || receipt.receiptNumber.toLowerCase().includes(q) || receipt.studentName.toLowerCase().includes(q)

      const matchMethod = methodFilter === '' || String(receipt.method) === methodFilter

      return matchSearch && matchMethod
    })
  }, [receipts, search, methodFilter])

  const paged = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

  const handleResetDate = () => {
    onDateFromChange('')
    onDateToChange('')
    setPage(0)
  }

  return (
    <Card>
      <CardContent className='flex justify-between gap-4 flex-wrap flex-col sm:flex-row items-center'>
        <Typography variant='h6'>Danh sách biên lai</Typography>
        <div className='flex gap-3 flex-wrap items-center'>
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
          <Button variant='outlined' color='secondary' onClick={handleResetDate} disabled={!dateFrom && !dateTo}>
            Xóa lọc ngày
          </Button>
          <TextField
            size='small'
            placeholder='Tìm theo học viên, số biên lai...'
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
            className='min-is-[220px]'
          />
          <FormControl size='small' className='min-is-[160px]'>
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
          <Button
            variant='outlined'
            color='success'
            startIcon={<i className='ri-file-excel-2-line' />}
            disabled={filtered.length === 0}
            onClick={() => {
              exportToExcel({
                filename: 'danh-sach-bien-lai',
                rows: filtered,
                columns: [
                  { header: 'Số biên lai', accessor: 'receiptNumber' },
                  { header: 'Ngày', accessor: 'paymentDate', formatter: formatVnDate },
                  { header: 'Học viên', accessor: 'studentName' },
                  {
                    header: 'Loại',
                    accessor: 'types',
                    formatter: value =>
                      Array.isArray(value)
                        ? value.map((type: number) => paymentTypeLabels[type] || '').filter(Boolean).join(', ')
                        : ''
                  },
                  {
                    header: 'Phương thức',
                    accessor: 'method',
                    formatter: value => paymentMethodLabels[value as number] || ''
                  },
                  { header: 'Tổng tiền (VNĐ)', accessor: 'totalAmount', formatter: formatVnCurrency },
                  { header: 'Số khoản', accessor: row => (row as ReceiptRow).items.length }
                ]
              })
            }}
          >
            Xuất Excel
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
                <th>Ngày thu</th>
                <th>Phương thức</th>
                <th>Loại thu</th>
                <th>Tổng tiền</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            {paged.length === 0 ? (
              <tbody>
                <tr>
                  <td colSpan={7} className='text-center'>
                    Không có biên lai nào
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody>
                {paged.map(row => (
                  <tr key={row.receiptNumber}>
                    <td>
                      <Typography
                        component={Link}
                        href={`/apps/invoice/preview/${encodeURIComponent(row.receiptNumber)}`}
                        color='primary.main'
                        className='font-mono text-sm'
                      >
                        {row.receiptNumber}
                      </Typography>
                    </td>
                    <td>
                      <Typography color='text.primary'>{row.studentName}</Typography>
                    </td>
                    <td>
                      <Typography>{formatDate(row.paymentDate)}</Typography>
                    </td>
                    <td>
                      <Typography>{paymentMethodLabels[row.method] ?? '-'}</Typography>
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
                      <Typography color='text.primary' className='font-medium'>
                        {formatCurrency(row.totalAmount)}
                      </Typography>
                    </td>
                    <td>
                      <IconButton
                        size='small'
                        component={Link}
                        href={`/apps/invoice/preview/${encodeURIComponent(row.receiptNumber)}`}
                        title='Xem biên lai'
                      >
                        <i className='ri-eye-line text-textSecondary' />
                      </IconButton>
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
  )
}

export default InvoiceListTable
