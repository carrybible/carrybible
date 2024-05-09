/** @type {import('next').NextConfig} */
const path = require('path')

module.exports = {
  i18n: {
    locales: ['en', 'vi'],
    defaultLocale: 'en',
    // https://github.com/i18next/next-i18next/issues/1552#issuecomment-981156476
    localePath: path.resolve('./public/locales'),
  },
  reloadOnPrerender: true,
}
