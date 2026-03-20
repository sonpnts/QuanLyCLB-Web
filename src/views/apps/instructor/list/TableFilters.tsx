'use client'

// React Imports
import { useState, useEffect, useRef, memo } from 'react'

// MUI Imports
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid2'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'

// Type Imports
import type { GetInstructorsParams } from '@/services/instructorService'

type Props = {
  onFilterChange: (params: GetInstructorsParams) => void
}

const TableFilters = memo(({ onFilterChange }: Props) => {
  const [skillLevel, setSkillLevel] = useState<string>('')
  const [certification, setCertification] = useState<string>('')
  const isFirstRender = useRef(true)

  useEffect(() => {
    // Bỏ qua lần render đầu tiên
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    const params: GetInstructorsParams = {}
    if (skillLevel) params.skillLevel = skillLevel
    if (certification) params.certification = certification
    onFilterChange(params)
  }, [skillLevel, certification, onFilterChange])

  const handleReset = () => {
    setSkillLevel('')
    setCertification('')
  }

  return (
    <CardContent>
      <Grid container spacing={4} alignItems='center'>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <TextField
            fullWidth
            label='Trình độ'
            value={skillLevel}
            onChange={e => setSkillLevel(e.target.value)}
            placeholder='Lọc theo trình độ...'
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <TextField
            fullWidth
            label='Chứng chỉ'
            value={certification}
            onChange={e => setCertification(e.target.value)}
            placeholder='Lọc theo chứng chỉ...'
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

TableFilters.displayName = 'InstructorTableFilters'

export default TableFilters
