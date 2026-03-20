// ----------------------
// Type Definitions
// ----------------------
export type GoogleWindow = Window & {
  google?: {
    accounts?: {
      oauth2?: {
        initCodeClient?: (config: any) => any
      }
    }
  }
}

// ----------------------
// Constants
// ----------------------
const GOOGLE_SDK_URL = 'https://accounts.google.com/gsi/client'
const SCOPES = 'openid email profile'

// ----------------------
// Helper: load Google SDK nếu chưa có
// ----------------------
const ensureGoogleSDKLoaded = async (): Promise<void> => {
  if (typeof window === 'undefined') throw new Error('Not in browser')

  if ((window as any).google?.accounts?.oauth2) return

  return new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')

    script.src = GOOGLE_SDK_URL
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Không thể tải Google SDK'))
    document.head.appendChild(script)
  })
}

// ----------------------
// Helper: ép kiểu Google SDK an toàn
// ----------------------
function getGoogleOAuth2(): NonNullable<
  NonNullable<
    NonNullable<GoogleWindow['google']>['accounts']
  >['oauth2']
> {
  const google = (window as GoogleWindow).google

  if (!google?.accounts?.oauth2) {
    throw new Error('Google OAuth2 client chưa sẵn sàng')
  }

  return google.accounts.oauth2
}

// ----------------------
// Main Function
// ----------------------
export const getGoogleAuthCode = async (): Promise<string> => {
  await ensureGoogleSDKLoaded()

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

  if (!clientId) throw new Error('Thiếu GOOGLE_CLIENT_ID')

  const oauth2 = getGoogleOAuth2()

  return new Promise<string>((resolve, reject) => {
    const codeClient = oauth2.initCodeClient?.({
      client_id: clientId,
      scope: SCOPES,
      ux_mode: 'popup',
      callback: (response: any) => {
        if (response.error) return reject(new Error(`Google auth error: ${response.error}`))
        if (!response.code) return reject(new Error('Không nhận được authorization_code'))
        resolve(response.code)
      }
    })

    if (!codeClient) {
      reject(new Error('Không thể khởi tạo codeClient'))

      return
    }

    codeClient.requestCode()
  })
}

export const getGoogleIdToken = getGoogleAuthCode;

export const isGoogleClientAvailable = () => {
  return typeof window !== 'undefined' && !!(window as any).google?.accounts?.oauth2
}
