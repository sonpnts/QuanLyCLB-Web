'use client'

import { useEffect, useState, useMemo, useRef } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'
import Tooltip from '@mui/material/Tooltip'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Autocomplete from '@mui/material/Autocomplete'
import TextField from '@mui/material/TextField'
import Alert from '@mui/material/Alert'
import TablePagination from '@mui/material/TablePagination'
import InputAdornment from '@mui/material/InputAdornment'

// Types & Services
import type { UsersType } from '@/types/apps/userTypes'
import assistantService from '@/services/assistantService'
import userService from '@/services/userService'

// Context
import { useNotification } from '@/contexts/notificationContext'
import { logger } from '@/utils/logger'

// Components
import MemberCodeField from '@/components/member/MemberCodeField'

// Utils
import CustomAvatar from '@core/components/mui/Avatar'
import { getInitials } from '@/utils/getInitials'
import { exportToExcel, formatBool } from '@/utils/exportToExcel'

const AssistantListTable = () => {
  const [data, setData] = useState<UsersType[]>([])
  const [loading, setLoading] = useState(false)
  const [allUsers, setAllUsers] = useState<UsersType[]>([])
  const [usersLoading, setUsersLoading] = useState(false)

  const [addOpen, setAddOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UsersType | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Edit member code
  const [editOpen, setEditOpen] = useState(false)
  const [editUser, setEditUser] = useState<UsersType | null>(null)
  const [editMemberCode, setEditMemberCode] = useState('')
  const [editSubmitting, setEditSubmitting] = useState(false)

  // Search + pagination
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)

  const { showNotification } = useNotification()
  const showNotificationRef = useRef(showNotification)
  showNotificationRef.current = showNotification

  const loadAssistants = async () => {
    setLoading(true)
    try {
      const res = await assistantService.getAssistants()
      if (res.success && res.data) {
        setData(res.data)
      } else {
        showNotificationRef.current(res.message || 'Không thể tải danh sách trợ giảng.', 'error')
      }
    } catch (err) {
      logger.error('AssistantListTable', 'loadAssistants', err)
    } finally {
      setLoading(false)
    }
  }

  const loadAllUsers = async () => {
    setUsersLoading(true)
    try {
      const res = await userService.getUsers({ PageSize: 1000 })
      if (res.success && res.data) {
        setAllUsers(res.data.filter(u => u.isActive !== false))
      }
    } catch (err) {
      logger.error('AssistantListTable', 'loadAllUsers', err)
    } finally {
      setUsersLoading(false)
    }
  }

  useEffect(() => {
    loadAssistants()
  }, [])

  // Lọc bỏ user đã là Assistant
  const eligibleUsers = useMemo(() => {
    return allUsers.filter(u => {
      const roles = (u.roles || []).map((r: any) => (typeof r === 'string' ? r : r?.name)).filter(Boolean)
      return !roles.some((r: string) => r?.toLowerCase() === 'assistant')
    })
  }, [allUsers])

  const handleOpenAdd = () => {
    setSelectedUser(null)
    setAddOpen(true)
    if (allUsers.length === 0) loadAllUsers()
  }

  const handleAdd = async () => {
    if (!selectedUser) return
    setSubmitting(true)
    try {
      const res = await assistantService.assignAssistantRole(selectedUser.id)
      if (res.success) {
        showNotificationRef.current('Đã gán role Trợ giảng.', 'success')
        setAddOpen(false)
        setSelectedUser(null)
        loadAssistants()
      } else {
        showNotificationRef.current(res.message || 'Không thể gán role.', 'error')
      }
    } catch (err) {
      logger.error('AssistantListTable', 'handleAdd', err)
      showNotificationRef.current('Đã có lỗi xảy ra.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRemove = async (user: UsersType) => {
    if (!confirm(`Bỏ role Trợ giảng của "${user.fullName}"?`)) return
    try {
      const res = await assistantService.removeAssistantRole(user.id)
      if (res.success) {
        setData(prev => prev.filter(u => u.id !== user.id))
        showNotificationRef.current('Đã bỏ role Trợ giảng.', 'success')
      } else {
        showNotificationRef.current(res.message || 'Không thể bỏ role.', 'error')
      }
    } catch (err) {
      logger.error('AssistantListTable', 'handleRemove', err)
      showNotificationRef.current('Đã có lỗi xảy ra.', 'error')
    }
  }

  const handleOpenEdit = (user: UsersType) => {
    setEditUser(user)
    setEditMemberCode((user as any).memberCode || '')
    setEditOpen(true)
  }

  const handleSaveMemberCode = async () => {
    if (!editUser) return
    setEditSubmitting(true)
    try {
      const res = await userService.updateUser(editUser.id, { memberCode: editMemberCode.trim() || null })
      if (res.success) {
        showNotificationRef.current('Đã cập nhật mã hội viên.', 'success')
        setData(prev => prev.map(u => u.id === editUser.id ? { ...u, memberCode: editMemberCode.trim() || undefined } as any : u))
        setEditOpen(false)
        setEditUser(null)
      } else {
        showNotificationRef.current(res.message || 'Không thể cập nhật mã hội viên.', 'error')
      }
    } catch (err) {
      logger.error('AssistantListTable', 'handleSaveMemberCode', err)
      showNotificationRef.current('Đã có lỗi xảy ra.', 'error')
    } finally {
      setEditSubmitting(false)
    }
  }

  // Filter data theo search query
  const filteredData = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return data
    return data.filter(u =>
      (u.fullName || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.phoneNumber || '').toLowerCase().includes(q) ||
      (u.skillLevel || '').toLowerCase().includes(q)
    )
  }, [data, search])

  // Phân trang
  const pagedData = useMemo(
    () => filteredData.slice(page * pageSize, page * pageSize + pageSize),
    [filteredData, page, pageSize]
  )

  // Reset page khi filter đổi
  useEffect(() => {
    setPage(0)
  }, [search])

  return (
    <>
      <Card>
        <CardHeader
          title='Danh sách trợ giảng'
          subheader='Người dùng có role Assistant — phụ giúp HLV trong các lớp học'
          action={
            <Box className='flex gap-2'>
              <Button
                variant='outlined'
                color='success'
                startIcon={<i className='ri-file-excel-2-line' />}
                disabled={data.length === 0}
                onClick={() => {
                  exportToExcel({
                    filename: 'danh-sach-tro-giang',
                    rows: data,
                    columns: [
                      { header: 'Họ và tên', accessor: 'fullName' },
                      { header: 'Email', accessor: 'email' },
                      { header: 'Số điện thoại', accessor: 'phoneNumber' as any },
                      { header: 'Cấp đai', accessor: 'skillLevel' as any },
                      { header: 'Hoạt động', accessor: 'isActive' as any, formatter: v => formatBool(v, 'Có', 'Không') }
                    ]
                  })
                }}
              >
                Xuất Excel
              </Button>
              <Button variant='contained' startIcon={<i className='ri-user-add-line' />} onClick={handleOpenAdd}>
                Thêm trợ giảng
              </Button>
            </Box>
          }
        />

        {/* Search bar */}
        <Box className='px-5 pb-3'>
          <TextField
            size='small'
            fullWidth
            placeholder='Tìm theo họ tên, email, SĐT, cấp đai...'
            value={search}
            onChange={e => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <i className='ri-search-line text-textSecondary' />
                </InputAdornment>
              ),
              endAdornment: search ? (
                <InputAdornment position='end'>
                  <i
                    className='ri-close-circle-line cursor-pointer text-textSecondary'
                    onClick={() => setSearch('')}
                  />
                </InputAdornment>
              ) : null
            }}
          />
        </Box>

        {loading ? (
          <Box className='flex justify-center p-8'>
            <CircularProgress />
          </Box>
        ) : data.length === 0 ? (
          <Box className='p-8'>
            <Typography color='text.secondary' align='center'>
              Chưa có trợ giảng nào.
            </Typography>
          </Box>
        ) : filteredData.length === 0 ? (
          <Box className='p-8'>
            <Typography color='text.secondary' align='center'>
              Không có kết quả khớp với "{search}".
            </Typography>
          </Box>
        ) : (
          <Box className='overflow-x-auto'>
            <table className='w-full text-sm border-collapse'>
              <thead>
                <tr className='bg-action-hover'>
                  <th className='p-3 text-left font-semibold'>Họ tên</th>
                  <th className='p-3 text-left font-semibold'>Email</th>
                  <th className='p-3 text-left font-semibold'>SĐT</th>
                  <th className='p-3 text-left font-semibold'>Mã HV</th>
                  <th className='p-3 text-left font-semibold'>Cấp đai</th>
                  <th className='p-3 text-center font-semibold'>Trạng thái</th>
                  <th className='p-3 text-center font-semibold'>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {pagedData.map(user => (
                  <tr key={user.id} className='border-t'>
                    <td className='p-3'>
                      <Box className='flex items-center gap-3'>
                        <CustomAvatar skin='light' color='info'>
                          {getInitials(user.fullName)}
                        </CustomAvatar>
                        <Typography className='font-medium'>{user.fullName}</Typography>
                      </Box>
                    </td>
                    <td className='p-3'>
                      <Typography variant='body2'>{user.email || '-'}</Typography>
                    </td>
                    <td className='p-3'>
                      <Typography variant='body2'>{user.phoneNumber || '-'}</Typography>
                    </td>
                    <td className='p-3'>
                      <Typography variant='body2' fontFamily='monospace' fontSize='0.8rem'>
                        {(user as any).memberCode || <span className='text-textDisabled'>—</span>}
                      </Typography>
                    </td>
                    <td className='p-3'>
                      <Typography variant='body2'>{user.skillLevel || '-'}</Typography>
                    </td>
                    <td className='p-3 text-center'>
                      <Chip
                        label={user.isActive ? 'Hoạt động' : 'Tạm khóa'}
                        size='small'
                        color={user.isActive ? 'success' : 'error'}
                        variant='tonal'
                      />
                    </td>
                    <td className='p-3 text-center'>
                      <Tooltip title='Cập nhật mã hội viên'>
                        <IconButton color='primary' onClick={() => handleOpenEdit(user)}>
                          <i className='ri-edit-line' />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title='Bỏ role Trợ giảng'>
                        <IconButton color='error' onClick={() => handleRemove(user)}>
                          <i className='ri-user-unfollow-line' />
                        </IconButton>
                      </Tooltip>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        )}

        {/* Pagination */}
        {filteredData.length > 0 && (
          <TablePagination
            component='div'
            count={filteredData.length}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={pageSize}
            onRowsPerPageChange={e => {
              setPageSize(parseInt(e.target.value, 10))
              setPage(0)
            }}
            rowsPerPageOptions={[5, 10, 20, 50]}
            labelRowsPerPage='Số dòng mỗi trang:'
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}`}
          />
        )}
      </Card>

      {/* Add Assistant Dialog */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>Thêm trợ giảng</DialogTitle>
        <DialogContent>
          <Alert severity='info' className='mb-4' icon={<i className='ri-information-line' />}>
            Chọn người dùng để gán role <strong>Trợ giảng</strong>. Danh sách đã loại bỏ những người đã là trợ giảng.
          </Alert>
          <Autocomplete
            fullWidth
            loading={usersLoading}
            options={eligibleUsers}
            value={selectedUser}
            onChange={(_, val) => setSelectedUser(val)}
            getOptionLabel={(o) => `${o.fullName} (${o.email})`}
            isOptionEqualToValue={(o, v) => o.id === v.id}
            renderInput={(params) => (
              <TextField
                {...params}
                label='Chọn người dùng *'
                placeholder='Tìm theo họ tên hoặc email...'
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {usersLoading ? <CircularProgress color='inherit' size={18} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  )
                }}
              />
            )}
            renderOption={(props, option) => (
              <li {...props} key={option.id}>
                <Box>
                  <Typography variant='body2' className='font-medium'>{option.fullName}</Typography>
                  <Typography variant='caption' color='text.secondary'>
                    {option.email}{option.phoneNumber ? ` • ${option.phoneNumber}` : ''}
                  </Typography>
                </Box>
              </li>
            )}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddOpen(false)} disabled={submitting}>Hủy</Button>
          <Button variant='contained' onClick={handleAdd} disabled={!selectedUser || submitting}>
            {submitting ? 'Đang xử lý...' : 'Gán role Trợ giảng'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Member Code Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>
          <Box className='flex items-center justify-between'>
            <Typography variant='h6'>Cập nhật mã hội viên</Typography>
            <IconButton size='small' onClick={() => setEditOpen(false)}>
              <i className='ri-close-line text-xl' />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {editUser && (
            <Box sx={{ mb: 2, p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
              <Typography variant='body2'>
                <strong>{editUser.fullName}</strong> — {editUser.email}
              </Typography>
            </Box>
          )}
          <MemberCodeField
            value={editMemberCode}
            onChange={setEditMemberCode}
            onMemberInfoConfirmed={() => {
              // Trợ giảng không ghi đè thông tin cá nhân từ liên đoàn
            }}
            helperText='Dùng để tra cứu cấp đai liên đoàn tự động'
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)} disabled={editSubmitting}>Hủy</Button>
          <Button variant='contained' onClick={handleSaveMemberCode} disabled={editSubmitting}>
            {editSubmitting ? 'Đang lưu...' : 'Lưu mã hội viên'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default AssistantListTable
