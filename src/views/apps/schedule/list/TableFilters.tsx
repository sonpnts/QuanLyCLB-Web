'use client'

// React Imports
import { useState, useEffect, useRef, memo } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid2'
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
import { DAY_OF_WEEK_OPTIONS } from '@/utils/constants'

type Props = {
  onFilterChange: (params: GetSchedulesParams) => void
}

const TableFilters = memo(({ onFilterChange }: Props) => {
  const [classId, setClassId] = useState<string>('')
  const [branchId, setBranchId] = useState<string>('')
  const [dayOfWeek, setDayOfWeek] = useState<string>('')
  const [classes, setClasses] = useState<ClassType[]>([])
  const [branches, setBranches] = useState<BranchType[]>([])

  const isFirstRender = useRef(true)
  const dataLoaded = useRef(false)

  // Load classes and branches - chỉ 1 lần
  useEffect(() => {
    if (dataLoaded.current) return

    const loadData = async () => {
      try {
        dataLoaded.current = true
        const [classRes, branchRes] = await Promise.all([classService.getClasses({ isActive: true, pageSize: 1000 }), branchService.getBranches({})])

        if (classRes.success && classRes.data) {
          setClasses(classRes.data)
        }

        if (branchRes.success && branchRes.data) {
          setBranches(branchRes.data)
        }
      } catch (error) {
        console.error('Error loading data:', error)
        dataLoaded.current = false
      }
    }

    loadData()
  }, [])

  // Handle filter change
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      
return
    }

    const params: GetSchedulesParams = {}

    if (classId) params.ClassId = classId
    if (branchId) params.BranchId = branchId
    if (dayOfWeek !== '') params.DayOfWeek = parseInt(dayOfWeek)
    onFilterChange(params)
  }, [classId, branchId, dayOfWeek, onFilterChange])

  const handleReset = () => {
    setClassId('')
    setBranchId('')
    setDayOfWeek('')
  }

  return (
    <Card>
      <CardContent>
        <Grid container spacing={4} alignItems='center'>
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
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Box className='flex gap-2'>
              <Button variant='outlined' onClick={handleReset} fullWidth>
                Đặt lại bộ lọc
              </Button>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
})

TableFilters.displayName = 'ScheduleTableFilters'

export default TableFilters
