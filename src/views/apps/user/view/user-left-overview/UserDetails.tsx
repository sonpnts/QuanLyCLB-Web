// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Button from '@mui/material/Button'
import type { ButtonProps } from '@mui/material/Button'

// Type Imports
import type { ThemeColor } from '@core/types'

// Component Imports
import EditUserInfo from '@components/dialogs/edit-user-info'
import ConfirmationDialog from '@components/dialogs/confirmation-dialog'
import OpenDialogOnElementClick from '@components/dialogs/OpenDialogOnElementClick'
import CustomAvatar from '@core/components/mui/Avatar'

// Vars
const userData = {
  firstName: 'Seth',
  lastName: 'Hallam',
  userName: '@shallamb',
  billingEmail: 'shallamb@gmail.com',
  status: 'active',
  role: 'Subscriber',
  taxId: 'Tax-8894',
  contact: '+1 (234) 464-0600',
  language: ['English'],
  country: 'France',
  useAsBillingAddress: true
}

const UserDetails = () => {
  const buttonProps = (children: string, color: ThemeColor, variant: ButtonProps['variant']): ButtonProps => ({
    children,
    color,
    variant
  })

  return (
    <>
      <Card>
        <CardContent className='flex flex-col pbs-12 gap-6'>
          <div className='flex flex-col gap-6'>
            <div className='flex items-center justify-center flex-col gap-4'>
              <div className='flex flex-col items-center gap-4'>
                <CustomAvatar alt='user-profile' src='/images/avatars/1.png' variant='rounded' size={120} />
                <Typography variant='h5'>{`${userData.firstName} ${userData.lastName}`}</Typography>
              </div>
              <Chip label='Subscriber' color='error' size='small' variant='tonal' />
            </div>
            <div className='flex items-center justify-around flex-wrap gap-4'>
              {/*<div className='flex items-center gap-4'>*/}
              {/*  <CustomAvatar variant='rounded' color='primary' skin='light'>*/}
              {/*    <i className='ri-check-line' />*/}
              {/*  </CustomAvatar>*/}
              {/*  <div>*/}
              {/*    <Typography variant='h5'>1.23k</Typography>*/}
              {/*    <Typography>Task Done</Typography>*/}
              {/*  </div>*/}
              {/*</div>*/}
              {/*<div className='flex items-center gap-4'>*/}
              {/*  <CustomAvatar variant='rounded' color='primary' skin='light'>*/}
              {/*    <i className='ri-star-smile-line' />*/}
              {/*  </CustomAvatar>*/}
              {/*  <div>*/}
              {/*    <Typography variant='h5'>568</Typography>*/}
              {/*    <Typography>Project Done</Typography>*/}
              {/*  </div>*/}
              {/*</div>*/}
            </div>
          </div>
          <div>
            <Typography variant='h5'>Chi tiết</Typography>
            <Divider className='mlb-4' />
            <div className='flex flex-col gap-2'>
              <div className='flex items-center flex-wrap gap-x-1.5'>
                <Typography className='font-medium' color='text.primary'>
                  Tên người dùng:
                </Typography>
                <Typography>{userData.userName}</Typography>
              </div>
              <div className='flex items-center flex-wrap gap-x-1.5'>
                <Typography className='font-medium' color='text.primary'>
                  Email:
                </Typography>
                <Typography>{userData.billingEmail}</Typography>
              </div>
              <div className='flex items-center flex-wrap gap-x-1.5'>
                <Typography className='font-medium' color='text.primary'>
                  Trạng thái
                </Typography>
                <Typography color='text.primary'>{userData.status}</Typography>
              </div>
              <div className='flex items-center flex-wrap gap-x-1.5'>
                <Typography className='font-medium' color='text.primary'>
                  Loại tài khoản:
                </Typography>
                <Typography color='text.primary'>{userData.role}</Typography>
              </div>
              {/*<div className='flex items-center flex-wrap gap-x-1.5'>*/}
              {/*  <Typography className='font-medium' color='text.primary'>*/}
              {/*    Tax ID:*/}
              {/*  </Typography>*/}
              {/*  <Typography color='text.primary'>{userData.taxId}</Typography>*/}
              {/*</div>*/}
              <div className='flex items-center flex-wrap gap-x-1.5'>
                <Typography className='font-medium' color='text.primary'>
                  Số điện thoại:
                </Typography>
                <Typography color='text.primary'>{userData.contact}</Typography>
              </div>
              <div className='flex items-center flex-wrap gap-x-1.5'>
                <Typography className='font-medium' color='text.primary'>
                  Cấp đai:
                </Typography>
                <Typography color='text.primary'>{userData.language}</Typography>
              </div>
              <div className='flex items-center flex-wrap gap-x-1.5'>
                <Typography className='font-medium' color='text.primary'>
                  Chứng chỉ:
                </Typography>
                <Typography color='text.primary'>{userData.country}</Typography>
              </div>
            </div>
          </div>
          <div className='flex gap-4 justify-center'>
            <OpenDialogOnElementClick
              element={Button}
              elementProps={buttonProps('Chỉnh sửa', 'primary', 'contained')}
              dialog={EditUserInfo}
              dialogProps={{ data: userData }}
            />
            <OpenDialogOnElementClick
              element={Button}
              elementProps={buttonProps('Hủy kích hoạt', 'error', 'outlined')}
              dialog={ConfirmationDialog}
              dialogProps={{ type: 'suspend-account' }}
            />
          </div>
        </CardContent>
      </Card>
    </>
  )
}

export default UserDetails
