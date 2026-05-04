'use client'

import { useState, useEffect, useRef, memo } from 'react'
import CardContent from '@mui/material/CardContent'
import FormControl from '@mui/material/FormControl'
import Grid from '@mui/material/Grid2'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import type { SelectChangeEvent } from '@mui/material/Select'

import classService from '@/services/classService'
import type { GetPaymentsParams } from '@/services/paymentService'
import { paymentTypeLabels } from '@/types/apps/paymentTypes'

interface TableFiltersProps {
  onFilterChange: (params: GetPaymentsParams) => void
}

const TableFilters = memo(({ onFilterChange }: TableFiltersProps) => {
  const [type, setType] = useState<string>('')
  const [classId, setClassId] = useState<string>('')
  const [fromDate, setFromDate] = useState<string>('')
  const [toDate, setToDate] = useState<string>('')
  const [classes, setClasses] = useState<any[]>([])

  const isFirstRender = useRef(true)
  const classesLoaded = useRef(false)

  // Load classes chỉ 1 lần
  useEffect(() => {
    if (classesLoaded.current) return

    const loadClasses = async () => {
      try {
        classesLoaded.current = true
        const response = await classService.getClasses({ isActive: true, pageSize: 1000 })
        if (response.success && response.data) {
          setClasses(response.data)
        }
      } catch (error) {
        console.error('Error loading classes:', error)
        classesLoaded.current = false
      }
    }
    loadClasses()
  }, [])

  // Handle filter changes
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    const params: GetPaymentsParams = {}
    if (type !== '') params.type = Number(type)
    if (classId) params.classId = classId
    if (fromDate) params.paymentDateFrom = fromDate
    if (toDate) params.paymentDateTo = toDate
    onFilterChange(params)
  }, [type, classId, fromDate, toDate, onFilterChange])

  const handleReset = () => {
    setType('')
    setClassId('')
    setFromDate('')
    setToDate('')
  }

  return (
    <CardContent>
      <Grid container spacing={4} alignItems='center'>
        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <FormControl fullWidth size='small'>
            <InputLabel>Loại thanh toán</InputLabel>
            <Select value={type} onChange={(e: SelectChangeEvent) => setType(e.target.value)} label='Loại thanh toán'>
              <MenuItem value=''>Tất cả</MenuItem>
              {Object.entries(paymentTypeLabels).map(([key, label]) => (
                <MenuItem key={key} value={key}>
                  {label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <FormControl fullWidth size='small'>
            <InputLabel>Lớp học</InputLabel>
            <Select value={classId} onChange={(e: SelectChangeEvent) => setClassId(e.target.value)} label='Lớp học'>
              <MenuItem value=''>Tất cả</MenuItem>
              {classes.map(cls => (
                <MenuItem key={cls.id} value={cls.id}>
                  {cls.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <TextField
            fullWidth
            size='small'
            type='date'
            label='Từ ngày'
            InputLabelProps={{ shrink: true }}
            value={fromDate}
            onChange={e => setFromDate(e.target.value)}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <TextField
            fullWidth
            size='small'
            type='date'
            label='Đến ngày'
            InputLabelProps={{ shrink: true }}
            value={toDate}
            onChange={e => setToDate(e.target.value)}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <Button variant='outlined' onClick={handleReset} fullWidth>
            Đặt lại
          </Button>
        </Grid>
      </Grid>
    </CardContent>
  )
})

TableFilters.displayName = 'PaymentTableFilters'

export default TableFilters
