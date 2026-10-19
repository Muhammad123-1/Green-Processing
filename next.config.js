const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['exceljs', 'pdf-lib'],
  turbopack: {
    root: path.resolve(__dirname),
  },
}

module.exports = nextConfig
