'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import CircularProgress from '@mui/material/CircularProgress'
import FormControlLabel from '@mui/material/FormControlLabel'
import Grid from '@mui/material/Grid2'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import { useNotification } from '@/contexts/notificationContext'
import oneTimeFeeService from '@/services/oneTimeFeeService'
import type { FeeDefinitionType, FeePriceType } from '@/types/apps/oneTimeFeeTypes'

const BRANCH_SCOPED_FEE_CODES = new Set(['CSVC'])

type FeeFormState = {
  name: string
  description: string
  isRequiredForExam: boolean
  isActive: boolean
  amount: number | string
}

const parseAmount = (value: unknown) => {
  if (typeof value === 'number') return value
  if (typeof value === 'string' && value.trim()) return Number(value.replace(',', '.'))

  return 0
}

const buildFormState = (definition: FeeDefinitionType, price?: FeePriceType): FeeFormState => ({
  name: definition.name || '',
  description: definition.description || '',
  isRequiredForExam: definition.isRequiredForExam ?? false,
  isActive: definition.isActive ?? true,
  amount: price?.amount ?? 0
})

const normalizeFeeCode = (feeCode: string) => String(feeCode || '').trim().toUpperCase()

const OneTimeFeesView = () => {
  const { showNotification } = useNotification()

  const [loading, setLoading] = useState(false)
  const [definitions, setDefinitions] = useState<FeeDefinitionType[]>([])
  const [prices, setPrices] = useState<FeePriceType[]>([])
  const [forms, setForms] = useState<Record<string, FeeFormState>>({})
  const [savingFeeCode, setSavingFeeCode] = useState<string | null>(null)

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

  const sortedDefinitions = useMemo(() => {
    return [...definitions].sort((left, right) => {
      const leftIsBranchScoped = BRANCH_SCOPED_FEE_CODES.has(normalizeFeeCode(left.feeCode))
      const rightIsBranchScoped = BRANCH_SCOPED_FEE_CODES.has(normalizeFeeCode(right.feeCode))

      if (leftIsBranchScoped !== rightIsBranchScoped) {
        return leftIsBranchScoped ? 1 : -1
      }

      return left.name.localeCompare(right.name, 'vi')
    })
  }, [definitions])

  const loadData = useCallback(async () => {
    try {
      setLoading(true)

      const [definitionsResponse, pricesResponse] = await Promise.all([
        oneTimeFeeService.getDefinitions(),
        oneTimeFeeService.getPrices()
      ])

      if (!definitionsResponse.success) {
        showNotification(definitionsResponse.message || 'Không thể tải danh sách khoản phí.', 'error')

        return
      }

      const definitionRows = definitionsResponse.data || []
      const priceRows = pricesResponse.success ? pricesResponse.data || [] : []

      setDefinitions(definitionRows)
      setPrices(priceRows)
      setForms(
        definitionRows.reduce<Record<string, FeeFormState>>((accumulator, definition) => {
          const normalizedFeeCode = normalizeFeeCode(definition.feeCode)
          accumulator[normalizedFeeCode] = buildFormState(
            definition,
            priceRows
              .filter(price => normalizeFeeCode(price.feeCode) === normalizedFeeCode && price.scopeType === 'Global' && price.isActive)
              .sort((left, right) => new Date(right.effectiveFrom).getTime() - new Date(left.effectiveFrom).getTime())[0]
          )

          return accumulator
        }, {})
      )
    } catch {
      showNotification('Đã có lỗi khi tải cấu hình phí.', 'error')
    } finally {
      setLoading(false)
    }
  }, [showNotification])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleChange = (feeCode: string, payload: Partial<FeeFormState>) => {
    const normalizedFeeCode = normalizeFeeCode(feeCode)

    setForms(previous => ({
      ...previous,
      [normalizedFeeCode]: {
        ...(previous[normalizedFeeCode] || {
          name: '',
          description: '',
          isRequiredForExam: false,
          isActive: true,
          amount: 0
        }),
        ...payload
      }
    }))
  }

  const handleSave = async (feeCode: string) => {
    const normalizedFeeCode = normalizeFeeCode(feeCode)
    const form = forms[normalizedFeeCode]
    const isBranchScoped = BRANCH_SCOPED_FEE_CODES.has(normalizedFeeCode)

    if (!form) {
      showNotification('Không tìm thấy dữ liệu cấu hình để lưu.', 'error')

      return
    }

    if (!form.name.trim()) {
      showNotification('Vui lòng nhập tên khoản phí.', 'error')

      return
    }

    if (!isBranchScoped && parseAmount(form.amount) < 0) {
      showNotification('Số tiền không được âm.', 'error')

      return
    }

    try {
      setSavingFeeCode(normalizedFeeCode)

      const definitionResponse = await oneTimeFeeService.updateDefinition(normalizedFeeCode, {
        name: form.name.trim(),
        description: form.description.trim() || null,
        isRequiredForExam: form.isRequiredForExam,
        isActive: form.isActive
      })

      if (!definitionResponse.success) {
        showNotification(definitionResponse.message || 'Không thể cập nhật thông tin khoản phí.', 'error')

        return
      }

      if (!isBranchScoped) {
        const priceResponse = await oneTimeFeeService.upsertPrice({
          feeCode: normalizedFeeCode,
          scopeType: 'Global',
          scopeId: null,
          amount: parseAmount(form.amount)
        })

        if (!priceResponse.success) {
          showNotification(priceResponse.message || 'Không thể cập nhật mức phí.', 'error')

          return
        }
      }

      showNotification('Đã lưu cấu hình khoản phí thành công.', 'success')
      await loadData()
    } catch {
      showNotification('Đã có lỗi khi lưu cấu hình khoản phí.', 'error')
    } finally {
      setSavingFeeCode(null)
    }
  }

  return (
    <Card>
      <CardHeader
        title='Quản lý các khoản phí'
        subheader='Cấu hình các khoản phí 1 lần trên web. Phí CSVC vẫn áp dụng theo từng chi nhánh.'
      />
      <CardContent>
        {loading ? (
          <Box className='flex items-center justify-center py-10'>
            <CircularProgress />
          </Box>
        ) : sortedDefinitions.length === 0 ? (
          <Alert severity='info'>Chưa có khoản phí nào để cấu hình.</Alert>
        ) : (
          <Stack spacing={4}>
            <Alert severity='info'>
              Phí import/chuyển mã có thể cấu hình trực tiếp tại đây. Phí CSVC lấy theo từng chi nhánh và được chỉnh trong màn hình Chi nhánh.
            </Alert>

            <Grid container spacing={4}>
              {sortedDefinitions.map(definition => {
                const normalizedFeeCode = normalizeFeeCode(definition.feeCode)
                const form = forms[normalizedFeeCode] || buildFormState(definition, latestGlobalPriceByFeeCode[normalizedFeeCode])
                const isBranchScoped = BRANCH_SCOPED_FEE_CODES.has(normalizedFeeCode)
                const isSaving = savingFeeCode === normalizedFeeCode

                return (
                  <Grid key={definition.feeCode} size={{ xs: 12, lg: 6 }}>
                    <Paper variant='outlined' className='h-full p-4'>
                      <Stack spacing={3}>
                        <div>
                          <Typography variant='h6'>{definition.name}</Typography>
                          <Typography variant='body2' color='text.secondary'>
                            Mã phí: {definition.feeCode}
                          </Typography>
                        </div>

                        <TextField
                          fullWidth
                          label='Tên khoản phí'
                          value={form.name}
                          onChange={event => handleChange(normalizedFeeCode, { name: event.target.value })}
                        />

                        <TextField
                          fullWidth
                          label='Mô tả'
                          value={form.description}
                          onChange={event => handleChange(normalizedFeeCode, { description: event.target.value })}
                          multiline
                          minRows={2}
                        />

                        {isBranchScoped ? (
                          <Alert severity='info'>
                            Khoản phí này được cấu hình mức thu theo từng chi nhánh trong màn hình Chi nhánh.
                          </Alert>
                        ) : (
                          <TextField
                            fullWidth
                            label='Số tiền (đ)'
                            type='number'
                            value={form.amount}
                            onChange={event => handleChange(normalizedFeeCode, { amount: event.target.value })}
                            helperText='Mức phí toàn hệ thống sẽ hiển thị khi thu tiền.'
                          />
                        )}

                        <FormControlLabel
                          control={
                            <Switch
                              checked={form.isActive}
                              onChange={event => handleChange(normalizedFeeCode, { isActive: event.target.checked })}
                            />
                          }
                          label='Đang áp dụng'
                        />

                        <FormControlLabel
                          control={
                            <Switch
                              checked={form.isRequiredForExam}
                              onChange={event => handleChange(normalizedFeeCode, { isRequiredForExam: event.target.checked })}
                            />
                          }
                          label='Bắt buộc trước khi thi'
                        />

                        <Box className='flex justify-end'>
                          <Button
                            variant='contained'
                            onClick={() => handleSave(normalizedFeeCode)}
                            disabled={isSaving}
                            startIcon={isSaving ? <CircularProgress size={18} color='inherit' /> : <i className='ri-save-line' />}
                          >
                            Lưu cấu hình
                          </Button>
                        </Box>
                      </Stack>
                    </Paper>
                  </Grid>
                )
              })}
            </Grid>
          </Stack>
        )}
      </CardContent>
    </Card>
  )
}

export default OneTimeFeesView
