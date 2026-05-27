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
import type { FilterFn } from '@tanstack/react-table'

import { logger } from '@/utils/logger'

// Type Imports
import type { BranchType, GetBranchesParams } from '@/services/branchService'

// Component Imports
import AddBranchDrawer from './AddBranchDrawer'
import EditBranchDrawer from './EditBranchDrawer'
import TableFilters from './TableFilters'

// Service Imports
import branchService from '@/services/branchService'

// Context Imports
import { useNotification } from '@/contexts/notificationContext'

// Utils Imports
import { getInitials } from '@/utils/getInitials'

// Styled Component Imports
import CustomAvatar from '@core/components/mui/Avatar'

// Column Helper
const columnHelper = createColumnHelper<BranchType>()

const BranchListTable = ({ tableData }: { tableData?: BranchType[] }) => {
  // States
  const [addBranchOpen, setAddBranchOpen] = useState(false)
  const [editBranchOpen, setEditBranchOpen] = useState(false)
  const [selectedBranch, setSelectedBranch] = useState<BranchType | null>(null)
  const [data, setData] = useState<BranchType[]>(tableData || [])
  const [filteredData, setFilteredData] = useState<BranchType[]>([])
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_loading, setLoading] = useState(false)
  const [filterParams, setFilterParams] = useState<GetBranchesParams>({})

  // Notification Hook
  const { showNotification } = useNotification()

  // Refs để tránh duplicate calls
  const showNotificationRef = useRef(showNotification)

  showNotificationRef.current = showNotification
  const dataLoadedRef = useRef(false)
  const currentFilterRef = useRef<string>('')

  // Handle filter change
  const handleFilterChange = useCallback((params: GetBranchesParams) => {
    setFilterParams(params)
  }, [])

  // Load branches when filter params change
  useEffect(() => {
    const filterKey = JSON.stringify(filterParams)

    if (dataLoadedRef.current && currentFilterRef.current === filterKey) {
      return
    }

    const loadBranches = async () => {
      if (tableData && tableData.length > 0) return

      try {
        setLoading(true)
        currentFilterRef.current = filterKey
        dataLoadedRef.current = true

        const response = await branchService.getBranches(filterParams)

        setData(response.data || [])
        setFilteredData(response.data || [])
      } catch {
        setData([])
        setFilteredData([])
      } finally {
        setLoading(false)
      }
    }

    loadBranches()
  }, [filterParams, tableData])

  // Update filtered data when data changes
  useEffect(() => {
    setFilteredData(data)
  }, [data])

  // Handle delete branch
  const handleDelete = useCallback(
    async (id: string) => {
      try {
        setLoading(true)
        const response = await branchService.deleteBranch(id)

        if (response.success) {
          setData(prevData => prevData.filter(branch => branch.id !== id))
          setFilteredData(prevData => prevData.filter(branch => branch.id !== id))
          showNotification(response.message || 'Xóa chi nhánh thành công.', 'success')
        } else {
          showNotification(response.message || 'Không thể xóa chi nhánh.', 'error')
        }
      } catch (error) {
        logger.error('BranchListTable', 'Error deleting branch', error)
        showNotification('Đã có lỗi khi xóa chi nhánh.', 'error')
      } finally {
        setLoading(false)
      }
    },
    [showNotification]
  )

  // Handle restore branch
  const handleRestore = useCallback(
    async (id: string) => {
      try {
        setLoading(true)
        const response = await branchService.restoreBranch(id)

        if (response.success && response.data) {
          setData(prevData => prevData.map(branch => (branch.id === id ? response.data! : branch)))
          setFilteredData(prevData => prevData.map(branch => (branch.id === id ? response.data! : branch)))
          showNotification(response.message || 'Khôi phục chi nhánh thành công.', 'success')
        } else {
          showNotification(response.message || 'Không thể khôi phục chi nhánh.', 'error')
        }
      } catch (error) {
        logger.error('BranchListTable', 'Error restoring branch', error)
        showNotification('Đã có lỗi khi khôi phục chi nhánh.', 'error')
      } finally {
        setLoading(false)
      }
    },
    [showNotification]
  )

  // Handle Edit branch
  const handleEdit = useCallback((branch: BranchType) => {
    setSelectedBranch(branch)
    setEditBranchOpen(true)
  }, [])

  // Columns
  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: 'Tên chi nhánh',
        cell: ({ row }) => (
          <Box className='flex items-center gap-3'>
            <CustomAvatar skin='light' color='primary'>
              {getInitials(row.original.name)}
            </CustomAvatar>
            <Box className='flex flex-col'>
              <Typography className='font-medium' color='text.primary'>
                {row.original.name}
              </Typography>
              {row.original.address && (
                <Typography variant='body2' color='text.secondary'>
                  {row.original.address}
                </Typography>
              )}
            </Box>
          </Box>
        )
      }),
      columnHelper.accessor('latitude', {
        header: 'Vĩ độ',
        cell: ({ row }) => <Typography variant='body2'>{row.original.latitude}</Typography>
      }),
      columnHelper.accessor('longitude', {
        header: 'Kinh độ',
        cell: ({ row }) => <Typography variant='body2'>{row.original.longitude}</Typography>
      }),
      columnHelper.accessor('allowedRadiusMeters', {
        header: 'Bán kính (m)',
        cell: ({ row }) => <Typography variant='body2'>{row.original.allowedRadiusMeters}</Typography>
      }),
      columnHelper.accessor('tuitionFee', {
        header: 'Học phí',
        cell: ({ row }) => (
          <Typography variant='body2'>
            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(row.original.tuitionFee || 0)}
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
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row }) => (
          <Box className='flex items-center gap-2'>
            <IconButton size='small' onClick={() => handleEdit(row.original)} color='primary'>
              <i className='ri-edit-line text-xl' />
            </IconButton>
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
    [data, filteredData, showNotification, setData, setLoading, handleDelete, handleRestore, handleEdit]
  )

  // Table
  const fuzzyFilter: FilterFn<any> = () => true

  const table = useReactTable({
    data: filteredData,
    columns,
    filterFns: {
      fuzzy: fuzzyFilter
    },
    getCoreRowModel: getCoreRowModel()
  })

  return (
    <>
      <Card>
        <CardHeader
          title='Danh sách chi nhánh'
          action={
            <Button variant='contained' onClick={() => setAddBranchOpen(true)}>
              Thêm chi nhánh mới
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
      <AddBranchDrawer
        open={addBranchOpen}
        handleClose={() => setAddBranchOpen(false)}
        branchData={data}
        setData={setData}
        setFilteredData={setFilteredData}
      />
      <EditBranchDrawer
        open={editBranchOpen}
        handleClose={() => {
          setEditBranchOpen(false)
          setSelectedBranch(null)
        }}
        selectedBranch={selectedBranch}
        setData={setData}
        setFilteredData={setFilteredData}
      />
    </>
  )
}

export default BranchListTable
