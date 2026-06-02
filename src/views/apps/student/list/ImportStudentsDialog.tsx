'use client'

import { useEffect, useMemo, useState } from 'react'

import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'

import type { ClassType } from '@/types/apps/classTypes'
import studentService, { type StudentImportResult } from '@/services/studentService'
import { useNotification } from '@/contexts/notificationContext'

type Props = {
  open: boolean
  onClose: () => void
  onImported: () => void
  classOptions?: ClassType[]
}

const ImportStudentsDialog = ({ open, onClose, onImported, classOptions = [] }: Props) => {
  const { showNotification } = useNotification()
  const [classId, setClassId] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<StudentImportResult | null>(null)

  useEffect(() => {
    if (!open) return

    setResult(null)
    setFile(null)

    if (classOptions.length === 1) {
      setClassId(classOptions[0].id)
    } else if (!classOptions.some(item => item.id === classId)) {
      setClassId(classOptions[0]?.id || '')
    }
  }, [classId, classOptions, open])

  const canSubmit = useMemo(() => !!classId && !!file && !loading, [classId, file, loading])

  const handleDownloadTemplate = async () => {
    const res = await studentService.downloadImportTemplate()

    if (!res.success || !res.data) {
      showNotification(res.message || 'Không thể tải file mẫu', 'error')

      return
    }

    const url = window.URL.createObjectURL(res.data)
    const anchor = document.createElement('a')

    anchor.href = url
    anchor.download = 'student-import-template.xlsx'
    anchor.click()
    window.URL.revokeObjectURL(url)
  }

  const handleImport = async () => {
    if (!file || !classId) return

    setLoading(true)
    setResult(null)

    const res = await studentService.importStudents(classId, file)

    setLoading(false)

    if (!res.success || !res.data) {
      showNotification(res.message || 'Import thất bại', 'error')

      return
    }

    setResult(res.data)
    showNotification(res.message || 'Import thành công', 'success')
    onImported()
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth>
      <DialogTitle>Import học viên từ Excel</DialogTitle>
      <DialogContent>
        <Typography variant='body2' color='text.secondary' className='mb-3'>
          Chọn lớp để tạo học viên đúng phạm vi được phân công và gửi kèm khi import.
        </Typography>

        <div className='mb-4 flex flex-wrap items-center gap-3'>
          <FormControl size='small' sx={{ minWidth: 260 }}>
            <InputLabel>Lớp</InputLabel>
            <Select value={classId} label='Lớp' onChange={event => setClassId(event.target.value)} disabled={classOptions.length === 0}>
              {classOptions.length === 0 ? (
                <MenuItem disabled value=''>
                  Không có lớp khả dụng
                </MenuItem>
              ) : (
                classOptions.map(item => (
                  <MenuItem key={item.id} value={item.id}>
                    {item.name} ({item.code})
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>

          <Button variant='outlined' onClick={handleDownloadTemplate}>
            Tải file mẫu
          </Button>

          <Button variant='outlined' component='label' disabled={classOptions.length === 0}>
            Chọn file Excel
            <input
              hidden
              type='file'
              accept='.xlsx'
              onChange={event => setFile(event.target.files && event.target.files.length > 0 ? event.target.files[0] : null)}
            />
          </Button>
          <Typography variant='body2'>{file?.name || 'Chưa chọn file'}</Typography>
        </div>

        {result && (
          <>
            <Typography variant='subtitle2' className='mb-2'>
              Tổng dòng: {result.totalRows} | Tạo mới: {result.createdStudents} | Ghi danh: {result.enrolledStudents} | Bỏ qua:{' '}
              {result.skippedRows}
            </Typography>
            <Table size='small'>
              <TableHead>
                <TableRow>
                  <TableCell>Dòng</TableCell>
                  <TableCell>Mã</TableCell>
                  <TableCell>Họ tên</TableCell>
                  <TableCell>Trạng thái</TableCell>
                  <TableCell>Chi tiết</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {result.rows.slice(0, 50).map(row => (
                  <TableRow key={`${row.rowNumber}-${row.code}`}>
                    <TableCell>{row.rowNumber}</TableCell>
                    <TableCell>{row.code}</TableCell>
                    <TableCell>{row.fullName}</TableCell>
                    <TableCell>{row.status}</TableCell>
                    <TableCell>{row.message}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Đóng</Button>
        <Button variant='contained' onClick={handleImport} disabled={!canSubmit}>
          {loading ? <CircularProgress size={18} /> : 'Import'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ImportStudentsDialog
