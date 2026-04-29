'use client'

import { useState, useEffect, useMemo } from 'react'
import { useForm, Controller } from 'react-hook-form'

// MUI Imports
import Button from '@mui/material/Button'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Grid from '@mui/material/Grid2'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Autocomplete from '@mui/material/Autocomplete'
import Alert from '@mui/material/Alert'

// Type Imports
import type { InstructorType, CreateInstructorRequest } from '@/services/instructorService'
import type { BeltLevelType } from '@/types/apps/beltExamTypes'
import type { UsersType } from '@/types/apps/userTypes'

// Service Imports
import instructorService from '@/services/instructorService'
import beltLevelService from '@/services/beltLevelService'
import userService from '@/services/userService'

// Context Imports
import { useNotification } from '@/contexts/notificationContext'
import { logger } from '@/utils/logger'

type Props = {
  open: boolean
  handleClose: () => void
  instructorData?: InstructorType[]
  setData: (data: InstructorType[]) => void
  setFilteredData: (data: InstructorType[]) => void
}

type FormValidateType = {
  userId: string
  skillLevelId?: string
  certification?: string
  memberCode?: string
}

const AddInstructorDrawer = (props: Props) => {
  const { open, handleClose, instructorData, setData, setFilteredData } = props

  const [loading, setLoading] = useState(false)
  const [beltLevels, setBeltLevels] = useState<BeltLevelType[]>([])
  const [beltLevelsLoading, setBeltLevelsLoading] = useState(false)
  const [users, setUsers] = useState<UsersType[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UsersType | null>(null)

  const { showNotification } = useNotification()

  const {
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors }
  } = useForm<FormValidateType>({
    defaultValues: {
      userId: '',
      skillLevelId: '',
      certification: '',
      memberCode: ''
    }
  })

  // Lọc bỏ user đã có role Coach (để không thêm trùng)
  const eligibleUsers = useMemo(() => {
    return users.filter(u => {
      const roles = (u.roles || []).map(r => (typeof r === 'string' ? r : (r as any)?.name)).filter(Boolean)
      return !roles.some((r: string) => r?.toLowerCase() === 'coach')
    })
  }, [users])

  // Load belt levels + users khi drawer mở
  useEffect(() => {
    if (!open) return

    const fetchBeltLevels = async () => {
      setBeltLevelsLoading(true)
      try {
        const res = await beltLevelService.getBeltLevels({ pageSize: 100 })
        if (res.success && res.data) {
          setBeltLevels(res.data.filter(b => b.isActive !== false))
        }
      } catch (err) {
        logger.error('AddInstructorDrawer', 'fetchBeltLevels', err)
      } finally {
        setBeltLevelsLoading(false)
      }
    }

    const fetchUsers = async () => {
      setUsersLoading(true)
      try {
        const res = await userService.getUsers({ PageSize: 1000 })
        if (res.success && res.data) {
          setUsers(res.data.filter(u => u.isActive !== false))
        }
      } catch (err) {
        logger.error('AddInstructorDrawer', 'fetchUsers', err)
      } finally {
        setUsersLoading(false)
      }
    }

    fetchBeltLevels()
    fetchUsers()
  }, [open])

  const handleCloseDrawer = () => {
    reset()
    setSelectedUser(null)
    handleClose()
  }

  const onSubmit = async (data: FormValidateType) => {
    if (!selectedUser) {
      showNotification('Vui lòng chọn người dùng cần thêm vào danh sách HLV.', 'error')
      return
    }

    try {
      setLoading(true)

      const createData: CreateInstructorRequest = {
        fullName: selectedUser.fullName,
        email: selectedUser.email,
        phoneNumber: selectedUser.phoneNumber || undefined,
        skillLevelId: data.skillLevelId || null,
        certification: data.certification || undefined,
        memberCode: data.memberCode?.trim() || selectedUser.memberCode?.trim() || null
      }

      const response = await instructorService.createInstructor(createData)

      if (response.success && response.data) {
        setData([response.data, ...(instructorData || [])])
        setFilteredData([response.data, ...(instructorData || [])])
        showNotification(response.message || 'Đã thêm huấn luyện viên.', 'success')
        handleCloseDrawer()
      } else {
        showNotification(response.message || 'Không thể thêm huấn luyện viên.', 'error')
      }
    } catch (error) {
      logger.error('AddInstructorDrawer', 'Error creating instructor', error)
      showNotification('Đã có lỗi khi thêm huấn luyện viên.', 'error')
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
        <Typography variant='h5'>Thêm huấn luyện viên</Typography>
        <IconButton size='small' onClick={handleCloseDrawer}>
          <i className='ri-close-line text-2xl' />
        </IconButton>
      </div>
      <Divider />
      <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-4 p-5'>
        <Alert severity='info' icon={<i className='ri-information-line' />}>
          Chọn người dùng đã có trong hệ thống để gán role <strong>Huấn luyện viên</strong>.
          Danh sách dưới đây đã loại bỏ những người đã là HLV.
        </Alert>

        <Grid container spacing={4}>
          <Grid size={{ xs: 12 }}>
            <Autocomplete
              fullWidth
              loading={usersLoading}
              options={eligibleUsers}
              value={selectedUser}
              onChange={(_, val) => {
                setSelectedUser(val)
                setValue('userId', val?.id || '')
                setValue('memberCode', val?.memberCode || '')
              }}
              getOptionLabel={(option) => `${option.fullName} (${option.email})`}
              isOptionEqualToValue={(o, v) => o.id === v.id}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label='Chọn người dùng *'
                  placeholder='Tìm theo họ tên hoặc email...'
                  error={!selectedUser && !!errors.userId}
                  helperText={!selectedUser && errors.userId ? 'Vui lòng chọn người dùng.' : undefined}
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
                    <Typography variant='body2' className='font-medium'>
                      {option.fullName}
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      {option.email}
                      {option.phoneNumber ? ` • ${option.phoneNumber}` : ''}
                    </Typography>
                  </Box>
                </li>
              )}
            />
          </Grid>

          {selectedUser && (
            <Grid size={{ xs: 12 }}>
              <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                <Typography variant='body2'>
                  <strong>{selectedUser.fullName}</strong> — {selectedUser.email}
                </Typography>
                {selectedUser.phoneNumber && (
                  <Typography variant='body2' color='text.secondary'>
                    SĐT: {selectedUser.phoneNumber}
                  </Typography>
                )}
              </Box>
            </Grid>
          )}

          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name='skillLevelId'
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  fullWidth
                  label='Cấp đai'
                  disabled={beltLevelsLoading}
                  InputProps={{
                    endAdornment: beltLevelsLoading ? <CircularProgress size={18} sx={{ mr: 1 }} /> : undefined
                  }}
                >
                  <MenuItem value=''>
                    <em>— Chưa xác định —</em>
                  </MenuItem>
                  {[...beltLevels]
                    .sort((a, b) => {
                      if ((a.isDang ?? false) !== (b.isDang ?? false)) return (a.isDang ? 1 : 0) - (b.isDang ? 1 : 0)
                      return (a.order ?? 0) - (b.order ?? 0)
                    })
                    .map(belt => (
                      <MenuItem key={belt.id} value={belt.id}>
                        {belt.name}
                      </MenuItem>
                    ))}
                </TextField>
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name='certification'
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label='Chứng chỉ'
                  placeholder='Ví dụ: ACE, NASM, ACSM'
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Controller
              name='memberCode'
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label='Mã hội viên liên đoàn'
                  placeholder='VD: HV00123'
                  helperText='Dùng để tra cứu cấp đai liên đoàn tự động. Nếu người dùng đã có mã, hệ thống sẽ tự điền.'
                />
              )}
            />
          </Grid>
        </Grid>
        <Box className='flex gap-2 justify-end'>
          <Button variant='outlined' onClick={handleCloseDrawer} disabled={loading}>
            Hủy
          </Button>
          <Button type='submit' variant='contained' disabled={loading || !selectedUser}>
            {loading ? 'Đang xử lý...' : 'Thêm HLV'}
          </Button>
        </Box>
      </form>
    </Drawer>
  )
}

export default AddInstructorDrawer
