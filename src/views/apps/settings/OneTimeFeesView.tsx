'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid2'
import TextField from '@mui/material/TextField'
import Switch from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

import { useNotification } from '@/contexts/notificationContext'
import oneTimeFeeService from '@/services/oneTimeFeeService'
import type { FeeDefinitionType, FeePriceType } from '@/types/apps/oneTimeFeeTypes'

const CODE_CHANGE_FEE_CODE = 'CODE_CHANGE'

const parseAmount = (val: any) => {
  if (typeof val === 'number') return val
  if (!val) return 0
  return Number(String(val).replace(',', '.'))
}

const OneTimeFeesView = () => {
  const { showNotification } = useNotification()

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [definitions, setDefinitions] = useState<FeeDefinitionType[]>([])
  const [prices, setPrices] = useState<FeePriceType[]>([])

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isRequiredForExam, setIsRequiredForExam] = useState(true)
  const [isActive, setIsActive] = useState(true)
  const [amount, setAmount] = useState<number | string>(0)

  const activeGlobalPrice = useMemo(() => {
    return prices
      .filter(p => p.feeCode === CODE_CHANGE_FEE_CODE && p.scopeType === 'Global' && p.isActive)
      .sort((a, b) => new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime())[0]
  }, [prices])

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const [defsRes, pricesRes] = await Promise.all([oneTimeFeeService.getDefinitions(), oneTimeFeeService.getPrices()])

      if (!defsRes.success) {
        showNotification(defsRes.message || 'Không thể tải danh sách khoản phí.', 'error')
        return
      }

      setDefinitions(defsRes.data || [])
      setPrices(pricesRes.success ? (pricesRes.data || []) : [])

      const def = (defsRes.data || []).find(d => d.feeCode === CODE_CHANGE_FEE_CODE)
      setName(def?.name || 'Phí import/chuyển mã')
      setDescription(def?.description || '')
      setIsRequiredForExam(def?.isRequiredForExam ?? true)
      setIsActive(def?.isActive ?? true)
    } catch {
      showNotification('Đã có lỗi khi tải cấu hình phí.', 'error')
    } finally {
      setLoading(false)
    }
  }, [showNotification])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    if (activeGlobalPrice) setAmount(activeGlobalPrice.amount)
  }, [activeGlobalPrice])

  const handleSave = async () => {
    try {
      if (!name.trim()) {
        showNotification('Vui lòng nhập tên khoản phí.', 'error')
        return
      }

      setSaving(true)

      const defRes = await oneTimeFeeService.updateDefinition(CODE_CHANGE_FEE_CODE, {
        name: name.trim(),
        description: description.trim() || null,
        isRequiredForExam,
        isActive
      })

      if (!defRes.success) {
        showNotification(defRes.message || 'Không thể cập nhật thông tin khoản phí.', 'error')
        return
      }

      const priceRes = await oneTimeFeeService.upsertPrice({
        feeCode: CODE_CHANGE_FEE_CODE,
        scopeType: 'Global',
        scopeId: null,
        amount: parseAmount(amount)
      })

      if (!priceRes.success) {
        showNotification(priceRes.message || 'Không thể cập nhật số tiền.', 'error')
        return
      }

      showNotification('Đã lưu cấu hình phí thành công.', 'success')
      await loadData()
    } catch {
      showNotification('Đã có lỗi khi lưu cấu hình phí.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const showAmountHint = useMemo(() => {
    const v = parseAmount(amount)
    if (v <= 0) return '0đ sẽ tự động ẩn khi thu tiền.'
    return 'Hiển thị trong phần thu tiền và bắt buộc hoàn thành trước khi thi.'
  }, [amount])

  return (
    <Card>
      <CardHeader title='Cấu hình phí 1 lần' subheader='Phí import/chuyển mã (toàn hệ thống)' />
      <CardContent>
        {loading ? (
          <Box className='flex justify-center items-center py-10'>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField fullWidth label='Tên khoản phí' value={name} onChange={e => setName(e.target.value)} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label='Số tiền (đ)'
                type='number'
                value={amount}
                onChange={e => setAmount(e.target.value)}
                helperText={showAmountHint}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label='Mô tả'
                value={description}
                onChange={e => setDescription(e.target.value)}
                multiline
                minRows={2}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControlLabel
                control={<Switch checked={isActive} onChange={e => setIsActive(e.target.checked)} />}
                label='Đang áp dụng'
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControlLabel
                control={<Switch checked={isRequiredForExam} onChange={e => setIsRequiredForExam(e.target.checked)} />}
                label='Bắt buộc trước khi thi'
              />
            </Grid>
            <Grid size={{ xs: 12 }} className='flex items-center justify-between gap-4'>
              <Typography variant='body2' color='text.secondary'>
                Phí CSVC chỉnh theo từng chi nhánh trong màn hình Chi nhánh.
              </Typography>
              <Button variant='contained' onClick={handleSave} disabled={saving} startIcon={saving ? <CircularProgress size={18} /> : <i className='ri-save-line' />}>
                Lưu
              </Button>
            </Grid>
          </Grid>
        )}
      </CardContent>
    </Card>
  )
}

export default OneTimeFeesView

