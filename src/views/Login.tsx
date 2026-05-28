'use client'

// React Imports
import { useState, useEffect } from 'react'

// Next Imports
// import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import Script from 'next/script'

// MUI Imports
import Typography from '@mui/material/Typography'

// import TextField from '@mui/material/TextField'
// import IconButton from '@mui/material/IconButton'
// import InputAdornment from '@mui/material/InputAdornment'
// import Checkbox from '@mui/material/Checkbox'
import Button from '@mui/material/Button'

// import FormControlLabel from '@mui/material/FormControlLabel'
// import Divider from '@mui/material/Divider'
import Alert from '@mui/material/Alert'

// Third-party Imports
// import { useForm } from 'react-hook-form'
// import { valibotResolver } from '@hookform/resolvers/valibot'
// import { object, minLength, string, email, pipe, nonEmpty } from 'valibot'
import classnames from 'classnames'

// import type { SubmitHandler } from 'react-hook-form'
// import type { InferInput } from 'valibot'

// Type Imports
import type { Mode } from '@core/types'

// Component Imports
import Logo from '@components/layout/shared/Logo'
import Illustrations from '@components/Illustrations'
import GoogleResourceBlockedDialog from '@/components/auth/GoogleResourceBlockedDialog'

// Config Imports
import themeConfig from '@configs/themeConfig'

// Hook Imports
import { useImageVariant } from '@core/hooks/useImageVariant'
import { useSettings } from '@core/hooks/useSettings'

// Util Imports
import { useAuth } from '@/contexts/authContext'
import { getGoogleAuthCode } from '@/utils/googleIdentity'

type ErrorType = {
  message: string[]
}

// type FormData = InferInput<typeof schema>
//
// const schema = object({
//   email: pipe(string(), minLength(1, 'Trường này là bắt buộc'), email('Vui lòng nhập địa chỉ email hợp lệ')),
//   password: pipe(
//     string(),
//     nonEmpty('Trường này là bắt buộc'),
//     minLength(5, 'Mật khẩu phải có ít nhất 5 ký tự')
//   )
// })

