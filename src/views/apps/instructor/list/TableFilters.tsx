'use client'

import { useState, useEffect, useRef, memo } from 'react'

// MUI Imports
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid2'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Button from '@mui/material/Button'

// Type Imports
import type { GetInstructorsParams } from '@/services/instructorService'
import type { BeltLevelType } from '@/types/apps/beltExamTypes'

// Service Imports
import beltLevelService from '@/services/beltLevelService'
import { logger } from '@/utils/logger'

type Props = {
  onFilterChange: (params: GetInstructorsParams) => void
}

const TableFilters = memo(({ onFilterChange }: Props) => {
  const [skillLevelId, setSkillLevelId] = useState<string>('')
  const [certification, setCertification] = useState<string>('')
  const [beltLevels, setBeltLevels] = useState<BeltLevelType[]>([])
  const isFirstRender = useRef(true)

  // Load danh sách cấp đai một lần
  useEffect(() => {
    beltLevelService.getBeltLevels({ pageSize: 100 }).then(res => {
      if (res.success && res.data) {
        setBeltLevels(res.data.filter(b => b.isActive !== false).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)))
      }
    }).catch(err => logger.error('InstructorTableFilters', 'fetchBeltLevels', err))
  }, [])

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    const params: GetInstructorsParams = {}
    if (skillLevelId) params.skillLevelId = skillLevelId
    if (certification) params.certification = certification
    onFilterChange(params)
  }, [skillLevelId, certification, onFilterChange])

  const handleReset = () => {
    setSkillLevelId('')
    setCertification('')
  }

  return (
    <CardContent>
      <Grid container spacing={4} alignItems='center'>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <TextField
            select
            fullWidth
            label='Cấp đai'
            value={skillLevelId}
            onChange={e => setSkillLevelId(e.target.value)}
          >
            <MenuItem value=''>
              <em>Tất cả cấp đai</em>
            </MenuItem>
            {[...beltLevels]
              .sort((a, b) => {
                if ((a.isDang ?? false) !== (b.isDang ?? false)) return (a.isDang ? 1 : 0) - (b.isDang ? 1 : 0)
                return (a.order ?? 0) - (b.order ?? 0)
              })
              .map(belt => (
                <MenuItem key={belt.id} value={belt.id}>
                  {belt.name}
                </MenuItem>
              ))}
          </TextField>
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
