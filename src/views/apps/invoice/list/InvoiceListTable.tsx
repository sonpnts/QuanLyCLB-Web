'use client'

// React Imports
import { useState, useEffect, useMemo } from 'react'

// Next Imports
import Link from 'next/link'

// MUI Imports
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

// Type & Service Imports
import type { PaymentRecordType } from '@/types/apps/paymentTypes'
import { paymentTypeLabels, paymentMethodLabels } from '@/types/apps/paymentTypes'
import paymentService from '@/services/paymentService'

// Style Imports
import tableStyles from '@core/styles/table.module.css'

// Utils
import Button from '@mui/material/Button'
import { exportToExcel, formatVnDate, formatVnCurrency } from '@/utils/exportToExcel'

// One row in the table = one receipt (may group multiple payment records)
type ReceiptRow = {
  receiptNumber: string
  studentName: string
  paymentDate: string
  method: number
  types: number[]
  totalAmount: number
  items: PaymentRecordType[]
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

const InvoiceListTable = () => {
  const [loading, setLoading] = useState(true)
  const [receipts, setReceipts] = useState<ReceiptRow[]>([])
  const [search, setSearch] = useState('')
  const [methodFilter, setMethodFilter] = useState<string>('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  useEffect(() => {
    const load = async () => {
      setLoading(true)

      try {
        const res = await paymentService.getPayments({ pageSize: 1000 })

        if (res.success && res.data) {
          // Group by receiptNumber; payments without one get their own row keyed by id
          const grouped = new Map<string, PaymentRecordType[]>()

          res.data.forEach(payment => {
            const key = payment.receiptNumber || payment.id

            if (!grouped.has(key)) grouped.set(key, [])
            grouped.get(key)!.push(payment)
          })

          const rows: ReceiptRow[] = Array.from(grouped.entries()).map(([receiptNumber, items]) => {
            const first = items[0]

            return {
              receiptNumber,
              studentName: first.studentName || '—',
              paymentDate: first.paymentDate,
              method: first.method,
              types: [...new Set(items.map(i => i.type))],
              totalAmount: items.reduce((sum, i) => sum + i.amount, 0),
              items
            }
          })

          // Sort newest first
          rows.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
          setReceipts(rows)
        }
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()

    return receipts.filter(r => {
      const matchSearch =
        !q || r.receiptNumber.toLowerCase().includes(q) || r.studentName.toLowerCase().includes(q)
      const matchMethod = methodFilter === '' || String(r.method) === methodFilter

      return matchSearch && matchMethod
    })
  }, [receipts, search, methodFilter])

  const paged = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

  return (
    <Card>
      <CardContent className='flex justify-between gap-4 flex-wrap flex-col sm:flex-row items-center'>
        <Typography variant='h6'>Danh sách biên lai</Typography>
        <div className='flex gap-3 flex-wrap items-center'>
          <TextField
            size='small'
            placeholder='Tìm theo học viên, số biên lai...'
            value={search}
            onChange={e => {
              setSearch(e.target.value)
              setPage(0)
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <i className='ri-search-line text-textSecondary' />
                </InputAdornment>
              )
            }}
            className='min-is-[220px]'
          />
          <FormControl size='small' className='min-is-[160px]'>
            <InputLabel>Phương thức</InputLabel>
            <Select
              value={methodFilter}
              label='Phương thức'
              onChange={e => {
                setMethodFilter(e.target.value)
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
                    formatter: v =>
                      Array.isArray(v) ? v.map((t: number) => paymentTypeLabels[t] || '').filter(Boolean).join(', ') : ''
                  },
                  {
                    header: 'Phương thức',
                    accessor: 'method',
                    formatter: v => paymentMethodLabels[v as number] || ''
                  },
                  { header: 'Tổng tiền (VNĐ)', accessor: 'totalAmount', formatter: formatVnCurrency },
                  { header: 'Số khoản', accessor: r => (r as ReceiptRow).items.length }
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
                      <Typography>{paymentMethodLabels[row.method] ?? '—'}</Typography>
                    </td>
                    <td>
                      <div className='flex gap-1 flex-wrap'>
                        {row.types.map(t => (
                          <Chip
                            key={t}
                            label={paymentTypeLabels[t]}
                            size='small'
                            variant='tonal'
                            color={typeColorMap[t] ?? 'default'}
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
        onPageChange={(_, p) => setPage(p)}
        onRowsPerPageChange={e => {
          setRowsPerPage(Number(e.target.value))
          setPage(0)
        }}
        labelRowsPerPage='Số dòng mỗi trang:'
        labelDisplayedRows={({ from, to, count }) => `${from}–${to} / ${count}`}
      />
    </Card>
  )
}

export default InvoiceListTable
