export const i18n = {
  defaultLocale: 'vi',
  locales: ['en', 'fr', 'ar', 'vi'],
  langDirection: {
    en: 'ltr',
    fr: 'ltr',
    ar: 'rtl',
    vi : 'ltr'
  }
} as const

export type Locale = (typeof i18n)['locales'][number]
