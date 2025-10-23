// ----------------------
// Type Definitions
// ----------------------

export type GoogleCredentialResponse = {
  credential?: string
}

// FedCM-compatible Google Accounts ID type
export type GoogleAccountsId = {
  initialize: (config: {
    client_id: string
    callback: (response: GoogleCredentialResponse) => void
    use_fedcm_for_prompt?: boolean
  }) => void
  prompt: () => void
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
  if (typeof window === "undefined") return undefined

  return (window as GoogleWindow).google?.accounts?.id
}

const getGoogleClientId = () => process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

export const isGoogleClientAvailable = () =>
  Boolean(getGoogleClient() && getGoogleClientId())

// ----------------------
// Main Function
// ----------------------

export const getGoogleIdToken = async (): Promise<string> => {
  const client = getGoogleClient()

  if (!client) throw new Error("Google Identity Services SDK is not loaded.")

  const clientId = getGoogleClientId()

  if (!clientId) throw new Error("Google Client ID is not configured.")

  return new Promise<string>((resolve, reject) => {
    let settled = false

    const timeoutId = setTimeout(() => {
      if (!settled) {
        settled = true
        reject(new Error("Google sign-in was cancelled or timed out."))
      }
    }, 30000)

    client.initialize({
      client_id: clientId,
      callback: response => {
        if (settled) return
        clearTimeout(timeoutId)
        if (response?.credential) {

          settled = true
          resolve(response.credential) // ✅ ID token JWT
        } else {
          settled = true
          reject(new Error("Google login did not provide an ID token."))
        }
      },
      use_fedcm_for_prompt: true
    })

    // Hiển thị popup chọn tài khoản
    client.prompt()
  })
}
