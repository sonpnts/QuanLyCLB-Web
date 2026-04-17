'use client'

// React Imports
import { logger } from '@/utils/logger'
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
  const [filterParams, setFilterParams] = useState<GetInstructorsParams>({})

  // Notification Hook
  const { showNotification } = useNotification()

  // Refs Ä‘á»ƒ trÃ¡nh duplicate calls
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
          showNotificationRef.current(response.message || 'KhÃ´ng thá»ƒ táº£i danh sÃ¡ch huáº¥n luyá»‡n viÃªn.', 'error')
        }
      } catch (error) {
        logger.error('InstructorListTable', 'Error loading instructors', error)
        showNotificationRef.current('ÄÃ£ cÃ³ lá»—i khi táº£i huáº¥n luyá»‡n viÃªn.', 'error')
      }
    }

    loadInstructors()
  }, [filterParams, tableData])

  // Update filtered data when data changes
  useEffect(() => {
    setFilteredData(data)
  }, [data])

  // Handle delete instructor
  const handleDelete = useCallback(async (id: string) => {
    try {
      const response = await instructorService.deleteInstructor(id)

      if (response.success) {
        setData(prevData => prevData.filter(instructor => instructor.id !== id))
        setFilteredData(prevData => prevData.filter(instructor => instructor.id !== id))
        showNotificationRef.current(response.message || 'XÃ³a huáº¥n luyá»‡n viÃªn thÃ nh cÃ´ng.', 'success')
      } else {
        showNotificationRef.current(response.message || 'KhÃ´ng thá»ƒ xÃ³a huáº¥n luyá»‡n viÃªn.', 'error')
      }
    } catch (error) {
      logger.error('InstructorListTable', 'Error deleting instructor', error)
      showNotificationRef.current('ÄÃ£ cÃ³ lá»—i khi xÃ³a huáº¥n luyá»‡n viÃªn.', 'error')
    }
  }, [])

  // Handle restore instructor
  const handleRestore = useCallback(async (id: string) => {
    try {
      const response = await instructorService.restoreInstructor(id)

      if (response.success && response.data) {
        setData(prevData => prevData.map(instructor => (instructor.id === id ? response.data! : instructor)))
        setFilteredData(prevData => prevData.map(instructor => (instructor.id === id ? response.data! : instructor)))
        showNotificationRef.current(response.message || 'KhÃ´i phá»¥c huáº¥n luyá»‡n viÃªn thÃ nh cÃ´ng.', 'success')
      } else {
        showNotificationRef.current(response.message || 'KhÃ´ng thá»ƒ khÃ´i phá»¥c huáº¥n luyá»‡n viÃªn.', 'error')
      }
    } catch (error) {
      logger.error('InstructorListTable', 'Error restoring instructor', error)
      showNotificationRef.current('ÄÃ£ cÃ³ lá»—i khi khÃ´i phá»¥c huáº¥n luyá»‡n viÃªn.', 'error')
    }
  }, [])

  // Columns
  const columns = useMemo(
    () => [
      columnHelper.accessor('fullName', {
        header: 'Há» tÃªn',
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
        header: 'Sá»‘ Ä‘iá»‡n thoáº¡i',
        cell: ({ row }) => <Typography variant='body2'>{row.original.phoneNumber || '-'}</Typography>
      }),
      columnHelper.accessor('skillLevel', {
        header: 'TrÃ¬nh Ä‘á»™',
        cell: ({ row }) => (
          <Chip label={row.original.skillLevel || 'ChÆ°a xÃ¡c Ä‘á»‹nh'} color='info' variant='tonal' size='small' />
        )
      }),
      columnHelper.accessor('certification', {
        header: 'Chá»©ng chá»‰',
        cell: ({ row }) => <Typography variant='body2'>{row.original.certification || '-'}</Typography>
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
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Thao tÃ¡c',
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
    [handleDelete, handleRestore]
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
          title='Danh sÃ¡ch huáº¥n luyá»‡n viÃªn'
          action={
            <Button variant='contained' onClick={() => setAddInstructorOpen(true)}>
              ThÃªm huáº¥n luyá»‡n viÃªn má»›i
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
