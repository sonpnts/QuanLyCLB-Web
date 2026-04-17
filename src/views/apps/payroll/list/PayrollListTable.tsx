'use client'

// React Imports
import { logger } from '@/utils/logger'
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
      logger.error('PayrollListTable', 'Error loading payrolls', error)
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
        showNotification('Táº¡o báº£ng lÆ°Æ¡ng thÃ nh cÃ´ng.', 'success')
        setGeneratePayrollOpen(false)
        setCoachId('')
        setYear(new Date().getFullYear())
        setMonth(new Date().getMonth() + 1)
        loadPayrolls()
      } else {
        showNotification(response.message || 'KhÃ´ng thá»ƒ táº¡o báº£ng lÆ°Æ¡ng.', 'error')
      }
    } catch (error) {
      logger.error('PayrollListTable', 'Error generating payroll', error)
      showNotification('ÄÃ£ cÃ³ lá»—i khi táº¡o báº£ng lÆ°Æ¡ng.', 'error')
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
        header: 'Huáº¥n luyá»‡n viÃªn',
        cell: ({ row }) => (
          <Typography variant='body2' className='font-medium'>
            {row.original.coachId}
          </Typography>
        )
      }),
      columnHelper.accessor('year', {
        header: 'NÄƒm',
        cell: ({ row }) => <Typography variant='body2'>{row.original.year}</Typography>
      }),
      columnHelper.accessor('month', {
        header: 'ThÃ¡ng',
        cell: ({ row }) => <Typography variant='body2'>{row.original.month}</Typography>
      }),
      columnHelper.accessor('totalAmount', {
        header: 'Tá»•ng tiá»n',
        cell: ({ row }) => (
          <Typography variant='body2' className='font-medium'>
            {row.original.totalAmount ? `${row.original.totalAmount.toLocaleString('vi-VN')} VNÄ` : '-'}
          </Typography>
        )
      }),
      columnHelper.accessor('generatedAt', {
        header: 'NgÃ y táº¡o',
        cell: ({ row }) => (
          <Typography variant='body2'>
            {row.original.generatedAt ? new Date(row.original.generatedAt).toLocaleDateString('vi-VN') : '-'}
          </Typography>
        )
      }),
      columnHelper.accessor('isActive', {
        header: 'Tráº¡ng thÃ¡i',
        cell: ({ row }) => (
          <Chip
            label={row.original.isActive ? 'Hoáº¡t Ä‘á»™ng' : 'KhÃ´ng hoáº¡t Ä‘á»™ng'}
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
          title='Báº£ng lÆ°Æ¡ng'
          action={
            <Button variant='contained' onClick={() => setGeneratePayrollOpen(true)}>
              Táº¡o báº£ng lÆ°Æ¡ng
            </Button>
          }
        />
        <div className='p-5'>
          <Grid container spacing={4} className='mb-4'>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                fullWidth
                label='ID Huáº¥n luyá»‡n viÃªn'
                value={filterParams.CoachId || ''}
                onChange={e => handleFilterChange({ CoachId: e.target.value || undefined })}
                placeholder='Nháº­p ID huáº¥n luyá»‡n viÃªn...'
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                fullWidth
                label='NÄƒm'
                type='number'
                value={filterParams.Year || ''}
                onChange={e => handleFilterChange({ Year: e.target.value ? parseInt(e.target.value) : undefined })}
                placeholder='Nháº­p nÄƒm...'
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                fullWidth
                label='ThÃ¡ng'
                type='number'
                value={filterParams.Month || ''}
                onChange={e => handleFilterChange({ Month: e.target.value ? parseInt(e.target.value) : undefined })}
                placeholder='Nháº­p thÃ¡ng...'
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
                XÃ³a bá»™ lá»c
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
                ChÆ°a cÃ³ báº£ng lÆ°Æ¡ng nÃ o
              </Typography>
            </Box>
          )}
        </div>
      </Card>

      {/* Generate Payroll Dialog */}
      <Dialog open={generatePayrollOpen} onClose={() => setGeneratePayrollOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>Táº¡o báº£ng lÆ°Æ¡ng</DialogTitle>
        <DialogContent>
          <Box className='flex flex-col gap-4 pt-4'>
            <TextField
              fullWidth
              label='ID Huáº¥n luyá»‡n viÃªn'
              value={coachId}
              onChange={e => setCoachId(e.target.value)}
              required
            />
            <TextField
              fullWidth
              label='NÄƒm'
              type='number'
              value={year}
              onChange={e => setYear(parseInt(e.target.value))}
              required
            />
            <FormControl fullWidth>
              <InputLabel>ThÃ¡ng</InputLabel>
              <Select value={month} label='ThÃ¡ng' onChange={e => setMonth(e.target.value as number)}>
                {Array.from({ length: 12 }, (_, i) => (
                  <MenuItem key={i + 1} value={i + 1}>
                    ThÃ¡ng {i + 1}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGeneratePayrollOpen(false)}>Há»§y</Button>
          <Button onClick={handleGeneratePayroll} variant='contained' disabled={loading || !coachId}>
            {loading ? 'Äang táº¡o...' : 'Táº¡o báº£ng lÆ°Æ¡ng'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default PayrollListTable
