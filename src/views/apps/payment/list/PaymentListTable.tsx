'use client'

// React Imports
import { useEffect, useState, useMemo, useCallback, useRef } from 'react'

// MUI Imports
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import TablePagination from '@mui/material/TablePagination'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import type { TextFieldProps } from '@mui/material/TextField'

// Third-party Imports
import classnames from 'classnames'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel
} from '@tanstack/react-table'
import type { ColumnDef } from '@tanstack/react-table'

import { fuzzyFilter } from '@/utils/tableHelpers'
import { exportToExcel, formatVnDate, formatVnCurrency } from '@/utils/exportToExcel'
import { normalizePaymentMethod, isBankTransferMethod } from '@/utils/paymentMethod'
import { normalizePaymentType } from '@/utils/paymentType'

// Type Imports
import type { PaymentRecordType } from '@/types/apps/paymentTypes'
import { paymentTypeLabels, paymentMethodLabels, PaymentTypeColors } from '@/types/apps/paymentTypes'

// Component Imports
import TableFilters from './TableFilters'
import AddPaymentDrawer from './AddPaymentDrawer'
import ReceiptModal from './ReceiptModal'

// Service Imports
import paymentService from '@/services/paymentService'
import type { GetPaymentsParams } from '@/services/paymentService'

// Context Imports
import { useNotification } from '@/contexts/notificationContext'
import { useAuth } from '@/contexts/authContext'
import { hasPermission } from '@/utils/permissionUtils'
import { hasAdminRole } from '@/utils/roleUtils'

// Style Imports
import tableStyles from '@core/styles/table.module.css'

const DebouncedInput = ({
  value: initialValue,
  onChange,
  debounce = 500,
  ...props
}: {
  value: string | number
  onChange: (value: string | number) => void
  debounce?: number
} & Omit<TextFieldProps, 'onChange'>) => {
  const [value, setValue] = useState(initialValue)

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  useEffect(() => {
    const timeout = setTimeout(() => onChange(value), debounce)

    return () => clearTimeout(timeout)
  }, [value, debounce, onChange])

  return <TextField {...props} value={value} onChange={e => setValue(e.target.value)} size='small' />
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)

const columnHelper = createColumnHelper<PaymentRecordType>()

