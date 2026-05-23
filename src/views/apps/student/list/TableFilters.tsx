'use client'
import { logger } from '@/utils/logger'

// React Imports
import { useState, useEffect, useRef, memo } from 'react'

// MUI Imports
import CardContent from '@mui/material/CardContent'
import FormControl from '@mui/material/FormControl'
import Grid from '@mui/material/Grid'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import type { SelectChangeEvent } from '@mui/material/Select'

// Service Imports
import classService from '@/services/classService'
import type { GetStudentsParams } from '@/services/studentService'

interface TableFiltersProps {
  onFilterChange: (params: GetStudentsParams) => void
  classOptions?: any[]
}

const TableFilters = memo(({ onFilterChange, classOptions }: TableFiltersProps) => {
  // States
  const [classId, setClassId] = useState<string>('')
  const [gender, setGender] = useState<string>('')
  const [enrollmentStatus, setEnrollmentStatus] = useState<string>('')
  const [classes, setClasses] = useState<any[]>([])

  // Refs để track
  const isFirstRender = useRef(true)
  const classesLoaded = useRef(false)

  // Load classes for filter - chỉ load 1 lần
  useEffect(() => {
    if (classOptions && classOptions.length > 0) {
      setClasses(classOptions)
      classesLoaded.current = true
      return
    }

    if (classesLoaded.current) return

    const loadClasses = async () => {
      try {
        classesLoaded.current = true
        const response = await classService.getClasses({ isActive: true, pageSize: 1000 })
        if (response.success && response.data) {
          setClasses(response.data)
        }
      } catch (error) {
        logger.error('TableFilters', 'Error loading classes', error)
        classesLoaded.current = false // Cho phép retry nếu lỗi
      }
    }
    loadClasses()
  }, [classOptions])

  // Handle filter changes - chỉ gọi khi filter thực sự thay đổi
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    const params: GetStudentsParams = {}
    if (classId) params.classId = classId
    if (gender !== '') params.gender = gender === 'true'
    if (enrollmentStatus) params.enrollmentStatus = enrollmentStatus
    onFilterChange(params)
  }, [classId, gender, enrollmentStatus, onFilterChange])

  return (
    <CardContent>
      <Grid container spacing={5}>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth>
            <InputLabel id='class-select'>Lớp học</InputLabel>
            <Select
              fullWidth
              id='select-class'
              value={classId}
              onChange={(e: SelectChangeEvent) => setClassId(e.target.value)}
              label='Lớp học'
              labelId='class-select'
            >
              <MenuItem value=''>Tất cả</MenuItem>
              {classes.map(cls => (
                <MenuItem key={cls.id} value={cls.id}>
                  {cls.code}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth>
            <InputLabel id='gender-select'>Giới tính</InputLabel>
            <Select
              fullWidth
              id='select-gender'
              value={gender}
              onChange={(e: SelectChangeEvent) => setGender(e.target.value)}
              label='Giới tính'
              labelId='gender-select'
            >
              <MenuItem value=''>Tất cả</MenuItem>
              <MenuItem value='true'>Nam</MenuItem>
              <MenuItem value='false'>Nữ</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth>
            <InputLabel id='status-select'>Trạng thái</InputLabel>
            <Select
              fullWidth
              id='select-status'
              value={enrollmentStatus}
              onChange={(e: SelectChangeEvent) => setEnrollmentStatus(e.target.value)}
              label='Trạng thái'
              labelId='status-select'
            >
              <MenuItem value=''>Tất cả</MenuItem>
              <MenuItem value='Active'>Đang học</MenuItem>
              <MenuItem value='Inactive'>Tạm nghỉ</MenuItem>
              <MenuItem value='Completed'>Hoàn thành</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>
    </CardContent>
  )
})

TableFilters.displayName = 'TableFilters'

export default TableFilters
