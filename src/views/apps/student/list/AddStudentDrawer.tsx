'use client'
import { logger } from '@/utils/logger'

// React Imports
import { useEffect, useState } from 'react'

// MUI Imports
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import Drawer from '@mui/material/Drawer'
import FormControl from '@mui/material/FormControl'
import Grid from '@mui/material/Grid2'
import IconButton from '@mui/material/IconButton'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

// Type Imports
import type { StudentType } from '@/types/apps/studentTypes'
import type { ClassType } from '@/types/apps/classTypes'

// Service Imports
import studentService from '@/services/studentService'

// Context Imports
import { useNotification } from '@/contexts/notificationContext'

// Components
import MemberCodeField from '@/components/member/MemberCodeField'
import type { MemberInfo } from '@/components/member/MemberCodeField'

type Props = {
  open: boolean
  handleClose: () => void
  setData: React.Dispatch<React.SetStateAction<StudentType[]>>
  classOptions?: ClassType[]
  requireClassEnrollment?: boolean
  onStudentCreated?: () => void
}

const initialForm = {
  code: '',
  fullName: '',
  phoneNumber: '',
  address: '',
  dateOfBirth: '',
  gender: '',
  notes: ''
}

const AddStudentDrawer = ({
  open,
  handleClose,
  setData,
  classOptions = [],
  requireClassEnrollment = false,
  onStudentCreated
}: Props) => {
  const [formData, setFormData] = useState(initialForm)
  const [selectedClassId, setSelectedClassId] = useState('')
  const [loading, setLoading] = useState(false)

  const { showNotification } = useNotification()

  useEffect(() => {
    if (open && requireClassEnrollment && classOptions.length === 1) {
      setSelectedClassId(classOptions[0].id)
    }
  }, [classOptions, open, requireClassEnrollment])

  const handleReset = () => {
    setFormData(initialForm)
    setSelectedClassId('')
    handleClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.fullName.trim()) {
      showNotification('Vui lòng nhập họ tên học viên.', 'error')

      return
    }

    if (requireClassEnrollment && !selectedClassId) {
      showNotification('Vui lòng chọn lớp cho học viên.', 'error')

      return
    }

    try {
      setLoading(true)

      const response = await studentService.createStudent({
        code: formData.code || undefined,
        fullName: formData.fullName,
        phoneNumber: formData.phoneNumber || undefined,
        address: formData.address || undefined,
        dateOfBirth: formData.dateOfBirth || undefined,
        gender: formData.gender !== '' ? formData.gender === 'true' : undefined,
        notes: formData.notes || undefined
      })

      if (response.success && response.data) {
        let createdStudent = response.data as StudentType

        if (selectedClassId) {
          const enrollResponse = await studentService.enrollStudent({
            studentId: createdStudent.id,
            classId: selectedClassId,
            enrollmentDate: new Date().toISOString().split('T')[0]
          })

          if (!enrollResponse.success) {
            showNotification(enrollResponse.message || 'Đã tạo học viên nhưng chưa thêm được vào lớp.', 'warning')
          } else {
            const selectedClass = classOptions.find(cls => cls.id === selectedClassId)

            createdStudent = {
              ...createdStudent,
              classes: selectedClass
                ? [
                    ...(createdStudent.classes || []),
                    {
                      classId: selectedClass.id,
                      className: selectedClass.name,
                      enrollmentId: enrollResponse.data?.id || '',
                      enrollmentDate: enrollResponse.data?.enrollmentDate,
                      status: enrollResponse.data?.status || 'Active'
                    }
                  ]
                : createdStudent.classes
            }
          }
        }

        setData(prev => [...prev, createdStudent])
        showNotification('Thêm học viên thành công!', 'success')
        onStudentCreated?.()
        handleReset()
      } else {
        showNotification(response.message || 'Không thể thêm học viên.', 'error')
      }
    } catch (error) {
      logger.error('AddStudentDrawer', 'Error creating student', error)
      showNotification('Đã có lỗi khi thêm học viên.', 'error')
    } finally {
      setLoading(false)
    }
  }

  /** Áp dụng thông tin từ liên đoàn vào form */
  const handleMemberInfoConfirmed = (info: MemberInfo) => {
    setFormData(prev => ({
      ...prev,
      fullName: info.fullName || prev.fullName,
      gender: info.gender !== undefined ? String(info.gender) : prev.gender,
      dateOfBirth: info.dateOfBirth || prev.dateOfBirth,
      phoneNumber: info.phoneNumber || prev.phoneNumber,
      address: info.address || prev.address
    }))
    showNotification('Đã áp dụng thông tin từ liên đoàn.', 'info')
  }

  // Sau khi nhập mã HV và lưu, trong quá trình thêm mới: chưa khoá (chỉ khoá sau khi đã lưu)
  // Trường hợp khoá áp dụng cho EditStudentDrawer

  return (
    <Drawer
      open={open}
      anchor='right'
      variant='temporary'
      onClose={handleReset}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: { xs: 300, sm: 460 } } }}
    >
      <div className='flex items-center justify-between pli-5 plb-4'>
        <Typography variant='h5'>Thêm học viên mới</Typography>
        <IconButton size='small' onClick={handleReset}>
          <i className='ri-close-line text-2xl' />
        </IconButton>
      </div>
      <Divider />
      <div className='p-5'>
        <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
          {/* Mã HV – với kính lúp tìm kiếm và preview */}
          <MemberCodeField
            value={formData.code}
            onChange={code => setFormData(prev => ({ ...prev, code }))}
            onMemberInfoConfirmed={handleMemberInfoConfirmed}
            locked={false}
          />

          {classOptions.length > 0 && (
            <FormControl fullWidth required={requireClassEnrollment}>
              <InputLabel>Lớp</InputLabel>
              <Select
                label='Lớp'
                value={selectedClassId}
                onChange={e => setSelectedClassId(e.target.value)}
              >
                {!requireClassEnrollment && <MenuItem value=''>Chưa ghi danh lớp</MenuItem>}
                {classOptions.map(cls => (
                  <MenuItem key={cls.id} value={cls.id}>
                    {cls.name} ({cls.code})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
              <TextField
                label='Họ và tên *'
                fullWidth
                value={formData.fullName}
                onChange={e => setFormData({ ...formData, fullName: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label='Số điện thoại'
                fullWidth
                value={formData.phoneNumber}
                onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                label='Địa chỉ'
                fullWidth
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label='Ngày sinh'
                type='date'
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={formData.dateOfBirth}
                onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Giới tính</InputLabel>
                <Select
                  label='Giới tính'
                  value={formData.gender}
                  onChange={e => setFormData({ ...formData, gender: e.target.value })}
                >
                  <MenuItem value=''>Chọn giới tính</MenuItem>
                  <MenuItem value='true'>Nam</MenuItem>
                  <MenuItem value='false'>Nữ</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                label='Ghi chú'
                fullWidth
                multiline
                rows={3}
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
              />
            </Grid>
          </Grid>

          <div className='flex items-center gap-4 mt-2'>
            <Button variant='contained' type='submit' disabled={loading}>
              {loading ? 'Đang xử lý...' : 'Thêm mới'}
            </Button>
            <Button variant='outlined' color='error' onClick={handleReset} disabled={loading}>
              Hủy
            </Button>
          </div>
        </form>
      </div>
    </Drawer>
  )
}

export default AddStudentDrawer
