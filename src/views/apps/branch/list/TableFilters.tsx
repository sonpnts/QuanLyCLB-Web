'use client'

// React Imports
import { useState, useEffect, useRef, memo } from 'react'

// MUI Imports
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid2'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'

// Type Imports
import type { GetBranchesParams } from '@/services/branchService'

type Props = {
  onFilterChange: (params: GetBranchesParams) => void
}

const TableFilters = memo(({ onFilterChange }: Props) => {
  const [keyword, setKeyword] = useState<string>('')
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      
return
    }

    const params: GetBranchesParams = {}

    if (keyword) params.Keyword = keyword
    onFilterChange(params)
  }, [keyword, onFilterChange])

  const handleReset = () => {
    setKeyword('')
  }

  return (
    <CardContent>
      <Grid container spacing={4} alignItems='center'>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <TextField
            fullWidth
            label='Tìm kiếm'
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            placeholder='Tìm theo tên, địa chỉ...'
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

TableFilters.displayName = 'BranchTableFilters'

export default TableFilters
