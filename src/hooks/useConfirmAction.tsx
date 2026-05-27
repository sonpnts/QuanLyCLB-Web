import { useCallback, useEffect, useRef, useState } from 'react'

import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Typography from '@mui/material/Typography'

export type ConfirmActionOptions = {
  title?: string
  description?: string
  confirmText?: string
  cancelText?: string
  confirmColor?: 'error' | 'primary' | 'warning' | 'info' | 'success'
}

const defaultOptions: Required<ConfirmActionOptions> = {
  title: 'Xác nhận thao tác',
  description: 'Bạn có chắc chắn muốn tiếp tục?',
  confirmText: 'Xác nhận',
  cancelText: 'Hủy',
  confirmColor: 'error'
}

export const useConfirmAction = () => {
  const resolverRef = useRef<((value: boolean) => void) | null>(null)
  const [open, setOpen] = useState(false)
  const [options, setOptions] = useState<Required<ConfirmActionOptions>>(defaultOptions)

  const closeDialog = useCallback((confirmed: boolean) => {
    setOpen(false)

    if (resolverRef.current) {
      resolverRef.current(confirmed)
      resolverRef.current = null
    }
  }, [])

  const confirm = useCallback((nextOptions?: ConfirmActionOptions) => {
    setOptions({ ...defaultOptions, ...nextOptions })
    setOpen(true)

    return new Promise<boolean>(resolve => {
      resolverRef.current = resolve
    })
  }, [])

  useEffect(() => {
    return () => {
      if (resolverRef.current) {
        resolverRef.current(false)
        resolverRef.current = null
      }
    }
  }, [])

  const confirmDialog = (
    <Dialog open={open} onClose={() => closeDialog(false)} maxWidth='xs' fullWidth>
      <DialogTitle>{options.title}</DialogTitle>
      <DialogContent>
        <Typography>{options.description}</Typography>
      </DialogContent>
      <DialogActions>
        <Button variant='outlined' color='secondary' onClick={() => closeDialog(false)}>
          {options.cancelText}
        </Button>
        <Button variant='contained' color={options.confirmColor} onClick={() => closeDialog(true)}>
          {options.confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  )

  return { confirm, confirmDialog }
}

export default useConfirmAction
