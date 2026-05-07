'use client'
import { logger } from '@/utils/logger'

// React Imports
import { useEffect, useMemo, useState } from 'react'

// MUI Imports
import Drawer from '@mui/material/Drawer'
import Grid from '@mui/material/Grid2'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Divider from '@mui/material/Divider'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Checkbox from '@mui/material/Checkbox'
import ListItemText from '@mui/material/ListItemText'
import FormControlLabel from '@mui/material/FormControlLabel'
import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'

// Form
import { useForm, Controller } from 'react-hook-form'

// Types
import type { UsersType } from '@/types/apps/userTypes'
import type { RoleType } from '@/services/roleService'

// Services
import userService from '@/services/userService'

// Context
import { useNotification } from '@/contexts/notificationContext'

// Member code search
import MemberCodeField from '@/views/apps/student/list/MemberCodeField'
import type { MemberInfo } from '@/views/apps/student/list/MemberCodeField'

type Props = {
  open: boolean
  onClose: () => void
  user: UsersType | null
  roles: RoleType[]
  onSaved: (updated: UsersType) => void
}

type FormValues = {
  fullName: string
  email: string
  phoneNumber?: string
  certification?: string
  isActive: boolean
  roleIds: string[]
  memberCode?: string
}

const EditUserDrawer = (props: Props) => {
  const { open, onClose, user, roles, onSaved } = props
  const { showNotification } = useNotification()
  const [submitting, setSubmitting] = useState(false)
  const [memberCodeLocal, setMemberCodeLocal] = useState(user?.memberCode || '')

  const defaultValues = useMemo<FormValues>(
    () => ({
      fullName: user?.fullName || '',
      email: user?.email || '',
      phoneNumber: user?.phoneNumber || '',
      certification: user?.certification || '',
      isActive: Boolean(user?.isActive),
      roleIds: [],
      memberCode: user?.memberCode || ''
    }),
    [user]
  )

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
    watch,
    getValues
  } = useForm<FormValues>({
    defaultValues
  })

  // Map current roles by names to ids if possible
  useEffect(() => {
    if (user) {
      reset(defaultValues)
      setMemberCodeLocal(user.memberCode || '')

      const currentRoleIds = (user.roles || [])
        .map(rn => roles.find(r => r.name === rn)?.id)
        .filter((id): id is string => Boolean(id))

      setValue('roleIds', currentRoleIds)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, roles])

  // Khi xác nhận thông tin từ liên đoàn → tự điền vào form nếu trường chưa có
  const handleMemberInfoConfirmed = (info: MemberInfo) => {
    if (!getValues('fullName') && info.fullName) setValue('fullName', info.fullName)
    if (!getValues('phoneNumber') && info.phoneNumber) setValue('phoneNumber', info.phoneNumber)
    if (!getValues('email') && info.email) setValue('email', info.email)
  }

  const onSubmit = async (values: FormValues) => {
    if (!user) return

    try {
      setSubmitting(true)

      const payload: any = {
        email: values.email,
        fullName: values.fullName,
        phoneNumber: values.phoneNumber || undefined,
        avatarUrl: undefined,
        isActive: values.isActive,
        certification: values.certification || undefined,
        roleIds: values.roleIds,
        memberCode: memberCodeLocal.trim() || null
      }

      const res = await userService.updateUser(user.id, payload)

      if (res.success && res.data) {
        showNotification(res.message || 'Cập nhật người dùng thành công.', 'success')
        onSaved(res.data as UsersType)
        onClose()
      } else {
        showNotification(res.message || 'Không thể cập nhật người dùng.', 'error')
      }
    } catch (err) {
      logger.error('EditUserDrawer', 'Error updating user', err)
      showNotification('Đã có lỗi khi cập nhật người dùng.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Drawer
      open={open}
      anchor='right'
      variant='temporary'
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: { xs: 320, sm: 520 } } }}
    >
      <div className='flex items-center justify-between pli-5 plb-4'>
        <Typography variant='h5'>Chỉnh sửa người dùng</Typography>
        <IconButton size='small' onClick={onClose}>
          <i className='ri-close-line text-2xl' />
        </IconButton>
      </div>
      <Divider />
      <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-4 p-5'>
        <Grid container spacing={4}>
          <Grid size={{ xs: 12 }}>
            <Controller
              name='fullName'
              control={control}
              rules={{ required: 'Họ tên là bắt buộc' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label='Họ tên'
                  error={!!errors.fullName}
                  helperText={errors.fullName?.message}
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Controller
              name='email'
              control={control}
              render={({ field }) => <TextField {...field} fullWidth label='Email' />}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name='phoneNumber'
              control={control}
              render={({ field }) => <TextField {...field} fullWidth label='Số điện thoại' />}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name='isActive'
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={<Checkbox checked={field.value} onChange={(_, v) => field.onChange(v)} />}
                  label='Hoạt động'
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name='certification'
              control={control}
              render={({ field }) => <TextField {...field} fullWidth label='Chứng chỉ' />}
            />
          </Grid>
          {/* Mã hội viên liên đoàn — có nút tìm kiếm giống học viên */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <MemberCodeField
              value={memberCodeLocal}
              onChange={setMemberCodeLocal}
              onMemberInfoConfirmed={handleMemberInfoConfirmed}
              helperText='Nhập mã hoặc dùng kính lúp tìm theo tên'
            />
          </Grid>
          {/* Cấp đai — chỉ đọc, tra cứu từ liên đoàn */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Typography variant='caption' color='text.secondary'>
                Cấp đai
              </Typography>
              {user?.beltLevelName ? (
                <Chip
                  label={user.beltLevelName}
                  size='small'
                  color='warning'
                  variant='tonal'
                  icon={<i className='ri-medal-line text-sm' />}
                  sx={{ alignSelf: 'flex-start', fontWeight: 600 }}
                />
              ) : (
                <Chip label='Chưa có' size='small' variant='outlined' sx={{ alignSelf: 'flex-start' }} />
              )}
              <Typography variant='caption' color='text.disabled'>
                Dữ liệu được đồng bộ với VTF
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Controller
              name='roleIds'
              control={control}
              rules={{ validate: v => (v && v.length > 0) || 'Chọn ít nhất 1 vai trò' }}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.roleIds}>
                  <InputLabel>Vai trò</InputLabel>
                  <Select
                    multiple
                    value={field.value}
                    onChange={e => field.onChange(e.target.value as string[])}
                    label='Vai trò'
                    renderValue={selected =>
                      (selected as string[]).map(id => roles.find(r => r.id === id)?.name || id).join(', ')
                    }
                  >
                    {roles.map(r => (
                      <MenuItem key={r.id} value={r.id}>
                        <Checkbox checked={(watch('roleIds') || []).includes(r.id)} />
                        <ListItemText primary={r.name} />
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.roleIds && (
                    <Typography variant='caption' color='error' className='mt-1 ml-3'>
                      {errors.roleIds.message as string}
                    </Typography>
                  )}
                </FormControl>
              )}
            />
          </Grid>
        </Grid>
        <div className='flex gap-2 justify-end'>
          <Button variant='outlined' onClick={onClose}>
            Hủy
          </Button>
          <Button type='submit' variant='contained' disabled={submitting}>
            {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </div>
      </form>
    </Drawer>
  )
}

export default EditUserDrawer


