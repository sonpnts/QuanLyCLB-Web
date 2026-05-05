'use client'

import { useEffect, useRef, useState } from 'react'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid2'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'

import userDocumentService from '@/services/userDocumentService'
import type { UserDocumentDto, UserDocumentType } from '@/types/apps/userDocumentTypes'
import {
  documentStatusColors,
  documentStatusLabels,
  documentTypeAccept,
  documentTypeIcons,
  documentTypeLabels
} from '@/types/apps/userDocumentTypes'
import { useNotification } from '@/contexts/notificationContext'

// Loại tài liệu chỉ được phép 1 file (singleton)
const SINGLETON_TYPES: UserDocumentType[] = [0, 1, 3]

// Cấu hình hiển thị từng loại
const DOCUMENT_CONFIGS: { type: UserDocumentType; hint: string }[] = [
  { type: 0, hint: 'Ảnh chân dung, tối đa 10 MB (JPEG/PNG/WEBP)' },
  { type: 1, hint: 'Scan bằng đẳng cấp, tối đa 10 MB (PDF/ảnh)' },
  { type: 2, hint: 'Scan chứng chỉ. Có thể tải nhiều file.' },
  { type: 3, hint: 'Ảnh chụp màn hình chuyển khoản, tối đa 10 MB (JPEG/PNG/WEBP)' }
]

// ── Document Card ─────────────────────────────────────────────────────────────

