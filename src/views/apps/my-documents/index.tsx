'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
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

import { useNotification } from '@/contexts/notificationContext'
import userDocumentService from '@/services/userDocumentService'
import type { UserDocumentDto, UserDocumentType } from '@/types/apps/userDocumentTypes'
import { formatDateVN } from '@/utils/dateTime'
import {
  documentStatusColors,
  documentStatusLabels,
  documentTypeAccept,
  documentTypeIcons,
  documentTypeLabels
} from '@/types/apps/userDocumentTypes'

// ── Enum normaliser ───────────────────────────────────────────────────────────
// Backend dùng JsonStringEnumConverter → documentType có thể là string ("ProfilePhoto")
// hoặc number (0). Hàm này chuẩn hóa về số để so sánh.

const DOC_TYPE_NAME_MAP: Record<string, number> = {
  ProfilePhoto: 0,    profilePhoto: 0,
  BeltCertificate: 1, beltCertificate: 1,
  Certificate: 2,     certificate: 2,
  BankTransferProof: 3, bankTransferProof: 3
}

const resolveDocType = (t: unknown): UserDocumentType => {
  if (typeof t === 'number' && t >= 0 && t <= 3) return t as UserDocumentType

  if (typeof t === 'string') {
    const mapped = DOC_TYPE_NAME_MAP[t]

    if (mapped !== undefined) return mapped as UserDocumentType
    const n = parseInt(t, 10)

    if (!isNaN(n) && n >= 0 && n <= 3) return n as UserDocumentType
  }

  return 0
}

/** Label an toàn: ưu tiên documentTypeLabel từ DTO, fallback lookup theo type */
const getLabel = (doc: UserDocumentDto) =>
  doc.documentTypeLabel || documentTypeLabels[resolveDocType(doc.documentType)]

// ── Constants ─────────────────────────────────────────────────────────────────

const SINGLETON_TYPES: UserDocumentType[] = [0, 1] // ProfilePhoto, BeltCertificate
const CERT_TYPE: UserDocumentType = 2

const subtitleMap: Record<UserDocumentType, string> = {
  0: 'JPG / PNG / WebP · tối đa 10 MB',
  1: 'PDF hoặc ảnh · tối đa 10 MB',
  2: 'PDF hoặc ảnh · tối đa 10 MB',
  3: ''
}

const newestFirst = (a: UserDocumentDto, b: UserDocumentDto) =>
  new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()

// ── Main View ─────────────────────────────────────────────────────────────────

