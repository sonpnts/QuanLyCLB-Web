'use client'

import React, { useState, useEffect } from 'react'
import Grid from '@mui/material/Grid2'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControlLabel from '@mui/material/FormControlLabel'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Avatar from '@mui/material/Avatar'
import Autocomplete from '@mui/material/Autocomplete'
import Divider from '@mui/material/Divider'

import webPushService from '@/services/webPushService'
import branchService from '@/services/branchService'
import classService from '@/services/classService'
import userService from '@/services/userService'

interface Props {
  onNotificationCreated: () => void
}

export const WebPushComposeTab: React.FC<Props> = ({ onNotificationCreated }) => {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [icon, setIcon] = useState('/images/logos/IMG_2911.png')
  const [image, setImage] = useState('')
  const [url, setUrl] = useState('/dashboards/home')

  const [targetType, setTargetType] = useState<'All' | 'Role' | 'Branch' | 'Class' | 'User'>('All')
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [selectedBranches, setSelectedBranches] = useState<any[]>([])
  const [selectedClasses, setSelectedClasses] = useState<any[]>([])
  const [selectedUsers, setSelectedUsers] = useState<any[]>([])

  const [sendTiming, setSendTiming] = useState<'now' | 'scheduled'>('now')
  const [scheduledAt, setScheduledAt] = useState('')

  // Data lists for selection
  const [branchList, setBranchList] = useState<any[]>([])
  const [classList, setClassList] = useState<any[]>([])
  const [userList, setUserList] = useState<any[]>([])

  // Recipient estimation
  const [estimateCount, setEstimateCount] = useState<{ totalSubscribers: number; totalUsers: number } | null>(null)
  const [estimating, setEstimating] = useState(false)

  // Loading and feedback
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  // Available roles in CMIS
  const roleOptions = [
    { value: 'Administrator', label: 'Quản trị viên (Administrator)' },
    { value: 'Coach', label: 'Huấn luyện viên (Coach)' },
    { value: 'Assistant', label: 'Trợ giảng (Assistant)' },
    { value: 'Student', label: 'Học viên (Student)' },
    { value: 'Mem', label: 'Hội viên (Member)' }
  ]

  // Load selection datasets
  useEffect(() => {
    const loadData = async () => {
      try {
        const [branchesRes, classesRes, usersRes] = await Promise.allSettled([
          branchService.getBranches(),
          classService.getClasses(),
          userService.getUsers({ PageSize: 200 })
        ])

        if (branchesRes.status === 'fulfilled' && branchesRes.value.data) {
          setBranchList(branchesRes.value.data)
        }
        if (classesRes.status === 'fulfilled' && classesRes.value.data) {
          setClassList(classesRes.value.data)
        }
        if (usersRes.status === 'fulfilled' && usersRes.value.data) {
          const list = (usersRes.value.data as any).items || usersRes.value.data
          setUserList(Array.isArray(list) ? list : [])
        }
      } catch (e) {
        console.error('Failed loading targeting datasets', e)
      }
    }

    loadData()
  }, [])

  // Recalculate recipient estimate when targeting changes
  useEffect(() => {
    const fetchEstimate = async () => {
      setEstimating(true)
      let targetIds: string[] = []

      if (targetType === 'Role') {
        targetIds = selectedRoles
      } else if (targetType === 'Branch') {
        targetIds = selectedBranches.map(b => b.id)
      } else if (targetType === 'Class') {
        targetIds = selectedClasses.map(c => c.id)
      } else if (targetType === 'User') {
        targetIds = selectedUsers.map(u => u.id)
      }

      try {
        const res = await webPushService.estimateSubscribers(targetType, targetIds)
        if (res.data) {
          setEstimateCount(res.data)
        }
      } catch {
        setEstimateCount(null)
      } finally {
        setEstimating(false)
      }
    }

    const timer = setTimeout(() => {
      fetchEstimate()
    }, 400)

    return () => clearTimeout(timer)
  }, [targetType, selectedRoles, selectedBranches, selectedClasses, selectedUsers])

  const handleValidateAndOpenConfirm = (e: React.FormEvent) => {
    e.preventDefault()
    setFeedback(null)

    if (!title.trim()) {
      setFeedback({ type: 'error', message: 'Vui lòng nhập tiêu đề thông báo.' })
      return
    }

    if (!body.trim()) {
      setFeedback({ type: 'error', message: 'Vui lòng nhập nội dung thông báo.' })
      return
    }

    if (sendTiming === 'scheduled') {
      if (!scheduledAt) {
        setFeedback({ type: 'error', message: 'Vui lòng chọn thời gian lên lịch gửi.' })
        return
      }

      const selectedDate = new Date(scheduledAt)
      if (selectedDate <= new Date()) {
        setFeedback({ type: 'error', message: 'Thời gian lên lịch phải ở tương lai.' })
        return
      }
    }

    setConfirmOpen(true)
  }

  const handleExecuteSend = async () => {
    setSubmitting(true)
    setFeedback(null)

    let targetIds: string[] = []
    if (targetType === 'Role') {
      targetIds = selectedRoles
    } else if (targetType === 'Branch') {
      targetIds = selectedBranches.map(b => b.id)
    } else if (targetType === 'Class') {
      targetIds = selectedClasses.map(c => c.id)
    } else if (targetType === 'User') {
      targetIds = selectedUsers.map(u => u.id)
    }

    try {
      const res = await webPushService.sendOrSchedule({
        title: title.trim(),
        body: body.trim(),
        icon: icon.trim() || undefined,
        image: image.trim() || undefined,
        url: url.trim() || '/dashboards/home',
        targetType,
        targetIds,
        scheduledAt: sendTiming === 'scheduled' ? new Date(scheduledAt).toISOString() : null
      })

      if (res.success) {
        setFeedback({
          type: 'success',
          message:
            sendTiming === 'scheduled'
              ? 'Lên lịch thông báo Web Push thành công!'
              : 'Gửi thông báo Web Push thành công!'
        })
        setConfirmOpen(false)
        setTitle('')
        setBody('')
        setImage('')
        onNotificationCreated()
      } else {
        setFeedback({ type: 'error', message: res.message || 'Gửi thông báo thất bại.' })
        setConfirmOpen(false)
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Có lỗi xảy ra khi gửi thông báo.' })
      setConfirmOpen(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Grid container spacing={4}>
      {/* Form Compose */}
      <Grid size={{ xs: 12, md: 7 }}>
        <Card>
          <CardHeader
            title='Tạo và gửi thông báo mới'
            subheader='Gửi thông báo đẩy Web Push đến người dùng CMIS theo điều kiện'
          />
          <CardContent>
            {feedback && (
              <Alert severity={feedback.type} sx={{ mb: 3 }}>
                {feedback.message}
              </Alert>
            )}

            <form onSubmit={handleValidateAndOpenConfirm}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <TextField
                  label='Tiêu đề thông báo *'
                  placeholder='Ví dụ: Thông báo kiểm tra đai tháng 12'
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  fullWidth
                  required
                />

                <TextField
                  label='Nội dung thông báo *'
                  placeholder='Nhập nội dung ngắn gọn, rõ ràng để hiển thị trên thông báo...'
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  multiline
                  rows={3}
                  fullWidth
                  required
                />

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label='Đường dẫn khi bấm (URL)'
                      placeholder='/dashboards/home'
                      value={url}
                      onChange={e => setUrl(e.target.value)}
                      fullWidth
                      helperText='Trang sẽ được mở khi người dùng bấm vào thông báo'
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label='Icon thông báo'
                      placeholder='/images/logos/IMG_2911.png'
                      value={icon}
                      onChange={e => setIcon(e.target.value)}
                      fullWidth
                    />
                  </Grid>
                  <Grid size={12}>
                    <TextField
                      label='Hình ảnh đính kèm (URL)'
                      placeholder='https://ik.imagekit.io/...'
                      value={image}
                      onChange={e => setImage(e.target.value)}
                      fullWidth
                      helperText='Tùy chọn. Hiển thị ảnh lớn trên Chrome/Edge'
                    />
                  </Grid>
                </Grid>

                <Divider sx={{ my: 1 }} />

                {/* Target Audience */}
                <Box>
                  <Typography variant='subtitle2' fontWeight={600} gutterBottom>
                    Đối tượng nhận thông báo
                  </Typography>
                  <FormControl fullWidth size='small'>
                    <Select
                      value={targetType}
                      onChange={e => setTargetType(e.target.value as any)}
                    >
                      <MenuItem value='All'>Tất cả người dùng đã bật Web Push</MenuItem>
                      <MenuItem value='Role'>Theo nhóm vai trò (Roles)</MenuItem>
                      <MenuItem value='Branch'>Theo cơ sở / Chi nhánh</MenuItem>
                      <MenuItem value='Class'>Theo lớp học</MenuItem>
                      <MenuItem value='User'>Người dùng cụ thể</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                {/* Dynamic Filters depending on TargetType */}
                {targetType === 'Role' && (
                  <Autocomplete
                    multiple
                    options={roleOptions}
                    getOptionLabel={opt => opt.label}
                    value={roleOptions.filter(r => selectedRoles.includes(r.value))}
                    onChange={(_, val) => setSelectedRoles(val.map(v => v.value))}
                    renderInput={params => <TextField {...params} label='Chọn vai trò nhận tin' />}
                  />
                )}

                {targetType === 'Branch' && (
                  <Autocomplete
                    multiple
                    options={branchList}
                    getOptionLabel={opt => opt.name || opt.address || opt.id}
                    value={selectedBranches}
                    onChange={(_, val) => setSelectedBranches(val)}
                    renderInput={params => <TextField {...params} label='Chọn cơ sở / chi nhánh' />}
                  />
                )}

                {targetType === 'Class' && (
                  <Autocomplete
                    multiple
                    options={classList}
                    getOptionLabel={opt => opt.name || opt.className || opt.id}
                    value={selectedClasses}
                    onChange={(_, val) => setSelectedClasses(val)}
                    renderInput={params => <TextField {...params} label='Chọn lớp học' />}
                  />
                )}

                {targetType === 'User' && (
                  <Autocomplete
                    multiple
                    options={userList}
                    getOptionLabel={opt => `${opt.fullName || opt.userName} (${opt.email || opt.phoneNumber || opt.id})`}
                    value={selectedUsers}
                    onChange={(_, val) => setSelectedUsers(val)}
                    renderInput={params => <TextField {...params} label='Tìm kiếm và chọn người dùng' />}
                  />
                )}

                {/* Estimate Badge */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.5, bgcolor: 'action.hover', borderRadius: 2 }}>
                  <i className='ri-radar-line' style={{ fontSize: '1.2rem', color: '#1877f2' }} />
                  <Typography variant='body2'>
                    Số lượng người nhận dự kiến:{' '}
                    {estimating ? (
                      <CircularProgress size={14} sx={{ ml: 0.5 }} />
                    ) : (
                      <strong>{estimateCount ? `${estimateCount.totalSubscribers} thiết bị (${estimateCount.totalUsers} người dùng)` : '0 thiết bị'}</strong>
                    )}
                  </Typography>
                </Box>

                <Divider sx={{ my: 1 }} />

                {/* Send Timing */}
                <Box>
                  <Typography variant='subtitle2' fontWeight={600} gutterBottom>
                    Thời gian gửi
                  </Typography>
                  <RadioGroup
                    row
                    value={sendTiming}
                    onChange={e => setSendTiming(e.target.value as any)}
                  >
                    <FormControlLabel value='now' control={<Radio />} label='Gửi ngay bây giờ' />
                    <FormControlLabel value='scheduled' control={<Radio />} label='Lên lịch gửi sau' />
                  </RadioGroup>

                  {sendTiming === 'scheduled' && (
                    <TextField
                      type='datetime-local'
                      label='Thời gian phát thông báo'
                      value={scheduledAt}
                      onChange={e => setScheduledAt(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      fullWidth
                      sx={{ mt: 1.5 }}
                      helperText='Hệ thống sẽ tự động phát thông báo vào đúng thời điểm đã chọn'
                    />
                  )}
                </Box>

                <Button
                  type='submit'
                  variant='contained'
                  size='large'
                  startIcon={<i className='ri-send-plane-fill' />}
                  sx={{ mt: 2 }}
                >
                  {sendTiming === 'scheduled' ? 'Lên lịch gửi thông báo' : 'Gửi thông báo ngay'}
                </Button>
              </Box>
            </form>
          </CardContent>
        </Card>
      </Grid>

      {/* Live Preview Column */}
      <Grid size={{ xs: 12, md: 5 }}>
        <Card sx={{ height: '100%' }}>
          <CardHeader
            title='Xem trước thông báo (Live Preview)'
            subheader='Mô phỏng hiển thị trên máy tính và điện thoại'
          />
          <CardContent>
            {/* Desktop Mockup */}
            <Typography variant='caption' fontWeight={700} color='text.secondary' sx={{ mb: 1, display: 'block' }}>
              MÁY TÍNH (Windows / Mac)
            </Typography>
            <Box
              sx={{
                p: 2,
                borderRadius: 2.5,
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                mb: 4
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                <Avatar
                  src={icon || '/images/logos/IMG_2911.png'}
                  alt='Icon'
                  sx={{ width: 40, height: 40, borderRadius: 1.5 }}
                />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant='subtitle2' fontWeight={700} noWrap>
                      {title || 'Tiêu đề thông báo mẫu'}
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      Vừa xong
                    </Typography>
                  </Box>
                  <Typography variant='body2' color='text.secondary' sx={{ wordBreak: 'break-word', mt: 0.5 }}>
                    {body || 'Nội dung thông báo sẽ xuất hiện ở đây khi được gửi đến thiết bị của người dùng.'}
                  </Typography>
                  {image && (
                    <Box
                      component='img'
                      src={image}
                      alt='Preview attachment'
                      sx={{ width: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 1.5, mt: 1.5 }}
                    />
                  )}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                    <i className='ri-global-line' style={{ fontSize: '0.8rem', color: '#888' }} />
                    <Typography variant='caption' color='text.secondary'>
                      taekwondotandat.biz.vn
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>

            {/* Mobile Mockup */}
            <Typography variant='caption' fontWeight={700} color='text.secondary' sx={{ mb: 1, display: 'block' }}>
              ĐIỆN THOẠI (Android / iOS)
            </Typography>
            <Box
              sx={{
                p: 2,
                borderRadius: 3,
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Avatar src={icon || '/images/logos/IMG_2911.png'} sx={{ width: 20, height: 20 }} />
                <Typography variant='caption' fontWeight={600} color='text.secondary'>
                  CMIS • Tấn Đạt Taekwondo
                </Typography>
                <Typography variant='caption' color='text.disabled' sx={{ ml: 'auto' }}>
                  Bây giờ
                </Typography>
              </Box>
              <Typography variant='subtitle2' fontWeight={700} noWrap>
                {title || 'Tiêu đề thông báo'}
              </Typography>
              <Typography variant='body2' color='text.secondary' sx={{ wordBreak: 'break-word', mt: 0.5 }}>
                {body || 'Nội dung tin nhắn thông báo hiển thị trên màn hình khóa hoặc thanh thông báo.'}
              </Typography>
              {image && (
                <Box
                  component='img'
                  src={image}
                  alt='Preview attachment'
                  sx={{ width: '100%', maxHeight: 130, objectFit: 'cover', borderRadius: 2, mt: 1 }}
                />
              )}
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Confirmation Dialog */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth='xs' fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <i className='ri-question-line' style={{ color: '#1877f2', fontSize: '1.5rem' }} />
          Xác nhận phát thông báo
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant='body2' gutterBottom>
            Bạn có chắc chắn muốn {sendTiming === 'scheduled' ? 'lên lịch gửi' : 'phát ngay'} thông báo này không?
          </Typography>
          <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
            <Typography variant='subtitle2' fontWeight={700}>
              {title}
            </Typography>
            <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mt: 0.5 }}>
              Đối tượng: <strong>{targetType}</strong> ({estimateCount ? `${estimateCount.totalSubscribers} thiết bị` : '0'})
            </Typography>
            {sendTiming === 'scheduled' && (
              <Typography variant='caption' color='primary.main' sx={{ display: 'block', mt: 0.5, fontWeight: 600 }}>
                Thời gian gửi: {new Date(scheduledAt).toLocaleString('vi-VN')}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} disabled={submitting}>
            Hủy
          </Button>
          <Button
            onClick={handleExecuteSend}
            variant='contained'
            color='primary'
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={16} color='inherit' /> : <i className='ri-check-line' />}
          >
            {submitting ? 'Đang xử lý...' : 'Xác nhận gửi'}
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  )
}

export default WebPushComposeTab
