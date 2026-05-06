'use client'
import { logger } from '@/utils/logger'

// React Imports
import { useEffect, useMemo, useState } from 'react'

// MUI Imports
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Drawer from '@mui/material/Drawer'
import FormControl from '@mui/material/FormControl'
import Grid from '@mui/material/Grid2'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'

// Zalo
import ZaloVerifyModal from './ZaloVerifyModal'

// Form
import { Controller, useForm } from 'react-hook-form'

// Types
import type { StudentType } from '@/types/apps/studentTypes'

// Services
import studentService from '@/services/studentService'

// Context
import { useNotification } from '@/contexts/notificationContext'

// Components
import MemberCodeField from '@/components/member/MemberCodeField'
import type { MemberInfo } from '@/components/member/MemberCodeField'

type Props = {
  open: boolean
  onClose: () => void
  student: StudentType | null
  onSaved: (updated: StudentType) => void
}

type FormValues = {
  code: string
  fullName: string
  phoneNumber?: string
  email?: string
  address?: string
  identityNumber?: string
  dateOfBirth?: string
  gender?: string
  notes?: string
}

const EditStudentDrawer = (props: Props) => {
  const { open, onClose, student, onSaved } = props
  const { showNotification } = useNotification()
  const [submitting, setSubmitting] = useState(false)
  // Mã HV state (quản lý độc lập ngoài form vì cần truyền cho MemberCodeField)
  const [memberCode, setMemberCode] = useState('')
  // Zalo
  const [zaloModalOpen, setZaloModalOpen] = useState(false)
  const [pendingZaloUserId, setPendingZaloUserId] = useState<string | null>(null)

  const defaultValues = useMemo<FormValues>(
    () => ({
      code: student?.code || '',
      fullName: student?.fullName || '',
      phoneNumber: student?.phoneNumber || '',
      email: student?.email || '',
      address: student?.address || '',
      identityNumber: student?.identityNumber || '',
      dateOfBirth: student?.dateOfBirth ? student.dateOfBirth.split('T')[0] : '',
      gender: student?.gender !== undefined ? String(student.gender) : '',
      notes: student?.notes || ''
    }),
    [student]
  )

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors }
  } = useForm<FormValues>({ defaultValues })

  useEffect(() => {
    if (student) {
      reset(defaultValues)
      setMemberCode(student?.code || '')
      setPendingZaloUserId(null)
    }
  }, [student, defaultValues, reset])

  /**
   * Học viên đã có mã HV (đã lưu trong DB) → khoá toàn bộ thông tin cá nhân.
   * Chỉ cho phép chỉnh sửa: currentBeltLevelId, notes.
   */
  const isLocked = Boolean(student?.code)

  /** Áp dụng thông tin từ liên đoàn vào form (chỉ khi chưa khoá) */
  const handleMemberInfoConfirmed = (info: MemberInfo) => {
    if (isLocked) return

    setValue('fullName', info.fullName || defaultValues.fullName)
    if (info.gender !== undefined) setValue('gender', String(info.gender))
    if (info.dateOfBirth) setValue('dateOfBirth', info.dateOfBirth)
    if (info.phoneNumber) setValue('phoneNumber', info.phoneNumber)
    if (info.address) setValue('address', info.address)
    if (info.email) setValue('email', info.email)
    if (info.identityNumber) setValue('identityNumber', info.identityNumber)

    showNotification('Đã áp dụng thông tin từ liên đoàn.', 'info')
  }

  const onSubmit = async (values: FormValues) => {
    if (!student) return

    try {
      setSubmitting(true)

      const payload: any = {
        // Mã HV luôn được phép cập nhật (dù đã khoá, vẫn có thể đổi mã)
        code: memberCode.trim() || undefined,
        notes: values.notes || undefined
      }

      // Chỉ gửi thông tin cá nhân nếu chưa khoá
      if (!isLocked) {
        payload.fullName = values.fullName
        payload.phoneNumber = values.phoneNumber || undefined
        payload.email = values.email || undefined
        payload.address = values.address || undefined
        payload.identityNumber = values.identityNumber || undefined
        payload.dateOfBirth = values.dateOfBirth || undefined
        payload.gender = values.gender !== '' ? values.gender === 'true' : undefined
      }

      // Gửi Zalo User ID nếu vừa xác thực
      if (pendingZaloUserId !== null) {
        payload.userIdZalo = pendingZaloUserId
      }

      const res = await studentService.updateStudent(student.id, payload)

      if (res.success && res.data) {
        showNotification(res.message || 'Cập nhật học viên thành công.', 'success')
        onSaved(res.data as StudentType)
        onClose()
      } else {
        showNotification(res.message || 'Không thể cập nhật học viên.', 'error')
      }
    } catch (err) {
      logger.error('EditStudentDrawer', 'Error updating student', err)
      showNotification('Đã có lỗi khi cập nhật học viên.', 'error')
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
      sx={{ '& .MuiDrawer-paper': { width: { xs: 320, sm: 480 } } }}
    >
      <div className='flex items-center justify-between pli-5 plb-4'>
        <Box className='flex items-center gap-2'>
          <Typography variant='h5'>Chỉnh sửa học viên</Typography>
          {isLocked && (
            <Chip
              label='Đã khoá'
              size='small'
              color='warning'
              variant='tonal'
              icon={<i className='ri-lock-line text-xs' />}
            />
          )}
        </Box>
        <IconButton size='small' onClick={onClose}>
          <i className='ri-close-line text-2xl' />
        </IconButton>
      </div>
      <Divider />

      <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-4 p-5'>
        {isLocked && (
          <Alert severity='info' icon={<i className='ri-lock-line' />}>
            Học viên đã có mã HV — thông tin cá nhân (tên, giới tính, ngày sinh, …) bị khoá.
            Chỉ có thể chỉnh sửa <strong>ghi chú</strong>.
            Để mở khoá, xoá mã HV trước rồi lưu lại.
          </Alert>
        )}

        {/* Mã HV */}
        <MemberCodeField
          value={memberCode}
          onChange={code => {
            setMemberCode(code)
            setValue('code', code)
          }}
          onMemberInfoConfirmed={handleMemberInfoConfirmed}
          locked={false}   // mã HV luôn có thể cập nhật (chỉ khoá các trường còn lại)
          helperText={
            isLocked
              ? 'Xoá mã và lưu để mở khoá toàn bộ thông tin'
              : 'Nhấn Enter/Tab để tra cứu thông tin từ liên đoàn'
          }
        />

        <Grid container spacing={3}>
          {/* Họ và tên */}
          <Grid size={{ xs: 12 }}>
            <Controller
              name='fullName'
              control={control}
              rules={{ required: 'Họ tên là bắt buộc' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label='Họ và tên *'
                  disabled={isLocked}
                  error={!!errors.fullName}
                  helperText={errors.fullName?.message}
                />
              )}
            />
          </Grid>

          {/* Phone + Email */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name='phoneNumber'
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label='Số điện thoại'
                  disabled={isLocked}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position='end'>
                        <Tooltip
                          title={
                            pendingZaloUserId
                              ? 'Đã xác thực Zalo (chưa lưu)'
                              : student?.userIdZalo
                                ? 'Đã liên kết Zalo — nhấn để xác thực lại'
                                : 'Xác thực số điện thoại qua Zalo OA'
                          }
                          arrow
                        >
                          <IconButton
                            size='small'
                            onClick={() => setZaloModalOpen(true)}
                            color={pendingZaloUserId ? 'warning' : student?.userIdZalo ? 'success' : 'default'}
                          >
                            <Box
                              component='img'
                              src='https://upload.wikimedia.org/wikipedia/commons/9/91/Icon_of_Zalo.svg'
                              alt='Zalo'
                              sx={{ width: 20, height: 20 }}
                            />
                          </IconButton>
                        </Tooltip>
                      </InputAdornment>
                    )
                  }}
                />
              )}
            />
            {/* Zalo status indicator */}
            {(student?.userIdZalo || pendingZaloUserId) && (
              <Box sx={{ mt: 0.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <i
                  className={pendingZaloUserId ? 'ri-time-line text-xs' : 'ri-check-circle-line text-xs'}
                  style={{ color: pendingZaloUserId ? '#ed6c02' : '#2e7d32', fontSize: 12 }}
                />
                <Typography variant='caption' color={pendingZaloUserId ? 'warning.dark' : 'success.dark'}>
                  {pendingZaloUserId
                    ? 'Đã xác thực Zalo — lưu để cập nhật'
                    : 'Đã liên kết Zalo OA'}
                </Typography>
              </Box>
            )}
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name='email'
              control={control}
              render={({ field }) => (
                <TextField {...field} fullWidth label='Email' type='email' disabled={isLocked} />
              )}
            />
          </Grid>

          {/* Địa chỉ */}
          <Grid size={{ xs: 12 }}>
            <Controller
              name='address'
              control={control}
              render={({ field }) => (
                <TextField {...field} fullWidth label='Địa chỉ' disabled={isLocked} />
              )}
            />
          </Grid>

          {/* CCCD + Ngày sinh */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name='identityNumber'
              control={control}
              render={({ field }) => (
                <TextField {...field} fullWidth label='CMND/CCCD' disabled={isLocked} />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name='dateOfBirth'
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label='Ngày sinh'
                  type='date'
                  disabled={isLocked}
                  InputLabelProps={{ shrink: true }}
                />
              )}
            />
          </Grid>

          {/* Giới tính + Cấp đai liên đoàn (chỉ đọc) */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name='gender'
              control={control}
              render={({ field }) => (
                <FormControl fullWidth disabled={isLocked}>
                  <InputLabel>Giới tính</InputLabel>
                  <Select {...field} label='Giới tính'>
                    <MenuItem value=''>Chọn giới tính</MenuItem>
                    <MenuItem value='true'>Nam</MenuItem>
                    <MenuItem value='false'>Nữ</MenuItem>
                  </Select>
                </FormControl>
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Typography variant='caption' color='text.secondary'>
                Cấp đai liên đoàn
              </Typography>
              <Chip
                label={student?.currentBeltLevelName || 'Chưa có'}
                size='small'
                sx={{
                  alignSelf: 'flex-start',
                  bgcolor: student?.currentBeltLevelName ? 'primary.light' : 'action.hover',
                  fontWeight: student?.currentBeltLevelName ? 600 : 400,
                  color: student?.currentBeltLevelName ? 'primary.main' : 'text.secondary'
                }}
              />
              <Typography variant='caption' color='text.disabled'>
                Chỉ đọc — tra cứu từ liên đoàn theo mã HV
              </Typography>
            </Box>
          </Grid>

          {/* Ghi chú */}
          <Grid size={{ xs: 12 }}>
            <Controller
              name='notes'
              control={control}
              render={({ field }) => (
                <TextField {...field} fullWidth label='Ghi chú' multiline rows={3} />
              )}
            />
          </Grid>
        </Grid>

        <div className='flex gap-2 justify-end mt-2'>
          <Button variant='outlined' onClick={onClose} disabled={submitting}>
            Hủy
          </Button>
          <Button type='submit' variant='contained' disabled={submitting}>
            {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </div>
      </form>

      {/* Zalo Verify Modal */}
      <ZaloVerifyModal
        open={zaloModalOpen}
        onClose={() => setZaloModalOpen(false)}
        defaultPhone={student?.phoneNumber || ''}
        onConfirm={userId => {
          setPendingZaloUserId(userId)
          showNotification('Xác thực Zalo thành công — nhấn "Lưu thay đổi" để cập nhật.', 'info')
        }}
      />
    </Drawer>
  )
}

export default EditStudentDrawer
