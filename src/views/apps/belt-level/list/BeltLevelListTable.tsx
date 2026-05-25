'use client'
import { logger } from '@/utils/logger'

import { useEffect, useState, useCallback, useMemo, useRef } from 'react'

import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import TablePagination from '@mui/material/TablePagination'

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel
} from '@tanstack/react-table'
import type { FilterFn } from '@tanstack/react-table'

import type { BeltLevelType } from '@/types/apps/beltExamTypes'

import AddBeltLevelDrawer from './AddBeltLevelDrawer'
import EditBeltLevelDrawer from './EditBeltLevelDrawer'

import beltLevelService from '@/services/beltLevelService'

import { useNotification } from '@/contexts/notificationContext'
import useConfirmAction from '@/hooks/useConfirmAction'

const columnHelper = createColumnHelper<BeltLevelType>()

const BeltLevelListTable = () => {
  const [addDrawerOpen, setAddDrawerOpen] = useState(false)
  const [editDrawerOpen, setEditDrawerOpen] = useState(false)
  const [selectedBeltLevel, setSelectedBeltLevel] = useState<BeltLevelType | null>(null)
  const [data, setData] = useState<BeltLevelType[]>([])
  const [loading, setLoading] = useState(false)
  const [keyword, setKeyword] = useState('')

  const { showNotification } = useNotification()
  const { confirm, confirmDialog } = useConfirmAction()

  const showNotificationRef = useRef(showNotification)
  showNotificationRef.current = showNotification
  const dataLoadedRef = useRef(false)
  const currentKeywordRef = useRef<string>('')

  useEffect(() => {
    if (dataLoadedRef.current && currentKeywordRef.current === keyword) {
      return
    }

    const loadBeltLevels = async () => {
      try {
        setLoading(true)
        currentKeywordRef.current = keyword
        dataLoadedRef.current = true

        const response = await beltLevelService.getBeltLevels({ keyword: keyword || undefined })
        const sorted = [...(response.data || [])].sort((a, b) => (a.order || 0) - (b.order || 0))
        setData(sorted)
      } catch {
        setData([])
      } finally {
        setLoading(false)
      }
    }

    loadBeltLevels()
  }, [keyword])

  const handleDelete = useCallback(async (id: string) => {
    const confirmed = await confirm({
      title: 'Xác nhận xóa cấp đai',
      description: 'Bạn có chắc chắn muốn xóa cấp đai này?',
      confirmText: 'Xóa'
    })

    if (!confirmed) return

    try {
      setLoading(true)
      const response = await beltLevelService.deleteBeltLevel(id)

      if (response.success) {
        setData(prev => prev.filter(item => item.id !== id))
        showNotificationRef.current(response.message || 'Xóa cấp đai thành công.', 'success')
      } else {
        showNotificationRef.current(response.message || 'Không thể xóa cấp đai.', 'error')
      }
    } catch (error) {
      logger.error('BeltLevelListTable', 'Error deleting belt level', error)
      showNotificationRef.current('Đã có lỗi khi xóa cấp đai.', 'error')
    } finally {
      setLoading(false)
    }
  }, [confirm])

  const handleEdit = useCallback((beltLevel: BeltLevelType) => {
    setSelectedBeltLevel(beltLevel)
    setEditDrawerOpen(true)
  }, [])

  const handleBeltLevelUpdated = useCallback((updated: BeltLevelType) => {
    setData(prev => {
      const newData = prev.map(item => (item.id === updated.id ? updated : item))
      return newData.sort((a, b) => (a.order || 0) - (b.order || 0))
    })
  }, [])

  const handleBeltLevelAdded = useCallback((newBeltLevel: BeltLevelType) => {
    setData(prev => {
      const newData = [...prev, newBeltLevel]
      return newData.sort((a, b) => (a.order || 0) - (b.order || 0))
    })
  }, [])

  const columns = useMemo(
    () => [
      columnHelper.accessor('order', {
        header: 'Thứ tự',
        cell: ({ row }) => {
          const order = row.original.order || 0
          if (order > 10) {
            return <Chip label={`${order - 10} Đẳng`} size='small' color='warning' variant='tonal' />
          }
          return <Chip label={`Cấp ${order}`} size='small' color='primary' variant='tonal' />
        }
      }),
      columnHelper.accessor('name', {
        header: 'Tên cấp đai',
        cell: ({ row }) => (
          <Box className='flex items-center gap-3'>
            <Typography className='font-medium' color='text.primary'>
              {row.original.name}
            </Typography>
          </Box>
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
            <IconButton size='small' onClick={() => handleDelete(row.original.id)} color='error'>
              <i className='ri-delete-bin-7-line text-xl' />
            </IconButton>
          </Box>
        )
      })
    ],
    [handleDelete, handleEdit]
  )

  const fuzzyFilter: FilterFn<any> = () => true

  const table = useReactTable({
    data,
    columns,
    filterFns: {
      fuzzy: fuzzyFilter
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 10 }
    }
  })

  return (
    <>
      <Card>
        <CardHeader
          title='Quản lý cấp đai'
          action={
            <Button variant='contained' onClick={() => setAddDrawerOpen(true)}>
              Thêm cấp đai mới
            </Button>
          }
        />
        <Box className='p-4'>
          <TextField
            size='small'
            placeholder='Tìm kiếm cấp đai...'
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            sx={{ width: 300 }}
          />
        </Box>
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
              {loading ? (
                <tr>
                  <td colSpan={columns.length} className='p-4 text-center'>
                    Đang tải...
                  </td>
                </tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className='p-4 text-center'>
                    Không có dữ liệu
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map(row => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className='p-4'>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <TablePagination
          component='div'
          count={table.getPrePaginationRowModel().rows.length}
          page={table.getState().pagination.pageIndex}
          onPageChange={(_, page) => table.setPageIndex(page)}
          rowsPerPage={table.getState().pagination.pageSize}
          onRowsPerPageChange={event => table.setPageSize(Number(event.target.value))}
          rowsPerPageOptions={[10, 25, 50]}
        />
      </Card>
      <AddBeltLevelDrawer open={addDrawerOpen} onClose={() => setAddDrawerOpen(false)} onAdded={handleBeltLevelAdded} />
      <EditBeltLevelDrawer
        open={editDrawerOpen}
        onClose={() => {
          setEditDrawerOpen(false)
          setSelectedBeltLevel(null)
        }}
        beltLevel={selectedBeltLevel}
        onSaved={handleBeltLevelUpdated}
      />
      {confirmDialog}
    </>
  )
}

export default BeltLevelListTable
