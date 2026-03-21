'use client'

import { memo, useEffect, useState } from 'react'

import CardContent from '@mui/material/CardContent'
import FormControl from '@mui/material/FormControl'
import Grid from '@mui/material/Grid'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import TextField from '@mui/material/TextField'
import type { SelectChangeEvent } from '@mui/material/Select'

import type { GetProductsParams } from '@/services/productService'

type Props = {
  onFilterChange: (params: GetProductsParams) => void
}

const TableFilters = memo(({ onFilterChange }: Props) => {
  const [category, setCategory] = useState('')
  const [code, setCode] = useState('')
  const [isActive, setIsActive] = useState<string>('')

  useEffect(() => {
    const params: GetProductsParams = {}

    if (category) params.category = category
    if (code) params.code = code
    if (isActive) params.isActive = isActive === 'true'

    onFilterChange(params)
  }, [category, code, isActive, onFilterChange])

  return (
    <CardContent>
      <Grid container spacing={4}>
        <Grid item xs={12} md={4}>
          <TextField fullWidth label='Lọc theo mã' value={code} onChange={event => setCode(event.target.value)} />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label='Lọc theo danh mục'
            value={category}
            onChange={event => setCategory(event.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Trạng thái</InputLabel>
            <Select
              label='Trạng thái'
              value={isActive}
              onChange={(event: SelectChangeEvent) => setIsActive(event.target.value)}
            >
              <MenuItem value=''>Tất cả</MenuItem>
              <MenuItem value='true'>Đang hoạt động</MenuItem>
              <MenuItem value='false'>Ngừng hoạt động</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>
    </CardContent>
  )
})

TableFilters.displayName = 'ProductListTableFilters'

export default TableFilters
