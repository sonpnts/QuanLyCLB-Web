// ----------------------
// Type Definitions
// ----------------------

export type GoogleCredentialResponse = {
  credential?: string
}

// FedCM-compatible notification type (simplified)
export type GooglePromptMomentNotification = {


  // FedCM doesn't provide these detailed status methods
  // The prompt will either succeed (callback called) or fail (no callback)
}

// FedCM-compatible Google Accounts ID type
export type GoogleAccountsId = {
  initialize: (config: {
    client_id: string
    callback: (response: GoogleCredentialResponse) => void
    use_fedcm_for_prompt?: boolean
  }) => void
  prompt: () => void // FedCM doesn't use callback parameter
}

type GoogleWindow = Window & {
  google?: {
    accounts?: {
      id?: GoogleAccountsId
    }
  }
}

// ----------------------
// Helpers
// ----------------------

const getGoogleClient = (): GoogleAccountsId | undefined => {
  if (typeof window === 'undefined') return undefined

  return (window as GoogleWindow).google?.accounts?.id
}

const getGoogleClientId = () => process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

export const isGoogleClientAvailable = () => Boolean(getGoogleClient() && getGoogleClientId())

// ----------------------
// Main Function
// ----------------------

export const getGoogleIdToken = async (): Promise<string> => {
  const client = getGoogleClient()

  if (!client) throw new Error('Google Identity Services SDK is not loaded.')

  const clientId = getGoogleClientId()

  if (!clientId) throw new Error('Google Client ID is not configured.')

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

    // ✅ Initialize One Tap with FedCM
    client.initialize({
      client_id: clientId,
      callback: response => {
        if (response?.credential) {
          resolveOnce(response.credential) // đây là ID token JWT
        } else {
          rejectOnce(new Error('Google login did not provide an ID token.'))
        }
      },
      use_fedcm_for_prompt: true // 👈 mới nhất Google yêu cầu
    })

    // Show One Tap / FedCM prompt
    // With FedCM, the prompt either succeeds (callback called) or fails (no callback)
    // We don't need to check detailed status methods as they're deprecated
    client.prompt()

    // Add timeout to handle cases where user doesn't interact with the prompt
    // This replaces the deprecated status checking methods
    const timeoutId = setTimeout(() => {
      if (!settled) {
        rejectOnce(new Error('Google sign-in was cancelled or timed out.'))
      }
    }, 30000) // 30 second timeout

    // Override the resolve and reject functions to clear timeout
    const originalResolveOnce = resolveOnce
    const originalRejectOnce = rejectOnce

    // Create new functions that clear timeout
    const resolveWithTimeout = (token: string) => {
      clearTimeout(timeoutId)
      originalResolveOnce(token)
    }

    const rejectWithTimeout = (error: Error) => {
      clearTimeout(timeoutId)
      originalRejectOnce(error)
    }

    // Update the callback to use the timeout-aware functions
    client.initialize({
      client_id: clientId,
      callback: response => {
        if (response?.credential) {
          resolveWithTimeout(response.credential) // đây là ID token JWT
        } else {
          rejectWithTimeout(new Error('Google login did not provide an ID token.'))
        }
      },
      use_fedcm_for_prompt: true // 👈 mới nhất Google yêu cầu
    })
  })
}