const PaymentListTable = ({ createSignal }: { createSignal?: number }) => {
  const { auth } = useAuth()
  const isAdmin = useMemo(
    () => hasPermission(auth?.permissions, 'Payment.Collect.ManageAll') || hasAdminRole(auth?.roles),
    [auth?.permissions, auth?.roles]
  )

  const [addPaymentOpen, setAddPaymentOpen] = useState(false)
  const [replacementOpen, setReplacementOpen] = useState(false)
  const [receiptModalOpen, setReceiptModalOpen] = useState(false)
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null)
  const [proofImageOpen, setProofImageOpen] = useState(false)
  const [proofImageUrl, setProofImageUrl] = useState<string | null>(null)
  
  const [data, setData] = useState<PaymentRecordType[]>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [filterParams, setFilterParams] = useState<GetPaymentsParams>({})


  const { showNotification } = useNotification()

  // Refs để tránh duplicate calls
  const showNotificationRef = useRef(showNotification)

  showNotificationRef.current = showNotification
  const dataLoadedRef = useRef(false)
  const currentFilterRef = useRef<string>('')

  // External "create payment" trigger (used by merged Payment+Invoice page).
  const lastCreateSignalRef = useRef<number | undefined>(createSignal)
  useEffect(() => {
    if (createSignal == null) return
    if (lastCreateSignalRef.current === createSignal) return
    lastCreateSignalRef.current = createSignal
    setAddPaymentOpen(true)
  }, [createSignal])

  const handleFilterChange = useCallback((params: GetPaymentsParams) => {
    setFilterParams(params)
  }, [])

  useEffect(() => {
    const filterKey = JSON.stringify(filterParams)

    if (dataLoadedRef.current && currentFilterRef.current === filterKey) {
      return
    }

    const loadPayments = async () => {
      try {
        setLoading(true)
        currentFilterRef.current = filterKey
        dataLoadedRef.current = true

        const response = await paymentService.getPayments(filterParams)

        const records = response.data || []

        setData([...records].sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()))
      } catch {
        setData([])
      } finally {
        setLoading(false)
      }
    }

    loadPayments()
  }, [filterParams])

  const handleViewReceipt = (receiptNumber: string) => {
    setSelectedReceipt(receiptNumber)
    setReceiptModalOpen(true)
  }

  const handleViewProof = (imageUrl: string) => {
    setProofImageUrl(imageUrl)
    setProofImageOpen(true)
  }


  const columns = useMemo<ColumnDef<PaymentRecordType, any>[]>(
    () => [
      {
        id: 'receiptNumber',
        header: 'Số Biên lai',
        cell: ({ row }) => (
          <Typography variant='body2' fontWeight={500} color='primary'>
            {row.original.receiptNumber || '-'}
          </Typography>
        )
      },
      columnHelper.accessor('studentName', {
        header: 'Học viên',
        cell: ({ row }) => (
          <Typography className='font-medium' color='text.primary'>
            {row.original.studentName || '-'}
          </Typography>
        )
      }),
      columnHelper.accessor('className', {
        header: 'Lớp học',
        cell: ({ row }) => <Typography>{row.original.className || '-'}</Typography>
      }),
      columnHelper.accessor('type', {
        header: 'Loại thanh toán',
        cell: ({ row }) => {
          const typeVal = row.original.type
          const numericType = normalizePaymentType(typeVal, 3)
          return (
            <Chip
              label={paymentTypeLabels[numericType] || String(typeVal)}
              size='small'
              color={PaymentTypeColors[numericType] || 'default'}
              variant='tonal'
            />
          )
        }
      }),
      columnHelper.accessor('originalAmount', {
        header: 'Tiền gốc',
        cell: ({ row }) => (
          <Typography variant='body2' color='text.secondary'>
            {row.original.originalAmount != null ? formatCurrency(row.original.originalAmount) : '-'}
          </Typography>
        )
      }),
      columnHelper.accessor('discountAmount', {
        header: 'Giảm trừ',
        cell: ({ row }) =>
          row.original.discountAmount && row.original.discountAmount > 0 ? (
            <Tooltip title={row.original.discountReason || ''}>
              <Typography variant='body2' color='warning.main'>
                -{formatCurrency(row.original.discountAmount)}
              </Typography>
            </Tooltip>
          ) : (
            <Typography variant='body2' color='text.disabled'>
              —
            </Typography>
          )
      }),
      columnHelper.accessor('amount', {
        header: 'Thực thu',
        cell: ({ row }) => (
          <Typography className='font-medium' color='success.main'>
            {formatCurrency(row.original.amount)}
          </Typography>
        )
      }),
      columnHelper.accessor('paymentDate', {
        header: 'Ngày TT',
        cell: ({ row }) => (
          <Typography variant='body2'>
            {new Date(row.original.paymentDate).toLocaleDateString('vi-VN')}
          </Typography>
        )
      }),
      columnHelper.accessor('method', {
        header: 'Phương thức',
        cell: ({ row }) => {
          const methodVal = row.original.method
          const numericMethod = normalizePaymentMethod(methodVal, 0)
          return (
            <Chip
              label={paymentMethodLabels[numericMethod] || String(methodVal)}
              size='small'
              color={numericMethod === 1 ? 'info' : 'secondary'}
              variant='tonal'
            />
          )
        }
      }),
      {
        id: 'period',
        header: 'Kỳ',
        cell: ({ row }) => (
          <Typography variant='body2'>
            {row.original.forMonth && row.original.forYear
              ? `${row.original.forMonth}/${row.original.forYear}`
              : '-'}
          </Typography>
        )
      },
      columnHelper.accessor('collectedByUserName', {
        header: 'Người thu',
        cell: ({ row }) => (
          <Typography variant='body2' color='text.secondary'>
            {row.original.collectedByUserName || '-'}
          </Typography>
        )
      }),
      columnHelper.accessor('createdByUserName', {
        header: 'Người tạo',
        cell: ({ row }) => (
          <Typography variant='body2' color='text.secondary'>
            {row.original.createdByUserName || '-'}
          </Typography>
        )
      }),
      {
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row }) => {
          const isBankTransfer = isBankTransferMethod(row.original.method)
          return (
            <div className='flex items-center'>
              {row.original.receiptNumber && (
                <Tooltip title='Xem biên lai'>
                  <IconButton
                    size='small'
                    color='info'
                    onClick={() => handleViewReceipt(row.original.receiptNumber!)}
                  >
                    <i className='ri-eye-line text-lg' />
                  </IconButton>
                </Tooltip>
              )}
              {isBankTransfer && row.original.transferProofImageUrl && (
                <Tooltip title='Xem ảnh chuyển khoản'>
                  <IconButton
                    size='small'
                    color='success'
                    onClick={() => handleViewProof(row.original.transferProofImageUrl!)}
                  >
                    <i className='ri-image-line text-lg' />
                  </IconButton>
                </Tooltip>
              )}
            </div>
          )
        }
      }
    ],
    []
  )

  const table = useReactTable({
    data,
    columns,
    filterFns: { fuzzy: fuzzyFilter },
    state: { globalFilter },
    initialState: { pagination: { pageSize: 10 } },
    globalFilterFn: fuzzyFilter,
    getCoreRowModel: getCoreRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  })

  return (
    <>
      <Card>
        <CardHeader title='Quản lý thanh toán' />
        <TableFilters onFilterChange={handleFilterChange} />
        <Divider />
        <div className='flex justify-between p-5 gap-4 flex-col items-start sm:flex-row sm:items-center'>
          <Button color='secondary' variant='outlined' startIcon={<i className='ri-upload-2-line text-xl' />}>
            Xuất báo cáo
          </Button>
          <div className='flex items-center gap-x-4 gap-4 flex-col max-sm:is-full sm:flex-row'>
            <DebouncedInput
              value={globalFilter ?? ''}
              onChange={value => setGlobalFilter(String(value))}
              placeholder='Tìm kiếm...'
              className='max-sm:is-full'
            />
            <Button
              variant='outlined'
              color='success'
              startIcon={<i className='ri-file-excel-2-line' />}
              disabled={data.length === 0}
              onClick={() => {
                exportToExcel({
                  filename: 'danh-sach-thanh-toan',
                  rows: data,
                  columns: [
                    { header: 'Số biên lai', accessor: 'receiptNumber' as any },
                    { header: 'Ngày thanh toán', accessor: 'paymentDate', formatter: formatVnDate },
                    { header: 'Học viên', accessor: 'studentName' as any },
                    { header: 'Lớp', accessor: 'className' as any },
                    {
                      header: 'Loại',
                      accessor: 'type',
                      formatter: v => paymentTypeLabels[v as number] || ''
                    },
                    { header: 'Số tiền', accessor: 'amount', formatter: formatVnCurrency },
                    { header: 'Đã giảm', accessor: 'discountAmount' as any, formatter: formatVnCurrency },
                    { header: 'Lý do giảm', accessor: 'discountReason' as any },
                    {
                      header: 'Phương thức',
                      accessor: 'method',
                      formatter: v => paymentMethodLabels[v as number] || ''
                    },
                    { header: 'Người thu', accessor: 'collectedByUserName' as any },
                    { header: 'Ghi chú', accessor: 'description' as any }
                  ]
                })
              }}
            >
              Xuất Excel
            </Button>
            {isAdmin && (
              <Button variant='outlined' color='warning' onClick={() => setReplacementOpen(true)}>
                Tạo hóa đơn thay
              </Button>
            )}
            <Button variant='contained' onClick={() => setAddPaymentOpen(true)}>
              Thêm thanh toán
            </Button>
          </div>
        </div>
        <div className='overflow-x-auto'>
          <table className={tableStyles.table}>
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th key={header.id}>
                      {header.isPlaceholder ? null : (
                        <div
                          className={classnames({
                            'flex items-center': header.column.getIsSorted(),
                            'cursor-pointer select-none': header.column.getCanSort()
                          })}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getFilteredRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className='text-center'>
                    {loading ? 'Đang tải...' : 'Không có dữ liệu'}
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map(row => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component='div'
          className='border-bs'
          count={table.getFilteredRowModel().rows.length}
          rowsPerPage={table.getState().pagination.pageSize}
          page={table.getState().pagination.pageIndex}
          onPageChange={(_, page) => table.setPageIndex(page)}
          onRowsPerPageChange={e => table.setPageSize(Number(e.target.value))}
        />
      </Card>

      <AddPaymentDrawer open={addPaymentOpen} handleClose={() => setAddPaymentOpen(false)} setData={setData} />
      <AddPaymentDrawer
        open={replacementOpen}
        handleClose={() => setReplacementOpen(false)}
        setData={setData}
        mode='replacement'
      />

      <ReceiptModal
        open={receiptModalOpen}
        receiptNumber={selectedReceipt}
        onClose={() => { setReceiptModalOpen(false); setSelectedReceipt(null) }}
      />

      {/* Proof image viewer */}
      <Dialog
        open={proofImageOpen}
        onClose={() => { setProofImageOpen(false); setProofImageUrl(null) }}
        maxWidth='md'
        fullWidth
      >
        <DialogTitle>
          Ảnh chụp màn hình chuyển khoản
          <IconButton
            size='small'
            onClick={() => { setProofImageOpen(false); setProofImageUrl(null) }}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <i className='ri-close-line' />
          </IconButton>
        </DialogTitle>
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
          <Button onClick={() => { setProofImageOpen(false); setProofImageUrl(null) }}>Đóng</Button>
        </DialogActions>
      </Dialog>

    </>
  )
}

export default PaymentListTable

