'use client'

import { useEffect, useState } from 'react'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Drawer from '@mui/material/Drawer'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormHelperText from '@mui/material/FormHelperText'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import type { ProductType } from '@/types/apps/productTypes'
import productService from '@/services/productService'
import { useNotification } from '@/contexts/notificationContext'

type Props = {
    open: boolean
    handleClose: () => void
    product: ProductType | null
    onSaved: (updated: ProductType) => void
}

type FormErrors = {
    name?: string
    category?: string
    unitPrice?: string
}

const EditProductDrawer = ({ open, handleClose, product, onSaved }: Props) => {
    const { showNotification } = useNotification()

    const [formData, setFormData] = useState({
        name: '',
        category: '',
        unitPrice: '',
        description: '',
        isActive: true
    })

    const [errors, setErrors] = useState<FormErrors>({})
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (product) {
            setFormData({
                name: product.name || '',
                category: product.category || '',
                unitPrice: String(product.unitPrice || ''),
                description: product.description || '',
                isActive: product.isActive ?? true
            })
            setErrors({})
        }
    }, [product])

    const validate = (): boolean => {
        const newErrors: FormErrors = {}

        if (!formData.name.trim()) {
            newErrors.name = 'Tên sản phẩm không được để trống'
        }

        if (!formData.category.trim()) {
            newErrors.category = 'Danh mục không được để trống'
        }

        const price = Number(formData.unitPrice)

        if (!formData.unitPrice || isNaN(price) || price <= 0) {
            newErrors.unitPrice = 'Đơn giá phải lớn hơn 0'
        }

        setErrors(newErrors)

        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!product || !validate()) return

        try {
            setLoading(true)

            const response = await productService.updateProduct(product.id, {
                name: formData.name.trim(),
                category: formData.category.trim(),
                unitPrice: Number(formData.unitPrice),
                description: formData.description.trim() || undefined,
                isActive: formData.isActive
            })

            if (response.success && response.data) {
                onSaved(response.data)
                showNotification('Cập nhật sản phẩm thành công!', 'success')
                handleClose()
            } else {
                showNotification(response.message || 'Không thể cập nhật sản phẩm.', 'error')
            }
        } catch (error) {
            showNotification('Đã có lỗi khi cập nhật sản phẩm.', 'error')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Drawer
            open={open}
            onClose={handleClose}
            anchor='right'
            variant='temporary'
            ModalProps={{ keepMounted: true }}
            sx={{ '& .MuiDrawer-paper': { width: { xs: '100%', sm: 420 } } }}
        >
            <Box
                className='flex justify-between items-center pli-5 plb-4'
                sx={{ backgroundColor: 'background.default' }}
            >
                <Typography variant='h5'>Chỉnh sửa sản phẩm</Typography>
                <IconButton size='small' onClick={handleClose}>
                    <i className='ri-close-line text-2xl' />
                </IconButton>
            </Box>

            <Divider />

            {product && (
                <Box className='p-5'>
                    <Typography variant='body2' color='text.secondary' className='mb-4'>
                        Mã sản phẩm:{' '}
                        <Chip label={product.code} size='small' color='primary' variant='tonal' />
                    </Typography>
                </Box>
            )}

            <Box component='form' onSubmit={handleSubmit} className='flex flex-col gap-5 p-5'>
                <TextField
                    fullWidth
                    label='Tên sản phẩm *'
                    value={formData.name}
                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    error={!!errors.name}
                    helperText={errors.name}
                />

                <TextField
                    fullWidth
                    label='Danh mục *'
                    value={formData.category}
                    onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    error={!!errors.category}
                    helperText={errors.category}
                    placeholder='VD: Đồng phục, Dụng cụ tập...'
                />

                <FormControl error={!!errors.unitPrice}>
                    <TextField
                        fullWidth
                        label='Đơn giá *'
                        type='number'
                        inputProps={{ min: 0 }}
                        value={formData.unitPrice}
                        onChange={e => setFormData(prev => ({ ...prev, unitPrice: e.target.value }))}
                        error={!!errors.unitPrice}
                        InputProps={{
                            endAdornment: <InputAdornment position='end'>VND</InputAdornment>
                        }}
                    />
                    {errors.unitPrice && <FormHelperText>{errors.unitPrice}</FormHelperText>}
                </FormControl>

                <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label='Mô tả'
                    value={formData.description}
                    onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />

                <FormControlLabel
                    control={
                        <Switch
                            checked={formData.isActive}
                            onChange={e => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                            color='success'
                        />
                    }
                    label={formData.isActive ? 'Đang hoạt động' : 'Ngừng hoạt động'}
                />

                <Box className='flex items-center gap-4 mt-4'>
                    <Button fullWidth type='submit' variant='contained' disabled={loading}>
                        {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </Button>
                    <Button fullWidth variant='outlined' color='secondary' onClick={handleClose} disabled={loading}>
                        Hủy
                    </Button>
                </Box>
            </Box>
        </Drawer>
    )
}

export default EditProductDrawer