const Login = ({ mode }: { mode: Mode }) => {
  // States
  // const [isPasswordShown, setIsPasswordShown] = useState(false)
  const [errorState, setErrorState] = useState<ErrorType | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [googleResourceDialogOpen, setGoogleResourceDialogOpen] = useState(false)
  const [googleResourceIssueReported, setGoogleResourceIssueReported] = useState(false)

  const [isGoogleReady, setIsGoogleReady] = useState(() => {
    // Check if Google script is already loaded
    return typeof window !== 'undefined' && typeof (window as any).google !== 'undefined'
  })

  // Vars
  const darkImg = '/images/pages/auth-v2-mask-dark.png'
  const lightImg = '/images/pages/auth-v2-mask-light.png'
  const darkIllustration = '/images/illustrations/auth/v2-login-dark.png'
  const lightIllustration = '/images/illustrations/auth/v2-login-light.png'
  const borderedDarkIllustration = '/images/illustrations/auth/v2-login-dark-border.png'
  const borderedLightIllustration = '/images/illustrations/auth/v2-login-light-border.png'

  // Hooks
  const router = useRouter()
  const searchParams = useSearchParams()
  const { settings } = useSettings()
  const { login, loginWithGoogle } = useAuth()

  // const {
  //   // control,
  //   // handleSubmit,
  //   formState: {  }
  // } = useForm<FormData>({
  //   resolver: valibotResolver(schema),
  //   defaultValues: {
  //     email: 'admin@materio.com',
  //     password: 'admin'
  //   }
  // })

  const authBackground = useImageVariant(mode, lightImg, darkImg)

  const characterIllustration = useImageVariant(
    mode,
    lightIllustration,
    darkIllustration,
    borderedLightIllustration,
    borderedDarkIllustration
  )

  // Check if Google script is already loaded on mount
  useEffect(() => {
    const checkGoogleReady = () => {
      if (typeof window !== 'undefined' && typeof (window as any).google !== 'undefined') {
        setIsGoogleReady(true)

        return true
      }

      return false
    }

    // Check immediately
    if (checkGoogleReady()) {
      return
    }

    // If not ready, check periodically for up to 5 seconds
    const interval = setInterval(() => {
      if (checkGoogleReady()) {
        clearInterval(interval)
      }
    }, 100)

    const timeout = setTimeout(() => {
      clearInterval(interval)
    }, 5000)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [])

  useEffect(() => {
    if (isGoogleReady || googleResourceIssueReported) {
      return
    }

    const timeout = window.setTimeout(() => {
      if (typeof window !== 'undefined' && typeof (window as any).google === 'undefined') {
        setGoogleResourceIssueReported(true)
        setGoogleResourceDialogOpen(true)
      }
    }, 5000)

    return () => window.clearTimeout(timeout)
  }, [googleResourceIssueReported, isGoogleReady])

  // const handleClickShowPassword = () => setIsPasswordShown(show => !show)

  const handleLoginResult = (result: Awaited<ReturnType<typeof login>>) => {
    if (result.success) {
      const redirectURL = searchParams.get('redirectTo') ?? '/check-in'

      router.replace(redirectURL)

      return
    }

    const messages = Array.isArray(result.message) ? result.message : [result.message]
    const sanitizedMessages = (messages.filter(Boolean) as string[]).filter(message => message.trim().length > 0)

    if (sanitizedMessages.length) {
      setErrorState({ message: sanitizedMessages })
    } else {
      setErrorState({ message: ['Đăng nhập thất bại.'] })
    }
  }

  // const onSubmit: SubmitHandler<FormData> = async (data: FormData) => {
  //   setIsSubmitting(true)
  //   setErrorState(null)
  //
  //   const result = await login({ username: data.email, password: data.password })
  //
  //   setIsSubmitting(false)
  //
  //   handleLoginResult(result)
  // }

  const handleGoogleLogin = async () => {
    if (!isGoogleReady) {
      setGoogleResourceDialogOpen(true)
      setGoogleResourceIssueReported(true)

      return
    }

    setIsSubmitting(true)
    setErrorState(null)

    try {
      const authorizationCode = await getGoogleAuthCode()
      const result = await loginWithGoogle(authorizationCode)

      handleLoginResult(result)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Đăng nhập Google thất bại.'

      setErrorState({ message: [message] })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleScriptLoad = () => {
    setIsGoogleReady(true)
  }

  const handleGoogleScriptError = () => {
    setGoogleResourceIssueReported(true)
    setGoogleResourceDialogOpen(true)
    setErrorState(
      prev =>
        prev ?? {
          message: ['Không thể tải Google login. Vui lòng làm mới trang.']
        }
    )
  }

  return (
    <div className='flex bs-full justify-center'>
      <Script
        src='https://accounts.google.com/gsi/client'
        strategy='afterInteractive'
        onLoad={handleGoogleScriptLoad}
        onError={handleGoogleScriptError}
      />
      <GoogleResourceBlockedDialog
        open={googleResourceDialogOpen}
        onClose={() => setGoogleResourceDialogOpen(false)}
        onReload={() => window.location.reload()}
      />
      <div
        className={classnames(
          'flex bs-full items-center justify-center flex-1 min-bs-[100dvh] relative p-6 max-md:hidden',
          {
            'border-ie': settings.skin === 'bordered'
          }
        )}
      >
        <div className='plb-12 pis-12'>
          <img
            src={characterIllustration}
            alt='character-illustration'
            className='max-bs-[500px] max-is-full bs-auto'
          />
        </div>
        <Illustrations
          image1={{ src: '/images/illustrations/objects/tree-2.png' }}
          image2={null}
          maskImg={{ src: authBackground }}
        />
      </div>
      <div className='flex justify-center items-center bs-full bg-backgroundPaper !min-is-full p-6 md:!min-is-[unset] md:p-12 md:is-[480px]'>
        <div className='absolute block-start-5 sm:block-start-[33px] inline-start-6 sm:inline-start-[38px]'>
          <Logo />
        </div>
        <div className='flex flex-col gap-5 is-full sm:is-auto md:is-full sm:max-is-[400px] md:max-is-[unset]'>
          <div>
            <Typography variant='h4'>{`Chào mừng đến với ${themeConfig.templateName}!👋🏻`}</Typography>
            <Typography>Vui lòng đăng nhập vào tài khoản của bạn để bắt đầu</Typography>
          </div>
          {/*<Alert icon={false} className='bg-primaryLight'>*/}
          {/*  <Typography variant='body2' color='primary.main'>*/}
          {/*    Email: <span className='font-medium'>admin@materio.com</span> / Pass:{' '}*/}
          {/*    <span className='font-medium'>admin</span>*/}
          {/*  </Typography>*/}
          {/*</Alert>*/}
          {errorState && (
            <Alert severity='error' className='mb-4'>
              {errorState.message.map((msg, index) => (
                <div key={index}>{msg}</div>
              ))}
            </Alert>
          )}

          {/*<form*/}
          {/*  hidden*/}
          {/*  noValidate*/}
          {/*  action={() => {}}*/}
          {/*  autoComplete='off'*/}
          {/*  onSubmit={handleSubmit(onSubmit)}*/}
          {/*  className='flex flex-col gap-5'*/}
          {/*>*/}
          {/*  <Controller*/}
          {/*    name='email'*/}
          {/*    control={control}*/}
          {/*    rules={{ required: true }}*/}
          {/*    render={({ field }) => (*/}
          {/*      <TextField*/}
          {/*        {...field}*/}
          {/*        fullWidth*/}
          {/*        autoFocus*/}
          {/*        type='email'*/}
          {/*        label='Email'*/}
          {/*        onChange={e => {*/}
          {/*          field.onChange(e.target.value)*/}
          {/*          errorState !== null && setErrorState(null)*/}
          {/*        }}*/}
          {/*        {...((errors.email ) && {*/}
          {/*          error: true,*/}
          {/*          helperText: errors?.email?.message || errorState?.message[0]*/}
          {/*        })}*/}
          {/*      />*/}
          {/*    )}*/}
          {/*  />*/}
          {/*  <Controller*/}
          {/*    name='password'*/}
          {/*    control={control}*/}
          {/*    rules={{ required: true }}*/}
          {/*    render={({ field }) => (*/}
          {/*      <TextField*/}
          {/*        {...field}*/}
          {/*        fullWidth*/}
          {/*        label='Mật khẩu'*/}
          {/*        id='login-password'*/}
          {/*        type={isPasswordShown ? 'text' : 'password'}*/}
          {/*        onChange={e => {*/}
          {/*          field.onChange(e.target.value)*/}
          {/*          errorState !== null && setErrorState(null)*/}
          {/*        }}*/}
          {/*        slotProps={{*/}
          {/*          input: {*/}
          {/*            endAdornment: (*/}
          {/*              <InputAdornment position='end'>*/}
          {/*                <IconButton*/}
          {/*                  size='small'*/}
          {/*                  edge='end'*/}
          {/*                  onClick={handleClickShowPassword}*/}
          {/*                  onMouseDown={e => e.preventDefault()}*/}
          {/*                  aria-label='toggle password visibility'*/}
          {/*                >*/}
          {/*                  <i className={isPasswordShown ? 'ri-eye-off-line' : 'ri-eye-line'} />*/}
          {/*                </IconButton>*/}
          {/*              </InputAdornment>*/}
          {/*            )*/}
          {/*          }*/}
          {/*        }}*/}
          {/*        {...(errors.password && { error: true, helperText: errors.password.message })}*/}
          {/*      />*/}
          {/*    )}*/}
          {/*  />*/}
          {/*  <div className='flex justify-between items-center flex-wrap gap-x-3 gap-y-1'>*/}
          {/*    <FormControlLabel control={<Checkbox defaultChecked />} label='Ghi nhớ đăng nhập' />*/}
          {/*    <Typography className='text-end' color='primary.main' component={Link} href='/forgot-password'>*/}
          {/*      Quên mật khẩu?*/}
          {/*    </Typography>*/}
          {/*  </div>*/}
          {/*  <Button fullWidth variant='contained' type='submit' disabled={isSubmitting}>*/}
          {/*    Đăng nhập*/}
          {/*  </Button>*/}
          {/*  <div className='flex justify-center items-center flex-wrap gap-2'>*/}
          {/*    <Typography>Mới sử dụng nền tảng?</Typography>*/}
          {/*    <Typography component={Link} href='/register' color='primary.main'>*/}
          {/*      Tạo tài khoản*/}
          {/*    </Typography>*/}
          {/*  </div>*/}
          {/*</form>*/}
          {/*<Divider className='gap-3'>hoặc</Divider>*/}
          <Button
            color='secondary'
            className='self-center text-textPrimary'
            startIcon={<img src='/images/logos/google.png' alt='Google' width={22} />}
            sx={{ '& .MuiButton-startIcon': { marginInlineEnd: 3 } }}
            disabled={isSubmitting || !isGoogleReady}
            onClick={handleGoogleLogin}
          >
            Đăng nhập với Google
          </Button>
        </div>
      </div>
    </div>
  )
}

export default Login
