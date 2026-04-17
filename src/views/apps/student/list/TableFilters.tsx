'use client'

// React Imports
import { logger } from '@/utils/logger'
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
}

const TableFilters = memo(({ onFilterChange }: TableFiltersProps) => {
  // States
  const [classId, setClassId] = useState<string>('')
  const [gender, setGender] = useState<string>('')
  const [enrollmentStatus, setEnrollmentStatus] = useState<string>('')
  const [classes, setClasses] = useState<any[]>([])

  // Refs Ä‘á»ƒ track
  const isFirstRender = useRef(true)
  const classesLoaded = useRef(false)

  // Load classes for filter - chá»‰ load 1 láº§n
  useEffect(() => {
    if (classesLoaded.current) return

    const loadClasses = async () => {
      try {
        classesLoaded.current = true
        const response = await classService.getClasses({})
        if (response.success && response.data) {
          setClasses(response.data)
        }
      } catch (error) {
        logger.error('TableFilters', 'Error loading classes', error)
        classesLoaded.current = false // Cho phÃ©p retry náº¿u lá»—i
      }
    }
    loadClasses()
  }, [])

  // Handle filter changes - chá»‰ gá»i khi filter thá»±c sá»± thay Ä‘á»•i
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
            <InputLabel id='class-select'>Lá»›p há»c</InputLabel>
            <Select
              fullWidth
              id='select-class'
              value={classId}
              onChange={(e: SelectChangeEvent) => setClassId(e.target.value)}
              label='Lá»›p há»c'
              labelId='class-select'
            >
              <MenuItem value=''>Táº¥t cáº£</MenuItem>
              {classes.map(cls => (
                <MenuItem key={cls.id} value={cls.id}>
                  {cls.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth>
            <InputLabel id='gender-select'>Giá»›i tÃ­nh</InputLabel>
            <Select
              fullWidth
              id='select-gender'
              value={gender}
              onChange={(e: SelectChangeEvent) => setGender(e.target.value)}
              label='Giá»›i tÃ­nh'
              labelId='gender-select'
            >
              <MenuItem value=''>Táº¥t cáº£</MenuItem>
              <MenuItem value='true'>Nam</MenuItem>
              <MenuItem value='false'>Ná»¯</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth>
            <InputLabel id='status-select'>Tráº¡ng thÃ¡i</InputLabel>
            <Select
              fullWidth
              id='select-status'
              value={enrollmentStatus}
              onChange={(e: SelectChangeEvent) => setEnrollmentStatus(e.target.value)}
              label='Tráº¡ng thÃ¡i'
              labelId='status-select'
            >
              <MenuItem value=''>Táº¥t cáº£</MenuItem>
              <MenuItem value='Active'>Äang há»c</MenuItem>
              <MenuItem value='Inactive'>Táº¡m nghá»‰</MenuItem>
              <MenuItem value='Completed'>HoÃ n thÃ nh</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>
    </CardContent>
  )
})

TableFilters.displayName = 'TableFilters'

export default TableFilters