const MyDocumentsView = () => {
  const [docs, setDocs] = useState<UserDocumentDto[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState<UserDocumentType | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [previewDoc, setPreviewDoc] = useState<UserDocumentDto | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<UserDocumentDto | null>(null)

  const fileRefs = useRef<Partial<Record<UserDocumentType, HTMLInputElement | null>>>({})
  const { showNotification } = useNotification()

  const load = useCallback(async () => {
    setLoading(true)
    const res = await userDocumentService.getMyDocuments()

    if (res.success) setDocs(res.data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // ── Helpers ────────────────────────────────────────────────────────────────

  /** Tìm doc mới nhất của 1 type đơn (ProfilePhoto / BeltCertificate) */
  const getSingleDoc = (type: UserDocumentType) =>
    docs
      .filter(d => resolveDocType(d.documentType) === type && d.isActive)
      .sort(newestFirst)[0] ?? null

  /** Tất cả chứng chỉ */
  const getCertDocs = () =>
    docs.filter(d => resolveDocType(d.documentType) === CERT_TYPE && d.isActive).sort(newestFirst)

  const hasNewerSubmission = (doc: UserDocumentDto) =>
    docs.some(
      next =>
        next.isActive &&
        next.id !== doc.id &&
        resolveDocType(next.documentType) === resolveDocType(doc.documentType) &&
        new Date(next.createdAt).getTime() > new Date(doc.createdAt).getTime()
    )

  /** Docs đang yêu cầu nộp lại */
  const needsResubmitDocs = docs.filter(d => d.isActive && d.status === 2 && !hasNewerSubmission(d))
  const submittedDocsCount = docs.filter(d => d.isActive && d.status !== 2).length
  const needsResubmitCount = needsResubmitDocs.length

  const triggerUpload = (type: UserDocumentType) => fileRefs.current[type]?.click()
  const allTypes: UserDocumentType[] = [...SINGLETON_TYPES, CERT_TYPE]

  // ── Upload / Delete ────────────────────────────────────────────────────────

  const handleUpload = async (type: UserDocumentType, file: File) => {
    setUploading(type)
    const res = await userDocumentService.uploadMyDocument(type, file)

    if (res.success && res.data) {
      showNotification('Tải lên thành công', 'success')
      const refreshRes = await userDocumentService.getMyDocuments()

      if (refreshRes.success) {
        setDocs(refreshRes.data ?? [])
        const uploaded = (refreshRes.data ?? []).find(d => d.id === res.data!.id)

        if (uploaded) setPreviewDoc(uploaded)
      }
    } else {
      showNotification(res.message || 'Tải lên thất bại', 'error')
    }

    setUploading(null)
  }

  const handleDelete = async () => {
    if (!confirmDelete) return
    setDeleting(confirmDelete.id)
    const res = await userDocumentService.deleteMyDocument(confirmDelete.id)

    if (res.success) {
      showNotification('Đã xóa tài liệu', 'success')
      setDocs(prev => prev.filter(d => d.id !== confirmDelete.id))
    } else {
      showNotification(res.message || 'Không thể xóa', 'error')
    }

    setDeleting(null)
    setConfirmDelete(null)
  }

  // ── Loading state ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <Box className='flex justify-center items-center p-12'>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <>
      {/* Hidden file inputs */}
      {allTypes.map(type => (
        <input
          key={type}
          type='file'
          accept={documentTypeAccept[type]}
          style={{ display: 'none' }}
          ref={el => { fileRefs.current[type] = el }}
          onChange={e => {
            const file = e.target.files?.[0]

            if (file) handleUpload(type, file)
            e.target.value = ''
          }}
        />
      ))}

      {/* Banners yêu cầu nộp lại */}
      {needsResubmitDocs.length > 0 && (
        <Box className='flex flex-col gap-2 mb-5'>
          {needsResubmitDocs.map(doc => (
            <Alert
              key={doc.id}
              severity='error'
              icon={<i className='ri-mail-send-line' />}
              action={
                <Button size='small' color='error' variant='outlined' onClick={() => setPreviewDoc(doc)}>
                  Xem & nộp lại
                </Button>
              }
            >
              <AlertTitle>
                Yêu cầu nộp lại: <strong>{getLabel(doc)}</strong>
              </AlertTitle>
              {doc.resubmissionReason || 'Quản trị viên yêu cầu bạn nộp lại tài liệu này.'}
            </Alert>
          ))}
        </Box>
      )}

      <Box className='mb-5'>
        <Alert severity='info' icon={<i className='ri-information-line' />}>
          <AlertTitle>Trạng thái tài liệu của bạn</AlertTitle>
          <Box className='flex items-center gap-2 flex-wrap mt-2'>
            <Chip size='small' color='success' label={`Đã nộp / hợp lệ: ${submittedDocsCount}`} />
            <Chip size='small' color='error' label={`Cần nộp lại: ${needsResubmitCount}`} />
          </Box>
        </Alert>
      </Box>

      {/* Cards */}
      <Grid container spacing={5}>
        {SINGLETON_TYPES.map(type => {
          const doc = getSingleDoc(type)

          return (
            <Grid key={type} size={{ xs: 12, sm: 6 }}>
              <SingletonDocumentCard
                type={type}
                doc={doc}
                isUploading={uploading === type}
                isDeleting={doc ? deleting === doc.id : false}
                onPreview={d => setPreviewDoc(d)}
                onDelete={d => setConfirmDelete(d)}
                onTriggerUpload={() => triggerUpload(type)}
              />
            </Grid>
          )
        })}

        <Grid size={{ xs: 12 }}>
          <CertificatesCard
            docs={getCertDocs()}
            isUploading={uploading === CERT_TYPE}
            deletingId={deleting}
            onPreview={d => setPreviewDoc(d)}
            onDelete={d => setConfirmDelete(d)}
            onTriggerUpload={() => triggerUpload(CERT_TYPE)}
          />
        </Grid>
      </Grid>

      {/* ── Preview dialog ── */}
      <Dialog open={!!previewDoc} onClose={() => setPreviewDoc(null)} maxWidth='md' fullWidth>
        <DialogTitle sx={{ pr: 6 }}>
          <Box className='flex items-center gap-2 flex-wrap'>
            <i className={`${documentTypeIcons[resolveDocType(previewDoc?.documentType)]} text-lg`} />
            <Typography fontWeight={600}>{previewDoc ? getLabel(previewDoc) : ''}</Typography>
            {previewDoc && (
              <Chip
                label={documentStatusLabels[previewDoc.status]}
                size='small'
                color={documentStatusColors[previewDoc.status]}
              />
            )}
          </Box>
          <Typography variant='caption' color='text.secondary' display='block' sx={{ mt: 0.25 }}>
            {previewDoc?.fileName} · {previewDoc && formatDateVN(previewDoc.createdAt)}
          </Typography>
          <IconButton sx={{ position: 'absolute', right: 8, top: 8 }} onClick={() => setPreviewDoc(null)}>
            <i className='ri-close-line' />
          </IconButton>
        </DialogTitle>

        {previewDoc?.status === 2 && (
          <Alert severity='error' sx={{ mx: 2 }} icon={<i className='ri-error-warning-line' />}>
            <AlertTitle>Cần nộp lại</AlertTitle>
            {previewDoc.resubmissionReason || 'Quản trị viên yêu cầu bạn nộp lại tài liệu này.'}
          </Alert>
        )}

        <DialogContent dividers>
          {previewDoc?.contentType.startsWith('image/') ? (
            <Box component='img' src={previewDoc.fileUrl} alt={previewDoc.fileName}
              sx={{ width: '100%', borderRadius: 1 }} />
          ) : (
            <Box component='iframe' src={previewDoc?.fileUrl}
              sx={{ width: '100%', height: 520, border: 0 }} />
          )}
        </DialogContent>

        <DialogActions>
          <Button href={previewDoc?.fileUrl ?? ''} download={previewDoc?.fileName} target='_blank' rel='noreferrer'>
            <i className='ri-download-line mr-1' />Tải xuống
          </Button>
          {previewDoc?.status === 2 && (
            <Button variant='contained' color='error' onClick={() => {
              const type = resolveDocType(previewDoc.documentType)

              setPreviewDoc(null)
              setTimeout(() => triggerUpload(type), 100)
            }}>
              <i className='ri-upload-2-line mr-1' />Nộp lại ngay
            </Button>
          )}
          <Button onClick={() => setPreviewDoc(null)}>Đóng</Button>
        </DialogActions>
      </Dialog>

      {/* ── Confirm delete ── */}
      <Dialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)} maxWidth='xs' fullWidth>
        <DialogTitle>Xác nhận xóa</DialogTitle>
        <DialogContent>
          <Typography>
            Bạn có chắc muốn xóa <strong>{confirmDelete ? getLabel(confirmDelete) : ''}</strong>{' '}
            &ldquo;{confirmDelete?.fileName}&rdquo;? Thao tác này không thể hoàn tác.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(null)} disabled={!!deleting}>Hủy</Button>
          <Button variant='contained' color='error' onClick={handleDelete} disabled={!!deleting}
            startIcon={deleting ? <CircularProgress size={14} color='inherit' /> : undefined}>
            {deleting ? 'Đang xóa...' : 'Xóa'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

// ── Singleton Document Card ───────────────────────────────────────────────────

type SingletonCardProps = {
  type: UserDocumentType
  doc: UserDocumentDto | null
  isUploading: boolean
  isDeleting: boolean
  onPreview: (doc: UserDocumentDto) => void
  onDelete: (doc: UserDocumentDto) => void
  onTriggerUpload: () => void
}

const SingletonDocumentCard = ({
  type, doc, isUploading, isDeleting,
  onPreview, onDelete, onTriggerUpload
}: SingletonCardProps) => {
  const isImage = doc?.contentType.startsWith('image/')
  const needsResubmit = doc?.status === 2

  return (
    <Card
      variant='outlined'
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderColor: needsResubmit ? 'error.main' : undefined,
        borderWidth: needsResubmit ? 2 : undefined
      }}
    >
      {/* Header */}
      <CardHeader
        avatar={<i className={`${documentTypeIcons[type]} text-xl`} />}
        title={documentTypeLabels[type]}
        titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
        subheader={subtitleMap[type]}
        subheaderTypographyProps={{ variant: 'caption' }}
        action={
          doc
            ? <Chip label={documentStatusLabels[doc.status]} size='small' color={documentStatusColors[doc.status]} />
            : undefined
        }
      />

      <CardContent sx={{ flex: 1, p: '0 !important', display: 'flex', flexDirection: 'column' }}>
        {doc ? (

          // ── Đã có file: hiện bản xem trước ──────────────────────────────
          <>
            {/* Preview area */}
            <Box
              onClick={() => onPreview(doc)}
              sx={{
                position: 'relative',
                cursor: 'pointer',
                bgcolor: isImage ? 'black' : 'action.hover',
                overflow: 'hidden',
                flexShrink: 0,
                aspectRatio: type === 0 ? '3/4' : '4/3',
                maxHeight: type === 0 ? 340 : 280,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                '&:hover .overlay-hint': { opacity: 1 }
              }}
            >
              {/* Ảnh / PDF */}
              {isImage ? (
                <Box
                  component='img'
                  src={doc.fileUrl}
                  alt={doc.fileName}
                  sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: type === 0 ? 'cover' : 'contain',
                    display: 'block'
                  }}
                />
              ) : (
                <Box className='flex flex-col items-center gap-3 p-6 text-center'>
                  <i className='ri-file-pdf-line' style={{ fontSize: 80, color: '#d32f2f' }} />
                  <Typography variant='body2' color='text.secondary' sx={{ wordBreak: 'break-all' }}>
                    {doc.fileName}
                  </Typography>
                </Box>
              )}

              {/* Hover overlay: zoom hint */}
              <Box
                className='overlay-hint'
                sx={{
                  position: 'absolute', inset: 0,
                  bgcolor: 'rgba(0,0,0,0.38)',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 1,
                  opacity: 0, transition: 'opacity 0.2s'
                }}
              >
                <i className='ri-zoom-in-line' style={{ fontSize: 36, color: 'white' }} />
                <Typography variant='caption' sx={{ color: 'white' }}>Nhấn để xem đầy đủ</Typography>
              </Box>

              {/* Uploading replacement overlay */}
              {isUploading && (
                <Box
                  sx={{
                    position: 'absolute', inset: 0,
                    bgcolor: 'rgba(0,0,0,0.55)',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: 2
                  }}
                >
                  <CircularProgress sx={{ color: 'white' }} />
                  <Typography variant='caption' sx={{ color: 'white' }}>Đang tải lên...</Typography>
                </Box>
              )}
            </Box>

            {/* Resubmit reason */}
            {needsResubmit && doc.resubmissionReason && (
              <Alert severity='error' icon={<i className='ri-error-warning-line' />}
                sx={{ borderRadius: 0, py: 0.5, borderLeft: 0, borderRight: 0 }}>
                <Typography variant='caption'>{doc.resubmissionReason}</Typography>
              </Alert>
            )}

            {/* Toolbar */}
            <Box
              sx={{
                display: 'flex', alignItems: 'center', gap: 1,
                px: 2, py: 1.5,
                borderTop: '1px solid', borderColor: 'divider',
                bgcolor: 'background.paper', mt: 'auto'
              }}
            >
              <Typography variant='caption' color='text.secondary' noWrap sx={{ flex: 1 }}>
                {new Date(doc.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </Typography>
              <Tooltip title='Xem đầy đủ'>
                <IconButton size='small' onClick={() => onPreview(doc)}>
                  <i className='ri-eye-line' />
                </IconButton>
              </Tooltip>
              <Tooltip title='Tải xuống'>
                <IconButton size='small' component='a' href={doc.fileUrl} download={doc.fileName} target='_blank'>
                  <i className='ri-download-line' />
                </IconButton>
              </Tooltip>
              <Button
                variant='outlined'
                size='small'
                color={needsResubmit ? 'error' : 'primary'}
                startIcon={<i className='ri-refresh-line' />}
                onClick={onTriggerUpload}
                disabled={isUploading}
              >
                {needsResubmit ? 'Nộp lại' : 'Thay thế'}
              </Button>
              <Tooltip title='Xóa'>
                <IconButton size='small' color='error' onClick={() => onDelete(doc)} disabled={isDeleting || isUploading}>
                  {isDeleting
                    ? <CircularProgress size={14} color='inherit' />
                    : <i className='ri-delete-bin-line' />
                  }
                </IconButton>
              </Tooltip>
            </Box>
          </>
        ) : (

          // ── Chưa có file: vùng tải lên ──────────────────────────────────
          <Box
            onClick={!isUploading ? onTriggerUpload : undefined}
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2.5,
              minHeight: type === 0 ? 280 : 220,
              cursor: isUploading ? 'default' : 'pointer',
              m: 2,
              borderRadius: 2,
              border: '2px dashed',
              borderColor: 'divider',
              transition: 'border-color 0.2s, background 0.2s',
              ...(!isUploading && {
                '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' }
              })
            }}
          >
            {isUploading ? (
              <>
                <CircularProgress size={40} />
                <Typography variant='body2' color='text.secondary'>Đang tải lên...</Typography>
              </>
            ) : (
              <>
                <Box
                  sx={{
                    width: 64, height: 64, borderRadius: '50%',
                    bgcolor: 'action.selected',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                >
                  <i className='ri-upload-cloud-2-line' style={{ fontSize: 30 }} />
                </Box>
                <Box className='text-center px-4'>
                  <Typography variant='body2' fontWeight={500} gutterBottom>
                    Chưa có tài liệu
                  </Typography>
                  <Typography variant='caption' color='text.secondary'>
                    {subtitleMap[type]}
                  </Typography>
                </Box>
                <Button
                  variant='contained'
                  size='small'
                  startIcon={<i className='ri-upload-2-line' />}
                  onClick={e => { e.stopPropagation(); onTriggerUpload() }}
                >
                  Chọn file tải lên
                </Button>
              </>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

// ── Certificates Card (multi) ─────────────────────────────────────────────────

type CertificatesCardProps = {
  docs: UserDocumentDto[]
  isUploading: boolean
  deletingId: string | null
  onPreview: (doc: UserDocumentDto) => void
  onDelete: (doc: UserDocumentDto) => void
  onTriggerUpload: () => void
}

const CertificatesCard = ({
  docs, isUploading, deletingId, onPreview, onDelete, onTriggerUpload
}: CertificatesCardProps) => (
  <Card variant='outlined'>
    <CardHeader
      avatar={<i className='ri-file-text-line text-xl' />}
      title='Chứng chỉ'
      titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
      subheader='Có thể tải lên nhiều chứng chỉ — PDF hoặc ảnh, tối đa 10 MB mỗi file'
      subheaderTypographyProps={{ variant: 'caption' }}
      action={
        <Button
          variant='contained'
          size='small'
          startIcon={isUploading ? <CircularProgress size={14} color='inherit' /> : <i className='ri-add-line' />}
          onClick={onTriggerUpload}
          disabled={isUploading}
        >
          {isUploading ? 'Đang tải...' : 'Thêm chứng chỉ'}
        </Button>
      }
    />
    <Divider />
    <CardContent>
      {docs.length === 0 && !isUploading ? (

        // ── Chưa có chứng chỉ nào ──
        <Box
          onClick={onTriggerUpload}
          sx={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: 2, py: 8,
            border: '2px dashed', borderColor: 'divider', borderRadius: 2,
            cursor: 'pointer',
            transition: 'border-color 0.2s, background 0.2s',
            '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' }
          }}
        >
          <Box sx={{
            width: 56, height: 56, borderRadius: '50%', bgcolor: 'action.selected',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <i className='ri-upload-cloud-2-line' style={{ fontSize: 26 }} />
          </Box>
          <Box className='text-center'>
            <Typography variant='body2' fontWeight={500} gutterBottom>Chưa có chứng chỉ nào</Typography>
            <Typography variant='caption' color='text.secondary'>PDF hoặc ảnh · tối đa 10 MB mỗi file</Typography>
          </Box>
          <Button variant='contained' size='small' startIcon={<i className='ri-upload-2-line' />}
            onClick={e => e.stopPropagation()}>
            Chọn file tải lên
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {/* Cert cards */}
          {docs.map(doc => {
            const isImage = doc.contentType.startsWith('image/')
            const isDeleting = deletingId === doc.id
            const needsResubmit = doc.status === 2

            return (
              <Grid key={doc.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                <Card
                  variant='outlined'
                  sx={{
                    borderColor: needsResubmit ? 'error.main' : undefined,
                    borderWidth: needsResubmit ? 2 : undefined,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  {/* Thumbnail */}
                  <Box
                    onClick={() => onPreview(doc)}
                    sx={{
                      position: 'relative',
                      cursor: 'pointer',
                      bgcolor: isImage ? 'black' : 'action.hover',
                      aspectRatio: '4/3',
                      overflow: 'hidden',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      '&:hover .overlay-hint': { opacity: 1 }
                    }}
                  >
                    {isImage ? (
                      <Box component='img' src={doc.fileUrl} alt={doc.fileName}
                        sx={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    ) : (
                      <Box className='flex flex-col items-center gap-2 p-4 text-center'>
                        <i className='ri-file-pdf-line' style={{ fontSize: 52, color: '#d32f2f' }} />
                        <Typography variant='caption' color='text.secondary' sx={{ wordBreak: 'break-all', lineClamp: 2 }}>
                          {doc.fileName}
                        </Typography>
                      </Box>
                    )}

                    {/* Hover overlay */}
                    <Box className='overlay-hint' sx={{
                      position: 'absolute', inset: 0,
                      bgcolor: 'rgba(0,0,0,0.3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      opacity: 0, transition: 'opacity 0.2s'
                    }}>
                      <i className='ri-zoom-in-line' style={{ fontSize: 28, color: 'white' }} />
                    </Box>

                    {/* Status badge */}
                    <Box sx={{ position: 'absolute', top: 6, right: 6 }}>
                      <Chip
                        label={documentStatusLabels[doc.status]}
                        size='small'
                        color={documentStatusColors[doc.status]}
                      />
                    </Box>
                  </Box>

                  {/* Resubmit reason */}
                  {needsResubmit && doc.resubmissionReason && (
                    <Alert severity='error' icon={false} sx={{ py: 0.25, px: 1.5, borderRadius: 0 }}>
                      <Typography variant='caption'>{doc.resubmissionReason}</Typography>
                    </Alert>
                  )}

                  {/* Toolbar */}
                  <Box sx={{
                    display: 'flex', alignItems: 'center', gap: 0.5,
                    px: 1.5, py: 1,
                    borderTop: '1px solid', borderColor: 'divider',
                    mt: 'auto'
                  }}>
                    <Typography variant='caption' color='text.secondary' noWrap sx={{ flex: 1, fontSize: 11 }}>
                      {formatDateVN(doc.createdAt)}
                    </Typography>
                    <Tooltip title='Xem'>
                      <IconButton size='small' onClick={() => onPreview(doc)}>
                        <i className='ri-eye-line' style={{ fontSize: 15 }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title='Tải xuống'>
                      <IconButton size='small' component='a' href={doc.fileUrl} download={doc.fileName} target='_blank'>
                        <i className='ri-download-line' style={{ fontSize: 15 }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title='Xóa'>
                      <IconButton size='small' color='error' onClick={() => onDelete(doc)} disabled={isDeleting}>
                        {isDeleting
                          ? <CircularProgress size={13} color='inherit' />
                          : <i className='ri-delete-bin-line' style={{ fontSize: 15 }} />
                        }
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Card>
              </Grid>
            )
          })}

          {/* Loading card khi đang upload chứng chỉ mới */}
          {isUploading && (
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <Card variant='outlined' sx={{ height: '100%', minHeight: 160 }}>
                <Box sx={{
                  height: '100%', minHeight: 160,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 1.5
                }}>
                  <CircularProgress size={32} />
                  <Typography variant='caption' color='text.secondary'>Đang tải lên...</Typography>
                </Box>
              </Card>
            </Grid>
          )}
        </Grid>
      )}
    </CardContent>
  </Card>
)

export default MyDocumentsView

