'use client'

// React Imports
import { useEffect, useState, useCallback, useMemo } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid2'
import TextField from '@mui/material/TextField'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'

// Third-party Imports
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'

// Type Imports
import type { GetPayrollParams, GeneratePayrollRequest } from '@/services/payrollService'
import { fuzzyFilter } from '@/utils/tableHelpers'
// Service Imports
import payrollService from '@/services/payrollService'

// Context Imports
import { useNotification } from '@/contexts/notificationContext'

// Column Helper
const columnHelper = createColumnHelper<any>()

const PayrollListTable = () => {
  // States
  const [data, setData] = useState<any[]>([])
  const [filteredData, setFilteredData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [generatePayrollOpen, setGeneratePayrollOpen] = useState(false)
  const [filterParams, setFilterParams] = useState<GetPayrollParams>({})

  // Generate form states
  const [coachId, setCoachId] = useState<string>('')
  const [year, setYear] = useState<number>(new Date().getFullYear())
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1)

  // Notification Hook
  const { showNotification } = useNotification()

  // Load payroll data
  const loadPayrolls = useCallback(async () => {
    try {
      setLoading(true)
      const response = await payrollService.getPayrolls(filterParams)

      if (response.success && response.data) {
        setData(response.data)
        setFilteredData(response.data)
      } else {
        setData([])
        setFilteredData([])
      }
    } catch (error) {
      console.error('Error loading payrolls:', error)
      setData([])
      setFilteredData([])
    } finally {
      setLoading(false)
    }
  }, [filterParams])

  useEffect(() => {
    loadPayrolls()
  }, [loadPayrolls])

  // Handle generate payroll
  const handleGeneratePayroll = async () => {
    try {
      setLoading(true)

      const generateData: GeneratePayrollRequest = {
        coachId,
        year,
        month
      }

      const response = await payrollService.generatePayroll(generateData)

      if (response.success) {
        showNotification('Tạo bảng lương thành công.', 'success')
        setGeneratePayrollOpen(false)
        setCoachId('')
        setYear(new Date().getFullYear())
        setMonth(new Date().getMonth() + 1)
        loadPayrolls()
      } else {
        showNotification(response.message || 'Không thể tạo bảng lương.', 'error')
      }
    } catch (error) {
      console.error('Error generating payroll:', error)
      showNotification('Đã có lỗi khi tạo bảng lương.', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Handle filter change
  const handleFilterChange = (newParams: Partial<GetPayrollParams>) => {
    setFilterParams(prev => ({ ...prev, ...newParams }))
  }

  // Columns
  const columns = useMemo(
    () => [
      columnHelper.accessor('coachId', {
        header: 'Huấn luyện viên',
        cell: ({ row }) => (
          <Typography variant='body2' className='font-medium'>
            {row.original.coachId}
          </Typography>
        )
      }),
      columnHelper.accessor('year', {
        header: 'Năm',
        cell: ({ row }) => <Typography variant='body2'>{row.original.year}</Typography>
      }),
      columnHelper.accessor('month', {
        header: 'Tháng',
        cell: ({ row }) => <Typography variant='body2'>{row.original.month}</Typography>
      }),
      columnHelper.accessor('totalAmount', {
        header: 'Tổng tiền',
        cell: ({ row }) => (
          <Typography variant='body2' className='font-medium'>
            {row.original.totalAmount ? `${row.original.totalAmount.toLocaleString('vi-VN')} VNĐ` : '-'}
          </Typography>
        )
      }),
      columnHelper.accessor('generatedAt', {
        header: 'Ngày tạo',
        cell: ({ row }) => (
          <Typography variant='body2'>
            {row.original.generatedAt ? new Date(row.original.generatedAt).toLocaleDateString('vi-VN') : '-'}
          </Typography>
        )
      }),
      columnHelper.accessor('isActive', {
        header: 'Trạng thái',
        cell: ({ row }) => (
          <Chip
            label={row.original.isActive ? 'Hoạt động' : 'Không hoạt động'}
            color={row.original.isActive ? 'success' : 'error'}
            variant='tonal'
            size='small'
          />
        )
      })
    ],
    []
  )

  // Table
  const table = useReactTable({
    data: filteredData,
    columns,
    filterFns: { fuzzy: fuzzyFilter },
    getCoreRowModel: getCoreRowModel()
  })

  return (
    <>
      <Card>
        <CardHeader
          title='Bảng lương'
          action={
            <Button variant='contained' onClick={() => setGeneratePayrollOpen(true)}>
              Tạo bảng lương
            </Button>
          }
        />
        <div className='p-5'>
          <Grid container spacing={4} className='mb-4'>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                fullWidth
                label='ID Huấn luyện viên'
                value={filterParams.CoachId || ''}
                onChange={e => handleFilterChange({ CoachId: e.target.value || undefined })}
                placeholder='Nhập ID huấn luyện viên...'
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                fullWidth
                label='Năm'
                type='number'
                value={filterParams.Year || ''}
                onChange={e => handleFilterChange({ Year: e.target.value ? parseInt(e.target.value) : undefined })}
                placeholder='Nhập năm...'
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                fullWidth
                label='Tháng'
                type='number'
                value={filterParams.Month || ''}
                onChange={e => handleFilterChange({ Month: e.target.value ? parseInt(e.target.value) : undefined })}
                placeholder='Nhập tháng...'
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Button
                variant='outlined'
                onClick={() => {
                  setFilterParams({})
                  setFilteredData(data)
                }}
                fullWidth
              >
                Xóa bộ lọc
              </Button>
            </Grid>
          </Grid>

          {filteredData.length > 0 ? (
            <div className='overflow-x-auto'>
              <table className='w-full'>
                <thead>
                  {table.getHeaderGroups().map(headerGroup => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map(header => (
                        <th key={header.id} className='p-4 text-left'>
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.map(row => (
                    <tr key={row.id} className='border-t'>
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id} className='p-4'>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Box className='text-center py-8'>
              <Typography variant='body1' color='text.secondary'>
                Chưa có bảng lương nào
              </Typography>
            </Box>
          )}
        </div>
      </Card>

      {/* Generate Payroll Dialog */}
      <Dialog open={generatePayrollOpen} onClose={() => setGeneratePayrollOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>Tạo bảng lương</DialogTitle>
        <DialogContent>
          <Box className='flex flex-col gap-4 pt-4'>
            <TextField
              fullWidth
              label='ID Huấn luyện viên'
              value={coachId}
              onChange={e => setCoachId(e.target.value)}
              required
            />
            <TextField
              fullWidth
              label='Năm'
              type='number'
              value={year}
              onChange={e => setYear(parseInt(e.target.value))}
              required
            />
            <FormControl fullWidth>
              <InputLabel>Tháng</InputLabel>
              <Select value={month} label='Tháng' onChange={e => setMonth(e.target.value as number)}>
                {Array.from({ length: 12 }, (_, i) => (
                  <MenuItem key={i + 1} value={i + 1}>
                    Tháng {i + 1}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGeneratePayrollOpen(false)}>Hủy</Button>
          <Button onClick={handleGeneratePayroll} variant='contained' disabled={loading || !coachId}>
            {loading ? 'Đang tạo...' : 'Tạo bảng lương'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default PayrollListTable
