'use client'

// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid2'
import TextField from '@mui/material/TextField'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'

// Type Imports
import type { GetSchedulesParams } from '@/services/scheduleService'
import type { ClassType } from '@/types/apps/classTypes'
import type { BranchType } from '@/services/branchService'

// Service Imports
import classService from '@/services/classService'
import branchService from '@/services/branchService'

// Utils Imports
import { DAY_OF_WEEK_OPTIONS, STATUS_OPTIONS } from '@/utils/constants'

type Props = {
  onFilterChange: (params: GetSchedulesParams) => void
}

const TableFilters = ({ onFilterChange }: Props) => {
  // States
  const [isActive, setIsActive] = useState<string>('')
  const [keyword, setKeyword] = useState<string>('')
  const [classId, setClassId] = useState<string>('')
  const [branchId, setBranchId] = useState<string>('')
  const [dayOfWeek, setDayOfWeek] = useState<string>('')
  const [classes, setClasses] = useState<ClassType[]>([])
  const [branches, setBranches] = useState<BranchType[]>([])

  // Load classes and branches
  useEffect(() => {
    const loadClasses = async () => {
      try {
        const response = await classService.getClasses({})
        if (response.success && response.data) {
          setClasses(response.data)
        }
      } catch (error) {
        console.error('Error loading classes:', error)
      }
    }

    const loadBranches = async () => {
      try {
        const response = await branchService.getBranches({})
        if (response.success && response.data) {
          setBranches(response.data)
        }
      } catch (error) {
        console.error('Error loading branches:', error)
      }
    }

    loadClasses()
    loadBranches()
  }, [])

  // Handle filter change
  useEffect(() => {
    const params: GetSchedulesParams = {}

    if (isActive !== '') {
      params.IsActive = isActive === 'true'
    }
    if (keyword) {
      params.Keyword = keyword
    }
    if (classId) {
      params.ClassId = classId
    }
    if (branchId) {
      params.BranchId = branchId
    }
    if (dayOfWeek) {
      params.DayOfWeek = parseInt(dayOfWeek)
    }

    onFilterChange(params)
  }, [isActive, keyword, classId, branchId, dayOfWeek, onFilterChange])

  // Handle reset
  const handleReset = () => {
    setIsActive('')
    setKeyword('')
    setClassId('')
    setBranchId('')
    setDayOfWeek('')
  }

  return (
    <Card>
      <CardContent>
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth>
              <InputLabel>Trạng thái</InputLabel>
              <Select value={isActive} label='Trạng thái' onChange={e => setIsActive(e.target.value)}>
                <MenuItem value=''>Tất cả</MenuItem>
                {STATUS_OPTIONS.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              label='Từ khóa'
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              placeholder='Tìm kiếm...'
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth>
              <InputLabel>Lớp học</InputLabel>
              <Select value={classId} label='Lớp học' onChange={e => setClassId(e.target.value)}>
                <MenuItem value=''>Tất cả lớp học</MenuItem>
                {classes.map(cls => (
                  <MenuItem key={cls.id} value={cls.id}>
                    {cls.name} ({cls.code})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth>
              <InputLabel>Chi nhánh</InputLabel>
              <Select value={branchId} label='Chi nhánh' onChange={e => setBranchId(e.target.value)}>
                <MenuItem value=''>Tất cả chi nhánh</MenuItem>
                {branches.map(branch => (
                  <MenuItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth>
              <InputLabel>Thứ trong tuần</InputLabel>
              <Select value={dayOfWeek} label='Thứ trong tuần' onChange={e => setDayOfWeek(e.target.value)}>
                <MenuItem value=''>Tất cả</MenuItem>
                {DAY_OF_WEEK_OPTIONS.map(day => (
                  <MenuItem key={day.value} value={day.value.toString()}>
                    {day.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Box className='flex gap-2'>
              <Button variant='outlined' onClick={handleReset}>
                Đặt lại bộ lọc
              </Button>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}

export default TableFilters
