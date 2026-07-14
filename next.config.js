/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['exceljs', 'pdf-lib'],
}

module.exports = nextConfig