const DocumentCard = ({
  config,
  docs,
  onUpload,
  onDelete,
  loading
}: {
  config: (typeof DOCUMENT_CONFIGS)[number]
  docs: UserDocumentDto[]
  onUpload: (type: UserDocumentType, file: File) => Promise<void>
  onDelete: (doc: UserDocumentDto) => void
  loading: boolean
}) => {
  const fileRef = useRef<HTMLInputElement>(null)
  const isSingleton = SINGLETON_TYPES.includes(config.type)
  const canUpload = !isSingleton || docs.length === 0

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await onUpload(config.type, file)
    e.target.value = ''
  }

  const isImage = (contentType: string) => contentType.startsWith('image/')

  return (
    <Card variant='outlined'>
      <CardContent className='flex flex-col gap-3'>
        {/* Header */}
        <Box className='flex items-center gap-2'>
          <Box
            className='flex items-center justify-center rounded-lg'
            sx={{ width: 40, height: 40, bgcolor: 'primary.lighter' }}
          >
            <i className={`${documentTypeIcons[config.type]} text-xl text-primary`} />
          </Box>
          <Box className='flex-1'>
            <Typography variant='subtitle1' fontWeight={600}>
              {documentTypeLabels[config.type]}
            </Typography>
            <Typography variant='caption' color='text.secondary'>
              {config.hint}
            </Typography>
          </Box>
          {canUpload && (
            <Tooltip title={isSingleton ? 'Tải lên' : 'Thêm file'}>
              <span>
                <IconButton color='primary' size='small' onClick={() => fileRef.current?.click()} disabled={loading}>
                  <i className='ri-upload-2-line' />
                </IconButton>
              </span>
            </Tooltip>
          )}
          <input
            ref={fileRef}
            type='file'
            hidden
            accept={documentTypeAccept[config.type]}
            onChange={handleFileChange}
          />
        </Box>

        <Divider />

        {/* File list */}
        {docs.length === 0 ? (
          <Box
            className='flex flex-col items-center justify-center gap-2 py-4 rounded-lg border-2 border-dashed cursor-pointer'
            sx={{ borderColor: 'divider' }}
            onClick={() => fileRef.current?.click()}
          >
            <i className='ri-upload-cloud-2-line text-3xl text-textDisabled' />
            <Typography variant='body2' color='text.secondary'>
              Chưa có file — click để tải lên
            </Typography>
          </Box>
        ) : (
          <Box className='flex flex-col gap-2'>
            {docs.map(doc => (
              <Box
                key={doc.id}
                className='flex items-center gap-2 p-2 rounded-lg'
                sx={{ bgcolor: 'action.hover' }}
              >
                {/* Preview / icon */}
                {isImage(doc.contentType) ? (
                  <Box
                    component='img'
                    src={doc.fileUrl}
                    alt={doc.fileName}
                    sx={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 1, flexShrink: 0 }}
                  />
                ) : (
                  <Box
                    className='flex items-center justify-center rounded'
                    sx={{ width: 48, height: 48, bgcolor: 'error.lighter', flexShrink: 0 }}
                  >
                    <i className='ri-file-pdf-2-line text-2xl text-error' />
                  </Box>
                )}

                {/* Info */}
                <Box className='flex-1 min-w-0'>
                  <Typography variant='body2' fontWeight={500} noWrap>
                    {doc.fileName}
                  </Typography>
                  <Box className='flex items-center gap-1 mt-0.5'>
                    <Chip
                      label={documentStatusLabels[doc.status]}
                      size='small'
                      color={documentStatusColors[doc.status]}
                      variant='tonal'
                    />
                    {doc.status === 2 && doc.resubmissionReason && (
                      <Tooltip title={`Lý do: ${doc.resubmissionReason}`}>
                        <i className='ri-information-line text-error cursor-help' />
                      </Tooltip>
                    )}
                  </Box>
                </Box>

                {/* Actions */}
                <Box className='flex items-center gap-0.5 shrink-0'>
                  <Tooltip title='Xem file'>
                    <IconButton size='small' href={doc.fileUrl} target='_blank' rel='noopener'>
                      <i className='ri-eye-line text-sm' />
                    </IconButton>
                  </Tooltip>
                  {isSingleton && (
                    <Tooltip title='Thay thế'>
                      <IconButton size='small' color='primary' onClick={() => fileRef.current?.click()} disabled={loading}>
                        <i className='ri-refresh-line text-sm' />
                      </IconButton>
                    </Tooltip>
                  )}
                  <Tooltip title='Xóa'>
                    <IconButton size='small' color='error' onClick={() => onDelete(doc)} disabled={loading}>
                      <i className='ri-delete-bin-line text-sm' />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            ))}

            {/* Thêm file (chỉ với Certificate) */}
            {!isSingleton && (
              <Button
                variant='outlined'
                size='small'
                startIcon={<i className='ri-add-line' />}
                onClick={() => fileRef.current?.click()}
                disabled={loading}
              >
                Thêm chứng chỉ
              </Button>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

// ── Main Tab ──────────────────────────────────────────────────────────────────

const DocumentsTab = () => {
  const [docs, setDocs] = useState<UserDocumentDto[]>([])
  const [loading, setLoading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<UserDocumentDto | null>(null)
  const { showNotification } = useNotification()

  const load = async () => {
    setLoading(true)
    const res = await userDocumentService.getMyDocuments()
    if (res.success) setDocs(res.data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleUpload = async (type: UserDocumentType, file: File) => {
    setLoading(true)
    const res = await userDocumentService.uploadMyDocument(type, file)
    if (res.success) {
      showNotification(res.message || 'Tải lên thành công!', 'success')
      await load()
    } else {
      showNotification(res.message || 'Tải lên thất bại.', 'error')
    }
    setLoading(false)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setLoading(true)
    const res = await userDocumentService.deleteMyDocument(deleteTarget.id)
    if (res.success) {
      setDocs(prev => prev.filter(d => d.id !== deleteTarget.id))
      showNotification('Đã xóa tài liệu.', 'success')
    } else {
      showNotification(res.message || 'Không thể xóa.', 'error')
    }
    setDeleteTarget(null)
    setLoading(false)
  }

  const docsByType = (type: UserDocumentType) => docs.filter(d => d.documentType === type)

  return (
    <>
      {loading && (
        <Box className='flex justify-center py-4'>
          <CircularProgress size={28} />
        </Box>
      )}

      <Grid container spacing={4}>
        {DOCUMENT_CONFIGS.map(cfg => (
          <Grid key={cfg.type} size={{ xs: 12, md: 6 }}>
            <DocumentCard
              config={cfg}
              docs={docsByType(cfg.type)}
              onUpload={handleUpload}
              onDelete={setDeleteTarget}
              loading={loading}
            />
          </Grid>
        ))}
      </Grid>

      {/* Confirm delete dialog */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth='xs' fullWidth>
        <DialogTitle>Xác nhận xóa</DialogTitle>
        <DialogContent>
          <Typography>
            Xóa file <strong>{deleteTarget?.fileName}</strong>? Hành động này không thể hoàn tác.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Hủy</Button>
          <Button variant='contained' color='error' onClick={handleDelete} disabled={loading}>
            Xóa
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default DocumentsTab
