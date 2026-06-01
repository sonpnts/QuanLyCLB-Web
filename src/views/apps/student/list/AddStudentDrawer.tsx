'use client'

import { useEffect, useState } from 'react'

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

import type { ClassType } from '@/types/apps/classTypes'
import type { StudentType } from '@/types/apps/studentTypes'
import studentService from '@/services/studentService'
import { useNotification } from '@/contexts/notificationContext'
import MemberCodeField from '@/components/member/MemberCodeField'
import type { MemberInfo } from '@/components/member/MemberCodeField'
import StudentZaloLinkPromptDialog from '@/components/student/StudentZaloLinkPromptDialog'
import { logger } from '@/utils/logger'

type Props = {
  open: boolean
  handleClose: () => void
  setData: React.Dispatch<React.SetStateAction<StudentType[]>>
  classOptions?: ClassType[]
  onStudentCreated?: () => void
}

const initialForm = {
  code: '',
  fullName: '',
  phoneNumber: '',
  personalIdNumber: '',
  address: '',
  dateOfBirth: '',
  educationLevel: '',
  gender: '',
  notes: ''
}

const AddStudentDrawer = ({ open, handleClose, setData, classOptions = [], onStudentCreated }: Props) => {
  const [formData, setFormData] = useState(initialForm)
  const [selectedClassId, setSelectedClassId] = useState('')
  const [loading, setLoading] = useState(false)
  const [zaloPromptOpen, setZaloPromptOpen] = useState(false)
  const [zaloPromptStudent, setZaloPromptStudent] = useState<StudentType | null>(null)

  const { showNotification } = useNotification()

  useEffect(() => {
    if (!open) return

    if (classOptions.length === 1) {
      setSelectedClassId(classOptions[0].id)

      return
    }

    if (selectedClassId && !classOptions.some(cls => cls.id === selectedClassId)) {
      setSelectedClassId('')
    }
  }, [classOptions, open, selectedClassId])

  const handleReset = () => {
    setFormData(initialForm)
    setSelectedClassId('')
    handleClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!classOptions.length) {
      showNotification('Chua co lop hoc kha dung de tao hoc vien.', 'error')

      return
    }

    if (!selectedClassId) {
      showNotification('Vui long chon lop cho hoc vien.', 'error')

      return
    }

    if (!formData.fullName.trim()) {
      showNotification('Vui long nhap ho ten hoc vien.', 'error')

      return
    }

    if (!formData.educationLevel) {
      showNotification('Vui long chon trinh do hoc van.', 'error')

      return
    }

    try {
      setLoading(true)

      const response = await studentService.createStudent({
        classId: selectedClassId,
        code: formData.code || undefined,
        fullName: formData.fullName.trim(),
        phoneNumber: formData.phoneNumber || undefined,
        personalIdNumber: formData.personalIdNumber || undefined,
        address: formData.address || undefined,
        dateOfBirth: formData.dateOfBirth || undefined,
        educationLevel: formData.educationLevel,
        gender: formData.gender !== '' ? formData.gender === 'true' : undefined,
        notes: formData.notes || undefined
      })

      if (response.success && response.data) {
        const createdStudent = response.data

        setData(prev => [...prev, createdStudent])
        showNotification('Them hoc vien thanh cong!', 'success')
        onStudentCreated?.()
        handleReset()

        if (!createdStudent.userIdZalo?.trim()) {
          setZaloPromptStudent(createdStudent)
          setZaloPromptOpen(true)
        }
      } else {
        showNotification(response.message || 'Khong the them hoc vien.', 'error')
      }
    } catch (error) {
      logger.error('AddStudentDrawer', 'Error creating student', error)
      showNotification('Da co loi khi them hoc vien.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleMemberInfoConfirmed = (info: MemberInfo) => {
    setFormData(prev => ({
      ...prev,
      fullName: info.fullName || prev.fullName,
      gender: info.gender !== undefined ? String(info.gender) : prev.gender,
      dateOfBirth: info.dateOfBirth || prev.dateOfBirth,
      phoneNumber: info.phoneNumber || prev.phoneNumber,
      personalIdNumber: info.personalIdNumber || prev.personalIdNumber,
      address: info.address || prev.address
    }))

    showNotification('Da ap dung thong tin tu lien doan.', 'info')
  }

  return (
    <>
      <Drawer
        open={open}
        anchor='right'
        variant='temporary'
        onClose={handleReset}
        ModalProps={{ keepMounted: true }}
        sx={{ '& .MuiDrawer-paper': { width: { xs: 300, sm: 460 } } }}
      >
        <div className='flex items-center justify-between pli-5 plb-4'>
          <Typography variant='h5'>Them hoc vien moi</Typography>
          <IconButton size='small' onClick={handleReset}>
            <i className='ri-close-line text-2xl' />
          </IconButton>
        </div>
        <Divider />
        <div className='p-5'>
          <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
            <MemberCodeField
              value={formData.code}
              onChange={code => setFormData(prev => ({ ...prev, code }))}
              onMemberInfoConfirmed={handleMemberInfoConfirmed}
              locked={false}
              active={open}
            />

            <FormControl fullWidth required disabled={!classOptions.length}>
              <InputLabel>Lop</InputLabel>
              <Select label='Lop' value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)}>
                {classOptions.map(cls => (
                  <MenuItem key={cls.id} value={cls.id}>
                    {cls.name} ({cls.code})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Grid container spacing={3}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label='Ho va ten *'
                  fullWidth
                  value={formData.fullName}
                  onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label='CCCD / So dinh danh ca nhan'
                  fullWidth
                  value={formData.personalIdNumber}
                  onChange={e => setFormData({ ...formData, personalIdNumber: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label='Dia chi'
                  fullWidth
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label='Ngay sinh'
                  type='date'
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={formData.dateOfBirth}
                  onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth required>
                  <InputLabel>Trinh do hoc van</InputLabel>
                  <Select
                    label='Trinh do hoc van'
                    value={formData.educationLevel}
                    onChange={e => setFormData({ ...formData, educationLevel: e.target.value })}
                  >
                    <MenuItem value=''>Chon trinh do</MenuItem>
                    <MenuItem value='THCS'>THCS</MenuItem>
                    <MenuItem value='THPT'>THPT</MenuItem>
                    <MenuItem value='TieuHoc'>Tieu hoc</MenuItem>
                    <MenuItem value='ChuaDiHoc'>Chua di hoc</MenuItem>
                    <MenuItem value='TrungCap'>Trung cap</MenuItem>
                    <MenuItem value='CaoDang'>Cao dang</MenuItem>
                    <MenuItem value='DaiHoc'>Dai hoc</MenuItem>
                    <MenuItem value='ThacSi'>Thac si</MenuItem>
                    <MenuItem value='TienSi'>Tien si</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Gioi tinh</InputLabel>
                  <Select label='Gioi tinh' value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })}>
                    <MenuItem value=''>Chon gioi tinh</MenuItem>
                    <MenuItem value='true'>Nam</MenuItem>
                    <MenuItem value='false'>Nu</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label='Ghi chu'
                  fullWidth
                  multiline
                  rows={3}
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                />
              </Grid>
            </Grid>

            <div className='mt-2 flex items-center gap-4'>
              <Button variant='contained' type='submit' disabled={loading || !classOptions.length}>
                {loading ? 'Dang xu ly...' : 'Them moi'}
              </Button>
              <Button variant='outlined' color='error' onClick={handleReset} disabled={loading}>
                Huy
              </Button>
            </div>
          </form>
        </div>
      </Drawer>

      <StudentZaloLinkPromptDialog
        open={zaloPromptOpen}
        student={zaloPromptStudent}
        skipLabel='De sau'
        message='Hay them lien ket Zalo cho hoc vien de gui xac nhan thanh toan va cac thong bao sau nay. Chon de sau neu ban chua muon lien ket ngay.'
        onClose={() => {
          setZaloPromptOpen(false)
          setZaloPromptStudent(null)
        }}
        onLinked={updatedStudent => {
          setData(prev => prev.map(item => (item.id === updatedStudent.id ? updatedStudent : item)))
          setZaloPromptStudent(updatedStudent)
        }}
      />
    </>
  )
}

export default AddStudentDrawer
