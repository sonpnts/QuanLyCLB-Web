import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  basePath: process.env.BASEPATH,
  redirects: async () => {
    return [
      {
        source: '/',
        destination: '/vi/dashboards/home',
        permanent: true,
        locale: false
      },
      {
        source: '/:lang(vi|en|fr|ar)',
        destination: '/:lang/dashboards/home',
        permanent: true,
        locale: false
      },
      {
        source: '/((?!(?:en|fr|ar|vi|front-pages|favicon.ico)\\b)):path',
        destination: '/vi/:path',
        permanent: true,
        locale: false
      }
    ]
  }
}

export default nextConfig
