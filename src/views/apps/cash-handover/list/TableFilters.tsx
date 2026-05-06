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

import type { ClassType } from '@/types/apps/classTypes'
import type { UsersType } from '@/types/apps/userTypes'
import type { GetCashHandoversParams } from '@/services/cashHandoverService'

type Props = {
  classes: ClassType[]
  instructors: UsersType[]
  onFilterChange: (params: GetCashHandoversParams) => void
  showInstructorFilter?: boolean
}

const TableFilters = memo(({ classes, instructors, onFilterChange, showInstructorFilter = true }: Props) => {
  const [classId, setClassId] = useState('')
  const [instructorId, setInstructorId] = useState('')
  const [handoverFrom, setHandoverFrom] = useState('')
  const [handoverTo, setHandoverTo] = useState('')

  useEffect(() => {
    const params: GetCashHandoversParams = {}

    if (classId) params.classId = classId
    if (instructorId) params.instructorId = instructorId
    if (handoverFrom) params.handoverFrom = handoverFrom
    if (handoverTo) params.handoverTo = handoverTo

    onFilterChange(params)
  }, [classId, instructorId, handoverFrom, handoverTo, onFilterChange])

  return (
    <CardContent>
      <Grid container spacing={4}>
        <Grid item xs={12} md={3}>
          <FormControl fullWidth>
            <InputLabel>Lớp</InputLabel>
            <Select label='Lớp' value={classId} onChange={(event: SelectChangeEvent) => setClassId(event.target.value)}>
              <MenuItem value=''>Tất cả</MenuItem>
              {classes.map(item => (
                <MenuItem key={item.id} value={item.id}>
                  {item.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        {showInstructorFilter && (
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Huấn luyện viên</InputLabel>
              <Select
                label='Huấn luyện viên'
                value={instructorId}
                onChange={(event: SelectChangeEvent) => setInstructorId(event.target.value)}
              >
                <MenuItem value=''>Tất cả</MenuItem>
                {instructors.map(item => (
                  <MenuItem key={item.id} value={item.id}>
                    {item.fullName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        )}
        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            type='date'
            label='Từ ngày bàn giao'
            InputLabelProps={{ shrink: true }}
            value={handoverFrom}
            onChange={event => setHandoverFrom(event.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            type='date'
            label='Đến ngày bàn giao'
            InputLabelProps={{ shrink: true }}
            value={handoverTo}
            onChange={event => setHandoverTo(event.target.value)}
          />
        </Grid>
      </Grid>
    </CardContent>
  )
})

TableFilters.displayName = 'CashHandoverTableFilters'

export default TableFilters
