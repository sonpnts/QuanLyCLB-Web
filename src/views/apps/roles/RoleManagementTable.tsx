'use client'

// React Imports
import { logger } from '@/utils/logger'
import { useEffect, useState, useMemo } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import Grid from '@mui/material/Grid2'

// Third-party Imports
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import type { FilterFn } from '@tanstack/react-table'

// Type Imports
import type { RoleType, GetRolesParams } from '@/services/roleService'

// Service Imports
import roleService from '@/services/roleService'

// Context Imports
import { useNotification } from '@/contexts/notificationContext'

// Column Helper
const columnHelper = createColumnHelper<RoleType>()

const RoleManagementTable = () => {
  // States
  const [data, setData] = useState<RoleType[]>([])
  const [filteredData, setFilteredData] = useState<RoleType[]>([])
  const [loading, setLoading] = useState(false)
  const [filterParams, setFilterParams] = useState<GetRolesParams>({})
  const [addRoleOpen, setAddRoleOpen] = useState(false)
  const [editRoleOpen, setEditRoleOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<RoleType | null>(null)

  // Form states
  const [roleName, setRoleName] = useState('')
  const [roleDescription, setRoleDescription] = useState('')
  const [keyword, setKeyword] = useState('')

  // Notification Hook
  const { showNotification } = useNotification()

  // Load roles
  useEffect(() => {
    const loadRoles = async () => {
      try {
        setLoading(true)
        const response = await roleService.getRoles(filterParams)

        if (response.success && response.data) {
          setData(response.data)
          setFilteredData(response.data)
        } else {
          showNotification(response.message || 'KhÃ´ng thá»ƒ táº£i danh sÃ¡ch vai trÃ².', 'error')
        }
      } catch (error) {
        logger.error('RoleManagementTable', 'Error loading roles', error)
        showNotification('ÄÃ£ cÃ³ lá»—i khi táº£i vai trÃ².', 'error')
      } finally {
        setLoading(false)
      }
    }

    loadRoles()
  }, [filterParams, showNotification])

  // Handle filter change
  const handleFilterChange = (newParams: Partial<GetRolesParams>) => {
    setFilterParams(prev => ({ ...prev, ...newParams }))
  }

  // Handle create role
  const handleCreateRole = async () => {
    try {
      setLoading(true)

      const response = await roleService.createRole({
        name: roleName,
        description: roleDescription || undefined
      })

      if (response.success && response.data) {
        setData([response.data, ...data])
        setFilteredData([response.data, ...data])
        showNotification('Táº¡o vai trÃ² thÃ nh cÃ´ng.', 'success')
        setAddRoleOpen(false)
        setRoleName('')
        setRoleDescription('')
      } else {
        showNotification(response.message || 'KhÃ´ng thá»ƒ táº¡o vai trÃ².', 'error')
      }
    } catch (error) {
      logger.error('RoleManagementTable', 'Error creating role', error)
      showNotification('ÄÃ£ cÃ³ lá»—i khi táº¡o vai trÃ².', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Handle update role
  const handleUpdateRole = async () => {
    if (!selectedRole) return

    try {
      setLoading(true)

      const response = await roleService.updateRole(selectedRole.id, {
        name: roleName,
        description: roleDescription || undefined
      })

      if (response.success && response.data) {
        setData(prevData => prevData.map(role => (role.id === selectedRole.id ? response.data! : role)))
        setFilteredData(prevData => prevData.map(role => (role.id === selectedRole.id ? response.data! : role)))
        showNotification('Cáº­p nháº­t vai trÃ² thÃ nh cÃ´ng.', 'success')
        setEditRoleOpen(false)
        setSelectedRole(null)
        setRoleName('')
        setRoleDescription('')
      } else {
        showNotification(response.message || 'KhÃ´ng thá»ƒ cáº­p nháº­t vai trÃ².', 'error')
      }
    } catch (error) {
      logger.error('RoleManagementTable', 'Error updating role', error)
      showNotification('ÄÃ£ cÃ³ lá»—i khi cáº­p nháº­t vai trÃ².', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Handle delete role
  const handleDeleteRole = async (id: string) => {
    try {
      setLoading(true)
      const response = await roleService.deleteRole(id)

      if (response.success) {
        setData(prevData => prevData.filter(role => role.id !== id))
        setFilteredData(prevData => prevData.filter(role => role.id !== id))
        showNotification('XÃ³a vai trÃ² thÃ nh cÃ´ng.', 'success')
      } else {
        showNotification(response.message || 'KhÃ´ng thá»ƒ xÃ³a vai trÃ².', 'error')
      }
    } catch (error) {
      logger.error('RoleManagementTable', 'Error deleting role', error)
      showNotification('ÄÃ£ cÃ³ lá»—i khi xÃ³a vai trÃ².', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Roles do not support restore (no soft-delete)
  const handleRestoreRole = (_id: string) => {
    showNotification('Vai trÃ² khÃ´ng há»— trá»£ khÃ´i phá»¥c.', 'warning')
  }

  // Handle edit role
  const handleEditRole = (role: RoleType) => {
    setSelectedRole(role)
    setRoleName(role.name)
    setRoleDescription(role.description || '')
    setEditRoleOpen(true)
  }

  // Columns
  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: 'TÃªn vai trÃ²',
        cell: ({ row }) => (
          <Typography variant='body2' className='font-medium'>
            {row.original.name}
          </Typography>
        )
      }),
      columnHelper.accessor('description', {
        header: 'MÃ´ táº£',
        cell: ({ row }) => <Typography variant='body2'>{row.original.description || '-'}</Typography>
      }),
      columnHelper.accessor('permissions', {
        header: 'Quyá»n',
        cell: ({ row }) => (
          <Box className='flex flex-wrap gap-1'>
            {row.original.permissions && row.original.permissions.length > 0 ? (
              row.original.permissions.map((permission, index) => (
                <Chip key={index} label={permission} size='small' color='info' variant='tonal' />
              ))
            ) : (
              <Typography variant='body2' color='text.secondary'>
                -
              </Typography>
            )}
          </Box>
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
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Thao tÃ¡c',
        cell: ({ row }) => (
          <Box className='flex items-center gap-2'>
            <IconButton size='small' onClick={() => handleEditRole(row.original)} color='primary'>
              <i className='ri-edit-line text-xl' />
            </IconButton>
            {!row.original.isActive ? (
              <IconButton size='small' onClick={() => handleRestoreRole(row.original.id)} color='success'>
                <i className='ri-restart-line text-xl' />
              </IconButton>
            ) : (
              <IconButton size='small' onClick={() => handleDeleteRole(row.original.id)} color='error'>
                <i className='ri-delete-bin-7-line text-xl' />
              </IconButton>
            )}
          </Box>
        )
      })
    ],
    [data, filteredData, showNotification, setData, setLoading, handleDeleteRole, handleRestoreRole]
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
          title='Quáº£n lÃ½ vai trÃ²'
          action={
            <Button variant='contained' onClick={() => setAddRoleOpen(true)}>
              ThÃªm vai trÃ² má»›i
            </Button>
          }
        />
        <div className='p-5'>
          <Grid container spacing={4} className='mb-4'>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField
                fullWidth
                label='TÃ¬m kiáº¿m'
                value={keyword}
                onChange={e => {
                  setKeyword(e.target.value)
                  handleFilterChange({ Keyword: e.target.value || undefined })
                }}
                placeholder='TÃ¬m kiáº¿m theo tÃªn vai trÃ²...'
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Button
                variant='outlined'
                onClick={() => {
                  setKeyword('')
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
                ChÆ°a cÃ³ vai trÃ² nÃ o
              </Typography>
            </Box>
          )}
        </div>
      </Card>

      {/* Add Role Dialog */}
      <Dialog open={addRoleOpen} onClose={() => setAddRoleOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>ThÃªm vai trÃ² má»›i</DialogTitle>
        <DialogContent>
          <Box className='flex flex-col gap-4 pt-4'>
            <TextField
              fullWidth
              label='TÃªn vai trÃ²'
              value={roleName}
              onChange={e => setRoleName(e.target.value)}
              required
            />
            <TextField
              fullWidth
              label='MÃ´ táº£'
              value={roleDescription}
              onChange={e => setRoleDescription(e.target.value)}
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddRoleOpen(false)}>Há»§y</Button>
          <Button onClick={handleCreateRole} variant='contained' disabled={loading || !roleName}>
            {loading ? 'Äang táº¡o...' : 'Táº¡o vai trÃ²'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={editRoleOpen} onClose={() => setEditRoleOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>Chá»‰nh sá»­a vai trÃ²</DialogTitle>
        <DialogContent>
          <Box className='flex flex-col gap-4 pt-4'>
            <TextField
              fullWidth
              label='TÃªn vai trÃ²'
              value={roleName}
              onChange={e => setRoleName(e.target.value)}
              required
            />
            <TextField
              fullWidth
              label='MÃ´ táº£'
              value={roleDescription}
              onChange={e => setRoleDescription(e.target.value)}
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditRoleOpen(false)}>Há»§y</Button>
          <Button onClick={handleUpdateRole} variant='contained' disabled={loading || !roleName}>
            {loading ? 'Äang cáº­p nháº­t...' : 'Cáº­p nháº­t vai trÃ²'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default RoleManagementTable
