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
import TextField from '@mui/material/TextField'
import TablePagination from '@mui/material/TablePagination'

// Third-party Imports
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel
} from '@tanstack/react-table'
import type { FilterFn } from '@tanstack/react-table'

// Type Imports
import type { BeltLevelType } from '@/types/apps/beltExamTypes'

// Component Imports
import AddBeltLevelDrawer from './AddBeltLevelDrawer'
import EditBeltLevelDrawer from './EditBeltLevelDrawer'

// Service Imports
import beltLevelService from '@/services/beltLevelService'

// Context Imports
import { useNotification } from '@/contexts/notificationContext'

// Column Helper
const columnHelper = createColumnHelper<BeltLevelType>()

const BeltLevelListTable = () => {
  // States
  const [addDrawerOpen, setAddDrawerOpen] = useState(false)
  const [editDrawerOpen, setEditDrawerOpen] = useState(false)
  const [selectedBeltLevel, setSelectedBeltLevel] = useState<BeltLevelType | null>(null)
  const [data, setData] = useState<BeltLevelType[]>([])
  const [loading, setLoading] = useState(false)
  const [keyword, setKeyword] = useState('')

  // Notification Hook
  const { showNotification } = useNotification()

  // Refs Ä‘á»ƒ trÃ¡nh duplicate calls
  const showNotificationRef = useRef(showNotification)
  showNotificationRef.current = showNotification
  const dataLoadedRef = useRef(false)
  const currentKeywordRef = useRef<string>('')

  // Load belt levels
  useEffect(() => {
    // TrÃ¡nh load láº¡i náº¿u keyword khÃ´ng Ä‘á»•i
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

  // Handle delete
  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Báº¡n cÃ³ cháº¯c cháº¯n muá»‘n xÃ³a cáº¥p Ä‘ai nÃ y?')) return

    try {
      setLoading(true)
      const response = await beltLevelService.deleteBeltLevel(id)

      if (response.success) {
        setData(prev => prev.filter(item => item.id !== id))
        showNotificationRef.current(response.message || 'XÃ³a cáº¥p Ä‘ai thÃ nh cÃ´ng.', 'success')
      } else {
        showNotificationRef.current(response.message || 'KhÃ´ng thá»ƒ xÃ³a cáº¥p Ä‘ai.', 'error')
      }
    } catch (error) {
      logger.error('BeltLevelListTable', 'Error deleting belt level', error)
      showNotificationRef.current('ÄÃ£ cÃ³ lá»—i khi xÃ³a cáº¥p Ä‘ai.', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  // Handle edit
  const handleEdit = useCallback((beltLevel: BeltLevelType) => {
    setSelectedBeltLevel(beltLevel)
    setEditDrawerOpen(true)
  }, [])

  // Handle belt level updated
  const handleBeltLevelUpdated = useCallback((updated: BeltLevelType) => {
    setData(prev => {
      const newData = prev.map(item => (item.id === updated.id ? updated : item))

      return newData.sort((a, b) => (a.order || 0) - (b.order || 0))
    })
  }, [])

  // Handle belt level added
  const handleBeltLevelAdded = useCallback((newBeltLevel: BeltLevelType) => {
    setData(prev => {
      const newData = [...prev, newBeltLevel]

      return newData.sort((a, b) => (a.order || 0) - (b.order || 0))
    })
  }, [])

  // Columns
  const columns = useMemo(
    () => [
      columnHelper.accessor('order', {
        header: 'Cáº¥p',
        cell: ({ row }) => <Chip label={row.original.order} size='small' color='primary' variant='tonal' />
      }),
      columnHelper.accessor('name', {
        header: 'TÃªn cáº¥p Ä‘ai',
        cell: ({ row }) => (
          <Box className='flex items-center gap-3'>
            <Box
              sx={{
                width: 24,
                height: 24,
                borderRadius: '4px',
                backgroundColor: row.original.colorCode || '#ccc',
                border: '1px solid #ddd'
              }}
            />
            <Typography className='font-medium' color='text.primary'>
              {row.original.name}
            </Typography>
          </Box>
        )
      }),
      columnHelper.accessor('description', {
        header: 'MÃ´ táº£',
        cell: ({ row }) => (
          <Typography variant='body2' color='text.secondary'>
            {row.original.description || '-'}
          </Typography>
        )
      }),
      columnHelper.accessor('colorCode', {
        header: 'MÃ u sáº¯c',
        cell: ({ row }) => (
          <Box className='flex items-center gap-2'>
            <Box
              sx={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                backgroundColor: row.original.colorCode || '#ccc',
                border: '1px solid #ddd'
              }}
            />
            <Typography variant='body2'>{row.original.colorCode || '-'}</Typography>
          </Box>
        )
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Thao tÃ¡c',
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

  // Table
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
          title='Quáº£n lÃ½ cáº¥p Ä‘ai'
          action={
            <Button variant='contained' onClick={() => setAddDrawerOpen(true)}>
              ThÃªm cáº¥p Ä‘ai má»›i
            </Button>
          }
        />
        <Box className='p-4'>
          <TextField
            size='small'
            placeholder='TÃ¬m kiáº¿m cáº¥p Ä‘ai...'
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
                    Äang táº£i...
                  </td>
                </tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className='p-4 text-center'>
                    KhÃ´ng cÃ³ dá»¯ liá»‡u
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map(row => (
                  <tr key={row.id} className='border-t'>
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
          rowsPerPageOptions={[10, 25, 50]}
          component='div'
          count={data.length}
          rowsPerPage={table.getState().pagination.pageSize}
          page={table.getState().pagination.pageIndex}
          onPageChange={(_, page) => table.setPageIndex(page)}
          onRowsPerPageChange={e => table.setPageSize(Number(e.target.value))}
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
    </>
  )
}

export default BeltLevelListTable
