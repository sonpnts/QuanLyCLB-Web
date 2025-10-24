// Util Imports
import { ensurePrefix } from '@/utils/string'

// Get the localized url (simplified for Vietnamese only)
export const getLocalizedUrl = (url: string): string => {
  if (!url) throw new Error("URL can't be empty")

  return ensurePrefix(url, '/')
}
