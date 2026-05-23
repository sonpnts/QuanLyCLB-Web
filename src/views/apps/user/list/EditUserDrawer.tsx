'use client'

import { useEffect, useMemo, useState } from 'react'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Drawer from '@mui/material/Drawer'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import Grid from '@mui/material/Grid2'
import IconButton from '@mui/material/IconButton'
import InputLabel from '@mui/material/InputLabel'
import ListItemText from '@mui/material/ListItemText'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import { Controller, useForm } from 'react-hook-form'

import { useNotification } from '@/contexts/notificationContext'
import type { RoleType } from '@/services/roleService'
import userService from '@/services/userService'
import type { UsersType } from '@/types/apps/userTypes'
import { logger } from '@/utils/logger'
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
  isActive: boolean
  roleIds: string[]
  memberCode?: string
}

const EditUserDrawer = ({ open, onClose, user, roles, onSaved }: Props) => {
  const { showNotification } = useNotification()
  const [submitting, setSubmitting] = useState(false)

  const defaultValues = useMemo<FormValues>(
    () => ({
      fullName: user?.fullName || '',
      email: user?.email || '',
      phoneNumber: user?.phoneNumber || '',
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

  useEffect(() => {
    if (!user) {
      return
    }

    reset(defaultValues)

    const currentRoleIds = (user.roles || [])
      .map(roleName => roles.find(role => role.name === roleName)?.id)
      .filter((id): id is string => Boolean(id))

    setValue('roleIds', currentRoleIds)
  }, [defaultValues, reset, roles, setValue, user])

  const handleMemberInfoConfirmed = (info: MemberInfo) => {
    if (!getValues('fullName') && info.fullName) setValue('fullName', info.fullName)
    if (!getValues('phoneNumber') && info.phoneNumber) setValue('phoneNumber', info.phoneNumber)
    if (!getValues('email') && info.email) setValue('email', info.email)
  }

  const onSubmit = async (values: FormValues) => {
    if (!user) {
      return
    }

    try {
      setSubmitting(true)

      const payload = {
        email: values.email,
        fullName: values.fullName,
        phoneNumber: values.phoneNumber || undefined,
        avatarUrl: undefined,
        isActive: values.isActive,
        roleIds: values.roleIds,
        memberCode: values.memberCode?.trim() || null
      }

      const res = await userService.updateUser(user.id, payload)

      if (!res.success || !res.data) {
        showNotification(res.message || 'Không thể cập nhật người dùng.', 'error')

        return
      }

      showNotification(res.message || 'Cập nhật người dùng thành công.', 'success')
      onSaved(res.data as UsersType)
      onClose()
    } catch (err) {
      logger.error('EditUserDrawer', 'updateUser', err)
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
                <TextField {...field} fullWidth label='Họ tên' error={!!errors.fullName} helperText={errors.fullName?.message} />
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
                  control={<Checkbox checked={field.value} onChange={(_, checked) => field.onChange(checked)} />}
                  label='Hoạt động'
                />
              )}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name='memberCode'
              control={control}
              render={({ field }) => (
                <MemberCodeField
                  value={field.value || ''}
                  onChange={field.onChange}
                  onMemberInfoConfirmed={handleMemberInfoConfirmed}
                  helperText='Nhập mã hoặc dùng kính lúp tìm theo tên'
                />
              )}
            />
          </Grid>

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
                Dữ liệu được đồng bộ từ liên đoàn
              </Typography>
            </Box>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Controller
              name='roleIds'
              control={control}
              rules={{ validate: value => (value && value.length > 0) || 'Chọn ít nhất 1 vai trò' }}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.roleIds}>
                  <InputLabel>Vai trò</InputLabel>
                  <Select
                    multiple
                    value={field.value}
                    onChange={event => field.onChange(event.target.value as string[])}
                    label='Vai trò'
                    renderValue={selected =>
                      (selected as string[]).map(id => roles.find(role => role.id === id)?.name || id).join(', ')
                    }
                  >
                    {roles.map(role => (
                      <MenuItem key={role.id} value={role.id}>
                        <Checkbox checked={(watch('roleIds') || []).includes(role.id)} />
                        <ListItemText primary={role.name} />
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

        <div className='flex items-center gap-4'>
          <Button type='submit' variant='contained' disabled={submitting}>
            {submitting ? 'Đang lưu...' : 'Lưu'}
          </Button>
          <Button variant='outlined' color='secondary' onClick={onClose} disabled={submitting}>
            Hủy
          </Button>
        </div>
      </form>
    </Drawer>
  )
}

export default EditUserDrawer
