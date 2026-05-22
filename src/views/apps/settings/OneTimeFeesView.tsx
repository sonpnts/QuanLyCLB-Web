'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { useRouter } from 'next/navigation'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControlLabel from '@mui/material/FormControlLabel'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import { useNotification } from '@/contexts/notificationContext'
import branchService from '@/services/branchService'
import oneTimeFeeService from '@/services/oneTimeFeeService'
import type { BranchType } from '@/types/apps/branchTypes'
import type { FeeDefinitionType, FeePriceType } from '@/types/apps/oneTimeFeeTypes'
import ImportOneTimeFeePaidDialog from './ImportOneTimeFeePaidDialog'

const BRANCH_SCOPED_FEE_CODES = new Set(['CSVC'])

const normalizeFeeCode = (feeCode: string) => String(feeCode || '').trim().toUpperCase()

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amount)

type FeeDialogState = {
  open: boolean
  mode: 'create' | 'edit'
  feeCode: string
  originalFeeCode: string
  name: string
  description: string
  amount: string
  isRequiredForExam: boolean
  isActive: boolean
}

const createEmptyDialogState = (): FeeDialogState => ({
  open: false,
  mode: 'create',
  feeCode: '',
  originalFeeCode: '',
  name: '',
  description: '',
  amount: '0',
  isRequiredForExam: false,
  isActive: true
})

const parseAmount = (value: string) => {
  const normalized = value.replace(/,/g, '').trim()
  if (!normalized) return 0

  return Number(normalized)
}

