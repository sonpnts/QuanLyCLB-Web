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
import type { GetClassTransfersParams } from '@/services/classTransferService'

interface TableFiltersProps {
  onFilterChange: (params: GetClassTransfersParams) => void
}

const TableFilters = memo(({ onFilterChange }: TableFiltersProps) => {
  const [status, setStatus] = useState<string>('')
  const [fromClassId, setFromClassId] = useState<string>('')
  const [toClassId, setToClassId] = useState<string>('')
  const [classes, setClasses] = useState<any[]>([])

  const isFirstRender = useRef(true)
  const classesLoaded = useRef(false)

  // Load classes chá»‰ 1 láº§n
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
        classesLoaded.current = false
      }
    }
    loadClasses()
  }, [])

  // Handle filter changes
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    const params: GetClassTransfersParams = {}
    if (status) params.status = status
    if (fromClassId) params.fromClassId = fromClassId
    if (toClassId) params.toClassId = toClassId
    onFilterChange(params)
  }, [status, fromClassId, toClassId, onFilterChange])

  return (
    <CardContent>
      <Grid container spacing={5}>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth>
            <InputLabel>Tráº¡ng thÃ¡i</InputLabel>
            <Select value={status} onChange={(e: SelectChangeEvent) => setStatus(e.target.value)} label='Tráº¡ng thÃ¡i'>
              <MenuItem value=''>Táº¥t cáº£</MenuItem>
              <MenuItem value='Pending'>Chá» duyá»‡t</MenuItem>
              <MenuItem value='Approved'>ÄÃ£ duyá»‡t</MenuItem>
              <MenuItem value='Rejected'>Tá»« chá»‘i</MenuItem>
              <MenuItem value='Cancelled'>ÄÃ£ há»§y</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth>
            <InputLabel>Tá»« lá»›p</InputLabel>
            <Select
              value={fromClassId}
              onChange={(e: SelectChangeEvent) => setFromClassId(e.target.value)}
              label='Tá»« lá»›p'
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
            <InputLabel>Äáº¿n lá»›p</InputLabel>
            <Select value={toClassId} onChange={(e: SelectChangeEvent) => setToClassId(e.target.value)} label='Äáº¿n lá»›p'>
              <MenuItem value=''>Táº¥t cáº£</MenuItem>
              {classes.map(cls => (
                <MenuItem key={cls.id} value={cls.id}>
                  {cls.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>
    </CardContent>
  )
})

TableFilters.displayName = 'ClassTransferTableFilters'

export default TableFilters
