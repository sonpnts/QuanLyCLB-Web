type GoogleCredentialResponse = {
  credential?: string
}

type GooglePromptMomentNotification = {
  isNotDisplayed?: () => boolean
  isSkippedMoment?: () => boolean
  isDismissedMoment?: () => boolean
  getNotDisplayedReason?: () => string
  getSkippedReason?: () => string
  getDismissedReason?: () => string
}

type GoogleAccountsId = {
  initialize: (config: { client_id: string; callback: (response: GoogleCredentialResponse) => void }) => void
  prompt: (callback?: (notification: GooglePromptMomentNotification) => void) => void
}

type GoogleWindow = Window & {
  google?: {
    accounts?: {
      id?: GoogleAccountsId
    }
  }
}

const getGoogleClient = (): GoogleAccountsId | undefined => {
  if (typeof window === 'undefined') {
    return undefined
  }

  return (window as GoogleWindow).google?.accounts?.id
}

const getGoogleClientId = () => process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

export const getGoogleIdToken = async (): Promise<string> => {
  const client = getGoogleClient()

  if (!client) {
    throw new Error('Google Identity Services SDK is not loaded.')
  }

  const clientId = getGoogleClientId()

  if (!clientId) {
    throw new Error('Google Client ID is not configured.')
  }

  return new Promise<string>((resolve, reject) => {
    let settled = false

    const resolveOnce = (token: string) => {
      if (settled) return
      settled = true
      resolve(token)
    }

    const rejectOnce = (error: Error) => {
      if (settled) return
      settled = true
      reject(error)
    }

    client.initialize({
      client_id: clientId,
      callback: response => {
        if (response?.credential) {
          resolveOnce(response.credential)
        } else {
          rejectOnce(new Error('Google login did not provide an ID token.'))
        }
      }
    })

    client.prompt(notification => {
      const notDisplayed = notification?.isNotDisplayed?.()
      const skipped = notification?.isSkippedMoment?.()
      const dismissed = notification?.isDismissedMoment?.()

      if ((notDisplayed || skipped || dismissed) && !settled) {
        const reason =
          notification?.getNotDisplayedReason?.() ||
          notification?.getSkippedReason?.() ||
          notification?.getDismissedReason?.() ||
          'Google sign-in was cancelled.'

        rejectOnce(new Error(reason))
      }
    })
  })
}

export const isGoogleClientAvailable = () => Boolean(getGoogleClient() && getGoogleClientId())

