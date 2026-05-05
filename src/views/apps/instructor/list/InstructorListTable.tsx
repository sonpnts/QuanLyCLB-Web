'use client'
import { logger } from '@/utils/logger'

// React Imports
import { useEffect, useState, useCallback, useMemo, useRef } from 'react'

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
import { fuzzyFilter } from '@/utils/tableHelpers'
// Component Imports
import AddInstructorDrawer from './AddInstructorDrawer'
import EditInstructorDrawer from './EditInstructorDrawer'
import TableFilters from './TableFilters'

// Service Imports
import instructorService from '@/services/instructorService'

// Context Imports
import { useNotification } from '@/contexts/notificationContext'

// Utils Imports
import { getInitials } from '@/utils/getInitials'
import { exportToExcel, formatBool } from '@/utils/exportToExcel'

// Styled Component Imports
import CustomAvatar from '@core/components/mui/Avatar'

// Column Helper
const columnHelper = createColumnHelper<InstructorType>()

const InstructorListTable = ({ tableData }: { tableData?: InstructorType[] }) => {
  // States
  const [addInstructorOpen, setAddInstructorOpen] = useState(false)
  const [editInstructorOpen, setEditInstructorOpen] = useState(false)
  const [selectedInstructor, setSelectedInstructor] = useState<InstructorType | null>(null)
  const [data, setData] = useState<InstructorType[]>(tableData || [])
  const [filteredData, setFilteredData] = useState<InstructorType[]>([])
  const [filterParams, setFilterParams] = useState<GetInstructorsParams>({})

  // Notification Hook
  const { showNotification } = useNotification()

  // Refs để tránh duplicate calls
  const showNotificationRef = useRef(showNotification)
  showNotificationRef.current = showNotification
  const dataLoadedRef = useRef(false)
  const currentFilterRef = useRef<string>('')

  // Handle filter change
  const handleFilterChange = useCallback((params: GetInstructorsParams) => {
    setFilterParams(params)
  }, [])

  // Load instructors when filter params change
  useEffect(() => {
    const filterKey = JSON.stringify(filterParams)

    if (dataLoadedRef.current && currentFilterRef.current === filterKey) {
      return
    }

    const loadInstructors = async () => {
      if (tableData && tableData.length > 0) return

      try {
        currentFilterRef.current = filterKey
        dataLoadedRef.current = true

        const response = await instructorService.getInstructors(filterParams)

        if (response.success && response.data) {
          setData(response.data)
          setFilteredData(response.data)
        } else {
          showNotificationRef.current(response.message || 'Không thể tải danh sách huấn luyện viên.', 'error')
        }
      } catch (error) {
        logger.error('InstructorListTable', 'Error loading instructors', error)
        showNotificationRef.current('Đã có lỗi khi tải huấn luyện viên.', 'error')
      }
    }

    loadInstructors()
  }, [filterParams, tableData])

  // Update filtered data when data changes
  useEffect(() => {
    setFilteredData(data)
  }, [data])

  // Handle edit instructor
  const handleEdit = useCallback((instructor: InstructorType) => {
    setSelectedInstructor(instructor)
    setEditInstructorOpen(true)
  }, [])

  // Handle update after edit
  const handleUpdated = useCallback((updated: InstructorType) => {
    setData(prev => prev.map(i => (i.id === updated.id ? updated : i)))
    setFilteredData(prev => prev.map(i => (i.id === updated.id ? updated : i)))
  }, [])

  // Handle delete instructor
  const handleDelete = useCallback(async (id: string) => {
    try {
      const response = await instructorService.deleteInstructor(id)

      if (response.success) {
        setData(prevData => prevData.filter(instructor => instructor.id !== id))
        setFilteredData(prevData => prevData.filter(instructor => instructor.id !== id))
        showNotificationRef.current(response.message || 'Xóa huấn luyện viên thành công.', 'success')
      } else {
        showNotificationRef.current(response.message || 'Không thể xóa huấn luyện viên.', 'error')
      }
    } catch (error) {
      logger.error('InstructorListTable', 'Error deleting instructor', error)
      showNotificationRef.current('Đã có lỗi khi xóa huấn luyện viên.', 'error')
    }
  }, [])

  // Handle restore instructor
  const handleRestore = useCallback(async (id: string) => {
    try {
      const response = await instructorService.restoreInstructor(id)

      if (response.success && response.data) {
        setData(prevData => prevData.map(instructor => (instructor.id === id ? response.data! : instructor)))
        setFilteredData(prevData => prevData.map(instructor => (instructor.id === id ? response.data! : instructor)))
        showNotificationRef.current(response.message || 'Khôi phục huấn luyện viên thành công.', 'success')
      } else {
        showNotificationRef.current(response.message || 'Không thể khôi phục huấn luyện viên.', 'error')
      }
    } catch (error) {
      logger.error('InstructorListTable', 'Error restoring instructor', error)
      showNotificationRef.current('Đã có lỗi khi khôi phục huấn luyện viên.', 'error')
    }
  }, [])

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
      columnHelper.accessor('memberCode', {
        header: 'Mã HV',
        cell: ({ row }) => <Typography variant='body2'>{row.original.memberCode || '-'}</Typography>
      }),
      columnHelper.accessor('skillLevelName', {
        header: 'Cấp đai',
        cell: ({ row }) => (
          <Chip label={row.original.federationBeltRank || 'Chưa xác định'} color='info' variant='tonal' size='small' />
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
          <Box className='flex items-center gap-1'>
            {row.original.isActive && (
              <IconButton size='small' onClick={() => handleEdit(row.original)} color='primary' title='Chỉnh sửa'>
                <i className='ri-edit-line text-xl' />
              </IconButton>
            )}
            {!row.original.isActive ? (
              <IconButton size='small' onClick={() => handleRestore(row.original.id)} color='success' title='Khôi phục'>
                <i className='ri-restart-line text-xl' />
              </IconButton>
            ) : (
              <IconButton size='small' onClick={() => handleDelete(row.original.id)} color='error' title='Xóa'>
                <i className='ri-delete-bin-7-line text-xl' />
              </IconButton>
            )}
          </Box>
        )
      })
    ],
    [handleDelete, handleRestore, handleEdit]
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
          title='Danh sách huấn luyện viên'
          action={
            <div className='flex gap-2'>
              <Button
                variant='outlined'
                color='success'
                startIcon={<i className='ri-file-excel-2-line' />}
                disabled={filteredData.length === 0}
                onClick={() => {
                  exportToExcel({
                    filename: 'danh-sach-huan-luyen-vien',
                    rows: filteredData,
                    columns: [
                      { header: 'Họ và tên', accessor: 'fullName' as any },
                      { header: 'Email', accessor: 'email' as any },
                      { header: 'Số điện thoại', accessor: 'phoneNumber' as any },
                      { header: 'Cấp đai / Trình độ', accessor: 'skillLevel' as any },
                      { header: 'Chứng chỉ', accessor: 'certification' as any },
                      { header: 'Hoạt động', accessor: 'isActive' as any, formatter: v => formatBool(v, 'Có', 'Không') }
                    ]
                  })
                }}
              >
                Xuất Excel
              </Button>
              <Button variant='contained' onClick={() => setAddInstructorOpen(true)}>
                Thêm huấn luyện viên mới
              </Button>
            </div>
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
      <EditInstructorDrawer
        open={editInstructorOpen}
        instructor={selectedInstructor}
        handleClose={() => {
          setEditInstructorOpen(false)
          setSelectedInstructor(null)
        }}
        onUpdated={handleUpdated}
      />
    </>
  )
}

export default InstructorListTable
