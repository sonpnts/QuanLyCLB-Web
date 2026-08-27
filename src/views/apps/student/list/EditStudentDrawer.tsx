'use client'

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
import { Controller, useForm } from 'react-hook-form'

import ZaloVerifyModal from './ZaloVerifyModal'

// Form
import { logger } from '@/utils/logger'
import { formatBeltLevelOrder } from '@/utils/beltLevel'

// Types
import type { StudentType } from '@/types/apps/studentTypes'

// Services
import studentService from '@/services/studentService'
import federationMemberService from '@/services/federationMemberService'

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
  personalIdNumber?: string
  address?: string
  dateOfBirth?: string
  educationLevel?: string
  gender?: string
  notes?: string
}

const EditStudentDrawer = (props: Props) => {
  const { open, onClose, student, onSaved } = props
  const { showNotification } = useNotification()
  const [submitting, setSubmitting] = useState(false)

  // Mã HV state (quản lý độc lập ngoài form và cần truyền cho MemberCodeField)
  const [memberCode, setMemberCode] = useState('')

  // Zalo
  const [zaloModalOpen, setZaloModalOpen] = useState(false)
  const [savingZalo, setSavingZalo] = useState(false)

  const defaultValues = useMemo<FormValues>(
    () => ({
      code: student?.code || '',
      fullName: student?.fullName || '',
      phoneNumber: student?.phoneNumber || '',
      personalIdNumber: student?.personalIdNumber || '',
      address: student?.address || '',
      dateOfBirth: student?.dateOfBirth ? student.dateOfBirth.split('T')[0] : '',
      educationLevel: student?.educationLevel || '',
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
    }
  }, [student, defaultValues, reset])
  useEffect(() => {
    const verifyMemberCode = async () => {
      if (!open || !student?.code) return
      const check = await federationMemberService.getByCode(student.code)

      if (!check.success) {
        setMemberCode('')
        setValue('code', '')
        showNotification('Mã HV hiện tại không còn tồn tại trong dữ liệu Liên đoàn. Vui lòng chọn lại mã hợp lệ.', 'warning')
      }
    }

    verifyMemberCode()
  }, [open, student?.id, student?.code, setValue, showNotification])


  /**
   * Học viên đã có mã HV (đã lưu trong DB) sẽ khóa toàn bộ thông tin cá nhân.
   */
  const isLocked = Boolean(memberCode)

  /** Áp dụng thông tin từ liên đoàn vào form (chỉ khi chưa khóa) */
  const handleMemberInfoConfirmed = (info: MemberInfo) => {
    if (isLocked) {
      if (info.personalIdNumber) setValue('personalIdNumber', info.personalIdNumber)

      // if (info.address) setValue('address', info.address)
      showNotification('Đã áp dụng CCCD từ liên đoàn cho học viên đã có mã HV.', 'info')

return
    }

    setValue('fullName', info.fullName || defaultValues.fullName)
    if (info.gender !== undefined) setValue('gender', String(info.gender))
    if (info.dateOfBirth) setValue('dateOfBirth', info.dateOfBirth)
    if (info.phoneNumber) setValue('phoneNumber', info.phoneNumber)
    if (info.personalIdNumber) setValue('personalIdNumber', info.personalIdNumber)
    if (info.address) setValue('address', info.address)
    showNotification('Đã áp dụng thông tin từ liên đoàn.', 'info')
  }

  const onSubmit = async (values: FormValues) => {
    if (!student) return

    try {
      setSubmitting(true)

      const payload: any = {
        // Mã HV luôn được phép cập nhật (dù đã khóa, vẫn có thể đổi mã)
        code: memberCode.trim(),
        personalIdNumber: values.personalIdNumber || undefined,
        address: values.address || undefined,
        notes: values.notes || undefined
      }

      // Chỉ gửi thông tin cá nhân nếu chưa khóa
       if (!isLocked) {
         payload.fullName = values.fullName
         payload.phoneNumber = values.phoneNumber || undefined
         payload.dateOfBirth = values.dateOfBirth || undefined
         payload.educationLevel = values.educationLevel || undefined
         payload.gender = values.gender !== '' ? values.gender === 'true' : undefined
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
              label='Đã khóa'
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
            Học viên đã có mã HV nên thông tin định danh (tên, giới tính, ngày sinh, ...) bị khóa. Vẫn có thể chỉnh sửa{' '}
            <strong>CCCD</strong>, <strong>địa chỉ</strong> và <strong>ghi chú</strong>. Để mở khóa toàn bộ, xóa mã HV
            trước rồi lưu lại.
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
          locked={false} // mã HV luôn có thể cập nhật (chỉ khóa các trường còn lại)
          active={open}
          helperText={
            isLocked
              ? 'Xóa mã và lưu để mở khóa toàn bộ thông tin'
              : 'Chọn từ bảng tra cứu để xem và áp dụng thông tin từ liên đoàn'
          }
        />

        <Grid container spacing={3}>
          {/* Họ và tên */}
          <Grid size={{ xs: 12 }}>
            <Controller
              name='fullName'
              control={control}
              rules={{
                validate: value => {
                  if (isLocked) return true
                  if (!value?.trim()) return 'Họ tên là bắt buộc'

                  return true
                }
              }}
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

          {/* Phone */}
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
                            savingZalo
                              ? 'Đang lưu...'
                              : student?.userIdZalo
                                ? 'Đã liên kết Zalo - nhấn để xác thực lại'
                                : 'Xác thực số điện thoại qua Zalo OA'
                          }
                          arrow
                        >
                          <IconButton
                            size='small'
                            onClick={() => setZaloModalOpen(true)}
                            disabled={savingZalo}
                            color={student?.userIdZalo ? 'success' : 'default'}
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
            {student?.userIdZalo && (
              <Box sx={{ mt: 0.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <i className='ri-check-circle-line text-xs' style={{ color: '#2e7d32', fontSize: 12 }} />
                <Typography variant='caption' color='success.dark'>
                  Đã liên kết Zalo OA
                </Typography>
              </Box>
            )}
          </Grid>

          {/* Địa chỉ */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name='address'
              control={control}
              render={({ field }) => <TextField {...field} fullWidth label='Địa chỉ' />}
            />
          </Grid>

          {/* Ngày sinh */}
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

          {/* CCCD */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name='personalIdNumber'
              control={control}
              render={({ field }) => (
                <TextField disabled={isLocked} {...field} fullWidth label='CCCD / Số định danh cá nhân' placeholder='Ví dụ: 012345678901' />
              )}
            />
          </Grid>

          {/* Giới tính + Cấp đai liên đoàn (chỉ đọc) */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name='educationLevel'
              control={control}
              render={({ field }) => (
                <FormControl fullWidth required disabled={isLocked}>
                  <InputLabel>Trình độ học vấn</InputLabel>
                  <Select {...field} label='Trình độ học vấn'>
                    <MenuItem value=''>Chọn trình độ</MenuItem>
                    <MenuItem value='Cap2'>Cấp 2</MenuItem>
                    <MenuItem value='12/12'>12/12</MenuItem>
                    <MenuItem value='Cap1'>Cấp 1</MenuItem>
                    <MenuItem value='ChuaDiHoc'>Chưa đi học</MenuItem>
                    <MenuItem value='TrungCap'>Trung cấp</MenuItem>
                    <MenuItem value='CaoDang'>Cao đẳng</MenuItem>
                    <MenuItem value='DaiHoc'>Đại học</MenuItem>
                  </Select>
                </FormControl>
              )}
            />
          </Grid>

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
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip
                  label={student?.beltLevelName || 'Chưa có'}
                  size='small'
                  sx={{
                    alignSelf: 'flex-start',
                    bgcolor: 'primary.light',
                    color: 'white',
                    fontWeight: 600
                  }}
                />
                {student?.beltLevelOrder != null && (
                  <Chip
                    label={formatBeltLevelOrder(student.beltLevelOrder)}
                    size='small'
                    variant='outlined'
                    sx={{ fontWeight: 600 }}
                  />
                )}
              </Box>
              <Typography variant='caption' color='text.disabled'>
                Dữ liệu đồng bộ với VTF
              </Typography>
            </Box>
          </Grid>

          {/* Ghi chú */}
          <Grid size={{ xs: 12 }}>
            <Controller
              name='notes'
              control={control}
              render={({ field }) => <TextField {...field} fullWidth label='Ghi chú' multiline rows={3} />}
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
        onConfirm={async (userId, phone) => {
          if (!student) return
          setSavingZalo(true)

          try {
            const res = await studentService.updateStudentZalo(student.id, userId, phone)

            if (res.success && res.data) {
              showNotification('Liên kết Zalo thành công!', 'success')

              // onSaved(res.data as StudentType)
              reset({
                ...defaultValues,
                phoneNumber: res.data.phoneNumber
              })
            } else {
              showNotification(res.message || 'Không thể lưu liên kết Zalo.', 'error')
            }
          } catch (err) {
            logger.error('EditStudentDrawer', 'updateStudentZalo', err)
            showNotification('Đã có lỗi khi lưu liên kết Zalo.', 'error')
          } finally {
            setSavingZalo(false)
          }
        }}
      />
    </Drawer>
  )
}

export default EditStudentDrawer
