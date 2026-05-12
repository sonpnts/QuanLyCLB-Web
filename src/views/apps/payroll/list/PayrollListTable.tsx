'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControl from '@mui/material/FormControl'
import Grid from '@mui/material/Grid2'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'

import type { GetPayrollParams, GeneratePayrollRequest } from '@/services/payrollService'
import payrollService from '@/services/payrollService'
import { useNotification } from '@/contexts/notificationContext'
import { useAuth } from '@/contexts/authContext'
import { hasAdminRole } from '@/utils/roleUtils'
import { exportToExcel, formatVnCurrency, formatVnDate } from '@/utils/exportToExcel'

const columnHelper = createColumnHelper<any>()

const PayrollListTable = () => {
  const { auth } = useAuth()
  const { showNotification } = useNotification()

  const isAdmin = useMemo(() => hasAdminRole(auth?.roles), [auth?.roles])
  const currentUserId = auth?.user?.id

  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [generatePayrollOpen, setGeneratePayrollOpen] = useState(false)
  const [filterParams, setFilterParams] = useState<GetPayrollParams>({})

  const [coachId, setCoachId] = useState<string>('')
  const [year, setYear] = useState<number>(new Date().getFullYear())
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1)

  const loadPayrolls = useCallback(async () => {
    try {
      setLoading(true)

      const response = isAdmin
        ? await payrollService.getPayrolls(filterParams)
        : currentUserId
          ? await payrollService.getPayrollByCoach(currentUserId)
          : { success: true, data: [] as any[] }

      const records = response.success && response.data ? response.data : []
      const sorted = [...records].sort((a, b) => new Date(b.generatedAt ?? 0).getTime() - new Date(a.generatedAt ?? 0).getTime())
      setData(sorted)
    } catch {
      setData([])
    } finally {
      setLoading(false)
    }
  }, [currentUserId, filterParams, isAdmin])

  useEffect(() => {
    loadPayrolls()
  }, [loadPayrolls])

  const handleGeneratePayroll = async () => {
    try {
      setLoading(true)
      const generateData: GeneratePayrollRequest = { coachId, year, month }
      const response = await payrollService.generatePayroll(generateData)
      if (!response.success) {
        showNotification(response.message || 'Không thể tạo bảng lương.', 'error')
        return
      }

      showNotification('Tạo bảng lương thành công.', 'success')
      setGeneratePayrollOpen(false)
      setCoachId('')
      setYear(new Date().getFullYear())
      setMonth(new Date().getMonth() + 1)
      await loadPayrolls()
    } catch {
      showNotification('Đã có lỗi khi tạo bảng lương.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const filteredData = useMemo(() => {
    let rows = [...data]
    if (filterParams.Year) rows = rows.filter(x => x.year === filterParams.Year)
    if (filterParams.Month) rows = rows.filter(x => x.month === filterParams.Month)
    if (isAdmin && filterParams.CoachId) rows = rows.filter(x => String(x.coachId).includes(String(filterParams.CoachId)))
    return rows
  }, [data, filterParams, isAdmin])

  const columns = useMemo(
    () => [
      columnHelper.accessor('coachId', {
        header: 'Huấn luyện viên',
        cell: ({ row }) => <Typography variant='body2' className='font-medium'>{row.original.coachId}</Typography>
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
        cell: ({ row }) => <Typography variant='body2' className='font-medium'>{formatVnCurrency(row.original.totalAmount || 0)}</Typography>
      }),
      columnHelper.accessor('generatedAt', {
        header: 'Ngày tạo',
        cell: ({ row }) => <Typography variant='body2'>{row.original.generatedAt ? formatVnDate(row.original.generatedAt) : '-'}</Typography>
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

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel()
  })

  return (
    <>
      <Card>
        <CardHeader
          title={isAdmin ? 'Bảng lương' : 'Lương của tôi'}
          action={
            <div className='flex gap-2'>
              <Button
                variant='outlined'
                color='success'
                startIcon={<i className='ri-file-excel-2-line' />}
                disabled={filteredData.length === 0}
                onClick={() =>
                  exportToExcel({
                    filename: isAdmin ? 'bang-luong' : 'luong-cua-toi',
                    rows: filteredData,
                    columns: [
                      { header: 'Mã HLV', accessor: 'coachId' as any },
                      { header: 'Năm', accessor: 'year' as any },
                      { header: 'Tháng', accessor: 'month' as any },
                      { header: 'Tổng tiền (VNĐ)', accessor: 'totalAmount' as any, formatter: formatVnCurrency },
                      { header: 'Ngày tạo', accessor: 'generatedAt' as any, formatter: formatVnDate },
                      { header: 'Trạng thái', accessor: 'isActive' as any, formatter: v => (v ? 'Hoạt động' : 'Không hoạt động') }
                    ]
                  })
                }
              >
                Xuất Excel
              </Button>
              {isAdmin && (
                <Button variant='contained' onClick={() => setGeneratePayrollOpen(true)}>
                  Tạo bảng lương
                </Button>
              )}
            </div>
          }
        />

        <div className='p-5'>
          <Grid container spacing={4} className='mb-4'>
            {isAdmin && (
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField
                  fullWidth
                  label='ID huấn luyện viên'
                  value={filterParams.CoachId || ''}
                  onChange={e => setFilterParams(prev => ({ ...prev, CoachId: e.target.value || undefined }))}
                />
              </Grid>
            )}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                fullWidth
                label='Năm'
                type='number'
                value={filterParams.Year || ''}
                onChange={e => setFilterParams(prev => ({ ...prev, Year: e.target.value ? parseInt(e.target.value, 10) : undefined }))}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                fullWidth
                label='Tháng'
                type='number'
                value={filterParams.Month || ''}
                onChange={e => setFilterParams(prev => ({ ...prev, Month: e.target.value ? parseInt(e.target.value, 10) : undefined }))}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Button variant='outlined' fullWidth onClick={() => setFilterParams({})}>
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
                          {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
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
                {loading ? 'Đang tải...' : 'Chưa có bảng lương nào'}
              </Typography>
            </Box>
          )}
        </div>
      </Card>

      {isAdmin && (
        <Dialog open={generatePayrollOpen} onClose={() => setGeneratePayrollOpen(false)} maxWidth='sm' fullWidth>
          <DialogTitle>Tạo bảng lương</DialogTitle>
          <DialogContent>
            <Box className='flex flex-col gap-4 pt-4'>
              <TextField fullWidth label='ID huấn luyện viên' value={coachId} onChange={e => setCoachId(e.target.value)} required />
              <TextField fullWidth label='Năm' type='number' value={year} onChange={e => setYear(parseInt(e.target.value, 10))} required />
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
      )}
    </>
  )
}

export default PayrollListTable
