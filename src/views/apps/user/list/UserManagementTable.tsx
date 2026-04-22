'use client'
import { logger } from '@/utils/logger'

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
import type { FilterFn } from '@tanstack/react-table'

import type { UsersType } from '@/types/apps/userTypes'

// Type Imports
import type { GetUsersParams } from '@/services/userService'
import type { RoleType } from '@/services/roleService'

// Component Imports
import TableFilters from './TableFilters'
import AddUserDrawer from './AddUserDrawer'
import EditUserDrawer from './EditUserDrawer'

// Service Imports
import userService from '@/services/userService'
import roleService from '@/services/roleService'

// Context Imports
import { useNotification } from '@/contexts/notificationContext'

// Styled Component Imports
import CustomAvatar from '@core/components/mui/Avatar'

// Column Helper
const columnHelper = createColumnHelper<UsersType>()

const UserManagementTable = () => {
  // States
  const [addUserOpen, setAddUserOpen] = useState(false)
  const [data, setData] = useState<UsersType[]>([])
  const [filteredData, setFilteredData] = useState<UsersType[]>([])
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_loading, setLoading] = useState(false)
  const [filterParams, setFilterParams] = useState<GetUsersParams>({})
  const [roles, setRoles] = useState<RoleType[]>([])
  const [selectedUser, setSelectedUser] = useState<UsersType | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  // Notification Hook
  const { showNotification } = useNotification()

  // Handle filter change
  const handleFilterChange = useCallback((params: GetUsersParams) => {
    setFilterParams(prev => {
      const prevKey = JSON.stringify(prev || {})
      const nextKey = JSON.stringify(params || {})

      return prevKey === nextKey ? prev : params
    })
  }, [])

  // Load users when filter params change
  useEffect(() => {
    let isCancelled = false

    const loadUsers = async () => {
      try {
        setLoading(true)
        const response = await userService.getUsers(filterParams)

        // Check if request was cancelled
        if (isCancelled) return

        if (response.success && response.data) {
          setData(response.data)
          setFilteredData(response.data)
        } else {
          // Only show error if it's not a 400 (bad request from invalid input)
          if (response.message && !response.message.includes('400')) {
            showNotification(response.message || 'Không thể tải danh sách người dùng.', 'error')
          }
        }
      } catch (error: any) {
        // Check if request was cancelled
        if (isCancelled) return

        // Only show error notification if it's not a cancelled request or 400 error
        if (error?.code !== 'ERR_CANCELED' && error?.response?.status !== 400) {
          logger.error('UserManagementTable', 'Error loading users', error)
          showNotification('Đã có lỗi khi tải người dùng.', 'error')
        }
      } finally {
        if (!isCancelled) {
          setLoading(false)
        }
      }
    }

    loadUsers()

    // Cleanup function to cancel request if component unmounts or params change
    return () => {
      isCancelled = true
    }
  }, [filterParams, showNotification])

  // Load roles for filter
  useEffect(() => {
    const loadRoles = async () => {
      try {
        const response = await roleService.getRoles({})

        if (response.success && response.data) {
          const uniqueById = Array.from(new Map(response.data.map(r => [r.id, r])).values())

          setRoles(uniqueById)
        }
      } catch (error) {
        logger.error('UserManagementTable', 'Error loading roles', error)
      }
    }

    loadRoles()
  }, [])

  // Update filtered data when data changes
  useEffect(() => {
    setFilteredData(data)
  }, [data])

  // Handle delete user
  const handleDelete = useCallback(
    async (id: string) => {
      try {
        setLoading(true)
        const response = await userService.deleteUser(id)

        if (response.success) {
          setData(prevData => prevData.filter(user => user.id !== id))
          setFilteredData(prevData => prevData.filter(user => user.id !== id))
          showNotification(response.message || 'Xóa người dùng thành công.', 'success')
        } else {
          showNotification(response.message || 'Không thể xóa người dùng.', 'error')
        }
      } catch (error) {
        logger.error('UserManagementTable', 'Error deleting user', error)
        showNotification('Đã có lỗi khi xóa người dùng.', 'error')
      } finally {
        setLoading(false)
      }
    },
    [showNotification]
  )

  // Handle restore user
  const handleRestore = useCallback(
    async (id: string) => {
      try {
        setLoading(true)
        const response = await userService.restoreUser(id)

        if (response.success && response.data) {
          setData(prevData => prevData.map(user => (user.id === id ? response.data! : user)))
          setFilteredData(prevData => prevData.map(user => (user.id === id ? response.data! : user)))
          showNotification(response.message || 'Khôi phục người dùng thành công.', 'success')
        } else {
          showNotification(response.message || 'Không thể khôi phục người dùng.', 'error')
        }
      } catch (error) {
        logger.error('UserManagementTable', 'Error restoring user', error)
        showNotification('Đã có lỗi khi khôi phục người dùng.', 'error')
      } finally {
        setLoading(false)
      }
    },
    [showNotification]
  )

  // Get user type color
  const getUserTypeColor = (roleNameRaw: string) => {
    const roleName = roleNameRaw.toLowerCase()

    if (roleName.includes('admin')) return 'error'
    if (roleName.includes('coach') || roleName.includes('instructor')) return 'primary'
    if (roleName.includes('student') || roleName.includes('member')) return 'success'

    return 'default'
  }

  // Columns
  const columns = useMemo(
    () => [
      columnHelper.accessor('fullName', {
        header: 'Họ tên',
        cell: ({ row }) => (
          <Box className='flex items-center gap-3'>
            <CustomAvatar
              skin='light'
              color='primary'
              src={row.original.avatarUrl ?? 'public/images/avatars/1.png'}
            ></CustomAvatar>
            <Box className='flex flex-col'>
              <Typography className='font-medium' color='text.primary'>
                {row.original.fullName}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                {row.original.email}
              </Typography>
            </Box>
          </Box>
        )
      }),
      columnHelper.accessor('roles', {
        header: 'Vai trò',
        cell: ({ row }) => {
          const rolesArr = row.original.roles || []

          if (rolesArr.length === 0) return <Typography variant='body2'>-</Typography>

          return (
            <Box className='flex flex-wrap gap-1'>
              {rolesArr.map((r, idx) => (
                <Chip key={`${r}-${idx}`} label={r} size='small' color={getUserTypeColor(r)} variant='tonal' />
              ))}
            </Box>
          )
        }
      }),
      columnHelper.accessor('phoneNumber', {
        header: 'Liên hệ',
        cell: ({ row }) => <Typography variant='body2'>{row.original.phoneNumber || '-'}</Typography>
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
            <IconButton
              size='small'
              onClick={() => {
                setSelectedUser(row.original)
                setEditDialogOpen(true)
              }}
              color='primary'
            >
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, filteredData, showNotification, setData, setLoading, handleDelete, handleRestore]
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
          title='Quản lý người dùng'
          action={
            <Button variant='contained' onClick={() => setAddUserOpen(true)}>
              Thêm người dùng mới
            </Button>
          }
        />
        <TableFilters onFilterChange={handleFilterChange} roles={roles} />
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
      {selectedUser && (
        <EditUserDrawer
          open={editDialogOpen}
          onClose={() => {
            setEditDialogOpen(false)
            setSelectedUser(null)
          }}
          user={selectedUser}
          roles={roles}
          onSaved={updated => {
            setData(prev => prev.map(u => (u.id === updated.id ? updated : u)))
            setFilteredData(prev => prev.map(u => (u.id === updated.id ? updated : u)))
          }}
        />
      )}
      <AddUserDrawer
        open={addUserOpen}
        handleClose={() => setAddUserOpen(false)}
        userData={data}
        setData={setData}
        setFilteredData={setFilteredData}
        roles={roles}
      />
    </>
  )
}

export default UserManagementTable
