'use client'

import { useEffect, useState } from 'react'

import Drawer from '@mui/material/Drawer'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Divider from '@mui/material/Divider'
import Button from '@mui/material/Button'
import FormGroup from '@mui/material/FormGroup'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Chip from '@mui/material/Chip'

import type { UsersType } from '@/types/apps/userTypes'
import type { RoleType } from '@/services/roleService'
import userService from '@/services/userService'
import { useNotification } from '@/contexts/notificationContext'

type Props = {
  open: boolean
  onClose: () => void
  user: UsersType | null
  allRoles: RoleType[]
  onSaved: (updated: UsersType) => void
}

const UserRoleDrawer = ({ open, onClose, user, allRoles, onSaved }: Props) => {
  const { showNotification } = useNotification()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (user) {
      setSelected(new Set(user.roles || []))
    }
  }, [user])

  const toggle = (roleName: string) => {
    setSelected(prev => {
      const next = new Set(prev)

      if (next.has(roleName)) next.delete(roleName)
      else next.add(roleName)
      
return next
    })
  }

  const handleSave = async () => {
    if (!user) return
    setSubmitting(true)

    const res = await userService.updateUserRoles(user.id, Array.from(selected))

    if (res.success && res.data) {
      showNotification(res.message || 'Cập nhật vai trò thành công', 'success')
      onSaved(res.data)
      onClose()
    } else {
      showNotification(res.message || 'Không thể cập nhật vai trò', 'error')
    }

    setSubmitting(false)
  }

  const getRoleColor = (name: string) => {
    const n = name.toLowerCase()

    if (n.includes('admin')) return 'error'
    if (n.includes('coach') || n.includes('instructor')) return 'primary'
    if (n.includes('student') || n.includes('member')) return 'success'
    
return 'default'
  }

  return (
    <Drawer
      open={open}
      anchor='right'
      variant='temporary'
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: { xs: 300, sm: 380 } } }}
    >
      <div className='flex items-center justify-between pli-5 plb-4'>
        <Box>
          <Typography variant='h5'>Phân vai trò</Typography>
          {user && (
            <Typography variant='body2' color='text.secondary'>
              {user.fullName}
            </Typography>
          )}
        </Box>
        <IconButton size='small' onClick={onClose}>
          <i className='ri-close-line text-2xl' />
        </IconButton>
      </div>
      <Divider />

      <Box className='p-5 flex flex-col gap-4 flex-1 overflow-y-auto'>
        {/* Current roles preview */}
        {selected.size > 0 && (
          <Box>
            <Typography variant='body2' color='text.secondary' className='mb-2'>
              Vai trò hiện tại:
            </Typography>
            <Box className='flex flex-wrap gap-1'>
              {Array.from(selected).map(r => (
                <Chip key={r} label={r} size='small' color={getRoleColor(r) as any} variant='tonal' />
              ))}
            </Box>
          </Box>
        )}

        <Divider />

        <Typography variant='body2' className='font-medium'>
          Chọn vai trò:
        </Typography>
        <FormGroup>
          {allRoles.map(role => (
            <FormControlLabel
              key={role.id}
              control={
                <Checkbox
                  checked={selected.has(role.name)}
                  onChange={() => toggle(role.name)}
                  color={getRoleColor(role.name) as any}
                />
              }
              label={
                <Box>
                  <Typography variant='body2' className='font-medium'>
                    {role.name}
                  </Typography>
                  {role.description && (
                    <Typography variant='caption' color='text.secondary'>
                      {role.description}
                    </Typography>
                  )}
                </Box>
              }
            />
          ))}
        </FormGroup>
      </Box>

      <Divider />
      <Box className='p-4 flex gap-2 justify-end'>
        <Button variant='outlined' onClick={onClose}>
          Hủy
        </Button>
        <Button
          variant='contained'
          onClick={handleSave}
          disabled={submitting}
          startIcon={submitting ? <CircularProgress size={16} color='inherit' /> : undefined}
        >
          {submitting ? 'Đang lưu...' : 'Lưu vai trò'}
        </Button>
      </Box>
    </Drawer>
  )
}

export default UserRoleDrawer