const OneTimeFeesView = () => {
  const router = useRouter()
  const { showNotification } = useNotification()

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [definitions, setDefinitions] = useState<FeeDefinitionType[]>([])
  const [prices, setPrices] = useState<FeePriceType[]>([])
  const [branches, setBranches] = useState<BranchType[]>([])
  const [dialog, setDialog] = useState<FeeDialogState>(createEmptyDialogState())
  const [importDialogOpen, setImportDialogOpen] = useState(false)

  const latestGlobalPriceByFeeCode = useMemo(() => {
    return prices.reduce<Record<string, FeePriceType>>((accumulator, price) => {
      const normalizedFeeCode = normalizeFeeCode(price.feeCode)

      if (price.scopeType !== 'Global' || !price.isActive) {
        return accumulator
      }

      const current = accumulator[normalizedFeeCode]

      if (!current || new Date(price.effectiveFrom).getTime() > new Date(current.effectiveFrom).getTime()) {
        accumulator[normalizedFeeCode] = price
      }

      return accumulator
    }, {})
  }, [prices])

  const latestCsvcPriceByBranchId = useMemo(() => {
    return prices.reduce<Record<string, FeePriceType>>((accumulator, price) => {
      const normalizedFeeCode = normalizeFeeCode(price.feeCode)
      const branchId = price.scopeId || ''

      if (normalizedFeeCode !== 'CSVC' || price.scopeType !== 'Branch' || !price.isActive || !branchId) {
        return accumulator
      }

      const current = accumulator[branchId]

      if (!current || new Date(price.effectiveFrom).getTime() > new Date(current.effectiveFrom).getTime()) {
        accumulator[branchId] = price
      }

      return accumulator
    }, {})
  }, [prices])

  const globalDefinitions = useMemo(() => {
    return definitions
      .filter(definition => !BRANCH_SCOPED_FEE_CODES.has(normalizeFeeCode(definition.feeCode)))
      .sort((left, right) => left.name.localeCompare(right.name, 'vi'))
  }, [definitions])

  const filteredDefinitions = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) return globalDefinitions

    return globalDefinitions.filter(definition => {
      return (
        definition.name.toLowerCase().includes(keyword) ||
        definition.feeCode.toLowerCase().includes(keyword) ||
        String(definition.description || '').toLowerCase().includes(keyword)
      )
    })
  }, [globalDefinitions, search])

  const csvcRows = useMemo(() => {
    return [...branches]
      .sort((left, right) => left.name.localeCompare(right.name, 'vi'))
      .map(branch => ({
        branch,
        price: latestCsvcPriceByBranchId[branch.id] || null
      }))
  }, [branches, latestCsvcPriceByBranchId])

  const loadData = useCallback(async () => {
    try {
      setLoading(true)

      const [definitionsResponse, pricesResponse, branchesResponse] = await Promise.all([
        oneTimeFeeService.getDefinitions(),
        oneTimeFeeService.getPrices(),
        branchService.getBranches({ IsActive: true, PageSize: 1000 })
      ])

      if (!definitionsResponse.success) {
        showNotification(definitionsResponse.message || 'Không thể tải danh sách khoản phí.', 'error')
        return
      }

      if (!branchesResponse.success) {
        showNotification(branchesResponse.message || 'Không thể tải danh sách chi nhánh.', 'error')
        return
      }

      setDefinitions(definitionsResponse.data || [])
      setPrices(pricesResponse.success ? pricesResponse.data || [] : [])
      setBranches(branchesResponse.data || [])
    } catch {
      showNotification('Đã có lỗi khi tải cấu hình phí 1 lần.', 'error')
    } finally {
      setLoading(false)
    }
  }, [showNotification])

  useEffect(() => {
    loadData()
  }, [loadData])

  const openCreateDialog = () => {
    setDialog({
      ...createEmptyDialogState(),
      open: true,
      mode: 'create'
    })
  }

  const openEditDialog = (definition: FeeDefinitionType) => {
    const feeCode = normalizeFeeCode(definition.feeCode)
    const price = latestGlobalPriceByFeeCode[feeCode]

    setDialog({
      open: true,
      mode: 'edit',
      feeCode,
      originalFeeCode: feeCode,
      name: definition.name || '',
      description: definition.description || '',
      amount: String(price?.amount ?? 0),
      isRequiredForExam: Boolean(definition.isRequiredForExam),
      isActive: Boolean(definition.isActive)
    })
  }

  const closeDialog = () => {
    if (saving) return
    setDialog(createEmptyDialogState())
  }

  const handleSave = async () => {
    const normalizedFeeCode = normalizeFeeCode(dialog.feeCode)
    const amount = parseAmount(dialog.amount)

    if (!normalizedFeeCode) {
      showNotification('Vui lòng nhập mã khoản phí.', 'error')
      return
    }

    if (BRANCH_SCOPED_FEE_CODES.has(normalizedFeeCode)) {
      showNotification('Phí CSVC được cấu hình riêng theo chi nhánh, không thêm ở đây.', 'error')
      return
    }

    if (!dialog.name.trim()) {
      showNotification('Vui lòng nhập tên khoản phí.', 'error')
      return
    }

    if (!/^[A-Z0-9_]+$/.test(normalizedFeeCode)) {
      showNotification('Mã khoản phí chỉ được gồm chữ in hoa, số và dấu gạch dưới.', 'error')
      return
    }

    if (amount < 0 || Number.isNaN(amount)) {
      showNotification('Số tiền phải lớn hơn hoặc bằng 0.', 'error')
      return
    }

    try {
      setSaving(true)

      if (dialog.mode === 'create') {
        const createDefinitionResponse = await oneTimeFeeService.createDefinition({
          feeCode: normalizedFeeCode,
          name: dialog.name.trim(),
          description: dialog.description.trim() || null,
          isRequiredForExam: dialog.isRequiredForExam,
          isActive: dialog.isActive
        })

        if (!createDefinitionResponse.success) {
          showNotification(createDefinitionResponse.message || 'Không thể tạo khoản phí mới.', 'error')
          return
        }
      } else {
        const updateDefinitionResponse = await oneTimeFeeService.updateDefinition(dialog.originalFeeCode, {
          name: dialog.name.trim(),
          description: dialog.description.trim() || null,
          isRequiredForExam: dialog.isRequiredForExam,
          isActive: dialog.isActive
        })

        if (!updateDefinitionResponse.success) {
          showNotification(updateDefinitionResponse.message || 'Không thể cập nhật khoản phí.', 'error')
          return
        }
      }

      const priceResponse = await oneTimeFeeService.upsertPrice({
        feeCode: dialog.mode === 'create' ? normalizedFeeCode : dialog.originalFeeCode,
        scopeType: 'Global',
        scopeId: null,
        amount
      })

      if (!priceResponse.success) {
        showNotification(priceResponse.message || 'Không thể cập nhật mức phí.', 'error')
        return
      }

      showNotification(dialog.mode === 'create' ? 'Đã thêm khoản phí mới.' : 'Đã cập nhật khoản phí.', 'success')
      closeDialog()
      await loadData()
    } catch {
      showNotification('Đã có lỗi khi lưu khoản phí.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Stack spacing={4}>
      <Card>
        <CardHeader
          title='Quản lý phí 1 lần'
          subheader='Danh sách này dùng để quản lý các khoản phí 1 lần toàn hệ thống. Phí CSVC được tách riêng theo từng chi nhánh.'
          action={
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <Button variant='outlined' onClick={() => setImportDialogOpen(true)} startIcon={<i className='ri-upload-2-line' />}>
                Upload đã đóng
              </Button>
              <Button variant='contained' onClick={openCreateDialog} startIcon={<i className='ri-add-line' />}>
                Thêm khoản phí
              </Button>
            </Stack>
          }
        />
        <CardContent>
          <Stack spacing={3}>
            <Alert severity='info'>
              Các khoản trong danh sách này sẽ dùng chung toàn hệ thống khi thu tiền. Nếu cần chỉnh phí CSVC, vui lòng chỉnh ở phần chi nhánh bên dưới.
            </Alert>

            <TextField
              fullWidth
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder='Tìm theo tên khoản phí, mã phí hoặc mô tả'
              label='Tìm kiếm khoản phí'
            />

            {loading ? (
              <Box className='flex items-center justify-center py-10'>
                <CircularProgress />
              </Box>
            ) : filteredDefinitions.length === 0 ? (
              <Alert severity='info'>Chưa có khoản phí nào trong danh sách này.</Alert>
            ) : (
              <TableContainer sx={{ overflowX: 'auto' }}>
                <Table sx={{ minWidth: 880 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Tên khoản phí</TableCell>
                      <TableCell>Mã phí</TableCell>
                      <TableCell>Mức thu</TableCell>
                      <TableCell>Bắt buộc trước khi thi</TableCell>
                      <TableCell>Trạng thái</TableCell>
                      <TableCell>Mô tả</TableCell>
                      <TableCell align='right'>Thao tác</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredDefinitions.map(definition => {
                      const feeCode = normalizeFeeCode(definition.feeCode)
                      const amount = latestGlobalPriceByFeeCode[feeCode]?.amount ?? 0

                      return (
                        <TableRow hover key={definition.feeCode}>
                          <TableCell>
                            <Typography fontWeight={600}>{definition.name}</Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label={definition.feeCode} size='small' variant='tonal' color='secondary' />
                          </TableCell>
                          <TableCell>{formatCurrency(Number(amount || 0))}</TableCell>
                          <TableCell>
                            <Chip
                              label={definition.isRequiredForExam ? 'Có' : 'Không'}
                              size='small'
                              color={definition.isRequiredForExam ? 'warning' : 'default'}
                              variant={definition.isRequiredForExam ? 'filled' : 'tonal'}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={definition.isActive ? 'Đang áp dụng' : 'Ngưng áp dụng'}
                              size='small'
                              color={definition.isActive ? 'success' : 'default'}
                              variant={definition.isActive ? 'filled' : 'tonal'}
                            />
                          </TableCell>
                          <TableCell sx={{ maxWidth: 320 }}>
                            <Typography variant='body2' color='text.secondary'>
                              {definition.description || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell align='right'>
                            <Button variant='outlined' size='small' onClick={() => openEditDialog(definition)}>
                              Chỉnh sửa
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          title='Phí CSVC theo chi nhánh'
          subheader='Phần này được tách riêng để mỗi chi nhánh có mức phí CSVC độc lập, không gộp vào danh sách phí 1 lần toàn hệ thống.'
          action={
            <Button variant='outlined' onClick={() => router.push('/apps/branch/list')} startIcon={<i className='ri-building-line' />}>
              Mở quản lý chi nhánh
            </Button>
          }
        />
        <CardContent>
          {loading ? (
            <Box className='flex items-center justify-center py-10'>
              <CircularProgress />
            </Box>
          ) : csvcRows.length === 0 ? (
            <Alert severity='info'>Chưa có chi nhánh nào để cấu hình phí CSVC.</Alert>
          ) : (
            <Stack spacing={2}>
              <Alert severity='info'>
                Muốn thay đổi mức phí CSVC của một cơ sở, hãy mở màn Chi nhánh rồi sửa trực tiếp trên chi nhánh đó.
              </Alert>

              <TableContainer sx={{ overflowX: 'auto' }}>
                <Table sx={{ minWidth: 720 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Chi nhánh</TableCell>
                      <TableCell>Địa chỉ</TableCell>
                      <TableCell>Mức phí CSVC</TableCell>
                      <TableCell>Hiệu lực từ</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {csvcRows.map(({ branch, price }) => (
                      <TableRow hover key={branch.id}>
                        <TableCell>
                          <Typography fontWeight={600}>{branch.name}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant='body2' color='text.secondary'>
                            {branch.address || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>{formatCurrency(Number(price?.amount || 0))}</TableCell>
                        <TableCell>{price?.effectiveFrom ? new Date(price.effectiveFrom).toLocaleDateString('vi-VN') : '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Stack>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialog.open} onClose={closeDialog} fullWidth maxWidth='sm'>
        <DialogTitle>{dialog.mode === 'create' ? 'Thêm khoản phí 1 lần' : 'Chỉnh sửa khoản phí 1 lần'}</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label='Mã khoản phí'
              value={dialog.feeCode}
              onChange={event => setDialog(prev => ({ ...prev, feeCode: event.target.value.toUpperCase() }))}
              helperText='Ví dụ: CODE_CHANGE, ENTRY_FEE, UNIFORM_FEE'
              disabled={dialog.mode === 'edit'}
            />

            <TextField
              fullWidth
              label='Tên khoản phí'
              value={dialog.name}
              onChange={event => setDialog(prev => ({ ...prev, name: event.target.value }))}
            />

            <TextField
              fullWidth
              label='Mức thu (đ)'
              type='number'
              value={dialog.amount}
              onChange={event => setDialog(prev => ({ ...prev, amount: event.target.value }))}
              helperText='0đ sẽ tự ẩn khỏi màn thu tiền.'
            />

            <TextField
              fullWidth
              label='Mô tả'
              value={dialog.description}
              onChange={event => setDialog(prev => ({ ...prev, description: event.target.value }))}
              multiline
              minRows={3}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={dialog.isRequiredForExam}
                  onChange={event => setDialog(prev => ({ ...prev, isRequiredForExam: event.target.checked }))}
                />
              }
              label='Bắt buộc hoàn thành trước khi đăng ký thi'
            />

            <FormControlLabel
              control={
                <Switch
                  checked={dialog.isActive}
                  onChange={event => setDialog(prev => ({ ...prev, isActive: event.target.checked }))}
                />
              }
              label='Đang áp dụng'
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog} disabled={saving} variant='outlined'>
            Hủy
          </Button>
          <Button onClick={handleSave} disabled={saving} variant='contained' startIcon={saving ? <CircularProgress size={18} color='inherit' /> : <i className='ri-save-line' />}>
            {dialog.mode === 'create' ? 'Thêm khoản phí' : 'Lưu thay đổi'}
          </Button>
        </DialogActions>
      </Dialog>

      <ImportOneTimeFeePaidDialog
        open={importDialogOpen}
        definitions={definitions}
        onClose={() => setImportDialogOpen(false)}
        onImported={loadData}
      />
    </Stack>
  )
}

export default OneTimeFeesView
