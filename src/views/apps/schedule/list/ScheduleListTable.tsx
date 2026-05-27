'use client'

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
import type { ScheduleType, GetSchedulesParams } from '@/services/scheduleService'
import { fuzzyFilter } from '@/utils/tableHelpers'

// Component Imports
import AddScheduleDrawer from './AddScheduleDrawer'
import TableFilters from './TableFilters'
import EditScheduleDialog from '@/views/apps/class/list/EditScheduleDialog'

// Service Imports
import scheduleService from '@/services/scheduleService'
import branchService from '@/services/branchService'

// Context Imports
import { useNotification } from '@/contexts/notificationContext'

// Utils Imports
import { getDayName, getStatusLabel, getStatusColor } from '@/utils/constants'
import { Messages } from '@/utils/messages'

// Type Imports
import type { BranchType } from '@/services/branchService'

// Column Helper
const columnHelper = createColumnHelper<ScheduleType>()

const ScheduleListTable = ({ tableData }: { tableData?: ScheduleType[] }) => {
  // States
  const [addScheduleOpen, setAddScheduleOpen] = useState(false)
  const [editScheduleOpen, setEditScheduleOpen] = useState(false)
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleType | null>(null)
  const [branches, setBranches] = useState<BranchType[]>([])
  const [data, setData] = useState<ScheduleType[]>(tableData || [])
  const [filteredData, setFilteredData] = useState<ScheduleType[]>([])
  const [filterParams, setFilterParams] = useState<GetSchedulesParams>({})

  // Notification Hook
  const { showNotification } = useNotification()

  // Refs để tránh duplicate calls
  const showNotificationRef = useRef(showNotification)

  showNotificationRef.current = showNotification
  const dataLoadedRef = useRef(false)
  const currentFilterRef = useRef<string>('')
  const branchesLoadedRef = useRef(false)

  // Load branches - chỉ 1 lần
  useEffect(() => {
    if (branchesLoadedRef.current) return

    const loadBranches = async () => {
      try {
        branchesLoadedRef.current = true
        const response = await branchService.getBranches({})

        if (response.success && response.data) {
          setBranches(response.data)
        }
      } catch (error) {
        console.error('Error loading branches:', error)
        branchesLoadedRef.current = false
      }
    }

    loadBranches()
  }, [])

  // Handle filter change
  const handleFilterChange = useCallback((params: GetSchedulesParams) => {
    setFilterParams(params)
  }, [])

  // Load schedules when filter params change
  useEffect(() => {
    const filterKey = JSON.stringify(filterParams)

    if (dataLoadedRef.current && currentFilterRef.current === filterKey) {
      return
    }

    const loadSchedules = async () => {
      if (tableData && tableData.length > 0) return

      try {
        currentFilterRef.current = filterKey
        dataLoadedRef.current = true

        const response = await scheduleService.getSchedules(filterParams)

        if (response.success && response.data) {
          setData(response.data)
          setFilteredData(response.data)
        } else {
          showNotificationRef.current(response.message || Messages.schedule.error.load, 'error')
        }
      } catch (error) {
        console.error('Error loading schedules:', error)
        showNotificationRef.current(Messages.schedule.error.loadGeneric, 'error')
      }
    }

    loadSchedules()
  }, [filterParams, tableData])

  // Update filtered data when data changes
  useEffect(() => {
    setFilteredData(data)
  }, [data])

  // Handle delete schedule
  const handleDelete = useCallback(
    async (id: string) => {
      try {
        const response = await scheduleService.deleteSchedule(id)

        if (response.success) {
          setData(prevData => prevData.filter(schedule => schedule.id !== id))
          setFilteredData(prevData => prevData.filter(schedule => schedule.id !== id))
          showNotification(response.message || Messages.schedule.success.delete, 'success')
        } else {
          showNotification(response.message || Messages.schedule.error.delete, 'error')
        }
      } catch (error) {
        console.error('Error deleting schedule:', error)
        showNotification(Messages.schedule.error.deleteGeneric, 'error')
      }
    },
    [showNotification]
  )

  // Handle restore schedule
  const handleRestore = useCallback(
    async (id: string) => {
      try {
        const response = await scheduleService.restoreSchedule(id)

        if (response.success && response.data) {
          setData(prevData => prevData.map(schedule => (schedule.id === id ? response.data! : schedule)))
          setFilteredData(prevData => prevData.map(schedule => (schedule.id === id ? response.data! : schedule)))
          showNotification(response.message || Messages.schedule.success.restore, 'success')
        } else {
          showNotification(response.message || Messages.schedule.error.restore, 'error')
        }
      } catch (error) {
        console.error('Error restoring schedule:', error)
        showNotification(Messages.schedule.error.restoreGeneric, 'error')
      }
    },
    [showNotification]
  )

  // Handle edit schedule
  const handleEdit = useCallback((schedule: ScheduleType) => {
    setSelectedSchedule(schedule)
    setEditScheduleOpen(true)
  }, [])

  // Handle schedule updated
  const handleScheduleUpdated = useCallback((updatedSchedule: ScheduleType) => {
    setData(prevData => prevData.map(schedule => (schedule.id === updatedSchedule.id ? updatedSchedule : schedule)))
    setFilteredData(prevData =>
      prevData.map(schedule => (schedule.id === updatedSchedule.id ? updatedSchedule : schedule))
    )
    setEditScheduleOpen(false)
    setSelectedSchedule(null)
  }, [])

  // Columns
  const columns = useMemo(
    () => [
      columnHelper.accessor('class', {
        header: 'Lớp học',
        cell: ({ row }) => (
          <Typography variant='body2' className='font-medium'>
            {row.original.class.name}
          </Typography>
        )
      }),
      columnHelper.accessor('dayOfWeek', {
        header: 'Thứ',
        cell: ({ row }) => (
          <Chip label={getDayName(row.original.dayOfWeek)} color='primary' variant='tonal' size='small' />
        )
      }),
      columnHelper.accessor('startTime', {
        header: 'Giờ bắt đầu',
        cell: ({ row }) => (
          <Typography variant='body2' className='font-medium'>
            {row.original.startTime}
          </Typography>
        )
      }),
      columnHelper.accessor('endTime', {
        header: 'Giờ kết thúc',
        cell: ({ row }) => (
          <Typography variant='body2' className='font-medium'>
            {row.original.endTime}
          </Typography>
        )
      }),
      columnHelper.accessor('branch', {
        header: 'Chi nhánh',
        cell: ({ row }) => <Typography variant='body2'>{row.original.branch.name}</Typography>
      }),
      columnHelper.accessor('isActive', {
        header: 'Trạng thái',
        cell: ({ row }) => (
          <Chip
            label={getStatusLabel(row.original.isActive)}
            color={getStatusColor(row.original.isActive)}
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
            {row.original.isActive && (
              <IconButton size='small' onClick={() => handleEdit(row.original)} color='primary' title='Chỉnh sửa'>
                <i className='ri-edit-box-line text-xl' />
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
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: Math.ceil(filteredData.length / 10)
  })

  return (
    <>
      <Card>
        <CardHeader
          title='Danh sách lịch học'
          action={
            <Button variant='contained' onClick={() => setAddScheduleOpen(true)}>
              Thêm lịch học mới
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
      <AddScheduleDrawer
        open={addScheduleOpen}
        handleClose={() => setAddScheduleOpen(false)}
        scheduleData={data}
        setData={setData}
        setFilteredData={setFilteredData}
      />
      <EditScheduleDialog
        open={editScheduleOpen}
        onClose={() => {
          setEditScheduleOpen(false)
          setSelectedSchedule(null)
        }}
        schedule={selectedSchedule}
        branches={branches}
        onUpdated={handleScheduleUpdated}
      />
    </>
  )
}

export default ScheduleListTable
