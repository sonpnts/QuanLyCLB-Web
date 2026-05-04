'use client'

// React Imports
import { useState, useEffect, useRef, memo } from 'react'

// MUI Imports
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid2'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Typography from '@mui/material/Typography'

// Type Imports
import type { GetClassesParams } from '@/services/classService'

type StatusFilter = 'all' | 'active' | 'inactive'

type TableFiltersProps = {
  onFilterChange: (params: GetClassesParams) => void
}

const TableFilters = memo(({ onFilterChange }: TableFiltersProps) => {
  const [keyword, setKeyword] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const isFirstRender = useRef(true)

  useEffect(() => {
    // Bỏ qua lần render đầu tiên để tránh gọi API khi component mới mount
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    const params: GetClassesParams = {}
    if (keyword) params.keyword = keyword
    if (statusFilter === 'active') params.isActive = true
    else if (statusFilter === 'inactive') params.isActive = false
    // 'all' → không truyền isActive → backend trả tất cả

    onFilterChange(params)
  }, [keyword, statusFilter, onFilterChange])

  const handleReset = () => {
    setKeyword('')
    setStatusFilter('all')
  }

  return (
    <CardContent>
      <Grid container spacing={5} alignItems='center'>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <TextField
            fullWidth
            label='Tìm kiếm'
            placeholder='Nhập tên lớp, mã lớp...'
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Typography variant='caption' color='text.secondary' className='block mb-1'>
            Trạng thái
          </Typography>
          <ToggleButtonGroup
            value={statusFilter}
            exclusive
            onChange={(_, val) => { if (val !== null) setStatusFilter(val) }}
            size='small'
          >
            <ToggleButton value='all'>Tất cả</ToggleButton>
            <ToggleButton value='active'>Đang hoạt động</ToggleButton>
            <ToggleButton value='inactive'>Đã xóa</ToggleButton>
          </ToggleButtonGroup>
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

TableFilters.displayName = 'ClassTableFilters'

export default TableFilters
