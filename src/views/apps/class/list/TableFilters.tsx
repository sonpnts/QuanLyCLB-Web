// React Imports
import { useState, useEffect, useCallback } from 'react'

// MUI Imports
import CardContent from '@mui/material/CardContent'
import FormControl from '@mui/material/FormControl'
import Grid from '@mui/material/Grid2'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'

// Type Imports
import type { GetClassesParams } from '@/services/classService'

type TableFiltersProps = {
  onFilterChange: (params: GetClassesParams) => void
}

const TableFilters = ({ onFilterChange }: TableFiltersProps) => {
  // States
  const [isActive, setIsActive] = useState<string>('')
  const [minMaxStudents, setMinMaxStudents] = useState<string>('')
  const [maxMaxStudents, setMaxMaxStudents] = useState<string>('')
  const [startDateFrom, setStartDateFrom] = useState<string>('')
  const [startDateTo, setStartDateTo] = useState<string>('')
  const [endDateFrom, setEndDateFrom] = useState<string>('')
  const [endDateTo, setEndDateTo] = useState<string>('')
  const [code, setCode] = useState<string>('')
  const [keyword, setKeyword] = useState<string>('')

  // Handle filter change
  const handleFilterChange = useCallback(() => {
    const params: GetClassesParams = {}

    // IsActive filter
    if (isActive !== '') {
      params.IsActive = isActive === 'true'
    }

    // Min/Max Students filter
    if (minMaxStudents) {
      params.MinMaxStudents = parseInt(minMaxStudents)
    }

    if (maxMaxStudents) {
      params.MaxMaxStudents = parseInt(maxMaxStudents)
    }

    // Start Date range
    if (startDateFrom) {
      params.StartDateFrom = startDateFrom
    }

    if (startDateTo) {
      params.StartDateTo = startDateTo
    }

    // End Date range
    if (endDateFrom) {
      params.EndDateFrom = endDateFrom
    }

    if (endDateTo) {
      params.EndDateTo = endDateTo
    }

    // Code filter
    if (code) {
      params.Code = code
    }

    // Keyword filter
    if (keyword) {
      params.Keyword = keyword
    }

    onFilterChange(params)
  }, [
    isActive,
    minMaxStudents,
    maxMaxStudents,
    startDateFrom,
    startDateTo,
    endDateFrom,
    endDateTo,
    code,
    keyword,
    onFilterChange
  ])

  useEffect(() => {
    handleFilterChange()
  }, [handleFilterChange])

  const handleReset = () => {
    setIsActive('')
    setMinMaxStudents('')
    setMaxMaxStudents('')
    setStartDateFrom('')
    setStartDateTo('')
    setEndDateFrom('')
    setEndDateTo('')
    setCode('')
    setKeyword('')
  }

  return (
    <CardContent>
      <Grid container spacing={5}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <FormControl fullWidth>
            <InputLabel id='isactive-select'>Trạng thái</InputLabel>
            <Select
              fullWidth
              id='select-isactive'
              value={isActive}
              onChange={e => setIsActive(e.target.value)}
              label='Trạng thái'
              labelId='isactive-select'
              inputProps={{ placeholder: 'Trạng thái' }}
            >
              <MenuItem value=''>Tất cả</MenuItem>
              <MenuItem value='true'>Hoạt động</MenuItem>
              <MenuItem value='false'>Không hoạt động</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <TextField
            fullWidth
            label='Mã lớp'
            placeholder='Nhập mã lớp'
            value={code}
            onChange={e => setCode(e.target.value)}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <TextField
            fullWidth
            label='Từ khóa'
            placeholder='Tìm kiếm...'
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <TextField
            fullWidth
            label='Sỉ số tối thiểu'
            placeholder='Nhập sỉ số tối thiểu'
            value={minMaxStudents}
            onChange={e => setMinMaxStudents(e.target.value)}
            type='number'
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <TextField
            fullWidth
            label='Sỉ số tối đa'
            placeholder='Nhập sỉ số tối đa'
            value={maxMaxStudents}
            onChange={e => setMaxMaxStudents(e.target.value)}
            type='number'
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <TextField
            fullWidth
            type='date'
            label='Ngày bắt đầu từ'
            value={startDateFrom}
            onChange={e => setStartDateFrom(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <TextField
            fullWidth
            type='date'
            label='Ngày bắt đầu đến'
            value={startDateTo}
            onChange={e => setStartDateTo(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <TextField
            fullWidth
            type='date'
            label='Ngày kết thúc từ'
            value={endDateFrom}
            onChange={e => setEndDateFrom(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <TextField
            fullWidth
            type='date'
            label='Ngày kết thúc đến'
            value={endDateTo}
            onChange={e => setEndDateTo(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Button variant='outlined' onClick={handleReset} fullWidth>
            Đặt lại bộ lọc
          </Button>
        </Grid>
      </Grid>
    </CardContent>
  )
}

export default TableFilters
