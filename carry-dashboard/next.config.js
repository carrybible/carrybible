const { i18n } = require('./next-i18next.config')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  swcMinify: true,
  i18n,
  images: {
    domains: ['storage.googleapis.com', 'images.unsplash.com'],
  },
  async redirects() {
    return [
      {
        source: '/tithing',
        destination: '/giving?tab=tithing',
        permanent: true,
      },
      {
        source: '/campaigns',
        destination: '/giving?tab=campaigns',
        permanent: true,
      },
      {
        source: '/home',
        destination: '/',
        statusCode: 301,
      },
    ]
  },
  async rewrites() {
    return [
      {
        source: '/',
        destination: '/home',
      },
      {
        source: '/index',
        destination: '/_index',
      },
      {
        source: '/help-center',
        destination: '/home/help-center',
      },
    ]
  },
}

module.exports = nextConfig
