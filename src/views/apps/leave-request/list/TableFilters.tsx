'use client'

// React Imports
import { useState, useEffect, useRef, memo } from 'react'

// MUI Imports
import CardContent from '@mui/material/CardContent'
import FormControl from '@mui/material/FormControl'
import Grid from '@mui/material/Grid2'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import TextField from '@mui/material/TextField'
import type { SelectChangeEvent } from '@mui/material/Select'

// Service Imports
import type { GetLeaveRequestsParams } from '@/services/leaveRequestService'

// Type Imports
import { leaveTypeLabels, leaveStatusLabels } from '@/types/apps/leaveRequestTypes'

interface TableFiltersProps {
  onFilterChange: (params: GetLeaveRequestsParams) => void
}

const TableFilters = memo(({ onFilterChange }: TableFiltersProps) => {
  const [leaveType, setLeaveType] = useState<string>('')
  const [status, setStatus] = useState<string>('')
  const [fromDate, setFromDate] = useState<string>('')
  const [toDate, setToDate] = useState<string>('')

  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    const params: GetLeaveRequestsParams = {}
    if (leaveType !== '') params.leaveType = Number(leaveType)
    if (status !== '') params.status = Number(status)
    if (fromDate) params.fromDate = fromDate
    if (toDate) params.toDate = toDate
    onFilterChange(params)
  }, [leaveType, status, fromDate, toDate, onFilterChange])

  return (
    <CardContent>
      <Grid container spacing={5}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <FormControl fullWidth size='small'>
            <InputLabel>Loại nghỉ</InputLabel>
            <Select
              value={leaveType}
              onChange={(e: SelectChangeEvent) => setLeaveType(e.target.value)}
              label='Loại nghỉ'
            >
              <MenuItem value=''>Tất cả</MenuItem>
              {Object.entries(leaveTypeLabels).map(([key, label]) => (
                <MenuItem key={key} value={key}>
                  {label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <FormControl fullWidth size='small'>
            <InputLabel>Trạng thái</InputLabel>
            <Select value={status} onChange={(e: SelectChangeEvent) => setStatus(e.target.value)} label='Trạng thái'>
              <MenuItem value=''>Tất cả</MenuItem>
              {Object.entries(leaveStatusLabels).map(([key, label]) => (
                <MenuItem key={key} value={key}>
                  {label}
                </MenuItem>
              ))}
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
            onChange={e => setFromDate(e.target.value)}
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
            onChange={e => setToDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
      </Grid>
    </CardContent>
  )
})

TableFilters.displayName = 'LeaveRequestTableFilters'

export default TableFilters
