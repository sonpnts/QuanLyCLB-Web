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

import classService from '@/services/classService'
import studentService, { type StudentImportResult } from '@/services/studentService'
import { useNotification } from '@/contexts/notificationContext'

type Props = {
  open: boolean
  onClose: () => void
  onImported: () => void
}

const ImportStudentsDialog = ({ open, onClose, onImported }: Props) => {
  const { showNotification } = useNotification()
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([])
  const [classId, setClassId] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<StudentImportResult | null>(null)

  useEffect(() => {
    if (!open) return
    ;(async () => {
      const res = await classService.getClasses({ isActive: true, pageSize: 1000 })
      const list = (res.data || []).map(x => ({ id: x.id, name: x.name }))
      setClasses(list)
      if (list.length > 0) setClassId(list[0].id)
    })()
  }, [open])

  const canSubmit = useMemo(() => !!classId && !!file && !loading, [classId, file, loading])

  const handleDownloadTemplate = async () => {
    const res = await studentService.downloadImportTemplate()
    if (!res.success || !res.data) {
      showNotification(res.message || 'Không thể tải file mẫu', 'error')
      return
    }

    const url = window.URL.createObjectURL(res.data)
    const a = document.createElement('a')
    a.href = url
    a.download = 'student-import-template.xlsx'
    a.click()
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
          Tối đa 1000 dòng mỗi file. Chọn lớp để tự động ghi danh sau khi import.
        </Typography>

        <div className='flex items-center gap-3 flex-wrap mb-4'>
          <FormControl size='small' sx={{ minWidth: 260 }}>
            <InputLabel>Lớp</InputLabel>
            <Select value={classId} label='Lớp' onChange={e => setClassId(e.target.value)}>
              {classes.map(c => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button variant='outlined' onClick={handleDownloadTemplate}>
            Tải file mẫu
          </Button>

          <Button variant='outlined' component='label'>
            Chọn file Excel
            <input
              hidden
              type='file'
              accept='.xlsx'
              onChange={e => setFile(e.target.files && e.target.files.length > 0 ? e.target.files[0] : null)}
            />
          </Button>
          <Typography variant='body2'>{file?.name || 'Chưa chọn file'}</Typography>
        </div>

        {result && (
          <>
            <Typography variant='subtitle2' className='mb-2'>
              Tổng dòng: {result.totalRows} | Tạo mới: {result.createdStudents} | Ghi danh: {result.enrolledStudents} |
              Bỏ qua: {result.skippedRows}
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
                {result.rows.slice(0, 50).map(r => (
                  <TableRow key={`${r.rowNumber}-${r.code}`}>
                    <TableCell>{r.rowNumber}</TableCell>
                    <TableCell>{r.code}</TableCell>
                    <TableCell>{r.fullName}</TableCell>
                    <TableCell>{r.status}</TableCell>
                    <TableCell>{r.message}</TableCell>
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

