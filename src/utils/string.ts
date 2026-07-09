export const ensurePrefix = (str: string, prefix: string) => (str.startsWith(prefix) ? str : `${prefix}${str}`)
export const withoutSuffix = (str: string, suffix: string) =>
  str.endsWith(suffix) ? str.slice(0, -suffix.length) : str
export const withoutPrefix = (str: string, prefix: string) => (str.startsWith(prefix) ? str.slice(prefix.length) : str)

export const maskPersonalId = (id?: string | null | undefined) =>
  id ? id.replace(/^(.{4}).+(.{3})$/, (_, start, end) => `${start}*****${end}`) : '-'
