/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  distDir: 'out',
  images: {
    unoptimized: true
  },
  // Konfigurasi untuk API calls ke Express backend
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://optipredict.my.id/api/:path*',
      },
    ]
  }
}

module.exports = nextConfig
