'use client'

import { memo, useEffect, useRef, useState } from 'react'

import CardContent from '@mui/material/CardContent'
import FormControl from '@mui/material/FormControl'
import Grid from '@mui/material/Grid2'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import TextField from '@mui/material/TextField'
import type { SelectChangeEvent } from '@mui/material/Select'

import type { GetStudentAbsencesParams } from '@/services/studentAttendanceService'

type ClassOption = {
  id: string
  code?: string
  name: string
}

interface TableFiltersProps {
  classes: ClassOption[]
  onFilterChange: (params: GetStudentAbsencesParams) => void
}

const TableFilters = memo(({ classes, onFilterChange }: TableFiltersProps) => {
  const [classId, setClassId] = useState('')
  const [absenceType, setAbsenceType] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    const params: GetStudentAbsencesParams = {}
    if (classId) params.classId = classId
    if (absenceType !== '') params.isExcused = absenceType === 'excused'
    if (fromDate) params.fromDate = fromDate
    if (toDate) params.toDate = toDate

    onFilterChange(params)
  }, [classId, absenceType, fromDate, toDate, onFilterChange])

  return (
    <CardContent>
      <Grid container spacing={5}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <FormControl fullWidth size='small'>
            <InputLabel>Lớp</InputLabel>
            <Select value={classId} onChange={(event: SelectChangeEvent) => setClassId(event.target.value)} label='Lớp'>
              <MenuItem value=''>Tất cả</MenuItem>
              {classes.map(item => (
                <MenuItem key={item.id} value={item.id}>
                  {item.code ? `${item.code} - ${item.name}` : item.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <FormControl fullWidth size='small'>
            <InputLabel>Loại vắng</InputLabel>
            <Select
              value={absenceType}
              onChange={(event: SelectChangeEvent) => setAbsenceType(event.target.value)}
              label='Loại vắng'
            >
              <MenuItem value=''>Tất cả</MenuItem>
              <MenuItem value='excused'>Có phép</MenuItem>
              <MenuItem value='unexcused'>Không phép</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <TextField
            fullWidth
            size='small'
            type='date'
            label='Từ ngày'
            value={fromDate}
            onChange={event => setFromDate(event.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <TextField
            fullWidth
            size='small'
            type='date'
            label='Đến ngày'
            value={toDate}
            onChange={event => setToDate(event.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
      </Grid>
    </CardContent>
  )
})

TableFilters.displayName = 'StudentAbsenceTableFilters'

export default TableFilters
