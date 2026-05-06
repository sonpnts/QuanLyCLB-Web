
'use client'
import { logger } from '@/utils/logger'

// React Imports
import { useState } from 'react'

import { useForm } from 'react-hook-form'

// MUI Imports
import Button from '@mui/material/Button'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import TextField from '@mui/material/TextField'
import Grid from '@mui/material/Grid2'
import Box from '@mui/material/Box'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'

import type { UsersType } from '@/types/apps/userTypes'

// Type Imports
import type { CreateUserRequest } from '@/services/userService'

import type { RoleType } from '@/services/roleService'

// Service Imports
import userService from '@/services/userService'

// Context Imports
import { useNotification } from '@/contexts/notificationContext'

// Member code search
import MemberCodeField from '@/views/apps/student/list/MemberCodeField'
import type { MemberInfo } from '@/views/apps/student/list/MemberCodeField'

type Props = {
  open: boolean
  handleClose: () => void
  userData?: UsersType[]
  setData: React.Dispatch<React.SetStateAction<UsersType[]>>
  setFilteredData: React.Dispatch<React.SetStateAction<UsersType[]>>
  roles: RoleType[]
}

type FormValidateType = {
  fullName: string
  email: string
  username?: string
  role: string
  password?: string
  phoneNumber?: string
  skillLevel?: string
  certification?: string
  isActive: boolean
  memberCode?: string
}

const AddUserDrawer = (props: Props) => {
  const { open, handleClose, userData, setData, setFilteredData, roles } = props

  // States
  const [loading, setLoading] = useState(false)
  const [memberCode, setMemberCode] = useState('')

  // Notification Hook
  const { showNotification } = useNotification()

  // Form
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<FormValidateType>({
    defaultValues: {
      fullName: '',
      email: '',
      username: '',
      role: '',
      password: '',
      phoneNumber: '',
      skillLevel: '',
      certification: '',
      isActive: true,
      memberCode: ''
    }
  })

  // Handle close
  const handleCloseDrawer = () => {
    reset()
    setMemberCode('')
    handleClose()
  }

  // Khi xác nhận thông tin từ liên đoàn → tự điền vào form nếu trường chưa có
  const handleMemberInfoConfirmed = (info: MemberInfo) => {
    if (!watch('fullName') && info.fullName) setValue('fullName', info.fullName)
    if (!watch('phoneNumber') && info.phoneNumber) setValue('phoneNumber', info.phoneNumber)
    if (!watch('email') && info.email) setValue('email', info.email)
    setValue('memberCode', memberCode)
  }

  // Handle submit
  const onSubmit = async (data: FormValidateType) => {
    try {
      setLoading(true)

      // Get role name from roleId
      const selectedRole = roles.find(r => r.id === data.role)
      const roleName = selectedRole?.name

      if (!roleName) {
        showNotification('Vui lòng chọn vai trò.', 'error')

        return
      }

      const createData: CreateUserRequest = {
        fullName: data.fullName,
        email: data.email,
        username: data.username || undefined,
        roles: [roleName],
        password: data.password || undefined,
        phoneNumber: data.phoneNumber || undefined,
        skillLevel: data.skillLevel || undefined,
        certification: data.certification || undefined,
        isActive: data.isActive,
        memberCode: memberCode.trim() || null
      }

      const response = await userService.createUser(createData)

      if (response.success && response.data) {
        setData([response.data, ...(userData || [])])
        setFilteredData([response.data, ...(userData || [])])
        showNotification(response.message || 'Tạo người dùng thành công.', 'success')
        handleCloseDrawer()
      } else {
        showNotification(response.message || 'Không thể tạo người dùng.', 'error')
      }
    } catch (error) {
      logger.error('AddUserDrawer', 'Error creating user', error)
      showNotification('Đã có lỗi khi tạo người dùng.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Drawer
      open={open}
      anchor='right'
      variant='temporary'
      onClose={handleCloseDrawer}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: { xs: 300, sm: 500, md: 600 } } }}
    >
      <div className='flex items-center justify-between pli-5 plb-4'>
        <Typography variant='h5'>Thêm người dùng mới</Typography>
        <IconButton size='small' onClick={handleCloseDrawer}>
          <i className='ri-close-line text-2xl' />
        </IconButton>
      </div>
      <Divider />
      <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-4 p-5'>
        <Grid container spacing={4}>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label='Họ và tên'
              {...register('fullName', { required: 'Họ và tên là bắt buộc' })}
              error={!!errors.fullName}
              helperText={errors.fullName?.message}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label='Email'
              type='email'
              {...register('email', {
                required: 'Email là bắt buộc',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Email không hợp lệ'
                }
              })}
              error={!!errors.email}
              helperText={errors.email?.message}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label='Tên đăng nhập'
              {...register('username')}
              error={!!errors.username}
              helperText={errors.username?.message}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label='Mật khẩu'
              type='password'
              {...register('password')}
              error={!!errors.password}
              helperText={errors.password?.message}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <FormControl fullWidth error={!!errors.role}>
              <InputLabel>Vai trò</InputLabel>
              <Select value={watch('role')} label='Vai trò' onChange={e => setValue('role', e.target.value)}>
                {roles && roles.length > 0 ? (
                  Array.from(new Map(roles.map(r => [r.id, r])).values()).map(role => (
                    <MenuItem key={role.id} value={role.id}>
                      {role.name}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem value='' disabled>
                    Đang tải vai trò...
                  </MenuItem>
                )}
              </Select>
              {errors.role && (
                <Typography variant='caption' color='error' className='mt-1 ml-3'>
                  {errors.role.message}
                </Typography>
              )}
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label='Số điện thoại'
              {...register('phoneNumber')}
              error={!!errors.phoneNumber}
              helperText={errors.phoneNumber?.message}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label='Trình độ'
              {...register('skillLevel')}
              error={!!errors.skillLevel}
              helperText={errors.skillLevel?.message}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label='Chứng chỉ'
              {...register('certification')}
              error={!!errors.certification}
              helperText={errors.certification?.message}
            />
          </Grid>
          {/* Mã hội viên liên đoàn — có nút tìm kiếm giống học viên */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <MemberCodeField
              value={memberCode}
              onChange={setMemberCode}
              onMemberInfoConfirmed={handleMemberInfoConfirmed}
              helperText='Nhập mã hoặc dùng kính lúp tìm theo tên'
            />
          </Grid>
        </Grid>
        <Box className='flex gap-2 justify-end'>
          <Button variant='outlined' onClick={handleCloseDrawer}>
            Hủy
          </Button>
          <Button type='submit' variant='contained' disabled={loading}>
            {loading ? 'Đang tạo...' : 'Tạo người dùng'}
          </Button>
        </Box>
      </form>
    </Drawer>
  )
}

export default AddUserDrawer
