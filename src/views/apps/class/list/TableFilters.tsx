'use client'

// React Imports
import { useState, useEffect, useRef, memo } from 'react'

// MUI Imports
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid2'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'

// Type Imports
import type { GetClassesParams } from '@/services/classService'

type TableFiltersProps = {
  onFilterChange: (params: GetClassesParams) => void
}

const TableFilters = memo(({ onFilterChange }: TableFiltersProps) => {
  const [keyword, setKeyword] = useState<string>('')
  const isFirstRender = useRef(true)

  useEffect(() => {
    // Bỏ qua lần render đầu tiên
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    const params: GetClassesParams = {}
    if (keyword) params.keyword = keyword
    onFilterChange(params)
  }, [keyword, onFilterChange])

  const handleReset = () => {
    setKeyword('')
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
