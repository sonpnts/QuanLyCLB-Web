'use client'

import { useEffect, useMemo, useState } from 'react'

import Alert from '@mui/material/Alert'
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
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import oneTimeFeeService from '@/services/oneTimeFeeService'
import type { FeeDefinitionType, OneTimeFeeImportResultType } from '@/types/apps/oneTimeFeeTypes'
import { exportToExcel } from '@/utils/exportToExcel'
import { useNotification } from '@/contexts/notificationContext'

type Props = {
  open: boolean
  definitions: FeeDefinitionType[]
  onClose: () => void
  onImported: () => void
}

const normalizeFeeCode = (feeCode: string) => String(feeCode || '').trim().toUpperCase()

const ImportOneTimeFeePaidDialog = ({ open, definitions, onClose, onImported }: Props) => {
  const { showNotification } = useNotification()
  const [feeCode, setFeeCode] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<OneTimeFeeImportResultType | null>(null)

  const selectableDefinitions = useMemo(
    () =>
      definitions
        .filter(definition => definition.isActive)
        .sort((left, right) => left.name.localeCompare(right.name, 'vi')),
    [definitions]
  )

  useEffect(() => {
    if (!open) return

    setFeeCode(selectableDefinitions[0]?.feeCode || '')
    setFile(null)
    setResult(null)
    setLoading(false)
  }, [open, selectableDefinitions])

  const canSubmit = Boolean(feeCode && file && !loading)

  const selectedDefinition = selectableDefinitions.find(item => normalizeFeeCode(item.feeCode) === normalizeFeeCode(feeCode))

  const handleDownloadTemplate = () => {
    exportToExcel({
      filename: `mau-import-da-dong-${normalizeFeeCode(feeCode || 'phi_1_lan')}`,
      sheetName: 'ImportPhi1Lan',
      columns: [
        { header: 'MaHocVien', accessor: 'studentCode', width: 24 },
        { header: 'GhiChu', accessor: 'note', width: 36 }
      ],
      rows: [
        {
          studentCode: 'HV001',
          note: 'Đã nộp ngoài hệ thống'
        }
      ]
    })
  }

  const handleImport = async () => {
    if (!file || !feeCode) return

    setLoading(true)
    setResult(null)

    const response = await oneTimeFeeService.importPaidStatuses(feeCode, file)

    setLoading(false)

    if (!response.success || !response.data) {
      showNotification(response.message || 'Không thể import danh sách đã đóng phí.', 'error')
      
return
    }

    setResult(response.data)
    showNotification(response.message || 'Đã import trạng thái đã đóng phí.', 'success')
    onImported()
  }

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth='md' fullWidth>
      <DialogTitle>Upload học viên đã đóng phí 1 lần</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ pt: 1 }}>
          <Alert severity='info'>
            Chọn loại phí trước khi upload. File Excel nhận cột <strong>Mã học viên</strong> ở cột đầu tiên; cột
            <strong> Ghi chú</strong> là tùy chọn.
          </Alert>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems={{ xs: 'stretch', md: 'center' }}>
            <FormControl fullWidth>
              <InputLabel>Loại phí</InputLabel>
              <Select value={feeCode} label='Loại phí' onChange={event => setFeeCode(String(event.target.value))}>
                {selectableDefinitions.map(definition => (
                  <MenuItem key={definition.feeCode} value={definition.feeCode}>
                    {definition.name} ({definition.feeCode})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label='Loại phí đang chọn'
              value={selectedDefinition ? `${selectedDefinition.name} (${selectedDefinition.feeCode})` : ''}
              InputProps={{ readOnly: true }}
            />
          </Stack>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'stretch', md: 'center' }}>
            <Button variant='outlined' onClick={handleDownloadTemplate} disabled={!feeCode}>
              Tải file mẫu
            </Button>

            <Button variant='outlined' component='label'>
              Chọn file Excel
              <input
                hidden
                type='file'
                accept='.xlsx'
                onChange={event => setFile(event.target.files && event.target.files.length > 0 ? event.target.files[0] : null)}
              />
            </Button>

            <Typography variant='body2' color='text.secondary'>
              {file?.name || 'Chưa chọn file'}
            </Typography>
          </Stack>

          {result && (
            <Stack spacing={2}>
              <Typography variant='subtitle2'>
                Tổng dòng: {result.totalRows} | Cập nhật: {result.importedRows} | Bỏ qua: {result.skippedRows}
              </Typography>

              <Table size='small'>
                <TableHead>
                  <TableRow>
                    <TableCell>Dòng</TableCell>
                    <TableCell>Mã học viên</TableCell>
                    <TableCell>Học viên</TableCell>
                    <TableCell>Trạng thái</TableCell>
                    <TableCell>Chi tiết</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {result.rows.slice(0, 100).map(row => (
                    <TableRow key={`${row.rowNumber}-${row.studentCode || 'empty'}`}>
                      <TableCell>{row.rowNumber}</TableCell>
                      <TableCell>{row.studentCode || '-'}</TableCell>
                      <TableCell>{row.studentName || '-'}</TableCell>
                      <TableCell>{row.status}</TableCell>
                      <TableCell>{row.message}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Stack>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading} variant='outlined'>
          Đóng
        </Button>
        <Button
          variant='contained'
          onClick={handleImport}
          disabled={!canSubmit}
          startIcon={loading ? <CircularProgress size={18} color='inherit' /> : <i className='ri-upload-2-line' />}
        >
          Upload đã đóng
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ImportOneTimeFeePaidDialog
