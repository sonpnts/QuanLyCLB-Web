'use client'

// React Imports
import { useEffect, useState, useCallback, useMemo } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'

// Third-party Imports
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'

// Type Imports
import type { InstructorType, GetInstructorsParams } from '@/services/instructorService'

// Component Imports
import AddInstructorDrawer from './AddInstructorDrawer'
import TableFilters from './TableFilters'

// Service Imports
import instructorService from '@/services/instructorService'

// Context Imports
import { useNotification } from '@/contexts/notificationContext'

// Utils Imports
import { getInitials } from '@/utils/getInitials'

// Styled Component Imports
import CustomAvatar from '@core/components/mui/Avatar'

// Column Helper
const columnHelper = createColumnHelper<InstructorType>()

const InstructorListTable = ({ tableData }: { tableData?: InstructorType[] }) => {
  // States
  const [addInstructorOpen, setAddInstructorOpen] = useState(false)
  const [data, setData] = useState<InstructorType[]>(tableData || [])
  const [filteredData, setFilteredData] = useState<InstructorType[]>([])
  const [loading, setLoading] = useState(false)
  const [filterParams, setFilterParams] = useState<GetInstructorsParams>({})

  // Notification Hook
  const { showNotification } = useNotification()

  // Handle filter change
  const handleFilterChange = useCallback((params: GetInstructorsParams) => {
    setFilterParams(params)
  }, [])

  // Load instructors when filter params change
  useEffect(() => {
    const loadInstructors = async () => {
      try {
        setLoading(true)
        const response = await instructorService.getInstructors(filterParams)

        if (response.success && response.data) {
          setData(response.data)
          setFilteredData(response.data)
        } else {
          showNotification(response.message || 'Không thể tải danh sách huấn luyện viên.', 'error')
        }
      } catch (error) {
        console.error('Error loading instructors:', error)
        showNotification('Đã có lỗi khi tải huấn luyện viên.', 'error')
      } finally {
        setLoading(false)
      }
    }

    if (!tableData || tableData.length === 0) {
      loadInstructors()
    }
  }, [filterParams, tableData, showNotification])

  // Update filtered data when data changes
  useEffect(() => {
    setFilteredData(data)
  }, [data])

  // Handle delete instructor
  const handleDelete = useCallback(
    async (id: string) => {
      try {
        setLoading(true)
        const response = await instructorService.deleteInstructor(id)

        if (response.success) {
          setData(prevData => prevData.filter(instructor => instructor.id !== id))
          setFilteredData(prevData => prevData.filter(instructor => instructor.id !== id))
          showNotification(response.message || 'Xóa huấn luyện viên thành công.', 'success')
        } else {
          showNotification(response.message || 'Không thể xóa huấn luyện viên.', 'error')
        }
      } catch (error) {
        console.error('Error deleting instructor:', error)
        showNotification('Đã có lỗi khi xóa huấn luyện viên.', 'error')
      } finally {
        setLoading(false)
      }
    },
    [showNotification]
  )

  // Handle restore instructor
  const handleRestore = useCallback(
    async (id: string) => {
      try {
        setLoading(true)
        const response = await instructorService.restoreInstructor(id)

        if (response.success && response.data) {
          setData(prevData => prevData.map(instructor => (instructor.id === id ? response.data! : instructor)))
          setFilteredData(prevData => prevData.map(instructor => (instructor.id === id ? response.data! : instructor)))
          showNotification(response.message || 'Khôi phục huấn luyện viên thành công.', 'success')
        } else {
          showNotification(response.message || 'Không thể khôi phục huấn luyện viên.', 'error')
        }
      } catch (error) {
        console.error('Error restoring instructor:', error)
        showNotification('Đã có lỗi khi khôi phục huấn luyện viên.', 'error')
      } finally {
        setLoading(false)
      }
    },
    [showNotification]
  )

  // Columns
  const columns = useMemo(
    () => [
      columnHelper.accessor('fullName', {
        header: 'Họ tên',
        cell: ({ row }) => (
          <Box className='flex items-center gap-3'>
            <CustomAvatar skin='light' color='primary'>
              {getInitials(row.original.fullName)}
            </CustomAvatar>
            <Box className='flex flex-col'>
              <Typography className='font-medium' color='text.primary'>
                {row.original.fullName}
              </Typography>
              {row.original.email && (
                <Typography variant='body2' color='text.secondary'>
                  {row.original.email}
                </Typography>
              )}
            </Box>
          </Box>
        )
      }),
      columnHelper.accessor('phoneNumber', {
        header: 'Số điện thoại',
        cell: ({ row }) => <Typography variant='body2'>{row.original.phoneNumber || '-'}</Typography>
      }),
      columnHelper.accessor('skillLevel', {
        header: 'Trình độ',
        cell: ({ row }) => (
          <Chip label={row.original.skillLevel || 'Chưa xác định'} color='info' variant='tonal' size='small' />
        )
      }),
      columnHelper.accessor('certification', {
        header: 'Chứng chỉ',
        cell: ({ row }) => <Typography variant='body2'>{row.original.certification || '-'}</Typography>
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
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row }) => (
          <Box className='flex items-center gap-2'>
            {!row.original.isActive ? (
              <IconButton size='small' onClick={() => handleRestore(row.original.id)} color='success'>
                <i className='ri-restart-line text-xl' />
              </IconButton>
            ) : (
              <IconButton size='small' onClick={() => handleDelete(row.original.id)} color='error'>
                <i className='ri-delete-bin-7-line text-xl' />
              </IconButton>
            )}
          </Box>
        )
      })
    ],
    [data, filteredData, showNotification, setData, setLoading, handleDelete, handleRestore]
  )

  // Table
  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel()
  })

  return (
    <>
      <Card>
        <CardHeader
          title='Danh sách huấn luyện viên'
          action={
            <Button variant='contained' onClick={() => setAddInstructorOpen(true)}>
              Thêm huấn luyện viên mới
            </Button>
          }
        />
        <TableFilters onFilterChange={handleFilterChange} />
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
      </Card>
      <AddInstructorDrawer
        open={addInstructorOpen}
        handleClose={() => setAddInstructorOpen(false)}
        instructorData={data}
        setData={setData}
        setFilteredData={setFilteredData}
      />
    </>
  )
}

export default InstructorListTable
